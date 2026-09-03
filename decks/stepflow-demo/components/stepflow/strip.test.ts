// @vitest-environment happy-dom
import { describe, expect, it } from 'vitest'
import { mount } from '@vue/test-utils'
import RatioStrip from '../RatioStrip.vue'
import {
  BAND_X0_FRAC,
  BAND_X1_FRAC,
  CAPTION_Y_FRAC,
  CHIP_WFRAC,
  ratioStripLayout,
  SUBBAND_WFRAC,
  type RatioStripData,
  type StripSegment,
} from './strip'

/**
 * The demo seed mirrors the slide data: band placement is the measured §3.3
 * blueprint (research art_2kSBGNmJ, source video 95–101s).
 */
const Y_FRAC = 0.513889 // 370/720
const H_FRAC = 0.219444 // 158/720

/**
 * Initial proportions (click 1), [I]: the measured 22k→108k px teal re-flow
 * (§3.3) puts the teal region at ~1/5 of its settled share at build time;
 * red/salmon hold the rest of the band.
 */
const INIT = { sources: 0.52, model: 0.33, platform: 0.15 }

/** Settled shares (click 2): measured px of the 915px band (146/92/696). */
const FINAL = { sources: 0.159563, model: 0.100546, platform: 0.760656 }

function seed(): StripSegment[] {
  return [
    { id: 'sources', tone: 'alt', wFrac: INIT.sources, wFracFinal: FINAL.sources, label: 'INGEST' },
    { id: 'model', tone: 'accent', wFrac: INIT.model, wFracFinal: FINAL.model, label: 'TRANSFORM' },
    { id: 'platform', tone: 'tertiary', wFrac: INIT.platform, wFracFinal: FINAL.platform, label: 'PLATFORM' },
  ]
}

function data(): RatioStripData {
  return { segments: seed(), yFrac: Y_FRAC, hFrac: H_FRAC }
}

