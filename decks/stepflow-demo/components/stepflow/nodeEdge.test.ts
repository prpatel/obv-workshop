// @vitest-environment happy-dom
import { describe, expect, it } from 'vitest'
import { mount } from '@vue/test-utils'
import NodeEdge from '../NodeEdge.vue'
import {
  ambienceLayout,
  edgePoints,
  labelLines,
  nodeEdgeClickPlan,
  nodeEdgeLayout,
  polylinePath,
  terminalLogLayout,
  NODE_PLATE,
  NODE_RX,
  NODE_SIZE_FRAC,
  NODE_STROKE,
  STATUS_RED,
  STATUS_SQUARE,
  TERMINAL_LOG_AMBIENCE,
  TERMINAL_LOG_MEASURED,
  type FlowEdge,
  type FlowNode,
  type FlowStatus,
  type TerminalLogData,
} from './nodeEdge'
import { polylineLength } from './paths'

/**
 * Slidev registers the v-click directive globally at runtime; the render
 * tests stub it with the same dataset contract the real directive fulfills
 * (slidev's source: el.dataset.slidevClicksStart/End from the resolved range).
 * The stub writes data-click-start / data-click-end attributes so the cut-beat
 * sequencing is assertable end-to-end from the component bindings.
 */
const clickDirectiveStub = {
  mounted(el: Element, dir: { value: number | [number, number] }) {
    const [start, end] = Array.isArray(dir.value) ? [dir.value[0], dir.value[1]] : [dir.value, null]
    el.setAttribute('data-click-start', String(start))
    if (end !== null) el.setAttribute('data-click-end', String(end))
  },
}

function mountNodeEdge(props: { nodes: FlowNode[]; edges: FlowEdge[]; status?: FlowStatus[]; palette?: object; title?: string; titleAccent?: string; titleTextLength?: number; terminalLog?: TerminalLogData }) {
  return mount(NodeEdge, { props, global: { directives: { click: clickDirectiveStub } } })
}

/**
 * The seed mirrors the reworked demo slide exactly (the fidelity report
 * art_v4jVdTnp §2 primitive): six ~100px plate squares — five bordered with
 * 3-line tone-colored labels, one taller solid bright-red status square —
 * seven dim-red pop edges, plus a status overlay pair to keep that contract
 * covered. Node positions are the src-3 settle-frame measured fractions.
 */
const nodes: FlowNode[] = [
  { id: 'ingest', xFrac: 0.515, yFrac: 0.524, tone: 'accent', label: ['INGEST', 'EVENTS', '12K/S'] },
  { id: 'lake', xFrac: 0.756, yFrac: 0.524, tone: 'accent', label: ['LAKE', 'BRONZE', '4.1TB'] },
  { id: 'catalog', xFrac: 0.516, yFrac: 0.772, tone: 'alt', label: ['CATALOG', 'TABLES', '1204'] },
  { id: 'serve', xFrac: 0.756, yFrac: 0.772, tone: 'plain', label: ['SERVE', 'API', '84MS'] },
  { id: 'replay', xFrac: 0.636, yFrac: 0.896, tone: 'accent', label: ['REPLAY', 'CDC', 'V2.4'] },
  { id: 'lag', xFrac: 0.159, yFrac: 0.605, tone: 'status', label: ['SLOW', '5M'] },
]
const edges: FlowEdge[] = [
  { from: 'lake', to: 'serve', points: [[0.756, 0.524], [0.756, 0.772]] },
  { from: 'ingest', to: 'catalog', points: [[0.515, 0.524], [0.516, 0.772]] },
  { from: 'ingest', to: 'lake', points: [[0.515, 0.524], [0.515, 0.36], [0.756, 0.36], [0.756, 0.524]] },
  { from: 'catalog', to: 'serve', points: [[0.516, 0.772], [0.756, 0.772]] },
  { from: 'ingest', to: 'serve', points: [[0.515, 0.524], [0.756, 0.772]] },
  { from: 'catalog', to: 'replay', points: [[0.516, 0.772], [0.636, 0.896]] },
  { from: 'serve', to: 'replay', points: [[0.756, 0.772], [0.636, 0.896]] },
]
const status: FlowStatus[] = [
  { attach: 'lake', text: 'SLOW 5m', tone: 'alt', kind: 'block' },
  { attach: 'serve', text: 'REPLAY', tone: 'accent', kind: 'arrow' },
]
const terminalLog: TerminalLogData = { command: 'meshctl status --verbose', stat: 'nodes : 6 healthy · 2' }

