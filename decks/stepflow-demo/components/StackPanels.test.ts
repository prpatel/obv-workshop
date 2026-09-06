// @vitest-environment happy-dom
import { describe, expect, it } from 'vitest'
import { mount } from '@vue/test-utils'
import StackPanels from './StackPanels.vue'
import { STACKPANELS_BADGE, STACKPANELS_SEED, type StackPanel } from './stepflow/panels'

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

// The seg08 settled-truth mosaic (packet fl_bRELEFpX — panels.ts holds the
// measured numbers): plateless 2×2 abutting mosaic on black, measured palette
// inks, gray caption, white perimeter frame + chamfer patches landing on the
// final panel click (annotate mode).
const DARK_PROPS = {
  panels: STACKPANELS_SEED,
  caption: 'ONE ENVIRONMENT',
  captionColor: '#636363',
  title: 'One',
  titleAccent: 'unified environment',
  plate: false,
  annotateOnLastPanel: true,
  badge: true,
  palette: { accent: '#3799fb', accentAlt: '#1fd0ea', accentTertiary: '#f9bb1f', accentQuaternary: '#1ed798' },
}

// The legacy light-trace variant: same mosaic over the white plate, caption on
// the extra closing beat (art_mkVNxsft §1.3 click plan).
const FULL_PROPS = {
  panels: STACKPANELS_SEED,
  caption: 'ONE ENVIRONMENT',
  title: 'One',
  titleAccent: 'unified environment',
  palette: { accent: '#3799fb', accentAlt: '#1fd0ea', accentTertiary: '#f9bb1f', accentQuaternary: '#1ed798' },
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
  it('renders the settled strings and one group per panel', () => {
    const wrapper = mountStackPanels(DARK_PROPS)

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
  })

  it('fades panels at full size — no pops, no sweeps on the measured seed', () => {
    const wrapper = mountStackPanels(DARK_PROPS)

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

  it('paces four clicks — one fade per panel in onset order (annotate mode)', () => {
    const wrapper = mountStackPanels(DARK_PROPS)

    const clicks = wrapper.findAll('.sf-panel').map((g) => g.attributes('data-sf-click'))
    expect(clicks).toEqual(['1', '2', '3', '4'])
    // The late annotation pass (frame + labels + caption) rides the FINAL
    // panel click — the recording draws it 0.93–1.4s after the last onset.
    expect(wrapper.find('.sf-frame').attributes('data-sf-click')).toBe('4')
    for (const label of wrapper.findAll('.sf-icon, .sf-title')) {
      expect(label.attributes('data-sf-click')).toBe('4')
    }
    expect(wrapper.find('.sf-caption').attributes('data-sf-click')).toBe('4')
  })

  it('paces five clicks in the legacy variant — four fades + closing beat', () => {
    const wrapper = mountStackPanels(FULL_PROPS)

    const clicks = wrapper.findAll('.sf-panel').map((g) => g.attributes('data-sf-click'))
    expect(clicks).toEqual(['1', '2', '3', '4'])
    expect(wrapper.find('.sf-caption').attributes('data-sf-click')).toBe('5')
    expect(wrapper.find('.sf-plate--dim').attributes('data-sf-click')).toBe('1')
    expect(wrapper.find('.sf-plate--full').attributes('data-sf-click')).toBe('5')
    expect(wrapper.find('.sf-frame').exists()).toBe(false)
  })

  it('draws the legacy white plate with a left/bottom/right border and no top line', () => {
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

  it('omits the plate entirely when plate is false (seg08 dark variant)', () => {
    const wrapper = mountStackPanels(DARK_PROPS)
    expect(wrapper.findAll('.sf-plate').length).toBe(0)
  })

  it('cuts each panel at its outer corner — frame patches in annotate mode (17px)', () => {
    const wrapper = mountStackPanels(DARK_PROPS)

    const ds = wrapper.findAll('.sf-panel--fade .sf-band').map((p) => p.attributes('d'))
    // Blue x402 y354 610.5×247.5, cut 17 at the top-left.
    expect(ds[0]).toBe('M 419 354 H 1012.5 V 601.5 H 402 V 371 Z')
    // Cyan x1013.25 504.75 wide, cut at the top-right.
    expect(ds[1]).toBe('M 1013.25 354 H 1501 L 1518 371 V 601.5 H 1013.25 Z')
    // Amber y603 426×246, cut at the bottom-left.
    expect(ds[2]).toBe('M 402 603 H 828 V 849 H 419 L 402 832 Z')
    // Green x828 y601.5 690 wide, cut at the bottom-right.
    expect(ds[3]).toBe('M 828 601.5 H 1518 V 832 L 1501 849 H 828 Z')
  })

  it('keeps the legacy 10px plate cuts when annotate mode is off', () => {
    const wrapper = mountStackPanels(FULL_PROPS)

    const ds = wrapper.findAll('.sf-panel--fade .sf-band').map((p) => p.attributes('d'))
    expect(ds[0]).toBe('M 412 354 H 1012.5 V 601.5 H 402 V 364 Z')
    expect(ds[3]).toBe('M 828 601.5 H 1518 V 839 L 1508 849 H 828 Z')
  })

  it('renders the white perimeter frame behind the panels at measured extents', () => {
    const wrapper = mountStackPanels(DARK_PROPS)

    const segments = wrapper.findAll('.sf-frame-seg')
    expect(segments).toHaveLength(4)
    const top = wrapper.find('.sf-frame-seg--top')
    expect(Number(top.attributes('x'))).toBeCloseTo(406.5, 6)
    expect(Number(top.attributes('y'))).toBeCloseTo(348, 6)
    expect(Number(top.attributes('width'))).toBeCloseTo(1107, 6)
    expect(Number(top.attributes('height'))).toBeCloseTo(6, 6)
    expect(top.attributes('fill')).toBe('#f5f4f7')
    const left = wrapper.find('.sf-frame-seg--left')
    expect(Number(left.attributes('x'))).toBeCloseTo(396, 6)
    expect(Number(left.attributes('width'))).toBeCloseTo(6, 6)

    // The patches are cut-sized white squares exactly at the panel corners.
    const patches = wrapper.findAll('.sf-frame-patch')
    expect(patches).toHaveLength(4)
    const tl = wrapper.find('.sf-frame-patch--tl')
    expect(Number(tl.attributes('x'))).toBeCloseTo(402, 6)
    expect(Number(tl.attributes('y'))).toBeCloseTo(354, 6)
    expect(Number(tl.attributes('width'))).toBeCloseTo(17, 6)
    expect(Number(tl.attributes('height'))).toBeCloseTo(17, 6)
    const br = wrapper.find('.sf-frame-patch--br')
    expect(Number(br.attributes('x'))).toBeCloseTo(1501, 6)
    expect(Number(br.attributes('y'))).toBeCloseTo(832, 6)
  })

  it('inverts polarity: near-black icon and title cores on the fills', () => {
    const wrapper = mountStackPanels(DARK_PROPS)

    // Amber (#f9bb1f) rides the palette's tertiary slot.
    const amberBand = wrapper.findAll('.sf-panel--fade .sf-band')[2]
    expect(amberBand.attributes('fill')).toBe('#f9bb1f')

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
    const wrapper = mountStackPanels(DARK_PROPS)

    const [blueTitle] = wrapper.findAll('.sf-title')
    // INGESTION ink center x≈754.85, baseline 492 (measured cap band y462–492).
    expect(Number(blueTitle.attributes('x'))).toBeCloseTo(754.85, 1)
    expect(Number(blueTitle.attributes('y'))).toBeCloseTo(492, 1)

    const blueIcon = wrapper.find('.sf-icon')
    expect(blueIcon.attributes('transform')).toContain('translate(533.04 445.4)')
  })

  it('pins the caption to the measured extent with the slide-chosen ink', () => {
    const dark = mountStackPanels(DARK_PROPS)
    const darkCaption = dark.find('.sf-caption')
    expect(Number(darkCaption.attributes('x'))).toBeCloseTo(956.65, 1)
    expect(Number(darkCaption.attributes('y'))).toBeCloseTo(928, 1)
    expect(darkCaption.attributes('fill')).toBe('#636363')
    expect(Number(darkCaption.attributes('textLength'))).toBeCloseTo(375.7, 1)
    expect(darkCaption.classes()).toContain('sf-caption--late')

    const legacy = mountStackPanels(FULL_PROPS)
    expect(legacy.find('.sf-caption').attributes('fill')).toBe('#f5f5f5')
  })

  it('renders the two-tone header as measured ink spans (chrome title class)', () => {
    const wrapper = mountStackPanels(DARK_PROPS)

    const group = wrapper.find('.sf-chrome-title')
    expect(group.exists()).toBe(true)
    const texts = group.findAll('text')
    expect(texts).toHaveLength(2)

    expect(texts[0].text()).toBe('One')
    expect(texts[0].attributes('fill')).toBe('#ffffff')
    expect(Number(texts[0].attributes('x'))).toBeCloseTo(480, 1)
    expect(Number(texts[0].attributes('textLength'))).toBeCloseTo(160.0, 1)
    expect(texts[0].attributes('lengthAdjust')).toBe('spacing')

    expect(texts[1].text()).toBe('unified environment')
    expect(texts[1].attributes('fill')).toBe('#66fb00')
    expect(Number(texts[1].attributes('x'))).toBeCloseTo(655, 1)
    expect(Number(texts[1].attributes('textLength'))).toBeCloseTo(798.0, 1)

    // Shared baseline; per-run caps (lead 54, accent 63) → fonts 74.0/86.3.
    expect(texts[0].attributes('y')).toBe(texts[1].attributes('y'))
    expect(Number(texts[0].attributes('font-size'))).toBeCloseTo(54 / 0.730, 1)
    expect(Number(texts[1].attributes('font-size'))).toBeCloseTo(63 / 0.730, 1)
  })

  it('renders the source mark raster only when the badge prop is set', () => {
    const withBadge = mountStackPanels(DARK_PROPS)
    const mark = withBadge.find('.sf-badge')
    expect(mark.exists()).toBe(true)
    expect(Number(mark.attributes('x'))).toBeCloseTo(1849, 1)
    expect(Number(mark.attributes('y'))).toBeCloseTo(17, 1)
    expect(Number(mark.attributes('width'))).toBeCloseTo(53, 1)
    expect(Number(mark.attributes('height'))).toBeCloseTo(46, 1)
    expect(mark.attributes('href')).toBe(STACKPANELS_BADGE.dataUri)

    const withoutBadge = mountStackPanels({ ...DARK_PROPS, badge: false })
    expect(withoutBadge.find('.sf-badge').exists()).toBe(false)
  })

  it('measures the fade mechanism in CSS: ~300ms opacity, instant backward nav', () => {
    mountStackPanels(DARK_PROPS)
    const css = shippedCss()
    expect(css).toContain('opacity 300ms')
    expect(css).not.toContain('scale(0.85)')
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
  it('paces the late annotation pass with the measured transition delays', () => {
    mountStackPanels(DARK_PROPS)
    const css = shippedCss()
    // Scoped selectors carry a [data-v-xxx] attribute between the class and
    // the following comma/brace.
    const v = '(\\[[^\\]]*\\])?'

    // Labels 933ms after the final click (2.133s − 1.2s in the recording).
    expect(css).toMatch(new RegExp(`\\.sf-icon\\.sf-late${v},\\s*\\.sf-title\\.sf-late${v} \\{[^}]*transition-delay: 933ms;`))
    // Perimeter draw: top 933 → right 1000 → bottom 1067 → left 1200.
    expect(css).toMatch(new RegExp(`\\.sf-frame-seg--top${v},\\s*\\.sf-frame-patch--tl${v} \\{[^}]*transition-delay: 933ms;`))
    expect(css).toMatch(new RegExp(`\\.sf-frame-seg--right${v},\\s*\\.sf-frame-patch--tr${v} \\{[^}]*transition-delay: 1000ms;`))
    expect(css).toMatch(new RegExp(`\\.sf-frame-seg--bottom${v},\\s*\\.sf-frame-patch--br${v} \\{[^}]*transition-delay: 1067ms;`))
    expect(css).toMatch(new RegExp(`\\.sf-frame-seg--left${v},\\s*\\.sf-frame-patch--bl${v} \\{[^}]*transition-delay: 1200ms;`))
    // Caption 1400ms after the final click (2.6s − 1.2s).
    expect(css).toMatch(new RegExp(`\\.sf-caption--late${v} \\{[^}]*transition-delay: 1400ms;`))
    // Hidden states still snap (backward-nav decision).
    expect(css).toMatch(new RegExp(`\\.sf-frame\\.slidev-vclick-hidden \\.sf-frame-seg${v},[\\s\\S]*?transition: none;`))
  })

  it('respects prefers-reduced-motion across every moving layer', () => {
    mountStackPanels(DARK_PROPS)
    const css = shippedCss()
    const v = '(\\[[^\\]]*\\])?'

    expect(css).toMatch(/@media \(prefers-reduced-motion: reduce\) \{[\s\S]*\.sf-panel--fade \.sf-band(\[[^\]]*\])?,[\s\S]*transition: none;[\s\S]*\}/)
    expect(css).toMatch(new RegExp(`@media \\(prefers-reduced-motion: reduce\\) \\{[\\s\\S]*?\\.sf-frame-seg${v},[\\s\\S]*?transition: none;[\\s\\S]*?\\}`))
  })
})