// Hand-computed px on the 1920×1080 viewBox (source px × 1.5).
const BAND_X = 276 // 184 × 1.5
const BAND_W = 1372.5 // 915 × 1.5
/** The measured finals overshoot 1.0 (146+92+696 = 934 of a 915px band) — normalized. */
const W1_SUM = FINAL.sources + FINAL.model + FINAL.platform // 1.020765

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

  it('teal-region internals: chip 80px, sub-band 298px, of the 696px region', () => {
    expect(CHIP_WFRAC).toBeCloseTo(0.114943, 6)
    expect(SUBBAND_WFRAC).toBeCloseTo(0.428161, 6)
    expect(CHIP_WFRAC + 298 / 696 + 318 / 696).toBeCloseTo(1, 6) // chip 80 | gap 318 | sub-band 298 tile the 696px region
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

  it('click-1 state: segments at the initial proportions, contiguous left → right', () => {
    const l = ratioStripLayout(data())
    const [s, m, p] = l.segments
    // 0.52 / 0.33 / 0.15 of the band (sums to exactly 1 — no normalization drift).
    expect(s.w0).toBeCloseTo(0.52 * BAND_W, 6) // 713.7
    expect(m.w0).toBeCloseTo(0.33 * BAND_W, 6) // 452.925
    expect(p.w0).toBeCloseTo(0.15 * BAND_W, 6) // 205.875
    expect(s.x0).toBeCloseTo(276, 6)
    expect(m.x0).toBeCloseTo(276 + 713.7, 6) // 989.7
    expect(p.x0).toBeCloseTo(989.7 + 452.925, 6) // 1442.625
    expect(p.x0 + p.w0).toBeCloseTo(1648.5, 6) // the initial state fills the band too
  })

  it('click-2 state: normalized measured shares (146/92/696 of a 915px band)', () => {
    const l = ratioStripLayout(data())
    const [s, m, p] = l.segments
    expect(s.w1).toBeCloseTo((FINAL.sources / W1_SUM) * BAND_W, 6) // ≈ 214.5452
    expect(m.w1).toBeCloseTo((FINAL.model / W1_SUM) * BAND_W, 6) // ≈ 135.1921
    expect(p.w1).toBeCloseTo((FINAL.platform / W1_SUM) * BAND_W, 6) // ≈ 1022.7627
    expect(s.w1 + m.w1 + p.w1).toBeCloseTo(BAND_W, 6) // shares of 100%
    expect(s.x1).toBeCloseTo(276, 6)
    expect(m.x1).toBeCloseTo(276 + s.w1, 6) // ≈ 490.5452
    expect(p.x1).toBeCloseTo(276 + s.w1 + m.w1, 6) // ≈ 625.7373
  })

  it('re-proportion spans conserve the band: Σdw = 0, and the teal segment absorbs the shrink', () => {
    const l = ratioStripLayout(data())
    const [s, m, p] = l.segments
    expect(s.dw).toBeCloseTo(s.w1 - s.w0, 6) // ≈ −499.1548
    expect(m.dw).toBeCloseTo(m.w1 - m.w0, 6) // ≈ −317.7329
    expect(p.dw).toBeCloseTo(p.w1 - p.w0, 6) // ≈ +816.8877
    expect(s.dw + m.dw + p.dw).toBeCloseTo(0, 6)
    // Contiguity identity: each dx is the sum of the previous dw values.
    expect(m.dx).toBeCloseTo(s.dw, 6)
    expect(p.dx).toBeCloseTo(s.dw + m.dw, 6)
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
    const l = ratioStripLayout({ segments: [{ id: 'only', tone: 'accent', wFrac: 0.4, wFracFinal: 0.9 }] , yFrac: 0.5, hFrac: 0.2 })
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
  it('binds exactly 2 native v-clicks: build, then re-proportion + captions', () => {
    const captured: number[] = []
    mountRatioStrip({ ...data(), title: 'RUNTIME', titleAccent: 'SHARE' }, captured)
    expect(captured).toEqual([1, 2])
  })

  it('renders one build rect and one final rect per segment on the measured band', () => {
    const wrapper = mountRatioStrip(data())
    expect(wrapper.find('svg.ratiostrip').exists()).toBe(true)
    expect(wrapper.findAll('rect.sf-rs-seg0')).toHaveLength(3)
    expect(wrapper.findAll('rect.sf-rs-seg1')).toHaveLength(3)
    const svg = wrapper.find('svg.ratiostrip')
    expect(svg.attributes('viewBox')).toBe('0 0 1920 1080')
    expect(svg.attributes('role')).toBe('img')
    expect(svg.attributes('aria-label')).toBe('3-segment ratio strip')
  })

  it('carries both width states in the markup: initial w0 on the build copy, settled w1 on the final copy', () => {
    const wrapper = mountRatioStrip(data())
    const w0 = wrapper.findAll('rect.sf-rs-seg0').map((r) => Number(r.attributes('width')))
    const w1 = wrapper.findAll('rect.sf-rs-seg1').map((r) => Number(r.attributes('width')))
    expect(w0[0]).toBeCloseTo(713.7, 6)
    expect(w0[1]).toBeCloseTo(452.925, 6)
    expect(w0[2]).toBeCloseTo(205.875, 6)
    expect(w1[0]).toBeCloseTo(214.5452, 4)
    expect(w1[1]).toBeCloseTo(135.1921, 4)
    expect(w1[2]).toBeCloseTo(1022.7627, 4)
    const x1 = wrapper.findAll('rect.sf-rs-seg1').map((r) => Number(r.attributes('x')))
    expect(x1[0]).toBeCloseTo(276, 6)
    expect(x1[2]).toBeCloseTo(625.7373, 4)
  })

  it('ships width-transition classes with hidden-state snap (transition: none)', () => {
    mountRatioStrip(data())
    const css = Array.from(document.querySelectorAll('style'))
      .map((tag) => tag.textContent ?? '')
      .join('\n')

    // Revealed state: the 600ms width ease (both layers).
    expect(css).toContain('transition: width 600ms')
    expect(css).toMatch(/\.sf-rs-seg0[^{]*\{[^}]*width 600ms/)
    expect(css).toMatch(/\.sf-rs-seg1[^{]*\{[^}]*width 600ms/)
    // Hidden state: width 0 + transition none → forward build/re-flow animates,
    // backward nav snaps (the locked decision).
    expect(css).toMatch(/\.sf-rs-build\.slidev-vclick-hidden[^{]*\.sf-rs-seg0[^{]*\{[^}]*width:\s*0/)
    expect(css).toMatch(/\.sf-rs-final\.slidev-vclick-hidden[^{]*\.sf-rs-seg1[^{]*\{[^}]*width:\s*0/)
    expect(css).toMatch(/\.sf-rs-build\.slidev-vclick-hidden[^{]*\.sf-rs-seg0[^{]*\{[^}]*transition:\s*none/)
    expect(css).toMatch(/\.sf-rs-final\.slidev-vclick-hidden[^{]*\.sf-rs-seg1[^{]*\{[^}]*transition:\s*none/)
    // Caption/teal-internals fades also snap back.
    expect(css).toMatch(/\.sf-rs-final\.slidev-vclick-hidden[^{]*\.sf-rs-caption[^{]*\{[^}]*transition:\s*none/)
    // Reduced motion freezes every reveal.
    expect(css).toContain('prefers-reduced-motion')
  })

  it('maps tones to palette roles: alt → accentAlt, accent → accent, tertiary → accentTertiary, plain → chrome white', () => {
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
    expect(fills).toEqual(['#e5413f', '#f7ba20', '#1cd798', '#f5f4f7'])
  })

  it('falls back tertiary → accent when the palette omits accentTertiary', () => {
    const wrapper = mountRatioStrip({
      segments: [{ id: 'teal', tone: 'tertiary', wFrac: 1 }],
      yFrac: 0.5,
      hFrac: 0.2,
      palette: { accent: '#f7ba20' },
    })
    expect(wrapper.find('rect.sf-rs-seg1').attributes('fill')).toBe('#f7ba20')
  })

  it('renders the teal-region internals only on tertiary segments, chip left + sub-band right', () => {
    const wrapper = mountRatioStrip(data())
    const teal = wrapper.findAll('rect.sf-rs-seg1')[2]
    const tealX = Number(teal.attributes('x'))
    const tealW = Number(teal.attributes('width'))

    const chip = wrapper.find('rect.sf-rs-chip')
    expect(chip.attributes('fill')).toBe('#9dfbd6')
    expect(Number(chip.attributes('x'))).toBeCloseTo(tealX, 4) // left edge of the region
    expect(Number(chip.attributes('width'))).toBeCloseTo(tealW * (80 / 696), 4)

    const subband = wrapper.find('rect.sf-rs-subband')
    expect(subband.attributes('fill')).toBe('rgba(0, 0, 0, 0.35)')
    expect(Number(subband.attributes('x')) + Number(subband.attributes('width'))).toBeCloseTo(tealX + tealW, 4) // right-aligned
    expect(Number(subband.attributes('width'))).toBeCloseTo(tealW * (298 / 696), 4)
  })

  it('renders the caption row under each segment’s final left edge, or a single caption line', () => {
    const labeled = mountRatioStrip(data())
    const texts = labeled.findAll('text.sf-rs-caption')
    expect(texts).toHaveLength(3)
    expect(texts[0].text()).toBe('INGEST')
    expect(Number(texts[0].attributes('x'))).toBeCloseTo(276, 4)
    expect(Number(texts[2].attributes('x'))).toBeCloseTo(625.7373, 4)
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