/** All rendered <style> text — scoped styles are injected on mount. */
function renderedCss(): string {
  return Array.from(document.querySelectorAll('style'))
    .map((tag) => tag.textContent ?? '')
    .join('\n')
}

describe('polyline helpers — hand-computed constants', () => {
  it('polylinePath (re-exported from paths.ts) emits M + L commands in order', () => {
    expect(polylinePath([[100, 100], [300, 100], [300, 300]])).toBe('M 100 100 L 300 100 L 300 300')
  })

  it('polylineLength (paths.ts, SchematicRows consumer) resolves the 3-4-5 triangle exactly', () => {
    expect(polylineLength([[0, 0], [3, 4]])).toBe(5)
  })

  it('polylineLength sums each segment: an L-path is its two legs', () => {
    expect(polylineLength([[100, 100], [300, 100], [300, 300]])).toBe(400)
  })
})

describe('labelLines — one string per rendered line', () => {
  it('wraps a single string into one line', () => {
    expect(labelLines('INGEST')).toEqual(['INGEST'])
  })

  it('passes an array through unchanged', () => {
    expect(labelLines(['SLOW', '5M'])).toEqual(['SLOW', '5M'])
  })

  it('maps an omitted label to no lines', () => {
    expect(labelLines(undefined)).toEqual([])
  })
})

describe('edgePoints — fraction to px conversion', () => {
  it('scales canvas fractions to the 1920×1080 viewBox', () => {
    expect(edgePoints([[0.5, 0.25], [1, 1]])).toEqual([[960, 270], [1920, 1080]])
  })

  it('honors a custom viewBox', () => {
    expect(edgePoints([[0.5, 0.5], [0.25, 0.75]], { width: 1000, height: 200 })).toEqual([[500, 100], [250, 150]])
  })

  it('rejects fewer than two points with RangeError', () => {
    expect(() => edgePoints([[0.5, 0.5]])).toThrow(RangeError)
  })

  it('rejects out-of-range fractions — a typo like 12.0 throws, not explodes', () => {
    expect(() => edgePoints([[12.0, 0.5], [0.5, 0.5]])).toThrow(RangeError)
    expect(() => edgePoints([[0.5, -0.1], [0.5, 0.5]])).toThrow(RangeError)
  })
})

describe('nodeEdgeClickPlan — cut-beat sequencing (exact-trace sheet art_4A7yguGJ §2)', () => {
  it('plans the demo seed: nodes 1-6, edges 7-12 with the final two sharing a beat, cut at 13', () => {
    const plan = nodeEdgeClickPlan(6, 7)
    expect(plan.nodeClicks).toEqual([1, 2, 3, 4, 5, 6])
    expect(plan.edgeClicks).toEqual([7, 8, 9, 10, 11, 12, 12])
    expect(plan.statusClicks).toEqual([])
    expect(plan.cutClick).toBe(13)
    expect(plan.total).toBe(13)
  })

  it('keeps total === cutClick so ?clicks=13 is the settled end state', () => {
    expect(nodeEdgeClickPlan(6, 7).total).toBe(nodeEdgeClickPlan(6, 7).cutClick)
  })

  it('pops every network-scene element strictly before the cut', () => {
    const plan = nodeEdgeClickPlan(6, 7, 2)
    for (const click of [...plan.nodeClicks, ...plan.edgeClicks, ...plan.statusClicks]) {
      expect(click).toBeLessThan(plan.cutClick)
      expect(click).toBeGreaterThanOrEqual(1)
    }
  })

  it('scales to other seeds — the final two edges always share the last pre-cut beat', () => {
    expect(nodeEdgeClickPlan(2, 3)).toEqual({
      nodeClicks: [1, 2],
      edgeClicks: [3, 4, 4],
      statusClicks: [],
      cutClick: 5,
      total: 5,
    })
  })

  it('handles a single edge (no pair), edges after nodes, and status after edges', () => {
    expect(nodeEdgeClickPlan(2, 1)).toEqual({
      nodeClicks: [1, 2],
      edgeClicks: [3],
      statusClicks: [],
      cutClick: 4,
      total: 4,
    })
    expect(nodeEdgeClickPlan(1, 2, 1)).toEqual({
      nodeClicks: [1],
      edgeClicks: [2, 2],
      statusClicks: [3],
      cutClick: 4,
      total: 4,
    })
  })
})

