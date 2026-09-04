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

// The demo seed mirrors the reference (THE DATA ENGINEERING LIFECYCLE): the
// geometry lives in stair.ts's measured rhythm now, so the seed carries only
// content + the two-tone split (blocks 1–3 blue, 4–6 cyan, sheet §1) through
// per-step `tone` roles and the slide's measured palette override.
const steps: StairStep[] = [
  { id: 'ingest', title: '01', caption: 'SOURCE SYSTEMS' },
  { id: 'transform', title: '02', caption: 'CLEAN + MODEL' },
  { id: 'retry', title: '03', caption: 'EXPECT FAILURE' },
  { id: 'quality', title: '04', tone: 'tertiary', caption: 'TESTS GATE DEPLOYS' },
  { id: 'serve', title: '05', tone: 'tertiary', caption: 'DASHBOARDS + APIS' },
  { id: 'govern', title: '06', tone: 'tertiary', caption: 'LINEAGE + ACCESS' },
]
// The measured two-tone palette the demo slide passes (sheet §1 medians), plus
// the callout amber pinned to the frame's #f4ba23 (chainBlue's #f7ba20 is the
// generic family accent).
const demoPalette = { accent: '#3599fb', accentTertiary: '#1fd0ea', accentAlt: '#f4ba23' }
const callout: StairCallout = { text: '3×', xFrac: 51 / 1920, yFrac: 568 / 1080, textLengthFrac: 85 / 1920 }

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

  it('renders circles at the measured rhythm — block 3 dips below block 2', () => {
    const wrapper = mountStairChain({ steps, callout })
    const blocks = wrapper.findAll('.sf-block')

    // ⌀146 circles: rx = ry = w/2 (the settled frame's corner arcs pin the
    // radius at half the bbox side — not the old 10.8px rounded square).
    const x0 = Number(blocks[0].attributes('x'))
    const y0 = Number(blocks[0].attributes('y'))
    expect(x0).toBeCloseTo(63, 6)
    expect(y0).toBeCloseTo(758, 6)
    expect(Number(blocks[0].attributes('rx'))).toBeCloseTo(73, 6)
    expect(Number(blocks[0].attributes('ry'))).toBeCloseTo(73, 6)

    // Measured lefts 63/395/719/1036/1351/1619, tops 758/693/734/612/538/465.
    const lefts = blocks.map((b) => Number(b.attributes('x')))
    const tops = blocks.map((b) => Number(b.attributes('y')))
    ;[63, 395, 719, 1036, 1351, 1619].forEach((left, i) => expect(lefts[i]).toBeCloseTo(left, 6))
    ;[758, 693, 734, 612, 538, 465].forEach((top, i) => expect(tops[i]).toBeCloseTo(top, 6))
    // The dip: block 3 sits numerically lower on screen than block 2.
    expect(tops[2]).toBeGreaterThan(tops[1])
  })

  it('punches the step numbers out of the fills in near-black at the measured caps', () => {
    const wrapper = mountStairChain({ steps, callout, palette: demoPalette })
    const punches = wrapper.findAll('.sf-punch')

    expect(punches).toHaveLength(6)
    expect(punches.map((t) => t.text())).toEqual(['01', '02', '03', '04', '05', '06'])

    const first = punches[0]
    // Cap 40 → font 40/0.730; pinned to the measured 69px ink width (spacing
    // only); centered on the circle; baseline 758 + 0.49·146 + 20.
    expect(Number(first.attributes('font-size'))).toBeCloseTo(40 / 0.730, 6)
    expect(Number(first.attributes('textLength'))).toBeCloseTo(69, 6)
    expect(first.attributes('lengthAdjust')).toBe('spacing')
    expect(Number(first.attributes('x'))).toBeCloseTo(63 + 73, 6)
    expect(Number(first.attributes('y'))).toBeCloseTo(758 + 0.49 * 146 + 20, 6)
    expect(first.attributes('fill')).toBe('#041628')

    // Cyan blocks punch in the cyan-side near-black.
    expect(punches[3].attributes('fill')).toBe('#011e23')
    // Per-block measured caps vary (42/66/56/66/66/59 native bands).
    expect(Number(punches[1].attributes('font-size'))).toBeCloseTo(62 / 0.730, 6)
    expect(Number(punches[2].attributes('font-size'))).toBeCloseTo(53 / 0.730, 6)
    expect(Number(punches[3].attributes('textLength'))).toBeCloseTo(50, 6)
  })

  it('renders two-tone left-aligned captions below the blocks', () => {
    const wrapper = mountStairChain({ steps, callout, palette: demoPalette })
    const captions = wrapper.findAll('.sf-caption')

    expect(captions[0].text()).toBe('SOURCE SYSTEMS')
    expect(captions[0].attributes('fill')).toBe('#356eae')
    expect(captions[3].attributes('fill')).toBe('#37c2d4')

    const first = wrapper.findAll('.sf-step')[0]
    const blockY = Number(first.find('.sf-block').attributes('y'))
    const blockH = Number(first.find('.sf-block').attributes('height'))
    const captionY = Number(captions[0].attributes('y'))
    // Baseline 40px below the block's bottom edge (measured +23px native top
    // + 19–20px cap band).
    expect(captionY).toBeCloseTo(blockY + blockH + 0.037 * 1080, 6)
    // Left-aligned ~2px left of the block's left edge, condensed advance.
    expect(Number(captions[0].attributes('x'))).toBeCloseTo(63 - 2, 6)
    expect(Number(captions[0].attributes('textLength'))).toBeCloseTo('SOURCE SYSTEMS'.length * 10.5, 6)
    expect(captions[0].attributes('text-anchor')).toBe('start')
    expect(wrapper.find('.sf-callout').text()).toBe('3×')
  })

  it('renders the amber 3× callout at the measured box', () => {
    const wrapper = mountStairChain({ steps, callout, palette: demoPalette })
    const calloutEl = wrapper.find('.sf-callout')

    expect(Number(calloutEl.attributes('x'))).toBeCloseTo(51, 6)
    expect(Number(calloutEl.attributes('y'))).toBeCloseTo(568, 6)
    expect(Number(calloutEl.attributes('font-size'))).toBeCloseTo(0.0557 * 1080, 6)
    expect(Number(calloutEl.attributes('textLength'))).toBeCloseTo(85, 6)
    expect(calloutEl.attributes('fill')).toBe('#f4ba23')
  })

  it('ships the chainBlue palette: blue blocks, amber callout, family-constant inks', () => {
    const wrapper = mountStairChain({ steps, callout })

    expect(wrapper.find('.sf-block').attributes('fill')).toBe(chainBlue.accent) // #349aea
    expect(wrapper.find('.sf-callout').attributes('fill')).toBe(chainBlue.accentAlt) // #f7ba20
    // Punches and captions are family constants, not palette roles.
    expect(wrapper.find('.sf-punch').attributes('fill')).toBe('#041628')
    expect(wrapper.find('.sf-caption').attributes('fill')).toBe('#356eae')
  })

  it('reflects a palette override on the blocks while inks stay family-constant', () => {
    const wrapper = mountStairChain({ steps, callout, palette: { accent: '#ff0000' } })
    const html = wrapper.html()

    expect(html).toContain('#ff0000') // override reaches blocks
    expect(html).toContain('#356eae') // caption ink stays the measured dim blue
    expect(html).toContain('#f7ba20') // chainBlue.accentAlt still colors the callout
  })

  it('splits the two-tone palette: blocks 1–3 blue, blocks 4–6 cyan (sheet §1)', () => {
    const wrapper = mountStairChain({ steps, callout, palette: demoPalette })
    const fills = wrapper.findAll('.sf-block').map((b) => b.attributes('fill'))

    expect(fills.slice(0, 3)).toEqual(['#3599fb', '#3599fb', '#3599fb'])
    expect(fills.slice(3)).toEqual(['#1fd0ea', '#1fd0ea', '#1fd0ea'])
  })

  it('falls the tertiary tone back to the palette accent when accentTertiary is absent', () => {
    const wrapper = mountStairChain({ steps, callout, palette: { accent: '#ff0000' } })

    // Every block — blue- and cyan-toned — renders the accent when the
    // palette defines no tertiary role (resolvePalette contract).
    const fills = wrapper.findAll('.sf-block').map((b) => b.attributes('fill'))
    expect(fills).toEqual(Array(6).fill('#ff0000'))
  })

  it('draws slate wedges beside blocks 1–5 (blue and cyan alike) and none beside block 6', () => {
    const wrapper = mountStairChain({ steps, callout, palette: demoPalette })
    const groups = wrapper.findAll('.sf-step')
    const wedges = wrapper.findAll('.sf-wedge')

    expect(wedges).toHaveLength(5)
    groups.slice(0, 5).forEach((group, i) => {
      const wedge = group.find('.sf-wedge')
      const block = group.find('.sf-block')
      const blockRight = Number(block.attributes('x')) + Number(block.attributes('width'))
      // Starts 0.05 block sizes past the right edge, fill #353743, blurred.
      expect(Number(wedge.attributes('x'))).toBeCloseTo(blockRight + Number(block.attributes('width')) * 0.05, 6)
      expect(wedge.attributes('fill')).toBe('#353743')
      expect(wedge.attributes('filter')).toBe('url(#sf-stair-wedge-blur)')
      // Shorter than the block — a band, not an offset copy.
      expect(Number(wedge.attributes('height'))).toBeLessThan(Number(block.attributes('height')))
      expect(i).toBeLessThan(5)
    })
    // Block 6: no wedge — the band would overflow the canvas edge.
    expect(groups[5].find('.sf-wedge').exists()).toBe(false)
  })

  it('marks the dip block for the down-then-up choreography', () => {
    const wrapper = mountStairChain({ steps, callout, palette: demoPalette })
    const groups = wrapper.findAll('.sf-step')

    // Block 3 (index 2) dips 41px below block 2 — the only dip site.
    expect(groups[2].classes()).toContain('sf-dip')
    expect(groups[1].classes()).not.toContain('sf-dip')
    expect(groups[3].classes()).not.toContain('sf-dip')
    expect(groups[2].attributes('style')).toContain('41px')
  })

  it('carries the measured timing constants and reduced-motion block in its styles', () => {
    mountStairChain({ steps, callout })

    const css = shippedCss()
    expect(css).toContain('450ms') // stagger in the measured 400–500ms band
    expect(css).toContain('250ms') // callout fade
    expect(css).toContain('sf-stair-dip') // down-then-up keyframes for block 3
    expect(css).not.toContain('80ms')
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

  it('renders the shared centered two-tone title chrome (sheet Title row: glyph core 78, white y49–126, ≈x916)', () => {
    const withAccent = mountStairChain({ steps, title: 'THE DATA ENGINEERING', titleAccent: 'LIFECYCLE' })
    const title = withAccent.find('.sf-chrome-title')
    expect(title.exists()).toBe(true)
    expect(title.text()).toContain('THE DATA ENGINEERING')
    expect(title.text()).toContain('LIFECYCLE')
    // Sheet-measured chrome: the sheet's y48–144 band is glow-inclusive; the
    // glyph core matches NodeEdge's (white y56.5–125.3) → cap 68.8 → font-size
    // 68.8/0.730, baseline y125.3, centered ≈x916.
    expect(Number(title.attributes('font-size'))).toBeCloseTo(68.8 / 0.730, 4)
    expect(Number(title.attributes('y'))).toBe(125.3)
    expect(Number(title.attributes('x'))).toBe(916)
    expect(withAccent.html()).toContain('#66fb00')

    const withoutAccent = mountStairChain({ steps, title: 'PLAIN HEADER' })
    expect(withoutAccent.html()).not.toContain('#66fb00')
  })

  it('surfaces the geometry RangeError for 0 steps instead of rendering blank', () => {
    expect(() => mountStairChain({ steps: [] })).toThrow(RangeError)
  })
})
