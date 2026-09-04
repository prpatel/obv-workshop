// @vitest-environment happy-dom
import { describe, expect, it } from 'vitest'
import { mount } from '@vue/test-utils'
import type { DirectiveBinding } from 'vue'
import SegmentTimeline from '../SegmentTimeline.vue'
import {
  FILL_GAP_FRAC,
  FILL_PAST_FRAC,
  LABEL_BASELINE_FRAC,
  LABEL_SIZE,
  LABEL_WHITE,
  LEAD_INSET_FRAC,
  LEAD_W_FRAC,
  LEAD_WHITE,
  NODE_BLUE,
  NODE_CYAN,
  NODE_R_FRAC,
  NODE_RED,
  SUBLABEL_BASELINE_FRAC,
  SUBLABEL_SIZE,
  TICK_LEN_FRAC,
  TICK_STROKE,
  TRACK_DIM,
  segmentTimelineLayout,
  type SegmentTimelineData,
  type TimelineSegment,
} from './timeline'

/**
 * Slidev registers the v-click directive globally at runtime; the render tests
 * stub it. The recording stub captures each binding value so the click
 * choreography itself is asserted (one click per segment: the node group pops
 * while its fill starts sweeping — sweep-then-pop); sweep rendering is
 * dogfooded against the dev server.
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
 * source's 211–222s timeline at ref frame t=220.5 (art_iHm120ov
 * §SegmentTimeline). Shares are the measured canvas-width fractions
 * 227/1920 blue + 400/1920 cyan + 480/1920 red; track geometry comes from the
 * component's measured defaults.
 */
const segments: TimelineSegment[] = [
  { id: 'batch', tone: 'accent', label: 'BATCH', sublabel: 'nightly warehouse exports', wFrac: 227 / 1920 },
  { id: 'stream', tone: 'tertiary', label: 'STREAMING', sublabel: 'change-data-capture feed', wFrac: 400 / 1920 },
  { id: 'cutover', tone: 'alt', label: 'CUTOVER', sublabel: 'dual-write drain-down', wFrac: 480 / 1920 },
]
const data = { segments, title: 'MIGRATION', titleAccent: 'TIMELINE' }

/** Measured track geometry as an explicit SegmentTimelineData (the component's defaults). */
const geo: SegmentTimelineData = {
  segments,
  yFrac: 490 / 1080,
  hFrac: 12 / 1080,
  x0Frac: 306 / 1920,
  x1Frac: 1653 / 1920,
}

/** Pull the numeric value of a --seg-w custom property from a style attribute. */
function segWidthPx(style: string | undefined): number {
  const match = /--seg-w:\s*([\d.]+)px/.exec(style ?? '')
  expect(match, `--seg-w missing in "${style}"`).toBeTruthy()
  return Number.parseFloat(match![1])
}

describe('measured constants — ref frame t=220.5 over the 1920×1080 read', () => {
  it('node, fill-overshoot, gap, and lead geometry in canvas fractions', () => {
    expect(NODE_R_FRAC).toBeCloseTo(50 / 1080, 6) // ~100px discs
    expect(FILL_PAST_FRAC).toBeCloseTo(30 / 1920, 6) // fill ends 30px past its node center
    expect(FILL_GAP_FRAC).toBeCloseTo(20 / 1920, 6) // x540→560, x960→980 gaps
    expect(LEAD_W_FRAC).toBeCloseTo(134 / 1920, 6) // white lead x1509–1641
    expect(LEAD_INSET_FRAC).toBeCloseTo(12 / 1920, 6) // inset from the track's right end
  })

  it('tick and label-block geometry in canvas fractions', () => {
    expect(TICK_LEN_FRAC).toBeCloseTo(157 / 1080, 6) // track bottom y502 → y659
    expect(LABEL_BASELINE_FRAC).toBeCloseTo(729 / 1080, 6) // big row glyphs y703–729
    expect(SUBLABEL_BASELINE_FRAC).toBeCloseTo(779 / 1080, 6) // small row glyphs y763–779
    expect(LABEL_SIZE).toBe(36)
    expect(SUBLABEL_SIZE).toBe(22)
    expect(TICK_STROKE).toBe(2) // measured 2px ticks
  })

  it('measured palette: blue / cyan / red trio, dim track, chrome whites', () => {
    expect(NODE_BLUE).toBe('#3699fa')
    expect(NODE_CYAN).toBe('#1ed0e8')
    expect(NODE_RED).toBe('#f75720')
    expect(TRACK_DIM).toBe('#001010')
    expect(LEAD_WHITE).toBe('#f5f4f7')
    expect(LABEL_WHITE).toBe('#f0f0f0')
  })
})

