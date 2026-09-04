// @vitest-environment happy-dom
import { describe, expect, it } from 'vitest'
import { mount } from '@vue/test-utils'
import StackPanels from './StackPanels.vue'
import { SWEEP_FRAC, type StackPanel } from './stepflow/panels'

/**
 * Slidev registers the v-click directive globally at runtime; the render tests
 * stub it as a no-op so the component mounts outside the deck. Reveal behavior
 * itself is dogfooded against the running dev server (spike art_7Q2OtXCm).
 * data-sf-click attributes mirror the v-click bindings so the re-paced click
 * plan is assertable here (the directive stub renders no marker of its own).
 */
function mountStackPanels(props: Record<string, unknown>) {
  return mount(StackPanels, { props, global: { directives: { click: {} } } })
}

// The wave-1 re-measured 2×2 mosaic (panels.test.ts holds the hand-computed
// rects): blue TL, cyan TR, amber BL, green BR — every panel burst-pops, text
// fades stepped on the final click. The legacy sweep mechanism keeps its own
// seed below for the styled sweep path.
const SEED: StackPanel[] = [
  { id: 'blue', xFrac: 0.1197, yFrac: 0.3374, wFrac: 0.3906, hFrac: 0.2815, tone: 'accent', bandReveal: 'pop', title: 'RUNTIME' },
  { id: 'cyan', xFrac: 0.5103, yFrac: 0.3374, wFrac: 0.3219, hFrac: 0.2815, tone: 'alt', bandReveal: 'pop', title: 'CANVAS' },
  { id: 'amber', xFrac: 0.1197, yFrac: 0.6206, wFrac: 0.2718, hFrac: 0.2797, tone: 'tertiary', bandReveal: 'pop', title: 'INGEST' },
  { id: 'green', xFrac: 0.3925, yFrac: 0.6189, wFrac: 0.4396, hFrac: 0.2815, tone: 'quaternary', bandReveal: 'pop', title: 'WAREHOUSE', rows: ['STREAMS REPLACE BATES', 'GOVERNED BY DEFAULT'] },
]

// The v4 recording's top band is the only sweep user left; kept stylized.
const SWEEP_SEED: StackPanel[] = [
  { id: 'band', xFrac: 0.1178, yFrac: 0.333, wFrac: 0.7168, hFrac: 0.285, tone: 'accent', bandReveal: 'sweep' },
]

const FULL_PROPS = {
  panels: SEED,
  caption: 'the stack is consolidating — pick your defaults early',
  title: 'STACK PANELS',
  titleAccent: 'FIVE CLICKS',
  palette: { accent: '#3599fb', accentAlt: '#1fd0ea', accentTertiary: '#f7ba20', accentQuaternary: '#1cd798' },
}

/** All shipped <style> text (vitest `css: true` mounts SFC style blocks). */
function shippedCss(): string {
  return Array.from(document.querySelectorAll('style'))
    .map((tag) => tag.textContent ?? '')
    .join('\n')
}

