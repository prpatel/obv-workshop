// @vitest-environment happy-dom
import { describe, expect, it } from 'vitest'
import { mount } from '@vue/test-utils'
import { ref } from 'vue'
import { injectionClicksContext } from '@slidev/client/constants'
import MilestoneLanes from '../MilestoneLanes.vue'
import {
  BAR_TEXT_FILL,
  BAR_TEXT_INSET_PX,
  BAR_TEXT_SIZE_PX,
  DIAMOND_GLOW_OPACITY,
  DIAMOND_GLOW_RADIUS_PX,
  DIAMOND_INNER_SIDE_PX,
  DIAMOND_SIDE_PX,
  DIAMOND_STROKE_PX,
  FOOTER_CHIP_H_FRAC,
  FOOTER_CHIP_W_FRAC,
  FOOTER_CHIP_X_FRAC,
  FOOTER_CHIP_Y_FRAC,
  FOOTER_ROW_SIZE_PX,
  FOOTER_ROW_X_FRAC,
  FOOTER_ROW_Y_FRAC,
  HEADER_ICON_X_FRAC,
  HEADER_ICON_Y_FRAC,
  HEADER_ROW_SIZE_PX,
  HEADER_ROW_X_FRAC,
  HEADER_ROW_Y_FRAC,
  LANE_LABEL_SIZE_PX,
  LANE_LABEL_TRACKING_EM,
  LANE_LABEL_X_FRAC,
  PLATE_FILL,
  PLATE_H_FRAC,
  PLATE_TOP_FILL,
  PLATE_W_FRAC,
  PLATE_X_FRAC,
  PLATE_Y_FRAC,
  milestoneLanesLayout,
  type Lane,
  type MilestoneDiamond,
} from './lanes'

/**
 * The demo seed mirrors the slide data — the true settled reference frame
 * (clip 6600 ms, exact-trace sheet art_kYBddwt9) at native 2560×1440 →
 * 1920×1080. Lanes are in REVEAL order (the recording's beat order):
 * bar 2 sweeps, bar 1 pops at final width, bar 4 grows ease-out, bar 3
 * expands center-out; the grid fracs (y0Frac/pitch/barHFrac) are the
 * fallback for lanes without an explicit yFrac.
 */
const lanes: Lane[] = [
  {
    id: 'pipeline',
    yFrac: 597 / 1080,
    bars: [{ xFrac: 420 / 1920, wFrac: 343 / 1920, hFrac: 35 / 1080, tone: 'alt', reveal: 'sweep', sweepToFrac: 1511 / 1920 }],
  },
  {
    id: 'streaming',
    label: 'STREAMING',
    labelClick: 1,
    yFrac: 525 / 1080,
    bars: [{ xFrac: 1218 / 1920, wFrac: 386 / 1920, hFrac: 50 / 1080, tone: 'alt', reveal: 'pop', text: 'HARDER TO THE ASSISTANT', textLength: 292 }],
  },
  {
    id: 'lakehouse',
    yFrac: 766 / 1080,
    bars: [{ xFrac: 420 / 1920, wFrac: 1003 / 1920, hFrac: 36 / 1080, tone: 'accent', reveal: 'grow' }],
  },
  {
    id: 'quality',
    label: 'QUALITY LANE',
    yFrac: 694 / 1080,
    bars: [{ xFrac: 1307 / 1920, wFrac: 297 / 1920, hFrac: 51 / 1080, tone: 'accent', reveal: 'center', text: 'HARDER TO REPLACE', textLength: 240 }],
  },
]
const diamonds: MilestoneDiamond[] = [
  { id: 'streaming-milestone', centerXFrac: 347 / 1920, centerYFrac: 551 / 1080, tone: 'alt', click: 1 },
  { id: 'quality-milestone-outer', centerXFrac: 347 / 1920, centerYFrac: 719 / 1080, tone: 'accent', click: 4 },
  { id: 'quality-milestone-inner', centerXFrac: 347 / 1920, centerYFrac: 719 / 1080, tone: 'accent', click: 8, inner: true },
]
const data = {
  lanes,
  diamonds,
  y0Frac: 0.4861111111,
  lanePitchFrac: 0.0694444444,
  barHFrac: 50 / 1080,
}

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
  diamonds: MilestoneDiamond[]
  y0Frac: number
  lanePitchFrac: number
  barHFrac: number
  title?: string
  titleAccent?: string
  titleTextLength?: number
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
      diamonds,
      y0Frac: data.y0Frac,
      lanePitchFrac: data.lanePitchFrac,
      barHFrac: data.barHFrac,
      ...overrides,
    },
    global: {
      directives: { click: clickStub },
      ...(clicks ? { provide: { [injectionClicksContext as unknown as string]: clicks } } : {}),
    },
  })
}

