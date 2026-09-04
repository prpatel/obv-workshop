// @vitest-environment happy-dom
import { describe, expect, it } from 'vitest'
import { mount } from '@vue/test-utils'
import ColumnRow from '../ColumnRow.vue'
import {
  BADGE_FRAC,
  CAPTION_BASELINE_FRAC,
  CHIP_BAR_BOTTOM_FRAC,
  CHIP_BAR_HEIGHTS_FRAC,
  CHIP_BAR_LEFTS_FRAC,
  CHIP_BAR_W_FRAC,
  CHIP_FRAC,
  COL_H_FRAC,
  COL_PITCH_X_FRAC,
  COL_TOP_Y_FRAC,
  COL_W_FRAC,
  COL_X0_FRAC,
  columnRowLayout,
  DOT_ROW_Y_FRAC,
  headingLayout,
  LABEL_ROW_Y_FRAC,
  PLATE_PAD,
  RAIL_GAP,
  RAIL_H_FRAC,
  RAIL_OVERHANG,
  RISE_FRAC,
  TINTED_LABEL_SIZE_SOURCE,
  UNDERLINE_H_FRAC,
  UNDERLINE_W_FRAC,
  type Column,
  type ColumnRowHeading,
  type LabelRowInput,
} from './columns'

/**
 * The legacy seed mirrors the pre-rework composition the plain-row contract
 * still serves (research art_2kSBGNmJ §3.2): cyan, cyan, orange, teal, amber,
 * amber underline under the middle column, dot + label rows below. The
 * reworked slide data (blue ship endpoint, heading chrome, tinted row) is
 * exercised in the rework tests below.
 */
const columns: Column[] = [
  { id: 'extract', tone: 'accent', label: 'EXTRACT' },
  { id: 'load', tone: 'accent', label: 'LOAD' },
  { id: 'transform', tone: 'alt', label: 'TRANSFORM', underline: true },
  { id: 'orchestrate', tone: 'tertiary', label: 'ORCHESTRATE' },
  { id: 'serve', tone: 'status', label: 'SERVE' },
]
const yFrac = COL_TOP_Y_FRAC
const hFrac = COL_H_FRAC
const labelRows = [
  ['· · · ·', '· ·', '· · · · · ·', '· · ·', '· · · · ·'],
  ['SOURCES', 'TABLES', 'JOBS', 'MODELS', 'DASHBOARDS'],
]

/**
 * Slidev registers the v-click directive globally at runtime; the render tests
 * stub it with a recorder so the choreography's click numbers are asserted
 * directly (the component must consume exactly five column clicks + one
 * label-rows click).
 */
function mountColumnRow(props: {
  columns: Column[]
  yFrac: number
  hFrac: number
  labelRows?: LabelRowInput[]
  heading?: ColumnRowHeading
  palette?: object
  title?: string
  titleAccent?: string
}) {
  const clicks: unknown[] = []
  const wrapper = mount(ColumnRow, {
    props,
    global: {
      directives: {
        click: {
          mounted(_el, binding) {
            clicks.push(binding.value)
          },
        },
      },
    },
  })
  return { wrapper, clicks }
}

describe('measured constants — hand-computed px at the 1920×1080 stage', () => {
  it('resolves each measured fraction to exact stage px', () => {
    expect(COL_X0_FRAC * 1920).toBeCloseTo(332.16, 6) // first column x (17.3%w)
    expect(COL_PITCH_X_FRAC * 1920).toBeCloseTo(264, 6) // x-pitch (13.75%w)
    expect(COL_W_FRAC * 1920).toBeCloseTo(197.76, 6) // column width (10.3%w)
    expect(COL_TOP_Y_FRAC * 1080).toBeCloseTo(555.12, 6) // column tops (51.4%h)
    expect(COL_H_FRAC * 1080).toBeCloseTo(251.64, 6) // column height (23.3%h)
  })

  it('resolves the underline, text-row, and rise fractions to exact stage px', () => {
    expect(UNDERLINE_W_FRAC * 1920).toBeCloseTo(171, 6) // measured 114px at 1280
    expect(UNDERLINE_H_FRAC * 1080).toBeCloseTo(3, 6) // measured 2px at 720
    expect(DOT_ROW_Y_FRAC * 1080).toBeCloseTo(853.5, 6) // measured y569 at 720
    expect(LABEL_ROW_Y_FRAC * 1080).toBeCloseTo(919.5, 6) // measured y613 at 720
    expect(RISE_FRAC * 1080).toBeCloseTo(32.4, 6) // bottom→top rise distance
  })
})

