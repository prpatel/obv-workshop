// @vitest-environment happy-dom
import { describe, expect, it } from 'vitest'
import { mount } from '@vue/test-utils'
import type { Directive } from 'vue'
import SchematicRows from '../SchematicRows.vue'
import { schematicRowsLayout, type CodeRow, type SchematicLine } from './rows'

/** The demo seed's shape: 8 rows, 3 brace strokes attached to the dependency rows. */
const rows: CodeRow[] = [
  { id: 'file', indent: 1, tokens: [{ text: 'answer_service.py', tone: 'plain' }] },
  { id: 'imports', tokens: [{ text: 'from ', tone: 'accent' }, { text: 'mrk ', tone: 'plain' }, { text: 'import ', tone: 'accent' }, { text: 'service, depends', tone: 'plain' }] },
  { id: 'signature', tokens: [{ text: 'def ', tone: 'accent' }, { text: 'answer(question: ', tone: 'plain' }, { text: 'str', tone: 'chrome' }, { text: ') → ', tone: 'plain' }, { text: 'str:', tone: 'chrome' }] },
  { id: 'comment', tokens: [{ text: '# the AI application', tone: 'plain' }] },
  { id: 'api', indent: 1, tokens: [{ text: 'api = ', tone: 'plain' }, { text: 'service(', tone: 'accent' }, { text: '"answer-api")', tone: 'alt' }] },
  { id: 'ctx', indent: 1, tokens: [{ text: 'ctx = ', tone: 'plain' }, { text: 'depends(', tone: 'accent' }, { text: '"mart.orders")', tone: 'alt' }] },
  { id: 'model', indent: 1, tokens: [{ text: 'model = ', tone: 'plain' }, { text: 'depends(', tone: 'accent' }, { text: '"ai.answer_v2")', tone: 'alt' }] },
  { id: 'return', indent: 1, tokens: [{ text: 'return ', tone: 'accent' }, { text: 'model.ask(question, ctx)', tone: 'plain' }] },
]
const schematic: SchematicLine[] = [
  { attach: 'api', tone: 'accent', points: [[0.0287, 0.5699], [0.024, 0.5778], [0.0226, 0.5865], [0.0226, 0.611], [0.024, 0.6171], [0.028, 0.6224]] },
  { attach: 'ctx', tone: 'accent', points: [[0.0287, 0.6276], [0.024, 0.6355], [0.0226, 0.6442], [0.0226, 0.6687], [0.024, 0.6748], [0.028, 0.6801]] },
  { attach: 'model', tone: 'accent', points: [[0.0287, 0.6844], [0.024, 0.6923], [0.0226, 0.701], [0.0226, 0.7255], [0.024, 0.7316], [0.028, 0.7369]] },
]

/** Slidev registers the v-click directive globally at runtime; the render tests stub it as a no-op. */
function mountRows(props: Record<string, unknown> = {}) {
  return mount(SchematicRows, {
    props: { rows, schematic, ...props },
    global: { directives: { click: {} } },
  })
}

/** Stub that records each element's v-click value into a data attribute (click-choreography assertions). */
const captureClick: Directive<HTMLElement, number> = {
  mounted(el, binding) {
    el.setAttribute('data-sfc-click', String(binding.value))
  },
}
function mountCapturing(props: Record<string, unknown> = {}) {
  return mount(SchematicRows, {
    props: { rows, schematic, ...props },
    global: { directives: { click: captureClick } },
  })
}

