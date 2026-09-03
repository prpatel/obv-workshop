// @vitest-environment happy-dom
import { describe, expect, it, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import StepFlow from './StepFlow.vue'
import { serpentineLayout } from './stepflow/geometry'
import type { StepFlowPaletteOverride } from './stepflow/palettes'
import { workflowSteps, type StepFlowStep } from './stepflow/steps'

/**
 * Slidev registers the v-click directive globally at runtime; the render tests
 * stub it as a no-op so the component mounts outside the deck. Reveal behavior
 * itself is dogfooded against the running dev server (spike art_7Q2OtXCm).
 */
function mountStepFlow(props: { steps: StepFlowStep[]; palette?: StepFlowPaletteOverride }) {
  return mount(StepFlow, { props, global: { directives: { click: {} } } })
}

/** Pull the numeric value of a --sf-drawn custom property from a style attribute. */
function drawnPx(style: string | undefined): number {
  const match = /--sf-drawn:\s*([\d.]+)px/.exec(style ?? '')
  expect(match, `--sf-drawn missing in "${style}"`).toBeTruthy()
  return Number.parseFloat(match![1])
}

/**
 * Evaluate the shipped .sf-track-fill stroke-dashoffset declaration for one copy
 * (vitest `css: true` compiles SFC <style> blocks into the document). Accepts the
 * two forms the binding may ship: a bare custom property or a calc() dash phase.
 */
function dashOffsetPx(css: string, drawn: number, len: number): number {
  const rule = css.match(/\.sf-track-fill[^{,]*\{[^}]*\}/)?.[0] ?? ''
  const decl = rule.match(/stroke-dashoffset:\s*([^;]+);/)?.[1] ?? ''
  expect(decl, `.sf-track-fill must declare stroke-dashoffset; rule: "${rule}"`).toBeTruthy()
  const expr = decl
    .replaceAll('var(--sf-len)', `${len}px`)
    .replaceAll('var(--sf-drawn)', `${drawn}px`)
    .trim()
  const calc = /^calc\(\s*([\d.]+)px\s*-\s*([\d.]+)px\s*\)$/.exec(expr)
  if (calc) return Number(calc[1]) - Number(calc[2])
  const bare = /^([\d.]+)px$/.exec(expr)
  expect(bare, `unexpected stroke-dashoffset expression "${decl}"`).toBeTruthy()
  return Number(bare![1])
}

describe('StepFlow', () => {
  it('renders one node group and one stacked fill copy per step over a single dim base track', () => {
    const wrapper = mountStepFlow({ steps: workflowSteps })

    expect(wrapper.find('svg.stepflow').exists()).toBe(true)
    expect(wrapper.findAll('.sf-node')).toHaveLength(6)
    expect(wrapper.findAll('path.sf-track-base')).toHaveLength(1)
    expect(wrapper.findAll('path.sf-track-fill')).toHaveLength(6)
  })

  it('exposes the measured canvas and an accessible name', () => {
    const wrapper = mountStepFlow({ steps: workflowSteps })
    const svg = wrapper.find('svg.stepflow')

    expect(svg.attributes('viewBox')).toBe('0 0 1920 1080')
    expect(svg.attributes('role')).toBe('img')
    expect(svg.attributes('aria-label')).toBe('6-step flow diagram')
  })

  it('pre-sets each stacked copy to draw exactly up to its node', () => {
    const wrapper = mountStepFlow({ steps: workflowSteps })
    const layout = serpentineLayout(workflowSteps.length)
    const fills = wrapper.findAll('path.sf-track-fill')

    const drawn = fills.map((fill) => drawnPx(fill.attributes('style')))
    // Strictly increasing reveal boundaries, ending at the full track length
    // (the path terminates under the last disc).
    for (let i = 1; i < drawn.length; i++) {
      expect(drawn[i]).toBeGreaterThan(drawn[i - 1])
    }
    expect(drawn[0]).toBeCloseTo(layout.track.nodeDistances[0], 0)
    expect(drawn[drawn.length - 1]).toBeCloseTo(layout.track.totalLength, 0)
  })

  it('covers [0, totalLength] at full reveal — dashoffset ships the remaining phase', () => {
    // Regression (grey notch before the last disc): stroke-dashoffset was bound
    // to --sf-drawn itself. A --sf-len dash at offset o paints [0, len − o], so
    // that binding painted [0, len − drawn_i] per copy — copy 1 covered 97% of
    // the track from click 1, copy N (offset = len) painted nothing, and the
    // fully-revealed union fell d_1 short of the track end.
    const wrapper = mountStepFlow({ steps: workflowSteps })
    const layout = serpentineLayout(workflowSteps.length)
    const len = layout.track.totalLength
    const drawn = wrapper.findAll('path.sf-track-fill').map((fill) => drawnPx(fill.attributes('style')))

    const css = Array.from(document.querySelectorAll('style'))
      .map((tag) => tag.textContent ?? '')
      .join('\n')

    // Each copy paints the span [0, len − offset]; the union over all copies must
    // reach the end of the track (the path terminates under the last disc).
    const unionEnd = Math.max(...drawn.map((d) => len - dashOffsetPx(css, d, len)))
    expect(unionEnd).toBeCloseTo(len, 0)

    // Backward-nav snap must survive any change to the revealed phase.
    const hiddenRule = css.match(/\.sf-track-fill\.slidev-vclick-hidden[^{]*\{[^}]*\}/)?.[0] ?? ''
    expect(hiddenRule).toContain('stroke-dashoffset: var(--sf-len)')
    expect(hiddenRule).toContain('transition: none')
  })

  it('carries the measured timing constants in its rendered styles', () => {
    mountStepFlow({ steps: workflowSteps })

    const css = Array.from(document.querySelectorAll('style'))
      .map((tag) => tag.textContent ?? '')
      .join('\n')

    expect(css).toContain('300ms') // track fill draw (§9)
    expect(css).toContain('120ms') // disc pop
    expect(css).toContain('150ms') // glow/node fade
    expect(css).toContain('prefers-reduced-motion') // transitions disabled, instant state
  })

  it('renders the fallback icon and warns on an unknown icon key', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
    try {
      const steps: StepFlowStep[] = [{ id: 'x', title: 'X', subtext: 'why', icon: 'not-a-key' }]
      const wrapper = mountStepFlow({ steps })

      expect(warn).toHaveBeenCalledWith(expect.stringContaining('not-a-key'))
      // ICON_FALLBACK (Lucide circle-help) geometry must be in the markup.
      expect(wrapper.find('.sf-node .icon').html()).toContain('r="10"')
    } finally {
      warn.mockRestore()
    }
  })

  it('surfaces the geometry RangeError for 0 steps instead of rendering blank', () => {
    expect(() => mountStepFlow({ steps: [] })).toThrow(RangeError)
  })

  it('reflects a palette override while keeping merged defaults', () => {
    const wrapper = mountStepFlow({ steps: workflowSteps, palette: { accent: '#ff0000' } })
    const html = wrapper.html()

    expect(html).toContain('#ff0000') // override reaches discs + fill copies
    expect(html).toContain('#40424e') // track stays the measured default
    expect(html).toContain('#a6a8ae') // subtext stays the measured default
  })
})
