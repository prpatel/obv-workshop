// @vitest-environment happy-dom
import { describe, expect, it } from 'vitest'
import { mount } from '@vue/test-utils'
import type { Directive } from 'vue'
import PillarRow from './PillarRow.vue'
import type { PillarCard } from './stepflow/pillars'
import { ICON_FALLBACK } from './stepflow/icons'

const SEED: PillarCard[] = [
  { id: 's1', label: 'FETCH', sublabel: 'STATION 1', caption: 'FETCHING', captionMeta: 'STEP 1', icon: 'cassette-tape' },
  { id: 's2', label: 'TRANSFORM', sublabel: 'STATION 2', caption: 'PROCESSING', captionMeta: 'STATION 2', icon: 'table-2' },
  { id: 's3', label: 'DEPLOY', sublabel: 'STATION 3', caption: 'DELIVER', captionMeta: 'STATION 3', icon: 'flag' },
]

/** Slidev registers the v-click directive globally at runtime; the render tests stub it as a no-op. */
function mountRow(props: Record<string, unknown> = {}) {
  return mount(PillarRow, {
    props,
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
  return mount(PillarRow, {
    props,
    global: { directives: { click: captureClick } },
  })
}

/** Collect all shipped styles (scoped + reduced-motion) as one CSS string. */
function shippedCss(): string {
  return Array.from(document.querySelectorAll('style'))
    .map((tag) => tag.textContent ?? '')
    .join('\n')
}

describe('PillarRow component — structure', () => {
  it('renders the 1920×1080 canvas with three station groups and three badge groups', () => {
    const wrapper = mountRow({ cards: SEED })
    const svg = wrapper.find('svg')
    expect(svg.attributes('viewBox')).toBe('0 0 1920 1080')
    expect(svg.attributes('aria-label')).toBe('3-pillar card row')
    expect(wrapper.findAll('.sf-card')).toHaveLength(3)
    expect(wrapper.findAll('.sf-badge')).toHaveLength(3)
  })

  it("renders each station's registry glyph inside the measured ink square", () => {
    const wrapper = mountRow({ cards: SEED })
    const glyphs = wrapper.findAll('.sf-glyph')
    expect(glyphs).toHaveLength(3)
    // Verbatim Lucide children from the three new registry keys — composed
    // into the circle-enclosed pictogram anatomy (circle + scaled inner icon).
    expect(glyphs[0]!.html()).toContain('M8 12h8')
    expect(glyphs[1]!.html()).toContain('M9 3H5')
    expect(glyphs[2]!.html()).toContain('M4 22V4')
    // Enclosing circle outline (24-box r 11 → ~48px radius at the station
    // scale), centered in the measured ink square.
    expect(glyphs[0]!.html()).toContain('cx="12" cy="12" r="11"')
    // The glyph group carries the Lucide 24-box → measured-ink scale only.
    expect(glyphs[0]!.attributes('transform')).toMatch(/scale\(4\.464\)/)
  })

  it('falls back to the visible ICON_FALLBACK for an unknown key (never undefined into v-html)', () => {
    const bad: PillarCard[] = [
      { id: 'x', label: 'MYSTERY', sublabel: 'STATION X', caption: 'MYSTERY', captionMeta: 'STEP X', icon: 'not-a-real-icon' },
    ]
    const wrapper = mountRow({ cards: bad })
    expect(wrapper.find('.sf-glyph').html()).toContain('M9.09 9a3 3 0 0 1')
    expect(wrapper.find('.sf-glyph').html()).toContain(ICON_FALLBACK.slice(0, 30))
  })

  it('renders hue-matched label rows, dim sublabels, and the per-station caption clusters', () => {
    const wrapper = mountRow({ cards: SEED })
    const labels = wrapper.findAll('.sf-label')
    expect(labels).toHaveLength(3)
    expect(labels[0]!.text()).toBe('FETCH')
    expect(labels[0]!.attributes('fill')).toBe('#a8a8a9')
    expect(labels[1]!.attributes('fill')).toBe('#5b9aad')
    expect(labels[2]!.attributes('fill')).toBe('#579f8b')
    // Labels pin their ink width to the measured run extents.
    expect(labels[0]!.attributes('textLength')).toBeDefined()

    // Label row B (the previously deferred secondary row).
    const sublabels = wrapper.findAll('.sf-sublabel')
    expect(sublabels).toHaveLength(3)
    expect(sublabels[0]!.text()).toBe('STATION 1')
    expect(sublabels[0]!.attributes('fill')).toBe('#676767')

    // Caption clusters: badge-hued row 1 + gray row 2, per station.
    const rows = wrapper.findAll('.sf-row')
    expect(rows).toHaveLength(6)
    expect(rows[0]!.text()).toBe('FETCHING')
    expect(rows[0]!.attributes('fill')).toBe('#d07b42')
    expect(rows[2]!.text()).toBe('DELIVER')
    expect(rows[2]!.attributes('fill')).toBe('#b74588')
    expect(rows[3]!.text()).toBe('STEP 1')
    expect(rows[3]!.attributes('fill')).toBe('#6c6c6d')
    expect(rows[0]!.attributes('textLength')).toBeDefined()
  })

  it('plates render near-black at the settled dim-mask boxes, never a light gray', () => {
    const wrapper = mountRow({ cards: SEED })
    const plate = wrapper.find('.sf-plate')
    expect(plate.attributes('fill')).toBe('#0e0d0f')
    expect(plate.attributes('x')).toBe('277.44')
    expect(plate.attributes('y')).toBe('494.208')
    expect(plate.attributes('width')).toBe('316.608')
    expect(plate.attributes('height')).toBe('231.768')
  })

  it('badges render thin circle outlines carrying a bright mini-icon', () => {
    const wrapper = mountRow({ cards: SEED })
    const badge = wrapper.find('.sf-badge')
    // Open ring in the station's accent (no core disc, no tail).
    expect(badge.find('.sf-badge-ring').attributes('r')).toBe('47.50164')
    expect(badge.find('.sf-badge-ring').attributes('fill')).toBe('none')
    expect(badge.find('.sf-badge-ring').attributes('stroke')).toBe('#f96200')
    expect(badge.find('.sf-badge-ring').attributes('stroke-width')).toBe('3.5')
    // Mini-icon markup from the layout module, tinted via currentColor.
    const icon = badge.find('.sf-badge-icon')
    expect(icon.attributes('color')).toBe('#f96200')
    expect(icon.html()).toContain('<rect')
  })

  it('renders the shared two-tone title chrome from measured tokens', () => {
    const wrapper = mountRow({
      cards: SEED,
      titleTokens: [
        { text: 'MEASURED', x: 539.3, width: 297.6 },
        { text: 'PIPELINE STAGES', x: 836.9, width: 546.1, accent: true },
      ],
    })
    const titles = wrapper.findAll('.sf-chrome-title')
    expect(titles).toHaveLength(2)
    expect(titles[0]!.text()).toBe('MEASURED')
    expect(titles[1]!.text()).toBe('PIPELINE STAGES')
  })
})

describe('PillarRow component — click choreography', () => {
  it('maps the measured six beats: cards 1/3/5, badges 2/4/5, captions 6', () => {
    const wrapper = mountCapturing({ cards: SEED })
    const cards = wrapper.findAll('.sf-card')
    const badges = wrapper.findAll('.sf-badge')
    const rows = wrapper.find('.sf-rows')
    expect(cards[0]!.attributes('data-sfc-click')).toBe('1')
    expect(badges[0]!.attributes('data-sfc-click')).toBe('2')
    expect(cards[1]!.attributes('data-sfc-click')).toBe('3')
    expect(badges[1]!.attributes('data-sfc-click')).toBe('4')
    // Station 3's badge rides its card's beat — too dim for its own beat.
    expect(cards[2]!.attributes('data-sfc-click')).toBe('5')
    expect(badges[2]!.attributes('data-sfc-click')).toBe('5')
    expect(rows!.attributes('data-sfc-click')).toBe('6')
  })

  it('keeps the sequence contiguous for fewer cards (two stations → beats 1–4, captions 6)', () => {
    const wrapper = mountCapturing({ cards: SEED.slice(0, 2) })
    const cards = wrapper.findAll('.sf-card')
    const badges = wrapper.findAll('.sf-badge')
    expect(cards[1]!.attributes('data-sfc-click')).toBe('3')
    expect(badges[1]!.attributes('data-sfc-click')).toBe('4')
    expect(wrapper.find('.sf-rows').attributes('data-sfc-click')).toBe('6')
  })
})

describe('PillarRow component — shipped motion styles', () => {
  it('ships the hidden-state transition:none lock and the reduced-motion collapse', () => {
    const css = shippedCss()
    // Backward nav snaps (destination-state transition contract).
    expect(css).toContain('.sf-card.slidev-vclick-hidden')
    expect(css).toContain('.sf-badge.slidev-vclick-hidden')
    // Reduced motion collapses every transition.
    expect(css).toContain('@media (prefers-reduced-motion: reduce)')
    expect(css).toContain('transition: none')
  })

  it('stagger row 2 behind row 1 within the shared beat (measured 1.467s → ≈1.933s wave)', () => {
    const css = shippedCss()
    // Scoped compilation inserts [data-v-…] before the brace — match past it.
    expect(css).toMatch(/\.sf-row-2(\[data-v-[a-z0-9]+\])?\s*{[^}]*400ms/)
  })
})
