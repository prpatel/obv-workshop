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

// The measured v4 mosaic (panels.test.ts holds the hand-computed rects):
// top band sweeps, amber sub-panel pops bottom-left, teal-green sub-panel
// pops bottom-right; text fades stepped on the final click.
const SEED: StackPanel[] = [
  { id: 'band', xFrac: 0.1178, yFrac: 0.333, wFrac: 0.7168, hFrac: 0.285, tone: 'accent', bandReveal: 'sweep', title: 'ONE RUNTIME' },
  { id: 'amber', xFrac: 0.1178, yFrac: 0.6189, wFrac: 0.2738, hFrac: 0.2858, tone: 'alt', bandReveal: 'pop', rows: ['ZERO-ETL INGEST', 'STREAMS REPLACE BATES'] },
  { id: 'green', xFrac: 0.3916, yFrac: 0.6189, wFrac: 0.4431, hFrac: 0.2858, tone: 'tertiary', bandReveal: 'pop', rows: ['LAKE-SCALE WAREHOUSES', 'GOVERNED BY DEFAULT'] },
]

const FULL_PROPS = {
  panels: SEED,
  caption: 'the stack is consolidating — pick your defaults early',
  title: 'STACK PANELS',
  titleAccent: 'FOUR CLICKS',
  palette: { accentAlt: '#f7ba20', accentTertiary: '#1cd798' },
}

/** All shipped <style> text (vitest `css: true` mounts SFC style blocks). */
function shippedCss(): string {
  return Array.from(document.querySelectorAll('style'))
    .map((tag) => tag.textContent ?? '')
    .join('\n')
}