describe('columnRowLayout — resolved geometry', () => {
  it('places the five columns at the measured pitch, tops, and size', () => {
    const l = columnRowLayout({ columns, yFrac, hFrac, labelRows })

    expect(l.viewBox).toEqual({ width: 1920, height: 1080 })
    l.columns.forEach((col, i) => {
      expect(col.x).toBeCloseTo(332.16 + i * 264, 6)
      expect(col.y).toBeCloseTo(555.12, 6)
      expect(col.w).toBeCloseTo(197.76, 6)
      expect(col.h).toBeCloseTo(251.64, 6)
      expect(col.underline).toBe(i === 2)
    })
    // The row spans 17.3%w → 82.6%w of the stage, per the recording.
    const rightEdge = l.columns[4].x + l.columns[4].w
    expect(rightEdge).toBeCloseTo(1585.92, 6)
  })

  it('centers the underline flush under the column bottom at the measured size', () => {
    const l = columnRowLayout({ columns, yFrac, hFrac })
    const mid = l.columns[2]
    const u = mid.underlineRect!

    expect(u.x).toBeCloseTo(mid.x + mid.w / 2 - 85.5, 6) // 873.54
    expect(u.y).toBeCloseTo(555.12 + 251.64, 6) // flush below the column bottom
    expect(u.w).toBeCloseTo(171, 6)
    expect(u.h).toBeCloseTo(3, 6)
    expect(l.columns[0].underlineRect).toBeUndefined()
    expect(l.columns[4].underlineRect).toBeUndefined()
  })

  it('centers one text cell per column at the measured dot/label row tops', () => {
    const l = columnRowLayout({ columns, yFrac, hFrac, labelRows })

    expect(l.labelRows).toHaveLength(2)
    expect(l.labelRows[0].y).toBeCloseTo(853.5, 6)
    expect(l.labelRows[1].y).toBeCloseTo(919.5, 6)
    l.labelRows.forEach((row) => {
      expect(row.cells).toHaveLength(5)
      row.cells.forEach((cell, i) => {
        expect(cell.x).toBeCloseTo(332.16 + i * 264 + 98.88, 6)
      })
    })
    expect(l.labelRows[1].cells[2].text).toBe('JOBS')
  })

  it('serves the comparison variant as seed data: fewer columns, underline on each', () => {
    const comparison: Column[] = [
      { id: 'a', tone: 'accent', label: 'A', underline: true },
      { id: 'b', tone: 'accent', label: 'B', underline: true },
      { id: 'c', tone: 'accent', label: 'C', underline: true },
      { id: 'd', tone: 'accent', label: 'D', underline: true },
    ]
    const l = columnRowLayout({ columns: comparison, yFrac, hFrac })

    expect(l.columns).toHaveLength(4)
    expect(l.columns.every((col) => col.underlineRect)).toBe(true)
  })

  it('honors a custom viewBox', () => {
    const l = columnRowLayout({ columns: [columns[0]], yFrac, hFrac }, { width: 1000, height: 500 })

    expect(l.columns[0].x).toBeCloseTo(0.173 * 1000, 6)
    expect(l.columns[0].w).toBeCloseTo(0.103 * 1000, 6)
    expect(l.columns[0].y).toBeCloseTo(0.514 * 500, 6)
    expect(l.columns[0].h).toBeCloseTo(0.233 * 500, 6)
  })

  it('validates inputs with RangeError instead of rendering blank', () => {
    expect(() => columnRowLayout({ columns: [], yFrac, hFrac })).toThrow(RangeError)
    expect(() => columnRowLayout({ columns, yFrac: -0.1, hFrac })).toThrow(RangeError)
    expect(() => columnRowLayout({ columns, yFrac: 0.8, hFrac: 0.3 })).toThrow(RangeError) // bottom off-canvas
    expect(() => columnRowLayout({ columns, yFrac, hFrac, labelRows: [['a'], ['b'], ['c']] })).toThrow(RangeError)
    expect(() => columnRowLayout({ columns, yFrac, hFrac, labelRows: [['a', 'b', 'c', 'd', 'e', 'f']] })).toThrow(RangeError)
  })

  it('is deterministic for the same inputs', () => {
    expect(JSON.stringify(columnRowLayout({ columns, yFrac, hFrac, labelRows })))
      .toBe(JSON.stringify(columnRowLayout({ columns, yFrac, hFrac, labelRows })))
  })
})