describe('measured constants — hand-computed to 1e-6', () => {
  it('milestone diamonds: 38px outer core, 21px inner ring, 3.5px stroke, 52px glow', () => {
    expect(DIAMOND_SIDE_PX).toBeCloseTo(38, 6)
    expect(DIAMOND_INNER_SIDE_PX).toBeCloseTo(21, 6)
    expect(DIAMOND_STROKE_PX).toBeCloseTo(3.5, 6)
    expect(DIAMOND_GLOW_RADIUS_PX).toBeCloseTo(26, 6)
    expect(DIAMOND_GLOW_OPACITY).toBeCloseTo(0.22, 6)
  })

  it('on-bar captions: 33px class, 26px inset, near-black fill', () => {
    expect(BAR_TEXT_SIZE_PX).toBeCloseTo(33, 6)
    expect(BAR_TEXT_INSET_PX).toBeCloseTo(26, 6)
    expect(BAR_TEXT_FILL).toBe('#0a0202')
  })

  it('lane labels: 35px tracked mono left-aligned at x404', () => {
    expect(LANE_LABEL_X_FRAC).toBeCloseTo(404 / 1920, 6)
    expect(LANE_LABEL_SIZE_PX).toBeCloseTo(35, 6)
    expect(LANE_LABEL_TRACKING_EM).toBeCloseTo(0.4, 6)
  })

  it('text-row chrome from the true settled frame at 1920×1080', () => {
    // Header label row above lane 1: glyph x315–350/y406–445, text x364, row top y412.
    expect(HEADER_ROW_Y_FRAC).toBeCloseTo(412 / 1080, 6)
    expect(HEADER_ROW_X_FRAC).toBeCloseTo(364 / 1920, 6)
    expect(HEADER_ICON_X_FRAC).toBeCloseTo(315 / 1920, 6)
    expect(HEADER_ICON_Y_FRAC).toBeCloseTo(406 / 1080, 6)
    expect(HEADER_ROW_SIZE_PX).toBeCloseTo(34, 6)
    // Footer row: teal chip 36×45 at (326,856), text x392, row top y868.
    expect(FOOTER_CHIP_X_FRAC).toBeCloseTo(326 / 1920, 6)
    expect(FOOTER_CHIP_Y_FRAC).toBeCloseTo(856 / 1080, 6)
    expect(FOOTER_CHIP_W_FRAC).toBeCloseTo(36 / 1920, 6)
    expect(FOOTER_CHIP_H_FRAC).toBeCloseTo(45 / 1080, 6)
    expect(FOOTER_ROW_Y_FRAC).toBeCloseTo(868 / 1080, 6)
    expect(FOOTER_ROW_X_FRAC).toBeCloseTo(392 / 1920, 6)
    expect(FOOTER_ROW_SIZE_PX).toBeCloseTo(26, 6)
  })

  it('ambience: a bounded dim plate behind the chart zone, brightening toward the top', () => {
    // The plate spans the chart zone (x260–1660, y372–960 at 1080) — outside
    // it the slide field is pure black (ref-sampled at the true settled frame).
    expect(PLATE_X_FRAC).toBeCloseTo(260 / 1920, 6)
    expect(PLATE_Y_FRAC).toBeCloseTo(372 / 1080, 6)
    expect(PLATE_W_FRAC).toBeCloseTo(1400 / 1920, 6)
    expect(PLATE_H_FRAC).toBeCloseTo(588 / 1080, 6)
    expect(PLATE_FILL).toBe('#0f0e11')
    expect(PLATE_TOP_FILL).toBe('#19181d')
  })
})

