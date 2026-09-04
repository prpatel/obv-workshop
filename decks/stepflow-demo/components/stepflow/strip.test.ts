// @vitest-environment happy-dom
import { describe, expect, it } from 'vitest'
import { mount } from '@vue/test-utils'
import RatioStrip from '../RatioStrip.vue'
import {
  BAND_X0_FRAC,
  BAND_X1_FRAC,
  BURST_DELAYS_MS,
  BURST_WFRACS,
  CAPTION_Y_FRAC,
  CHIP_WFRAC,
  HEADING_Y_FRAC,
  PLATE_H_FRAC,
  PLATE_X0_FRAC,
  PLATE_X1_FRAC,
  PLATE_Y_FRAC,
  RED_GRADIENT_END,
  TEAL_GRADIENT_START,
  ratioStripLayout,
  tealBurstWidths,
  type RatioStripData,
  type StripSegment,
} from './strip'

/**
 * The demo seed mirrors the slide data: band placement is the measured §3.3
 * blueprint (research art_2kSBGNmJ, source video 95–101s), reworked to the
 * fidelity report's measured two-segment anatomy (art_iHm120ov §RatioStrip,
 * settled frame t=99.1s at 1920×1080) — no amber segment exists in the source.
 */
const Y_FRAC = 0.513889 // 555/1080
const H_FRAC = 0.219444 // 237/1080

/**
 * Initial proportions (click 1), [I]: the measured 22k→108k px teal re-flow
 * (§3.3) puts the teal region at ~1/5 of its settled share at build time;
 * red holds the rest of the band.
 */
const INIT = { sources: 0.85, platform: 0.15 }

/** Settled shares (click 2): measured px of the 1372.5px band (334/1038.4). */
const FINAL = { sources: 0.2434, platform: 0.7566 }

/** The demo slide's measured palette override (slides.md line 479). */
const SLIDE_PALETTE = { accentAlt: '#ec423f', accentTertiary: '#1cd798' }

function seed(): StripSegment[] {
  return [
    { id: 'sources', tone: 'alt', wFrac: INIT.sources, wFracFinal: FINAL.sources, label: 'INGEST' },
    { id: 'platform', tone: 'tertiary', wFrac: INIT.platform, wFracFinal: FINAL.platform, label: 'PLATFORM' },
  ]
}

function data(): RatioStripData {
  return { segments: seed(), yFrac: Y_FRAC, hFrac: H_FRAC }
}

// Hand-computed px on the 1920×1080 viewBox (the measured t=99.1s frame is
// 1920×1080, so source px map 1:1 here).
const BAND_X = 276
const BAND_W = 1372.5
/** The demo finals sum to exactly 1 — no normalization drift. */
const W1_SUM = FINAL.sources + FINAL.platform // 1.0

/** Slidev registers the v-click directive globally at runtime; the render tests stub it and record click indices. */
function mountRatioStrip(props: Record<string, unknown>, captured: number[] = []) {
  return mount(RatioStrip, {
    props,
    global: {
      directives: {
        click: {
          mounted(_el: unknown, binding: { value: number }) {
            captured.push(binding.value)
          },
        },
      },
    },
  })
}

