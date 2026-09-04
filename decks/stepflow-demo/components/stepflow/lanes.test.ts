// @vitest-environment happy-dom
import { describe, expect, it } from 'vitest'
import { mount } from '@vue/test-utils'
import { ref } from 'vue'
import { injectionClicksContext } from '@slidev/client/constants'
import MilestoneLanes from '../MilestoneLanes.vue'
import {
  BAR_H_FRAC,
  BAR_H_SHORT_FRAC,
  BOX_H_FRAC,
  BOX_W_FRAC,
  BOX_X_FRAC,
  BOX_Y_FRAC,
  FOOTER_CHIP_H_FRAC,
  FOOTER_CHIP_W_FRAC,
  FOOTER_CHIP_X_FRAC,
  FOOTER_CHIP_Y_FRAC,
  FOOTER_ROW_X_FRAC,
  FOOTER_ROW_Y_FRAC,
  HEADER_ICON_X_FRAC,
  HEADER_ICON_Y_FRAC,
  HEADER_ROW_X_FRAC,
  HEADER_ROW_Y_FRAC,
  LANE_LABEL_X_FRAC,
  LANE_PITCH_FRAC,
  LANE_Y0_FRAC,
  TICK_H_FRAC,
  TICK_X_FRAC,
  WASH_BAND_H_FACTOR,
  WASH_CORE_H_FACTOR,
  WASH_RIGHT_INSET_FRAC,
  milestoneLanesLayout,
  type Lane,
} from './lanes'

/**
 * The demo seed mirrors the slide data: lane grid and bar offsets are the
 * source recording's measured fractions (research art_2kSBGNmJ §3.4, src
 * 174–181s): lanes 1–2 red (alt), 3–4 amber (accent); tall bars on lanes 1
 * and 3 (35px at 720), short on 2 and 4 (24px).
 */
const lanes: Lane[] = [
  { id: 'streaming', label: 'STREAMING', bars: [{ xFrac: 0.634, wFrac: 0.202, tone: 'alt' }] },
  { id: 'pipeline', label: 'PIPELINE', bars: [{ xFrac: 0.219, wFrac: 0.18, tone: 'alt', hFrac: BAR_H_SHORT_FRAC }] },
  { id: 'quality', label: 'QUALITY', bars: [{ xFrac: 0.68, wFrac: 0.156, tone: 'accent' }] },
  { id: 'lakehouse', label: 'LAKEHOUSE', bars: [{ xFrac: 0.219, wFrac: 0.522, tone: 'accent', hFrac: BAR_H_SHORT_FRAC }] },
]
const data = { lanes, y0Frac: LANE_Y0_FRAC, lanePitchFrac: LANE_PITCH_FRAC, barHFrac: BAR_H_FRAC }

/** A v-click stub that records each directive's click index — the render test asserts choreography through it. */
const clickBindings: { tag: string; value: number }[] = []
const clickStub = {
  mounted(el: Element, binding: { value: number }) {
    clickBindings.push({ tag: el.tagName, value: binding.value })
  },
}

/** Props the mount helper can override per test. */
type LanesProps = {
  lanes: Lane[]
  y0Frac: number
  lanePitchFrac: number
  barHFrac: number
  title?: string
  titleAccent?: string
  headerLabel?: string
  footerLabel?: string
}

/** A fake Slidev clicks context: a ref whose `.value.current` mirrors the slide's live click count. */
function fakeClicksContext(initial: number) {
  return ref<{ current: number }>({ current: initial })
}

function mountLanes(overrides: Partial<LanesProps> = {}, clicks?: ReturnType<typeof fakeClicksContext>) {
  clickBindings.length = 0
  return mount(MilestoneLanes, {
    props: {
      lanes,
      y0Frac: LANE_Y0_FRAC,
      lanePitchFrac: LANE_PITCH_FRAC,
      barHFrac: BAR_H_FRAC,
      ...overrides,
    },
    global: {
      directives: { click: clickStub },
      ...(clicks ? { provide: { [injectionClicksContext as unknown as string]: clicks } } : {}),
    },
  })
}

