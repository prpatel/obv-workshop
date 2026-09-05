// @vitest-environment happy-dom
import { describe, expect, it } from 'vitest'
import { mount } from '@vue/test-utils'
import type { DirectiveBinding } from 'vue'
import StairChain from './StairChain.vue'
import { SEG01_CAPTIONS, SEG01_INK, SEG01_PLACEMENT, SEG01_WEDGES, type StairPlacement, type StairStep } from './stepflow/stair'
import { chainBlue } from './stepflow/palettes'

/**
 * Slidev registers the v-click directive globally at runtime; the render tests
 * stub it. The recording stub captures each binding value so the click
 * choreography itself is asserted (7 clicks: the amber '01' marker, then the
 * six blocks); reveal rendering is dogfooded against the running dev server
 * (spike art_7Q2OtXCm).
 */
type StairChainProps = {
  steps: StairStep[]
  palette?: Record<string, string>
  placement?: StairPlacement
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

// The demo seed mirrors the settled frame: content only — geometry is stair.ts's
// measured SEG01 placement, ink is SEG01_INK's traced paths, and the two-tone
// split (blocks 1–3 blue, 4–6 cyan) rides per-step `tone` roles through the
// slide's measured palette override.
const steps: StairStep[] = [
  { id: 'ingest', caption: 'PIPELINES' },
  { id: 'transform', caption: 'WAREHOUSE' },
  { id: 'retry', caption: 'DATASETS' },
  { id: 'quality', tone: 'tertiary', caption: 'GIT' },
  { id: 'serve', tone: 'tertiary', caption: 'TESTS' },
  { id: 'govern', tone: 'tertiary', caption: 'CI/CD' },
]
const demoPalette = { accent: '#3799fb', accentTertiary: '#1fd0ea' }

function shippedCss(): string {
  return Array.from(document.querySelectorAll('style'))
    .map((tag) => tag.textContent ?? '')
    .join('\n')
}

describe('StairChain', () => {
  it('owns 7 clicks: the traced marker first, then one per block', () => {
    const { clicks } = mountRecordingClicks({ steps })

    expect(clicks).toHaveLength(7)
    expect([...clicks].sort((a, b) => a - b)).toEqual([1, 2, 3, 4, 5, 6, 7])
    // The marker is click 1; blocks take clicks 2…7 left → right (the
    // onsets.json beat map 0.2 / 0.533 / 0.8 / 1.067 / 2.067 / 2.733 / 3.133).
    expect(clicks.filter((c) => c !== 1)).toHaveLength(6)
    expect(clicks).toContain(1)
  })

  it('honors per-step click overrides ahead of the positional default', () => {
    const shifted: StairStep[] = steps.map((step, i) => ({ ...step, click: i + 3 }))
    const { clicks } = mountRecordingClicks({ steps: shifted })

    expect(clicks.filter((c) => c !== 1)).toEqual([3, 4, 5, 6, 7, 8])
  })

  it('renders one group per block over the measured canvas with an accessible name', () => {
    const wrapper = mountStairChain({ steps })

    expect(wrapper.find('svg.stairchain').exists()).toBe(true)
    expect(wrapper.findAll('.sf-step')).toHaveLength(6)
    expect(wrapper.findAll('.sf-block')).toHaveLength(6)
    expect(wrapper.findAll('.sf-icon')).toHaveLength(6)

    const svg = wrapper.find('svg.stairchain')
    expect(svg.attributes('viewBox')).toBe('0 0 1920 1080')
    expect(svg.attributes('role')).toBe('img')
    expect(svg.attributes('aria-label')).toBe('6-step staircase diagram')
  })

  it('renders circles at the measured seg01 placement — block 3 dips below block 2', () => {
    const wrapper = mountStairChain({ steps })
    const blocks = wrapper.findAll('.sf-block')

    // ⌀117 circles: rx = ry = w/2. Measured lefts 267/538/802/1059/1317/1535
    // and tops 675/623/656/557/497/438 on the 1920×1080 canvas.
    const lefts = blocks.map((b) => Number(b.attributes('x')))
    const tops = blocks.map((b) => Number(b.attributes('y')))
    SEG01_PLACEMENT.leftsFrac!.forEach((frac, i) => expect(lefts[i]).toBeCloseTo(frac * 1920, 6))
    SEG01_PLACEMENT.topsFrac!.forEach((frac, i) => expect(tops[i]).toBeCloseTo(frac * 1080, 6))
    expect(Number(blocks[0].attributes('width'))).toBeCloseTo(117, 6)
    expect(Number(blocks[0].attributes('rx'))).toBeCloseTo(58.5, 6)
    expect(Number(blocks[0].attributes('ry'))).toBeCloseTo(58.5, 6)
    // The dip: block 3 sits numerically lower on screen than block 2.
    expect(tops[2]).toBeGreaterThan(tops[1])
  })

  it('renders the traced ink set: two-tone title, olive badge, amber 01, six dark icons', () => {
    const wrapper = mountStairChain({ steps, palette: demoPalette })

    // Title + badge are static plate ink — no v-click stub ever bound to them.
    expect(wrapper.find('.sf-title-white').attributes('fill')).toBe('#f4f4f6')
    expect(wrapper.find('.sf-title-green').attributes('fill')).toBe('#66f605')
    expect(wrapper.find('.sf-title-white').attributes('d')).toBe(SEG01_INK.titleWhite.d)
    expect(wrapper.find('.sf-badge').attributes('fill')).toBe('#859e4e')

    // The marker is the traced amber '01' on click 1.
    const marker = wrapper.find('.sf-marker path')
    expect(marker.attributes('fill')).toBe('#eab72a')
    expect(marker.attributes('d')).toBe(SEG01_INK.amber01.d)

    // The icons are the traced dark glyphs punched into the fills.
    const icons = wrapper.findAll('.sf-icon')
    icons.forEach((icon) => expect(icon.attributes('fill')).toBe('#02050d'))
    icons.forEach((icon, i) => expect(icon.attributes('d')).toBe(SEG01_INK.icons[i]!.d))
  })

  it('renders block-tinted centered captions pinned to the measured advance', () => {
    const wrapper = mountStairChain({ steps })
    const captions = wrapper.findAll('.sf-caption')

    expect(captions[0].text()).toBe('PIPELINES')
    expect(captions[0].attributes('fill')).toBe(SEG01_CAPTIONS.blue)
    expect(captions[3].attributes('fill')).toBe(SEG01_CAPTIONS.cyan)

    const firstGroup = wrapper.findAll('.sf-step')[0]
    const blockY = Number(firstGroup.find('.sf-block').attributes('y'))
    const blockH = Number(firstGroup.find('.sf-block').attributes('height'))
    const blockX = Number(firstGroup.find('.sf-block').attributes('x'))
    const blockW = Number(firstGroup.find('.sf-block').attributes('width'))
    // Centered under the block, baseline at the measured gap below the
    // bottom edge.
    expect(Number(captions[0].attributes('x'))).toBeCloseTo(blockX + blockW / 2, 6)
    expect(captions[0].attributes('text-anchor')).toBe('middle')
    expect(Number(captions[0].attributes('y'))).toBeCloseTo(blockY + blockH + SEG01_CAPTIONS.gapPx, 6)
    expect(Number(captions[0].attributes('font-size'))).toBeCloseTo(SEG01_CAPTIONS.sizeFrac * 1080, 6)
    // Ink pinned to the settled extent exactly — the component applies the
    // measured extent as a spacing-only textLength without the shared 2%
    // threshold, because the settled frame wants the measured extents even
    // when the natural run lands within it.
    expect(Number(captions[0].attributes('textLength'))).toBeCloseTo(SEG01_CAPTIONS.textLengthsPx[0]!, 6)
    expect(captions[0].attributes('lengthAdjust')).toBe('spacing')
  })

  it('splits the two-tone palette: blocks 1–3 blue, blocks 4–6 cyan (settled medians)', () => {
    const wrapper = mountStairChain({ steps, palette: demoPalette })
    const fills = wrapper.findAll('.sf-block').map((b) => b.attributes('fill'))

    expect(fills.slice(0, 3)).toEqual(['#3799fb', '#3799fb', '#3799fb'])
    expect(fills.slice(3)).toEqual(['#1fd0ea', '#1fd0ea', '#1fd0ea'])
  })

  it('falls the tertiary tone back to the palette accent when accentTertiary is absent', () => {
    const wrapper = mountStairChain({ steps, palette: { accent: '#ff0000' } })

    // Every block — blue- and cyan-toned — renders the accent when the
    // palette defines no tertiary role (resolvePalette contract).
    const fills = wrapper.findAll('.sf-block').map((b) => b.attributes('fill'))
    expect(fills).toEqual(Array(6).fill('#ff0000'))
    // Captions stay the measured block-tinted inks (family constants).
    expect(wrapper.findAll('.sf-caption')[0].attributes('fill')).toBe(SEG01_CAPTIONS.blue)
  })

  it('ships the chainBlue preset when no override is passed', () => {
    const wrapper = mountStairChain({ steps })

    expect(wrapper.find('.sf-block').attributes('fill')).toBe(chainBlue.accent)
  })

  it('draws the measured slate wedges beside blocks 1–5 and none beside block 6', () => {
    const wrapper = mountStairChain({ steps, palette: demoPalette })
    const groups = wrapper.findAll('.sf-step')
    const wedges = wrapper.findAll('.sf-wedge')

    expect(wedges).toHaveLength(5)
    // Band 1 is the measured settled-frame rect: x394–527, y682–733.
    const first = groups[0].find('.sf-wedge')
    expect(Number(first.attributes('x'))).toBeCloseTo(SEG01_WEDGES[0]!.xFrac * 1920, 6)
    expect(Number(first.attributes('y'))).toBeCloseTo(SEG01_WEDGES[0]!.yFrac * 1080, 6)
    expect(Number(first.attributes('width'))).toBeCloseTo(SEG01_WEDGES[0]!.wFrac * 1920, 6)
    expect(Number(first.attributes('height'))).toBeCloseTo(SEG01_WEDGES[0]!.hFrac * 1080, 6)
    expect(first.attributes('fill')).toBe('#353743')
    expect(first.attributes('filter')).toBe('url(#sf-stair-wedge-blur)')
    // Block 6: no wedge — the settled frame shows none.
    expect(groups[5].find('.sf-wedge').exists()).toBe(false)
  })

  it('marks the dip block with the measured dip distance custom property', () => {
    const wrapper = mountStairChain({ steps })
    const groups = wrapper.findAll('.sf-step')

    // Block 3 dips 33px below block 2 in the settled frame.
    expect(groups[2].classes()).toContain('sf-dip')
    expect(groups[2].attributes('style')).toContain('--sf-dip: 33px')
    expect(groups[1].classes()).not.toContain('sf-dip')
    expect(groups[5].classes()).not.toContain('sf-dip')
  })

  it('renders no removed contract elements: no glow trace, callout, punch, or annotations', () => {
    const wrapper = mountStairChain({ steps })

    // The user directive dropped the glow-trace connector (the reference has
    // no connector); the callout/punch/annotation elements predate the
    // settled-truth rebuild and no longer exist in the component.
    expect(wrapper.find('.sf-glow-trace').exists()).toBe(false)
    expect(wrapper.find('.sf-callout').exists()).toBe(false)
    expect(wrapper.find('.sf-punch').exists()).toBe(false)
    expect(wrapper.find('.sf-annotation').exists()).toBe(false)
    expect(wrapper.find('line').exists()).toBe(false)
    expect(wrapper.find('polyline').exists()).toBe(false)
  })

  it('rescales a custom canvas placement through to the rendered geometry', () => {
    const wrapper = mountStairChain({
      steps,
      placement: {
        blockFrac: SEG01_PLACEMENT.blockFrac,
        leftsFrac: SEG01_PLACEMENT.leftsFrac,
        topsFrac: SEG01_PLACEMENT.topsFrac,
        width: 1280,
        height: 720,
      },
    })

    expect(wrapper.find('svg.stairchain').attributes('viewBox')).toBe('0 0 1280 720')
    const first = wrapper.find('.sf-block')
    expect(Number(first.attributes('x'))).toBeCloseTo(SEG01_PLACEMENT.leftsFrac![0]! * 1280, 6)
    expect(Number(first.attributes('y'))).toBeCloseTo(SEG01_PLACEMENT.topsFrac![0]! * 720, 6)
    expect(Number(first.attributes('width'))).toBeCloseTo(SEG01_PLACEMENT.blockFrac! * 720, 6)
  })

  it('ships the measured motion css: 130ms pops, cyan-run flip, dip keyframes, reduced-motion collapse', () => {
    mountStairChain({ steps })
    const css = shippedCss()

    // The reference frames pop each block fully-formed within 1–2 frames
    // (≤134ms at 15fps) — the rise runs 130ms.
    expect(css).toContain('opacity 130ms ease-out')
    expect(css).toContain('@keyframes sf-stair-dip')
    expect(css).toContain('--sf-dip')
    // The cyan run lands blue and flips to tertiary ~120ms later.
    expect(css).toContain('@keyframes sf-cyan-flip')
    expect(css).toContain('@keyframes sf-caption-flip')
    expect(css).toContain('.sf-tertiary:not(.slidev-vclick-hidden) .sf-block')
    // Backward nav snaps: the hidden state carries transition: none.
    expect(css).toContain('.sf-step.slidev-vclick-hidden')
    expect(css).toContain('transition: none')
    expect(css).toContain('@media (prefers-reduced-motion: reduce)')
  })

  it('marks tertiary steps and carries the flip variables for the cyan-run landing', () => {
    const wrapper = mountStairChain({ steps, palette: demoPalette })
    const groups = wrapper.findAll('.sf-step')
    const tertiary = groups[3]
    expect(tertiary.classes()).toContain('sf-tertiary')
    expect(tertiary.attributes('style')).toContain('--sf-flip-from')
    expect(tertiary.attributes('style')).toContain('--sf-flip-to')
    expect(tertiary.attributes('style')).toContain('--sf-cap-from')
    // Blue steps carry no flip.
    expect(groups[0].classes()).not.toContain('sf-tertiary')
    expect(groups[0].attributes('style') ?? '').not.toContain('--sf-flip-from')
  })
})