describe('measured constants — hand-computed to 1e-6', () => {
  it('band x-extent is 184–1099 of the 1280px source width', () => {
    expect(BAND_X0_FRAC).toBe(0.14375)
    expect(BAND_X1_FRAC).toBeCloseTo(0.858594, 6)
    expect(BAND_X1_FRAC).toBe(1099 / 1280)
    expect(BAND_X1_FRAC - BAND_X0_FRAC).toBeCloseTo(0.714844, 6) // 915/1280 = 71.5%w
  })

  it('caption row sits at the measured glyph row y557', () => {
    expect(CAPTION_Y_FRAC).toBeCloseTo(0.773611, 6)
    expect(CAPTION_Y_FRAC * 1080).toBeCloseTo(835.5, 6) // 557 × 1.5
  })

  it('panel plate spans the measured x234–1685 × y331–440, heading baseline y490', () => {
    expect(PLATE_X0_FRAC * 1920).toBeCloseTo(234, 6)
    expect(PLATE_X1_FRAC * 1920).toBeCloseTo(1685, 6)
    expect(PLATE_Y_FRAC * 1080).toBeCloseTo(331, 6)
    expect(PLATE_H_FRAC * 1080).toBeCloseTo(109, 6)
    expect(HEADING_Y_FRAC * 1080).toBeCloseTo(490, 6)
  })

  it('teal-region chip is the measured 95px of the 1043px region', () => {
    expect(CHIP_WFRAC).toBeCloseTo(95 / 1043, 6)
  })

  it('measured gradient stops: teal bright-mint start, red salmon tail', () => {
    expect(TEAL_GRADIENT_START).toBe('#76eec5')
    expect(RED_GRADIENT_END).toBe('#f98c8c')
  })
})

describe('tealBurstWidths — the three-burst re-flow waypoints', () => {
  it('returns the two burst waypoints then the settled width, monotonically', () => {
    const [b1, b2, fin] = tealBurstWidths(1372.5, 1038.4335)
    expect(b1).toBeCloseTo(480.375, 6) // 0.35 × band
    expect(b2).toBeCloseTo(754.875, 6) // 0.55 × band
    expect(fin).toBeCloseTo(1038.4335, 6)
  })

  it('clamps waypoints to the final width when the region is narrower than a burst share', () => {
    expect(tealBurstWidths(1372.5, 300)).toEqual([300, 300, 300])
  })

  it('rejects non-positive widths', () => {
    expect(() => tealBurstWidths(0, 100)).toThrow(RangeError)
    expect(() => tealBurstWidths(1372.5, 0)).toThrow(RangeError)
  })

  it('paces the bursts at the measured ~470ms cadence (99.10 / 99.57 / 99.83s)', () => {
    expect(BURST_WFRACS).toEqual([0.35, 0.55])
    expect(BURST_DELAYS_MS).toEqual([0, 470, 730])
  })
})