describe('measured constants — hand-computed to 1e-6', () => {
  it('lane grid: first bar top y350/720, pitch 50/720', () => {
    expect(LANE_Y0_FRAC).toBeCloseTo(0.4861111111, 6)
    expect(LANE_PITCH_FRAC).toBeCloseTo(0.0694444444, 6)
  })

  it('bar heights: tall 35/720, short 24/720 (measured 3.3–4.9%h)', () => {
    expect(BAR_H_FRAC).toBeCloseTo(0.0486111111, 6)
    expect(BAR_H_SHORT_FRAC).toBeCloseTo(0.0333333333, 6)
  })

  it('tick rail: x208/1280, tick height 12/720 (y275–287)', () => {
    expect(TICK_X_FRAC).toBeCloseTo(0.1625, 6)
    expect(TICK_H_FRAC).toBeCloseTo(0.0166666667, 6)
  })

  it('text-row chrome from ref frame t=180.1s at 1920×1080', () => {
    // Header label row above lane 1: glyph x315–350/y406–445, text x364, row top y412.
    expect(HEADER_ROW_Y_FRAC).toBeCloseTo(412 / 1080, 6)
    expect(HEADER_ROW_X_FRAC).toBeCloseTo(364 / 1920, 6)
    expect(HEADER_ICON_X_FRAC).toBeCloseTo(315 / 1920, 6)
    expect(HEADER_ICON_Y_FRAC).toBeCloseTo(406 / 1080, 6)
    // Footer row: teal chip 36×45 at (326,856), text x392, row top y868.
    expect(FOOTER_CHIP_X_FRAC).toBeCloseTo(326 / 1920, 6)
    expect(FOOTER_CHIP_Y_FRAC).toBeCloseTo(856 / 1080, 6)
    expect(FOOTER_CHIP_W_FRAC).toBeCloseTo(36 / 1920, 6)
    expect(FOOTER_CHIP_H_FRAC).toBeCloseTo(45 / 1080, 6)
    expect(FOOTER_ROW_Y_FRAC).toBeCloseTo(868 / 1080, 6)
    expect(FOOTER_ROW_X_FRAC).toBeCloseTo(392 / 1920, 6)
    // 26–28px label class at 1920 scale, left-aligned inside the tick rail.
    expect(LANE_LABEL_X_FRAC).toBeCloseTo(410 / 1920, 6)
  })

  it('container frame: dim warm outline x281–1652, y377–954', () => {
    expect(BOX_X_FRAC).toBeCloseTo(281 / 1920, 6)
    expect(BOX_Y_FRAC).toBeCloseTo(377 / 1080, 6)
    expect(BOX_W_FRAC).toBeCloseTo(1371 / 1920, 6)
    expect(BOX_H_FRAC).toBeCloseTo(577 / 1080, 6)
  })

  it('ambience washes: band 1.6× bar height, core 0.7×, inset 38px at 1920 (ref t=180.1s)', () => {
    expect(WASH_BAND_H_FACTOR).toBeCloseTo(1.6, 6)
    expect(WASH_CORE_H_FACTOR).toBeCloseTo(0.7, 6)
    expect(WASH_RIGHT_INSET_FRAC).toBeCloseTo(38 / 1920, 6)
  })
})

