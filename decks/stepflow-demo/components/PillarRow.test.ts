// @vitest-environment happy-dom
import { describe, expect, it } from 'vitest'
import { mount } from '@vue/test-utils'
import type { Directive } from 'vue'
import PillarRow from './PillarRow.vue'
import type { PillarCard } from './stepflow/pillars'
import { ICON_FALLBACK } from './stepflow/icons'

const SEED: PillarCard[] = [
  { id: 's1', label: 'FETCH', icon: 'cassette-tape' },
  { id: 's2', label: 'QUERY', icon: 'table-2' },
  { id: 's3', label: 'SHIP', icon: 'flag' },
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
    // Verbatim Lucide children from the three new registry keys.
    expect(glyphs[0]!.html()).toContain('M8 12h8')
    expect(glyphs[1]!.html()).toContain('M9 3H5')
    expect(glyphs[2]!.html()).toContain('M4 22V4')
    // The glyph group carries the Lucide 24-box → 98px-square scale.
    expect(glyphs[0]!.attributes('transform')).toContain('scale(4.088)')
  })

  it('falls back to the visible ICON_FALLBACK for an unknown key (never undefined into v-html)', () => {
    const bad: PillarCard[] = [{ id: 'x', label: 'MYSTERY', icon: 'not-a-real-icon' }]
    const wrapper = mountRow({ cards: bad })
    expect(wrapper.find('.sf-glyph').html()).toContain('M9.09 9a3 3 0 0 1')
    expect(wrapper.find('.sf-glyph').html()).toContain(ICON_FALLBACK.slice(0, 30))
  })

  it('renders hue-matched labels and the two measured summary rows', () => {
    const wrapper = mountRow({
      cards: SEED,
      summaryRows: ['row one content', 'row two content'],
    })
    const labels = wrapper.findAll('.sf-label')
    expect(labels).toHaveLength(3)
    expect(labels[0]!.text()).toBe('FETCH')
    expect(labels[0]!.attributes('fill')).toBe('#eeeff0')
    expect(labels[1]!.attributes('fill')).toBe('#51bdda')
    expect(labels[2]!.attributes('fill')).toBe('#44d0a8')
    // Labels pin their ink width (5 chars × 13.5936).
    expect(labels[0]!.attributes('textLength')).toBeDefined()

    const rows = wrapper.findAll('.sf-row')
    expect(rows).toHaveLength(2)
    expect(rows[0]!.text()).toBe('row one content')
    expect(rows[0]!.attributes('fill')).toBe('#d16157')
    expect(rows[1]!.attributes('fill')).toBe('#686868')
    expect(rows[0]!.attributes('textLength')).toBeDefined()
  })

  it('plates render near-black (V-3): #0b0b0b fill, never a light gray', () => {
    const wrapper = mountRow({ cards: SEED })
    const plate = wrapper.find('.sf-plate')
    expect(plate.attributes('fill')).toBe('#0b0b0b')
    expect(plate.attributes('x')).toBe('249.6')
    expect(plate.attributes('y')).toBe('486')
    expect(plate.attributes('width')).toBe('307.2')
    expect(plate.attributes('height')).toBe('216')
  })

  it('renders the shared two-tone title chrome', () => {
    const wrapper = mountRow({ cards: SEED, title: 'THE PIPELINE', titleAccent: 'IN THREE PARTS' })
    const title = wrapper.find('.sf-chrome-title')
    expect(title.exists()).toBe(true)
    expect(title.text()).toContain('THE PIPELINE')
    expect(title.text()).toContain('IN THREE PARTS')
  })
})

describe('PillarRow component — click choreography', () => {
  it('maps the measured six beats: cards 1/3/5, badges 2/4/5, rows 6', () => {
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

  it('keeps the sequence contiguous for fewer cards (two stations → beats 1–4, rows 6)', () => {
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