describe('ColumnRow component', () => {
  it('consumes exactly six clicks: five columns left→right, then the label rows', () => {
    const { clicks, wrapper } = mountColumnRow({ columns, yFrac, hFrac, labelRows })

    expect(clicks).toEqual([1, 2, 3, 4, 5, 6])
    expect(wrapper.find('svg.columnrow').exists()).toBe(true)
    expect(wrapper.findAll('.sf-col')).toHaveLength(5)
    expect(wrapper.findAll('.sf-col-rows')).toHaveLength(1)
    expect(wrapper.findAll('.sf-col-row-text')).toHaveLength(10) // 2 rows × 5 columns
  })

  it('drops the label-rows click when no labelRows are authored', () => {
    const { clicks } = mountColumnRow({ columns, yFrac, hFrac })

    expect(clicks).toEqual([1, 2, 3, 4, 5])
    expect(document.querySelector('.sf-col-rows')).toBeNull()
  })

  it('exposes the measured canvas and an accessible name', () => {
    const { wrapper } = mountColumnRow({ columns, yFrac, hFrac })
    const svg = wrapper.find('svg.columnrow')

    expect(svg.attributes('viewBox')).toBe('0 0 1920 1080')
    expect(svg.attributes('role')).toBe('img')
    expect(svg.attributes('aria-label')).toBe('5-column row diagram')
  })

  it('maps the four tones to the existing palette tokens: cyan, orange, teal, amber', () => {
    const { wrapper } = mountColumnRow({ columns, yFrac, hFrac, palette: { accentTertiary: '#1cd798' } })
    const blocks = wrapper.findAll('.sf-col-block')

    expect(blocks[0].attributes('fill')).toBe('#23d7ed') // accent → cyanOnBlack accent
    expect(blocks[1].attributes('fill')).toBe('#23d7ed')
    expect(blocks[2].attributes('fill')).toBe('#f85721') // alt → orangeSpine accent fallback
    expect(blocks[3].attributes('fill')).toBe('#1cd798') // tertiary → accentTertiary field
    expect(blocks[4].attributes('fill')).toBe('#f7ba20') // status → statusAmber accent
  })

  it('lets an accentAlt override retune the alt tone', () => {
    const { wrapper } = mountColumnRow({ columns, yFrac, hFrac, palette: { accentAlt: '#349aea' } })

    expect(wrapper.findAll('.sf-col-block')[2].attributes('fill')).toBe('#349aea')
  })

  it('renders the optional amber underline only where authored', () => {
    const { wrapper } = mountColumnRow({ columns, yFrac, hFrac })
    const underlines = wrapper.findAll('.sf-col-underline')

    expect(underlines).toHaveLength(1)
    expect(underlines[0].attributes('fill')).toBe('#f7ba20')
    expect(underlines[0].attributes('width')).toBe('171')
    expect(underlines[0].attributes('height')).toBe('3')
  })

  it('carries the measured timing constants, the hidden-state snap, and the reduced-motion block in its styles', () => {
    mountColumnRow({ columns, yFrac, hFrac, labelRows })

    const css = Array.from(document.querySelectorAll('style'))
      .map((tag) => tag.textContent ?? '')
      .join('\n')

    expect(css).toContain('180ms') // column rise
    expect(css).toContain('150ms') // fades
    expect(css).toContain('prefers-reduced-motion') // transitions disabled, instant state

    // Hidden state: fully risen-down + transition:none (backward nav snaps).
    const hiddenRule = css.match(/\.sf-col\.slidev-vclick-hidden[^{]*\{[^}]*\}/)?.[0] ?? ''
    expect(hiddenRule).toContain('transform: translateY(var(--sf-rise))')
    expect(hiddenRule).toContain('opacity: 0')
    expect(hiddenRule).toContain('transition: none')

    const rowsHiddenRule = css.match(/\.sf-col-rows\.slidev-vclick-hidden[^{]*\{[^}]*\}/)?.[0] ?? ''
    expect(rowsHiddenRule).toContain('transition: none')
  })

  it('carries the rise distance as a CSS variable on each column group', () => {
    const { wrapper } = mountColumnRow({ columns, yFrac, hFrac })

    wrapper.findAll('.sf-col').forEach((group) => {
      expect(group.attributes('style')).toContain('--sf-rise: 32.4px')
    })
  })

  it('renders the two-tone header: white title + chrome-green titleAccent tail', () => {
    const { wrapper } = mountColumnRow({ columns, yFrac, hFrac, title: 'PIPELINE', titleAccent: 'STAGES' })
    const header = wrapper.find('.sf-chrome-title')

    expect(header.text()).toContain('PIPELINE')
    expect(header.html()).toContain('#66fb00')
  })

  it('renders column labels inside their blocks and row text under the columns', () => {
    const { wrapper } = mountColumnRow({ columns, yFrac, hFrac, labelRows })

    const labels = wrapper.findAll('.sf-col-label')
    expect(labels).toHaveLength(5)
    expect(labels[2].text()).toBe('TRANSFORM')
    expect(wrapper.text()).toContain('DASHBOARDS')
    expect(wrapper.text()).toContain('· · · · · ·')
  })
})