describe('milestoneLanesLayout — resolved geometry', () => {
  it('resolves the measured seed to exact px on the 1920×1080 canvas', () => {
    const layout = milestoneLanesLayout(data)

    // Lane tops: 525 + i×75 (350/720 and 50/720 are exact at 1080).
    const [lane1, lane2, lane3, lane4] = layout.lanes
    expect(lane1.y).toBeCloseTo(525, 6)
    expect(lane2.y).toBeCloseTo(600, 6)
    expect(lane3.y).toBeCloseTo(675, 6)
    expect(lane4.y).toBeCloseTo(750, 6)

    // Lane 1: red bar offset right, 63.4–83.6%w, tall (35px at 720 → 52.5).
    expect(lane1.bars[0].x).toBeCloseTo(1217.28, 6)
    expect(lane1.bars[0].w).toBeCloseTo(387.84, 6)
    expect(lane1.bars[0].h).toBeCloseTo(52.5, 6)
    expect(lane1.bars[0].tone).toBe('alt')
    // Lane 2: red bar left-anchored, 21.9–39.9%w, short (24px → 36).
    expect(lane2.bars[0].x).toBeCloseTo(420.48, 6)
    expect(lane2.bars[0].w).toBeCloseTo(345.6, 6)
    expect(lane2.bars[0].h).toBeCloseTo(36, 6)
    expect(lane2.bars[0].tone).toBe('alt')
    // Lane 3: amber bar offset right, 68.0–83.6%w, tall.
    expect(lane3.bars[0].x).toBeCloseTo(1305.6, 6)
    expect(lane3.bars[0].w).toBeCloseTo(299.52, 6)
    expect(lane3.bars[0].h).toBeCloseTo(52.5, 6)
    expect(lane3.bars[0].tone).toBe('accent')
    // Lane 4: amber long bar left-anchored, 21.9–74.1%w, short.
    expect(lane4.bars[0].x).toBeCloseTo(420.48, 6)
    expect(lane4.bars[0].w).toBeCloseTo(1002.24, 6)
    expect(lane4.bars[0].h).toBeCloseTo(36, 6)
    expect(lane4.bars[0].tone).toBe('accent')
  })

  it('resolves the pop state: rail-anchored sweep to each bar\'s final right edge', () => {
    const layout = milestoneLanesLayout(data)

    // The rail anchors every pop at x208/1280 → 312px; the sweep spans to the
    // bar's settled right edge (ref frame t=180.1s caught lane 1 mid-sweep
    // at [~322,1604]@1080 — the same wide state).
    const [lane1, lane2, lane3, lane4] = layout.lanes
    for (const lane of layout.lanes) {
      expect(lane.bars[0].popX).toBeCloseTo(312, 6)
    }
    expect(lane1.bars[0].popW).toBeCloseTo(1217.28 + 387.84 - 312, 6)
    expect(lane2.bars[0].popW).toBeCloseTo(420.48 + 345.6 - 312, 6)
    expect(lane3.bars[0].popW).toBeCloseTo(1305.6 + 299.52 - 312, 6)
    expect(lane4.bars[0].popW).toBeCloseTo(420.48 + 1002.24 - 312, 6)
  })

  it('resolves the left-edge tick rail, one tick per lane centered on its tallest bar', () => {
    const layout = milestoneLanesLayout(data)

    expect(layout.ticks).toHaveLength(4)
    // x208/1280 → 312px exactly; tick height 12/720 → 18px.
    for (const tick of layout.ticks) {
      expect(tick.x).toBeCloseTo(312, 6)
      expect(tick.h).toBeCloseTo(18, 6)
    }
    // Centers: lane top + half the bar height (tall 52.5 / short 36).
    expect(layout.ticks[0].y).toBeCloseTo(551.25, 6)
    expect(layout.ticks[1].y).toBeCloseTo(618, 6)
    expect(layout.ticks[2].y).toBeCloseTo(701.25, 6)
    expect(layout.ticks[3].y).toBeCloseTo(768, 6)
  })

  it('resolves the container frame to measured px', () => {
    const layout = milestoneLanesLayout(data)
    expect(layout.box.x).toBeCloseTo(281, 6)
    expect(layout.box.y).toBeCloseTo(377, 6)
    expect(layout.box.w).toBeCloseTo(1371, 6)
    expect(layout.box.h).toBeCloseTo(577, 6)
  })

  it('maps the two-phase choreography: bar k pops on 2k−1, re-proportions on 2k, closing beat last', () => {
    const layout = milestoneLanesLayout(data)

    // Pop clicks are odd (one per bar in data order), settle clicks follow.
    const popClicks = layout.lanes.flatMap((lane) => lane.bars.map((bar) => bar.click))
    const settleClicks = layout.lanes.flatMap((lane) => lane.bars.map((bar) => bar.settleClick))
    expect(popClicks).toEqual([1, 3, 5, 7])
    expect(settleClicks).toEqual([2, 4, 6, 8])
    // A label rides its lane's pop click.
    expect(layout.lanes.map((lane) => lane.firstClick)).toEqual([1, 3, 5, 7])
    // 4 bars × 2 phases + 1 closing beat = 9 native v-clicks.
    expect(layout.clickCount).toBe(9)
  })

  it('honors a custom viewBox', () => {
    const layout = milestoneLanesLayout(data, { width: 1280, height: 720 })

    expect(layout.viewBox).toEqual({ width: 1280, height: 720 })
    expect(layout.lanes[0].y).toBeCloseTo(350, 6) // y350 at native 720
    expect(layout.lanes[0].bars[0].x).toBeCloseTo(0.634 * 1280, 6)
    expect(layout.lanes[0].bars[0].popX).toBeCloseTo(208, 6)
    expect(layout.ticks[0].x).toBeCloseTo(208, 6)
    expect(layout.box.x).toBeCloseTo(281 / 1920 * 1280, 6)
    expect(layout.box.y).toBeCloseTo(377 / 1080 * 720, 6)
    expect(layout.clickCount).toBe(9)
  })

  it('is deterministic for the same inputs', () => {
    expect(milestoneLanesLayout(data)).toEqual(milestoneLanesLayout(data))
  })

  it('validates data instead of rendering blank', () => {
    expect(() => milestoneLanesLayout({ ...data, lanes: [] })).toThrow(RangeError)
    expect(() => milestoneLanesLayout({ ...data, lanes: [{ id: 'x', bars: [] }] })).toThrow(RangeError)
    // A bar running past the right edge — a typo like 0.83 + 0.56 — throws.
    expect(() => milestoneLanesLayout({ ...data, lanes: [{ id: 'x', bars: [{ xFrac: 0.83, wFrac: 0.56, tone: 'accent' }] }] })).toThrow(RangeError)
    // A bar at or left of the tick rail has no sweep to pop.
    expect(() => milestoneLanesLayout({ ...data, lanes: [{ id: 'x', bars: [{ xFrac: 0.05, wFrac: 0.05, tone: 'accent' }] }] })).toThrow(RangeError)
    expect(() => milestoneLanesLayout({ ...data, y0Frac: 1.2 })).toThrow(RangeError)
    expect(() => milestoneLanesLayout({ ...data, lanePitchFrac: 0 })).toThrow(RangeError)
    expect(() => milestoneLanesLayout({ ...data, barHFrac: 0 })).toThrow(RangeError)
  })
})