describe('terminalLogLayout — measured end-state geometry (sheet §2.2)', () => {
  it('resolves the traffic lights at the measured centers, radius, and colors', () => {
    const tl = terminalLogLayout(terminalLog)
    expect(tl.lights.map(l => l.cx)).toEqual([43, 78, 112.5])
    expect(tl.lights[0].cy).toBe(369)
    expect(tl.lights[0].r).toBe(11)
    expect(tl.lights.map(l => l.color)).toEqual(['#f85c53', '#f9b82d', '#27c43d'])
  })

  it('splits the command line into the amber prompt and the pinned gray body extent', () => {
    const tl = terminalLogLayout(terminalLog)
    expect(tl.prompt.text).toBe('$')
    expect(tl.prompt.x).toBe(128)
    expect(tl.prompt.color).toBe('#f9b82d')
    // Body sits one mono advance after the prompt: `$ meshctl status --verbose`.
    const advance = TERMINAL_LOG_MEASURED.command.advance
    expect(tl.command.x).toBeCloseTo(128 + advance, 6)
    expect(tl.command.color).toBe('#838288')
    expect(tl.command.text).toBe(' meshctl status --verbose')
    // 25 glyphs (leading space + 24 chars) at the measured 18.38px advance → right edge ≈ 606.
    expect(tl.command.textLength).toBeCloseTo(advance * 25, 6)
    expect(tl.command.x + tl.command.textLength).toBeCloseTo(606, 4)
  })

  it('pins the condensed stat row to its measured 259px extent beside the teal cursor', () => {
    const tl = terminalLogLayout(terminalLog)
    expect(tl.stat.text).toBe('nodes : 6 healthy · 2')
    expect(tl.stat.x).toBe(128)
    expect(tl.stat.color).toBe('#5e5d62')
    expect(tl.stat.textLength).toBeCloseTo(259, 6) // 21 glyphs × 12.33px
    expect(tl.cursor).toEqual({ x: 77, y: 461, w: 28, h: 39, color: '#225d66' })
  })

  it('places the dim late center element at x873 y540 81×102', () => {
    const tl = terminalLogLayout(terminalLog)
    expect(tl.center).toEqual({ x: 873, y: 540, w: 81, h: 102, color: '#16202a' })
  })

  it('honors a custom viewBox', () => {
    const tl = terminalLogLayout(terminalLog, { width: 960, height: 540 })
    expect(tl.lights[0].cx).toBeCloseTo(21.5, 6)
    expect(tl.lights[0].cy).toBeCloseTo(184.5, 6)
    expect(tl.cursor.w).toBeCloseTo(14, 6)
    expect(tl.stat.textLength).toBeCloseTo(129.5, 6)
  })
})

