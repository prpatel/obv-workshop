// @vitest-environment happy-dom
import { describe, expect, it, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import HexCluster from './HexCluster.vue'
import { hexLayout } from './stepflow/hex'
import type { HexNodeData } from './stepflow/hex'

/**
 * Slidev registers the v-click directive globally at runtime; the render tests
 * stub it as a no-op so the component mounts outside the deck (StepFlow.test.ts
 * pattern). Reveal behavior itself is dogfooded against the running dev server.
 */
function mountHexCluster(props: {
  nodes: HexNodeData[]
  palette?: Record<string, string>
  title?: string
  titleAccent?: string
}) {
  return mount(HexCluster, { props, global: { directives: { click: {} } } })
}

const NODES: HexNodeData[] = [
  { id: 'sources', title: 'SOURCES', caption: 'streams, lakes & warehouses', icon: 'database' },
  { id: 'models', title: 'TRANSFORM', caption: 'sql models compiled in git', icon: 'braces', tone: 'accent' },
  { id: 'agents', title: 'AI AGENTS', caption: 'agents act on trusted data', icon: 'bot', tone: 'tertiary' },
]

/** Pull the numeric value of a --sf-drawn custom property from a style attribute. */
function drawnPx(style: string | undefined): number {
  const match = /--sf-drawn:\s*([\d.]+)px/.exec(style ?? '')
  expect(match, `--sf-drawn missing in "${style}"`).toBeTruthy()
  return Number.parseFloat(match![1])
}

/**
 * Evaluate the shipped .sf-hex-fill stroke-dashoffset declaration for one cell
 * (vitest `css: true` compiles SFC <style> blocks into the document). Accepts
 * the calc() dash phase the binding ships.
 */
function dashOffsetPx(css: string, drawn: number, len: number): number {
  const rule = css.match(/\.sf-hex-fill[^{,]*\{[^}]*\}/)?.[0] ?? ''
  const decl = rule.match(/stroke-dashoffset:\s*([^;]+);/)?.[1] ?? ''
  expect(decl, `.sf-hex-fill must declare stroke-dashoffset; rule: "${rule}"`).toBeTruthy()
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

describe('HexCluster', () => {
  it('renders one dim base, one accent fill copy, and one content group per cell', () => {
    const wrapper = mountHexCluster({ nodes: NODES })

    expect(wrapper.find('svg.hexcluster').exists()).toBe(true)
    expect(wrapper.findAll('path.sf-hex-base')).toHaveLength(3)
    expect(wrapper.findAll('path.sf-hex-fill')).toHaveLength(3)
    expect(wrapper.findAll('.sf-hex-content')).toHaveLength(3)
  })

  it('exposes the measured canvas and an accessible name', () => {
    const wrapper = mountHexCluster({ nodes: NODES })
    const svg = wrapper.find('svg.hexcluster')

    expect(svg.attributes('viewBox')).toBe('0 0 1920 1080')
    expect(svg.attributes('role')).toBe('img')
    expect(svg.attributes('aria-label')).toBe('3-hex diagram')
  })

  it('renders each cell at its measured position with its title and caption', () => {
    const wrapper = mountHexCluster({ nodes: NODES })
    const layout = hexLayout(3)

    const titles = wrapper.findAll('text.title')
    expect(titles.map((t) => t.text())).toEqual(['SOURCES', 'TRANSFORM', 'AI AGENTS'])
    const captions = wrapper.findAll('text.caption')
    expect(captions).toHaveLength(3)

    // Inner content tracks its cell center (title baseline = cy + 0.30·R).
    expect(Number(titles[2].attributes('x'))).toBeCloseTo(layout.cells[2].cx, 4)
    expect(Number(titles[2].attributes('y'))).toBeCloseTo(layout.cells[2].cy + 0.3 * layout.hexR, 4)
  })

  it('pre-sets each fill copy to draw its complete outline on its click', () => {
    const wrapper = mountHexCluster({ nodes: NODES })
    const layout = hexLayout(3)

    const fills = wrapper.findAll('path.sf-hex-fill')
    fills.forEach((fill, i) => {
      expect(drawnPx(fill.attributes('style'))).toBeCloseTo(layout.cells[i].perimeter, 4)
    })
  })

  it('covers the full closed perimeter per cell — dashoffset ships the remaining phase', () => {
    // PR #8 regression pattern, applied per closed cell: a --sf-len dash at
    // offset o paints [0, len − o]; binding the offset to anything but
    // (len − drawn) leaves a grey arc on the revealed ring. With drawn = the
    // full perimeter, the revealed offset must be 0 — each ring paints whole.
    const wrapper = mountHexCluster({ nodes: NODES })
    const layout = hexLayout(3)
    const len = layout.cells[0].perimeter
    const drawn = wrapper.findAll('path.sf-hex-fill').map((fill) => drawnPx(fill.attributes('style')))

    const css = Array.from(document.querySelectorAll('style'))
      .map((tag) => tag.textContent ?? '')
      .join('\n')

    for (const d of drawn) {
      const paintedEnd = len - dashOffsetPx(css, d, len)
      expect(paintedEnd).toBeCloseTo(len, 4) // full ring, no shortfall
    }

    // Backward-nav snap must survive any change to the revealed phase.
    const hiddenRule = css.match(/\.sf-hex-fill\.slidev-vclick-hidden[^{]*\{[^}]*\}/)?.[0] ?? ''
    expect(hiddenRule).toContain('stroke-dashoffset: var(--sf-len)')
    expect(hiddenRule).toContain('transition: none')
  })

  it('snaps hidden content instantly and ships measured timings', () => {
    mountHexCluster({ nodes: NODES })

    const css = Array.from(document.querySelectorAll('style'))
      .map((tag) => tag.textContent ?? '')
      .join('\n')

    const contentHidden = css.match(/\.sf-hex-content\.slidev-vclick-hidden[^{]*\{[^}]*\}/)?.[0] ?? ''
    expect(contentHidden).toContain('transition: none')

    expect(css).toContain('300ms') // outline draw
    expect(css).toContain('120ms') // fill copy fade
    expect(css).toContain('150ms') // content fade
    expect(css).toContain('prefers-reduced-motion') // transitions disabled, instant state
  })

  it('renders the fallback icon and warns on an unknown icon key', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
    try {
      const nodes: HexNodeData[] = [{ ...NODES[0], icon: 'not-a-key' }]
      const wrapper = mountHexCluster({ nodes })

      expect(warn).toHaveBeenCalledWith(expect.stringContaining('not-a-key'))
      // ICON_FALLBACK (Lucide circle-help) geometry must be in the markup.
      expect(wrapper.find('.sf-hex-content .icon').html()).toContain('r="10"')
    } finally {
      warn.mockRestore()
    }
  })

  it('surfaces the geometry RangeError for 0 nodes instead of rendering blank', () => {
    expect(() => mountHexCluster({ nodes: [] })).toThrow(RangeError)
  })

  it('applies the chainBlue accent to outlines and titles over merged defaults', () => {
    const wrapper = mountHexCluster({ nodes: NODES, palette: { accent: '#349aea' } })
    const html = wrapper.html()

    expect(html).toContain('#349aea') // fills + titles + accent icons
    expect(html).toContain('#40424e') // dim base outlines stay the measured default
    expect(html).toContain('#a6a8ae') // captions stay the measured default
  })

  it('renders tertiary-tone icons in accentTertiary, falling back to the accent', () => {
    // With the field: the teal-green icon tone reaches the right cell only.
    const withTertiary = mountHexCluster({
      nodes: NODES,
      palette: { accent: '#349aea', accentTertiary: '#20c88c' },
    })
    const icons = withTertiary.findAll('.sf-hex-content .icon')
    expect(icons[0].attributes('stroke')).toBe('#349aea')
    expect(icons[1].attributes('stroke')).toBe('#349aea')
    expect(icons[2].attributes('stroke')).toBe('#20c88c')

    // Without it: 'tertiary' falls back to the accent (the resolvePalette contract).
    const without = mountHexCluster({ nodes: NODES, palette: { accent: '#349aea' } })
    const iconsFallback = without.findAll('.sf-hex-content .icon')
    expect(iconsFallback[2].attributes('stroke')).toBe('#349aea')
  })

  it('renders the two-tone header tail in chrome green only when titleAccent is set', () => {
    const accented = mountHexCluster({
      nodes: NODES,
      title: 'THE MODERN DATA STACK',
      titleAccent: 'AT A GLANCE',
    })
    const header = accented.find('text.header')
    expect(header.text()).toContain('THE MODERN DATA STACK')
    expect(header.text()).toContain('AT A GLANCE')
    expect(accented.html()).toContain('#66fb00')

    const plain = mountHexCluster({ nodes: NODES, title: 'THE MODERN DATA STACK' })
    expect(plain.html()).not.toContain('#66fb00')
  })
})
