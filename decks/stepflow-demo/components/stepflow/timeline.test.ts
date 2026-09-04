// @vitest-environment happy-dom
import { describe, expect, it } from 'vitest'
import { mount } from '@vue/test-utils'
import type { DirectiveBinding } from 'vue'
import SegmentTimeline from '../SegmentTimeline.vue'
import {
  ARROW_HEAD_DEPTH,
  ARROW_HEAD_HALF,
  ARROW_STROKE,
  ARROW_WHITE,
  DIGIT_INK,
  LABEL_BASELINE_FRAC,
  LABEL_CX_OFFSET_FRAC,
  LABEL_SIZE,
  LABEL_WHITE,
  LEGEND_BAR_H,
  LEGEND_MINT,
  MEASURED_POP_MS,
  NODE_BLUE,
  NODE_CYAN,
  NODE_DIGIT_SIZE,
  NODE_R_FRAC,
  NODE_RED,
  SUBLABEL_BASELINE_FRAC,
  SUBLABEL_SIZE,
  SUB_GRAY,
  TICK_LEN_FRAC,
  TICK_STROKE,
  TRACK_DIM,
  beatSchedule,
  segmentTimelineLayout,
  type TimelineSegment,
} from './timeline'

/**
 * Slidev registers the v-click directive globally at runtime; the render tests
 * stub it. The recording stub captures each binding value so the click
 * choreography itself is asserted (one click per segment — fills and node
 * groups — with the legend sharing the final click); transition timing lives
 * in the scoped CSS (the beat table's rendered form) and is dogfooded against
 * the dev server.
 */
