// @vitest-environment happy-dom
import { describe, expect, it } from 'vitest'
import { mount } from '@vue/test-utils'
import type { DirectiveBinding } from 'vue'
import StairChain from './StairChain.vue'
import { chainBlue } from './stepflow/palettes'
import { SEG01_PLACEMENT, type StairAnnotation, type StairCallout, type StairPlacement, type StairStep } from './stepflow/stair'

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
  placement?: StairPlacement
  annotations?: StairAnnotation[]
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

  it('renders the quiet glow trace: one hue-matched segment per block past the first', () => {
    const wrapper = mountStairChain({ steps, callout, palette: demoPalette })
    const traces = wrapper.findAll('.sf-glow-trace')

    // Block 0 has no predecessor; blocks 2-6 trace from their left neighbor.
    expect(traces).toHaveLength(5)
    expect(traces[0].attributes('d')).toBe('M 136 758 L 468 693')
    // Hue-matched: the segment into block k carries block k's tone fill — the
    // two-tone split makes trace k blue while k+1 is blue, cyan from block 4 on.
    const fills = traces.map((t) => t.attributes('stroke'))
    expect(fills).toEqual(['#3599fb', '#3599fb', '#1fd0ea', '#1fd0ea', '#1fd0ea'])
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
    // Glow trace draws inside the block's existing 450ms window, quiet by
    // design: 3px stroke (≤4) at 0.4 opacity (≤0.4), hue-matched per block.
    expect(css).toContain('.sf-glow-trace')
    expect(css).toContain('stroke-width: 3px')
    expect(css).toContain('opacity: 0.4')
    expect(css).toContain('stroke-dashoffset: var(--sf-len)')
    expect(css).toContain('.sf-step:not(.slidev-vclick-hidden) .sf-glow-trace')
    // The trace joins the reduced-motion freeze list.
    const reduced = css.match(/@media \(prefers-reduced-motion: reduce\)[\s\S]*$/)?.[0] ?? ''
    expect(reduced).toContain('.sf-glow-trace')
    expect(css).toContain('prefers-reduced-motion') // transitions disabled, instant state
  })

  it('keeps the backward-nav snap: hidden state ships transition none', () => {
    mountStairChain({ steps, callout })

    const css = shippedCss()
    const hiddenRule = css.match(/\.sf-step\.slidev-vclick-hidden[^{]*\{[^}]*\}/)?.[0] ?? ''
    expect(hiddenRule).toContain('transition: none')
    const calloutHidden = css.match(/\.sf-callout\.slidev-vclick-hidden[^{]*\{[^}]*\}/)?.[0] ?? ''
    expect(calloutHidden).toContain('transition: none')
    // The glow trace snaps with its block on backward navigation.
    const traceHidden = css.match(/\.sf-step\.slidev-vclick-hidden \.sf-glow-trace[\s\S]*?\}/)?.[0] ?? ''
    expect(traceHidden).toContain('transition: none')
  })

  it('renders the shared centered two-tone title chrome (settled seg01 re-measure: cap 56, y102–158, ≈x961)', () => {
    const withAccent = mountStairChain({ steps, title: 'THE DATA ENGINEERING', titleAccent: 'LIFECYCLE' })
    const title = withAccent.find('.sf-chrome-title')
    expect(title.exists()).toBe(true)
    expect(title.text()).toContain('THE DATA ENGINEERING')
    expect(title.text()).toContain('LIFECYCLE')
    // Settled-frame re-measure (restart seg01 reference): ink y102–158,
    // cap 56 → font-size 56/0.730, baseline y158, centered ≈x961 — the
    // v1-era sheet band (y56.5–125.3, cap 68.8, ≈x916) does not match
    // this reference.
    expect(Number(title.attributes('font-size'))).toBeCloseTo(56 / 0.730, 4)
    expect(Number(title.attributes('y'))).toBe(158)
    expect(Number(title.attributes('x'))).toBe(961)
    expect(withAccent.html()).toContain('#66fb00')

    const withoutAccent = mountStairChain({ steps, title: 'PLAIN HEADER' })
    expect(withoutAccent.html()).not.toContain('#66fb00')
  })

  it('surfaces the geometry RangeError for 0 steps instead of rendering blank', () => {
    expect(() => mountStairChain({ steps: [] })).toThrow(RangeError)
  })

  it('surfaces a placement RangeError instead of rendering a mis-layout', () => {
    expect(() => mountStairChain({ steps, placement: { leftsFrac: [0.1] } })).toThrow(RangeError)
  })
})

