// @vitest-environment happy-dom
import { describe, expect, it } from 'vitest'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { mount } from '@vue/test-utils'
import HexCluster from './HexCluster.vue'
import { hexClusterLayout, HEX_COLORS } from './stepflow/hex'

/**
 * Slidev registers the v-click directive globally at runtime; the render tests
 * stub it as a no-op so the component mounts outside the deck (StepFlow.test.ts
 * pattern). Outside Slidev the clicks context is undefined, so the component
 * renders the SETTLED state — exactly what the capture harness photographs.
 */
function mountHexCluster(props: {
  plates?: Array<{ id: string; label: string; tone: 'cyan' | 'blue' }>
  title?: string
  titleAccent?: string
}) {
  return mount(HexCluster, {
    props: { plates: props.plates ?? PLATES, title: props.title, titleAccent: props.titleAccent },
    global: { directives: { click: {} } },
  })
}

const PLATES = [
  { id: 'left', label: 'INGESTION', tone: 'cyan' as const },
  { id: 'right', label: 'NODE', tone: 'blue' as const },
]

/** Concatenate every compiled <style> block (vitest compiles SFC styles into the document). */
function compiledCss(): string {
  return Array.from(document.querySelectorAll('style'))
    .map((tag) => tag.textContent ?? '')
    .join('\n')
}

/** Pull one compiled CSS rule by selector prefix. */
function ruleFor(css: string, selector: string): string {
  const rule = css.match(new RegExp(`${selector}[^{]*\\{[^}]*\\}`))?.[0] ?? ''
  expect(rule, `missing rule for ${selector}`).toBeTruthy()
  return rule
}

describe('HexCluster — the exact-trace composition', () => {
  it('renders one plate group per entry on the measured canvas', () => {
    const wrapper = mountHexCluster({})

    expect(wrapper.find('svg.hexcluster').exists()).toBe(true)
    expect(wrapper.findAll('g.sf-hx-plate')).toHaveLength(2)
    expect(wrapper.find('svg.hexcluster').attributes('viewBox')).toBe('0 0 1920 1080')
    expect(wrapper.find('svg.hexcluster').attributes('aria-label')).toBe('2-plate hex mesh diagram')
  })

  it('bounds the plate rects at the sheet-measured boxes with the dim fill', () => {
    const wrapper = mountHexCluster({})
    const layout = hexClusterLayout()
    const rects = wrapper.findAll('rect.sf-hx-plate-rect')

    expect(rects).toHaveLength(2)
    for (let i = 0; i < 2; i++) {
      const plate = layout.plates[i]
      expect(Number(rects[i].attributes('x'))).toBeCloseTo(plate.x, 4)
      expect(Number(rects[i].attributes('y'))).toBeCloseTo(plate.y, 4)
      expect(Number(rects[i].attributes('width'))).toBeCloseTo(plate.width, 4)
      expect(Number(rects[i].attributes('height'))).toBeCloseTo(plate.height, 4)
      expect(rects[i].attributes('fill')).toBe(HEX_COLORS.plateFill)
    }
    // Per-side borders: teal-dark left, blue-dark right (measured medians).
    expect(rects[0].attributes('stroke')).toBe('#031d21')
    expect(rects[1].attributes('stroke')).toBe('#0e1929')
  })

  it('renders the faint web: settled strokes at the ~6–10%-white contract', () => {
    // Outside Slidev the component renders SETTLED — the capture state. The
    // settled strokes are the sheet's dim medians, never bright outlines.
    const wrapper = mountHexCluster({})
    const cells = wrapper.findAll('path.sf-hx-cell')

    expect(cells).toHaveLength(12) // 5 left ring + 6 right ring + outlier
    const leftStrokes = new Set(cells.slice(0, 5).map((c) => c.attributes('stroke')))
    const rightStrokes = new Set(cells.slice(5).map((c) => c.attributes('stroke')))
    expect(leftStrokes).toEqual(new Set([HEX_COLORS.settledStroke.left]))
    expect(rightStrokes).toEqual(new Set([HEX_COLORS.settledStroke.right]))
    for (const cell of cells) {
      expect(cell.attributes('fill')).toBe('none')
      expect(String(cell.attributes('stroke-width'))).toBe('3.024')
    }
  })

  it('dims the pre-build core to the plate fill in the settled state', () => {
    const wrapper = mountHexCluster({})
    const core = wrapper.find('path.sf-hx-core')

    expect(core.exists()).toBe(true)
    expect(core.attributes('fill')).toBe(HEX_COLORS.plateFill)
  })

  it('carries the crop-verified in-panel labels with the measured type', () => {
    const wrapper = mountHexCluster({})
    const labels = wrapper.findAll('text.sf-hx-label')
    const layout = hexClusterLayout()

    expect(labels.map((l) => l.text())).toEqual(['INGESTION', 'NODE'])
    for (let i = 0; i < 2; i++) {
      const plate = layout.plates[i]
      expect(Number(labels[i].attributes('x'))).toBeCloseTo(plate.label.cx, 4)
      expect(Number(labels[i].attributes('y'))).toBeCloseTo(plate.label.baseline, 4)
      expect(Number(labels[i].attributes('font-size'))).toBeCloseTo(31 / 0.752, 4)
      expect(labels[i].attributes('text-anchor')).toBe('middle')
    }
    // Sheet tones: cyan #26c8dd left, blue #3b95eb right.
    expect(labels[0].attributes('fill')).toBe(HEX_COLORS.label.cyan)
    expect(labels[1].attributes('fill')).toBe(HEX_COLORS.label.blue)
  })

  it('centers the shared title chrome on the measured header axis', () => {
    const wrapper = mountHexCluster({ title: 'DATA', titleAccent: 'MESH DATA GRID' })
    const header = wrapper.find('.sf-chrome-title')

    // Direction-2 foundation: corrected to the measured 78px glyph core,
    // centered ≈ x916 (cap band y49–127).
    expect(Number(header.attributes('font-size'))).toBeCloseTo(78 / 0.752, 4)
    expect(Number(header.attributes('x'))).toBeCloseTo(916, 4)
    expect(Number(header.attributes('y'))).toBe(127)
    expect(header.text()).toContain('DATA')
    expect(header.text()).toContain('MESH DATA GRID')
    expect(wrapper.html()).toContain('#66fb00')
  })
})

