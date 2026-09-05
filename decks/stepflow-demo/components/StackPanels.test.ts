// @vitest-environment happy-dom
import { describe, expect, it } from 'vitest'
import { mount } from '@vue/test-utils'
import StackPanels from './StackPanels.vue'
import { STACKPANELS_SEED, type StackPanel } from './stepflow/panels'

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

// The exact-trace measured mosaic (art_mkVNxsft §1.2 — panels.ts holds the
// sheet numbers): white plate under a flush 2×2 mosaic, every fill cut at its
// outer corner, dark icon+title groups centered per panel, green panel empty
// below its title, caption landing with the plate brighten. The four recorded
// shades ride the palette (amber #f9bc1d per the sheet).
const FULL_PROPS = {
  panels: STACKPANELS_SEED,
  caption: 'ONE ENVIRONMENT',
  title: 'One',
  titleAccent: 'unified environment',
  palette: { accent: '#3599fb', accentAlt: '#1fd0ea', accentTertiary: '#f9bc1d', accentQuaternary: '#1cd798' },
}

// The stylized legacy top-band sweep entry, kept for the sweep mechanism.
const SWEEP_SEED: StackPanel[] = [
  { id: 'band', xFrac: 0.1178, yFrac: 0.333, wFrac: 0.7168, hFrac: 0.285, tone: 'accent', bandReveal: 'sweep' },
]

/** All shipped <style> text (vitest `css: true` mounts SFC style blocks). */
function shippedCss(): string {
  return Array.from(document.querySelectorAll('style'))
    .map((tag) => tag.textContent ?? '')
    .join('\n')
}

