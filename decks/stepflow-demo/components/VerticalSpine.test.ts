// @vitest-environment happy-dom
import { describe, expect, it } from 'vitest'
import { mount } from '@vue/test-utils'
import VerticalSpine from './VerticalSpine.vue'
import { titleFontSize, type TitleToken } from './stepflow/chrome'
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
  titleTokens?: TitleToken[]
  palette?: Record<string, string>
  footer?: { left: string; right: string }
}) {
  return mount(VerticalSpine, { props, global: { directives: { click: {} } } })
}

/** The demo slide's seed data: glyph → label row → two side cards. */
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
  it('renders one group per node plus the closing axis chrome: glyph, label row, two side cards', () => {
    const wrapper = mountSpine({ nodes: spineNodes })

    expect(wrapper.find('svg.vertical-spine').exists()).toBe(true)
    // 4 node groups + the always-present axis-chrome group (5th reveal beat).
    expect(wrapper.findAll('.sf-spine-item')).toHaveLength(5)
    expect(wrapper.findAll('.sf-spine-marker')).toHaveLength(1)
    expect(wrapper.findAll('.sf-spine-label')).toHaveLength(1)
    expect(wrapper.findAll('.sf-spine-card')).toHaveLength(2)
    expect(wrapper.findAll('.sf-spine-caption')).toHaveLength(2)
    // The sheet traces NO center spine line and NO flanking diamonds — the
    // axis is the vertical rhythm itself.
    expect(wrapper.find('.sf-spine-flank').exists()).toBe(false)
    expect(wrapper.find('.sf-spine-line').exists()).toBe(false)
  })

  it('exposes the measured canvas and an accessible name', () => {
    const wrapper = mountSpine({ nodes: spineNodes })
    const svg = wrapper.find('svg.vertical-spine')

    expect(svg.attributes('viewBox')).toBe('0 0 1920 1080')
    expect(svg.attributes('role')).toBe('img')
    // 4 node clicks in the seed data (no withPrevious folding).
    expect(svg.attributes('aria-label')).toBe('4-step spine diagram with 2 side cards')
  })

  it('renders the traced ring/bar/legs axis glyph at the first center slot in spine-accent orange', () => {
    const wrapper = mountSpine({ nodes: spineNodes })
    const marker = wrapper.find('.sf-spine-marker')

    // Fitted to the measured 85.7×93.5 box centered on slot 0
    // (cx 913.0, cy 396.95): translate to the box's top-left corner.
    expect(marker.attributes('transform')).toBe(
      'translate(870.15 350.2) scale(0.9315 0.9397)',
    )
    // spine-accent orange (orangeSpine preset verbatim) drives currentColor.
    expect(marker.attributes('color')).toBe('#f85721')
    // The traced glyph's ring (outer r≈23.75 in the 92×99.5 box), not a rhombus.
    expect(marker.html()).toContain('r="23.75"')
    expect(marker.find('polygon').exists()).toBe(false)
  })

  it('slots the side cards at the measured asymmetric positions as outlined plates with glyph strokes', () => {
    const wrapper = mountSpine({ nodes: spineNodes })
    const cards = wrapper.findAll('.sf-spine-card')

    expect(cards).toHaveLength(2)
    // Left card: 130×103.9 centered at (468, 749.55) → top-left (403, 697.6).
    expect(cards[0].attributes('x')).toBe('403')
    expect(cards[0].attributes('y')).toBe('697.6')
    expect(cards[0].attributes('width')).toBe('130')
    expect(cards[0].attributes('height')).toBe('103.9')
    // Outlined treatment (art_mkVNxsft §3.4): near-black plate, tone stroke at
    // the measured ≈9px, 9px corner radius.
    expect(cards[0].attributes('fill')).toBe('#0b0a11')
    expect(cards[0].attributes('stroke')).toBe('#349aea')
    expect(cards[0].attributes('stroke-width')).toBe('9')
    expect(cards[0].attributes('rx')).toBe('9')
    // The cards are NOT equal: the right plate is a wider, much shorter bar
    // (135.5×55.5 centered at (1358.95, 749.55)).
    expect(cards[1].attributes('x')).toBe('1291.2')
    expect(cards[1].attributes('width')).toBe('135.5')
    expect(cards[1].attributes('height')).toBe('55.5')

    // The cards carry solid tone-tone glyph strokes (bars + studs), not
    // registry icons — the v7 recording's ink mass IS the glyph.
    const glyphs = wrapper.findAll('.sf-spine-card-glyph')
    expect(glyphs).toHaveLength(2)
    expect(glyphs[0].attributes('fill')).toBe('#349aea')
    expect(glyphs[0].findAll('rect')).toHaveLength(4) // 2 bars + 2 drop studs
    expect(glyphs[1].attributes('fill')).toBe('#f7ba20') // chainBlue accentAlt
    expect(glyphs[1].findAll('rect')).toHaveLength(4) // 4 piercing verticals
    expect(wrapper.find('.sf-spine-card-icon').exists()).toBe(false)
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

  it('colors the card-toned captions per card tone at the measured 38.7px cap', () => {
    const wrapper = mountSpine({
      nodes: spineNodes,
      palette: { accent: '#24cce5', accentAlt: '#3891e3' },
    })
    const captions = wrapper.findAll('.sf-spine-caption')

    expect(captions[0].attributes('fill')).toBe('#24cce5')
    expect(captions[1].attributes('fill')).toBe('#3891e3')
    // Cap 38.7px at 1080 through the shared chrome ratio.
    expect(Number(captions[0].attributes('font-size'))).toBeCloseTo(titleFontSize(38.7), 4)
    // Captions sit at the measured bbox: centered on the card axis, y883.1.
    expect(captions[0].attributes('x')).toBe('468')
    expect(captions[0].attributes('y')).toBe('883.1')
  })

  it('condenses a caption to its measured ink run via textLength', () => {
    const nodes: SpineNode[] = [
      ...spineNodes.slice(0, 2),
      { id: 'left-stat', title: '', caption: 'SQL', captionWidth: 110.2, tone: 'accent', side: 'left' },
      { id: 'right-stat', title: '', caption: 'PIPELINES', captionWidth: 285.4, tone: 'accent', side: 'right' },
    ]
    const wrapper = mountSpine({ nodes })
    const captions = wrapper.findAll('.sf-spine-caption')

    expect(captions[0].attributes('textLength')).toBe('110.2')
    expect(captions[0].attributes('lengthAdjust')).toBe('spacing')
    // 'PIPELINES' renders natural at cap 38.7 — within the 2% pin threshold
    // of its measured 285.4px extent — so no textLength attribute renders.
    expect(captions[1].attributes('textLength')).toBeUndefined()
  })

  it('reveals the gray footer lines second-to-last and the axis chrome last', () => {
    const wrapper = mountSpine({ nodes: spineNodes, footer: { left: 'LINE ONE', right: 'LINE TWO' } })

    const lines = wrapper.findAll('.sf-spine-footer-line')
    expect(lines).toHaveLength(2)
    expect(lines[0].attributes('x')).toBe('468') // left card axis
    expect(lines[1].attributes('x')).toBe('1358.95') // right card axis
    expect(Number(lines[0].attributes('y'))).toBeCloseTo(959.4, 3) // measured baseline
    expect(Number(lines[0].attributes('font-size'))).toBeCloseTo(titleFontSize(19.8), 4)
    expect(lines[0].attributes('fill')).toBe('#8b8a92')
    expect(lines[0].text()).toBe('LINE ONE')
    expect(lines[1].text()).toBe('LINE TWO')

    // The axis chrome closes the slide: orange stub, burnt-orange axis rule
    // crossing the axis, and the dim #403f48 bottom rule fading last.
    const stub = wrapper.find('.sf-spine-axis-stub')
    expect(stub.attributes('x')).toBe('909.85') // axis 913 − 6.3/2
    expect(Number(stub.attributes('y'))).toBeCloseTo(567.4, 3)
    expect(stub.attributes('width')).toBe('6.3')
    expect(Number(stub.attributes('height'))).toBeCloseTo(32.1, 3)
    expect(stub.attributes('fill')).toBe('#bd521e')

    const rule = wrapper.find('.sf-spine-axis-rule')
    expect(Number(rule.attributes('x'))).toBeCloseTo(464.3, 3)
    expect(Number(rule.attributes('y'))).toBeCloseTo(602.3, 3)
    expect(Number(rule.attributes('width'))).toBeCloseTo(897.4, 3) // x464.3–1361.7
    expect(Number(rule.attributes('height'))).toBeCloseTo(4.7, 3)
    expect(rule.attributes('fill')).toBe('#b35526')

    const bottom = wrapper.find('.sf-spine-footer-rule')
    expect(Number(bottom.attributes('x'))).toBeCloseTo(192.1, 3)
    expect(Number(bottom.attributes('y'))).toBeCloseTo(1044.8, 3) // center 1047.65
    expect(Number(bottom.attributes('width'))).toBeCloseTo(1441.8, 3)
    expect(Number(bottom.attributes('height'))).toBeCloseTo(5.7, 3)
    expect(bottom.attributes('fill')).toBe('#403f48')

    // 4 node groups + footer + axis chrome = 6 reveal groups.
    expect(wrapper.findAll('.sf-spine-item')).toHaveLength(6)
  })

  it('omits the footer group but always renders the closing axis chrome', () => {
    const wrapper = mountSpine({ nodes: spineNodes })

    expect(wrapper.find('.sf-spine-footer').exists()).toBe(false)
    expect(wrapper.find('.sf-spine-axis-chrome').exists()).toBe(true)
    expect(wrapper.findAll('.sf-spine-item')).toHaveLength(5)
  })

  it('renders the shared chrome at the sheet band (report §2 chrome rule 4 evolved)', () => {
    const wrapper = mountSpine({ nodes: spineNodes, title: 'CENTER AXIS', titleAccent: 'RHYTHM' })
    const header = wrapper.find('.sf-chrome-title')

    // Sheet Title row: stem-measured fallback band (glyph-core cap 68.8,
    // y56.5–125.3); the demo slide's title-tokens carry the per-run metrics.
    expect(Number(header.attributes('font-size'))).toBeCloseTo(68.8 / 0.730, 4)
    expect(Number(header.attributes('y'))).toBe(125.3)
  })

  it('applies the two-preset composition: chainBlue cards, orangeSpine spine', () => {
    const wrapper = mountSpine({ nodes: spineNodes })
    const html = wrapper.html()

    expect(html).toContain('#349aea') // chainBlue accent — card blocks
    expect(html).toContain('#f85721') // orangeSpine accent — glyph + label row
  })

  it('renders the titleAccent tail in chrome green (convention constant, not a palette field)', () => {
    const wrapper = mountSpine({ nodes: spineNodes, title: 'CENTER AXIS', titleAccent: 'RHYTHM' })
    const header = wrapper.find('.sf-chrome-title')

    expect(header.exists()).toBe(true)
    expect(header.html()).toContain('#66fb00')
    expect(header.text()).toContain('CENTER AXIS')
    expect(header.text()).toContain('RHYTHM')
  })

  it('fits measured header tokens: green SQL first at cap 84, white tail from its x-height band', () => {
    const tokens: TitleToken[] = [
      { text: 'SQL', accent: true, x: 228.8, width: 188.4, capHeight: 84, capTop: 58.5 },
      { text: 'and pipelines still matter', x: 439.0, width: 1163.8, capHeight: 72.3, capTop: 53.8 },
    ]
    const wrapper = mountSpine({ nodes: spineNodes, titleTokens: tokens })
    const runs = wrapper.findAll('.sf-chrome-title')

    // One condensate-fitted <text> per measured ink run.
    expect(runs).toHaveLength(2)
    // Green SQL lead: measured extent x228.8–417.2 on its own (lower) baseline.
    expect(runs[0].text()).toBe('SQL')
    expect(runs[0].attributes('fill')).toBe('#66fb00')
    expect(Number(runs[0].attributes('x'))).toBeCloseTo(228.8, 3)
    expect(Number(runs[0].attributes('textLength'))).toBeCloseTo(188.4, 3)
    expect(Number(runs[0].attributes('font-size'))).toBeCloseTo(titleFontSize(84), 4)
    expect(Number(runs[0].attributes('y'))).toBeCloseTo(58.5 + 84, 3)
    // White tail condensed to its measured 1163.8px run at cap 72.3.
    expect(runs[1].text()).toBe('and pipelines still matter')
    expect(runs[1].attributes('fill')).toBe('#ffffff')
    expect(Number(runs[1].attributes('font-size'))).toBeCloseTo(titleFontSize(72.3), 4)
    expect(Number(runs[1].attributes('y'))).toBeCloseTo(53.8 + 72.3, 3)
  })

  it('folds the label into the glyph click with withPrevious (3 reveal groups)', () => {
    const nodes: SpineNode[] = [
      { id: 'marker', title: '', tone: 'alt', side: 'center' },
      { id: 'label', title: 'DATA ENGINEERS', tone: 'alt', side: 'center', withPrevious: true },
      { id: 'left-card', caption: 'SQL', tone: 'accent', side: 'left' },
      { id: 'right-card', caption: 'PIPELINES', tone: 'accent', side: 'right' },
    ]
    const wrapper = mountSpine({ nodes })

    // glyph+label together (click 1), then one click per card → 3 steps.
    expect(wrapper.find('svg.vertical-spine').attributes('aria-label')).toBe(
      '3-step spine diagram with 2 side cards',
    )
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