describe('HexCluster — motion contract', () => {
  it('runs the 600ms dim transition on the web and core — no dash mechanics', () => {
    // The recording's 5.9–6.6s transition: bright web strokes settle over
    // ~600ms on the final click. Transition is taken from the destination.
    mountHexCluster({})
    const css = compiledCss()

    const cellRule = ruleFor(css, '\\.sf-hx-cell')
    expect(cellRule).toContain('600ms')
    expect(cellRule).toContain('stroke')
    expect(css).not.toContain('stroke-dash') // no dash mechanics anywhere
    expect(css).not.toContain('--sf-drawn')

    const hidden = ruleFor(css, '\\.sf-hx-plate\\.slidev-vclick-hidden')
    expect(hidden).toContain('opacity: 0')
    expect(hidden).toContain('transition: none')
  })

  it('consumes a third click for the dim beat', () => {
    // The slide carries only two visible v-clicks; the sheet's dim is its own
    // beat. The invisible anchor makes the ?clicks=3 deep link land settled.
    const wrapper = mountHexCluster({})
    const beat = wrapper.find('rect.sf-hx-dim-beat')

    expect(beat.exists()).toBe(true)
    expect(beat.attributes('width')).toBe('0')
    expect(beat.attributes('height')).toBe('0')
  })

  it('condenses the chrome title to the sheet-measured ink extent', () => {
    // Direction-2 systemic note: mono renders wider than the recordings'
    // condensed face. The sheet's green tail measures 726px; uncondensed mono
    // renders 944px — the family-local tracking must pull it back.
    mountHexCluster({})
    const css = compiledCss()
    const rule = css.match(/\.sf-chrome-title[^{]*\{[^}]*letter-spacing[^}]*\}/)?.[0] ?? ''
    expect(rule).toContain('letter-spacing')
    expect(rule).toMatch(/-0\.0\d+em|-\d+px/)
  })

  it('snaps instantly on backward nav and under reduced motion', () => {
    mountHexCluster({})
    const css = compiledCss()

    const instant = css.match(/\.sf-hx-instant \.sf-hx-cell[^{]*\{[^}]*\}/)?.[0] ?? ''
    expect(instant).toContain('transition: none')
    expect(css).toContain('prefers-reduced-motion')
  })

  it('keeps reactive class bindings off v-click elements', () => {
    // Root cause of the click-2 no-op regression: a reactive :class on the
    // same element as v-click re-patches the class attribute when the binding
    // changes (`instant` flips on the first click step), wiping the
    // directive's slidev-vclick-hidden class and revealing elements early.
    // sf-hx-instant therefore lives on the SVG root, which carries no v-click.
    const source = readFileSync(resolve(process.cwd(), 'decks/stepflow-demo/components/HexCluster.vue'), 'utf8')
    expect(source).toContain('v-click=')
    for (const element of source.matchAll(/<[A-Za-z][^<>]*>/g)) {
      if (element[0].includes('v-click=')) {
        expect(element[0], `element with v-click must not bind :class: ${element[0].slice(0, 80)}`).not.toContain(':class=')
      }
    }
  })
})
