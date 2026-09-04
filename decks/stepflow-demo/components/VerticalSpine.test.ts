// @vitest-environment happy-dom
import { describe, expect, it, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import VerticalSpine from './VerticalSpine.vue'
import type { SpineNode } from './stepflow/spine'

/**
 * Slidev registers the v-click directive globally at runtime; the render tests
 * stub it as a no-op so the component mounts outside the deck. Reveal behavior
 * itself is dogfooded against the running dev server (spike art_7Q2OtXCm).
 */
function mountSpine(props: {
  nodes: SpineNode[]
  title?: string
  titleAccent?: string
  palette?: Record<string, string>
  footer?: { left: string; right: string }
}) {
  return mount(VerticalSpine, { props, global: { directives: { click: {} } } })
}

/** The demo slide's seed data: marker → label row → two side cards (4 clicks). */
const spineNodes: SpineNode[] = [
  { id: 'marker', title: '', tone: 'alt', side: 'center' },
  { id: 'label', title: 'TRANSPARENCY IN ACTION', tone: 'alt', side: 'center' },
  { id: 'left-stat', title: '4X', caption: 'faster pipelines', tone: 'accent', side: 'left' },
  { id: 'right-stat', title: '50%', caption: 'less toil', tone: 'accent', side: 'right' },
]

function documentCss(): string {
  return Array.from(document.querySelectorAll('style'))
    .map((tag) => tag.textContent ?? '')
    .join('\n')
}

describe('VerticalSpine', () => {
  it('renders one group per node: marker, label row, and two side cards', () => {
    const wrapper = mountSpine({ nodes: spineNodes })

    expect(wrapper.find('svg.vertical-spine').exists()).toBe(true)
    expect(wrapper.findAll('.sf-spine-item')).toHaveLength(4)
    expect(wrapper.findAll('.sf-spine-marker')).toHaveLength(1)
    expect(wrapper.findAll('.sf-spine-label')).toHaveLength(1)
    expect(wrapper.findAll('.sf-spine-flank')).toHaveLength(2) // label-row flanking diamonds
    expect(wrapper.findAll('.sf-spine-card')).toHaveLength(2)
    expect(wrapper.findAll('.sf-spine-caption')).toHaveLength(2)
  })

  it('exposes the measured canvas and an accessible name', () => {
    const wrapper = mountSpine({ nodes: spineNodes })
    const svg = wrapper.find('svg.vertical-spine')

    expect(svg.attributes('viewBox')).toBe('0 0 1920 1080')
    expect(svg.attributes('role')).toBe('img')
    expect(svg.attributes('aria-label')).toBe('2-element spine diagram with 2 side cards')
  })

  it('places the marker rhombus at the first center slot in spine-accent orange', () => {
    const wrapper = mountSpine({ nodes: spineNodes })
    const marker = wrapper.find('.sf-spine-marker')

    // Hand-computed: cx = 913.92, cy = 397.44, half-w = 42.24, half-h = 46.44.
    expect(marker.attributes('points')).toBe('913.92,351 956.16,397.44 913.92,443.88 871.68,397.44')
    expect(marker.attributes('fill')).toBe('#f85721')
  })

  it('slots the side cards at the measured positions as outlined plates with white titles', () => {
    const wrapper = mountSpine({ nodes: spineNodes })
    const cards = wrapper.findAll('.sf-spine-card')

    expect(cards).toHaveLength(2)
    expect(cards[0].attributes('x')).toBe('403.968') // 468.48 − 129.024/2
    expect(cards[0].attributes('y')).toBe('697.14') // 749.52 − 104.76/2
    expect(cards[0].attributes('width')).toBe('129.024')
    expect(cards[0].attributes('height')).toBe('104.76')
    // Outlined treatment (report §3): near-black plate, accent stroke at the
    // measured 4–5px source scale (5 × 1080/1144).
    expect(cards[0].attributes('fill')).toBe('#0b0a11')
    expect(cards[0].attributes('stroke')).toBe('#349aea')
    expect(cards[0].attributes('stroke-width')).toBe('4.7203') // 5 × 1080/1144
    expect(cards[1].attributes('x')).toBe('1294.848') // 1359.36 − 129.024/2

    const captions = wrapper.findAll('.sf-spine-caption')
    expect(captions[0].attributes('y')).toBe('883.44') // measured caption baseline
    // Ref §3: the big glyph strokes ARE the card's ink mass — the title reads
    // the card tone (bold), never white.
    expect(wrapper.find('.sf-spine-card-title').attributes('fill')).toBe('#349aea')
    expect(wrapper.find('.sf-spine-card-title').attributes('font-weight')).toBe('800')
  })

  it('renders outlined two-tone cards with the seeded recording palette', () => {
    const wrapper = mountSpine({
      nodes: spineNodes,
      palette: { accent: '#24cce5', accentAlt: '#3891e3' },
    })
    const cards = wrapper.findAll('.sf-spine-card')

    // Left card reads the accent (cyan), the right card the accentAlt (blue).
    expect(cards[0].attributes('stroke')).toBe('#24cce5')
    expect(cards[1].attributes('stroke')).toBe('#3891e3')
    expect(cards[0].attributes('fill')).toBe('#0b0a11')
  })

  it('colors the big card-colored captions per card tone at the measured 44px', () => {
    const wrapper = mountSpine({
      nodes: spineNodes,
      palette: { accent: '#24cce5', accentAlt: '#3891e3' },
    })
    const captions = wrapper.findAll('.sf-spine-caption')

    expect(captions[0].attributes('fill')).toBe('#24cce5')
    expect(captions[1].attributes('fill')).toBe('#3891e3')
    expect(captions[0].attributes('font-size')).toBe('44') // fix list: 24 → 44px at 1080
  })

  it('reveals the gray footer row last: dim rule on the axis + two per-column lines', () => {
    const wrapper = mountSpine({ nodes: spineNodes, footer: { left: 'LINE ONE', right: 'LINE TWO' } })

    const rule = wrapper.find('.sf-spine-footer-rule')
    expect(rule.attributes('x')).toBe('192') // 913.92 − 1443.84/2
    expect(rule.attributes('y')).toBe('1045.089') // 1047.924 − 5.67/2
    expect(rule.attributes('width')).toBe('1443.84') // 75.2% of 1920
    expect(rule.attributes('height')).toBe('5.67')
    expect(rule.attributes('fill')).toBe('#202020')

    const lines = wrapper.findAll('.sf-spine-footer-line')
    expect(lines).toHaveLength(2)
    expect(lines[0].attributes('x')).toBe('468.48') // left card axis
    expect(lines[1].attributes('x')).toBe('1359.36') // right card axis
    expect(lines[0].attributes('y')).toBe('959.04') // measured 0.888 × 1080
    expect(lines[0].attributes('font-size')).toBe('24')
    expect(lines[0].text()).toBe('LINE ONE')
    expect(lines[1].text()).toBe('LINE TWO')

    // The footer is the 5th reveal group after the 4 nodes (measured beats:
    // bottom rows land last).
    expect(wrapper.findAll('.sf-spine-item')).toHaveLength(5)
  })

  it('omits the footer group when no footer prop is passed', () => {
    const wrapper = mountSpine({ nodes: spineNodes })

    expect(wrapper.find('.sf-spine-footer').exists()).toBe(false)
    expect(wrapper.findAll('.sf-spine-item')).toHaveLength(4)
  })

  it('sets the header at recording scale (report §2 chrome rule 4)', () => {
    const wrapper = mountSpine({ nodes: spineNodes, title: 'CENTER AXIS', titleAccent: 'RHYTHM' })
    const header = wrapper.find('.sf-spine-header')

    expect(header.attributes('font-size')).toBe('91.8') // 0.085 × 1080
    expect(header.attributes('y')).toBe('120.96') // 0.112 × 1080 baseline
  })

  it('applies the two-preset composition: chainBlue cards, orangeSpine spine, amber flanks', () => {
    const wrapper = mountSpine({ nodes: spineNodes })
    const html = wrapper.html()

    expect(html).toContain('#349aea') // chainBlue accent — card blocks
    expect(html).toContain('#f85721') // orangeSpine accent — marker + label row
    expect(html).toContain('#f7ba20') // chainBlue accentAlt — flanking diamonds
  })

  it('renders the titleAccent tail in chrome green (convention constant, not a palette field)', () => {
    const wrapper = mountSpine({ nodes: spineNodes, title: 'CENTER AXIS', titleAccent: 'RHYTHM' })
    const header = wrapper.find('.sf-spine-header')

    expect(header.exists()).toBe(true)
    expect(header.html()).toContain('#66fb00')
    expect(header.text()).toContain('CENTER AXIS')
    expect(header.text()).toContain('RHYTHM')
  })

  it('renders the fallback icon and warns on an unknown card icon key', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
    try {
      const nodes: SpineNode[] = [
        ...spineNodes.filter((n) => n.side !== 'left'),
        { id: 'left-stat', title: '4X', tone: 'accent', side: 'left', icon: 'not-a-key' },
      ]
      const wrapper = mountSpine({ nodes })

      expect(warn).toHaveBeenCalledWith(expect.stringContaining('not-a-key'))
      // ICON_FALLBACK (Lucide circle-help) geometry must be in the markup.
      expect(wrapper.find('.sf-spine-card-icon').html()).toContain('r="10"')
    } finally {
      warn.mockRestore()
    }
  })

  it('surfaces the geometry RangeError when no center nodes exist', () => {
    const sideOnly: SpineNode[] = [
      { id: 'l', title: 'L', tone: 'accent', side: 'left' },
      { id: 'r', title: 'R', tone: 'accent', side: 'right' },
    ]
    expect(() => mountSpine({ nodes: sideOnly })).toThrow(RangeError)
  })

  it('keeps the locked motion contract: rises forward, snaps backward, reduced-motion freezes', () => {
    mountSpine({ nodes: spineNodes })
    const css = documentCss()

    // Hidden state: fully hidden + transition:none (backward nav snaps instantly).
    const hiddenRule = css.match(/\.sf-spine-item\.slidev-vclick-hidden[^{]*\{[^}]*\}/)?.[0] ?? ''
    expect(hiddenRule).toContain('opacity: 0')
    expect(hiddenRule).toContain('transition: none')

    // Revealed state carries the measured rise.
    expect(css).toContain('150ms')
    expect(css).toContain('prefers-reduced-motion')
  })
})
