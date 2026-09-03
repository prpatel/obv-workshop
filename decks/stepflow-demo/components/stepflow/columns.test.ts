// @vitest-environment happy-dom
import { describe, expect, it } from 'vitest'
import { mount } from '@vue/test-utils'
import ColumnRow from '../ColumnRow.vue'
import {
  COL_H_FRAC,
  COL_PITCH_X_FRAC,
  COL_TOP_Y_FRAC,
  COL_W_FRAC,
  COL_X0_FRAC,
  columnRowLayout,
  DOT_ROW_Y_FRAC,
  LABEL_ROW_Y_FRAC,
  RISE_FRAC,
  UNDERLINE_H_FRAC,
  UNDERLINE_W_FRAC,
  type Column,
} from './columns'

/**
 * The demo seed mirrors the slide data: the measured five-column composition
 * (research art_2kSBGNmJ §3.2) — cyan, cyan, orange, teal, amber — with the
 * amber underline under the middle column and the dot + label rows below.
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
  labelRows?: string[][]
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
    const header = wrapper.find('text.header')

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
