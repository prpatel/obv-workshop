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