describe('segmentTimelineLayout', () => {
  it('track rect spans the measured band: x306–1653, y490–502', () => {
    const layout = segmentTimelineLayout(geo)
    expect(layout.track.x).toBeCloseTo(306, 1)
    expect(layout.track.y).toBeCloseTo(490, 1)
    expect(layout.track.width).toBeCloseTo(1347, 1)
    expect(layout.track.height).toBeCloseTo(12, 1)
  })

  it('white lead caps the track right end at its measured width and inset', () => {
    const layout = segmentTimelineLayout(geo)
    expect(layout.lead.width).toBeCloseTo(134, 1)
    expect(layout.lead.x + layout.lead.width).toBeCloseTo(1653 - 12, 1) // 12px inset from x1653
    expect(layout.lead.y).toBeCloseTo(490, 1)
    expect(layout.lead.height).toBeCloseTo(12, 1)
  })

  it('fills run between the nodes with measured gaps, each capped 30px past its node center', () => {
    const layout = segmentTimelineLayout(geo)
    expect(layout.segments).toHaveLength(3)

    // Fill 1 starts at the track's left end.
    expect(layout.segments[0]!.x).toBeCloseTo(306, 1)
    // Consecutive fills are separated by the measured 20px gap.
    for (let i = 1; i < layout.segments.length; i++) {
      expect(layout.segments[i]!.x).toBeCloseTo(layout.segments[i - 1]!.x + layout.segments[i - 1]!.width + 20, 1)
    }
    // The last fill stops one gap short of the lead.
    const last = layout.segments[layout.segments.length - 1]!
    expect(last.x + last.width).toBeCloseTo(layout.lead.x - 20, 1)
    // Node i sits 30px inside fill i's right end, on the track axis.
    for (const seg of layout.segments) {
      expect(seg.nodeCx).toBeCloseTo(seg.x + seg.width - 30, 1)
      expect(seg.nodeCy).toBeCloseTo(496, 1) // track center
      expect(seg.nodeR).toBeCloseTo(50, 1)
      expect(seg.glowR).toBeCloseTo(85, 1) // disc + 35px halo reach
    }
    // Node 1 lands on the measured x510.
    expect(layout.segments[0]!.nodeCx).toBeCloseTo(510, 1)
  })

  it('ticks hang from the track bottom to the measured y659, labels centered under the nodes', () => {
    const layout = segmentTimelineLayout(geo)
    for (const seg of layout.segments) {
      expect(seg.tickX).toBe(seg.nodeCx)
      expect(seg.tickY0).toBeCloseTo(502, 1)
      expect(seg.tickY0 + seg.tickLen).toBeCloseTo(659, 1)
      expect(seg.labelCx).toBe(seg.nodeCx)
      expect(seg.labelBaseline).toBeCloseTo(729, 1)
      expect(seg.sublabelBaseline).toBeCloseTo(779, 1)
    }
  })

  it('normalizes shares over the fillable span (left of the lead, minus gaps)', () => {
    const layout = segmentTimelineLayout(geo)
    const widths = layout.segments.map((seg) => seg.width)
    // Fill 3 is the widest, fill 1 the narrowest (measured ratio ~227:400:480).
    expect(widths[2]!).toBeGreaterThan(widths[1]!)
    expect(widths[1]!).toBeGreaterThan(widths[0]!)
    // Shares fill the fillable span exactly: first fill's left edge through the last fill's right edge.
    expect(layout.segments[0]!.x).toBeCloseTo(306, 1)
    const last = layout.segments[layout.segments.length - 1]!
    expect(last.x + last.width).toBeCloseTo(layout.lead.x - 20, 1)
  })

  it('splits equal shares when wFrac is omitted', () => {
    const layout = segmentTimelineLayout({
      ...geo,
      segments: [
        { id: 'a', tone: 'accent' },
        { id: 'b', tone: 'tertiary' },
        { id: 'c', tone: 'alt' },
      ],
    })
    const widths = layout.segments.map((seg) => seg.width)
    expect(widths[0]).toBeCloseTo(widths[1]!, 6)
    expect(widths[1]).toBeCloseTo(widths[2]!, 6)
  })

  it('weights shares 2:1 for mixed {2, omitted} wFracs', () => {
    const layout = segmentTimelineLayout({
      ...geo,
      segments: [
        { id: 'a', tone: 'accent', wFrac: 2 },
        { id: 'b', tone: 'tertiary' },
      ],
    })
    expect(layout.segments[1]!.width / layout.segments[0]!.width).toBeCloseTo(0.5, 6)
  })

  it('scales all geometry with a custom viewBox (SSR-safe fractions)', () => {
    const layout = segmentTimelineLayout(geo, { width: 960, height: 540 })
    expect(layout.track.x).toBeCloseTo(153, 1)
    expect(layout.track.y).toBeCloseTo(245, 1)
    expect(layout.track.height).toBeCloseTo(6, 1)
    expect(layout.segments[0]!.nodeR).toBeCloseTo(25, 1)
    expect(layout.segments[0]!.labelBaseline).toBeCloseTo(364.5, 1)
  })

  it('is deterministic — identical inputs produce identical layouts', () => {
    expect(segmentTimelineLayout(geo)).toEqual(segmentTimelineLayout(geo))
  })

  it('rejects invalid compositions with RangeError instead of rendering blank', () => {
    expect(() => segmentTimelineLayout({ ...geo, segments: [] })).toThrow(RangeError)
    expect(() => segmentTimelineLayout({ ...geo, segments: [{ id: 'x', tone: 'purple' as never }] })).toThrow(RangeError)
    expect(() => segmentTimelineLayout({ ...geo, segments: [{ id: 'x', tone: 'accent', wFrac: 0 }] })).toThrow(RangeError)
    expect(() => segmentTimelineLayout({ ...geo, segments: [{ id: 'x', tone: 'accent', wFrac: -1 }] })).toThrow(RangeError)
    expect(() => segmentTimelineLayout({ ...geo, x0Frac: 0.9, x1Frac: 0.2 })).toThrow(RangeError)
    expect(() => segmentTimelineLayout({ ...geo, yFrac: 0.99 })).toThrow(RangeError)
  })
})