describe('rework constants — measured heading, plate, and rail chrome at the 1920×1080 stage', () => {
  it('resolves the chip, badge, and caption fractions to the measured stage px', () => {
    expect(CHIP_FRAC.x * 1920).toBeCloseTo(889, 6)
    expect(CHIP_FRAC.y * 1080).toBeCloseTo(343, 6)
    expect(CHIP_FRAC.w * 1920).toBeCloseTo(44, 6)
    expect(CHIP_FRAC.h * 1080).toBeCloseTo(45, 6)
    expect(BADGE_FRAC.cx * 1920).toBeCloseTo(999, 6)
    expect(BADGE_FRAC.cy * 1080).toBeCloseTo(368, 6)
    expect(BADGE_FRAC.r * 1080).toBeCloseTo(44, 6)
    expect(CAPTION_BASELINE_FRAC * 1080).toBeCloseTo(499, 6)
  })

  it('resolves the chip bars: four bars bottom-aligned on the measured baseline', () => {
    const lefts = CHIP_BAR_LEFTS_FRAC.map((f) => f * 1920)
    expect(lefts.map((v) => Number(v.toFixed(6)))).toEqual([889, 902, 915.5, 928.5])
    expect(CHIP_BAR_W_FRAC * 1920).toBeCloseTo(4.5, 6)
    expect(CHIP_BAR_HEIGHTS_FRAC.map((f) => Number((f * 1080).toFixed(6)))).toEqual([34, 25, 25, 34])
    expect(CHIP_BAR_BOTTOM_FRAC * 1080).toBeCloseTo(385, 6)
  })

  it('resolves the plate rim, rail, and tinted-label fractions', () => {
    expect(PLATE_PAD.x * 1920).toBeCloseTo(3, 6)
    expect(PLATE_PAD.y * 1080).toBeCloseTo(3, 6)
    expect(RAIL_GAP * 1080).toBeCloseTo(2.25, 6)
    expect(RAIL_H_FRAC * 1080).toBeCloseTo(2.5, 6)
    expect(RAIL_OVERHANG * 1920).toBeCloseTo(25, 6)
    expect(TINTED_LABEL_SIZE_SOURCE * 1.5).toBeCloseTo(24, 6) // 24px at the 1080 stage
  })
})

describe('headingLayout — measured heading chrome', () => {
  it('resolves the chip, bars, baseline, badge, and caption at the measured stage', () => {
    const h = headingLayout({ width: 1920, height: 1080 })

    expect(h.chip.x).toBeCloseTo(889, 6)
    expect(h.chip.y).toBeCloseTo(343, 6)
    expect(h.chip.w).toBeCloseTo(44, 6)
    expect(h.chip.h).toBeCloseTo(45, 6)
    expect(h.bars[0].x).toBeCloseTo(889, 6)
    expect(h.bars[0].y).toBeCloseTo(385 - 34, 6)
    expect(h.bars[0].w).toBeCloseTo(4.5, 6)
    expect(h.bars[0].h).toBeCloseTo(34, 6)
    expect(h.bars[3].y).toBeCloseTo(385 - 34, 6) // outer bars share the tallest height
    expect(h.baseline.x).toBeCloseTo(889, 6)
    expect(h.baseline.y).toBeCloseTo(385, 6)
    expect(h.baseline.w).toBeCloseTo(44, 6)
    expect(h.baseline.h).toBeCloseTo(3, 6)
    expect(h.badge.cx).toBeCloseTo(999, 6)
    expect(h.badge.cy).toBeCloseTo(368, 6)
    expect(h.badge.r).toBeCloseTo(44, 6)
    expect(h.caption.x).toBeCloseTo(959.04, 6) // middle-column center
    expect(h.caption.y).toBeCloseTo(499, 6)
    expect(h.caption.size).toBeCloseTo(31.5, 6) // 21 source px × 1.5
  })

  it('scales with a custom viewBox like the column geometry', () => {
    const h = headingLayout({ width: 960, height: 540 })

    expect(h.badge.r).toBeCloseTo(22, 6)
    expect(h.chip.w).toBeCloseTo(22, 6)
    expect(h.caption.y).toBeCloseTo(249.5, 6)
    expect(h.caption.size).toBeCloseTo(15.75, 6) // 21 × 0.75
  })

  it('is deterministic for the same inputs', () => {
    expect(JSON.stringify(headingLayout({ width: 1920, height: 1080 })))
      .toBe(JSON.stringify(headingLayout({ width: 1920, height: 1080 })))
  })
})

