// @vitest-environment happy-dom
import { describe, expect, it, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import NodeEdge from '../NodeEdge.vue'
import {
  edgePoints,
  nodeEdgeLayout,
  polylineLength,
  polylinePath,
  STATUS_ARROW,
  STATUS_BLOCK,
  STATUS_GAP,
  STATUS_OUTLINE,
  type FlowEdge,
  type FlowNode,
  type FlowStatus,
} from './nodeEdge'

/** Slidev registers the v-click directive globally at runtime; the render tests stub it as a no-op. */
function mountNodeEdge(props: { nodes: FlowNode[]; edges: FlowEdge[]; status?: FlowStatus[]; palette?: object; title?: string; titleAccent?: string }) {
  return mount(NodeEdge, { props, global: { directives: { click: {} } } })
}

/**
 * The demo seed mirrors the slide data: node positions and the vertical status
 * run are the v3 recording's measured fractions (research art_0AzKGXnD §F2,
 * re-verified against frame crops this session).
 */
const nodes: FlowNode[] = [
  { id: 'ingest', xFrac: 0.6363, yFrac: 0.4017, tone: 'alt', label: 'INGEST' },
  { id: 'lake', xFrac: 0.7569, yFrac: 0.5245, tone: 'accent', label: 'LAKEHOUSE' },
  { id: 'catalog', xFrac: 0.7569, yFrac: 0.7723, tone: 'plain', icon: 'database' },
  { id: 'serve', xFrac: 0.6363, yFrac: 0.8972, tone: 'accent', label: 'SERVE' },
]
const edges: FlowEdge[] = [
  { from: 'ingest', to: 'serve', points: [[0.6363, 0.4476], [0.6363, 0.8462]], status: true },
  { from: 'lake', to: 'catalog', points: [[0.7569, 0.549], [0.7569, 0.7478]] },
]
const status: FlowStatus[] = [
  { attach: 'lake', text: 'SLOW 5m', tone: 'alt', kind: 'block' },
  { attach: 'catalog', text: 'DRIFT', tone: 'alt', kind: 'outline' },
  { attach: 'serve', text: 'REPLAY', tone: 'accent', kind: 'arrow' },
]

/** Evaluate the shipped .sf-ne-edge-fill stroke-dashoffset declaration (StepFlow.test.ts pattern). */
function dashOffsetPx(css: string, drawn: number, len: number): number {
  const rule = css.match(/\.sf-ne-edge-fill[^{,]*\{[^}]*\}/)?.[0] ?? ''
  const decl = rule.match(/stroke-dashoffset:\s*([^;]+);/)?.[1] ?? ''
  expect(decl, `.sf-ne-edge-fill must declare stroke-dashoffset; rule: "${rule}"`).toBeTruthy()
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

describe('polyline helpers — hand-computed constants', () => {
  it('polylinePath emits M + L commands in order', () => {
    expect(polylinePath([[100, 100], [300, 100], [300, 300]])).toBe('M 100 100 L 300 100 L 300 300')
  })

  it('polylineLength resolves the 3-4-5 triangle exactly', () => {
    expect(polylineLength([[0, 0], [3, 4]])).toBe(5)
  })

  it('polylineLength sums each segment: an L-path is its two legs', () => {
    expect(polylineLength([[100, 100], [300, 100], [300, 300]])).toBe(400)
  })

  it('polylineLength of a degenerate single point is 0', () => {
    expect(polylineLength([[42, 7]])).toBe(0)
  })

  it('polylineLength is direction-independent', () => {
    const fwd = polylineLength([[10, 10], [130, 40], [60, 250]])
    const rev = polylineLength([[60, 250], [130, 40], [10, 10]])
    expect(rev).toBeCloseTo(fwd, 6)
    expect(fwd).toBeCloseTo(Math.hypot(120, 30) + Math.hypot(70, 210), 6)
  })

  it('polylineLength handles collinear multi-point runs without drift', () => {
    expect(polylineLength([[0, 0], [100, 0], [250, 0]])).toBe(250)
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

describe('nodeEdgeLayout — resolved geometry', () => {
  it('converts node fractions to px centers with the measured radius', () => {
    const l = nodeEdgeLayout({ nodes: [nodes[0]], edges: [] })
    expect(l.nodes[0].cx).toBeCloseTo(0.6363 * 1920, 6) // 1221.696
    expect(l.nodes[0].cy).toBeCloseTo(0.4017 * 1080, 6) // 433.836
    expect(l.nodes[0].r).toBeCloseTo(48, 6) // 0.025 × 1920
    expect(l.viewBox).toEqual({ width: 1920, height: 1080 })
  })

  it('resolves edge path and analytic length: the measured vertical run', () => {
    const l = nodeEdgeLayout({ nodes, edges })
    // (0.8462 − 0.4476) × 1080 = 430.488
    expect(l.edges[0].length).toBeCloseTo(430.488, 6)
    expect(l.edges[0].d).toBe(`M ${0.6363 * 1920} ${0.4476 * 1080} L ${0.6363 * 1920} ${0.8462 * 1080}`)
    expect(l.edges[0].status).toBe(true)
    expect(l.edges[1].status).toBe(false)
  })

  it('hangs the block left of its node, vertically centered', () => {
    const l = nodeEdgeLayout({ nodes, edges, status: [status[0]] })
    const node = l.nodes.find((n) => n.id === 'lake')!
    const el = l.status[0]
    expect(el.cx).toBeCloseTo(node.cx - node.r - STATUS_GAP - STATUS_BLOCK.w / 2, 6)
    expect(el.cy).toBeCloseTo(node.cy, 6)
    expect([el.w, el.h]).toEqual([STATUS_BLOCK.w, STATUS_BLOCK.h])
  })

  it('hangs the outline left of its node with its own measured size', () => {
    const l = nodeEdgeLayout({ nodes, edges, status: [status[1]] })
    const node = l.nodes.find((n) => n.id === 'catalog')!
    const el = l.status[0]
    expect(el.cx).toBeCloseTo(node.cx - node.r - STATUS_GAP - STATUS_OUTLINE.w / 2, 6)
    expect([el.w, el.h]).toEqual([STATUS_OUTLINE.w, STATUS_OUTLINE.h])
  })

  it('hangs the arrow below its node', () => {
    const l = nodeEdgeLayout({ nodes, edges, status: [status[2]] })
    const node = l.nodes.find((n) => n.id === 'serve')!
    const el = l.status[0]
    expect(el.cx).toBeCloseTo(node.cx, 6)
    expect(el.cy).toBeCloseTo(node.cy + node.r + STATUS_GAP + STATUS_ARROW.h / 2, 6)
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
  it('renders one node group per node, a dim base + one accent copy per edge, and one status group per element', () => {
    const wrapper = mountNodeEdge({ nodes, edges, status })

    expect(wrapper.find('svg.nodeedge').exists()).toBe(true)
    expect(wrapper.findAll('.sf-ne-node')).toHaveLength(4)
    expect(wrapper.findAll('path.sf-ne-edge-base')).toHaveLength(2)
    expect(wrapper.findAll('path.sf-ne-edge-fill')).toHaveLength(2)
    expect(wrapper.findAll('.sf-ne-status')).toHaveLength(3)
  })

  it('exposes the measured canvas and an accessible name', () => {
    const wrapper = mountNodeEdge({ nodes, edges, status })
    const svg = wrapper.find('svg.nodeedge')

    expect(svg.attributes('viewBox')).toBe('0 0 1920 1080')
    expect(svg.attributes('role')).toBe('img')
    expect(svg.attributes('aria-label')).toBe('4-node network diagram')
  })

  it('applies the tone system: accent, alt, and plain chrome-white node strokes', () => {
    const wrapper = mountNodeEdge({ nodes, edges, status, palette: { accent: '#349aea', accentAlt: '#e5413f' } })
    const rings = wrapper.findAll('.sf-ne-node-ring')

    expect(rings[0].attributes('stroke')).toBe('#e5413f') // alt → accentAlt
    expect(rings[1].attributes('stroke')).toBe('#349aea') // accent
    expect(rings[2].attributes('stroke')).toBe('#f5f4f7') // plain → chrome white
    expect(rings[3].attributes('stroke')).toBe('#349aea')
  })

  it('draws status edges in accentAlt and plain edges in accent', () => {
    const wrapper = mountNodeEdge({ nodes, edges, status, palette: { accent: '#349aea', accentAlt: '#e5413f' } })
    const fills = wrapper.findAll('path.sf-ne-edge-fill')

    expect(fills[0].attributes('stroke')).toBe('#e5413f') // status edge → red
    expect(fills[1].attributes('stroke')).toBe('#349aea') // plain edge → accent
  })

  it('pre-sets each accent copy to draw exactly its analytic polyline length', () => {
    const wrapper = mountNodeEdge({ nodes, edges, status })
    const layout = nodeEdgeLayout({ nodes, edges, status })
    const fills = wrapper.findAll('path.sf-ne-edge-fill')

    fills.forEach((fill, i) => {
      expect(drawnPx(fill.attributes('style'))).toBeCloseTo(layout.edges[i].length, 6)
    })
  })

  it('covers [0, length] per edge at full reveal — dashoffset ships the remaining phase', () => {
    // Regression pattern (StepFlow grey notch): a --sf-len dash at offset o
    // paints [0, len − o]; the union over each edge's accent copies must reach
    // the end of that edge's polyline.
    const wrapper = mountNodeEdge({ nodes, edges, status })
    const layout = nodeEdgeLayout({ nodes, edges, status })
    const fills = wrapper.findAll('path.sf-ne-edge-fill')
    const css = Array.from(document.querySelectorAll('style'))
      .map((tag) => tag.textContent ?? '')
      .join('\n')

    fills.forEach((fill, i) => {
      const len = layout.edges[i].length
      const drawn = drawnPx(fill.attributes('style'))
      const unionEnd = len - dashOffsetPx(css, drawn, len)
      expect(unionEnd, `edge ${i} must paint [0, ${len}] at full reveal`).toBeCloseTo(len, 6)
    })

    // Backward-nav snap must survive any change to the revealed phase.
    const hiddenRule = css.match(/\.sf-ne-edge-fill\.slidev-vclick-hidden[^{]*\{[^}]*\}/)?.[0] ?? ''
    expect(hiddenRule).toContain('stroke-dashoffset: var(--sf-len)')
    expect(hiddenRule).toContain('transition: none')
  })

  it('renders the status layer kinds with their tone fills', () => {
    const wrapper = mountNodeEdge({ nodes, edges, status, palette: { accent: '#349aea', accentAlt: '#e5413f' } })
    const groups = wrapper.findAll('.sf-ne-status')

    expect(groups[0].find('rect[fill="#e5413f"]').exists()).toBe(true) // solid block, alt tone
    expect(groups[1].find('rect[stroke="#e5413f"]').exists()).toBe(true) // outline box, alt tone
    expect(groups[2].find('path[fill="#349aea"]').exists()).toBe(true) // arrow glyph, accent tone
    expect(groups[0].text()).toContain('SLOW 5m')
  })

  it('renders the fallback icon and warns on an unknown icon key', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
    try {
      const bad: FlowNode[] = [{ id: 'x', xFrac: 0.5, yFrac: 0.5, tone: 'plain', icon: 'not-a-key' }]
      const wrapper = mountNodeEdge({ nodes: bad, edges: [] })

      expect(warn).toHaveBeenCalledWith(expect.stringContaining('not-a-key'))
      // ICON_FALLBACK (Lucide circle-help) geometry must be in the markup.
      expect(wrapper.find('.sf-ne-node-icon').html()).toContain('r="10"')
    } finally {
      warn.mockRestore()
    }
  })

  it('surfaces the layout RangeError for unknown edge endpoints instead of rendering blank', () => {
    expect(() => mountNodeEdge({ nodes, edges: [{ ...edges[0], from: 'ghost' }] })).toThrow(RangeError)
  })

  it('carries the measured timing constants and reduced-motion block in its rendered styles', () => {
    mountNodeEdge({ nodes, edges, status })

    const css = Array.from(document.querySelectorAll('style'))
      .map((tag) => tag.textContent ?? '')
      .join('\n')

    expect(css).toContain('300ms') // edge draw (§9)
    expect(css).toContain('120ms') // node ring pop
    expect(css).toContain('150ms') // node/status fade
    expect(css).toContain('prefers-reduced-motion') // transitions disabled, instant state
  })

  it('renders the two-tone header: white title + chrome-green titleAccent tail', () => {
    const wrapper = mountNodeEdge({ nodes, edges, status, title: 'DATA', titleAccent: 'PLATFORM' })
    const header = wrapper.find('text.header')

    expect(header.text()).toContain('DATA')
    expect(header.html()).toContain('#66fb00')
  })
})