/** Evaluate the shipped .sf-rows-line-fill stroke-dashoffset declaration (nodeEdge.test.ts pattern). */
function dashOffsetPx(css: string, drawn: number, len: number): number {
  const rule = css.match(/\.sf-rows-line-fill[^{,]*\{[^}]*\}/)?.[0] ?? ''
  const decl = rule.match(/stroke-dashoffset:\s*([^;]+);/)?.[1] ?? ''
  expect(decl, `.sf-rows-line-fill must declare stroke-dashoffset; rule: "${rule}"`).toBeTruthy()
  const expr = decl
    .replaceAll('var(--sf-len)', `${len}px`)
    .replaceAll('var(--sf-drawn)', `${drawn}px`)
    .trim()
  const calc = /^calc\(\s*([\d.]+)px\s*-\s*([\d.]+)px\s*\)$/.exec(expr)
  if (calc) return Number(calc[1]) - Number(calc[2])
  const bare = /^([\d.]+)px$/.exec(expr)
  expect(bare, `unexpected stroke-dashoffset expression "${decl}"`).toBeTruthy()
  return Number(bare![1])
}

/** Pull the numeric value of a --sf-drawn custom property from a style attribute. */
function drawnPx(style: string | undefined): number {
  const match = /--sf-drawn:\s*([\d.]+)px/.exec(style ?? '')
  expect(match, `--sf-drawn missing in "${style}"`).toBeTruthy()
  return Number.parseFloat(match![1])
}

/** Pull the numeric value of a --sf-len custom property — the shipped draw distance. */
function lenPx(style: string | undefined): number {
  const match = /--sf-len:\s*([\d.]+)px/.exec(style ?? '')
  expect(match, `--sf-len missing in "${style}"`).toBeTruthy()
  return Number.parseFloat(match![1])
}

