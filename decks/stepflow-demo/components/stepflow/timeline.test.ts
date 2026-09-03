// @vitest-environment happy-dom
import { describe, expect, it } from 'vitest'
import { mount } from '@vue/test-utils'
import type { DirectiveBinding } from 'vue'
import SegmentTimeline from '../SegmentTimeline.vue'
import {
  CHIP_GAP_FRAC,
  CHIP_H_FRAC,
  CHIP_W_FRAC,
  TICK_GAP_FRAC,
  TICK_LABEL_GAP_FRAC,
  TICK_LEN_FRAC,
  segmentTimelineLayout,
  type TimelineSegment,
  type TimelineTick,
} from './timeline'

/**
 * Slidev registers the v-click directive globally at runtime; the render tests
 * stub it. The recording stub captures each binding value so the click
 * choreography itself is asserted (3 clicks: blue sweep, orange sweep, then
 * the labels layer); sweep rendering is dogfooded against the dev server.
 */
type SegmentTimelineProps = {
  segments: TimelineSegment[]
  ticks?: TimelineTick[]
  chip?: string
  yFrac?: number
  hFrac?: number
  x0Frac?: number
  x1Frac?: number
  palette?: Record<string, string>
  title?: string
  titleAccent?: string
}

function mountTimeline(props: SegmentTimelineProps) {
  return mount(SegmentTimeline, { props, global: { directives: { click: {} } } })
}

function mountRecordingClicks(props: SegmentTimelineProps) {
  const clicks: number[] = []
  const wrapper = mount(SegmentTimeline, {
    props,
    global: {
      directives: {
        click: {
          mounted(_el: unknown, binding: DirectiveBinding<number>) {
            clicks.push(binding.value)
          },
        },
      },
    },
  })
  return { wrapper, clicks }
}

/**
 * The demo seed mirrors the slide data: the measured composition of the source
 * video's 211–222s timeline (research art_2kSBGNmJ §3.1). Segment shares are
 * the measured canvas-width fractions 466/1280 and 296/1280; the bar spans
 * x208–972, y297–365 of the 1280×720 frame.
 */
const segments: TimelineSegment[] = [
  { id: 'batch', tone: 'accent', label: 'BATCH', wFrac: 0.3640625 },
  { id: 'stream', tone: 'alt', label: 'STREAMING', wFrac: 0.23125 },
]
const ticks: TimelineTick[] = [
  { xFrac: 0.265625, label: 'KICKOFF' },
  { xFrac: 0.49921875, label: 'CUTOVER' },
  { xFrac: 0.7328125, label: 'DONE' },
]
const data = { segments, ticks, chip: 'FY25', yFrac: 0.4125, hFrac: 0.09444444444444444, x0Frac: 0.1625, x1Frac: 0.759375 }

/** Pull the numeric value of a --seg-w custom property from a style attribute. */
function segWidthPx(style: string | undefined): number {
  const match = /--seg-w:\s*([\d.]+)px/.exec(style ?? '')
  expect(match, `--seg-w missing in "${style}"`).toBeTruthy()
  return Number.parseFloat(match![1])
}

function shippedCss(): string {
  return Array.from(document.querySelectorAll('style'))
    .map((tag) => tag.textContent ?? '')
    .join('\n')
}

describe('measured fractions — source px over the 1280×720 frame', () => {
  it('tick geometry: 95px lines hanging 2px below the bar, labels 58px below', () => {
    expect(TICK_LEN_FRAC).toBeCloseTo(0.131944444444444, 6) // 95/720
    expect(TICK_GAP_FRAC).toBeCloseTo(0.002777777777777, 6) // 2/720
    expect(TICK_LABEL_GAP_FRAC).toBeCloseTo(0.080555555555555, 6) // 58/720
  })

  it('chip geometry: 89×22px chip hung 34px right of the bar end', () => {
    expect(CHIP_W_FRAC).toBeCloseTo(0.06953125, 6) // 89/1280
    expect(CHIP_H_FRAC).toBeCloseTo(0.030555555555555, 6) // 22/720
    expect(CHIP_GAP_FRAC).toBeCloseTo(0.0265625, 6) // 34/1280
  })
})

