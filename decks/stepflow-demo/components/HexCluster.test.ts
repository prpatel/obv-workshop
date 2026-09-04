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
  legend?: string
  arrangement?: 'v' | 'row'
  geometry?: Record<string, number>
}) {
  return mount(HexCluster, { props, global: { directives: { click: {} } } })
}

const NODES: HexNodeData[] = [
  { id: 'sources', title: 'SOURCES', caption: 'streams, lakes & warehouses', icon: 'database' },
  { id: 'models', title: 'TRANSFORM', caption: 'sql models compiled in git', icon: 'braces', tone: 'accent' },
  { id: 'agents', title: 'AI AGENTS', caption: 'agents act on trusted data', icon: 'bot', tone: 'tertiary' },
]

/** Concatenate every compiled <style> block (vitest compiles SFC styles into the document). */
function compiledCss(): string {
  return Array.from(document.querySelectorAll('style'))
    .map((tag) => tag.textContent ?? '')
    .join('\n')
}

/** Pull one compiled CSS rule by selector prefix. */
function ruleFor(css: string, selector: string): string {
  const rule = css.match(new RegExp(`${selector}[^{]*\\{[^}]*\\}`))?.[0] ?? ''
  expect(rule, `missing rule for ${selector}`).toBeTruthy()
  return rule
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

    // Inner content tracks its cell center (title baseline = cy + 0.32·R,
    // the v5 recording's text row position).
    expect(Number(titles[2].attributes('x'))).toBeCloseTo(layout.cells[2].cx, 4)
    expect(Number(titles[2].attributes('y'))).toBeCloseTo(layout.cells[2].cy + 0.32 * layout.hexR, 4)
  })

  it('pops the outline in with a fast ease-out arrival — no dash mechanics', () => {
    // Fidelity rework: the v5 recording lands ~72% of final in one frame and
    // settles ~50ms (60fps walk) — a pop, not a 300ms stroke draw. The shipped
    // .sf-hex-fill rule must carry the 60ms ease-out opacity/scale transition
    // and carry NO stroke-dash mechanics at all.
    mountHexCluster({ nodes: NODES })
    const css = compiledCss()
    const fillRule = ruleFor(css, '\\.sf-hex-fill\\b')

    expect(fillRule).not.toContain('stroke-dash')
    expect(fillRule).not.toContain('--sf-drawn')
    expect(fillRule).toContain('60ms')
    expect(fillRule).toContain('cubic-bezier(0, 0, 0, 1)')
    expect(fillRule).toContain('opacity')
    expect(fillRule).toContain('transform')

    // The pop starts from ~72% scale, animating both channels together.
    const hidden = ruleFor(css, '\\.sf-hex-fill\\.slidev-vclick-hidden')
    expect(hidden).toContain('opacity: 0')
    expect(hidden).toContain('scale(0.72)')
    // Backward-nav snap must survive any change to the revealed timing.
    expect(hidden).toContain('transition: none')
  })

  it('snaps hidden content instantly and ships measured timings', () => {
    mountHexCluster({ nodes: NODES })

    const css = Array.from(document.querySelectorAll('style'))
      .map((tag) => tag.textContent ?? '')
      .join('\n')

    const contentHidden = css.match(/\.sf-hex-content\.slidev-vclick-hidden[^{]*\{[^}]*\}/)?.[0] ?? ''
    expect(contentHidden).toContain('transition: none')

    expect(css).toContain('60ms') // outline pop
    expect(css).toContain('150ms') // content fade
    expect(css).not.toContain('stroke-dash') // dash mechanics are gone
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

    expect(html).toContain('#349aea') // fills + tone-colored text + accent icons
    expect(html).toContain('#40424e') // dim base outlines stay the measured default
    expect(html).not.toContain('#a6a8ae') // no gray inside the cells — text rides the cell tone
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
    const header = accented.find('.sf-chrome-title')
    // Shared chrome: measured green glyph core y49–126 → cap 78 → font-size
    // 78/0.752, baseline 127, centered on the cluster axis.
    expect(Number(accented.find('.sf-chrome-title').attributes('font-size'))).toBeCloseTo(78 / 0.752, 4)
    expect(accented.find('.sf-chrome-title').attributes('text-anchor')).toBe('middle')
    expect(Number(accented.find('.sf-chrome-title').attributes('x'))).toBeCloseTo(960, 4)
    expect(Number(accented.find('.sf-chrome-title').attributes('y'))).toBe(127)
    expect(header.text()).toContain('THE MODERN DATA STACK')
    expect(header.text()).toContain('AT A GLANCE')
    expect(accented.html()).toContain('#66fb00')

    const plain = mountHexCluster({ nodes: NODES, title: 'THE MODERN DATA STACK' })
    expect(plain.html()).not.toContain('#66fb00')
  })

  it('renders the bottom chrome rule centered on the axis at the measured fractions', () => {
    // Fidelity rework: 67.8%w × ~6px at y 0.8944·h (the v5 recording's rule,
    // measured x 13.7–81.5%w, y 1023–1029 at native 1144 height).
    mountHexCluster({ nodes: NODES })
    const wrapper = mountHexCluster({ nodes: NODES })
    const rect = wrapper.find('rect.sf-hex-rule')
    expect(rect.attributes('fill')).toBe('#ffffff')
    expect(Number(rect.attributes('x'))).toBeCloseTo(960 - (0.678 * 1920) / 2, 4)
    expect(Number(rect.attributes('y'))).toBeCloseTo(0.8944 * 1080, 4)
    expect(Number(rect.attributes('width'))).toBeCloseTo(0.678 * 1920, 4)
    expect(Number(rect.attributes('height'))).toBeCloseTo(0.00556 * 1080, 4)
  })

  it('renders the amber legend above the center column only when set', () => {
    const layout = hexLayout(3)
    const withLegend = mountHexCluster({ nodes: NODES, legend: '01' })
    const legend = withLegend.find('text.legend')
    expect(legend.text()).toBe('01')
    expect(legend.attributes('fill')).toBe('#ebb92a') // the v5 recording's measured amber
    // Anchored above the middle column's top vertex (measured gap 71/1144);
    // for the default V that column is the bottom cell (cx = axisX).
    expect(Number(legend.attributes('y'))).toBeCloseTo(
      layout.cells[2].cy - layout.hexR - 0.062 * 1080,
      4,
    )

    const plain = mountHexCluster({ nodes: NODES })
    expect(plain.find('text.legend').exists()).toBe(false)
  })

  it('ships the settled row composition from the recording re-flow', () => {
    // The v5 recording builds the V, then re-flows to one row: centers
    // 24.8/47.5/70.3%w, cy 0.603·h. The demo slide ships those fractions as
    // overrides; the component must render the row at them.
    const geometry = { centerXFrac: 0.475, pitchXFrac: 0.2275, topFrac: 0.603 }
    const layout = hexLayout(3, 'row', geometry)
    const wrapper = mountHexCluster({ nodes: NODES, title: 'MODERN DATA STACK', arrangement: 'row', geometry })

    const titles = wrapper.findAll('text.title')
    titles.forEach((title, i) => {
      expect(Number(title.attributes('x'))).toBeCloseTo(layout.cells[i].cx, 4)
      expect(Number(title.attributes('x'))).toBeCloseTo(912 + (i - 1) * 0.2275 * 1920, 4)
      expect(Number(title.attributes('y'))).toBeCloseTo(0.603 * 1080 + 0.32 * layout.hexR, 4)
    })
    // Chrome centers on the (off-center) axis, not the canvas.
    expect(Number(wrapper.find('.sf-chrome-title').attributes('x'))).toBeCloseTo(912, 4)
    expect(Number(wrapper.find('rect.sf-hex-rule').attributes('x'))).toBeCloseTo(912 - (0.678 * 1920) / 2, 4)
  })

  it('renders multi-row captions from \\n breaks as separate text rows', () => {
    const nodes: HexNodeData[] = [
      { id: 'sources', title: 'SOURCES', caption: 'streams, lakes\n& warehouses', icon: 'database' },
      { id: 'models', title: 'TRANSFORM', caption: 'sql models\ncompiled in git', icon: 'braces' },
      { id: 'agents', title: 'AI AGENTS', caption: 'agents act on\ntrusted data', icon: 'bot' },
    ]
    const wrapper = mountHexCluster({ nodes })

    const captions = wrapper.findAll('text.caption')
    expect(captions).toHaveLength(6) // two rows per cell
    expect(captions[0].text()).toBe('streams, lakes')
    expect(captions[1].text()).toBe('& warehouses')
    // Rows pitch 0.21·R apart below the title baseline.
    const layout = hexLayout(3)
    expect(Number(captions[0].attributes('y'))).toBeCloseTo(layout.cells[0].cy + 0.53 * layout.hexR, 4)
    expect(Number(captions[1].attributes('y'))).toBeCloseTo(layout.cells[0].cy + 0.74 * layout.hexR, 4)
  })
})