type SegmentTimelineProps = {
  segments: TimelineSegment[]
  yFrac?: number
  hFrac?: number
  x0Frac?: number
  x1Frac?: number
  palette?: Record<string, string>
  title?: string
  titleAccent?: string
  capHeight?: number
  capTop?: number
  titleTextLength?: number
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
 * The demo seed mirrors the slide data: the measured composition of the
 * source's settled frame (art_lYM2KXza §SegmentTimeline, 1920×1080 read).
 * Node centers 511/960/1408 are the sheet's measured tick/disc centers; the
 * track spans x315–1460 at y494–499.
 */
const segments: TimelineSegment[] = [
  { id: 'practices', tone: 'accent', nodeFrac: 511 / 1920, label: 'SOFTWARE PRACTICES', sublabel: 'GIT, TESTS AND REVIEW ON PIPELINES' },
  { id: 'integration', tone: 'tertiary', nodeFrac: 960 / 1920, label: 'BETTER INTEGRATION', sublabel: 'ONE PLATFORM INSTEAD OF SIX TOOLS' },
  { id: 'collaboration', tone: 'alt', nodeFrac: 1408 / 1920, label: 'CLOSER COLLABORATION' },
]
const data = {
  segments,
  yFrac: 494 / 1080,
  hFrac: 6 / 1080,
  x0Frac: 315 / 1920,
  x1Frac: 1460 / 1920,
}
const fullProps = { ...data, title: 'Where is it', titleAccent: 'heading?', titleTextLength: 795 }

describe('measured constants — the settled frame over the 1920×1080 read', () => {
  it('node, tick, and label-block geometry in canvas fractions', () => {
    expect(NODE_R_FRAC * 1080).toBeCloseTo(51.5, 6) // d≈103 discs
    expect(TICK_LEN_FRAC * 1080).toBeCloseTo(142, 6) // ticks y550–692
    expect(LABEL_CX_OFFSET_FRAC * 1920).toBeCloseTo(27, 6) // row-1 blocks sit 27px right of the node
    expect(LABEL_BASELINE_FRAC * 1080).toBeCloseTo(729, 6)
    expect(SUBLABEL_BASELINE_FRAC * 1080).toBeCloseTo(779, 6)
    expect(TICK_STROKE).toBe(4)
  })

  it('measured palette: blue / cyan / red trio, dim track, arrow white, label inks', () => {
    expect(NODE_BLUE).toBe('#3699fa')
    expect(NODE_CYAN).toBe('#1ed0e8')
    expect(NODE_RED).toBe('#f75720')
    expect(TRACK_DIM).toBe('#001010')
    expect(ARROW_WHITE).toBe('#f5f4f7')
    expect(LABEL_WHITE).toBe('#fefefe')
    expect(SUB_GRAY).toBe('#b1b1bb')
    expect(DIGIT_INK).toBe('#050505')
    expect(LEGEND_MINT).toBe('#18d69a')
  })

  it('typography and arrow chrome: 28/18px label rows, 35px digits, 6px arrow shaft', () => {
    expect(LABEL_SIZE).toBe(28)
    expect(SUBLABEL_SIZE).toBe(18)
    expect(NODE_DIGIT_SIZE).toBe(35)
    expect(LEGEND_BAR_H).toBe(5)
    expect(ARROW_STROKE).toBe(6)
    expect(ARROW_HEAD_DEPTH).toBe(25)
    expect(ARROW_HEAD_HALF).toBe(16.5)
  })
})

describe('beatSchedule — the click-aligned state machine', () => {
  it('spaces clicks evenly: durationSec 6.9 over 3 clicks → pops 2300/4600/6900', () => {
    const schedule = beatSchedule(3, 6900)
    expect(schedule.pops).toEqual([2300, 4600, 6900])
    // Within 130ms of the measured non-uniform pops (2300/4730/6880 — the
    // recording's ≈2.2–2.4s beats; AutoAdvance renders uniform spacing).
    const drift = Math.max(...MEASURED_POP_MS.map((pop, i) => Math.abs(pop - schedule.pops[i]!)))
    expect(drift).toBeLessThanOrEqual(130)
  })

  it('sweeps start as each pop ends and ease out ~150ms with a hard hold', () => {
    const schedule = beatSchedule(3, 6900)
    expect(schedule.sweeps).toEqual([
      { start: 2400, end: 2550 },
      { start: 4700, end: 4850 },
      { start: 7000, end: 7150 },
    ])
  })

  it('cascades the tick + row-1 label ~400ms after each pop and the row-2 label ~1300ms after', () => {
    const schedule = beatSchedule(3, 6900)
    expect(schedule.cascades).toEqual([2700, 5000, 7300])
    expect(schedule.sublabels).toEqual([3600, 5900, 8200])
    // Row 2 trails the cascade by ≈900ms (measured: tick 1 at 2700, row 2 at 3600).
    expect(schedule.sublabels[0]! - schedule.cascades[0]!).toBe(900)
  })

  it('fades the legend last — 1500ms after the final click over 1.6s, settling ≈10.1s', () => {
    const schedule = beatSchedule(3, 6900)
    expect(schedule.legendStart).toBe(8400)
    expect(schedule.legendEnd).toBe(10000)
    expect(schedule.settle).toBe(10100)
  })

  it('scales with the click count and duration (one schedule per run shape)', () => {
    const single = beatSchedule(1, 2000)
    expect(single.pops).toEqual([2000])
    expect(single.legendStart).toBe(3500)
    const five = beatSchedule(5, 5000)
    expect(five.pops).toEqual([1000, 2000, 3000, 4000, 5000])
    expect(five.legendStart).toBe(6500)
  })

  it('rejects non-positive or non-finite runs with RangeError', () => {
    expect(() => beatSchedule(0, 6900)).toThrow(RangeError)
    expect(() => beatSchedule(3, 0)).toThrow(RangeError)
    expect(() => beatSchedule(3, -1)).toThrow(RangeError)
    expect(() => beatSchedule(3, Number.NaN)).toThrow(RangeError)
  })
})

describe('segmentTimelineLayout', () => {
  it('track rect spans the measured band: x315–1460, y494–499', () => {
    const layout = segmentTimelineLayout(data)
    expect(layout.track.x).toBeCloseTo(315, 6)
    expect(layout.track.y).toBeCloseTo(494, 6)
    expect(layout.track.width).toBeCloseTo(1145, 6)
    expect(layout.track.height).toBeCloseTo(6, 6)
  })

  it('nodes sit at the measured centers on the track axis, r51.5', () => {
    const layout = segmentTimelineLayout(data)
    const [first, second, third] = layout.segments
    expect(first!.nodeCx).toBeCloseTo(511, 6)
    expect(second!.nodeCx).toBeCloseTo(960, 6)
    expect(third!.nodeCx).toBeCloseTo(1408, 6)
    // Track band y494–499 maps to the continuous span [494, 500) → center 497
    // (the sheet's measured 496.5 carries ±1px discrete-band noise).
    expect(first!.nodeCy).toBeCloseTo(497, 6)
    for (const seg of layout.segments) {
      expect(seg.nodeR).toBeCloseTo(51.5, 6)
    }
  })

  it('fills tile the track exactly node-edge → node-edge (no gaps, no overshoot)', () => {
    const layout = segmentTimelineLayout(data)
    const [first, second, third] = layout.segments
    // Measured boundaries: blue x315–563, cyan x563–1012, red x1012–1460.
    expect(first!.x).toBeCloseTo(315, 6)
    expect(first!.fillRight).toBeCloseTo(562.5, 6)
    expect(second!.x).toBeCloseTo(562.5, 6)
    expect(second!.fillRight).toBeCloseTo(1011.5, 6)
    expect(third!.x).toBeCloseTo(1011.5, 6)
    expect(third!.fillRight).toBeCloseTo(1459.5, 6)
    expect(third!.fillRight).toBeLessThanOrEqual(1460)
    for (const seg of layout.segments) {
      expect(seg.width).toBeCloseTo(seg.fillRight - seg.x, 6)
    }
  })

  it('ticks hang from just below each disc (y550) down 142px, at the node center', () => {
    const layout = segmentTimelineLayout(data)
    for (const seg of layout.segments) {
      expect(seg.tickX).toBe(seg.nodeCx)
      expect(seg.tickY0).toBeCloseTo(550.5, 6) // nodeCy 497 + r 51.5 + 2 (measured y550 ±1)
      expect(seg.tickLen).toBeCloseTo(142, 6)
    }
  })

  it('label rows: bold white row 1 offset 27px right of the node, dim row 2 centered on it', () => {
    const layout = segmentTimelineLayout(data)
    for (const seg of layout.segments) {
      expect(seg.labelCx).toBeCloseTo(seg.nodeCx + 27, 6)
      expect(seg.labelBaseline).toBeCloseTo(729, 6)
      expect(seg.sublabelCx).toBe(seg.nodeCx)
      expect(seg.sublabelBaseline).toBeCloseTo(779, 6)
    }
  })

  it('digits read 01/02/03, centered in each disc', () => {
    const layout = segmentTimelineLayout(data)
    expect(layout.segments.map((seg) => seg.digit)).toEqual(['01', '02', '03'])
    for (const seg of layout.segments) {
      expect(seg.digitCx).toBe(seg.nodeCx)
      expect(seg.digitBaseline).toBeCloseTo(seg.nodeCy + 35 * 0.36, 6)
    }
  })

  it('white arrow caps the composition past the track: shaft on the axis x1510–1641, chevron head', () => {
    const layout = segmentTimelineLayout(data)
    expect(layout.arrow.x0).toBeCloseTo(1510, 6)
    expect(layout.arrow.x1).toBeCloseTo(1641, 6)
    expect(layout.arrow.shaftY).toBeCloseTo(497, 6)
    expect(layout.arrow.headDepth).toBeCloseTo(25, 6)
    expect(layout.arrow.headHalf).toBeCloseTo(16.5, 6)
    expect(layout.arrow.stroke).toBeCloseTo(6, 6)
  })

  it('legend column centers on the last node\'s axis with mono-modeled word positions', () => {
    const layout = segmentTimelineLayout(data)
    expect(layout.legend.cx).toBe(1408)
    expect(layout.legend.words.map((word) => word.text)).toEqual(['DATA', 'SOFTWARE', 'AI'])
    // 14 chars × 0.6 × 24 + 2 × 26 gaps = 253.6 total → starts at 1408 − 126.8.
    expect(layout.legend.words[0]!.x).toBeCloseTo(1281.2, 6)
    expect(layout.legend.words[1]!.x).toBeCloseTo(1364.8, 6)
    expect(layout.legend.words[2]!.x).toBeCloseTo(1506, 6)
    for (const word of layout.legend.words) {
      expect(word.width).toBeCloseTo(word.text.length * 0.6 * 24, 6)
      expect(word.barY).toBeCloseTo(794, 6)
      expect(word.barH).toBe(5)
    }
    expect(layout.legend.wordsBaseline).toBeCloseTo(729, 6)
    expect(layout.legend.note).toBe('THREE TEAMS ON ONE SHARED SYSTEM')
    expect(layout.legend.noteCx).toBe(1408)
    expect(layout.legend.noteBaseline).toBeCloseTo(832, 6)
  })

  it('scales all geometry with a custom viewBox (SSR-safe fractions)', () => {
    const layout = segmentTimelineLayout(data, { width: 960, height: 540 })
    expect(layout.track.x).toBeCloseTo(157.5, 6)
    expect(layout.segments[0]!.nodeCx).toBeCloseTo(255.5, 6)
    expect(layout.segments[0]!.nodeR).toBeCloseTo(25.75, 6)
    expect(layout.legend.cx).toBe(704)
  })

  it('is deterministic — identical inputs produce identical layouts', () => {
    expect(segmentTimelineLayout(data)).toEqual(segmentTimelineLayout(data))
  })

  it('rejects invalid compositions with RangeError instead of rendering blank', () => {
    expect(() => segmentTimelineLayout({ ...data, segments: [] })).toThrow(RangeError)
    expect(() => segmentTimelineLayout({ ...data, segments: [{ ...segments[0]!, tone: 'magenta' as never }] })).toThrow(RangeError)
    expect(() => segmentTimelineLayout({ ...data, segments: [{ ...segments[0]!, nodeFrac: -1 }] })).toThrow(RangeError)
    expect(() => segmentTimelineLayout({ ...data, segments: [{ ...segments[0]!, nodeFrac: 1.2 }] })).toThrow(RangeError)
    expect(() => segmentTimelineLayout({ ...data, x0Frac: 0.8, x1Frac: 0.4 })).toThrow(RangeError)
    expect(() => segmentTimelineLayout({ ...data, yFrac: 0.995, hFrac: 6 / 1080 })).toThrow(RangeError)
    // Node 2 too close to node 1 overlaps fill 1.
    expect(() => segmentTimelineLayout({
      ...data,
      segments: [segments[0]!, { ...segments[1]!, nodeFrac: 560 / 1920 }],
    })).toThrow(/overlaps the previous node's fill/)
    // Node past the track's right end.
    expect(() => segmentTimelineLayout({
      ...data,
      segments: [segments[0]!, segments[1]!, { ...segments[2]!, nodeFrac: 1500 / 1920 }],
    })).toThrow(/past the track span/)
  })
})

describe('SegmentTimeline component', () => {
  it('spends exactly one click per segment — fill + node together — with the legend sharing the final click', () => {
    const { clicks } = mountRecordingClicks(fullProps)
    // Template order: three fill rects, then three node groups, then the
    // legend — so fill i and node i both bind click i + 1, and the legend
    // shares the final click with the last segment.
    expect(clicks).toEqual([1, 2, 3, 1, 2, 3, 3])
    expect(new Set(clicks)).toEqual(new Set([1, 2, 3]))
  })

  it('renders an accessible SVG with the segment count in its label', () => {
    const wrapper = mountTimeline(fullProps)
    const svg = wrapper.find('svg')
    expect(svg.attributes('role')).toBe('img')
    expect(svg.attributes('aria-label')).toBe('3-segment timeline diagram')
    expect(svg.attributes('viewBox')).toBe('0 0 1920 1080')
  })

  it('renders the thin dim track and the white end arrow, always visible', () => {
    const wrapper = mountTimeline(fullProps)
    const track = wrapper.find('.sf-tl-track')
    expect(track.attributes('x')).toBe('315')
    expect(track.attributes('y')).toBe('494')
    expect(parseFloat(track.attributes('width')!)).toBeCloseTo(1145, 4)
    expect(parseFloat(track.attributes('height')!)).toBeCloseTo(6, 4)
    expect(track.attributes('fill')).toBe('#001010')
    // Arrow: 6px shaft on the track axis + open chevron head, past x1460.
    const shaft = wrapper.find('.sf-tl-arrow-shaft')
    expect(shaft.attributes('x1')).toBe('1510')
    expect(parseFloat(shaft.attributes('x2')!)).toBeCloseTo(1641, 4)
    expect(parseFloat(shaft.attributes('y1')!)).toBeCloseTo(497, 4)
    expect(parseFloat(shaft.attributes('stroke-width')!)).toBeCloseTo(6, 4)
    const head = wrapper.find('.sf-tl-arrow-head')
    expect(head.attributes('points')).toBe('1616,480.5 1641,497 1616,513.5')
  })

  it('renders three contiguous fill rects pre-set to their sweep widths in the track band', () => {
    const wrapper = mountTimeline(fullProps)
    const fills = wrapper.findAll('.sf-tl-seg')
    expect(fills).toHaveLength(3)
    expect(fills[0]!.attributes('style')).toContain('247.5px') // 562.5 − 315
    expect(fills[1]!.attributes('style')).toContain('449px') // 1011.5 − 562.5
    expect(fills[2]!.attributes('style')).toContain('448px') // 1459.5 − 1011.5
    for (const fill of fills) {
      expect(fill.attributes('y')).toBe('494')
      expect(fill.attributes('height')).toBe('6')
    }
  })

  it('tints each segment with its node color: measured blue / cyan / red', () => {
    const wrapper = mountTimeline(fullProps)
    const fills = wrapper.findAll('.sf-tl-seg')
    expect(fills[0]!.attributes('fill')).toBe('#3699fa')
    expect(fills[1]!.attributes('fill')).toBe('#1ed0e8')
    expect(fills[2]!.attributes('fill')).toBe('#f75720')
  })

  it('renders one solid node disc per segment with a dark step number — no glow gradient', () => {
    const wrapper = mountTimeline(fullProps)
    const discs = wrapper.findAll('.disc')
    expect(discs).toHaveLength(3)
    for (const disc of discs) {
      expect(parseFloat(disc.attributes('r')!)).toBeCloseTo(51.5, 4)
      expect(parseFloat(disc.attributes('cy')!)).toBeCloseTo(497, 4)
      expect(['#3699fa', '#1ed0e8', '#f75720']).toContain(disc.attributes('fill'))
    }
    const digits = wrapper.findAll('.sf-tl-digit')
    expect(digits.map((digit) => digit.text())).toEqual(['01', '02', '03'])
    expect(digits[0]!.attributes('fill')).toBe('#050505')
    expect(wrapper.html()).not.toContain('radialGradient')
  })

  it('renders 4px node-colored ticks dropping from just below each disc toward the labels', () => {
    const wrapper = mountTimeline(fullProps)
    const ticks = wrapper.findAll('.sf-tl-tick')
    expect(ticks).toHaveLength(3)
    for (const [i, tick] of ticks.entries()) {
      expect(parseFloat(tick.attributes('y1')!)).toBeCloseTo(550.5, 4)
      expect(parseFloat(tick.attributes('y2')!)).toBeCloseTo(692.5, 4)
      expect(parseFloat(tick.attributes('stroke-width')!)).toBe(4)
      expect(tick.attributes('stroke')).toBe(['#3699fa', '#1ed0e8', '#f75720'][i])
    }
  })

  it('renders the two-row label block: bold white row 1 at +27px, dim gray row 2 on nodes 1–2 only', () => {
    const wrapper = mountTimeline(fullProps)
    const labels = wrapper.findAll('.sf-tl-label')
    expect(labels.map((label) => label.text())).toEqual(['SOFTWARE PRACTICES', 'BETTER INTEGRATION', 'CLOSER COLLABORATION'])
    for (const label of labels) {
      expect(label.attributes('fill')).toBe('#fefefe')
      expect(parseFloat(label.attributes('font-size')!)).toBe(28)
    }
    // Measured block centers: 511+27=538, 960+27=987, 1408+27=1435.
    expect(parseFloat(labels[0]!.attributes('x')!)).toBeCloseTo(538, 4)
    expect(parseFloat(labels[2]!.attributes('x')!)).toBeCloseTo(1435, 4)
    const sublabels = wrapper.findAll('.sf-tl-sublabel')
    expect(sublabels).toHaveLength(2)
    expect(sublabels[0]!.text()).toBe('GIT, TESTS AND REVIEW ON PIPELINES')
    expect(sublabels[1]!.text()).toBe('ONE PLATFORM INSTEAD OF SIX TOOLS')
    expect(sublabels[0]!.attributes('fill')).toBe('#b1b1bb')
    expect(parseFloat(sublabels[0]!.attributes('font-size')!)).toBe(18)
    expect(parseFloat(sublabels[0]!.attributes('x')!)).toBeCloseTo(511, 4)
    expect(sublabels[0]!.attributes('letter-spacing')).toBe('0.06em')
  })

  it('renders the legend column — three hue words, hue bars, dim note — on the last node\'s axis', () => {
    const wrapper = mountTimeline(fullProps)
    expect(wrapper.find('.sf-tl-legend').exists()).toBe(true)
    const words = wrapper.findAll('.sf-tl-legend-word')
    expect(words.map((word) => word.text())).toEqual(['DATA', 'SOFTWARE', 'AI'])
    expect(words.map((word) => word.attributes('fill'))).toEqual(['#3699fa', '#1ed0e8', '#18d69a'])
    expect(parseFloat(words[0]!.attributes('x')!)).toBeCloseTo(1281.2, 4)
    expect(parseFloat(words[2]!.attributes('x')!)).toBeCloseTo(1506, 4)
    expect(parseFloat(words[0]!.attributes('y')!)).toBeCloseTo(729, 4)
    const bars = wrapper.findAll('.sf-tl-legend-bar')
    expect(bars).toHaveLength(3)
    expect(parseFloat(bars[0]!.attributes('y')!)).toBeCloseTo(794, 4)
    expect(parseFloat(bars[0]!.attributes('height')!)).toBe(5)
    const note = wrapper.find('.sf-tl-legend-note')
    expect(note.text()).toBe('THREE TEAMS ON ONE SHARED SYSTEM')
    expect(note.attributes('fill')).toBe('#b1b1bb')
    expect(parseFloat(note.attributes('y')!)).toBeCloseTo(832, 4)
  })

  it('re-tints fills, discs, ticks, and bars together through a palette override', () => {
    const wrapper = mountTimeline({ ...fullProps, palette: { accent: '#ff0000', accentAlt: '#00ff00' } })
    const fills = wrapper.findAll('.sf-tl-seg')
    expect(fills[0]!.attributes('fill')).toBe('#ff0000')
    expect(fills[1]!.attributes('fill')).toBe('#1ed0e8') // tertiary untouched
    expect(fills[2]!.attributes('fill')).toBe('#00ff00')
  })

  it('exposes the revealed sweep width and no hidden classes on mount', () => {
    const wrapper = mountTimeline(fullProps)
    const fill = wrapper.find('.sf-tl-seg')
    expect(fill.attributes('style')).toContain('--seg-w')
    expect(fill.classes()).not.toContain('slidev-vclick-hidden')
  })

  it('sweeps the fill over ~150ms after a 100ms beat and snaps backward', () => {
    mountTimeline(fullProps)
    const css = Array.from(document.querySelectorAll('style')).map((tag) => tag.textContent ?? '').join('\n')

    expect(css).toContain('transition: width 150ms')
    const hidden = css.match(/\.sf-tl-seg\.slidev-vclick-hidden[\s\S]*?\}/)?.[0] ?? ''
    expect(hidden).toContain('width: 0')
    expect(hidden).toContain('transition: none')
  })

  it('pops the disc ~100ms, cascades tick + row-1 label at 400ms, row 2 at 1300ms, legend last at 1.5s', () => {
    mountTimeline(fullProps)
    const css = Array.from(document.querySelectorAll('style')).map((tag) => tag.textContent ?? '').join('\n')

    // Pop: measured ~100ms scale/fade; hidden state snaps (no transition).
    expect(css).toContain('transition: transform 100ms')
    expect(css).toContain('transform: scale(0.6)')
    expect(css).toContain('.sf-tl-node.slidev-vclick-hidden .disc')
    // Tick + row-1 label cascade ~400ms after the pop.
    expect(css).toContain('opacity 250ms ease-out 400ms')
    // Row-2 dim label ~900ms after the cascade.
    expect(css).toContain('opacity 250ms ease-out 1300ms')
    // Legend fades last: 1.6s over a 1.5s post-final-click delay.
    expect(css).toContain('opacity 1600ms ease-in-out 1500ms')
  })

  it('ships a reduced-motion block that freezes the sweeps, pops, and fades', () => {
    mountTimeline(fullProps)
    const css = Array.from(document.querySelectorAll('style')).map((tag) => tag.textContent ?? '').join('\n')
    const reduced = css.match(/@media \(prefers-reduced-motion: reduce\)[\s\S]{0,400}/)?.[0] ?? ''

    expect(reduced).toContain('.sf-tl-seg')
    expect(reduced).toContain('.sf-tl-node')
    expect(reduced).toContain('.disc')
    expect(reduced).toContain('transition: none')
  })

  it('surfaces the layout RangeError for invalid composition instead of rendering blank', () => {
    // An empty segment list cannot render a sane timeline — the layout throws
    // before the DOM renders anything (fail fast, fail loud).
    expect(() => mountTimeline({ ...fullProps, segments: [] })).toThrow()
  })

  it('renders the two-tone header: white title + chrome-green titleAccent tail, ink extent pinned', () => {
    const wrapper = mountTimeline(fullProps)
    const html = wrapper.html()
    expect(html).toContain('Where is it')
    expect(html).toContain('heading?')
    // The measured title ink spans x563–1358 (795px); the mono face renders
    // wider, so the family pins the extent via TitleChrome's SVG textLength
    // (the shared mechanism NodeEdge introduced) — spacing-only, glyphs
    // never squeeze.
    expect(html).toContain('textLength="795"')
    expect(html).toContain('lengthAdjust="spacing"')
  })
})