describe('segmentTimelineLayout — hand-computed measured geometry', () => {
  it('resolves the measured bar rect at the 1920×1080 canvas', () => {
    const l = segmentTimelineLayout(data)
    // x0 208/1280 × 1920 = 312; span (972−208)/1280 × 1920 = 1146;
    // y 297/720 × 1080 = 445.5; height 68/720 × 1080 = 102.
    expect(l.bar.x).toBeCloseTo(312, 6)
    expect(l.bar.y).toBeCloseTo(445.5, 6)
    expect(l.bar.width).toBeCloseTo(1146, 6)
    expect(l.bar.height).toBeCloseTo(102, 6)
    expect(l.viewBox).toEqual({ width: 1920, height: 1080 })
  })

  it('normalizes the measured shares to fill the span exactly, contiguous', () => {
    const l = segmentTimelineLayout(data)
    // Blue share 466/762 of the 1146px span: 267018/381 = 700.8346456692913.
    expect(l.segments[0].x).toBeCloseTo(312, 6)
    expect(l.segments[0].width).toBeCloseTo(700.8346456692913, 6)
    // Orange continues the bar: starts where blue ends, fills to the end.
    expect(l.segments[1].x).toBeCloseTo(1012.8346456692913, 6)
    expect(l.segments[1].width).toBeCloseTo(445.1653543307087, 6)
    expect(l.segments[1].x + l.segments[1].width).toBeCloseTo(312 + 1146, 6)
    // Label centers ride each segment's midpoint at the bar's vertical center.
    expect(l.segments[0].labelCx).toBeCloseTo(312 + 700.8346456692913 / 2, 6)
    expect(l.segments[1].labelCx).toBeCloseTo(1012.8346456692913 + 445.1653543307087 / 2, 6)
    for (const seg of l.segments) {
      expect(seg.labelCy).toBeCloseTo(445.5 + 51, 6)
    }
  })

  it('splits equal shares when no wFrac is authored', () => {
    const l = segmentTimelineLayout({ ...data, segments: [{ id: 'a', tone: 'accent' }, { id: 'b', tone: 'alt' }] })
    expect(l.segments[0].width).toBeCloseTo(573, 6)
    expect(l.segments[1].width).toBeCloseTo(573, 6)
    expect(l.segments[1].x).toBeCloseTo(885, 6)
  })

  it('mixes authored shares with equal-share defaults ({2}, {} → 2:1)', () => {
    const l = segmentTimelineLayout({ ...data, segments: [{ id: 'a', tone: 'accent', wFrac: 2 }, { id: 'b', tone: 'alt' }] })
    expect(l.segments[0].width).toBeCloseTo(764, 6)
    expect(l.segments[1].width).toBeCloseTo(382, 6)
  })

  it('resolves the measured tick geometry below the bar', () => {
    const l = segmentTimelineLayout(data)
    // Tick x: 340/639/938 over 1280 → ×1.5 onto 1920.
    expect(l.ticks.map((t) => t.x)).toEqual([510, 958.5, 1407])
    // Lines start 2px (×1.5 = 3px) below the bar bottom (547.5) → 550.5.
    for (const tick of l.ticks) {
      expect(tick.y0).toBeCloseTo(550.5, 6)
      expect(tick.len).toBeCloseTo(142.5, 6) // 95px × 1.5
      // Baseline: tick end 693 + glyph gap 58px × 1.5 = 780.
      expect(tick.labelBaseline).toBeCloseTo(780, 6)
      expect(tick.labelX).toBe(tick.x)
    }
  })

  it('derives the right-side chip from the bar end, vertically centered', () => {
    const l = segmentTimelineLayout(data)
    // Bar end 1458 + 34px gap × 1.5 = 1509; bar center 496.5 − half of 33 = 480.
    expect(l.chip).toBeDefined()
    expect(l.chip!.x).toBeCloseTo(1509, 6)
    expect(l.chip!.y).toBeCloseTo(480, 6)
    expect(l.chip!.width).toBeCloseTo(133.5, 6) // 89px × 1.5
    expect(l.chip!.height).toBeCloseTo(33, 6) // 22px × 1.5
    expect(l.chip!.text).toBe('FY25')
  })

  it('omits the chip when no text is authored', () => {
    const l = segmentTimelineLayout({ ...data, chip: undefined })
    expect(l.chip).toBeUndefined()
  })

  it('scales with a custom viewBox (the 960×540 half canvas)', () => {
    const l = segmentTimelineLayout(data, { width: 960, height: 540 })
    expect(l.bar.x).toBeCloseTo(156, 6)
    expect(l.bar.y).toBeCloseTo(222.75, 6)
    expect(l.bar.width).toBeCloseTo(573, 6)
    expect(l.bar.height).toBeCloseTo(51, 6)
    expect(l.segments[0].width).toBeCloseTo(350.4173228346457, 6)
    expect(l.segments[1].x).toBeCloseTo(506.4173228346457, 6)
    expect(l.ticks.map((t) => t.x)).toEqual([255, 479.25, 703.5])
    expect(l.ticks[0].y0).toBeCloseTo(275.25, 6)
    expect(l.ticks[0].len).toBeCloseTo(71.25, 6)
    expect(l.ticks[0].labelBaseline).toBeCloseTo(390, 6)
    expect(l.chip!.x).toBeCloseTo(754.5, 6)
    expect(l.chip!.y).toBeCloseTo(240, 6)
    expect(l.chip!.width).toBeCloseTo(66.75, 6)
    expect(l.chip!.height).toBeCloseTo(16.5, 6)
  })

  it('validates composition errors with RangeError instead of rendering blank', () => {
    expect(() => segmentTimelineLayout({ ...data, segments: [] })).toThrow(RangeError)
    expect(() => segmentTimelineLayout({ ...data, segments: [{ id: 'x', tone: 'purple' as never }] })).toThrow(RangeError)
    expect(() => segmentTimelineLayout({ ...data, segments: [{ id: 'x', tone: 'accent', wFrac: 0 }] })).toThrow(RangeError)
    expect(() => segmentTimelineLayout({ ...data, segments: [{ id: 'x', tone: 'accent', wFrac: -1 }] })).toThrow(RangeError)
    expect(() => segmentTimelineLayout({ ...data, segments: [{ id: 'x', tone: 'accent', wFrac: Number.NaN }] })).toThrow(RangeError)
    expect(() => segmentTimelineLayout({ ...data, x0Frac: 0.8 })).toThrow(RangeError)
    expect(() => segmentTimelineLayout({ ...data, x0Frac: 12.0 })).toThrow(RangeError)
    expect(() => segmentTimelineLayout({ ...data, hFrac: 0, yFrac: 0.5 })).toThrow(RangeError)
    expect(() => segmentTimelineLayout({ ...data, yFrac: 0.5, hFrac: 0.6 })).toThrow(RangeError)
    expect(() => segmentTimelineLayout({ ...data, ticks: [{ xFrac: -0.1, label: 'X' }] })).toThrow(RangeError)
  })

  it('is deterministic for the same inputs', () => {
    expect(JSON.stringify(segmentTimelineLayout(data)))
      .toBe(JSON.stringify(segmentTimelineLayout(data)))
  })
})

