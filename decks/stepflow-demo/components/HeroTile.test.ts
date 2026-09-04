// @vitest-environment happy-dom
import { describe, expect, it, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import HeroTile from './HeroTile.vue'
import { titleFontSize, type TitleToken } from './stepflow/chrome'
import { heroTileLayout } from './stepflow/spine'

/**
 * Slidev registers the v-click directive globally at runtime; the render tests
 * stub it as a no-op so the component mounts outside the deck. Reveal behavior
 * itself is dogfooded against the running dev server (spike art_7Q2OtXCm).
 */
function mountTile(props: {
  icon?: string
  label?: string
  title?: string
  titleAccent?: string
  titleTokens?: TitleToken[]
}) {
  return mount(HeroTile, { props, global: { directives: { click: {} } } })
}

function documentCss(): string {
  return Array.from(document.querySelectorAll('style'))
    .map((tag) => tag.textContent ?? '')
    .join('\n')
}

describe('HeroTile', () => {
  it('renders a single one-click group: halo, tile, cutout, no label by default', () => {
    const wrapper = mountTile({})

    expect(wrapper.find('svg.hero-tile').exists()).toBe(true)
    expect(wrapper.findAll('.sf-hero')).toHaveLength(1) // the single v-click group
    expect(wrapper.findAll('.sf-hero-glow')).toHaveLength(1)
    expect(wrapper.findAll('.sf-hero-tile')).toHaveLength(1)
    expect(wrapper.findAll('.sf-hero-icon')).toHaveLength(1)
    expect(wrapper.findAll('.sf-hero-label')).toHaveLength(0)
  })

  it('renders the accent halo behind the tile with the measured falloff', () => {
    const wrapper = mountTile({})
    const glow = wrapper.find('.sf-hero-glow')

    expect(glow.attributes('cx')).toBe('914')
    expect(glow.attributes('cy')).toBe('700.5')
    expect(glow.attributes('r')).toBe('161.5') // 0.084114583333 × 1920 — dies ≈48px off the edge
    expect(glow.attributes('fill')).toBe('url(#sf-hero-glow-gradient)')
    // The halo derives from the family accent (orangeSpine verbatim) and holds
    // the measured plateau: ≈0.30 opacity to 0.703R, then a linear fade to 0.
    const gradient = wrapper.find('radialGradient').html()
    expect(gradient).toContain('#f85721')
    expect(gradient).toContain('stop-opacity="0.3"')
    expect(gradient).toContain('offset="0.703"')
    expect(gradient).toContain('stop-opacity="0"')
  })

  it('exposes the measured canvas and an accessible name', () => {
    const wrapper = mountTile({})
    const svg = wrapper.find('svg.hero-tile')

    expect(svg.attributes('viewBox')).toBe('0 0 1920 1080')
    expect(svg.attributes('role')).toBe('img')
    expect(svg.attributes('aria-label')).toBe('hero tile diagram')
  })

  it('places the measured 227px red square on the spine axis, below canvas center', () => {
    const wrapper = mountTile({})
    const tile = wrapper.find('.sf-hero-tile')
    const layout = heroTileLayout()

    // x800.5–1027.5, y587–814 (center 914, 700.5); rx 0.2423 × side ≈ 55.
    expect(tile.attributes('x')).toBe('800.5')
    expect(tile.attributes('y')).toBe('587')
    expect(tile.attributes('width')).toBe('227')
    expect(tile.attributes('height')).toBe('227')
    expect(tile.attributes('rx')).toBe('55.0021')
    // orangeSpine accent verbatim — the measured #f85721 tile color.
    expect(tile.attributes('fill')).toBe('#f85721')
    expect(layout.size).toBeCloseTo(227.0, 6)
  })

  it('renders the traced black cutout glyph by default (ring / bar / splayed legs)', () => {
    const wrapper = mountTile({})
    const icon = wrapper.find('.sf-hero-icon')

    // The v7 tile's cutout is the shared marker glyph fitted to its measured
    // ≈95×107.5 box centered on the tile — rendered black (cut to background).
    expect(icon.attributes('transform')).toBe(
      'translate(866.5 646.75) scale(1.0326 1.0804)',
    )
    expect(icon.attributes('color')).toBe('#000000')
    expect(icon.html()).toContain('r="23.75"') // the traced ring
  })

  it('renders a registry icon dark inside the tile when requested', () => {
    const wrapper = mountTile({ icon: 'user-round' })
    const icon = wrapper.find('.sf-hero-icon')

    // user-round head circle sits at cy=8 in Lucide space — registry markup, verbatim.
    expect(icon.html()).toContain('cx="12"')
    expect(icon.attributes('stroke')).toBe('#000000') // dark icon on the orange tile
  })

  it('renders the optional label beneath the tile and names it for a11y', () => {
    const wrapper = mountTile({ label: 'CHAPTER 3' })
    const label = wrapper.find('.sf-hero-label')

    expect(label.exists()).toBe(true)
    expect(label.text()).toBe('CHAPTER 3')
    expect(wrapper.find('svg.hero-tile').attributes('aria-label')).toBe('hero tile diagram: CHAPTER 3')
  })

  it('renders the fallback icon and warns on an unknown icon key', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
    try {
      const wrapper = mountTile({ icon: 'not-a-key' })

      expect(warn).toHaveBeenCalledWith(expect.stringContaining('not-a-key'))
      // ICON_FALLBACK (Lucide circle-help) geometry must be in the markup.
      expect(wrapper.find('.sf-hero-icon').html()).toContain('r="10"')
    } finally {
      warn.mockRestore()
    }
  })

  it('renders the sheet chrome band at the measured cap with no secondary line', () => {
    const wrapper = mountTile({ title: 'SECTION', titleAccent: 'DIVIDER' })
    const header = wrapper.find('.sf-chrome-title')

    // Sheet Title row: cap 70.8 in the band y55.7–126.5, centered ≈x912.
    // The subtitle prop is retired — the trace maps no secondary header line.
    expect(Number(header.attributes('font-size'))).toBeCloseTo(70.8 / 0.752, 4)
    expect(Number(header.attributes('y'))).toBe(126.5)
    expect(Number(header.attributes('x'))).toBe(912)
    expect(wrapper.find('.sf-hero-subtitle').exists()).toBe(false)
  })

  it('fits measured header tokens: white runs then green AI at the shared baseline', () => {
    const tokens: TitleToken[] = [
      { text: 'APIs,', x: 371.0, width: 241.2 },
      { text: 'cloud', x: 635.0, width: 197.5 },
      { text: 'systems,', x: 920.1, width: 413.4 },
      { text: 'AI', accent: true, x: 1353.2, width: 99.9 },
    ]
    const wrapper = mountTile({ titleTokens: tokens })
    const runs = wrapper.findAll('.sf-chrome-title')

    expect(runs).toHaveLength(4)
    // Tokens without per-token caps fall back to the chrome's measured band
    // (cap 70.8, baseline y126.5) — the slide-6 authoring shape.
    for (const run of runs) {
      expect(Number(run.attributes('font-size'))).toBeCloseTo(titleFontSize(70.8), 4)
      expect(Number(run.attributes('y'))).toBeCloseTo(126.5, 3)
      expect(run.attributes('lengthAdjust')).toBe('spacingAndGlyphs')
    }
    expect(runs[0].attributes('x')).toBe('371')
    expect(Number(runs[0].attributes('textLength'))).toBeCloseTo(241.2, 3)
    expect(runs[0].attributes('fill')).toBe('#ffffff')
    // The green AI tail closes the line at its measured extent.
    expect(runs[3].text()).toBe('AI')
    expect(runs[3].attributes('fill')).toBe('#66fb00')
    expect(runs[3].attributes('x')).toBe('1353.2')
    expect(Number(runs[3].attributes('textLength'))).toBeCloseTo(99.9, 3)
  })

  it('keeps the locked motion contract: pops forward, snaps backward, reduced-motion freezes', () => {
    mountTile({})
    const css = documentCss()

    // Hidden state: fully hidden + transition:none (backward nav snaps instantly).
    const hiddenRule = css.match(/\.sf-hero\.slidev-vclick-hidden[^{]*\{[^}]*\}/)?.[0] ?? ''
    expect(hiddenRule).toContain('opacity: 0')
    expect(hiddenRule).toContain('transition: none')

    // The tile pops from 60% scale — the StepFlow disc pattern.
    const tileHidden = css.match(/\.sf-hero\.slidev-vclick-hidden \.sf-hero-tile[^{]*\{[^}]*\}/)?.[0] ?? ''
    expect(tileHidden).toContain('scale(0.6)')
    expect(tileHidden).toContain('transition: none')

    expect(css).toContain('prefers-reduced-motion')
  })
})