describe('columnRowLayout rework — plates, rail, and tinted rows', () => {
  it('rims every column with a plate and lays the base rail under the field', () => {
    const l = columnRowLayout({ columns, yFrac, hFrac })

    l.columns.forEach((col) => {
      expect(col.plate.x).toBeCloseTo(col.x - 3, 6)
      expect(col.plate.y).toBeCloseTo(col.y - 3, 6)
      expect(col.plate.w).toBeCloseTo(col.w + 6, 6)
      expect(col.plate.h).toBeCloseTo(col.h + 6, 6)
    })
    expect(l.rail.x).toBeCloseTo(332.16 - 25, 6)
    expect(l.rail.y).toBeCloseTo(806.76 + 2.25, 6) // column bottom + measured gap
    expect(l.rail.w).toBeCloseTo(1585.92 - 332.16 + 50, 6)
    expect(l.rail.h).toBeCloseTo(2.5, 6)
  })

  it('resolves the tinted label row on the measured label-row top with one cell per column', () => {
    const tinted = { texts: ['SOURCES', 'TABLES', 'JOBS', 'MODELS', 'DASHBOARDS'], tone: 'column' as const }
    const l = columnRowLayout({ columns, yFrac, hFrac, labelRows: [tinted] })

    expect(l.labelRows).toHaveLength(1)
    expect(l.labelRows[0].tone).toBe('column')
    expect(l.labelRows[0].y).toBeCloseTo(853.5, 6)
    expect(l.labelRows[0].cells.map((c) => c.text)).toEqual(tinted.texts)
  })

  it('rejects a tinted row with the wrong length or an unsupported tone', () => {
    expect(() => columnRowLayout({ columns, yFrac, hFrac, labelRows: [{ texts: ['a', 'b'], tone: 'column' }] })).toThrow(RangeError)
    expect(() => columnRowLayout({ columns, yFrac, hFrac, labelRows: [{ texts: ['a', 'b', 'c', 'd', 'e'], tone: 'accent' as never }] })).toThrow(RangeError)
  })
})

