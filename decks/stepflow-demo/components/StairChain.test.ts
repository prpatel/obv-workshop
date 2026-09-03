// @vitest-environment happy-dom
import { describe, expect, it } from 'vitest'
import { mount } from '@vue/test-utils'
import type { DirectiveBinding } from 'vue'
import StairChain from './StairChain.vue'
import { chainBlue } from './stepflow/palettes'
import type { StairCallout, StairStep } from './stepflow/stair'

/**
 * Slidev registers the v-click directive globally at runtime; the render tests
 * stub it. The recording stub captures each binding value so the click
 * choreography itself is asserted (7 clicks: callout, then blocks); reveal
 * rendering is dogfooded against the running dev server (spike art_7Q2OtXCm).
 */
type StairChainProps = {
  steps: StairStep[]
  callout?: StairCallout
  palette?: Record<string, string>
  title?: string
  titleAccent?: string
}

function mountStairChain(props: StairChainProps) {
  return mount(StairChain, { props, global: { directives: { click: {} } } })
}

function mountRecordingClicks(props: StairChainProps) {
  const clicks: number[] = []
  const wrapper = mount(StairChain, {
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

// The demo seed mirrors the v1 recording (THE DATA ENGINEERING LIFECYCLE):
// uniform ascent except the measured rises of the recording's silhouette —
// the RETRY block dips below TRANSFORM (see stair.test.ts for the math).
const steps: StairStep[] = [
  { id: 'ingest', title: 'INGEST', caption: 'SOURCE SYSTEMS', lift: 0 },
  { id: 'transform', title: 'TRANSFORM', caption: 'CLEAN + MODEL', lift: 0.0603 },
  { id: 'retry', title: 'RETRY', caption: 'EXPECT FAILURE', lift: 0.0227 },
  { id: 'quality', title: 'QUALITY', caption: 'TESTS GATE DEPLOYS', lift: 0.1346 },
  { id: 'serve', title: 'SERVE', caption: 'DASHBOARDS + APIS', lift: 0.2028 },
  { id: 'govern', title: 'GOVERN', caption: 'LINEAGE + ACCESS', lift: 0.271 },
]
const callout: StairCallout = { text: '= 3×', xFrac: 0.026, yFrac: 0.528 }

function shippedCss(): string {
  return Array.from(document.querySelectorAll('style'))
    .map((tag) => tag.textContent ?? '')
    .join('\n')
}

describe('StairChain', () => {
  it('owns 7 clicks: the callout first, then one per block', () => {
    const { clicks } = mountRecordingClicks({ steps, callout })

    expect(clicks).toHaveLength(7)
    expect([...clicks].sort((a, b) => a - b)).toEqual([1, 2, 3, 4, 5, 6, 7])
    // Callout is click 1; blocks take clicks 2…7 left → right.
    expect(clicks.filter((c) => c !== 1)).toHaveLength(6)
    expect(clicks).toContain(1)
  })

  it('without a callout the blocks shift down to clicks 1…n (no gaps)', () => {
    const { clicks } = mountRecordingClicks({ steps })

    expect(clicks).toHaveLength(6)
    expect([...clicks].sort((a, b) => a - b)).toEqual([1, 2, 3, 4, 5, 6])
  })

  it('renders one group per block over the measured canvas with an accessible name', () => {
    const wrapper = mountStairChain({ steps, callout })

    expect(wrapper.find('svg.stairchain').exists()).toBe(true)
    expect(wrapper.findAll('.sf-step')).toHaveLength(6)
    expect(wrapper.findAll('.sf-block')).toHaveLength(6)
    expect(wrapper.findAll('.sf-callout')).toHaveLength(1)

    const svg = wrapper.find('svg.stairchain')
    expect(svg.attributes('viewBox')).toBe('0 0 1920 1080')
    expect(svg.attributes('role')).toBe('img')
    expect(svg.attributes('aria-label')).toBe('6-step staircase diagram')
  })

  it('renders in-block labels and captions below the blocks', () => {
    const wrapper = mountStairChain({ steps, callout })

    const labels = wrapper.findAll('.sf-label').map((t) => t.text())
    expect(labels).toEqual(['INGEST', 'TRANSFORM', 'RETRY', 'QUALITY', 'SERVE', 'GOVERN'])

    const captions = wrapper.findAll('.sf-caption').map((t) => t.text())
    expect(captions[0]).toBe('SOURCE SYSTEMS')

    // Captions sit below their block: caption baseline > block bottom.
    const first = wrapper.findAll('.sf-step')[0]
    const blockY = Number(first.find('.sf-block').attributes('y'))
    const blockH = Number(first.find('.sf-block').attributes('height'))
    const captionY = Number(first.find('.sf-caption').attributes('y'))
    expect(captionY).toBeGreaterThan(blockY + blockH)
    expect(wrapper.find('.sf-callout').text()).toBe('= 3×')
  })

  it('lift overrides reach the rendered rects — the RETRY dip is visible in geometry', () => {
    const wrapper = mountStairChain({ steps, callout })
    const blocks = wrapper.findAll('.sf-block')

    // TRANSFORM (k=1, lift 0.0603): bottom 903.96 − 65.124 = 838.836 → top 690.876.
    expect(Number(blocks[1].attributes('y'))).toBeCloseTo(690.876, 6)
    // RETRY (k=2, lift 0.0227): bottom 903.96 − 24.516 = 879.444 → top 731.484 —
    // numerically LOWER on screen than its left neighbor: the dip.
    expect(Number(blocks[2].attributes('y'))).toBeCloseTo(731.484, 6)
    expect(Number(blocks[2].attributes('y'))).toBeGreaterThan(Number(blocks[1].attributes('y')))
  })

  it('ships the chainBlue palette: blue blocks + captions, amber callout', () => {
    const wrapper = mountStairChain({ steps, callout })

    expect(wrapper.find('.sf-block').attributes('fill')).toBe(chainBlue.accent) // #349aea
    expect(wrapper.find('.sf-caption').attributes('fill')).toBe(chainBlue.accent)
    expect(wrapper.find('.sf-callout').attributes('fill')).toBe(chainBlue.accentAlt) // #f7ba20
    // In-block labels are white chrome, not palette.
    expect(wrapper.find('.sf-label').attributes('fill')).toBe('#ffffff')
  })

  it('reflects a palette override over chainBlue while keeping the amber callout', () => {
    const wrapper = mountStairChain({ steps, callout, palette: { accent: '#ff0000' } })
    const html = wrapper.html()

    expect(html).toContain('#ff0000') // override reaches blocks + captions
    expect(html).toContain('#f7ba20') // chainBlue.accentAlt still colors the callout
  })

  it('carries the measured timing constants and reduced-motion block in its styles', () => {
    mountStairChain({ steps, callout })

    const css = shippedCss()
    expect(css).toContain('180ms') // block fade/scale rise (~150–200ms measured)
    expect(css).toContain('150ms') // callout fade
    expect(css).toContain('prefers-reduced-motion') // transitions disabled, instant state
  })

  it('keeps the backward-nav snap: hidden state ships transition none', () => {
    mountStairChain({ steps, callout })

    const css = shippedCss()
    const hiddenRule = css.match(/\.sf-step\.slidev-vclick-hidden[^{]*\{[^}]*\}/)?.[0] ?? ''
    expect(hiddenRule).toContain('transition: none')
    const calloutHidden = css.match(/\.sf-callout\.slidev-vclick-hidden[^{]*\{[^}]*\}/)?.[0] ?? ''
    expect(calloutHidden).toContain('transition: none')
  })

  it('renders the two-tone header: white title with a chrome-green accent tail', () => {
    const withAccent = mountStairChain({ steps, title: 'THE DATA ENGINEERING', titleAccent: 'LIFECYCLE' })
    expect(withAccent.find('.header').text()).toContain('THE DATA ENGINEERING')
    expect(withAccent.find('.header').text()).toContain('LIFECYCLE')
    expect(withAccent.html()).toContain('#66fb00')

    const withoutAccent = mountStairChain({ steps, title: 'PLAIN HEADER' })
    expect(withoutAccent.html()).not.toContain('#66fb00')
  })

  it('surfaces the geometry RangeError for 0 steps instead of rendering blank', () => {
    expect(() => mountStairChain({ steps: [] })).toThrow(RangeError)
  })
})