describe('SegmentTimeline component', () => {
  it('owns 3 clicks: one per segment sweep, then the labels layer', () => {
    const { clicks } = mountRecordingClicks(data)

    expect(clicks).toHaveLength(3)
    expect(clicks).toEqual([1, 2, 3])
  })

  it('mounts no labels layer (and spends no click) when nothing is labeled', () => {
    const { clicks, wrapper } = mountRecordingClicks({
      segments: [{ id: 'a', tone: 'accent' }],
      ticks: [],
      yFrac: 0.4125, hFrac: 0.09444444444444444, x0Frac: 0.1625, x1Frac: 0.759375,
    })

    expect(clicks).toEqual([1])
    expect(wrapper.find('.sf-tl-labels').exists()).toBe(false)
  })

  it('a single labeled tick still takes the final labels click', () => {
    const { clicks } = mountRecordingClicks({
      segments: [{ id: 'a', tone: 'accent' }],
      ticks: [{ xFrac: 0.5, label: 'MID' }],
      yFrac: 0.4125, hFrac: 0.09444444444444444, x0Frac: 0.1625, x1Frac: 0.759375,
    })

    expect(clicks).toEqual([1, 2])
  })

  it('renders one sweep rect per segment over the measured canvas with an accessible name', () => {
    const wrapper = mountTimeline(data)

    expect(wrapper.find('svg.segment-timeline').exists()).toBe(true)
    expect(wrapper.findAll('rect.sf-tl-seg')).toHaveLength(2)
    expect(wrapper.find('.sf-tl-labels').exists()).toBe(true)

    const svg = wrapper.find('svg.segment-timeline')
    expect(svg.attributes('viewBox')).toBe('0 0 1920 1080')
    expect(svg.attributes('role')).toBe('img')
    expect(svg.attributes('aria-label')).toBe('2-segment timeline diagram')
  })

  it('pre-sets each sweep rect to its normalized share of the measured bar', () => {
    const wrapper = mountTimeline(data)
    const rects = wrapper.findAll('rect.sf-tl-seg')

    // Style strings carry the component's 4-decimal formatting; the
    // authoritative 1e-6 geometry lives in the layout tests above.
    expect(segWidthPx(rects[0].attributes('style'))).toBeCloseTo(700.8346, 4)
    expect(segWidthPx(rects[1].attributes('style'))).toBeCloseTo(445.1654, 4)
    // Measured bar band: y 445.5, height 102; segments anchored left→right
    // (attributes bind the raw layout floats — precision is asserted above).
    expect(Number.parseFloat(rects[0].attributes('x') ?? '')).toBeCloseTo(312, 6)
    expect(Number.parseFloat(rects[1].attributes('x') ?? '')).toBeCloseTo(1012.8346456692913, 6)
    for (const rect of rects) {
      expect(rect.attributes('y')).toBe('445.5')
      expect(rect.attributes('height')).toBe('102')
    }
  })

  it('paints the palette tokens as-is: chainBlue accent, orangeSpine accentAlt', () => {
    const wrapper = mountTimeline(data)
    const rects = wrapper.findAll('rect.sf-tl-seg')

    expect(rects[0].attributes('fill')).toBe('#349aea') // chainBlue.accent
    expect(rects[1].attributes('fill')).toBe('#f85721') // orangeSpine.accent
  })

  it('lets a palette override re-tint either tone (accent and accentAlt)', () => {
    const wrapper = mountTimeline({ ...data, palette: { accent: '#111111', accentAlt: '#222222' } })
    const rects = wrapper.findAll('rect.sf-tl-seg')

    expect(rects[0].attributes('fill')).toBe('#111111')
    expect(rects[1].attributes('fill')).toBe('#222222')
  })

  it('renders the tick elements and their labels beneath the bar', () => {
    const wrapper = mountTimeline(data)

    const lines = wrapper.findAll('line.sf-tl-tick')
    expect(lines).toHaveLength(3)
    // Chrome-white ticks at the measured stroke.
    for (const line of lines) {
      expect(line.attributes('stroke')).toBe('#f5f4f7')
      expect(line.attributes('stroke-width')).toBe('3')
    }
    expect(lines[0].attributes('x1')).toBe('510')
    expect(lines[0].attributes('y1')).toBe('550.5')
    expect(lines[0].attributes('y2')).toBe('693')

    const labels = wrapper.findAll('text.sf-tl-tick-label').map((t) => t.text())
    expect(labels).toEqual(['KICKOFF', 'CUTOVER', 'DONE'])
  })

  it('renders segment labels centered inside their segments and the right-side chip', () => {
    const wrapper = mountTimeline(data)

    const segLabels = wrapper.findAll('text.sf-tl-seg-label').map((t) => t.text())
    expect(segLabels).toEqual(['BATCH', 'STREAMING'])

    const chip = wrapper.find('.sf-tl-chip')
    expect(chip.find('rect').attributes('x')).toBe('1509')
    expect(chip.text()).toBe('FY25')
  })

  it('carries the sweep transition and hidden-state snap in its rendered styles', () => {
    mountTimeline(data)
    const css = shippedCss()

    // Revealed destination state: the width sweep from the CSS var.
    const sweepRule = css.match(/\.sf-tl-seg[^{,]*\{[^}]*\}/)?.[0] ?? ''
    expect(sweepRule).toContain('width: var(--seg-w)')
    expect(sweepRule).toContain('width 300ms')
    // Hidden state: width 0 + transition:none — backward nav snaps instantly.
    const hiddenRule = css.match(/\.sf-tl-seg\.slidev-vclick-hidden[^{]*\{[^}]*\}/)?.[0] ?? ''
    expect(hiddenRule).toContain('width: 0')
    expect(hiddenRule).toContain('transition: none')
  })

  it('ships a reduced-motion block that freezes the sweeps and fades', () => {
    mountTimeline(data)
    const css = shippedCss()
    const reduced = css.match(/@media \(prefers-reduced-motion: reduce\)[\s\S]*?\}/)?.[0] ?? ''

    expect(reduced).toContain('.sf-tl-seg')
    expect(reduced).toContain('.sf-tl-labels')
    expect(reduced).toContain('transition: none')
  })

  it('surfaces the layout RangeError for invalid composition instead of rendering blank', () => {
    expect(() => mountTimeline({ ...data, segments: [] })).toThrow(RangeError)
  })

  it('renders the two-tone header: white title + chrome-green titleAccent tail', () => {
    const wrapper = mountTimeline({ ...data, title: 'MIGRATION', titleAccent: 'TIMELINE' })
    const header = wrapper.find('text.header')

    expect(header.text()).toContain('MIGRATION')
    expect(header.html()).toContain('#66fb00')
  })
})