describe('ColumnRow rework — blue tone, tinted labels, heading chrome, plates', () => {
  const tintedRow = { texts: ['SOURCES', 'TABLES', 'JOBS', 'MODELS', 'DASHBOARDS'], tone: 'column' as const }

  it('maps the blue tone to the measured step blue constant', () => {
    const blue: Column[] = [{ id: 'extract', tone: 'blue', label: 'EXTRACT' }]
    const { wrapper } = mountColumnRow({ columns: blue, yFrac, hFrac })

    expect(wrapper.findAll('.sf-col-block')[0].attributes('fill')).toBe('#3698fb')
  })

  it('renders tinted label rows at the measured size in their column tones', () => {
    const { wrapper } = mountColumnRow({ columns, yFrac, hFrac, labelRows: [tintedRow], palette: { accentTertiary: '#1cd798' } })
    const texts = wrapper.findAll('.sf-col-row-text')

    expect(texts).toHaveLength(5)
    expect(texts[0].attributes('font-size')).toBe('24') // 16 source px × 1.5 at the 1080 stage
    expect(texts[0].attributes('fill')).toBe('#23d7ed') // host column 0 tone (house cyan)
    expect(texts[2].attributes('fill')).toBe('#f85721') // alt column tone
    expect(texts[4].attributes('fill')).toBe('#f7ba20') // status column tone
  })

  it('keeps plain string rows at the legacy sizing and white fill', () => {
    const { wrapper } = mountColumnRow({ columns, yFrac, hFrac, labelRows })
    const texts = wrapper.findAll('.sf-col-row-text')

    expect(texts[0].attributes('font-size')).toBe('15') // dot row, 10 × 1.5
    expect(texts[5].attributes('font-size')).toBe('19.5') // label row, 13 × 1.5
    expect(texts[0].attributes('fill')).toBe('#ffffff')
  })

  it('renders the heading chrome: amber chip bars + baseline, white badge, icon, caption', () => {
    const heading: ColumnRowHeading = { icon: 'flask-conical', caption: 'FIVE STAGES · ONE PIPELINE' }
    const { wrapper } = mountColumnRow({ columns, yFrac, hFrac, heading })
    const group = wrapper.find('.sf-col-heading')

    expect(group.exists()).toBe(true)
    const rects = group.findAll('rect')
    expect(rects).toHaveLength(5) // 4 chip bars + baseline
    rects.forEach((r) => expect(r.attributes('fill')).toBe('#f7ba20')) // the amber status token
    const badge = group.find('.sf-col-badge')
    expect(badge.attributes('fill')).toBe('#f4f4f6')
    expect(Number(badge.attributes('r'))).toBeCloseTo(44, 6)
    expect(group.find('.sf-col-heading-icon').html()).toContain('M14 2v6') // flask-conical geometry
    const caption = group.find('.sf-col-caption')
    expect(caption.text()).toBe('FIVE STAGES · ONE PIPELINE')
    expect(caption.attributes('fill')).toBe('#f4f4f6')
    expect(caption.attributes('font-size')).toBe('31.5')
    expect(Number(caption.attributes('x'))).toBeCloseTo(959.04, 6)
  })

  it('renders no heading group without the heading prop', () => {
    const { wrapper } = mountColumnRow({ columns, yFrac, hFrac })

    expect(wrapper.find('.sf-col-heading').exists()).toBe(false)
  })

  it('keeps the click count at six with the heading static and the plates unrouted to clicks', () => {
    const { clicks, wrapper } = mountColumnRow({ columns, yFrac, hFrac, heading: { icon: 'flask-conical', caption: 'X' }, labelRows: [tintedRow] })

    expect(clicks).toEqual([1, 2, 3, 4, 5, 6]) // heading chrome takes no click of its own
    expect(wrapper.findAll('.sf-col-plate')).toHaveLength(5)
    expect(wrapper.findAll('.sf-col-rail')).toHaveLength(1)
  })

  it('rims the plates and rail in the measured near-black tone at the plate outset', () => {
    const { wrapper } = mountColumnRow({ columns, yFrac, hFrac })
    const plates = wrapper.findAll('.sf-col-plate')

    plates.forEach((p) => expect(p.attributes('fill')).toBe('#0d1a26'))
    expect(plates[0].attributes('fill')).toBe('#0d1a26')
    expect(Number(plates[0].attributes('x'))).toBeCloseTo(329.16, 6) // first column x − 3px
    expect(wrapper.find('.sf-col-rail').attributes('fill')).toBe('#0d1a26')
    expect(Number(wrapper.find('.sf-col-rail').attributes('y'))).toBeCloseTo(809.01, 6)
  })
})

describe('columnRowLayout rework — measured column glow halo', () => {
  it('underlays every column with a blurred tone-tinted halo copy at family constants', () => {
    const { wrapper } = mountColumnRow({ columns, yFrac, hFrac })
    const halos = wrapper.findAll('.sf-col-halo')
    const blocks = wrapper.findAll('.sf-col-block')

    expect(halos).toHaveLength(5)
    halos.forEach((h, i) => {
      const block = blocks[i]
      // Same footprint as the solid core, blurred copy painted under it.
      expect(Number(h.attributes('x'))).toBe(Number(block.attributes('x')))
      expect(Number(h.attributes('y'))).toBe(Number(block.attributes('y')))
      expect(Number(h.attributes('width'))).toBe(Number(block.attributes('width')))
      expect(Number(h.attributes('height'))).toBe(Number(block.attributes('height')))
      expect(h.attributes('fill')).toBe(block.attributes('fill'))
      expect(Number(h.attributes('opacity'))).toBeCloseTo(0.6, 6)
      // The halo references the component's own gaussian filter (useId-scoped).
      const filterRef = h.attributes('filter') ?? ''
      expect(filterRef).toMatch(/^url\(#.+\)$/)
      const filterId = filterRef.slice(5, -1)
      const defs = wrapper.find(`filter#${CSS.escape(filterId)}`)
      expect(defs.exists()).toBe(true)
      expect(defs.find('feGaussianBlur').exists()).toBe(true)
    })
  })
})
