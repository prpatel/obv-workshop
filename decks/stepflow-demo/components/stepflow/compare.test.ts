// @vitest-environment happy-dom
import { describe, expect, it, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import TwoBarCompare from '../TwoBarCompare.vue'
import {
  BAR_H_FRAC,
  BAR_X_FRAC,
  CAPTION_SIZE,
  CAPTION_Y_FRAC,
  CHIP_GAP_X_FRAC,
  CHIP_GAP_Y_FRAC,
  CHIP_H_FRAC,
  CHIP_W_FRAC,
  DATA_TEXT_COLOR,
  DATA_TEXT_LINE_SIZE,
  DATA_TEXT_SUB_SIZE,
  DATA_TEXT_Y_FRACS,
  LABEL_COLOR,
  LABEL_INSET_X_FRAC,
  LABEL_TEXT_LENGTHS,
  LEGEND_CHIP_COLORS,
  LEGEND_CHIP_H,
  LEGEND_CHIP_W,
  LEGEND_CHIP_XS,
  LEGEND_CHIP_Y,
  LEGEND_COLOR,
  LEGEND_SIZE,
  LEGEND_TEXT_X,
  LEGEND_Y_FRAC,
  MARK_BOX,
  MARK_COLOR,
  MEASURED_Y_FRACS,
  MINT_COLOR,
  NOTE_SIZE,
  NOTE_Y_FRAC,
  RULE_COLOR,
  RULE_H,
  RULE_W_FRAC,
  RULE_X_FRAC,
  RULE_Y_FRACS,
  SIDE_RAILS,
  SUB_GAP_Y_FRAC,
  TOP_BAND,
  TOP_CHIP_H_FRAC,
  TOP_CHIP_W_FRAC,
  TOP_CHIP_X_FRAC,
  TOP_CHIP_Y_FRAC,
  twoBarCompareLayout,
  type CompareBar,
} from './compare'

/** Slidev registers the v-click directive globally at runtime; the render tests stub it, capturing each element's click index. */
function mountTwoBar(props: {
  bars: CompareBar[]
  chip?: string
  dataText?: { lines: [string, string]; subline?: string; caption?: string; note?: string; legend?: string; rules?: boolean }
  palette?: object
  title?: string
  titleAccent?: string
}) {
  return mount(TwoBarCompare, {
    props,
    global: {
      directives: {
        click: {
          mounted(el: { dataset: Record<string, string> }, binding: { value: number }) {
            el.dataset.vclick = String(binding.value)
          },
        },
      },
    },
  })
}

/**
 * The demo seed mirrors the slide data (third-pass frame read, 2026-09-04):
 * bar lengths are the recording's measured fractions (research art_2kSBGNmJ
 * §3.6 — bar 1 red 416px, bar 2 amber 440px on the 1280px measurement basis),
 * red = `alt` / amber = `accent` under the statusAmber preset, labels are the
 * ref frame's full on-bar strings, and the ref frame carries no under-bar
 * notes (the old subs were current-implementation artifacts).
 */
const bars: CompareBar[] = [
  { id: 'red-bar', wFrac: 0.325, tone: 'alt', icon: 'server', label: 'EVERY CUSTOMER COMES BACK TWICE' },
  { id: 'amber-bar', wFrac: 0.34375, tone: 'accent', icon: 'cloud', label: 'THIS BACKFILLS THE SAME DAY TWICE' },
]

describe('measured constants — hand-computed to 1e-6', () => {
  it('anchors both bars at the recording x214', () => {
    expect(BAR_X_FRAC).toBeCloseTo(0.1671875, 6) // 214/1280 = 16.7%w
  })

  it('carries the bar height and the measured two-bar tops', () => {
    expect(BAR_H_FRAC).toBeCloseTo(0.0694444, 6) // 50/720
    expect(MEASURED_Y_FRACS[0]).toBeCloseTo(0.5708333, 6) // 411/720 = 57.1%h
    expect(MEASURED_Y_FRACS[1]).toBeCloseTo(0.8083333, 6) // 582/720 = 80.8%h
  })

  it('carries the icon-chip geometry and its gaps to the bar', () => {
    expect(CHIP_W_FRAC).toBeCloseTo(0.01796875, 6) // 23/1280
    expect(CHIP_H_FRAC).toBeCloseTo(0.0388889, 6) // 28/720
    expect(CHIP_GAP_X_FRAC).toBeCloseTo(0.00859375, 6) // 11/1280
    expect(CHIP_GAP_Y_FRAC).toBeCloseTo(0.0277778, 6) // 20/720
  })

  it('carries the top-right chip at its measured position', () => {
    expect(TOP_CHIP_X_FRAC).toBeCloseTo(0.76796875, 6) // 983/1280
    expect(TOP_CHIP_Y_FRAC).toBeCloseTo(0.2805556, 6) // 202/720
    expect(TOP_CHIP_W_FRAC).toBeCloseTo(0.096875, 6) // 124/1280
    expect(TOP_CHIP_H_FRAC).toBeCloseTo(0.0416667, 6) // 30/720
  })

  it('carries the derived annotation anchors', () => {
    expect(LABEL_INSET_X_FRAC).toBeCloseTo(28 / 1920, 6) // ref label ink x352 minus the mono bearing
    expect(SUB_GAP_Y_FRAC).toBeCloseTo(0.0194444, 6) // 14/720
  })

  it('carries the rework data-text block at its measured values (ref t=168.7s, third pass)', () => {
    // Char-advance measure over the SQL rows: ~30px mono, all three rows.
    expect(DATA_TEXT_LINE_SIZE).toBe(30)
    expect(DATA_TEXT_SUB_SIZE).toBe(30)
    expect(DATA_TEXT_COLOR).toBe('#84eef8')
    // Ink bands y411–441/485–514/549–587 → baselines y436/509/579 @1080.
    expect(DATA_TEXT_Y_FRACS[0]).toBeCloseTo(436 / 1080, 6)
    expect(DATA_TEXT_Y_FRACS[1]).toBeCloseTo(509 / 1080, 6)
    expect(DATA_TEXT_Y_FRACS[2]).toBeCloseTo(579 / 1080, 6)
  })

  it('carries the third-pass annotation layers: caption, mint note + mark, label tone, legend', () => {
    // Between-the-bars glyph rows: caption y752–767 (~16px cap ≈ 22px font,
    // baseline y767) over the mint note row (ink y802–830, ≈ 29px font, y827).
    expect(CAPTION_SIZE).toBe(22)
    expect(CAPTION_Y_FRAC).toBeCloseTo(767 / 1080, 6)
    expect(NOTE_SIZE).toBe(29)
    expect(NOTE_Y_FRAC).toBeCloseTo(827 / 1080, 6)
    expect(MINT_COLOR).toBe('#a2f9da')
    expect(MARK_COLOR).toBe('#24d19a')
    expect(MARK_BOX).toEqual({ x: 324, y: 791, w: 52, h: 46 })
    // On-bar labels: locked mission ink value (frame median #060203).
    expect(LABEL_COLOR).toBe('#0a0a0a')
    // Measured label ink extents (ref x352–912 / x352–948, +4px bearings):
    // the deck's mono runs ~4.8% wider than the recording's condensed face.
    expect(LABEL_TEXT_LENGTHS).toEqual([564, 600])
    // Legend: three 15×16 chips on the 28px pitch + gray caps text at x368.
    expect(LEGEND_CHIP_XS).toEqual([259, 287, 315])
    expect(LEGEND_CHIP_COLORS).toEqual(['#fc5b55', '#fbb72f', '#26c53f'])
    expect(LEGEND_CHIP_W).toBe(15)
    expect(LEGEND_CHIP_H).toBe(16)
    expect(LEGEND_CHIP_Y).toBe(315)
    expect(LEGEND_TEXT_X).toBe(368)
    expect(LEGEND_SIZE).toBe(19)
    expect(LEGEND_Y_FRAC).toBeCloseTo(328 / 1080, 6)
    expect(LEGEND_COLOR).toBe('#a3a3ac')
  })

  it('carries the ambient frame: dim band above the legend and the two side rails', () => {
    expect(TOP_BAND).toEqual({ x: 236, y: 276, w: 1446, h: 28, fill: '#161518' })
    expect(SIDE_RAILS).toEqual([
      { x: 233, y: 861, w: 5, h: 100, fill: '#1c170d' },
      { x: 1682, y: 861, w: 5, h: 100, fill: '#0c0b0f' },
    ])
  })

  it('carries the census-pass-2 divider rules at their measured values (ref t=168.7s)', () => {
    // 2px #1e1e20 rows at y722/y970 spanning x234–1685.
    expect(RULE_X_FRAC).toBeCloseTo(234 / 1920, 6)
    expect(RULE_W_FRAC).toBeCloseTo(1451 / 1920, 6)
    expect(RULE_H).toBe(2)
    expect(RULE_Y_FRACS[0]).toBeCloseTo(722 / 1080, 6)
    expect(RULE_Y_FRACS[1]).toBeCloseTo(970 / 1080, 6)
    expect(RULE_COLOR).toBe('#1e1e20')
  })
})

describe('twoBarCompareLayout — resolved geometry', () => {
  it('reproduces the measured two-bar composition at 1920×1080', () => {
    const l = twoBarCompareLayout({ bars })
    expect(l.viewBox).toEqual({ width: 1920, height: 1080 })

    // Bar 1: x214→630, y411→461 on the 1280×720 basis (×1.5 at 1920×1080).
    expect(l.bars[0].x).toBeCloseTo(321, 6)
    expect(l.bars[0].y).toBeCloseTo(616.5, 6)
    expect(l.bars[0].w).toBeCloseTo(624, 6)
    expect(l.bars[0].h).toBeCloseTo(75, 6)
    // Bar 1 ends at 49.2%w: (0.1671875 + 0.325) × 1920 = 945.
    expect(l.bars[0].x + l.bars[0].w).toBeCloseTo(0.4921875 * 1920, 6)

    // Bar 2: y582, 440px long — ends at 51.1%w: (0.1671875 + 0.34375) × 1920 = 981.
    expect(l.bars[1].y).toBeCloseTo(873, 6)
    expect(l.bars[1].w).toBeCloseTo(660, 6)
    expect(l.bars[1].x + l.bars[1].w).toBeCloseTo(0.5109375 * 1920, 6)
    expect(l.bars[1].h).toBeCloseTo(75, 6)
  })

  it('derives each icon chip above-left of its bar from the measured gaps', () => {
    const l = twoBarCompareLayout({ bars })
    const chip = l.bars[0].chip!
    // x180, y363 on the measurement basis (×1.5): right edge 11px left of the
    // bar, bottom 20px above the bar top.
    expect(chip.x).toBeCloseTo(270, 6)
    expect(chip.y).toBeCloseTo(544.5, 6)
    expect(chip.w).toBeCloseTo(34.5, 6)
    expect(chip.h).toBeCloseTo(42, 6)
    expect(chip.cx).toBeCloseTo(287.25, 6)
    expect(chip.cy).toBeCloseTo(565.5, 6)
    // Chip 2 hangs off bar 2's own top.
    expect(l.bars[1].chip!.y).toBeCloseTo((582 - 20 - 28) / 720 * 1080, 6)
  })

  it('anchors the on-bar labels and under-bar notes off their bars', () => {
    const l = twoBarCompareLayout({ bars })
    // Label: 28px inset from the shared anchor (ref ink x352), vertically
    // centered on the bar.
    expect(l.bars[0].labelX).toBeCloseTo((214 * 1.5) + 28, 6)
    expect(l.bars[0].labelY).toBeCloseTo(616.5 + 37.5, 6)
    expect(l.bars[1].labelY).toBeCloseTo(873 + 37.5, 6)
    // Measured textLength pins ride the two measured bars; others stay natural.
    expect(l.bars.map((b) => b.labelLength)).toEqual([564, 600])
    const unmeasured = twoBarCompareLayout({
      bars: [
        { id: 'a', wFrac: 0.2, tone: 'accent' },
        { id: 'b', wFrac: 0.3, tone: 'alt' },
        { id: 'c', wFrac: 0.4, tone: 'accent' },
      ],
      xFrac: 0.1,
      barHFrac: 0.05,
      yFracs: [0.2, 0.5, 0.8],
    })
    expect(unmeasured.bars.every((b) => b.labelLength === null)).toBe(true)
    // Sub note: aligned with the bar's left edge, one gap under its bottom.
    const withSub = twoBarCompareLayout({ bars: [{ ...bars[0], sub: 'S' }, bars[1]] })
    expect(withSub.bars[0].subX).toBeCloseTo(321, 6)
    expect(withSub.bars[0].subY).toBeCloseTo((411 + 50 + 14) / 720 * 1080, 6)
  })

  it('resolves the top-right chip at its measured rect', () => {
    const l = twoBarCompareLayout({ bars })
    expect(l.topChip.x).toBeCloseTo(983 / 1280 * 1920, 6) // 1474.5
    expect(l.topChip.y).toBeCloseTo(202 / 720 * 1080, 6) // 303
    expect(l.topChip.w).toBeCloseTo(124 / 1280 * 1920, 6) // 186
    expect(l.topChip.h).toBeCloseTo(30 / 720 * 1080, 6) // 45
  })

  it('resolves the data-text rows left-anchored on the bar anchor at the measured baselines', () => {
    const l = twoBarCompareLayout({ bars, dataText: { lines: ['A', 'B'], subline: 'C' } })

    expect(l.dataText).toHaveLength(3)
    l.dataText.forEach((line) => expect(line.x).toBeCloseTo(0.1671875 * 1920, 6)) // the shared bar anchor
    expect(l.dataText[0]).toMatchObject({ text: 'A', size: 30 })
    expect(l.dataText[1]).toMatchObject({ text: 'B', size: 30 })
    expect(l.dataText[2]).toMatchObject({ text: 'C', size: 30 })
    l.dataText.forEach((line, i) => expect(line.y).toBeCloseTo([436, 509, 579][i], 6))
  })

  it('omits the optional data-text subline and resolves an empty block when absent', () => {
    const withoutSubline = twoBarCompareLayout({ bars, dataText: { lines: ['A', 'B'] } })
    expect(withoutSubline.dataText).toHaveLength(2)
    expect(twoBarCompareLayout({ bars }).dataText).toEqual([])
  })

  it('resolves the legend row: three fixed-tone chips on the 28px pitch + gray caps text', () => {
    const l = twoBarCompareLayout({ bars, dataText: { lines: ['A', 'B'], legend: 'mart_revenue.sql' } })
    expect(l.legend).not.toBeNull()
    expect(l.legend!.chips.map((c) => c.fill)).toEqual(['#fc5b55', '#fbb72f', '#26c53f'])
    expect(l.legend!.chips.map((c) => c.x)).toEqual([259, 287, 315])
    expect(l.legend!.chips[0]).toMatchObject({ y: 315, w: 15, h: 16 })
    expect(l.legend!.text).toMatchObject({ text: 'mart_revenue.sql', x: 368, y: 328, size: 19 })
    expect(twoBarCompareLayout({ bars, dataText: { lines: ['A', 'B'] } }).legend).toBeNull()
  })

  it('resolves the caption/note rows on the bar anchor at the measured baselines, and the rules as measured rects', () => {
    const l = twoBarCompareLayout({
      bars,
      dataText: { lines: ['A', 'B'], caption: 'C', note: 'N', rules: true },
    })

    expect(l.caption).toMatchObject({ text: 'C', x: 0.1671875 * 1920, y: 767, size: 22 })
    expect(l.note).toMatchObject({ text: 'N', x: 0.1671875 * 1920, y: 827, size: 29 })
    expect(l.rules).toHaveLength(2)
    l.rules.forEach((rule, i) => {
      expect(rule.x).toBeCloseTo(234 / 1920 * 1920, 6)
      expect(rule.y).toBeCloseTo([722, 970][i], 6)
      expect(rule.w).toBeCloseTo(1451 / 1920 * 1920, 6)
      expect(rule.h).toBe(2)
    })
    // Absent fields resolve null/empty — no phantom layers.
    const bare = twoBarCompareLayout({ bars, dataText: { lines: ['A', 'B'] } })
    expect(bare.caption).toBeNull()
    expect(bare.note).toBeNull()
    expect(bare.rules).toEqual([])
  })

  it('honors explicit geometry overrides and a non-measured bar count', () => {
    const three: CompareBar[] = [
      { id: 'a', wFrac: 0.2, tone: 'accent' },
      { id: 'b', wFrac: 0.3, tone: 'alt' },
      { id: 'c', wFrac: 0.4, tone: 'accent' },
    ]
    const l = twoBarCompareLayout(
      { bars: three, xFrac: 0.1, barHFrac: 0.05, yFracs: [0.2, 0.5, 0.8] },
      { width: 1000, height: 1000 },
    )
    expect(l.bars.map((b) => b.x)).toEqual([100, 100, 100])
    expect(l.bars.map((b) => b.y)).toEqual([200, 500, 800])
    expect(l.bars.map((b) => b.w)).toEqual([200, 300, 400])
    expect(l.bars.map((b) => b.h)).toEqual([50, 50, 50])
    expect(l.bars[0].chip).toBeNull() // no icon → no chip
  })

  it('omits the chip for bars without an icon', () => {
    const l = twoBarCompareLayout({ bars: [{ id: 'plain', wFrac: 0.3, tone: 'alt' }, bars[1]] })
    expect(l.bars[0].chip).toBeNull()
    expect(l.bars[1].chip).not.toBeNull()
  })

  it('validates shape and ranges instead of rendering blank', () => {
    expect(() => twoBarCompareLayout({ bars: [] })).toThrow(RangeError)
    // The measured default covers exactly two bars; other counts need yFracs.
    expect(() => twoBarCompareLayout({ bars: [bars[0]] })).toThrow(RangeError)
    expect(() => twoBarCompareLayout({ bars: [...bars, bars[0]] })).toThrow(RangeError)
    // Length mismatch, even for two bars.
    expect(() => twoBarCompareLayout({ bars, yFracs: [0.5] })).toThrow(RangeError)
    // Fraction typos throw.
    expect(() => twoBarCompareLayout({ bars, xFrac: 12 })).toThrow(RangeError)
    expect(() => twoBarCompareLayout({ bars, barHFrac: -0.1 })).toThrow(RangeError)
    expect(() => twoBarCompareLayout({ bars: [{ ...bars[0], wFrac: 0 }], yFracs: [0.5, 0.8] })).toThrow(RangeError)
    expect(() => twoBarCompareLayout({ bars: [{ ...bars[0], wFrac: 1.2 }], yFracs: [0.5, 0.8] })).toThrow(RangeError)
    expect(() => twoBarCompareLayout({ bars, yFracs: [0.5, 1.1] })).toThrow(RangeError)
  })

  it('is deterministic for the same inputs', () => {
    expect(JSON.stringify(twoBarCompareLayout({ bars, chip: 'Q3' })))
      .toBe(JSON.stringify(twoBarCompareLayout({ bars, chip: 'Q3' })))
  })
})

describe('TwoBarCompare component', () => {
  it('renders one group per bar plus the annotation layer, consuming exactly 3 clicks', () => {
    const wrapper = mountTwoBar({ bars, chip: 'GENERATED' })

    expect(wrapper.find('svg.twobarcompare').exists()).toBe(true)
    const barGroups = wrapper.findAll('.sf-tbc-bar')
    expect(barGroups).toHaveLength(2)
    expect(wrapper.find('.sf-tbc-annot').exists()).toBe(true)

    // Click choreography: bar 1 → click 1, bar 2 → click 2, annotations → click 3.
    expect(barGroups[0].attributes('data-vclick')).toBe('1')
    expect(barGroups[1].attributes('data-vclick')).toBe('2')
    expect(wrapper.find('.sf-tbc-annot').attributes('data-vclick')).toBe('3')

    const indices = wrapper.findAll('[data-vclick]').map((el) => Number(el.attributes('data-vclick')))
    expect(Math.max(...indices)).toBe(3) // the slide's total click count
  })

  it('exposes the measured canvas and an accessible name', () => {
    const wrapper = mountTwoBar({ bars })

    expect(wrapper.find('svg.twobarcompare').attributes('viewBox')).toBe('0 0 1920 1080')
    expect(wrapper.find('svg.twobarcompare').attributes('role')).toBe('img')
    expect(wrapper.find('svg.twobarcompare').attributes('aria-label')).toBe('2-bar comparison diagram')
  })

  it('maps tones over statusAmber verbatim: alt → red accentAlt, accent → amber', () => {
    const wrapper = mountTwoBar({ bars })
    const rects = wrapper.findAll('.sf-tbc-bar-rect')

    expect(rects[0].attributes('fill')).toBe('#e5413f') // bar 1 red
    expect(rects[1].attributes('fill')).toBe('#f7ba20') // bar 2 amber
  })

  it('renders both icon chips in chrome and resolves their registry icons', () => {
    const wrapper = mountTwoBar({ bars })
    const chips = wrapper.findAll('.sf-tbc-chip')
    const icons = wrapper.findAll('.sf-tbc-chip-icon')

    expect(chips).toHaveLength(2)
    chips.forEach((chip) => {
      // Rework: solid family-amber plates, no outline stroke.
      expect(chip.attributes('fill')).toBe('#f7ba20')
      expect(chip.attributes('stroke')).toBeUndefined()
    })
    icons.forEach((icon) => expect(icon.attributes('stroke')).toBe('#000000')) // dark strokes on amber
    // 'server' registry geometry: two stacked rects.
    expect(icons[0].html()).toContain('<rect')
    // 'cloud' registry geometry: the cloud path.
    expect(icons[1].html()).toContain('<path')
  })

  it('renders the fallback icon and warns on an unknown icon key', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
    try {
      const bad: CompareBar[] = [{ id: 'x', wFrac: 0.3, tone: 'alt', icon: 'not-a-key' }, bars[1]]
      const wrapper = mountTwoBar({ bars: bad })

      expect(warn).toHaveBeenCalledWith(expect.stringContaining('not-a-key'))
      // ICON_FALLBACK (Lucide circle-help) geometry must be in the markup.
      expect(wrapper.find('.sf-tbc-chip-icon').html()).toContain('r="10"')
    } finally {
      warn.mockRestore()
    }
  })

  it('reveals the glyph rows and top chip together on the annotation click', () => {
    const wrapper = mountTwoBar({ bars, chip: 'GENERATED' })
    const annot = wrapper.find('.sf-tbc-annot')

    expect(annot.text()).toContain('EVERY CUSTOMER COMES BACK TWICE')
    expect(annot.text()).toContain('THIS BACKFILLS THE SAME DAY TWICE')
    expect(annot.text()).toContain('GENERATED')
    // The top chip is the recording's teal plate with white text.
    expect(annot.find('.sf-tbc-topchip').attributes('fill')).toBe('#1cd797')
    expect(annot.find('.sf-tbc-topchip-text').attributes('fill')).toBe('#ffffff')
  })

  it('renders the measured on-bar labels: dark 32px strings in per-bar fade classes', () => {
    const wrapper = mountTwoBar({ bars })
    const labels = wrapper.findAll('.sf-tbc-label')

    expect(labels).toHaveLength(2)
    expect(labels[0].classes()).toContain('sf-tbc-label-1')
    expect(labels[1].classes()).toContain('sf-tbc-label-2')
    labels.forEach((label) => {
      expect(label.attributes('fill')).toBe('#0a0a0a')
      expect(Number(label.attributes('font-size'))).toBe(32)
    })
    // Measured extents pin the condensed-face tails (ref ink x352–912/x352–948).
    expect(labels[0].attributes('textLength')).toBe('564')
    expect(labels[1].attributes('textLength')).toBe('600')
    labels.forEach((label) => expect(label.attributes('lengthAdjust')).toBe('spacing'))
    expect(labels[0].text()).toBe('EVERY CUSTOMER COMES BACK TWICE')
    expect(labels[1].text()).toBe('THIS BACKFILLS THE SAME DAY TWICE')
  })

  it('still renders optional under-bar subs for the generic contract (the ref frame has none)', () => {
    const wrapper = mountTwoBar({ bars: [{ ...bars[0], label: 'L', sub: 'S' }, bars[1]] })
    const sub = wrapper.find('.sf-tbc-sub')

    expect(sub.text()).toBe('S')
    expect(Number(sub.attributes('font-size'))).toBe(28)
    expect(sub.attributes('fill')).toBe('#a6a8ae')
  })

  it('renders the measured cyan data-text block on the annotation click', () => {
    const wrapper = mountTwoBar({
      bars,
      chip: 'GENERATED',
      dataText: {
        lines: ['select c.id, sum(o.total)', 'from customers c join orders o on c.id = o.customer_id'],
        subline: 'join refunds r on r.order_id = o.id group by 1',
      },
    })

    const lines = wrapper.findAll('.sf-tbc-dataline')
    expect(lines).toHaveLength(3)
    lines.forEach((line) => expect(line.attributes('fill')).toBe('#84eef8'))
    lines.forEach((line) => expect(Number(line.attributes('font-size'))).toBe(30))
    // Rides the shared annotation click (click 3), like the other glyph rows.
    expect(wrapper.find('.sf-tbc-annot').attributes('data-vclick')).toBe('3')
    wrapper.findAll('.sf-tbc-dataline').forEach((line) => expect(line.attributes('font-weight')).toBe('700'))
  })

  it('renders the census-pass-2 layers: divider rules, caption, mint note + traced teal mark', () => {
    const wrapper = mountTwoBar({
      bars,
      dataText: {
        lines: ['select c.id, sum(o.total)', 'from customers c join orders o on c.id = o.customer_id'],
        caption: 'SUGGESTED PIPELINE DESIGN',
        note: 'backfill the whole table every night',
        rules: true,
      },
    })

    // Divider rules: two 2px #1e1e20 rows at the measured y positions.
    const rules = wrapper.findAll('.sf-tbc-rule')
    expect(rules).toHaveLength(2)
    rules.forEach((rule) => {
      expect(rule.attributes('fill')).toBe('#1e1e20')
      expect(Number(rule.attributes('height'))).toBe(2)
    })
    expect(Number(rules[0].attributes('y'))).toBe(722)
    expect(Number(rules[1].attributes('y'))).toBe(970)

    // Caption (dim, 22px, wide caps tracking) rides the annotation click.
    const caption = wrapper.find('.sf-tbc-caption')
    expect(caption.text()).toBe('SUGGESTED PIPELINE DESIGN')
    expect(Number(caption.attributes('font-size'))).toBe(22)
    expect(caption.attributes('fill')).toBe('#a6a8ae')
    expect(caption.attributes('letter-spacing')).toBe('0.15em')

    // Mint note (29px bold) introduced by the traced teal mark.
    const note = wrapper.find('.sf-tbc-note')
    expect(note.text()).toBe('backfill the whole table every night')
    expect(Number(note.attributes('font-size'))).toBe(29)
    expect(note.attributes('fill')).toBe('#a2f9da')
    expect(note.attributes('font-weight')).toBe('700')
    const mark = wrapper.find('.sf-tbc-mark')
    expect(mark.attributes('stroke')).toBe('#24d19a')
    expect(mark.attributes('d')).toContain('M 344 791')
  })

  it('renders the legend row and the ambient frame inside the annotation core', () => {
    const wrapper = mountTwoBar({
      bars,
      chip: 'GENERATED',
      dataText: {
        lines: ['select c.id, sum(o.total)', 'from customers c join orders o on c.id = o.customer_id'],
        legend: 'mart_revenue.sql',
        rules: true,
      },
    })

    // The core group fades on the click; the labels fade later outside it.
    expect(wrapper.find('.sf-tbc-annot-core').exists()).toBe(true)
    expect(wrapper.find('.sf-tbc-annot-core .sf-tbc-label').exists()).toBe(false)

    const chips = wrapper.findAll('.sf-tbc-legend-chip')
    expect(chips.map((c) => c.attributes('fill'))).toEqual(['#fc5b55', '#fbb72f', '#26c53f'])
    const legend = wrapper.find('.sf-tbc-legend-text')
    expect(legend.text()).toBe('mart_revenue.sql')
    expect(legend.attributes('fill')).toBe('#a3a3ac')

    // Ambient frame: dim band above the legend + the two side rails.
    const band = wrapper.find('.sf-tbc-topband')
    expect(band.attributes('fill')).toBe('#161518')
    expect(Number(band.attributes('x'))).toBe(236)
    expect(Number(band.attributes('y'))).toBe(276)
    expect(Number(band.attributes('width'))).toBe(1446)
    const rails = wrapper.findAll('.sf-tbc-rail')
    expect(rails).toHaveLength(2)
    expect(rails[0].attributes('fill')).toBe('#1c170d')
    expect(rails[1].attributes('fill')).toBe('#0c0b0f')
    rails.forEach((rail) => {
      expect(Number(rail.attributes('y'))).toBe(861)
      expect(Number(rail.attributes('height'))).toBe(100)
    })
  })

  it('renders the annotation layer for a rules-only block (no labels or chip)', () => {
    const wrapper = mountTwoBar({
      bars: [
        { id: 'a', wFrac: 0.3, tone: 'accent' },
        { id: 'b', wFrac: 0.2, tone: 'alt' },
      ],
      dataText: { lines: ['A', 'B'], rules: true },
    })

    expect(wrapper.find('.sf-tbc-annot').exists()).toBe(true)
    expect(wrapper.findAll('.sf-tbc-rule')).toHaveLength(2)
  })

  it('renders no annotation layer when the diagram has no labels or chip', () => {
    const wrapper = mountTwoBar({ bars: [{ id: 'a', wFrac: 0.3, tone: 'accent' }, { id: 'b', wFrac: 0.2, tone: 'alt' }] })

    expect(wrapper.find('.sf-tbc-annot').exists()).toBe(false)
  })

  it('surfaces the layout RangeError for a non-measured bar count instead of rendering blank', () => {
    expect(() => mountTwoBar({ bars: [bars[0]] })).toThrow(RangeError)
  })

  it('carries the measured timing constants, hidden-state snap, label windows, and reduced-motion block in its rendered styles', () => {
    mountTwoBar({ bars, chip: 'GENERATED' })

    const css = Array.from(document.querySelectorAll('style'))
      .map((tag) => tag.textContent ?? '')
      .join('\n')

    expect(css).toContain('150ms') // bar pop + static annotation fade (§9 scale)
    expect(css).toContain('183ms') // label 1 fade duration: window 2800–2983ms
    expect(css).toContain('2800ms') // label 1 delay — settles first, arrives late
    expect(css).toContain('200ms') // label 2 fade duration: window 7467–7667ms
    expect(css).toContain('7467ms') // label 2 delay
    // The annotation group flips instantly; its children own the fades.
    expect(css).toContain('.sf-tbc-annot.slidev-vclick-hidden .sf-tbc-annot-core')
    expect(css).toContain('.sf-tbc-annot.slidev-vclick-hidden .sf-tbc-label')
    expect(css).toContain('prefers-reduced-motion') // transitions disabled, instant state
  })

  it('renders the two-tone header on the shared chrome and condenses it to the measured extent', () => {
    const wrapper = mountTwoBar({ bars, title: 'Is it', titleAccent: ' actually correct?' })
    const header = wrapper.find('.sf-chrome-title')

    expect(header.text()).toContain('Is it')
    expect(header.html()).toContain('#66fb00')
    // The ref headline's measured ink extent x565–1359 → 796px textLength pin
    // (TitleChrome.titleTextLength, the PR #42 mechanism).
    expect(header.html()).toContain('textLength="796"')
    expect(header.html()).toContain('lengthAdjust="spacing"')
  })
})