describe('ratioStripLayout — band geometry (demo seed)', () => {
  it('resolves the measured band: x276, w1372.5, y555, h237', () => {
    const l = ratioStripLayout(data())
    expect(l.band.x).toBeCloseTo(BAND_X, 6)
    expect(l.band.w).toBeCloseTo(BAND_W, 6)
    expect(l.band.y).toBeCloseTo(Y_FRAC * 1080, 6) // 555.00012 — the seed's 6dp rounding
    expect(l.band.h).toBeCloseTo(H_FRAC * 1080, 6) // 236.99952
    expect(l.band.x + l.band.w).toBeCloseTo(1648.5, 6) // 1099 × 1.5
    expect(l.viewBox).toEqual({ width: 1920, height: 1080 })
    expect(l.captionY).toBeCloseTo(835.5, 6)
  })

  it('resolves the measured panel plate: x234, y331, 1451×109', () => {
    const l = ratioStripLayout(data())
    expect(l.plate.x).toBeCloseTo(234, 6)
    expect(l.plate.y).toBeCloseTo(331, 6)
    expect(l.plate.w).toBeCloseTo(1451, 6)
    expect(l.plate.h).toBeCloseTo(109, 6)
  })

  it('click-1 state: segments at the initial proportions, contiguous left → right', () => {
    const l = ratioStripLayout(data())
    const [s, p] = l.segments
    // 0.85 / 0.15 of the band (sums to exactly 1 — no normalization drift).
    expect(s.w0).toBeCloseTo(0.85 * BAND_W, 6) // 1166.625
    expect(p.w0).toBeCloseTo(0.15 * BAND_W, 6) // 205.875
    expect(s.x0).toBeCloseTo(276, 6)
    expect(p.x0).toBeCloseTo(276 + 1166.625, 6) // 1442.625
    expect(p.x0 + p.w0).toBeCloseTo(1648.5, 6) // the initial state fills the band too
  })

  it('click-2 state: settled measured shares (334px red / 1038.4px teal)', () => {
    const l = ratioStripLayout(data())
    const [s, p] = l.segments
    expect(s.w1).toBeCloseTo((FINAL.sources / W1_SUM) * BAND_W, 6) // ≈ 334.0665
    expect(p.w1).toBeCloseTo((FINAL.platform / W1_SUM) * BAND_W, 6) // ≈ 1038.4335
    expect(s.w1 + p.w1).toBeCloseTo(BAND_W, 6) // shares of 100%
    expect(s.x1).toBeCloseTo(276, 6)
    expect(p.x1).toBeCloseTo(276 + s.w1, 6) // ≈ 610.0665
  })

  it('re-proportion spans conserve the band: Σdw = 0, and the teal segment absorbs the shrink', () => {
    const l = ratioStripLayout(data())
    const [s, p] = l.segments
    expect(s.dw).toBeCloseTo(s.w1 - s.w0, 6) // ≈ −832.5585
    expect(p.dw).toBeCloseTo(p.w1 - p.w0, 6) // ≈ +832.5585
    expect(s.dw + p.dw).toBeCloseTo(0, 6)
    // Contiguity identity: each dx is the sum of the previous dw values.
    expect(p.dx).toBeCloseTo(s.dw, 6)
    expect(p.dx).toBeCloseTo(-p.dw, 6) // the last segment's left edge moves by exactly its growth
  })

  it('the final state tiles the band exactly — no residue under the stacked final copy', () => {
    // The component stacks a final-state copy over the initial one; it only
    // covers cleanly if the final rects tile [band.x, band.x + band.w].
    const l = ratioStripLayout(data())
    const last = l.segments[l.segments.length - 1]
    expect(last.x1 + last.w1).toBeCloseTo(l.band.x + l.band.w, 6)
    for (let i = 1; i < l.segments.length; i++) {
      expect(l.segments[i].x1).toBeCloseTo(l.segments[i - 1].x1 + l.segments[i - 1].w1, 6)
    }
  })

  it('is deterministic for the same inputs', () => {
    expect(JSON.stringify(ratioStripLayout(data()))).toBe(JSON.stringify(ratioStripLayout(data())))
  })
})