describe('SegmentTimeline component', () => {
  it('spends exactly one click per segment — node pop + fill sweep together, no extra labels click', () => {
    const { clicks } = mountRecordingClicks(data)
    // 3 segments × (fill rect + node group) = 6 bindings; sorted: two per click.
    expect([...clicks].sort((a, b) => a - b)).toEqual([1, 1, 2, 2, 3, 3])
    expect(new Set(clicks)).toEqual(new Set([1, 2, 3]))
  })

  it('renders an accessible SVG with the segment count in its label', () => {
    const wrapper = mountTimeline(data)
    const svg = wrapper.find('svg')
    expect(svg.attributes('role')).toBe('img')
    expect(svg.attributes('aria-label')).toBe('3-segment timeline diagram')
    expect(svg.attributes('viewBox')).toBe('0 0 1920 1080')
  })

  it('renders the thin dim track and the bright white lead, always visible', () => {
    const wrapper = mountTimeline(data)
    const track = wrapper.find('rect.sf-tl-track')
    const lead = wrapper.find('rect.sf-tl-lead')
    expect(track.attributes('fill')).toBe('#001010')
    expect(track.attributes('y')).toBe('490')
    expect(track.attributes('height')).toBe('12')
    expect(lead.attributes('fill')).toBe('#f5f4f7')
    expect(Number(lead.attributes('width'))).toBeCloseTo(134, 0)
  })

  it('renders three fill rects pre-set to their sweep widths in the track band', () => {
    const wrapper = mountTimeline(data)
    const fills = wrapper.findAll('rect.sf-tl-seg')
    expect(fills).toHaveLength(3)
    const widths = fills.map((fill) => segWidthPx(fill.attributes('style')))
    expect(widths[0]!).toBeGreaterThan(0)
    expect(widths[2]!).toBeGreaterThan(widths[1]!)
    for (const fill of fills) {
      expect(fill.attributes('y')).toBe('490')
      expect(fill.attributes('height')).toBe('12')
    }
    // First fill starts at the measured track left edge.
    expect(Number(fills[0]!.attributes('x'))).toBeCloseTo(306, 0)
  })

  it('tints each segment with its node color: measured blue / cyan / red', () => {
    const wrapper = mountTimeline(data)
    const fills = wrapper.findAll('rect.sf-tl-seg')
    expect(fills[0]!.attributes('fill')).toBe('#3699fa')
    expect(fills[1]!.attributes('fill')).toBe('#1ed0e8')
    expect(fills[2]!.attributes('fill')).toBe('#f75720')
  })

  it('renders one glowing node per segment: disc in the node color inside a radial-gradient halo', () => {
    const wrapper = mountTimeline(data)
    const groups = wrapper.findAll('g.sf-tl-node')
    expect(groups).toHaveLength(3)

    const gradients = wrapper.findAll('radialGradient')
    expect(gradients).toHaveLength(3)
    const glowColors = gradients.map((grad) => grad.findAll('stop')[0]!.attributes('stop-color'))
    expect(glowColors).toEqual(['#3699fa', '#1ed0e8', '#f75720'])

    groups.forEach((group, i) => {
      const disc = group.find('circle.disc')
      const glow = group.find('circle.glow')
      expect(disc!.attributes('fill')).toBe(glowColors[i])
      expect(Number(disc!.attributes('r'))).toBeCloseTo(50, 0)
      // Halo extends 35px past the disc: measured 149–182px footprint.
      expect(Number(glow!.attributes('r'))).toBeCloseTo(85, 0)
    })
  })

  it('renders 2px node-colored ticks dropping from the track bottom toward the labels', () => {
    const wrapper = mountTimeline(data)
    const groups = wrapper.findAll('g.sf-tl-node')
    groups.forEach((group, i) => {
      const tick = group.find('line.sf-tl-tick')
      expect(tick!.attributes('stroke')).toBe(['#3699fa', '#1ed0e8', '#f75720'][i])
      expect(tick!.attributes('stroke-width')).toBe('2')
      expect(tick!.attributes('y1')).toBe('502')
      expect(Number(tick!.attributes('y2'))).toBeCloseTo(659, 0)
    })
  })

  it('renders the two-row white label block centered under each node', () => {
    const wrapper = mountTimeline(data)
    const groups = wrapper.findAll('g.sf-tl-node')
    groups.forEach((group) => {
      const label = group.find('text.sf-tl-label')
      const sublabel = group.find('text.sf-tl-sublabel')
      expect(label!.attributes('fill')).toBe('#f0f0f0')
      expect(label!.attributes('font-size')).toBe('36')
      expect(label!.attributes('text-anchor')).toBe('middle')
      expect(sublabel!.attributes('fill')).toBe('#f0f0f0')
      expect(sublabel!.attributes('font-size')).toBe('22')
      expect(Number(label!.attributes('y'))).toBeCloseTo(729, 0)
      expect(Number(sublabel!.attributes('y'))).toBeCloseTo(779, 0)
      expect(Number(label!.attributes('x'))).toBe(Number(group.find('circle.disc')!.attributes('cx')))
    })
    expect(groups[0]!.find('text.sf-tl-label')!.text()).toBe('BATCH')
  })

  it('re-tints fills, discs, and glow together through a palette override', () => {
    const wrapper = mountTimeline({ ...data, palette: { accent: '#ff1122' } })
    expect(wrapper.find('rect.sf-tl-seg').attributes('fill')).toBe('#ff1122')
    expect(wrapper.find('circle.disc').attributes('fill')).toBe('#ff1122')
    expect(wrapper.findAll('radialGradient')[0]!.findAll('stop')[0]!.attributes('stop-color')).toBe('#ff1122')
  })

  it('sweeps the fill as a gradual ~2.4s width transition and snaps backward', () => {
    mountTimeline(data)
    const css = Array.from(document.querySelectorAll('style')).map((tag) => tag.textContent ?? '').join('\n')

    expect(css).toContain('transition: width 2400ms')
    const hidden = css.match(/\.sf-tl-seg\.slidev-vclick-hidden[\s\S]*?\}/)?.[0] ?? ''
    expect(hidden).toContain('width: 0')
    expect(hidden).toContain('transition: none')
  })

  it('pops the node in ~140ms and fades its labels in after a beat', () => {
    mountTimeline(data)
    const css = Array.from(document.querySelectorAll('style')).map((tag) => tag.textContent ?? '').join('\n')

    expect(css).toContain('transition: transform 140ms')
    const hiddenDisc = css.match(/\.sf-tl-node\.slidev-vclick-hidden \.disc[\s\S]*?\}/)?.[0] ?? ''
    expect(hiddenDisc).toContain('transform: scale(0.6)')
    expect(hiddenDisc).toContain('transition: none')
    const labels = css.match(/\.sf-tl-tick[\s\S]*?\.sf-tl-sublabel[\s\S]*?\}/)?.[0] ?? ''
    expect(labels).toContain('transition: opacity 250ms')
    expect(labels).toContain('transition-delay: 120ms')
  })

  it('ships a reduced-motion block that freezes the sweeps, pops, and fades', () => {
    mountTimeline(data)
    const css = Array.from(document.querySelectorAll('style')).map((tag) => tag.textContent ?? '').join('\n')
    const reduced = css.match(/@media \(prefers-reduced-motion: reduce\)[\s\S]{0,400}/)?.[0] ?? ''

    expect(reduced).toContain('.sf-tl-seg')
    expect(reduced).toContain('.sf-tl-node')
    expect(reduced).toContain('.disc')
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