describe('nodeEdgeLayout — resolved geometry', () => {
  it('converts node fractions to px centers with the measured square side', () => {
    const l = nodeEdgeLayout({ nodes: [nodes[0]], edges: [] })
    expect(l.nodes[0].cx).toBeCloseTo(0.515 * 1920, 6) // 988.8
    expect(l.nodes[0].cy).toBeCloseTo(0.524 * 1080, 6) // 565.92
    expect(l.nodes[0].w).toBeCloseTo(NODE_SIZE_FRAC * 1920, 6) // 96
    expect(l.nodes[0].h).toBeCloseTo(NODE_SIZE_FRAC * 1920, 6)
    expect(l.viewBox).toEqual({ width: 1920, height: 1080 })
  })

  it('resolves the status square at its own measured size, taller than wide', () => {
    const l = nodeEdgeLayout({ nodes: [nodes[5]], edges: [] })
    expect([l.nodes[0].w, l.nodes[0].h]).toEqual([STATUS_SQUARE.w, STATUS_SQUARE.h])
    expect(l.nodes[0].w).toBeLessThan(l.nodes[0].h)
  })

  it('resolves each edge path over its polyline fractions (no length — edges pop, not draw)', () => {
    const l = nodeEdgeLayout({ nodes, edges })
    expect(l.edges[0].d).toBe(`M ${0.756 * 1920} ${0.524 * 1080} L ${0.756 * 1920} ${0.772 * 1080}`)
    expect(l.edges).toHaveLength(7)
    expect('length' in l.edges[0]).toBe(false)
  })

  it('hangs the block left of its node square, vertically centered', () => {
    const l = nodeEdgeLayout({ nodes, edges, status: [status[0]] })
    const node = l.nodes.find((n) => n.id === 'lake')!
    const el = l.status[0]
    expect(el.cx).toBeCloseTo(node.cx - node.w / 2 - 20 - 50, 6)
    expect(el.cy).toBeCloseTo(node.cy, 6)
  })

  it('hangs the arrow below its node square', () => {
    const l = nodeEdgeLayout({ nodes, edges, status: [status[1]] })
    const node = l.nodes.find((n) => n.id === 'serve')!
    const el = l.status[0]
    expect(el.cx).toBeCloseTo(node.cx, 6)
    expect(el.cy).toBeCloseTo(node.cy + node.h / 2 + 20 + 50, 6)
  })

  it('validates references and ranges instead of rendering blank', () => {
    expect(() => nodeEdgeLayout({ nodes: [], edges: [] })).toThrow(RangeError)
    expect(() => nodeEdgeLayout({ nodes, edges: [{ ...edges[0], from: 'ghost' }] })).toThrow(RangeError)
    expect(() => nodeEdgeLayout({ nodes, edges: [{ ...edges[0], to: 'ghost' }] })).toThrow(RangeError)
    expect(() => nodeEdgeLayout({ nodes, edges, status: [{ ...status[0], attach: 'ghost' }] })).toThrow(RangeError)
    expect(() => nodeEdgeLayout({ nodes: [{ ...nodes[0], xFrac: 12 }], edges: [] })).toThrow(RangeError)
  })

  it('is deterministic for the same inputs', () => {
    expect(JSON.stringify(nodeEdgeLayout({ nodes, edges, status })))
      .toBe(JSON.stringify(nodeEdgeLayout({ nodes, edges, status })))
  })
})

