// @vitest-environment happy-dom
import { describe, expect, it, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import HeroTile from './HeroTile.vue'
import { heroTileLayout } from './stepflow/spine'

/**
 * Slidev registers the v-click directive globally at runtime; the render tests
 * stub it as a no-op so the component mounts outside the deck. Reveal behavior
 * itself is dogfooded against the running dev server (spike art_7Q2OtXCm).
 */
function mountTile(props: {
  icon: string
  label?: string
  title?: string
  titleAccent?: string
  subtitle?: string
}) {
  return mount(HeroTile, { props, global: { directives: { click: {} } } })
}

function documentCss(): string {
  return Array.from(document.querySelectorAll('style'))
    .map((tag) => tag.textContent ?? '')
    .join('\n')
}

describe('HeroTile', () => {
  it('renders a single one-click group: halo, tile, icon, no label by default', () => {
    const wrapper = mountTile({ icon: 'user-round' })

    expect(wrapper.find('svg.hero-tile').exists()).toBe(true)
    expect(wrapper.findAll('.sf-hero')).toHaveLength(1) // the single v-click group
    expect(wrapper.findAll('.sf-hero-glow')).toHaveLength(1)
    expect(wrapper.findAll('.sf-hero-tile')).toHaveLength(1)
    expect(wrapper.findAll('.sf-hero-icon')).toHaveLength(1)
    expect(wrapper.findAll('.sf-hero-label')).toHaveLength(0)
  })

  it('renders the accent halo behind the tile with the measured tight radius', () => {
    const wrapper = mountTile({ icon: 'user-round' })
    const glow = wrapper.find('.sf-hero-glow')

    expect(glow.attributes('cx')).toBe('913.92')
    expect(glow.attributes('cy')).toBe('700.92')
    expect(glow.attributes('r')).toBe('156.096') // 0.0813 × 1920 — ink dies by ≈1.34 × tile half
    expect(glow.attributes('fill')).toBe('url(#sf-hero-glow-gradient)')
    // The halo derives from the family accent (orangeSpine verbatim).
    expect(wrapper.find('radialGradient').html()).toContain('#f85721')
  })

  it('exposes the measured canvas and an accessible name', () => {
    const wrapper = mountTile({ icon: 'user-round' })
    const svg = wrapper.find('svg.hero-tile')

    expect(svg.attributes('viewBox')).toBe('0 0 1920 1080')
    expect(svg.attributes('role')).toBe('img')
    expect(svg.attributes('aria-label')).toBe('hero tile diagram')
  })

  it('places the measured 12%w orange square on the spine axis, below canvas center', () => {
    const wrapper = mountTile({ icon: 'user-round' })
    const tile = wrapper.find('.sf-hero-tile')
    const layout = heroTileLayout()

    // Hand-computed: x = 913.92 − 230.4/2, y = 700.92 − 230.4/2, rx = 0.1 × side.
    expect(tile.attributes('x')).toBe('798.72')
    expect(tile.attributes('y')).toBe('585.72')
    expect(tile.attributes('width')).toBe('230.4')
    expect(tile.attributes('height')).toBe('230.4')
    expect(tile.attributes('rx')).toBe('23.04')
    // orangeSpine accent verbatim — the measured #f85721 tile color.
    expect(tile.attributes('fill')).toBe('#f85721')
    expect(layout.size).toBeCloseTo(230.4, 6)
  })

  it('renders the dark icon from the registry', () => {
    const wrapper = mountTile({ icon: 'user-round' })
    const icon = wrapper.find('.sf-hero-icon')

    // user-round head circle sits at cy=8 in Lucide space — registry markup, verbatim.
    expect(icon.html()).toContain('cx="12"')
    expect(icon.attributes('stroke')).toBe('#000000') // dark icon on the orange tile
  })

  it('renders the optional label beneath the tile and names it for a11y', () => {
    const wrapper = mountTile({ icon: 'user-round', label: 'CHAPTER 3' })
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

  it('renders the titleAccent tail in chrome green (convention constant, not a palette field)', () => {
    const wrapper = mountTile({ icon: 'user-round', title: 'SECTION', titleAccent: 'DIVIDER' })
    const header = wrapper.find('.sf-hero-header')

    expect(header.exists()).toBe(true)
    expect(header.html()).toContain('#66fb00')
    expect(header.text()).toContain('SECTION')
    expect(header.text()).toContain('DIVIDER')
  })

  it('scales the header to recording size and renders the secondary white line', () => {
    const wrapper = mountTile({
      icon: 'user-round',
      title: 'SECTION',
      titleAccent: 'DIVIDER',
      subtitle: 'STEPFLOW HOUSE STYLE',
    })
    const header = wrapper.find('.sf-hero-header')

    // Report §2 chrome rule 4: primary header at recording scale (ref block
    // y 0.056–0.119h); secondary line ~40px at 1080 beneath it.
    expect(header.attributes('font-size')).toBe('91.8') // 0.085 × 1080
    expect(header.attributes('y')).toBe('127.44') // 0.118 × 1080 baseline

    const subtitle = wrapper.find('.sf-hero-subtitle')
    expect(subtitle.exists()).toBe(true)
    expect(subtitle.text()).toBe('STEPFLOW HOUSE STYLE')
    expect(subtitle.attributes('font-size')).toBe('40')
    expect(subtitle.attributes('y')).toBe('227.88') // (0.118 + 0.093) × 1080
  })

  it('omits the secondary header line when no subtitle is passed', () => {
    const wrapper = mountTile({ icon: 'user-round', title: 'SECTION' })

    expect(wrapper.find('.sf-hero-subtitle').exists()).toBe(false)
  })

  it('keeps the locked motion contract: pops forward, snaps backward, reduced-motion freezes', () => {
    mountTile({ icon: 'user-round' })
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