describe('StackPanels', () => {
  it('renders one group per panel — all pops on the demo seed, sweep kept stylized', () => {
    const wrapper = mountStackPanels(FULL_PROPS)

    expect(wrapper.find('svg.stackpanels').exists()).toBe(true)
    expect(wrapper.findAll('.sf-panel')).toHaveLength(4)
    expect(wrapper.findAll('.sf-panel--pop')).toHaveLength(4)
    expect(wrapper.findAll('.sf-panel--pop .sf-band')).toHaveLength(4)

    const swept = mountStackPanels({ panels: SWEEP_SEED })
    expect(swept.find('.sf-panel--sweep .sf-band').exists()).toBe(true)
    expect(swept.findAll('.sf-panel--pop')).toHaveLength(0)
  })

  it('exposes the measured canvas and an accessible name', () => {
    const wrapper = mountStackPanels(FULL_PROPS)
    const svg = wrapper.find('svg.stackpanels')

    expect(svg.attributes('viewBox')).toBe('0 0 1920 1080')
    expect(svg.attributes('role')).toBe('img')
    expect(svg.attributes('aria-label')).toBe('4-panel stack diagram')
  })

  it('paces the reveal to 5 clicks: blue, cyan, amber, green, labels', () => {
    const wrapper = mountStackPanels(FULL_PROPS)

    const clicks = wrapper.findAll('[data-sf-click]').map((el) => Number(el.attributes('data-sf-click')))
    expect(new Set(clicks)).toEqual(new Set([1, 2, 3, 4, 5]))
    // Panels take clicks 1..4 in data order; every label shares the final click.
    const groupClicks = wrapper.findAll('.sf-panel').map((g) => Number(g.attributes('data-sf-click')))
    expect(groupClicks).toEqual([1, 2, 3, 4])
    const labelClicks = wrapper.findAll('.sf-label').map((t) => Number(t.attributes('data-sf-click')))
    expect(labelClicks.length).toBeGreaterThan(0)
    expect(new Set(labelClicks)).toEqual(new Set([5]))
  })

  it('binds the measured four-panel mosaic geometry', () => {
    const wrapper = mountStackPanels(FULL_PROPS)
    const bands = wrapper.findAll('rect.sf-band')

    expect(bands).toHaveLength(4)
    // blue TL:  0.1197·1920=229.824  0.3374·1080=364.392  0.3906·1920=749.952  0.2815·1080=304.02
    expect(Number(bands[0].attributes('x'))).toBeCloseTo(229.824, 6)
    expect(Number(bands[0].attributes('y'))).toBeCloseTo(364.392, 6)
    expect(Number(bands[0].attributes('width'))).toBeCloseTo(749.952, 6)
    expect(Number(bands[0].attributes('height'))).toBeCloseTo(304.02, 6)
    // cyan TR:  0.5103·1920=979.776  0.3219·1920=618.048
    expect(Number(bands[1].attributes('x'))).toBeCloseTo(979.776, 6)
    expect(Number(bands[1].attributes('y'))).toBeCloseTo(364.392, 6)
    expect(Number(bands[1].attributes('width'))).toBeCloseTo(618.048, 6)
    expect(Number(bands[1].attributes('height'))).toBeCloseTo(304.02, 6)
    // amber BL: 0.6206·1080=670.248  0.2718·1920=521.856  0.2797·1080=302.076
    expect(Number(bands[2].attributes('x'))).toBeCloseTo(229.824, 6)
    expect(Number(bands[2].attributes('y'))).toBeCloseTo(670.248, 6)
    expect(Number(bands[2].attributes('width'))).toBeCloseTo(521.856, 6)
    expect(Number(bands[2].attributes('height'))).toBeCloseTo(302.076, 6)
    // green BR: 0.3925·1920=753.6  0.6189·1080=668.412  0.4396·1920=844.032
    expect(Number(bands[3].attributes('x'))).toBeCloseTo(753.6, 6)
    expect(Number(bands[3].attributes('y'))).toBeCloseTo(668.412, 6)
    expect(Number(bands[3].attributes('width'))).toBeCloseTo(844.032, 6)
    expect(Number(bands[3].attributes('height'))).toBeCloseTo(304.02, 6)
  })

  it('sizes a styled sweep band by SWEEP_FRAC (legacy mechanism)', () => {
    const wrapper = mountStackPanels({ panels: SWEEP_SEED })
    const [band] = wrapper.findAll('rect.sf-band')

    // 0.1178·1920=226.176  0.7168·1920·SWEEP_FRAC=1376.256  0.285·1080=307.8
    expect(Number(band.attributes('x'))).toBeCloseTo(226.176, 6)
    expect(Number(band.attributes('width'))).toBeCloseTo(1376.256 * SWEEP_FRAC, 6)
    expect(Number(band.attributes('height'))).toBeCloseTo(307.8, 6)
  })

  it('resolves all four palette tokens, with later slots falling back to accent', () => {
    const wrapper = mountStackPanels(FULL_PROPS)
    const html = wrapper.html()
    expect(html).toContain('#3599fb') // accent — the blue panel
    expect(html).toContain('#1fd0ea') // accentAlt — the cyan panel
    expect(html).toContain('#f7ba20') // accentTertiary — the amber panel
    expect(html).toContain('#1cd798') // accentQuaternary — the green panel

    // Without the override, every panel still renders — in accent.
    const fallback = mountStackPanels({ panels: SEED })
    const fills = fallback.findAll('rect.sf-band').map((r) => r.attributes('fill'))
    expect(fills.every((f) => f === '#23d7ed')).toBe(true)
  })

  it('fades labels stepped on the final click: white titles top-left, dark rows, caption', () => {
    const wrapper = mountStackPanels(FULL_PROPS)
    const labels = wrapper.findAll('.sf-label')

    // 4 titles + 2 green rows + caption
    expect(labels).toHaveLength(7)
    // Vue serializes the custom property with normalizer spacing — assert the value.
    const delays = labels.map((t) => t.attributes('style').replace(/\s+/g, ''))
    expect(delays[0]).toContain('--sf-label-delay:0ms')
    expect(delays[1]).toContain('--sf-label-delay:90ms')
    expect(delays[6]).toContain('--sf-label-delay:540ms')

    const texts = labels.map((t) => t.text())
    expect(texts).toEqual(['RUNTIME', 'CANVAS', 'INGEST', 'WAREHOUSE', 'STREAMS REPLACE BATES', 'GOVERNED BY DEFAULT', 'the stack is consolidating — pick your defaults early'])

    // Titles render white at each panel's top-left (fix list: ~40px, anchor start).
    const blueTitle = labels.find((t) => t.text() === 'RUNTIME')!
    expect(blueTitle.attributes('fill')).toBe('#ffffff')
    expect(blueTitle.attributes('text-anchor')).toBe('start')
    expect(Number(blueTitle.attributes('x'))).toBeCloseTo(229.824 + 23.04, 6)
    expect(Number(blueTitle.attributes('y'))).toBeCloseTo(364.392 + 43.2, 6)
    expect(Number(blueTitle.attributes('font-size'))).toBeCloseTo(41.04, 6)

    // Rows render dark, left-aligned under their panel's title.
    const greenRow = labels.find((t) => t.text() === 'STREAMS REPLACE BATES')!
    expect(greenRow.attributes('fill')).toBe('#000000')
    expect(greenRow.attributes('text-anchor')).toBe('start')
    expect(Number(greenRow.attributes('x'))).toBeCloseTo(753.6 + 23.04, 6)
    expect(Number(greenRow.attributes('y'))).toBeCloseTo(668.412 + 43.2 + 41.04 * 1.75, 6)

    // The caption stays white and centered under the mosaic at ~26px (0.024·1080).
    const caption = labels.find((t) => t.text().startsWith('the stack'))!
    expect(caption.attributes('fill')).toBe('#ffffff')
    expect(caption.attributes('text-anchor')).toBe('middle')
    expect(Number(caption.attributes('font-size'))).toBeCloseTo(25.92, 6)
  })

  it('renders the two-tone header chrome: white lead, chrome-green tail', () => {
    const wrapper = mountStackPanels(FULL_PROPS)
    const header = wrapper.find('.sf-header')

    expect(header.exists()).toBe(true)
    expect(header.attributes('text-anchor')).toBe('middle')
    const html = header.html()
    expect(html).toContain('#ffffff')
    expect(html).toContain('#66fb00')
    expect(header.text()).toContain('STACK PANELS')
    expect(header.text()).toContain('FIVE CLICKS')
  })

  it('keeps the hidden-state transition:none — backward nav snaps, sweep retracts', () => {
    mountStackPanels(FULL_PROPS)
    const css = shippedCss()

    // Sweep hidden state: retracted + no transition (instant snap back).
    const sweepHidden = css.match(/\.sf-panel--sweep\.slidev-vclick-hidden \.sf-band[^{]*\{[^}]*\}/)?.[0] ?? ''
    expect(sweepHidden).toContain('transform: scaleX(0)')
    expect(sweepHidden).toContain('transition: none')
    // Pop hidden state: transparent + no transition (instant snap back too).
    const popHidden = css.match(/\.sf-panel--pop\.slidev-vclick-hidden \.sf-band[^{]*\{[^}]*\}/)?.[0] ?? ''
    expect(popHidden).toContain('opacity: 0')
    expect(popHidden).toContain('transition: none')
    // Labels hidden state: transparent + no transition (delay must not apply).
    const labelHidden = css.match(/\.sf-label\.slidev-vclick-hidden[^{]*\{[^}]*\}/)?.[0] ?? ''
    expect(labelHidden).toContain('opacity: 0')
    expect(labelHidden).toContain('transition: none')
  })

  it('carries the measured timing constants and the reduced-motion block', () => {
    mountStackPanels(FULL_PROPS)
    const css = shippedCss()

    expect(css).toContain('60ms') // pop bursts (fix list: 50–80ms)
    expect(css).toContain('80ms') // legacy sweep, shortened into the burst window
    expect(css).toContain('prefers-reduced-motion') // transitions disabled
  })

  it('surfaces the geometry RangeError for an out-of-range fraction', () => {
    expect(() =>
      mountStackPanels({ panels: [{ id: 'bad', xFrac: 1.2, yFrac: 0, wFrac: 0.1, hFrac: 0.1, tone: 'accent' }] }),
    ).toThrow(RangeError)
  })
})