describe('NodeEdge component', () => {
  it('renders one node group per node, one pop edge per edge, and one status group per element', () => {
    const wrapper = mountNodeEdge({ nodes, edges, status })

    expect(wrapper.find('svg.nodeedge').exists()).toBe(true)
    expect(wrapper.findAll('.sf-ne-node')).toHaveLength(6)
    expect(wrapper.findAll('path.sf-ne-edge')).toHaveLength(7)
    expect(wrapper.findAll('.sf-ne-status')).toHaveLength(2)
  })

  it('renders no dashoffset draw machinery (the corrected contract)', () => {
    const wrapper = mountNodeEdge({ nodes, edges })
    const css = renderedCss()

    expect(css).not.toContain('stroke-dashoffset')
    expect(css).not.toContain('stroke-dasharray')
    expect(css).not.toContain('--sf-drawn')
    expect(wrapper.findAll('path.sf-ne-edge-base')).toHaveLength(0)
  })

  it('exposes the measured canvas and an accessible name', () => {
    const wrapper = mountNodeEdge({ nodes, edges, status })
    const svg = wrapper.find('svg.nodeedge')

    expect(svg.attributes('viewBox')).toBe('0 0 1920 1080')
    expect(svg.attributes('role')).toBe('img')
    expect(svg.attributes('aria-label')).toBe('6-node network diagram')
  })

  it('renders the measured plate primitive: rounded #0b0a11 squares with 6px tone borders', () => {
    const wrapper = mountNodeEdge({ nodes, edges, status, palette: { accent: '#33a5cd', accentAlt: '#e6b434', track: '#5a1e1e' } })
    const plates = wrapper.findAll('rect.sf-ne-node-plate')

    expect(plates[0].attributes('fill')).toBe(NODE_PLATE)
    expect(plates[0].attributes('rx')).toBe(String(NODE_RX))
    expect(plates[0].attributes('stroke')).toBe('#33a5cd') // accent → palette accent
    expect(plates[0].attributes('stroke-width')).toBe(String(NODE_STROKE))
    expect(plates[2].attributes('stroke')).toBe('#e6b434') // alt → accentAlt
    expect(plates[3].attributes('stroke')).toBe('#f5f4f7') // plain → chrome white
  })

  it('renders the status node as the solid bright-red square, bright red reserved for status', () => {
    const wrapper = mountNodeEdge({ nodes, edges, palette: { accent: '#33a5cd', accentAlt: '#e6b434', track: '#5a1e1e' } })
    const plates = wrapper.findAll('rect.sf-ne-node-plate')

    expect(plates[5].attributes('fill')).toBe(STATUS_RED)
    expect(plates[5].attributes('stroke')).toBe(STATUS_RED)
    expect(plates[5].attributes('width')).toBe(String(STATUS_SQUARE.w))
    expect(plates[5].attributes('height')).toBe(String(STATUS_SQUARE.h))
  })

  it('renders 3-line tone-colored labels inside each square; the status label is dark', () => {
    const wrapper = mountNodeEdge({ nodes, edges, palette: { accent: '#33a5cd', accentAlt: '#e6b434', track: '#5a1e1e' } })
    const groups = wrapper.findAll('.sf-ne-node')

    const first = groups[0].findAll('tspan')
    expect(first).toHaveLength(3)
    expect(first[0].text()).toBe('INGEST')
    expect(first[2].text()).toBe('12K/S')
    expect(groups[0].find('text').attributes('fill')).toBe('#33a5cd')

    const lag = groups[5].findAll('tspan')
    expect(lag).toHaveLength(2)
    expect(groups[5].find('text').attributes('fill')).toBe('#000000')
  })

  it('draws every edge in the dim palette track, never bright red', () => {
    const wrapper = mountNodeEdge({ nodes, edges, palette: { accent: '#33a5cd', accentAlt: '#e6b434', track: '#5a1e1e' } })
    const paths = wrapper.findAll('path.sf-ne-edge')

    expect(paths).toHaveLength(7)
    for (const path of paths) {
      expect(path.attributes('stroke')).toBe('#5a1e1e')
      expect(path.attributes('stroke-width')).toBe('6')
    }
  })

  it('carries the measured pop timing, backward-nav snap, and reduced-motion block in its styles', () => {
    mountNodeEdge({ nodes, edges, status })
    const css = renderedCss()

    expect(css).toContain('80ms') // edge pop (§ measured: 1–2 frames)
    expect(css).toContain('70ms') // node pop (§ measured: ~2–3 frames)
    expect(css).not.toContain('300ms') // the dashoffset draw is gone
    // The hard cut AND backward nav snap: hidden states carry transition:none
    // (locked decision). Vue scoping appends the [data-v-*] attribute to the
    // compound selector.
    expect(css).toMatch(/\.sf-ne-edge\.slidev-vclick-hidden(\[data-v[^\]]+\])?\s*\{[^}]*transition:\s*none/)
    expect(css).toMatch(/\.sf-ne-node\.slidev-vclick-hidden(\[data-v[^\]]+\])?\s*\{[^}]*transition:\s*none/)
    expect(css).toMatch(/\.sf-ne-wash\.slidev-vclick-hidden(\[data-v[^\]]+\])?\s*\{[^}]*transition:\s*none/)
    expect(css).toContain('prefers-reduced-motion') // transitions disabled, instant state
  })

  it('binds the red ambient wash to the network MID-state range [1, cutClick)', () => {
    const wrapper = mountNodeEdge({ nodes, edges })

    const wash = wrapper.find('ellipse.sf-ne-wash')
    expect(wash.exists()).toBe(true)
    expect(wash.attributes('fill')).toMatch(/^url\(#/)
    expect(wash.attributes('data-click-start')).toBe('1')
    expect(wash.attributes('data-click-end')).toBe('13') // cut at 13 (no status layer)
  })

  it('binds the network scene to ranges ending at the hard cut: nodes [i,13), edges [reveal,13)', () => {
    const wrapper = mountNodeEdge({ nodes, edges })

    const nodeStarts = wrapper.findAll('.sf-ne-node').map(g => g.attributes('data-click-start'))
    expect(nodeStarts).toEqual(['1', '2', '3', '4', '5', '6'])
    for (const group of wrapper.findAll('.sf-ne-node')) {
      expect(group.attributes('data-click-end')).toBe('13')
    }

    const edgeBindings = wrapper.findAll('path.sf-ne-edge').map(p => [p.attributes('data-click-start'), p.attributes('data-click-end')])
    expect(edgeBindings).toEqual([
      ['7', '13'], ['8', '13'], ['9', '13'], ['10', '13'], ['11', '13'], ['12', '13'], ['12', '13'],
    ])
  })

  it('reveals the dim center element AT the cut and leaves it monotonic (no end)', () => {
    const wrapper = mountNodeEdge({ nodes, edges, terminalLog })

    const center = wrapper.find('.sf-ne-center')
    expect(center.exists()).toBe(true)
    expect(center.attributes('data-click-start')).toBe('13')
    expect(center.attributes('data-click-end')).toBeUndefined()
  })

  it('renders the terminal/log end-state panel as static chrome (never click-bound)', () => {
    const wrapper = mountNodeEdge({ nodes, edges, terminalLog })
    const panel = wrapper.find('.sf-ne-terminal-log')

    expect(panel.exists()).toBe(true)
    // Traffic lights: measured colors.
    const lights = panel.findAll('circle')
    expect(lights).toHaveLength(3)
    expect(lights.map(c => c.attributes('fill'))).toEqual(['#f85c53', '#f9b82d', '#27c43d'])
    // Command line: amber `$` prompt, gray pinned body.
    expect(panel.find('text.sf-ne-cmd-prompt').text()).toBe('$')
    expect(panel.find('text.sf-ne-cmd-prompt').attributes('fill')).toBe('#f9b82d')
    // Raw textContent — the leading space IS the gap after the `$` prompt.
    expect(panel.find('text.sf-ne-cmd').element.textContent).toBe(' meshctl status --verbose')
    expect(panel.find('text.sf-ne-cmd').attributes('fill')).toBe('#838288')
    expect(Number(panel.find('text.sf-ne-cmd').attributes('textLength'))).toBeCloseTo(459.615, 2)
    // Stat row: teal block cursor + condensed gray extent.
    expect(panel.find('rect.sf-ne-cursor').attributes('fill')).toBe('#225d66')
    expect(panel.find('text.sf-ne-stat').text()).toBe('nodes : 6 healthy · 2')
    expect(panel.find('text.sf-ne-stat').attributes('fill')).toBe('#5e5d62')
    expect(Number(panel.find('text.sf-ne-stat').attributes('textLength'))).toBeCloseTo(259, 2)
    // Static chrome: no member carries a click binding.
    for (const el of panel.findAll('*')) {
      expect(el.attributes('data-click-start')).toBeUndefined()
    }
  })

  it('renders the terminal/log panel at the measured sheet geometry', () => {
    const wrapper = mountNodeEdge({ nodes, edges, terminalLog })
    const panel = wrapper.find('.sf-ne-terminal-log')

    const lights = panel.findAll('circle')
    expect(lights.map(c => c.attributes('cx'))).toEqual(['43', '78', '112.5'])
    expect(lights[0].attributes('cy')).toBe('369')
    expect(panel.find('text.sf-ne-cmd-prompt').attributes('x')).toBe('128')
    expect(panel.find('rect.sf-ne-cursor').attributes('x')).toBe('77')
    expect(panel.find('rect.sf-ne-cursor').attributes('y')).toBe('461')
  })

  it('renders no terminal/log panel when terminalLog is omitted', () => {
    const wrapper = mountNodeEdge({ nodes, edges })

    expect(wrapper.find('.sf-ne-terminal-log').exists()).toBe(false)
    expect(wrapper.find('.sf-ne-center').exists()).toBe(false)
    expect(wrapper.findAll('circle')).toHaveLength(0)
  })

  it('renders the chrome at the sheet-measured cap height', () => {
    const wrapper = mountNodeEdge({ nodes, edges, title: 'DATA', titleAccent: 'PLATFORM' })
    const header = wrapper.find('.sf-chrome-title')

    // Sheet Title row: cap 77 in the band y49–126 → font-size 77/0.752,
    // baseline at the band bottom y126.
    expect(Number(header.attributes('font-size'))).toBeCloseTo(77 / 0.752, 4)
    expect(Number(header.attributes('y'))).toBe(126)
    expect(header.text()).toContain('DATA')
    expect(header.html()).toContain('#66fb00')
  })

  it('renders the status layer kinds with their tone fills', () => {
    const wrapper = mountNodeEdge({ nodes, edges, status, palette: { accent: '#33a5cd', accentAlt: '#e6b434' } })
    const groups = wrapper.findAll('.sf-ne-status')

    expect(groups[0].find('rect[fill="#e6b434"]').exists()).toBe(true) // solid block, alt tone
    expect(groups[1].find('path[fill="#33a5cd"]').exists()).toBe(true) // arrow glyph, accent tone
    expect(groups[0].text()).toContain('SLOW 5m')
  })

  it('surfaces the layout RangeError for unknown edge endpoints instead of rendering blank', () => {
    expect(() => mountNodeEdge({ nodes, edges: [{ ...edges[0], from: 'ghost' }] })).toThrow(RangeError)
  })
})