describe('StairChain — seg01 additive opts', () => {
  it('explicit placement reaches the blocks: seg01 measured fractions, not the gen-7 walk', () => {
    const wrapper = mountStairChain({ steps, placement: SEG01_PLACEMENT })
    const blocks = wrapper.findAll('.sf-block')

    expect(Number(blocks[0].attributes('x'))).toBeCloseTo(0.1391 * 1920, 6)
    expect(Number(blocks[0].attributes('y'))).toBeCloseTo(0.625 * 1080, 6)
    expect(Number(blocks[0].attributes('width'))).toBeCloseTo(0.1085 * 1080, 6)
    // The measured dip survives: block 3 sits below block 2 (0.6062 vs 0.5757).
    const tops = blocks.map((b) => Number(b.attributes('y')))
    expect(tops[2]).toBeGreaterThan(tops[1])
  })

  it('a per-step click override remaps the reveal without touching geometry', () => {
    // seg01's draft interleaved mapping: the build alternates blue/cyan
    // (b1 c1 b2 c2 b3 c3 → clicks 2…7) while the array stays positional —
    // geometry follows array order, only the click remaps.
    const interleaved: StairStep[] = steps.map((step, i) => ({
      ...step,
      click: [2, 4, 6, 3, 5, 7][i],
    }))
    const { clicks } = mountRecordingClicks({ steps: interleaved, callout })

    // The recording stub records in MOUNT order: blocks (array order, override
    // applied per step), then the callout. Choreography order is the binding
    // values, not the mount order — callout=1 still reveals first.
    expect(clicks.slice(0, 6)).toEqual([2, 4, 6, 3, 5, 7])
    expect(clicks[6]).toBe(1)
    expect([...clicks].sort((a, b) => a - b)).toEqual([1, 2, 3, 4, 5, 6, 7])
  })

  it('steps without an override keep the positional walk alongside overridden siblings', () => {
    const mixed: StairStep[] = steps.map((step, i) => (i === 2 ? { ...step, click: 9 } : step))
    const { clicks } = mountRecordingClicks({ steps: mixed, callout })

    // Mount order: blocks in array order with only index 2 overridden (2, 3,
    // 9, 5, 6, 7), then the callout's positional 1.
    expect(clicks).toEqual([2, 3, 9, 5, 6, 7, 1])
  })

  it('renders late annotation waves: teal marks at their measured boxes, white text at baselines', () => {
    const annotations: StairAnnotation[] = [
      { id: 'mark-1', xFrac: 0.8234, yFrac: 0.5097, wFrac: 0.0184, hFrac: 0.0042, click: 8 },
      { id: 'text-1', xFrac: 0.555, yFrac: 0.58, text: 'DAG', click: 8 },
    ]
    const wrapper = mountStairChain({ steps, annotations })
    const marks = wrapper.findAll('.sf-annotation-mark')
    const texts = wrapper.findAll('.sf-annotation-text')

    expect(marks).toHaveLength(1)
    expect(texts).toHaveLength(1)
    expect(Number(marks[0].attributes('x'))).toBeCloseTo(0.8234 * 1920, 6)
    expect(Number(marks[0].attributes('y'))).toBeCloseTo(0.5097 * 1080, 6)
    expect(Number(marks[0].attributes('width'))).toBeCloseTo(0.0184 * 1920, 6)
    expect(Number(marks[0].attributes('height'))).toBeCloseTo(0.0042 * 1080, 6)
    expect(marks[0].attributes('fill')).toBe('#2ac9d6')

    expect(texts[0].text()).toBe('DAG')
    expect(Number(texts[0].attributes('y'))).toBeCloseTo(0.58 * 1080, 6) // baseline
    expect(texts[0].attributes('fill')).toBe('#f5f4f7')
    // Unspecified text size falls back to the measured caption size.
    expect(Number(texts[0].attributes('font-size'))).toBeCloseTo(0.023 * 1080, 6)
  })

  it('each annotation joins the click choreography at its own beat', () => {
    const annotations: StairAnnotation[] = [
      { id: 'w1', xFrac: 0.56, yFrac: 0.52, wFrac: 0.01, hFrac: 0.02, click: 8 },
      { id: 'w2', xFrac: 0.7, yFrac: 0.59, wFrac: 0.01, hFrac: 0.02, click: 9 },
      { id: 'w3', xFrac: 0.82, yFrac: 0.51, wFrac: 0.018, hFrac: 0.005, click: 10 },
    ]
    const { clicks } = mountRecordingClicks({ steps, callout, annotations })

    // Mount order: blocks (2…7), then the annotation beats 8/9/10 in array
    // order, then the callout. Sorted, the choreography owns 10 distinct beats.
    expect(clicks).toHaveLength(10)
    expect(clicks.slice(6, 9)).toEqual([8, 9, 10])
    expect([...clicks].sort((a, b) => a - b)).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9, 10])
  })

  it('annotations join the reduced-motion freeze and snap on backward nav', () => {
    mountStairChain({
      steps,
      annotations: [{ id: 'm', xFrac: 0.5, yFrac: 0.5, wFrac: 0.01, hFrac: 0.01, click: 8 }],
    })

    const css = shippedCss()
    const hiddenRule = css.match(/\.sf-annotation\.slidev-vclick-hidden[^{]*\{[^}]*\}/)?.[0] ?? ''
    expect(hiddenRule).toContain('transition: none')
    const reduced = css.match(/@media \(prefers-reduced-motion: reduce\)[\s\S]*$/)?.[0] ?? ''
    expect(reduced).toContain('.sf-annotation')
  })
})
