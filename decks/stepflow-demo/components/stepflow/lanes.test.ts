// @vitest-environment happy-dom
import { describe, expect, it } from 'vitest'
import { mount } from '@vue/test-utils'
import MilestoneLanes from '../MilestoneLanes.vue'
import {
  BAR_H_FRAC,
  BAR_H_SHORT_FRAC,
  LANE_PITCH_FRAC,
  LANE_Y0_FRAC,
  TICK_H_FRAC,
  TICK_X_FRAC,
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
type LanesProps = { lanes: Lane[]; y0Frac: number; lanePitchFrac: number; barHFrac: number; title?: string; titleAccent?: string }

function mountLanes(overrides: Partial<LanesProps> = {}) {
  clickBindings.length = 0
  return mount(MilestoneLanes, {
    props: {
      lanes,
      y0Frac: LANE_Y0_FRAC,
      lanePitchFrac: LANE_PITCH_FRAC,
      barHFrac: BAR_H_FRAC,
      ...overrides,
    },
    global: { directives: { click: clickStub } },
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

  it('maps the click choreography: one click per bar in data order, ticks last', () => {
    const layout = milestoneLanesLayout(data)

    const clicks = layout.lanes.flatMap((lane) => lane.bars.map((bar) => bar.click))
    expect(clicks).toEqual([1, 2, 3, 4])
    expect(layout.lanes.map((lane) => lane.firstClick)).toEqual([1, 2, 3, 4])
    // 4–5 native v-clicks: one per lane bar, optional 5th for the markers.
    expect(layout.clickCount).toBe(5)
  })

  it('honors a custom viewBox', () => {
    const layout = milestoneLanesLayout(data, { width: 1280, height: 720 })

    expect(layout.viewBox).toEqual({ width: 1280, height: 720 })
    expect(layout.lanes[0].y).toBeCloseTo(350, 6) // y350 at native 720
    expect(layout.lanes[0].bars[0].x).toBeCloseTo(0.634 * 1280, 6)
    expect(layout.ticks[0].x).toBeCloseTo(208, 6)
  })

  it('is deterministic for the same inputs', () => {
    expect(milestoneLanesLayout(data)).toEqual(milestoneLanesLayout(data))
  })

  it('validates data instead of rendering blank', () => {
    expect(() => milestoneLanesLayout({ ...data, lanes: [] })).toThrow(RangeError)
    expect(() => milestoneLanesLayout({ ...data, lanes: [{ id: 'x', bars: [] }] })).toThrow(RangeError)
    // A bar running past the right edge — a typo like 0.83 + 0.56 — throws.
    expect(() => milestoneLanesLayout({ ...data, lanes: [{ id: 'x', bars: [{ xFrac: 0.83, wFrac: 0.56, tone: 'accent' }] }] })).toThrow(RangeError)
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

  it('consumes 5 click indices: bars 1-4, labels riding their lane bar, ticks last', () => {
    mountLanes()

    // 9 bound elements — 4 bars, 4 lane labels (each riding its lane's bar
    // click), 1 tick group — across 5 distinct click indices.
    expect(clickBindings).toHaveLength(9)
    const barClicks = clickBindings.filter((b) => b.tag === 'rect').map((b) => b.value)
    expect(barClicks).toEqual([1, 2, 3, 4])
    const tickClick = clickBindings.find((b) => b.tag === 'g')
    expect(tickClick?.value).toBe(5)
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
    // Offsets are data: right-offset lane 1, left-anchored lane 2.
    expect(Number(bars[0].attributes('x'))).toBeCloseTo(1217.28, 6)
    expect(Number(bars[0].attributes('width'))).toBeCloseTo(387.84, 6)
    expect(Number(bars[1].attributes('x'))).toBeCloseTo(420.48, 6)
    expect(Number(bars[1].attributes('width'))).toBeCloseTo(345.6, 6)
    expect(Number(bars[3].attributes('width'))).toBeCloseTo(1002.24, 6)
    expect(Number(bars[0].attributes('y'))).toBeCloseTo(525, 6)
    expect(Number(bars[3].attributes('y'))).toBeCloseTo(750, 6)
  })

  it('renders the lane labels left of the tick rail, riding their lane bar clicks', () => {
    const wrapper = mountLanes()
    const labels = wrapper.findAll('text.sf-ml-label')

    expect(labels.map((l) => l.text())).toEqual(['STREAMING', 'PIPELINE', 'QUALITY', 'LAKEHOUSE'])
    expect(Number(labels[0].attributes('x'))).toBeCloseTo(312 - 24, 6)
    const labelClicks = clickBindings.filter((b) => b.tag === 'text').map((b) => b.value)
    // The four label texts bind clicks 1–4 (the header text carries no v-click).
    expect(labelClicks).toEqual([1, 2, 3, 4])
  })

  it('renders the amber tick markers on the final click', () => {
    const wrapper = mountLanes()
    const ticks = wrapper.findAll('.sf-ml-ticks line')

    expect(ticks).toHaveLength(4)
    for (const tick of ticks) {
      expect(tick.attributes('stroke')).toBe('#f7ba20')
      expect(Number(tick.attributes('x1'))).toBeCloseTo(312, 6)
    }
  })

  it('carries the width reveal, hidden-state snap, and reduced-motion block in its rendered styles', () => {
    mountLanes()

    const css = Array.from(document.querySelectorAll('style'))
      .map((tag) => tag.textContent ?? '')
      .join('\n')

    // Forward reveal: 300ms width-grow transition on the revealed state.
    const barRule = css.match(/\.sf-ml-bar[^{]*\{[^}]*\}/)?.[0] ?? ''
    expect(barRule).toContain('300ms')
    expect(barRule).toContain('transform-origin: left center')
    // Hidden state: collapsed to the left edge, transition:none — backward nav snaps.
    const hiddenRule = css.match(/\.sf-ml-bar\.slidev-vclick-hidden[^{]*\{[^}]*\}/)?.[0] ?? ''
    expect(hiddenRule).toContain('transform: scaleX(0)')
    expect(hiddenRule).toContain('transition: none')
    expect(css).toContain('150ms') // label/tick fade
    expect(css).toContain('prefers-reduced-motion') // transitions disabled, instant state
  })

  it('renders the two-tone header: white title + chrome-green titleAccent tail', () => {
    const wrapper = mountLanes({ title: 'DATA', titleAccent: 'ROADMAP' })
    const header = wrapper.find('text.header')

    expect(header.text()).toContain('DATA')
    expect(header.html()).toContain('#66fb00')
  })

  it('surfaces the layout RangeError instead of rendering blank', () => {
    expect(() => mountLanes({ lanes: [{ id: 'x', bars: [{ xFrac: 0.9, wFrac: 0.5, tone: 'accent' }] }] })).toThrow(RangeError)
  })
})
