// @vitest-environment happy-dom
import { describe, expect, it } from 'vitest'
import { mount } from '@vue/test-utils'
import NodeEdge from '../NodeEdge.vue'
import {
  edgePoints,
  labelLines,
  nodeEdgeLayout,
  polylinePath,
  NODE_PLATE,
  NODE_RX,
  NODE_SIZE_FRAC,
  NODE_STROKE,
  STATUS_RED,
  STATUS_SQUARE,
  type FlowEdge,
  type FlowNode,
  type FlowStatus,
} from './nodeEdge'
import { polylineLength } from './paths'

/** Slidev registers the v-click directive globally at runtime; the render tests stub it as a no-op. */
function mountNodeEdge(props: { nodes: FlowNode[]; edges: FlowEdge[]; status?: FlowStatus[]; palette?: object; title?: string; titleAccent?: string; terminal?: string[] }) {
  return mount(NodeEdge, { props, global: { directives: { click: {} } } })
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

  it('renders no circle primitive and no dashoffset draw machinery (the corrected contract)', () => {
    const wrapper = mountNodeEdge({ nodes, edges })
    const css = renderedCss()

    expect(wrapper.find('circle').exists()).toBe(false)
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
    // Backward nav snaps: hidden states carry transition:none (locked decision).
    // Vue scoping appends the [data-v-*] attribute to the compound selector.
    expect(css).toMatch(/\.sf-ne-edge\.slidev-vclick-hidden(\[data-v[^\]]+\])?\s*\{[^}]*transition:\s*none/)
    expect(css).toMatch(/\.sf-ne-node\.slidev-vclick-hidden(\[data-v[^\]]+\])?\s*\{[^}]*transition:\s*none/)
    expect(css).toContain('prefers-reduced-motion') // transitions disabled, instant state
  })

  it('renders the red ambient wash behind the network zone as static chrome (not click-bound)', () => {
    const wrapper = mountNodeEdge({ nodes, edges })

    const wash = wrapper.find('ellipse.sf-ne-wash')
    expect(wash.exists()).toBe(true)
    expect(wash.attributes('fill')).toMatch(/^url\(#/)
  })

  it('renders the terminal readout lines bottom-left in white at the measured column', () => {
    const wrapper = mountNodeEdge({ nodes, edges, terminal: ['LAST DEPLOY 14M AGO', 'VER 2.4.1'] })
    const lines = wrapper.findAll('text.sf-ne-terminal')

    expect(lines).toHaveLength(2)
    expect(lines[0].text()).toBe('LAST DEPLOY 14M AGO')
    expect(lines[1].text()).toBe('VER 2.4.1')
    expect(lines[0].attributes('x')).toBe('167.04') // 8.7% of 1920
    expect(lines[0].attributes('fill')).toBe('#ffffff')
  })

  it('scales the header to the measured 7.2%h', () => {
    const wrapper = mountNodeEdge({ nodes, edges, title: 'DATA', titleAccent: 'PLATFORM' })
    const header = wrapper.find('text.header')

    expect(header.attributes('font-size')).toBe('77.76') // 0.072 × 1080
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