describe('MilestoneLanes component', () => {
  it('renders the measured canvas with an accessible name', () => {
    const wrapper = mountLanes()
    const svg = wrapper.find('svg.milestonelanes')

    expect(svg.exists()).toBe(true)
    expect(svg.attributes('viewBox')).toBe('0 0 1920 1080')
    expect(svg.attributes('role')).toBe('img')
    expect(svg.attributes('aria-label')).toBe('4-lane milestone chart')
  })

  it('consumes 9 click indices: pop clicks 1/3/5/7 for bars, labels riding pops, closing beat 9', () => {
    mountLanes({ headerLabel: 'WHERE THE WORK GOES', footerLabel: 'YOUR JUDGEMENT DECIDES THE DESIGN' })

    // 10 bound elements: 4 bars (pop clicks), 4 lane labels (riding pops),
    // tick group + footer group (both on the closing beat). The header row
    // is static chrome and binds no v-click.
    expect(clickBindings).toHaveLength(10)
    const barClicks = clickBindings.filter((b) => b.tag === 'rect').map((b) => b.value)
    expect(barClicks).toEqual([1, 3, 5, 7])
    const labelClicks = clickBindings.filter((b) => b.tag === 'text').map((b) => b.value)
    expect(labelClicks).toEqual([1, 3, 5, 7])
    const groupClicks = clickBindings.filter((b) => b.tag === 'g').map((b) => b.value)
    expect(groupClicks).toEqual([9, 9])
  })

  it('renders settled geometry by default (no Slidev clicks context)', () => {
    const wrapper = mountLanes()
    const bars = wrapper.findAll('rect.sf-ml-bar')

    // Outside Slidev every bar renders its measured seed geometry.
    expect(Number(bars[0].attributes('x'))).toBeCloseTo(1217.28, 6)
    expect(Number(bars[0].attributes('width'))).toBeCloseTo(387.84, 6)
    expect(Number(bars[1].attributes('x'))).toBeCloseTo(420.48, 6)
    expect(Number(bars[3].attributes('width'))).toBeCloseTo(1002.24, 6)
  })

  it('rehearses the two-phase choreography against a live clicks context', async () => {
    const clicks = fakeClicksContext(5)
    const wrapper = mountLanes({}, clicks)
    const bars = () => wrapper.findAll('rect.sf-ml-bar')

    // At current=5: bars 1–2 settled, bar 3 popped wide (rail-anchored sweep
    // to its final right edge), bar 4 hidden at the rail.
    expect(Number(bars()[0].attributes('x'))).toBeCloseTo(1217.28, 6)
    expect(Number(bars()[1].attributes('x'))).toBeCloseTo(420.48, 6)
    expect(Number(bars()[2].attributes('x'))).toBeCloseTo(312, 6)
    expect(Number(bars()[2].attributes('width'))).toBeCloseTo(1293.12, 6)
    expect(Number(bars()[3].attributes('width'))).toBe(0)
    expect(Number(bars()[3].attributes('x'))).toBeCloseTo(312, 6)

    // Advance to the settle click: bar 3 re-proportions to the seed width.
    clicks.value = { current: 6 }
    await wrapper.vm.$nextTick()
    expect(Number(bars()[2].attributes('x'))).toBeCloseTo(1305.6, 6)
    expect(Number(bars()[2].attributes('width'))).toBeCloseTo(299.52, 6)

    // Backward navigation (settle 6 → pop 5) pops bar 3 wide again — instantly.
    clicks.value = { current: 5 }
    await wrapper.vm.$nextTick()
    expect(Number(bars()[2].attributes('x'))).toBeCloseTo(312, 6)
    expect(Number(bars()[2].attributes('width'))).toBeCloseTo(1293.12, 6)
    for (const bar of bars()) {
      expect(bar.classes()).toContain('sf-ml-instant')
    }

    // Forward again: transitions resume.
    clicks.value = { current: 6 }
    await wrapper.vm.$nextTick()
    for (const bar of bars()) {
      expect(bar.classes()).not.toContain('sf-ml-instant')
    }
  })

  it('renders one bar per lane at its measured offset with statusAmber tones — verbatim, no palette prop', () => {
    const wrapper = mountLanes()
    const bars = wrapper.findAll('rect.sf-ml-bar')

    expect(bars).toHaveLength(4)
    // alt = accentAlt red, accent = amber; the component's statusAmber base
    // resolves these without any palette prop.
    expect(bars[0].attributes('fill')).toBe('#e5413f')
    expect(bars[1].attributes('fill')).toBe('#e5413f')
    expect(bars[2].attributes('fill')).toBe('#f7ba20')
    expect(bars[3].attributes('fill')).toBe('#f7ba20')
    expect(Number(bars[0].attributes('y'))).toBeCloseTo(525, 6)
    expect(Number(bars[3].attributes('y'))).toBeCloseTo(750, 6)
  })

  it('renders the lane labels inside the tick rail at 28px, riding their lane pop clicks', () => {
    const wrapper = mountLanes()
    const labels = wrapper.findAll('text.sf-ml-label')

    expect(labels.map((l) => l.text())).toEqual(['STREAMING', 'PIPELINE', 'QUALITY', 'LAKEHOUSE'])
    // Left-aligned at the measured x410 (inside the rail), 28px at 1920.
    expect(Number(labels[0].attributes('x'))).toBeCloseTo(410, 6)
    expect(labels[0].attributes('text-anchor')).toBeUndefined()
    expect(Number(labels[0].attributes('font-size'))).toBeCloseTo(28, 6)
  })

  it('renders the measured header label row as static chrome', () => {
    const wrapper = mountLanes({ headerLabel: 'WHERE THE WORK GOES' })
    const header = wrapper.find('.sf-ml-header')

    expect(header.exists()).toBe(true)
    expect(header.find('text').text()).toBe('WHERE THE WORK GOES')
    const text = header.find('text')
    expect(Number(text.attributes('x'))).toBeCloseTo(364, 6)
    expect(Number(text.attributes('y'))).toBeCloseTo(412, 6)
    expect(Number(text.attributes('font-size'))).toBeCloseTo(28, 6)
    expect(text.attributes('fill')).toBe('#a6a8ae') // palette subtext
    // Amber leading glyph, centered in its measured box.
    const icon = header.find('.sf-ml-header-icon')
    expect(icon.attributes('stroke')).toBe('#f7ba20')
    expect(icon.attributes('transform')).toBe('translate(315 406) scale(2)')
    // Static chrome: no v-click binding anywhere in the header row.
    expect(clickBindings.find((b) => b.value !== undefined && b.tag === 'g' && b.value !== 9)).toBeUndefined()
  })

  it('omits the header/footer rows when no label is provided', () => {
    const wrapper = mountLanes()
    expect(wrapper.find('.sf-ml-header').exists()).toBe(false)
    expect(wrapper.find('.sf-ml-footer').exists()).toBe(false)
  })

  it('renders the footer row on the closing beat with the teal chip glyph', () => {
    const wrapper = mountLanes({ footerLabel: 'YOUR JUDGEMENT DECIDES THE DESIGN' })
    const footer = wrapper.find('.sf-ml-footer')

    expect(footer.exists()).toBe(true)
    const text = footer.find('text')
    expect(text.text()).toBe('YOUR JUDGEMENT DECIDES THE DESIGN')
    expect(Number(text.attributes('x'))).toBeCloseTo(392, 6)
    expect(Number(text.attributes('y'))).toBeCloseTo(868, 6)
    expect(Number(text.attributes('font-size'))).toBeCloseTo(26, 6)
    expect(text.attributes('fill')).toBe('#a6a8ae')
    // Teal chip glyph centered in the measured 36×45 box at (326,856).
    const chip = footer.find('.sf-ml-chip-icon')
    expect(chip.attributes('stroke')).toBe('#1cd797')
    expect(chip.attributes('transform')).toBe('translate(320 854.5) scale(2)')
    // The footer rides the closing beat (click 9), same as the tick markers.
    const footerClick = clickBindings.find((b) => b.tag === 'g' && b.value === 9)
    expect(footerClick).toBeDefined()
  })

  it('renders the dim warm container frame', () => {
    const wrapper = mountLanes()
    const box = wrapper.find('rect.sf-ml-box')

    expect(box.exists()).toBe(true)
    expect(Number(box.attributes('x'))).toBeCloseTo(281, 6)
    expect(Number(box.attributes('y'))).toBeCloseTo(377, 6)
    expect(Number(box.attributes('width'))).toBeCloseTo(1371, 6)
    expect(Number(box.attributes('height'))).toBeCloseTo(577, 6)
    expect(box.attributes('stroke')).toBe('#f7ba20')
    expect(box.attributes('stroke-opacity')).toBe('0.15')
  })

  it('renders the amber tick markers on the closing beat', () => {
    const wrapper = mountLanes()
    const ticks = wrapper.findAll('.sf-ml-ticks line')

    expect(ticks).toHaveLength(4)
    for (const tick of ticks) {
      expect(tick.attributes('stroke')).toBe('#f7ba20')
      expect(Number(tick.attributes('x1'))).toBeCloseTo(312, 6)
    }
  })

  it('carries the two-phase transitions, instant backward snap, and reduced-motion block in its styles', () => {
    mountLanes()

    const css = Array.from(document.querySelectorAll('style'))
      .map((tag) => tag.textContent ?? '')
      .join('\n')

    // Pop: 250ms rail-anchored sweep on x/width.
    const barRule = css.match(/\.sf-ml-bar[^{]*\{[^}]*\}/)?.[0] ?? ''
    expect(barRule).toContain('250ms')
    expect(barRule).toContain('x 250ms')
    expect(barRule).toContain('width 250ms')
    // Settle: 500ms re-proportion, taken from the destination state.
    const settledRule = css.match(/\.sf-ml-bar\.sf-ml-settled[^{]*\{[^}]*\}/)?.[0] ?? ''
    expect(settledRule).toContain('500ms')
    // Instant: backward navigation snaps with zero animation.
    const instantRule = css.match(/\.sf-ml-bar\.sf-ml-instant[^{]*\{[^}]*\}/)?.[0] ?? ''
    expect(instantRule).toContain('transition: none')
    expect(css).toContain('150ms') // label/tick/footer fade
    expect(css).toContain('prefers-reduced-motion') // transitions disabled, instant state
  })

  it('renders the two-tone header: white title + chrome-green titleAccent tail', () => {
    const wrapper = mountLanes({ title: 'DATA', titleAccent: 'ROADMAP' })
    const header = wrapper.find('.sf-chrome-title')

    expect(header.text()).toContain('DATA')
    expect(header.html()).toContain('#66fb00')
  })

  it('renders the dim ambience layer: plate across the chart field, tone washes per lane', () => {
    const wrapper = mountLanes()
    const ambience = wrapper.find('g.sf-ml-ambience')

    expect(ambience.exists()).toBe(true)
    expect(ambience.attributes('aria-hidden')).toBe('true')
    // Plate: the measured container box filled with the ref's neutral dim tone.
    const plate = wrapper.find('rect.sf-ml-plate')
    expect(plate.attributes('fill')).toBe('#0f0e11')
    expect(Number(plate.attributes('x'))).toBeCloseTo(281, 6)
    expect(Number(plate.attributes('width'))).toBeCloseTo(1371, 6)
    // One band + one core per lane, from the label rail (x410) to 38px short
    // of the frame's right edge (281 + 1371 − 410 − 38 = 1204 wide).
    const bands = wrapper.findAll('rect.sf-ml-wash')
    const cores = wrapper.findAll('rect.sf-ml-wash-core')
    expect(bands).toHaveLength(4)
    expect(cores).toHaveLength(4)
    for (const rect of [...bands, ...cores]) {
      expect(Number(rect.attributes('x'))).toBeCloseTo(410, 6)
      expect(Number(rect.attributes('width'))).toBeCloseTo(1204, 6)
    }
    // Heights are factors of the lane's own bar height (tall 52.5 / short 36).
    expect(Number(bands[0].attributes('height'))).toBeCloseTo(1.6 * 52.5, 6)
    expect(Number(bands[1].attributes('height'))).toBeCloseTo(1.6 * 36, 6)
    expect(Number(cores[0].attributes('height'))).toBeCloseTo(0.7 * 52.5, 6)
    // Vertically centered on the bar: lane 1 bar center 551.25.
    expect(Number(bands[0].attributes('y'))).toBeCloseTo(551.25 - 1.6 * 52.5 / 2, 6)
    expect(Number(cores[0].attributes('y'))).toBeCloseTo(551.25 - 0.7 * 52.5 / 2, 6)
    // Washes take their lane's bar tone via the shared barColor mapping.
    expect(bands[0].attributes('fill')).toBe('#e5413f')
    expect(bands[1].attributes('fill')).toBe('#e5413f')
    expect(bands[2].attributes('fill')).toBe('#f7ba20')
    expect(bands[3].attributes('fill')).toBe('#f7ba20')
    expect(bands[0].attributes('fill-opacity')).toBe('0.115')
    expect(cores[0].attributes('fill-opacity')).toBe('0.13')
  })

  it('binds no v-click on the ambience layer — static chrome like the frame', () => {
    mountLanes({ footerLabel: 'YOUR JUDGEMENT DECIDES THE DESIGN' })
    // Still exactly the 10 choreographed bindings (4 bars, 4 labels, 2 groups).
    expect(clickBindings).toHaveLength(10)
    expect(clickBindings.every((b) => b.tag !== 'g' || b.value === 9)).toBe(true)
  })
  it('surfaces the layout RangeError instead of rendering blank', () => {
    expect(() => mountLanes({ lanes: [{ id: 'x', bars: [{ xFrac: 0.9, wFrac: 0.5, tone: 'accent' }] }] })).toThrow(RangeError)
  })
})