describe('StackPanels', () => {
  it('renders one group per panel with the sweep band element present', () => {
    const wrapper = mountStackPanels(FULL_PROPS)

    expect(wrapper.find('svg.stackpanels').exists()).toBe(true)
    expect(wrapper.findAll('.sf-panel')).toHaveLength(3)
    expect(wrapper.find('.sf-panel--sweep .sf-band').exists()).toBe(true)
    expect(wrapper.findAll('.sf-panel--pop .sf-band')).toHaveLength(2)
  })

  it('exposes the measured canvas and an accessible name', () => {
    const wrapper = mountStackPanels(FULL_PROPS)
    const svg = wrapper.find('svg.stackpanels')

    expect(svg.attributes('viewBox')).toBe('0 0 1920 1080')
    expect(svg.attributes('role')).toBe('img')
    expect(svg.attributes('aria-label')).toBe('3-panel stack diagram')
  })

  it('paces the reveal to 4 clicks: band, amber, green, labels', () => {
    const wrapper = mountStackPanels(FULL_PROPS)

    const clicks = wrapper.findAll('[data-sf-click]').map((el) => Number(el.attributes('data-sf-click')))
    expect(new Set(clicks)).toEqual(new Set([1, 2, 3, 4]))
    // Panels take clicks 1..3 in data order; every label shares the final click.
    const groupClicks = wrapper.findAll('.sf-panel').map((g) => Number(g.attributes('data-sf-click')))
    expect(groupClicks).toEqual([1, 2, 3])
    const labelClicks = wrapper.findAll('.sf-label').map((t) => Number(t.attributes('data-sf-click')))
    expect(labelClicks.length).toBeGreaterThan(0)
    expect(new Set(labelClicks)).toEqual(new Set([4]))
  })

  it('binds the measured mosaic geometry, band sweep sized by SWEEP_FRAC', () => {
    const wrapper = mountStackPanels(FULL_PROPS)
    const bands = wrapper.findAll('rect.sf-band')

    expect(bands).toHaveLength(3)
    // band: 0.1178·1920=226.176  0.333·1080=359.64  0.7168·1920·SWEEP_FRAC=1376.256  0.285·1080=307.8
    expect(Number(bands[0].attributes('x'))).toBeCloseTo(226.176, 6)
    expect(Number(bands[0].attributes('y'))).toBeCloseTo(359.64, 6)
    expect(Number(bands[0].attributes('width'))).toBeCloseTo(1376.256 * SWEEP_FRAC, 6)
    expect(Number(bands[0].attributes('height'))).toBeCloseTo(307.8, 6)
    // amber pop tile
    expect(Number(bands[1].attributes('x'))).toBeCloseTo(226.176, 6)
    expect(Number(bands[1].attributes('y'))).toBeCloseTo(668.412, 6)
    expect(Number(bands[1].attributes('width'))).toBeCloseTo(525.696, 6)
  })

  it('resolves all three palette tokens, with tertiary falling back to accent', () => {
    const wrapper = mountStackPanels(FULL_PROPS)
    const html = wrapper.html()
    expect(html).toContain('#23d7ed') // accent — the band
    expect(html).toContain('#f7ba20') // accentAlt — the amber panel
    expect(html).toContain('#1cd798') // accentTertiary — the green panel

    // Without the override, the tertiary panel still renders — in accent.
    const fallback = mountStackPanels({ panels: SEED })
    const fills = fallback.findAll('rect.sf-band').map((r) => r.attributes('fill'))
    expect(fills.every((f) => f === '#23d7ed')).toBe(true)
  })

  it('fades labels stepped on the final click, tones per slot', () => {
    const wrapper = mountStackPanels(FULL_PROPS)
    const labels = wrapper.findAll('.sf-label')

    // band title + 2 amber rows + 2 green rows + caption
    expect(labels).toHaveLength(6)
    // Vue serializes the custom property with normalizer spacing — assert the value.
    const delays = labels.map((t) => t.attributes('style').replace(/\s+/g, ''))
    expect(delays[0]).toContain('--sf-label-delay:0ms')
    expect(delays[1]).toContain('--sf-label-delay:90ms')
    expect(delays[5]).toContain('--sf-label-delay:450ms')

    const texts = labels.map((t) => t.text())
    expect(texts).toContain('ONE RUNTIME')
    expect(texts).toContain('the stack is consolidating — pick your defaults early')
    // Rows render in the icon stroke (dark on the colored panels).
    const rowFills = new Set(labels.filter((t) => t.text().includes('ZERO-ETL')).map((t) => t.attributes('fill')))
    expect(rowFills).toEqual(new Set(['#000000']))
    // Panel text renders dark (iconStroke — the recording has no light glyphs
    // inside any panel); only the caption is white.
    const titleFill = labels.find((t) => t.text() === 'ONE RUNTIME')?.attributes('fill')
    expect(titleFill).toBe('#000000')
    const captionFill = labels.find((t) => t.text().startsWith('the stack'))?.attributes('fill')
    expect(captionFill).toBe('#ffffff')
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
    expect(header.text()).toContain('FOUR CLICKS')
  })

  it('keeps the hidden-state transition:none — backward nav snaps, sweep retracts', () => {
    mountStackPanels(FULL_PROPS)
    const css = shippedCss()

    // Sweep hidden state: retracted + no transition (instant snap back).
    const sweepHidden = css.match(/\.sf-panel--sweep\.slidev-vclick-hidden \.sf-band[^{]*\{[^}]*\}/)?.[0] ?? ''
    expect(sweepHidden).toContain('transform: scaleX(0)')
    expect(sweepHidden).toContain('transition: none')
    // Labels hidden state: transparent + no transition (delay must not apply).
    const labelHidden = css.match(/\.sf-label\.slidev-vclick-hidden[^{]*\{[^}]*\}/)?.[0] ?? ''
    expect(labelHidden).toContain('opacity: 0')
    expect(labelHidden).toContain('transition: none')
  })

  it('carries the measured timing constants and the reduced-motion block', () => {
    mountStackPanels(FULL_PROPS)
    const css = shippedCss()

    expect(css).toContain('300ms') // band sweep
    expect(css).toContain('150ms') // pop + label fade
    expect(css).toContain('prefers-reduced-motion') // transitions disabled
  })

  it('surfaces the geometry RangeError for an out-of-range fraction', () => {
    expect(() =>
      mountStackPanels({ panels: [{ id: 'bad', xFrac: 1.2, yFrac: 0, wFrac: 0.1, hFrac: 0.1, tone: 'accent' }] }),
    ).toThrow(RangeError)
  })
})