describe('ratioStripLayout — normalization and off-nominal counts', () => {
  it('normalizes widths that do not sum to 1 (equal two-segment band)', () => {
    const l = ratioStripLayout({ segments: [
      { id: 'a', tone: 'accent', wFrac: 3, wFracFinal: 1 },
      { id: 'b', tone: 'tertiary', wFrac: 1, wFracFinal: 3 },
    ], yFrac: 0.5, hFrac: 0.2 })
    expect(l.segments[0].w0).toBeCloseTo(BAND_W * 0.75, 6) // 1029.375
    expect(l.segments[1].w0).toBeCloseTo(BAND_W * 0.25, 6) // 343.125
    expect(l.segments[0].w1).toBeCloseTo(BAND_W * 0.25, 6) // the re-flow swaps the shares
    expect(l.segments[1].w1).toBeCloseTo(BAND_W * 0.75, 6)
    expect(l.segments[0].dw + l.segments[1].dw).toBeCloseTo(0, 6)
  })

  it('a single segment always spans the whole band in both states', () => {
    const l = ratioStripLayout({ segments: [{ id: 'only', tone: 'accent', wFrac: 0.4, wFracFinal: 0.9 }], yFrac: 0.5, hFrac: 0.2 })
    expect(l.segments[0].w0).toBeCloseTo(BAND_W, 6)
    expect(l.segments[0].w1).toBeCloseTo(BAND_W, 6)
    expect(l.segments[0].dx).toBeCloseTo(0, 6)
    expect(l.segments[0].dw).toBeCloseTo(0, 6)
  })

  it('four segments summing to 2 split the band by relative share', () => {
    const l = ratioStripLayout({ segments: [
      { id: 'a', tone: 'accent', wFrac: 0.8 },
      { id: 'b', tone: 'alt', wFrac: 0.6 },
      { id: 'c', tone: 'tertiary', wFrac: 0.4 },
      { id: 'd', tone: 'plain', wFrac: 0.2 },
    ], yFrac: 0.5, hFrac: 0.2 })
    expect(l.segments.map((s) => s.w0)).toHaveLength(4)
    expect(l.segments[0].w0).toBeCloseTo(0.4 * BAND_W, 6) // 549
    expect(l.segments[1].w0).toBeCloseTo(0.3 * BAND_W, 6) // 411.75
    expect(l.segments[2].w0).toBeCloseTo(0.2 * BAND_W, 6) // 274.5
    expect(l.segments[3].w0).toBeCloseTo(0.1 * BAND_W, 6) // 137.25
  })

  it('a segment without wFracFinal holds its width through the re-flow', () => {
    const l = ratioStripLayout({ segments: [
      { id: 'hold', tone: 'accent', wFrac: 0.5 },
      { id: 'grow', tone: 'tertiary', wFrac: 0.5, wFracFinal: 0.9 },
    ], yFrac: 0.5, hFrac: 0.2 })
    // Final shares normalize over wFrac + wFracFinal = 1.4: the holder drops
    // from 50% to 5/14 of the band, the grower rises to 9/14.
    expect(l.segments[0].dw).toBeCloseTo(-(0.5 - 0.5 / 1.4) * BAND_W, 6) // −1372.5/7 ≈ −196.0714
    expect(l.segments[1].dw).toBeCloseTo((0.9 / 1.4 - 0.5) * BAND_W, 6) // +1372.5/7
    expect(l.segments[0].w1).toBeCloseTo((0.5 / 1.4) * BAND_W, 6) // ≈ 490.1786
    expect(l.segments[1].w1).toBeCloseTo((0.9 / 1.4) * BAND_W, 6) // ≈ 882.3214
  })
})

describe('ratioStripLayout — validation throws instead of rendering blank', () => {
  it('rejects empty segments and non-positive widths', () => {
    expect(() => ratioStripLayout({ segments: [], yFrac: 0.5, hFrac: 0.2 })).toThrow(RangeError)
    expect(() => ratioStripLayout({ segments: [{ id: 'a', tone: 'accent', wFrac: 0 }], yFrac: 0.5, hFrac: 0.2 })).toThrow(RangeError)
    expect(() => ratioStripLayout({ segments: [{ id: 'a', tone: 'accent', wFrac: -0.5 }], yFrac: 0.5, hFrac: 0.2 })).toThrow(RangeError)
    expect(() => ratioStripLayout({ segments: [{ id: 'a', tone: 'accent', wFrac: 0.5, wFracFinal: 0 }], yFrac: 0.5, hFrac: 0.2 })).toThrow(RangeError)
  })

  it('rejects bands outside the canvas', () => {
    expect(() => ratioStripLayout(data(), { width: 1920, height: 1080 })).not.toThrow()
    expect(() => ratioStripLayout({ segments: seed(), yFrac: -0.1, hFrac: 0.2 })).toThrow(RangeError)
    expect(() => ratioStripLayout({ segments: seed(), yFrac: 1.1, hFrac: 0.2 })).toThrow(RangeError)
    expect(() => ratioStripLayout({ segments: seed(), yFrac: 0.5, hFrac: 0 })).toThrow(RangeError)
    expect(() => ratioStripLayout({ segments: seed(), yFrac: 0.9, hFrac: 0.2 })).toThrow(RangeError) // band exceeds the bottom
  })
})

