#!/usr/bin/env node
/**
 * StepFlow deck — Slidev MCP smoke test (`npm run test:mcp`).
 *
 * Verifies the deck's built-in Slidev MCP endpoint end to end against a
 * disposable dev server on a free port:
 *
 *   1. the MCP tools list is non-empty;
 *   2. `slidev-insert-slide` lands a scratch slide in the deck markdown;
 *   3. the dev server hot-reloads (Vite HMR traffic observed without restart);
 *   4. `slidev-remove-slide` returns the deck byte-identical to the committed state.
 *
 * Wire format verified against Slidev 52.19.1: `/__mcp` is a stateless
 * Streamable HTTP endpoint (each POST is independent — no session header) and
 * responses are SSE-framed JSON-RPC. Exit code 0 = pass. Not wired into CI
 * (lint + test + build only); run it locally: `npm run test:mcp`.
 */

import { spawn } from 'node:child_process'
import { readFile } from 'node:fs/promises'
import { createServer } from 'node:net'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import WebSocket from 'ws'

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const SLIDES = path.join(ROOT, 'decks', 'stepflow-demo', 'slides.md')
const MARKER = 'SCRATCH SMOKE TEST'
const READY_TIMEOUT_MS = 120_000
const HMR_TIMEOUT_MS = 20_000
const REQUEST_TIMEOUT_MS = 15_000

const sleep = ms => new Promise(resolve => setTimeout(resolve, ms))

/** Claim a free loopback port for the disposable dev server. */
function freePort() {
  return new Promise((resolve, reject) => {
    const srv = createServer()
    srv.unref()
    srv.on('error', reject)
    srv.listen(0, '127.0.0.1', () => {
      const { port } = srv.address()
      srv.close(() => resolve(port))
    })
  })
}

/**
 * Minimal MCP client for the stateless Streamable HTTP endpoint: one JSON-RPC
 * request per POST, SSE-framed response parsed back out.
 */
function makeMcpClient(base) {
  async function call(method, params, id = 1) {
    const res = await fetch(`${base}/__mcp`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json, text/event-stream',
      },
      body: JSON.stringify({ jsonrpc: '2.0', id, method, params }),
      signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
    })
    if (!res.ok) {
      throw new Error(`HTTP ${res.status} for ${method}: ${(await res.text()).slice(0, 300)}`)
    }
    const text = await res.text()
    const dataLine = text.split('\n').find(line => line.startsWith('data:'))
    if (!dataLine) throw new Error(`no SSE data frame for ${method}: ${text.slice(0, 300)}`)
    const msg = JSON.parse(dataLine.slice(5).trim())
    if (msg.error) throw new Error(`MCP error for ${method}: ${msg.error.message} (code ${msg.error.code})`)
    return msg.result
  }

  // Slidev tool results wrap their payload as JSON text in a single content block.
  function toolData(result) {
    const text = result?.content?.find(block => block.type === 'text')?.text ?? ''
    try {
      return JSON.parse(text)
    } catch {
      return text
    }
  }

  return {
    async listTools() {
      return (await call('tools/list', {})).tools ?? []
    },
    async callTool(name, args) {
      return toolData(await call('tools/call', { name, arguments: args }, 2))
    },
  }
}

/**
 * HMR watcher over the dev server's Vite websocket. When deck markdown
 * changes, Slidev 52.19.1 broadcasts a custom frame — verified live:
 *   { type: 'custom', event: 'file-changed', data: { file } }
 * Generic Vite `update` / `full-reload` frames are accepted too. Pings and
 * the initial handshake are filtered out.
 */
function watchHmr(base) {
  const ws = new WebSocket(`${base.replace(/^http/, 'ws')}/`, 'vite-hmr')
  const updates = []
  ws.on('message', raw => {
    let msg
    try {
      msg = JSON.parse(raw.toString())
    } catch {
      return
    }
    if (msg.type === 'ping') {
      try {
        ws.send(JSON.stringify({ type: 'pong' }))
      } catch {
        /* socket may already be closing */
      }
      return
    }
    if (msg.type === 'custom' && msg.event === 'file-changed') {
      updates.push({ at: Date.now(), type: 'file-changed', paths: msg.data?.file ?? '' })
    } else if (msg.type === 'update' || msg.type === 'full-reload') {
      const paths = msg.path ?? (msg.updates ?? []).map(u => u.path).join(',')
      updates.push({ at: Date.now(), type: msg.type, paths })
    }
  })
  return {
    updates,
    connected: new Promise((resolve, reject) => {
      ws.on('open', resolve)
      ws.on('error', reject)
    }),
  }
}

function startDevServer(port, logLines) {
  const bin = path.join(ROOT, 'node_modules', '.bin', 'slidev')
  const child = spawn(bin, ['decks/stepflow-demo/slides.md', '--port', String(port)], {
    cwd: ROOT,
    stdio: ['ignore', 'pipe', 'pipe'],
  })
  const collect = src => src.on('data', chunk => logLines.push(chunk.toString()))
  collect(child.stdout)
  collect(child.stderr)
  return child
}

