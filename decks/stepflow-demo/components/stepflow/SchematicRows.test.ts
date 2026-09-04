// @vitest-environment happy-dom
import { describe, expect, it } from 'vitest'
import { mount } from '@vue/test-utils'
import type { Directive } from 'vue'
import SchematicRows from '../SchematicRows.vue'
import {
  CONNECTOR_RAIL,
  HIGHLIGHT_BAND,
  HIGHLIGHT_BANDS,
  PATH_TEXT,
  ROW_BASELINE,
  ROW_EM_TO_INK,
  ROW_FONT,
  ROW_NUMBER_STYLE,
  SCHEMATIC_ROWS_CALLOUTS,
  SCHEMATIC_ROWS_ROWS,
  TAB_TEXT,
  TOKEN_COLORS,
  TRAFFIC_DOTS,
  rowClick,
} from './rows'

/** Slidev registers the v-click directive globally at runtime; the render tests stub it as a no-op. */
function mountRows(props: Record<string, unknown> = {}) {
  return mount(SchematicRows, {
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
  return mount(SchematicRows, {
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

describe('SchematicRows component — title chrome', () => {
  it('renders the measured two-tone title with the sheet ink extent pinned via textLength', () => {
    const wrapper = mountRows({ title: 'to maintain', titleAccent: 'Harder' })
    const title = wrapper.find('.sf-chrome-title')

    expect(title.exists()).toBe(true)
    expect(title.text()).toContain('Harder')
    expect(title.text()).toContain('to maintain')
    // Direction-2 condensation: the deck's mono runs wide at cap 78.4, so the
    // measured 877.6px combined ink extent is pinned (SVG textLength + glyphs).
    expect(title.html()).toContain('877.6')
    expect(title.html()).toContain('spacingAndGlyphs')
  })
})

describe('SchematicRows component — window chrome', () => {
  it('pops the whole chrome group on click 1: the top rule, three dots, tab, path', () => {
    const wrapper = mountCapturing()
    const chrome = wrapper.find('.sf-rows-window')

    expect(chrome.exists()).toBe(true)
    expect(chrome.attributes('data-sfc-click')).toBe('1')
    expect(chrome.findAll('rect').length).toBe(1) // the single dim top rule
    expect(chrome.findAll('circle')).toHaveLength(3)
  })

  it('draws the traffic dots in macOS order with the sampled colors', () => {
    const wrapper = mountRows()
    const dots = wrapper.findAll('.sf-rows-window circle')

    expect(dots.map((d) => d.attributes('fill'))).toEqual(TRAFFIC_DOTS.map((d) => d.fill))
    expect(dots[0].attributes('cx')).toBe(String(TRAFFIC_DOTS[0].cx))
  })

  it('renders the tab text at its measured position, uncondensed, with no underline', () => {
    const wrapper = mountRows()
    const tab = wrapper.findAll('.sf-rows-window text')[0]

    expect(tab.text()).toBe(TAB_TEXT.text)
    expect(tab.attributes('transform')).toContain(`translate(${TAB_TEXT.x} ${TAB_TEXT.baseline})`)
    expect(tab.attributes('transform')).not.toContain('scale(')
    expect(wrapper.findAll('.sf-rows-window rect')).toHaveLength(1) // top rule only — the y360+ ink is descenders
  })

  it('right-aligns the gray path at its measured right edge', () => {
    const wrapper = mountRows()
    const path = wrapper.findAll('.sf-rows-window text')[1]

    expect(path.text()).toBe(PATH_TEXT.text)
    expect(path.attributes('text-anchor')).toBe('end')
    expect(path.attributes('transform')).toContain(`translate(${PATH_TEXT.rightEdge}`)
  })
})

describe('SchematicRows component — band, rail, callouts', () => {
  it('ships the two teal strips at the measured rows 4–5 extents, revealed on row 4\'s click (7)', () => {
    const wrapper = mountCapturing()
    const strips = wrapper.findAll('.sf-rows-band')

    expect(strips).toHaveLength(2)
    strips.forEach((strip, k) => {
      expect(strip.attributes('data-sfc-click')).toBe('7')
      expect(strip.attributes('x')).toBe(String(HIGHLIGHT_BAND.x))
      expect(strip.attributes('y')).toBe(String(HIGHLIGHT_BANDS[k].y))
      expect(strip.attributes('height')).toBe(String(HIGHLIGHT_BANDS[k].h))
      expect(strip.attributes('width')).toBe(String(HIGHLIGHT_BAND.w))
      expect(strip.attributes('fill')).toBe(HIGHLIGHT_BAND.fill)
    })
  })

  it('draws the cyan rail top-down on click 6 via the normalized dashoffset', () => {
    const wrapper = mountCapturing()
    const rail = wrapper.find('.sf-rows-rail')

    expect(rail.attributes('data-sfc-click')).toBe('6')
    expect(rail.attributes('x1')).toBe(String(CONNECTOR_RAIL.x + CONNECTOR_RAIL.w / 2))
    expect(rail.attributes('x2')).toBe(rail.attributes('x1'))
    expect(rail.attributes('y2')).toBe(String(CONNECTOR_RAIL.y + CONNECTOR_RAIL.h))
    expect(rail.attributes('stroke')).toBe(CONNECTOR_RAIL.fill)
    expect(rail.attributes('pathLength')).toBe('1')

    const css = shippedCss()
    const railRule = css.match(/\.sf-rows-rail(?![\w-])[^{]*\{[^}]*\}/)?.[0] ?? ''
    expect(railRule).toContain('stroke-dasharray: 1')
    const hiddenRule = css.match(/\.sf-rows-rail\.slidev-vclick-hidden[^{]*\{[^}]*\}/)?.[0] ?? ''
    expect(hiddenRule).toContain('stroke-dashoffset: 1')
    expect(hiddenRule).toContain('transition: none')
  })

  it('renders the four measured callout rings with tails and keyed clicks', () => {
    const wrapper = mountCapturing()
    const groups = wrapper.findAll('.sf-rows-callout')

    expect(groups).toHaveLength(4)
    expect(groups.map((g) => g.attributes('data-sfc-click'))).toEqual(
      SCHEMATIC_ROWS_CALLOUTS.map((c) => String(c.click)),
    )

    const rings = groups.map((g) => g.find('ellipse'))
    rings.forEach((ring, i) => {
      // Rings are hand-drawn STROKES in the measured tones (fill:none), not filled circles.
      expect(ring.attributes('stroke')).toBe(SCHEMATIC_ROWS_CALLOUTS[i].ring.fill)
      expect(ring.attributes('fill')).toBe('none')
      expect(ring.attributes('transform')).toContain(`rotate(${SCHEMATIC_ROWS_CALLOUTS[i].ring.rot}`)
    })

    // Tails only where the spec has them (2 and 4)
    expect(groups[0].find('polyline').exists()).toBe(false)
    expect(groups[1].find('polyline').exists()).toBe(true)
    expect(groups[2].find('polyline').exists()).toBe(false)
    expect(groups[3].find('polyline').exists()).toBe(true)
  })

  it('types each callout label at its measured cap-matched font with advance-matched tracking', () => {
    const wrapper = mountRows()
    const labels = wrapper.findAll('.sf-rows-label')

    expect(labels).toHaveLength(4)
    labels.forEach((label, i) => {
      const spec = SCHEMATIC_ROWS_CALLOUTS[i]
      expect(label.text()).toBe(spec.label)
      expect(label.attributes('x')).toBe(String(spec.ink.x))
      // baseline = inkTop + cap; font = cap / 0.729; tracking = advance − 0.6·font
      const font = spec.ink.cap / 0.729
      expect(Number(label.attributes('y'))).toBeCloseTo(spec.ink.inkTop + spec.ink.cap, 4)
      expect(Number(label.attributes('font-size'))).toBeCloseTo(font, 4)
      expect(Number(label.attributes('letter-spacing'))).toBeCloseTo(spec.ink.advance - 0.6 * font, 4)
      expect(label.attributes('fill')).toBe(spec.ink.fill)
    })
  })
})

describe('SchematicRows component — the listing', () => {
  it('renders one uncondensed div per row at its measured x/ink-top with the gutter numbers on the shared baseline', () => {
    const wrapper = mountRows()
    const rows = wrapper.findAll('.sf-rows-row')

    expect(rows).toHaveLength(7)
    rows.forEach((row, i) => {
      const spec = SCHEMATIC_ROWS_ROWS[i]
      const style = row.attributes('style') ?? ''
      expect(style).toContain(`left: ${spec.x}px`)
      // px() prints the shortest 4-decimal form (no trailing zeros).
      expect(style).toContain(`top: ${String(spec.inkTop - ROW_EM_TO_INK)}px`)
      expect(style).toContain(`font-size: ${ROW_FONT}px`)
      expect(style).toContain('scaleX(1)') // no condensation — the reference advance is the deck mono's 0.6em
    })

    const numbers = wrapper.findAll('.sf-rows-number')
    expect(numbers).toHaveLength(7)
    numbers.forEach((num, i) => {
      expect(num.text()).toBe(String(i + 1))
      expect(num.attributes('x')).toBe(String(ROW_NUMBER_STYLE.x))
      expect(Number(num.attributes('y'))).toBeCloseTo(SCHEMATIC_ROWS_ROWS[i].inkTop + ROW_BASELINE, 4)
    })
  })

  it('splits rows into per-character spans carrying the sampled token colors', () => {
    const wrapper = mountRows()
    const row1 = wrapper.findAll('.sf-rows-row')[0].findAll('.sf-rows-char')

    // textContent (not text()): char spans holding spaces must be counted.
    expect(row1.map((c) => c.element.textContent ?? '').join('')).toBe('from mrk import service, depends')
    expect(row1[0].attributes('style')).toContain(TOKEN_COLORS.keyword) // 'f' of from
    expect(row1[5].attributes('style')).toContain(TOKEN_COLORS.ident) // 'm' of mrk
  })

  it('carries the measured +2.1px/char tracking on string chars only (row 4 literals)', () => {
    const wrapper = mountRows()
    const row4 = wrapper.findAll('.sf-rows-row')[3].findAll('.sf-rows-char')

    const tracked = row4.filter((c) => (c.attributes('style') ?? '').includes('letter-spacing'))
    expect(tracked.map((c) => c.element.textContent ?? '').join('')).toBe('"answer-api"')
    expect((tracked[0].attributes('style') ?? '')).toContain('2.1px')
    expect(row4[0].attributes('style')).not.toContain('letter-spacing') // ident chars stay untracked
  })

  it('paces the typewriter per character: each row completes its ≈1.4s share', () => {
    const wrapper = mountRows()
    const row1 = wrapper.findAll('.sf-rows-row')[0]
    const chars = row1.findAll('.sf-rows-char')

    // Row 1 has 32 chars over 1400ms → ~43.75ms per char, indexed by --ci.
    const style = chars[1].attributes('style') ?? ''
    expect(style).toContain('--ci: 1')
    expect(style).toMatch(/--cd: 43\.75ms/)

    const css = shippedCss()
    expect(css).toContain('animation-delay: calc(var(--ci) * var(--cd))')
    // Hidden rows reset the animation so backward nav snaps and re-reveals replay.
    const hidden = css.match(/\.sf-rows-row\.slidev-vclick-hidden \.sf-rows-char[^{]*\{[^}]*\}/)?.[0] ?? ''
    expect(hidden).toContain('animation: none')
    expect(hidden).toContain('opacity: 0')
  })

  it('fires the rail-aware ten-click schedule: rows on 3, 4, 5, 7, 8, 9, 10; band with row 4', () => {
    const wrapper = mountCapturing()
    const rowClicks = wrapper.findAll('.sf-rows-row').map((r) => r.attributes('data-sfc-click'))
    const bandClick = wrapper.find('.sf-rows-band').attributes('data-sfc-click')
    const railClick = wrapper.find('.sf-rows-rail').attributes('data-sfc-click')
    const numberClicks = wrapper.findAll('.sf-rows-number').map((n) => n.attributes('data-sfc-click'))

    expect(rowClicks).toEqual(SCHEMATIC_ROWS_ROWS.map((_, i) => String(rowClick(i))))
    expect(rowClicks).toEqual(['3', '4', '5', '7', '8', '9', '10'])
    expect(numberClicks).toEqual(rowClicks) // gutter numbers fade with their rows
    expect(bandClick).toBe('7')
    expect(railClick).toBe('6')
  })

  it('exposes the measured canvas and an accessible name', () => {
    const wrapper = mountRows()
    const svg = wrapper.find('svg')

    expect(svg.attributes('viewBox')).toBe('0 0 1920 1080')
    expect(wrapper.find('.sf-rows').attributes('aria-label')).toBe('7-row code listing with callout annotations')
  })

  it('throws the layout RangeError for an empty scene instead of rendering blank', () => {
    expect(() => mountRows({ data: { rows: [], callouts: [] } })).toThrow(RangeError)
  })
})

describe('SchematicRows component — motion stylesheet', () => {
  it('ships the pop/fade/draw timings, the typewriter animation, and reduced-motion coverage', () => {
    mountRows()
    const css = shippedCss()

    expect(css).toContain('150ms') // chrome pop + band/callout fades
    expect(css).toContain('300ms') // rail draw
    expect(css).toContain('translateY(3px)') // the chrome pop rise
    expect(css).toContain('sf-rows-type') // typewriter keyframes
    const reduced = css.slice(css.indexOf('prefers-reduced-motion'))
    expect(reduced).toContain('.sf-rows-window')
    expect(reduced).toContain('.sf-rows-char')
    expect(reduced).toContain('.sf-rows-rail')
  })
})