describe('RatioStrip component', () => {
  it('binds exactly 3 native v-clicks: band pop, three-burst re-flow, then caption state', () => {
    const captured: number[] = []
    mountRatioStrip({ ...data(), title: 'RUNTIME', titleAccent: 'SHARE' }, captured)
    expect(captured).toEqual([1, 2, 3])
  })

  it('renders one build rect and one final rect per segment on the measured band', () => {
    const wrapper = mountRatioStrip(data())
    expect(wrapper.find('svg.ratiostrip').exists()).toBe(true)
    expect(wrapper.findAll('rect.sf-rs-seg0')).toHaveLength(2)
    expect(wrapper.findAll('rect.sf-rs-seg1')).toHaveLength(2)
    const svg = wrapper.find('svg.ratiostrip')
    expect(svg.attributes('viewBox')).toBe('0 0 1920 1080')
    expect(svg.attributes('role')).toBe('img')
    expect(svg.attributes('aria-label')).toBe('2-segment ratio strip')
  })

  it('carries both width states in the markup: initial w0 on the build copy, settled w1 on the final copy', () => {
    const wrapper = mountRatioStrip(data())
    const w0 = wrapper.findAll('rect.sf-rs-seg0').map((r) => Number(r.attributes('width')))
    const w1 = wrapper.findAll('rect.sf-rs-seg1').map((r) => Number(r.attributes('width')))
    expect(w0[0]).toBeCloseTo(1166.625, 6)
    expect(w0[1]).toBeCloseTo(205.875, 6)
    expect(w1[0]).toBeCloseTo(334.0665, 4)
    expect(w1[1]).toBeCloseTo(1038.4335, 4)
    const x1 = wrapper.findAll('rect.sf-rs-seg1').map((r) => Number(r.attributes('x')))
    expect(x1[0]).toBeCloseTo(276, 6)
    expect(x1[1]).toBeCloseTo(610.0665, 4)
  })

  it('fills segments with measured gradients: red→salmon per-rect, teal as a fixed final-region field', () => {
    const wrapper = mountRatioStrip({ ...data(), palette: SLIDE_PALETTE })
    const fills = wrapper.findAll('rect.sf-rs-seg1').map((r) => r.attributes('fill'))
    expect(fills[0]).toBe('url(#sf-rs-grad-alt)')
    expect(fills[1]).toBe('url(#sf-rs-grad-tertiary-platform)')
    const defs = wrapper.find('defs').html()
    // Red gradient carries the resolved accentAlt + the measured salmon tail.
    expect(defs).toContain('id="sf-rs-grad-alt"')
    expect(defs).toContain('stop-color="#ec423f"')
    expect(defs).toContain('stop-color="#f98c8c"')
    // Teal gradient is userSpaceOnUse, anchored to the FINAL region
    // (x 610.0665 → 1648.5 — its right edge lands on the band's right edge).
    expect(defs).toContain('id="sf-rs-grad-tertiary-platform"')
    expect(defs).toContain('gradientUnits="userSpaceOnUse"')
    expect(defs).toContain('stop-color="#76eec5"')
    expect(defs).toContain('stop-color="#1cd798"')
    const teal = wrapper.find('linearGradient[id="sf-rs-grad-tertiary-platform"]')
    expect(Number(teal.attributes('x1'))).toBeCloseTo(610.0665, 4)
    expect(Number(teal.attributes('x2'))).toBeCloseTo(1648.5, 4)
  })

  it('renders the measured panel plate and the white heading row as static chrome', () => {
    const wrapper = mountRatioStrip({ ...data(), heading: 'SHARE OF TOTAL' })
    const plate = wrapper.find('rect.sf-rs-plate')
    expect(plate.attributes('fill')).toBe('#18181b')
    expect(Number(plate.attributes('x'))).toBeCloseTo(234, 4)
    expect(Number(plate.attributes('y'))).toBeCloseTo(331, 4)
    expect(Number(plate.attributes('width'))).toBeCloseTo(1451, 4)
    expect(Number(plate.attributes('height'))).toBeCloseTo(109, 4)
    const heading = wrapper.find('text.sf-rs-heading')
    expect(heading.text()).toBe('SHARE OF TOTAL')
    expect(heading.attributes('fill')).toBe('#ffffff')
    expect(Number(heading.attributes('y'))).toBeCloseTo(490, 4)
    // Without the prop no heading row renders; the plate is always present.
    const bare = mountRatioStrip(data())
    expect(bare.find('text.sf-rs-heading').exists()).toBe(false)
    expect(bare.find('rect.sf-rs-plate').exists()).toBe(true)
  })

  it('renders the burst copies with stepped reveal widths for the three-burst re-flow', () => {
    const wrapper = mountRatioStrip(data())
    const bursts = wrapper.findAll('rect.sf-rs-burst')
    expect(bursts).toHaveLength(2) // burst 3 rides the final rect
    expect(bursts[0].classes()).toContain('sf-rs-burst0')
    expect(bursts[1].classes()).toContain('sf-rs-burst1')
    expect(Number(bursts[0].attributes('width'))).toBeCloseTo(480.375, 4) // 0.35 × band
    expect(Number(bursts[1].attributes('width'))).toBeCloseTo(754.875, 4) // 0.55 × band
    expect(Number(bursts[0].attributes('x'))).toBeCloseTo(610.0665, 4) // teal region's left edge
    expect(bursts[0].attributes('fill')).toBe('url(#sf-rs-grad-tertiary-platform)')
    expect(bursts[1].attributes('fill')).toBe('url(#sf-rs-grad-tertiary-platform)')
  })

  it('ships width-transition classes with burst delays and hidden-state snap (transition: none)', () => {
    mountRatioStrip(data())
    const css = Array.from(document.querySelectorAll('style'))
      .map((tag) => tag.textContent ?? '')
      .join('\n')

    // Revealed states: 120ms pop (click 1), 140ms burst ease (click 2).
    expect(css).toMatch(/\.sf-rs-seg0[^{]*\{[^}]*width 120ms/)
    expect(css).toMatch(/\.sf-rs-seg1[^{]*\{[^}]*width 140ms/)
    expect(css).toMatch(/\.sf-rs-burst(?!0|1)[^{]*\{[^}]*width 140ms/)
    // Stepped burst delays: 0ms / 470ms / 730ms (the final copy carries 730).
    expect(css).toMatch(/\.sf-rs-burst1[^{]*\{[^}]*transition-delay:\s*470ms/)
    expect(css).toMatch(/\.sf-rs-seg1[^{]*\{[^}]*transition-delay:\s*730ms/)
    // Hidden states: width 0 + transition none → forward reveal animates,
    // backward nav snaps (the locked decision).
    expect(css).toMatch(/\.sf-rs-build\.slidev-vclick-hidden[^{]*\.sf-rs-seg0[^{]*\{[^}]*width:\s*0/)
    expect(css).toMatch(/\.sf-rs-final\.slidev-vclick-hidden[^{]*\.sf-rs-seg1[^{]*\{[^}]*width:\s*0/)
    expect(css).toMatch(/\.sf-rs-final\.slidev-vclick-hidden[^{]*\.sf-rs-burst[^{]*\{[^}]*width:\s*0/)
    expect(css).toMatch(/\.sf-rs-final\.slidev-vclick-hidden[^{]*\.sf-rs-seg1[^{]*\{[^}]*transition:\s*none/)
    // Chip and caption fades also snap back (the caption on its own third click).
    expect(css).toMatch(/\.sf-rs-final\.slidev-vclick-hidden[^{]*\.sf-rs-chip[^{]*\{[^}]*transition:\s*none/)
    expect(css).toMatch(/\.sf-rs-text\.slidev-vclick-hidden[^{]*\.sf-rs-caption[^{]*\{[^}]*transition:\s*none/)
    // Reduced motion freezes every reveal.
    expect(css).toContain('prefers-reduced-motion')
  })

  it('maps tones to gradient/palette roles: alt → red gradient, accent → accent, tertiary → teal gradient, plain → chrome white', () => {
    const wrapper = mountRatioStrip({
      segments: [
        { id: 'alt', tone: 'alt', wFrac: 0.25 },
        { id: 'accent', tone: 'accent', wFrac: 0.25 },
        { id: 'tert', tone: 'tertiary', wFrac: 0.25 },
        { id: 'plain', tone: 'plain', wFrac: 0.25 },
      ],
      yFrac: 0.5,
      hFrac: 0.2,
      palette: { accent: '#f7ba20', accentAlt: '#e5413f', accentTertiary: '#1cd798' },
    })
    const fills = wrapper.findAll('rect.sf-rs-seg1').map((r) => r.attributes('fill'))
    expect(fills).toEqual([
      'url(#sf-rs-grad-alt)',
      '#f7ba20',
      'url(#sf-rs-grad-tertiary-tert)',
      '#f5f4f7',
    ])
  })

  it('falls back tertiary → accent when the palette omits accentTertiary', () => {
    const wrapper = mountRatioStrip({
      segments: [{ id: 'teal', tone: 'tertiary', wFrac: 1 }],
      yFrac: 0.5,
      hFrac: 0.2,
      palette: { accent: '#f7ba20' },
    })
    expect(wrapper.find('rect.sf-rs-seg1').attributes('fill')).toBe('url(#sf-rs-grad-tertiary-teal)')
    expect(wrapper.find('defs').html()).toContain('stop-color="#f7ba20"')
  })

  it('renders the mint chip on tertiary segments at the region\'s left edge, measured 95/1043 wide', () => {
    const wrapper = mountRatioStrip(data())
    const teal = wrapper.findAll('rect.sf-rs-seg1')[1]
    const tealX = Number(teal.attributes('x'))
    const tealW = Number(teal.attributes('width'))

    const chip = wrapper.find('rect.sf-rs-chip')
    expect(chip.attributes('fill')).toBe('#a0fcd9')
    expect(Number(chip.attributes('x'))).toBeCloseTo(tealX, 4) // left edge of the region
    expect(Number(chip.attributes('width'))).toBeCloseTo(tealW * (95 / 1043), 4)
  })

  it('renders the caption row on the third click with tone-family label colors', () => {
    const labeled = mountRatioStrip({ ...data(), palette: SLIDE_PALETTE })
    const texts = labeled.findAll('text.sf-rs-caption')
    expect(texts).toHaveLength(2)
    expect(texts[0].text()).toBe('INGEST')
    expect(texts[0].attributes('fill')).toBe('#ec423f') // red label under the red segment
    expect(texts[1].attributes('fill')).toBe('#70e8c0') // mint/green under the teal region
    expect(Number(texts[0].attributes('x'))).toBeCloseTo(276, 4)
    expect(Number(texts[1].attributes('x'))).toBeCloseTo(610.0665, 4)
    expect(Number(texts[0].attributes('y'))).toBeCloseTo(835.5, 4)

    const capped = mountRatioStrip({
      segments: [{ id: 'a', tone: 'accent', wFrac: 1 }],
      yFrac: 0.5,
      hFrac: 0.2,
      caption: 'SHARE OF RUNTIME',
    })
    const capTexts = capped.findAll('text.sf-rs-caption')
    expect(capTexts).toHaveLength(1)
    expect(capTexts[0].text()).toBe('SHARE OF RUNTIME')
    expect(capTexts[0].attributes('fill')).toBe('#a6a8ae') // chrome-dim subtext
    expect(Number(capTexts[0].attributes('x'))).toBeCloseTo(276, 4)
  })

  it('renders the two-tone header: white title + chrome-green titleAccent tail', () => {
    const wrapper = mountRatioStrip({ ...data(), title: 'RUNTIME', titleAccent: 'SHARE' })
    const header = wrapper.find('text.header')
    expect(header.text()).toContain('RUNTIME')
    expect(header.html()).toContain('#66fb00')
  })

  it('surfaces the layout RangeError instead of rendering blank', () => {
    expect(() => mountRatioStrip({ segments: [], yFrac: 0.5, hFrac: 0.2 })).toThrow(RangeError)
  })
})
