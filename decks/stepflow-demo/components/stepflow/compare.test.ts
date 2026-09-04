// @vitest-environment happy-dom
import { describe, expect, it, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import TwoBarCompare from '../TwoBarCompare.vue'
import {
  BAR_H_FRAC,
  BAR_X_FRAC,
  CHIP_GAP_X_FRAC,
  CHIP_GAP_Y_FRAC,
  CHIP_H_FRAC,
  CHIP_W_FRAC,
  DATA_TEXT_COLOR,
  DATA_TEXT_LINE_SIZE,
  DATA_TEXT_SUB_SIZE,
  DATA_TEXT_Y_FRACS,
  LABEL_INSET_X_FRAC,
  MEASURED_Y_FRACS,
  SUBHEAD_SIZE,
  SUBHEAD_Y_FRAC,
  SUB_GAP_Y_FRAC,
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
  dataText?: { lines: [string, string]; subline?: string }
  palette?: object
  title?: string
  titleAccent?: string
  subhead?: string
  subheadAccent?: string
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
 * The demo seed mirrors the slide data: bar lengths are the recording's
 * measured fractions (research art_2kSBGNmJ §3.6 — bar 1 red 416px, bar 2
 * amber 440px on the 1280px measurement basis), red = `alt` / amber =
 * `accent` under the statusAmber preset.
 */
const bars: CompareBar[] = [
  { id: 'on-prem', wFrac: 0.325, tone: 'alt', icon: 'server', label: 'ON-PREM', sub: 'SELF-MANAGED' },
  { id: 'cloud', wFrac: 0.34375, tone: 'accent', icon: 'cloud', label: 'CLOUD', sub: 'MANAGED' },
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
    expect(LABEL_INSET_X_FRAC).toBeCloseTo(0.01875, 6) // 24/1280
    expect(SUB_GAP_Y_FRAC).toBeCloseTo(0.0194444, 6) // 14/720
  })

  it('carries the rework data-text block and subhead at their measured values (ref t=168.7s)', () => {
    expect(DATA_TEXT_LINE_SIZE).toBe(40) // ~29px cap
    expect(DATA_TEXT_SUB_SIZE).toBe(29) // ~21px cap
    expect(DATA_TEXT_COLOR).toBe('#84eef8')
    // Cap tops y411/485/559 → baselines y440/514/580 on the 1080 basis.
    expect(DATA_TEXT_Y_FRACS[0]).toBeCloseTo(440 / 1080, 6)
    expect(DATA_TEXT_Y_FRACS[1]).toBeCloseTo(514 / 1080, 6)
    expect(DATA_TEXT_Y_FRACS[2]).toBeCloseTo(580 / 1080, 6)
    expect(SUBHEAD_SIZE).toBe(71) // ~52px cap centered headline
    expect(SUBHEAD_Y_FRAC).toBeCloseTo(161 / 1080, 6) // baseline y161
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
    // Label: inset from the shared anchor, vertically centered on the bar.
    expect(l.bars[0].labelX).toBeCloseTo((214 + 24) / 1280 * 1920, 6)
    expect(l.bars[0].labelY).toBeCloseTo(616.5 + 37.5, 6)
    expect(l.bars[1].labelY).toBeCloseTo(873 + 37.5, 6)
    // Sub note: aligned with the bar's left edge, one gap under its bottom.
    expect(l.bars[0].subX).toBeCloseTo(321, 6)
    expect(l.bars[0].subY).toBeCloseTo((411 + 50 + 14) / 720 * 1080, 6)
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
    expect(l.dataText[0]).toMatchObject({ text: 'A', y: 440, size: 40 })
    expect(l.dataText[1]).toMatchObject({ text: 'B', y: 514, size: 40 })
    expect(l.dataText[2]).toMatchObject({ text: 'C', size: 29 })
    l.dataText.forEach((line, i) => expect(line.y).toBeCloseTo([440, 514, 580][i], 6))
  })

  it('omits the optional data-text subline and resolves an empty block when absent', () => {
    const withoutSubline = twoBarCompareLayout({ bars, dataText: { lines: ['A', 'B'] } })
    expect(withoutSubline.dataText).toHaveLength(2)
    expect(twoBarCompareLayout({ bars }).dataText).toEqual([])
  })

  it('centers the subhead row at its measured baseline and drops it when absent', () => {
    const l = twoBarCompareLayout({ bars, subhead: 'INFRA', subheadAccent: 'COST' })
    expect(l.subhead).toMatchObject({ x: 960, text: 'INFRA', accent: 'COST' }) // canvas mid
    expect(l.subhead!.y).toBeCloseTo(161, 6)
    expect(twoBarCompareLayout({ bars }).subhead).toBeNull()
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
    const wrapper = mountTwoBar({ bars, chip: 'Q3' })

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
    const wrapper = mountTwoBar({ bars, chip: 'Q3' })
    const annot = wrapper.find('.sf-tbc-annot')

    expect(annot.text()).toContain('ON-PREM')
    expect(annot.text()).toContain('CLOUD')
    expect(annot.text()).toContain('SELF-MANAGED')
    expect(annot.text()).toContain('MANAGED')
    expect(annot.text()).toContain('Q3')
    // The top chip is the recording's teal plate with white text.
    expect(annot.find('.sf-tbc-topchip').attributes('fill')).toBe('#1cd797')
    expect(annot.find('.sf-tbc-topchip-text').attributes('fill')).toBe('#ffffff')
  })

  it('renders the rework label classes: dark on-bar labels over the gray under-bar notes', () => {
    const wrapper = mountTwoBar({ bars })
    const label = wrapper.find('.sf-tbc-label')
    const sub = wrapper.find('.sf-tbc-sub')

    // ~2.4× the pre-rework rows: 32px on-bar (dark) over 28px under-bar (gray).
    expect(Number(label.attributes('font-size'))).toBe(32)
    expect(label.attributes('fill')).toBe('#000000')
    expect(Number(sub.attributes('font-size'))).toBe(28)
    expect(sub.attributes('fill')).toBe('#a6a8ae')
  })

  it('renders the big cyan data-text block on the annotation click and the subhead as always-visible chrome', () => {
    const wrapper = mountTwoBar({
      bars,
      chip: 'FY26',
      dataText: {
        lines: ['1.9M VCPU INSTALLED', '0.12M VCPU HOURS ACROSS 12 CLUSTERS · Q3'],
        subline: 'SELF-MANAGED RACKS VS MANAGED CLOUD REGIONS.',
      },
      subhead: 'INFRA',
      subheadAccent: 'COST · FY26 SPLIT',
    })

    const lines = wrapper.findAll('.sf-tbc-dataline')
    expect(lines).toHaveLength(3)
    lines.forEach((line) => expect(line.attributes('fill')).toBe('#84eef8'))
    expect(Number(lines[0].attributes('font-size'))).toBe(40)
    expect(Number(lines[2].attributes('font-size'))).toBe(29)
    // Rides the shared annotation click (click 3), like the other glyph rows.
    expect(wrapper.find('.sf-tbc-annot').attributes('data-vclick')).toBe('3')

    // Subhead is header chrome — always visible, centered, two-tone.
    const subhead = wrapper.find('text.sf-tbc-subhead')
    expect(subhead.exists()).toBe(true)
    expect(subhead.attributes('text-anchor')).toBe('middle')
    expect(Number(subhead.attributes('font-size'))).toBe(71)
    expect(subhead.attributes('data-vclick')).toBeUndefined()
    expect(subhead.text()).toContain('INFRA')
    expect(subhead.html()).toContain('#66fb00')
  })

  it('renders no annotation layer when the diagram has no labels or chip', () => {
    const wrapper = mountTwoBar({ bars: [{ id: 'a', wFrac: 0.3, tone: 'accent' }, { id: 'b', wFrac: 0.2, tone: 'alt' }] })

    expect(wrapper.find('.sf-tbc-annot').exists()).toBe(false)
  })

  it('surfaces the layout RangeError for a non-measured bar count instead of rendering blank', () => {
    expect(() => mountTwoBar({ bars: [bars[0]] })).toThrow(RangeError)
  })

  it('carries the measured timing constants, hidden-state snap, and reduced-motion block in its rendered styles', () => {
    mountTwoBar({ bars, chip: 'Q3' })

    const css = Array.from(document.querySelectorAll('style'))
      .map((tag) => tag.textContent ?? '')
      .join('\\n')

    expect(css).toContain('150ms') // bar pop + fades (§9 scale)
    // Hidden state kills every transition — backward nav snaps instantly.
    expect(css).toContain('.sf-tbc-bar.slidev-vclick-hidden')
    expect(css).toContain('.sf-tbc-annot.slidev-vclick-hidden')
    expect(css).toContain('prefers-reduced-motion') // transitions disabled, instant state
  })

  it('renders the two-tone header: white title + chrome-green titleAccent tail', () => {
    const wrapper = mountTwoBar({ bars, title: 'COST', titleAccent: 'STRUCTURE' })
    const header = wrapper.find('text.header')

    expect(header.text()).toContain('COST')
    expect(header.html()).toContain('#66fb00')
  })
})