describe('StackPanels', () => {
  it('renders the sheet-correct strings and one group per panel', () => {
    const wrapper = mountStackPanels(FULL_PROPS)

    expect(wrapper.find('svg.stackpanels').exists()).toBe(true)
    expect(wrapper.find('svg.stackpanels').attributes('viewBox')).toBe('0 0 1920 1080')
    expect(wrapper.find('svg.stackpanels').attributes('aria-label')).toBe('4-panel stack diagram')
    expect(wrapper.findAll('.sf-panel')).toHaveLength(4)

    const text = wrapper.text()
    expect(text).toContain('One')
    expect(text).toContain('unified environment')
    expect(text).toContain('ONE ENVIRONMENT')
    expect(text).toContain('INGESTION')
    expect(text).toContain('TRANSFORM')
    expect(text).toContain('STORAGE')
    expect(text).toContain('MONITORING')
    // The wave-1 rows are gone (green panel empty below its title).
    expect(text).not.toContain('STREAMS REPLACE BATES')
  })

  it('fades panels at full size — no pops, no sweeps on the demo seed', () => {
    const wrapper = mountStackPanels(FULL_PROPS)

    expect(wrapper.findAll('.sf-panel--fade')).toHaveLength(4)
    expect(wrapper.findAll('.sf-panel--pop')).toHaveLength(0)
    expect(wrapper.findAll('.sf-panel--sweep')).toHaveLength(0)
    for (const band of wrapper.findAll('.sf-band')) {
      expect(band.element.tagName).toBe('path')
      expect(band.attributes('d')).toBeTruthy()
      // Full-size entry: no scale transform anywhere on the fills.
      expect(band.attributes('transform')).toBeUndefined()
    }

    const swept = mountStackPanels({ panels: SWEEP_SEED })
    expect(swept.find('.sf-panel--sweep .sf-band').exists()).toBe(true)
  })

  it('paces five clicks — four panel fades, then the plate brighten + caption', () => {
    const wrapper = mountStackPanels(FULL_PROPS)

    const clicks = wrapper.findAll('.sf-panel').map((g) => g.attributes('data-sf-click'))
    expect(clicks).toEqual(['1', '2', '3', '4'])
    expect(wrapper.find('.sf-caption').attributes('data-sf-click')).toBe('5')
    expect(wrapper.find('.sf-plate--dim').attributes('data-sf-click')).toBe('1')
    expect(wrapper.find('.sf-plate--full').attributes('data-sf-click')).toBe('5')
  })

  it('draws the white plate with a left/bottom/right border and no top line', () => {
    const wrapper = mountStackPanels(FULL_PROPS)

    for (const layer of ['sf-plate--dim', 'sf-plate--full']) {
      const plate = wrapper.find(`.${layer}`)
      const rect = plate.find('rect')
      expect(rect.attributes('fill')).toBe('#f5f5f5')
      expect(Number(rect.attributes('x'))).toBeCloseTo(222.2, 2)
      expect(Number(rect.attributes('y'))).toBeCloseTo(356.9, 2)
      expect(Number(rect.attributes('width'))).toBeCloseTo(1382.5, 2)
      expect(Number(rect.attributes('height'))).toBeCloseTo(623.0, 2)

      const border = plate.find('path')
      expect(border.attributes('stroke')).toBe('#989898')
      expect(border.attributes('stroke-width')).toBe('1')
      // Left edge down, bottom across, right edge up — no top segment.
      expect(border.attributes('d')).toBe('M 222.2 356.9 V 979.9 H 1604.7 V 356.9')
    }
  })

  it('omits the plate entirely when plate is false (user8 seg08 dark variant)', () => {
    const wrapper = mountStackPanels({ ...FULL_PROPS, plate: false })
    expect(wrapper.findAll('.sf-plate').length).toBe(0)
  })

  it('cuts each panel at its outer corner (45° chamfers showing plate white)', () => {
    const wrapper = mountStackPanels(FULL_PROPS)

    const ds = wrapper.findAll('.sf-panel--fade .sf-band').map((p) => p.attributes('d'))
    // Blue TL panel x229.8 y364.4 748.6×301.2, cut 10 at the top-left.
    expect(ds[0]).toBe('M 239.8 364.4 H 978.4 V 665.6 H 229.8 V 374.4 Z')
    // Cyan TR: cut at the top-right.
    expect(ds[1]).toBe('M 981.3 364.4 H 1586.3 L 1596.3 374.4 V 665.6 H 981.3 Z')
    // Amber BL: cut at the bottom-left.
    expect(ds[2]).toBe('M 229.8 670.3 H 750.6 V 971.4 H 239.8 L 229.8 961.4 Z')
    // Green BR: cut at the bottom-right.
    expect(ds[3]).toBe('M 753.4 668.7 H 1596.3 V 961.4 L 1586.3 971.4 H 753.4 Z')
  })

  it('inverts polarity: near-black icon and title cores on the fills', () => {
    const wrapper = mountStackPanels(FULL_PROPS)

    // Amber (#f9bc1d) rides the palette's tertiary slot.
    const amberBand = wrapper.findAll('.sf-panel--fade .sf-band')[2]
    expect(amberBand.attributes('fill')).toBe('#f9bc1d')

    expect(wrapper.findAll('.sf-icon')).toHaveLength(4)
    expect(wrapper.findAll('.sf-title')).toHaveLength(4)
    for (const icon of wrapper.findAll('.sf-icon')) {
      expect(icon.attributes('style')).toContain('#000000')
    }
    for (const title of wrapper.findAll('.sf-title')) {
      expect(title.attributes('fill')).toBe('#000000')
      expect(title.attributes('text-anchor')).toBe('middle')
      // Measured-extent pinning: the mono face is wider than the recording's
      // face at equal cap, so every title carries textLength.
      expect(title.attributes('textLength')).toBeTruthy()
      expect(title.attributes('lengthAdjust')).toBe('spacing')
    }
  })

  it('centers titles and icons at the measured ink boxes', () => {
    const wrapper = mountStackPanels(FULL_PROPS)

    const [blueTitle] = wrapper.findAll('.sf-title')
    // INGESTION ink center x≈661.08, baseline ≈531.5 (native ink ×0.94171/0.944055).
    expect(Number(blueTitle.attributes('x'))).toBeCloseTo(661.08, 1)
    expect(Number(blueTitle.attributes('y'))).toBeCloseTo(531.5, 1)

    const blueIcon = wrapper.find('.sf-icon')
    expect(blueIcon.attributes('transform')).toContain('translate(398.3 489)')
  })

  it('pins the caption to the measured extent (center x≈908.8, not canvas-centered)', () => {
    const wrapper = mountStackPanels(FULL_PROPS)

    const caption = wrapper.find('.sf-caption')
    expect(Number(caption.attributes('x'))).toBeCloseTo(908.75, 1)
    expect(Number(caption.attributes('y'))).toBeCloseTo(1065.9, 1)
    expect(caption.attributes('fill')).toBe('#f5f5f5')
    expect(Number(caption.attributes('textLength'))).toBeCloseTo(476.5, 1)
  })

  it('renders the two-tone header as measured ink spans (chrome title class)', () => {
    const wrapper = mountStackPanels(FULL_PROPS)

    const group = wrapper.find('.sf-chrome-title')
    expect(group.exists()).toBe(true)
    const texts = group.findAll('text')
    expect(texts).toHaveLength(2)

    expect(texts[0].text()).toBe('One')
    expect(texts[0].attributes('fill')).toBe('#ffffff')
    expect(Number(texts[0].attributes('x'))).toBeCloseTo(324.9, 1)
    expect(Number(texts[0].attributes('textLength'))).toBeCloseTo(194.0, 1)
    expect(texts[0].attributes('lengthAdjust')).toBe('spacing')

    expect(texts[1].text()).toBe('unified environment')
    expect(texts[1].attributes('fill')).toBe('#66fb00')
    expect(Number(texts[1].attributes('x'))).toBeCloseTo(545.3, 1)
    expect(Number(texts[1].attributes('textLength'))).toBeCloseTo(961.5, 1)

    // Shared baseline; per-run caps (lead 50.9, accent 77.3) → fonts 69.7/105.9.
    expect(texts[0].attributes('y')).toBe(texts[1].attributes('y'))
    expect(Number(texts[0].attributes('font-size'))).toBeCloseTo(50.9 / 0.730, 1)
    expect(Number(texts[1].attributes('font-size'))).toBeCloseTo(77.3 / 0.730, 1)
  })

  it('measures the fade mechanism in CSS: ~300ms opacity, instant backward nav', () => {
    mountStackPanels(FULL_PROPS)
    const css = shippedCss()
    expect(css).toContain('opacity 300ms')
    expect(css).not.toContain('scale(0.85)')
    expect(css).not.toContain('--sf-label-delay')
    // The fade rule itself — the stylized sweep (unused by the demo) keeps
    // its own legacy timing, so the 300ms assertion scopes to the fade rule.
    const fadeRule = css.match(/\.sf-panel--fade \.sf-band(\[[^\]]*\])? \{[^}]*\}/)?.[0] ?? ''
    expect(fadeRule).toContain('opacity 300ms')
    expect(fadeRule).not.toContain('60ms')
    // Hidden state snaps: transition:none (the locked backward-nav decision).
    expect(css).toMatch(/\.sf-panel--fade\.slidev-vclick-hidden \.sf-band(\[[^\]]*\])? \{[^}]*opacity: 0;[^}]*transition: none;/s)
    expect(css).toMatch(/\.sf-plate--dim\.slidev-vclick-hidden(\[[^\]]*\])? \{[^}]*opacity: 0;[^}]*transition: none;/s)
    // The dim margin rides the first click at ~33% white.
    expect(css).toMatch(/\.sf-plate--dim(\[[^\]]*\])? \{[^}]*opacity: 0\.33;/s)
  })

  it('respects prefers-reduced-motion across every moving layer', () => {
    mountStackPanels(FULL_PROPS)
    const css = shippedCss()

    expect(css).toMatch(/@media \(prefers-reduced-motion: reduce\) \{[\s\S]*\.sf-panel--fade \.sf-band(\[[^\]]*\])?,[\s\S]*transition: none;[\s\S]*\}/)
  })
})