describe('terminal-log ambience — measured dark-field (reference frame profiles)', () => {
  it('exposes the measured floor, feathered band, and left glow plateau', () => {
    expect(TERMINAL_LOG_AMBIENCE.floor).toEqual({ x: 0, y: 330, w: 1920, h: 750, color: '#08070a' })
    expect(TERMINAL_LOG_AMBIENCE.band).toEqual({ x: 110, y: 341, w: 1700, h: 84, color: '#141318', blur: 24 })
    expect(TERMINAL_LOG_AMBIENCE.glow).toEqual({ x: 60, y: 470, w: 790, h: 210, color: '#0f0e11', blur: 50 })
  })

  it('scales every shape (and the blur sigmas) for a custom viewBox', () => {
    const a = ambienceLayout({ width: 960, height: 540 })
    expect(a.floor.w).toBe(960)
    expect(a.floor.h).toBe(375)
    expect(a.band.x).toBeCloseTo(55, 6)
    expect(a.band.blur).toBeCloseTo(12, 6)
    expect(a.glow.y).toBeCloseTo(235, 6)
    expect(a.glow.blur).toBeCloseTo(25, 6)
  })

  it('renders the ambience inside the terminal-log panel, behind its content, as static chrome', () => {
    const wrapper = mountNodeEdge({ nodes, edges, terminalLog })
    const panel = wrapper.find('.sf-ne-terminal-log')

    const floor = panel.find('rect.sf-ne-ambience-floor')
    const band = panel.find('rect.sf-ne-ambience-band')
    const glow = panel.find('rect.sf-ne-ambience-glow')
    expect(floor.exists() && band.exists() && glow.exists()).toBe(true)
    expect(floor.attributes('y')).toBe('330')
    expect(floor.attributes('fill')).toBe('#08070a')
    expect(band.attributes('fill')).toBe('#141318')
    expect(Number(band.attributes('filter'))).toBeNaN() // filter="url(#…)"
    expect(String(band.attributes('filter'))).toMatch(/^url\(#/)
    expect(glow.attributes('fill')).toBe('#0f0e11')

    // Static chrome: the ambience carries no click bindings either.
    for (const cls of ['sf-ne-ambience-floor', 'sf-ne-ambience-band', 'sf-ne-ambience-glow']) {
      expect(panel.find(`rect.${cls}`).attributes('data-click-start')).toBeUndefined()
    }
  })

  it('renders no ambience when terminalLog is omitted', () => {
    const wrapper = mountNodeEdge({ nodes, edges })

    expect(wrapper.find('rect.sf-ne-ambience-floor').exists()).toBe(false)
  })
})

describe('title condensation — mono face vs the recordings’ condensed face', () => {
  it('pins the title extent when titleTextLength is set (textLength + spacingAndGlyphs)', () => {
    const wrapper = mountNodeEdge({ nodes, edges, title: 'DATA', titleAccent: 'PLATFORM', titleTextLength: 1105 })
    const title = wrapper.find('.sf-chrome-title')

    expect(Number(title.attributes('textLength'))).toBe(1105)
    expect(title.attributes('lengthAdjust')).toBe('spacingAndGlyphs')
  })

  it('leaves the natural mono width when titleTextLength is omitted', () => {
    const wrapper = mountNodeEdge({ nodes, edges, title: 'DATA', titleAccent: 'PLATFORM' })
    const title = wrapper.find('.sf-chrome-title')

    expect(title.attributes('textLength')).toBeUndefined()
    expect(title.attributes('lengthAdjust')).toBeUndefined()
  })
})