/** Terminate the disposable dev server; SIGTERM first, SIGKILL as the hammer. */
function killServer(child) {
  return new Promise(resolve => {
    if (child.exitCode !== null) return resolve()
    const hammer = setTimeout(() => {
      try {
        child.kill('SIGKILL')
      } catch {
        /* already gone */
      }
      resolve()
    }, 8_000)
    child.on('exit', () => {
      clearTimeout(hammer)
      resolve()
    })
    child.kill('SIGTERM')
  })
}

let failed = 0
function check(label, ok, extra = '') {
  console.log(`  [${ok ? 'ok' : 'FAIL'}] ${label}${extra ? ` — ${extra}` : ''}`)
  if (!ok) failed += 1
  return ok
}

async function main() {
  const logLines = []
  const port = await freePort()
  const child = startDevServer(port, logLines)

  try {
    // -- 1. server up, tool inventory non-empty -----------------------------
    // Vite binds `localhost` to either loopback family depending on runtime
    // DNS resolution (observed both 127.0.0.1 and [::1] in this sandbox), so
    // resolve the reachable base once and pin it for every later call.
    const candidates = [`http://127.0.0.1:${port}`, `http://[::1]:${port}`]
    const deadline = Date.now() + READY_TIMEOUT_MS
    let tools = null
    let base = null
    let readyErr = null
    while (Date.now() < deadline && tools === null) {
      if (child.exitCode !== null) break
      for (const candidate of candidates) {
        try {
          tools = await makeMcpClient(candidate).listTools()
          base = candidate
          break
        } catch (err) {
          readyErr = err
        }
      }
      if (tools === null) await sleep(700)
    }
    if (tools === null) {
      throw new Error(
        `dev server MCP not ready within ${READY_TIMEOUT_MS}ms: ${readyErr ?? `server exited (code ${child.exitCode})`}`
        + `\n--- dev server log tail ---\n${logLines.slice(-15).join('')}`,
      )
    }
    const client = makeMcpClient(base)
    console.log(`slidev dev server ready on ${base} (disposable)`)
    check('MCP tools list is non-empty', Array.isArray(tools) && tools.length > 0, `tools: ${tools.map(t => t.name).join(', ')}`)

    // -- 2. snapshot the committed deck state -------------------------------
    const committed = await readFile(SLIDES, 'utf8')
    const before = await client.callTool('slidev-get-info', {})
    const lastNo = before.totalSlides

    // -- 3. arm the HMR watcher before touching the deck --------------------
    const hmr = watchHmr(base, SLIDES)
    await hmr.connected

    // -- 4. add a scratch slide via MCP -------------------------------------
    // Arm the reload attribution window BEFORE the write: HMR frames can land
    // within ~100 ms of the file write, before the tool response returns.
    const armedAt = Date.now()
    await client.callTool('slidev-insert-slide', {
      after: lastNo,
      content: `${MARKER} — added by scripts/mcp-smoke.mjs, safe to remove`,
      frontmatter: { layout: 'center' },
    })
    const scratchNo = lastNo + 1
    const onDisk = await readFile(SLIDES, 'utf8')
    check('scratch slide lands in the deck markdown', onDisk.includes(MARKER), `inserted as slide ${scratchNo}`)

    // The dev server re-parses the markdown asynchronously after the write —
    // poll until its state reflects the inserted slide (or time out).
    const countDeadline = Date.now() + 10_000
    let after = await client.callTool('slidev-get-info', {})
    while (Date.now() < countDeadline && after.totalSlides !== scratchNo) {
      await sleep(400)
      after = await client.callTool('slidev-get-info', {})
    }
    check('deck slide count grew by one', after.totalSlides === scratchNo, `totalSlides ${lastNo} → ${after.totalSlides}`)

    // -- 5. hot reload observed (Vite HMR traffic, no server restart) -------
    const hmrDeadline = armedAt + HMR_TIMEOUT_MS
    while (Date.now() < hmrDeadline && !hmr.updates.some(u => u.at >= armedAt)) await sleep(300)
    const reloads = hmr.updates.filter(u => u.at >= armedAt && (!u.paths || u.paths === SLIDES))
    check('hot reload observed (dev server re-rendered without restart)', reloads.length > 0,
      reloads.map(r => `${r.type}${r.paths ? ` ${r.paths}` : ''}`).slice(0, 3).join(' | '))

    // -- 6. remove the scratch slide → committed state restored --------------
    await client.callTool('slidev-remove-slide', { no: scratchNo })
    const restored = await readFile(SLIDES, 'utf8')
    check('deck returned to its committed state', restored === committed, 'byte-identical slides.md after removal')
  } finally {
    await killServer(child)
  }
}

main()
  .then(() => {
    if (failed > 0) {
      console.error(`\nmcp-smoke: ${failed} check(s) FAILED`)
      process.exit(1)
    }
    console.log('\nmcp-smoke: all checks passed')
  })
  .catch(err => {
    console.error(`\nmcp-smoke: FAILED — ${err.message}`)
    process.exit(1)
  })