describe('SchematicRows component', () => {
  it('renders one div per row with its token spans, plus a dim base + one accent copy per schematic stroke', () => {
    const wrapper = mountRows()

    expect(wrapper.find('.sf-rows').exists()).toBe(true)
    expect(wrapper.findAll('.sf-rows-row')).toHaveLength(8)
    expect(wrapper.findAll('.sf-rows-token')).toHaveLength(rows.reduce((n, r) => n + r.tokens.length, 0))
    expect(wrapper.findAll('path.sf-rows-line-base')).toHaveLength(3)
    expect(wrapper.findAll('path.sf-rows-line-fill')).toHaveLength(3)
  })

  it('exposes the measured canvas and an accessible name', () => {
    const wrapper = mountRows()
    const svg = wrapper.find('svg')

    expect(svg.attributes('viewBox')).toBe('0 0 1920 1080')
    expect(wrapper.find('.sf-rows').attributes('aria-label')).toBe('8-row schematic listing')
  })

  it('applies the tone system incl. the chrome-green constant and chrome-white plain', () => {
    const wrapper = mountRows({ palette: { accent: '#2f95b9', accentAlt: '#f2ba1f' } })
    // signature row: accent keyword, plain body, chrome annotation, plain, chrome annotation
    const spans = wrapper.findAll('.sf-rows-row')[2].findAll('.sf-rows-token')

    expect(spans[0].attributes('style')).toContain('#2f95b9') // accent → palette accent
    expect(spans[1].attributes('style')).toContain('#f5f4f7') // plain → chrome white constant
    expect(spans[2].attributes('style')).toContain('#66fb00') // chrome → terminal green constant
  })

  it('draws alt tokens in accentAlt and schematic strokes in accent', () => {
    const wrapper = mountRows({ palette: { accent: '#2f95b9', accentAlt: '#f2ba1f' } })
    const altSpan = wrapper.findAll('.sf-rows-row')[4].findAll('.sf-rows-token')[2]
    const fill = wrapper.findAll('path.sf-rows-line-fill')[0]
    const base = wrapper.findAll('path.sf-rows-line-base')[0]

    expect(altSpan.attributes('style')).toContain('#f2ba1f')
    expect(fill.attributes('stroke')).toBe('#2f95b9') // accent-tone stroke
    expect(base.attributes('stroke')).toBe('#40424e') // dim base = track
  })

  it('falls back alt tokens to accent when accentAlt is omitted', () => {
    const wrapper = mountRows({ palette: { accent: '#2f95b9' } })
    const altSpan = wrapper.findAll('.sf-rows-row')[4].findAll('.sf-rows-token')[2]

    expect(altSpan.attributes('style')).toContain('#2f95b9')
  })

  it('binds one click per row in data order and attaches strokes to their row click', () => {
    const wrapper = mountCapturing()
    const rowClicks = wrapper.findAll('.sf-rows-row').map((r) => r.attributes('data-sfc-click'))
    const strokeClicks = wrapper.findAll('path.sf-rows-line-fill').map((p) => p.attributes('data-sfc-click'))

    expect(rowClicks).toEqual(['1', '2', '3', '4', '5', '6', '7', '8'])
    // api/ctx/model sit at indices 4/5/6 → their strokes share clicks 5/6/7 — no stroke adds a click.
    expect(strokeClicks).toEqual(['5', '6', '7'])
  })

  it('pre-sets each stroke to draw exactly its analytic polyline length', () => {
    const wrapper = mountRows()
    const layout = schematicRowsLayout({ rows, schematic })
    const fills = wrapper.findAll('path.sf-rows-line-fill')

    fills.forEach((fill, i) => {
      // Style vars ship at the family's 4-decimal precision (sub-pixel).
      expect(drawnPx(fill.attributes('style'))).toBeCloseTo(layout.schematic[i].length, 4)
    })
  })

  it('covers [0, length] per stroke at full reveal — dashoffset ships the remaining phase', () => {
    // Regression pattern (StepFlow grey notch / NodeEdge edges): a --sf-len dash
    // at offset o paints [0, len − o]; each stroke's accent copy must reach the
    // end of its own polyline at full reveal.
    const wrapper = mountRows()
    const fills = wrapper.findAll('path.sf-rows-line-fill')
    const css = Array.from(document.querySelectorAll('style'))
      .map((tag) => tag.textContent ?? '')
      .join('\n')

    fills.forEach((fill, i) => {
      // Self-consistent at the shipped precision: dasharray = dashoffset base = len,
      // so full reveal must paint [0, len] exactly — any wrong offset binding breaks it.
      const len = lenPx(fill.attributes('style'))
      expect(drawnPx(fill.attributes('style'))).toBe(len)
      const unionEnd = len - dashOffsetPx(css, len, len)
      expect(unionEnd, `stroke ${i} must paint [0, ${len}] at full reveal`).toBeCloseTo(len, 6)
    })

    // Backward-nav snap must survive any change to the revealed phase.
    const hiddenRule = css.match(/\.sf-rows-line-fill\.slidev-vclick-hidden[^{]*\{[^}]*\}/)?.[0] ?? ''
    expect(hiddenRule).toContain('stroke-dashoffset: var(--sf-len)')
    expect(hiddenRule).toContain('transition: none')
  })

  it('carries the measured timings, hidden-state snap, and reduced-motion block in its rendered styles', () => {
    mountRows()

    const css = Array.from(document.querySelectorAll('style'))
      .map((tag) => tag.textContent ?? '')
      .join('\n')

    expect(css).toContain('150ms') // row fade-and-rise
    expect(css).toContain('300ms') // schematic draw
    expect(css).toContain('translateY(4px)') // the measured 4px rise
    const rowHidden = css.match(/\.sf-rows-row\.slidev-vclick-hidden[^{]*\{[^}]*\}/)?.[0] ?? ''
    expect(rowHidden).toContain('transition: none')
    expect(css).toContain('prefers-reduced-motion') // transitions disabled, instant state
  })

  it('renders the two-tone header: white title + chrome-green titleAccent tail', () => {
    const wrapper = mountRows({ title: 'HARDER TO', titleAccent: 'MAINTAIN' })
    const header = wrapper.find('.sf-rows-header')

    expect(header.text()).toContain('HARDER TO')
    expect(header.text()).toContain('MAINTAIN')
    expect(header.html()).toContain('#66fb00')
  })

  it('surfaces the layout RangeError for an unknown attach instead of rendering blank', () => {
    expect(() => mountRows({ schematic: [{ attach: 'ghost', tone: 'accent' as const, points: [[0, 0], [1, 1]] }] })).toThrow(RangeError)
  })
})