describe('milestoneLanesLayout — resolved geometry', () => {
  it('resolves the measured bars to exact px on the 1920×1080 canvas', () => {
    const layout = milestoneLanesLayout(data)

    // Non-uniform lane tops (data yFrac): 597/525/766/694 in reveal order.
    const [bar2, bar1, bar4, bar3] = layout.lanes.map((lane) => lane.bars[0])
    // Bar 2 (pipeline): red left-anchored x420–763, y597, 35px tall, sweep.
    expect(bar2.x).toBeCloseTo(420, 6)
    expect(bar2.y).toBeCloseTo(597, 6)
    expect(bar2.w).toBeCloseTo(343, 6)
    expect(bar2.h).toBeCloseTo(35, 6)
    expect(bar2.tone).toBe('alt')
    expect(bar2.reveal).toBe('sweep')
    // Bar 1 (streaming): red right-anchored x1218–1604, y525, 50px tall, pop.
    expect(bar1.x).toBeCloseTo(1218, 6)
    expect(bar1.y).toBeCloseTo(525, 6)
    expect(bar1.w).toBeCloseTo(386, 6)
    expect(bar1.h).toBeCloseTo(50, 6)
    expect(bar1.reveal).toBe('pop')
    // Bar 4 (lakehouse): amber long bar x420–1423, y766, 36px tall, grow.
    expect(bar4.x).toBeCloseTo(420, 6)
    expect(bar4.y).toBeCloseTo(766, 6)
    expect(bar4.w).toBeCloseTo(1003, 6)
    expect(bar4.h).toBeCloseTo(36, 6)
    expect(bar4.reveal).toBe('grow')
    // Bar 3 (quality): amber right-anchored x1307–1604, y694, 51px tall, center.
    expect(bar3.x).toBeCloseTo(1307, 6)
    expect(bar3.y).toBeCloseTo(694, 6)
    expect(bar3.w).toBeCloseTo(297, 6)
    expect(bar3.h).toBeCloseTo(51, 6)
    expect(bar3.reveal).toBe('center')
  })

  it('resolves per-style phase rects: sweep overshoots, pop holds, grow eases, center collapses mid-bar', () => {
    const layout = milestoneLanesLayout(data)
    const [bar2, bar1, bar4, bar3] = layout.lanes.map((lane) => lane.bars[0])

    // Sweep (bar 2): collapses at its left edge, pops to the x1511 overshoot,
    // settles at the measured seed.
    expect(bar2.hidden).toEqual({ x: 420, w: 0 })
    expect(bar2.popped).toEqual({ x: 420, w: 1511 - 420 })
    expect(bar2.settled).toEqual({ x: 420, w: 343 })
    // Pop (bar 1): the final rect throughout — the hidden state is a fade.
    expect(bar1.hidden).toEqual({ x: 1218, w: 386 })
    expect(bar1.popped).toEqual({ x: 1218, w: 386 })
    expect(bar1.settled).toEqual({ x: 1218, w: 386 })
    // Grow (bar 4): collapses at its left edge, pops straight to final width.
    // (1003 = 0.5223958333 x 1920 — compare numerically; floats don't toEqual.)
    expect(bar4.hidden.x).toBeCloseTo(420, 6)
    expect(bar4.hidden.w).toBe(0)
    expect(bar4.popped.x).toBeCloseTo(420, 6)
    expect(bar4.popped.w).toBeCloseTo(1003, 6)
    expect(bar4.settled.x).toBeCloseTo(420, 6)
    expect(bar4.settled.w).toBeCloseTo(1003, 6)
    // Center (bar 3): collapses at its centerline (1307 + 297/2), expands outward.
    expect(bar3.hidden).toEqual({ x: 1307 + 297 / 2, w: 0 })
    expect(bar3.popped).toEqual({ x: 1307, w: 297 })
    expect(bar3.settled).toEqual({ x: 1307, w: 297 })
  })

  it('resolves the milestone diamonds: measured centers, ring sides, strokes, glows', () => {
    const layout = milestoneLanesLayout(data)

    expect(layout.diamonds).toHaveLength(3)
    const [streaming, qualityOuter, qualityInner] = layout.diamonds
    // Lane 1: one red outer ring at (347,551), riding click 1.
    expect(streaming.cx).toBeCloseTo(347, 6)
    expect(streaming.cy).toBeCloseTo(551, 6)
    expect(streaming.side).toBeCloseTo(38, 6)
    expect(streaming.stroke).toBeCloseTo(3.5, 6)
    expect(streaming.glowRadius).toBeCloseTo(26, 6)
    expect(streaming.tone).toBe('alt')
    expect(streaming.inner).toBe(false)
    expect(streaming.click).toBe(1)
    // Lane 3: amber double ring at (347,719) — outer click 4, inner click 8.
    expect(qualityOuter.cx).toBeCloseTo(347, 6)
    expect(qualityOuter.cy).toBeCloseTo(719, 6)
    expect(qualityOuter.side).toBeCloseTo(38, 6)
    expect(qualityOuter.click).toBe(4)
    expect(qualityInner.side).toBeCloseTo(21, 6)
    expect(qualityInner.inner).toBe(true)
    expect(qualityInner.click).toBe(8)
  })

  it('maps the two-phase choreography in reveal order, closing beat last', () => {
    const layout = milestoneLanesLayout(data)

    // Reveal clicks are odd (one per bar in data order), settle clicks follow.
    const revealClicks = layout.lanes.flatMap((lane) => lane.bars.map((bar) => bar.click))
    const settleClicks = layout.lanes.flatMap((lane) => lane.bars.map((bar) => bar.settleClick))
    expect(revealClicks).toEqual([1, 3, 5, 7])
    expect(settleClicks).toEqual([2, 4, 6, 8])
    // Labels ride their lane's first beat unless labelClick overrides
    // (STREAMING brightens with the opening sweep, one beat before its bar).
    expect(layout.lanes.map((lane) => lane.labelClick)).toEqual([1, 1, 5, 7])
    // 4 bars × 2 phases + 1 closing beat = 9 native v-clicks.
    expect(layout.clickCount).toBe(9)
  })

  it('honors a custom viewBox (diamond geometry scales by width)', () => {
    const layout = milestoneLanesLayout(data, { width: 1280, height: 720 })

    expect(layout.viewBox).toEqual({ width: 1280, height: 720 })
    expect(layout.lanes[1].bars[0].x).toBeCloseTo(1218 / 1920 * 1280, 6)
    expect(layout.lanes[3].bars[0].y).toBeCloseTo(694 / 1080 * 720, 6)
    expect(layout.diamonds[0].side).toBeCloseTo(38 * 1280 / 1920, 6)
    expect(layout.diamonds[0].cx).toBeCloseTo(347 / 1920 * 1280, 6)
    expect(layout.diamonds[0].cy).toBeCloseTo(551 / 1080 * 720, 6)
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
    // A lane top outside the canvas throws.
    expect(() => milestoneLanesLayout({ ...data, lanes: [{ id: 'x', yFrac: 1.4, bars: [{ xFrac: 0.1, wFrac: 0.2, tone: 'accent' }] }] })).toThrow(RangeError)
    // A sweep overshoot ending left of the settled right edge has no pop.
    expect(() => milestoneLanesLayout({
      ...data,
      lanes: [{ id: 'x', bars: [{ xFrac: 0.5, wFrac: 0.2, tone: 'accent', reveal: 'sweep', sweepToFrac: 0.6 }] }],
    })).toThrow(RangeError)
    // A diamond center outside the canvas throws.
    expect(() => milestoneLanesLayout({ ...data, diamonds: [{ id: 'd', centerXFrac: 1.3, centerYFrac: 0.5, tone: 'alt', click: 1 }] })).toThrow(RangeError)
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

  it('consumes 10 click indices: bar groups on reveals, labels on their beats, diamonds on measured beats, footer last', () => {
    mountLanes({ headerLabel: 'WHERE THE WORK GOES', footerLabel: 'YOUR JUDGEMENT DECIDES THE DESIGN' })

    // 10 bound elements: 4 bar groups (reveals 1/3/5/7), 2 lane labels
    // (STREAMING on 1, QUALITY LANE on its bar's beat 7), 3 diamonds
    // (1/4/8), and the footer group on the closing beat 9. The header row
    // is static chrome and binds no v-click.
    expect(clickBindings).toHaveLength(10)
    const groupClicks = clickBindings.filter((b) => b.tag === 'g').map((b) => b.value)
    expect(groupClicks).toEqual([1, 3, 5, 7, 1, 4, 8, 9])
    const labelClicks = clickBindings.filter((b) => b.tag === 'text').map((b) => b.value)
    expect(labelClicks).toEqual([1, 7])
  })

  it('renders settled geometry by default (no Slidev clicks context)', () => {
    const wrapper = mountLanes()
    const bars = wrapper.findAll('rect.sf-ml-bar')

    // Outside Slidev every bar renders its measured seed geometry.
    expect(Number(bars[0].attributes('x'))).toBeCloseTo(420, 6)
    expect(Number(bars[0].attributes('width'))).toBeCloseTo(343, 6)
    expect(Number(bars[1].attributes('x'))).toBeCloseTo(1218, 6)
    expect(Number(bars[2].attributes('width'))).toBeCloseTo(1003, 6)
    expect(Number(bars[3].attributes('x'))).toBeCloseTo(1307, 6)
    expect(Number(bars[3].attributes('y'))).toBeCloseTo(694, 6)
  })

  it('rehearses the four reveal styles against a live clicks context', async () => {
    const clicks = fakeClicksContext(1)
    const wrapper = mountLanes({}, clicks)
    const bars = () => wrapper.findAll('rect.sf-ml-bar')

    // At current=1: bar 2 popped to its x1511 overshoot; bar 1 hidden in
    // place (veiled — the pop style holds its final rect); bars 4/3 hidden.
    expect(Number(bars()[0].attributes('x'))).toBeCloseTo(420, 6)
    expect(Number(bars()[0].attributes('width'))).toBeCloseTo(1091, 6)
    expect(bars()[1].classes()).toContain('sf-ml-veiled')
    expect(Number(bars()[1].attributes('x'))).toBeCloseTo(1218, 6)
    expect(Number(bars()[1].attributes('width'))).toBeCloseTo(386, 6)
    expect(Number(bars()[2].attributes('width'))).toBe(0)
    // Center-out collapse sits at bar 3's centerline.
    expect(Number(bars()[3].attributes('x'))).toBeCloseTo(1307 + 297 / 2, 6)
    expect(Number(bars()[3].attributes('width'))).toBe(0)

    // At current=2: bar 2 re-proportions to the seed; bar 1 still veiled.
    clicks.value = { current: 2 }
    await wrapper.vm.$nextTick()
    expect(Number(bars()[0].attributes('x'))).toBeCloseTo(420, 6)
    expect(Number(bars()[0].attributes('width'))).toBeCloseTo(343, 6)
    expect(bars()[1].classes()).toContain('sf-ml-veiled')

    // At current=3: bar 1 pops at final width — geometry unchanged, veil off.
    clicks.value = { current: 3 }
    await wrapper.vm.$nextTick()
    expect(bars()[1].classes()).not.toContain('sf-ml-veiled')
    expect(Number(bars()[1].attributes('x'))).toBeCloseTo(1218, 6)
    expect(Number(bars()[1].attributes('width'))).toBeCloseTo(386, 6)

    // At current=5: bar 4 mid-growth at its full width (ease-out growth is a
    // width animation to the final state).
    clicks.value = { current: 5 }
    await wrapper.vm.$nextTick()
    expect(Number(bars()[2].attributes('width'))).toBeCloseTo(1003, 6)
    // Bar 3 still collapsed at its centerline.
    expect(Number(bars()[3].attributes('width'))).toBe(0)

    // Backward navigation (5 → 3) snaps instantly: the instant class lands
    // on every bar and bar 3's centerline collapse returns.
    clicks.value = { current: 3 }
    await wrapper.vm.$nextTick()
    for (const bar of bars()) {
      expect(bar.classes()).toContain('sf-ml-instant')
    }
    expect(Number(bars()[3].attributes('x'))).toBeCloseTo(1307 + 297 / 2, 6)

    // Forward again: transitions resume.
    clicks.value = { current: 4 }
    await wrapper.vm.$nextTick()
    for (const bar of bars()) {
      expect(bar.classes()).not.toContain('sf-ml-instant')
    }
  })

  it('renders one bar per lane at its measured offset with the corrected fills', () => {
    const wrapper = mountLanes()
    const bars = wrapper.findAll('rect.sf-ml-bar')

    expect(bars).toHaveLength(4)
    // alt = #ED4342 red, accent = #F9BB21 amber — the measured fills.
    expect(bars[0].attributes('fill')).toBe('#ed4342')
    expect(bars[1].attributes('fill')).toBe('#ed4342')
    expect(bars[2].attributes('fill')).toBe('#f9bb21')
    expect(bars[3].attributes('fill')).toBe('#f9bb21')
    expect(Number(bars[0].attributes('y'))).toBeCloseTo(597, 6)
    expect(Number(bars[2].attributes('y'))).toBeCloseTo(766, 6)
  })

  it('renders the dark on-bar captions inside the long bars with pinned ink extents', () => {
    const wrapper = mountLanes()
    const captions = wrapper.findAll('text.sf-ml-bar-text')

    expect(captions).toHaveLength(2)
    // Bar 1's caption: 26px inset from the bar's left edge, near-black.
    expect(captions[0].text()).toBe('HARDER TO THE ASSISTANT')
    expect(Number(captions[0].attributes('x'))).toBeCloseTo(1218 + 26, 6)
    expect(Number(captions[0].attributes('y'))).toBeCloseTo(525 + 25, 6)
    expect(captions[0].attributes('fill')).toBe('#0a0202')
    expect(captions[0].attributes('textLength')).toBe('292')
    expect(captions[0].attributes('lengthAdjust')).toBe('spacingAndGlyphs')
    // Bar 3's caption rides the center-out bar's measured band.
    expect(captions[1].text()).toBe('HARDER TO REPLACE')
    expect(Number(captions[1].attributes('x'))).toBeCloseTo(1307 + 26, 6)
    expect(captions[1].attributes('textLength')).toBe('240')
  })

  it('renders the tracked lane labels at 35px, riding their measured beats', () => {
    const wrapper = mountLanes()
    const labels = wrapper.findAll('text.sf-ml-label')

    expect(labels.map((l) => l.text())).toEqual(['STREAMING', 'QUALITY LANE'])
    // Left-aligned at the measured x404, 35px at 1920, tracked 0.4em.
    expect(Number(labels[0].attributes('x'))).toBeCloseTo(404, 6)
    expect(Number(labels[0].attributes('font-size'))).toBeCloseTo(35, 6)
    expect(labels[0].attributes('letter-spacing')).toBe('0.4em')
  })

  it('renders the measured header label row as static chrome', () => {
    const wrapper = mountLanes({ headerLabel: 'WHERE THE WORK GOES' })
    const header = wrapper.find('.sf-ml-header')

    expect(header.exists()).toBe(true)
    const text = header.find('text')
    expect(text.text()).toBe('WHERE THE WORK GOES')
    expect(Number(text.attributes('x'))).toBeCloseTo(364, 6)
    expect(Number(text.attributes('y'))).toBeCloseTo(412, 6)
    expect(Number(text.attributes('font-size'))).toBeCloseTo(34, 6)
    expect(text.attributes('fill')).toBe('#a6a8ae') // palette subtext
    // Amber leading glyph, centered in its measured box.
    const icon = header.find('.sf-ml-header-icon')
    expect(icon.attributes('stroke')).toBe('#f9bb21')
    expect(icon.attributes('transform')).toBe('translate(315 406) scale(2)')
    // Static chrome: no v-click in the header row — without a footerLabel
    // the bindings are 4 bars + 2 labels + 3 diamonds = 9.
    expect(clickBindings).toHaveLength(9)
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
    // The footer rides the closing beat (click 9).
    const footerClick = clickBindings.find((b) => b.tag === 'g' && b.value === 9)
    expect(footerClick).toBeDefined()
  })

  it('renders the milestone diamonds: rotated cores, per-element glows, measured beats', () => {
    const wrapper = mountLanes()
    const diamonds = wrapper.findAll('g.sf-ml-diamond')

    expect(diamonds).toHaveLength(3)
    // Lane 1's red diamond: a 45°-rotated 38px square at (347,551) with a
    // soft radial glow behind it.
    const core = diamonds[0].find('rect.sf-ml-diamond-core')
    expect(Number(core.attributes('x'))).toBeCloseTo(347 - 19, 6)
    expect(Number(core.attributes('width'))).toBeCloseTo(38, 6)
    expect(core.attributes('transform')).toBe('rotate(45 347 551)')
    expect(core.attributes('stroke')).toBe('#ed4342')
    expect(Number(core.attributes('stroke-width'))).toBeCloseTo(3.5, 6)
    const glow = diamonds[0].find('circle.sf-ml-diamond-glow')
    expect(Number(glow.attributes('r'))).toBeCloseTo(26, 6)
    expect(glow.attributes('fill')).toBe('url(#sf-ml-glow-alt)')
    expect(Number(glow.attributes('opacity'))).toBeCloseTo(0.22, 6)
    // Lane 3's inner ring is the 21px amber square at (347,719).
    const innerCore = diamonds[2].find('rect.sf-ml-diamond-core')
    expect(Number(innerCore.attributes('width'))).toBeCloseTo(21, 6)
    expect(innerCore.attributes('stroke')).toBe('#f9bb21')
    expect(innerCore.attributes('transform')).toBe('rotate(45 347 719)')
  })

  it('carries the reveal-style transitions, instant backward snap, and reduced-motion block in its styles', () => {
    mountLanes()

    const css = Array.from(document.querySelectorAll('style'))
      .map((tag) => tag.textContent ?? '')
      .join('\n')

    // Sweep: 250ms rail sweep, 500ms re-proportion from the settled state.
    const sweepRule = css.match(/\.sf-ml-reveal-sweep[^{]*\{[^}]*\}/)?.[0] ?? ''
    expect(sweepRule).toContain('x 250ms')
    expect(sweepRule).toContain('width 250ms')
    const settledRule = css.match(/\.sf-ml-reveal-sweep\.sf-ml-settled[^{]*\{[^}]*\}/)?.[0] ?? ''
    expect(settledRule).toContain('500ms')
    // Grow: 733ms ease-out growth. Center: 120ms expansion.
    expect(css.match(/\.sf-ml-reveal-grow[^{]*\{[^}]*\}/)?.[0] ?? '').toContain('733ms')
    expect(css.match(/\.sf-ml-reveal-center[^{]*\{[^}]*\}/)?.[0] ?? '').toContain('120ms')
    // Pop: a 120ms fade, no geometry transition.
    expect(css.match(/\.sf-ml-reveal-pop[^{]*\{[^}]*\}/)?.[0] ?? '').toContain('opacity 120ms')
    // Instant: backward navigation snaps with zero animation.
    const instantRule = css.match(/\.sf-ml-bar\.sf-ml-instant[^{]*\{[^}]*\}/)?.[0] ?? ''
    expect(instantRule).toContain('transition: none')
    expect(css).toContain('150ms') // label/footer fade
    expect(css).toContain('prefers-reduced-motion') // transitions disabled, instant state
  })

  it('renders the two-tone header with the pinned ink extent via shared chrome', () => {
    const wrapper = mountLanes({ title: 'DATA', titleAccent: 'ROADMAP', titleTextLength: 798 })
    const header = wrapper.find('.sf-chrome-title')

    expect(header.text()).toContain('DATA')
    expect(header.html()).toContain('#66fb00')
    // The measured 798px extent is pinned through TitleChrome's textLength.
    expect(header.html()).toContain('textLength="798"')
    expect(header.html()).toContain('spacingAndGlyphs')
  })

  it('renders the dim plate as the only ambience — no frame, no washes, no ticks', () => {
    const wrapper = mountLanes()
    const ambience = wrapper.find('g.sf-ml-ambience')

    expect(ambience.exists()).toBe(true)
    expect(ambience.attributes('aria-hidden')).toBe('true')
    const plate = wrapper.find('rect.sf-ml-plate')
    // Bounded to the chart zone with the measured vertical gradient — the
    // field outside the plate stays pure black.
    expect(plate.attributes('fill')).toBe('url(#sf-ml-plate)')
    expect(Number(plate.attributes('x'))).toBeCloseTo(260, 6)
    expect(Number(plate.attributes('y'))).toBeCloseTo(372, 6)
    expect(Number(plate.attributes('width'))).toBeCloseTo(1400, 6)
    expect(Number(plate.attributes('height'))).toBeCloseTo(588, 6)
    // The settled reference carries none of the old decorations.
    expect(wrapper.find('rect.sf-ml-box').exists()).toBe(false)
    expect(wrapper.findAll('rect.sf-ml-wash')).toHaveLength(0)
    expect(wrapper.find('.sf-ml-ticks').exists()).toBe(false)
  })

  it('binds no v-click on the ambience layer — static chrome like the plate', () => {
    mountLanes({ footerLabel: 'YOUR JUDGEMENT DECIDES THE DESIGN' })
    // Still exactly the 10 choreographed bindings (4 bars, 2 labels, 3 diamonds, footer).
    expect(clickBindings).toHaveLength(10)
    expect(clickBindings.every((b) => b.tag !== 'g' || b.value !== 0)).toBe(true)
  })

  it('surfaces the layout RangeError instead of rendering blank', () => {
    expect(() => mountLanes({ lanes: [{ id: 'x', bars: [{ xFrac: 0.9, wFrac: 0.5, tone: 'accent' }] }] })).toThrow(RangeError)
  })
})
