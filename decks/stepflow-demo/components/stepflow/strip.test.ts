// @vitest-environment happy-dom
import { describe, expect, it } from 'vitest'
import { mount } from '@vue/test-utils'
import RatioStrip from '../RatioStrip.vue'
import {
  BAND_FIELD_END,
  BAND_FIELD_START,
  BAND_X0_FRAC,
  BAND_X1_FRAC,
  BURST_DELAYS_MS,
  BURST_WFRACS,
  BODY_FIELD_BOTTOM_FRAC,
  BODY_FIELD_COLOR,
  BODY_FIELD_Y_FRAC,
  CAPTION_CAP_PX,
  CAPTION_COLOR,
  CAPTION_RIGHT_COLOR,
  CAPTION_RIGHT_WIDTH_PX,
  CAPTION_RIGHT_X_FRAC,
  CAPTION_WIDTH_PX,
  CAPTION_X_FRAC,
  CAPTION_Y_FRAC,
  HEADING1_BASELINE_FRAC,
  HEADING1_CAP_PX,
  HEADING1_WIDTH_PX,
  HEADING1_X_FRAC,
  HEADING2_BASELINE_FRAC,
  HEADING2_CAP_PX,
  HEADING2_WIDTH_PX,
  HEADING2_X_FRAC,
  CHIP_FILL,
  CHIP_H_PX,
  CHIP_RADIUS_PX,
  CHIP_SWEEP_SPLIT_FRAC,
  CHIP_TEXT_BASELINE_FRAC,
  CHIP_TEXT_CAP_PX,
  CHIP_TEXT_COLOR,
  CHIP_Y_FRAC,
  CHIPS,
  HEADING_COLOR,
  MINT_SETTLE_DELAY_MS,
  PLATE_H_FRAC,
  PLATE_X0_FRAC,
  PLATE_X1_FRAC,
  PLATE_Y_FRAC,
  RED_GRADIENT_END,
  TICK_COLOR,
  TICK_H_PX,
  TICK_W_PX,
  TICK_X_CENTERS,
  TICK_Y_FRAC,
  ratioStripLayout,
  tealBurstWidths,
  type RatioStripData,
  type StripSegment,
} from './strip'

/**
 * The demo seed mirrors the slide data: band placement is the measured §3.3
 * blueprint (research art_2kSBGNmJ, source video 95–101s), reworked to the
 * exact-trace sheet's measured three-segment anatomy (art_7bTnqSB3 §3,
 * settled clip frame t≈5.97s at 1920×1080) — red gradient / mint / teal.
 */
const Y_FRAC = 0.513889 // 555/1080
const H_FRAC = 0.219444 // 237/1080

/**
 * Initial proportions (click 1), [I]: the measured teal re-flow puts the teal
 * region at ~1/5 of its settled share at build time and the mint segment
 * near-closed; red holds the rest of the band.
 */
const INIT = { sources: 0.84, mint: 0.03, platform: 0.13 }

/**
 * Settled shares (click 2): measured px of the 1372.5px band — red x276–605
 * (330px), mint x605–760 (155px), teal x760–1648 (888px). Sum = 1.
 */
const FINAL = { sources: 0.24, mint: 0.113, platform: 0.647 }

/** The demo slide's measured palette override (slides.md slide 11). */
const SLIDE_PALETTE = { accentAlt: '#ec423f' }

function seed(): StripSegment[] {
  return [
    { id: 'sources', tone: 'alt', wFrac: INIT.sources, wFracFinal: FINAL.sources },
    { id: 'mint', tone: 'mint', wFrac: INIT.mint, wFracFinal: FINAL.mint },
    { id: 'platform', tone: 'tertiary', wFrac: INIT.platform, wFracFinal: FINAL.platform },
  ]
}

function data(): RatioStripData {
  return { segments: seed(), yFrac: Y_FRAC, hFrac: H_FRAC }
}

// Hand-computed px on the 1920×1080 viewBox (the settled reference frame is
// 1920×1080, so source px map 1:1 here).
const BAND_X = 276
const BAND_W = 1372.5
/** The demo finals sum to exactly 1 — no normalization drift. */
const W1_SUM = FINAL.sources + FINAL.mint + FINAL.platform // 1.0

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

  it('caption row sits on the measured glyph band bottom y858; left red + right mint pair', () => {
    expect(CAPTION_Y_FRAC).toBeCloseTo(0.794444, 6)
    expect(CAPTION_Y_FRAC * 1080).toBeCloseTo(858, 6)
    expect(CAPTION_CAP_PX).toBe(23)
    expect(CAPTION_COLOR).toBe('#e94343')
    expect(CAPTION_X_FRAC * 1920).toBeCloseTo(277, 6)
    expect(CAPTION_WIDTH_PX).toBe(332)
    expect(CAPTION_RIGHT_COLOR).toBe('#23d598')
    expect(CAPTION_RIGHT_X_FRAC * 1920).toBeCloseTo(1224, 6)
    expect(CAPTION_RIGHT_WIDTH_PX).toBe(419)
  })

  it('panel chrome: plate bar y333–411 + body field y412–936 at x234–1685', () => {
    expect(PLATE_X0_FRAC * 1920).toBeCloseTo(234, 6)
    expect(PLATE_X1_FRAC * 1920).toBeCloseTo(1685, 6)
    expect(PLATE_Y_FRAC * 1080).toBeCloseTo(333, 6)
    expect(PLATE_H_FRAC * 1080).toBeCloseTo(79, 6)
    expect(BODY_FIELD_Y_FRAC * 1080).toBeCloseTo(412, 6)
    expect(BODY_FIELD_BOTTOM_FRAC * 1080).toBeCloseTo(936, 6)
    expect(BODY_FIELD_COLOR).toBe('#0f0e11')
  })

  it('plate heading row 1: mixed-case URL, cap 17px, baseline 380, ink x369–708', () => {
    expect(HEADING1_X_FRAC * 1920).toBeCloseTo(369, 6)
    expect(HEADING1_BASELINE_FRAC * 1080).toBeCloseTo(380, 6)
    expect(HEADING1_CAP_PX).toBe(17)
    expect(HEADING1_WIDTH_PX).toBe(339)
    expect(HEADING_COLOR).toBe('#a4a4b0')
  })

  it('heading row 2: gray caps, cap 17px, band y465–481, x276–672', () => {
    expect(HEADING2_X_FRAC * 1920).toBeCloseTo(276, 6)
    expect(HEADING2_BASELINE_FRAC * 1080).toBeCloseTo(481, 6)
    expect(HEADING2_CAP_PX).toBe(17)
    expect(HEADING2_WIDTH_PX).toBe(396)
  })

  it('tick row: 9 measured x-centers (first 8 on a ≈171.6px pitch, 9th at 1640.5), 4×25px at y510', () => {
    expect(TICK_X_CENTERS).toHaveLength(9)
    expect(TICK_X_CENTERS[0]).toBe(281)
    expect(TICK_X_CENTERS[7]).toBeCloseTo(1482.5, 1)
    expect(TICK_X_CENTERS[8]).toBe(1640.5)
    // First-eight pitch matches the sheet's ≈171.6 reading.
    expect((TICK_X_CENTERS[7] - TICK_X_CENTERS[0]) / 7).toBeCloseTo(171.64, 1)
    expect(TICK_Y_FRAC * 1080).toBeCloseTo(510, 6)
    expect(TICK_W_PX).toBe(4)
    expect(TICK_H_PX).toBe(25)
    expect(TICK_COLOR).toBe('#3a3b42')
  })

  it('chip row: three #020404 boxes y628–718 with mint labels, sweep split x1282', () => {
    expect(CHIP_Y_FRAC * 1080).toBeCloseTo(628, 6)
    expect(CHIP_H_PX).toBe(90)
    expect(CHIP_FILL).toBe('#020404')
    expect(CHIP_RADIUS_PX).toBe(12)
    expect(CHIP_TEXT_COLOR).toBe('#21d697')
    expect(CHIP_TEXT_CAP_PX).toBe(20)
    expect(CHIP_TEXT_BASELINE_FRAC * 1080).toBeCloseTo(683, 6)
    expect(CHIP_SWEEP_SPLIT_FRAC * 1920).toBeCloseTo(1282, 6)
    expect(CHIPS).toEqual([
      { x0: 706, x1: 917, ink0: 730, ink1: 890 },
      { x0: 944, x1: 1251, ink0: 969, ink1: 1224 },
      { x0: 1278, x1: 1547, ink0: 1302, ink1: 1520 },
    ])
  })

  it('shared mint→teal field: measured continuous ramp endpoints', () => {
    expect(BAND_FIELD_START).toBe('#a0fbd9')
    expect(BAND_FIELD_END).toBe('#1ed496')
  })

  it('measured red-segment gradient tail (accentAlt red → salmon)', () => {
    expect(RED_GRADIENT_END).toBe('#f98c8c')
  })
})

describe('tealBurstWidths — the three-burst re-flow waypoints', () => {
  it('returns the two burst waypoints then the settled width, monotonically', () => {
    const [b1, b2, fin] = tealBurstWidths(1372.5, 888.0075)
    expect(b1).toBeCloseTo(480.375, 6) // 0.35 × band
    expect(b2).toBeCloseTo(754.875, 6) // 0.55 × band
    expect(fin).toBeCloseTo(888.0075, 6)
  })

  it('clamps waypoints to the final width when the region is narrower than a burst share', () => {
    expect(tealBurstWidths(1372.5, 300)).toEqual([300, 300, 300])
  })

  it('rejects non-positive widths', () => {
    expect(() => tealBurstWidths(0, 100)).toThrow(RangeError)
    expect(() => tealBurstWidths(1372.5, 0)).toThrow(RangeError)
  })

  it('paces the bursts at the measured clip-relative cadence and the mint settle after burst 3', () => {
    expect(BURST_WFRACS).toEqual([0.35, 0.55])
    expect(BURST_DELAYS_MS).toEqual([0, 1133, 2967]) // measured 650 / 1783 / 3617ms clip-relative
    expect(MINT_SETTLE_DELAY_MS).toBe(3433) // measured 4083–4200ms settle window
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
    expect(l.captionY).toBeCloseTo(858, 6)
  })

  it('resolves the measured panel plate bar: x234, y333, 1451×79', () => {
    const l = ratioStripLayout(data())
    expect(l.plate.x).toBeCloseTo(234, 6)
    expect(l.plate.y).toBeCloseTo(333, 6)
    expect(l.plate.w).toBeCloseTo(1451, 6)
    expect(l.plate.h).toBeCloseTo(79, 6)
  })

  it('click-1 state: segments at the initial proportions, contiguous left → right', () => {
    const l = ratioStripLayout(data())
    const [s, m, p] = l.segments
    expect(s.w0).toBeCloseTo(0.84 * BAND_W, 6) // 1152.9
    expect(m.w0).toBeCloseTo(0.03 * BAND_W, 6) // 41.175
    expect(p.w0).toBeCloseTo(0.13 * BAND_W, 6) // 178.425
    expect(s.x0).toBeCloseTo(276, 6)
    expect(m.x0).toBeCloseTo(276 + 1152.9, 6) // 1428.9
    expect(p.x0).toBeCloseTo(1428.9 + 41.175, 6) // 1470.075
    expect(p.x0 + p.w0).toBeCloseTo(1648.5, 6) // the initial state fills the band too
  })

  it('click-2 state: settled measured shares (330px red / 155px mint / 888px teal)', () => {
    const l = ratioStripLayout(data())
    const [s, m, p] = l.segments
    expect(s.w1).toBeCloseTo((FINAL.sources / W1_SUM) * BAND_W, 6) // 329.4
    expect(m.w1).toBeCloseTo((FINAL.mint / W1_SUM) * BAND_W, 6) // 155.0925
    expect(p.w1).toBeCloseTo((FINAL.platform / W1_SUM) * BAND_W, 6) // 888.0075
    expect(s.w1 + m.w1 + p.w1).toBeCloseTo(BAND_W, 6) // shares of 100%
    expect(s.x1).toBeCloseTo(276, 6)
    expect(m.x1).toBeCloseTo(605.4, 6) // measured mint left edge
    expect(p.x1).toBeCloseTo(760.4925, 4) // measured teal left edge x760
  })

  it('re-proportion spans conserve the band: Σdw = 0', () => {
    const l = ratioStripLayout(data())
    const [s, m, p] = l.segments
    expect(s.dw).toBeCloseTo(s.w1 - s.w0, 6) // ≈ −823.5
    expect(m.dw).toBeCloseTo(m.w1 - m.w0, 6) // ≈ +113.9175
    expect(p.dw).toBeCloseTo(p.w1 - p.w0, 6) // ≈ +709.5825
    expect(s.dw + m.dw + p.dw).toBeCloseTo(0, 6)
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
  it('binds exactly 3 native v-clicks: band pop, three-burst re-flow, then band-text/caption state', () => {
    const captured: number[] = []
    mountRatioStrip({ ...data(), title: 'RUNTIME', titleAccent: 'SHARE' }, captured)
    expect(captured).toEqual([1, 2, 3])
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
    expect(w0[0]).toBeCloseTo(1152.9, 6)
    expect(w0[1]).toBeCloseTo(41.175, 6)
    expect(w0[2]).toBeCloseTo(178.425, 6)
    expect(w1[0]).toBeCloseTo(329.4, 4)
    expect(w1[1]).toBeCloseTo(155.0925, 4)
    expect(w1[2]).toBeCloseTo(888.0075, 4)
    const x1 = wrapper.findAll('rect.sf-rs-seg1').map((r) => Number(r.attributes('x')))
    expect(x1[0]).toBeCloseTo(276, 6)
    expect(x1[1]).toBeCloseTo(605.4, 4)
    expect(x1[2]).toBeCloseTo(760.4925, 4)
  })

  it('fills segments with measured gradients: red→salmon per-rect, mint+teal from the shared ramp field', () => {
    const wrapper = mountRatioStrip({ ...data(), palette: SLIDE_PALETTE })
    const fills = wrapper.findAll('rect.sf-rs-seg1').map((r) => r.attributes('fill'))
    expect(fills[0]).toBe('url(#sf-rs-grad-alt)')
    expect(fills[1]).toBe('url(#sf-rs-field)')
    expect(fills[2]).toBe('url(#sf-rs-field)')
    const defs = wrapper.find('defs').html()
    // Red gradient carries the resolved accentAlt + the measured salmon tail.
    expect(defs).toContain('id="sf-rs-grad-alt"')
    expect(defs).toContain('stop-color="#ec423f"')
    expect(defs).toContain('stop-color="#f98c8c"')
    // The shared field is userSpaceOnUse, spanning the mint segment's final
    // left edge (605.4) to the band's right edge (1648.5) — the measured
    // continuous ramp with no discontinuity at the x760 boundary.
    expect(defs).toContain('id="sf-rs-field"')
    expect(defs).toContain('gradientUnits="userSpaceOnUse"')
    expect(defs).toContain('stop-color="#a0fbd9"')
    expect(defs).toContain('stop-color="#1ed496"')
    const field = wrapper.find('linearGradient[id="sf-rs-field"]')
    expect(Number(field.attributes('x1'))).toBeCloseTo(605.4, 4)
    expect(Number(field.attributes('x2'))).toBeCloseTo(1648.5, 4)
  })

  it('renders the two-tone panel, URL heading row, gray caps row, and tick row as static chrome', () => {
    const wrapper = mountRatioStrip({ ...data(), heading: 'data.mrk.shop/workspace', heading2: 'TIME IN ONE WORKING DAY' })
    const plate = wrapper.find('rect.sf-rs-plate')
    expect(plate.attributes('fill')).toBe('#19181d')
    expect(Number(plate.attributes('x'))).toBeCloseTo(234, 4)
    expect(Number(plate.attributes('y'))).toBeCloseTo(333, 4)
    expect(Number(plate.attributes('width'))).toBeCloseTo(1451, 4)
    expect(Number(plate.attributes('height'))).toBeCloseTo(79, 4)
    // The #0f0e11 body field continues below the plate bar through the captions.
    const body = wrapper.find('rect.sf-rs-bodyfield')
    expect(body.attributes('fill')).toBe('#0f0e11')
    expect(Number(body.attributes('y'))).toBeCloseTo(412, 4)
    expect(Number(body.attributes('height'))).toBeCloseTo(936 - 412, 4)
    expect(Number(body.attributes('x'))).toBeCloseTo(234, 4)
    // Row 1: gray mixed-case URL inside the plate, ink pinned to the measured 339px.
    const heading = wrapper.find('text.sf-rs-heading')
    expect(heading.text()).toBe('data.mrk.shop/workspace')
    expect(heading.attributes('fill')).toBe('#a4a4b0')
    expect(Number(heading.attributes('x'))).toBeCloseTo(369, 4)
    expect(Number(heading.attributes('y'))).toBeCloseTo(380, 4)
    expect(heading.attributes('textLength')).toBe('339')
    expect(Number(heading.attributes('font-size'))).toBeCloseTo(17 / 0.730, 3)
    // Row 2: gray caps in the body field, spread over the measured 396px.
    const heading2 = wrapper.find('text.sf-rs-heading2')
    expect(heading2.text()).toBe('TIME IN ONE WORKING DAY')
    expect(heading2.attributes('fill')).toBe('#a4a4b0')
    expect(Number(heading2.attributes('x'))).toBeCloseTo(276, 4)
    expect(Number(heading2.attributes('y'))).toBeCloseTo(481, 4)
    expect(heading2.attributes('textLength')).toBe('396')
    expect(Number(heading2.attributes('font-size'))).toBeCloseTo(17 / 0.730, 3)
    // 9 measurement ticks: 4×25px at y510, first tick centered on x281.
    const ticks = wrapper.findAll('.sf-rs-ticks rect')
    expect(ticks).toHaveLength(9)
    expect(Number(ticks[0].attributes('x'))).toBeCloseTo(279, 4)
    expect(Number(ticks[0].attributes('y'))).toBeCloseTo(510, 4)
    expect(Number(ticks[0].attributes('width'))).toBe(4)
    expect(Number(ticks[0].attributes('height'))).toBe(25)
    expect(ticks[0].attributes('fill')).toBe('#3a3b42')
    expect(Number(ticks[8].attributes('x'))).toBeCloseTo(1638.5, 4)
    // Without the props no heading rows render; panel and ticks are always present.
    const bare = mountRatioStrip(data())
    expect(bare.find('text.sf-rs-heading').exists()).toBe(false)
    expect(bare.find('text.sf-rs-heading2').exists()).toBe(false)
    expect(bare.find('rect.sf-rs-plate').exists()).toBe(true)
    expect(bare.findAll('.sf-rs-ticks rect')).toHaveLength(9)
  })

  it('renders the burst copies with stepped reveal widths for the three-burst re-flow', () => {
    const wrapper = mountRatioStrip(data())
    const bursts = wrapper.findAll('rect.sf-rs-burst')
    expect(bursts).toHaveLength(2) // burst 3 rides the final rect
    expect(bursts[0].classes()).toContain('sf-rs-burst0')
    expect(bursts[1].classes()).toContain('sf-rs-burst1')
    expect(Number(bursts[0].attributes('width'))).toBeCloseTo(480.375, 4) // 0.35 × band
    expect(Number(bursts[1].attributes('width'))).toBeCloseTo(754.875, 4) // 0.55 × band
    expect(Number(bursts[0].attributes('x'))).toBeCloseTo(760.4925, 4) // teal region's left edge
    expect(bursts[0].attributes('fill')).toBe('url(#sf-rs-field)')
    expect(bursts[1].attributes('fill')).toBe('url(#sf-rs-field)')
  })

  it('renders the mint segment at its 11.3% share and three dark chips riding the final band', () => {
    const wrapper = mountRatioStrip(data())
    const mintFinal = wrapper.findAll('rect.sf-rs-seg1')[1]
    expect(mintFinal.classes()).toContain('sf-rs-mint')
    expect(mintFinal.attributes('fill')).toBe('url(#sf-rs-field)')
    expect(Number(mintFinal.attributes('x'))).toBeCloseTo(605.4, 4)
    expect(Number(mintFinal.attributes('width'))).toBeCloseTo(155.0925, 4) // 11.3% share
    expect(Number(mintFinal.attributes('height'))).toBeCloseTo(H_FRAC * 1080, 4)
    // Three rounded #020404 chips at their settled positions, y628, 90px tall.
    const chips = wrapper.findAll('rect.sf-rs-chip')
    expect(chips).toHaveLength(3)
    expect(chips.map((c) => Number(c.attributes('x')))).toEqual([706, 944, 1278])
    expect(Number(chips[0].attributes('y'))).toBeCloseTo(628, 4)
    expect(Number(chips[0].attributes('height'))).toBe(90)
    expect(Number(chips[1].attributes('width'))).toBe(1251 - 944)
    expect(chips[0].attributes('rx')).toBe('12')
    expect(chips[0].attributes('fill')).toBe('#020404')
  })

  it('ships width-transition classes with measured delays and hidden-state snap (transition: none)', () => {
    mountRatioStrip(data())
    const css = Array.from(document.querySelectorAll('style'))
      .map((tag) => tag.textContent ?? '')
      .join('\n')

    // Revealed states: 120ms pop (click 1), measured burst eases (click 2).
    expect(css).toMatch(/\.sf-rs-seg0[^{]*\{[^}]*width 120ms/)
    expect(css).toMatch(/\.sf-rs-burst0[^{]*\{[^}]*width 700ms/)
    expect(css).toMatch(/\.sf-rs-burst1[^{]*\{[^}]*width 350ms/)
    expect(css).toMatch(/\.sf-rs-seg1[^{]*\{[^}]*width 350ms/)
    // Stepped burst delays: 0 / 1133 / 2967ms (the final copies carry 2967),
    // the mint settle after burst 3 at 3433ms, sweep 2 at 283ms.
    expect(css).toMatch(/\.sf-rs-burst1[^{]*\{[^}]*transition-delay:\s*1133ms/)
    expect(css).toMatch(/\.sf-rs-seg1[^{]*\{[^}]*transition-delay:\s*2967ms/)
    expect(css).toMatch(/\.sf-rs-mint[^{]*\{[^}]*transition-delay/)
    expect(css).toMatch(/\.sf-rs-sweep1[^{]*\{[^}]*transition-delay:\s*283ms/)
    // Hidden states: width 0 + transition none → forward reveal animates,
    // backward nav snaps (the locked decision).
    expect(css).toMatch(/\.sf-rs-build\.slidev-vclick-hidden[^{]*\.sf-rs-seg0[^{]*\{[^}]*width:\s*0/)
    expect(css).toMatch(/\.sf-rs-final\.slidev-vclick-hidden[^{]*\.sf-rs-seg1[^{]*\{[^}]*width:\s*0/)
    expect(css).toMatch(/\.sf-rs-final\.slidev-vclick-hidden[^{]*\.sf-rs-burst[^{]*\{[^}]*width:\s*0/)
    expect(css).toMatch(/\.sf-rs-final\.slidev-vclick-hidden[^{]*\.sf-rs-seg1[^{]*\{[^}]*transition:\s*none/)
    expect(css).toMatch(/\.sf-rs-text\.slidev-vclick-hidden[^{]*\.sf-rs-sweep[^{]*\{[^}]*width:\s*0/)
    expect(css).toMatch(/\.sf-rs-text\.slidev-vclick-hidden[^{]*\.sf-rs-caption[^{]*\{[^}]*transition:\s*none/)
    // Reduced motion freezes every reveal.
    expect(css).toContain('prefers-reduced-motion')
  })

  it('maps tones to gradient/palette roles: alt → red gradient, accent → accent, mint/tertiary → shared field, plain → chrome white', () => {
    const wrapper = mountRatioStrip({
      segments: [
        { id: 'alt', tone: 'alt', wFrac: 0.2 },
        { id: 'accent', tone: 'accent', wFrac: 0.2 },
        { id: 'mint', tone: 'mint', wFrac: 0.2 },
        { id: 'tert', tone: 'tertiary', wFrac: 0.2 },
        { id: 'plain', tone: 'plain', wFrac: 0.2 },
      ],
      yFrac: 0.5,
      hFrac: 0.2,
      palette: { accent: '#f7ba20', accentAlt: '#e5413f' },
    })
    const fills = wrapper.findAll('rect.sf-rs-seg1').map((r) => r.attributes('fill'))
    expect(fills).toEqual([
      'url(#sf-rs-grad-alt)',
      '#f7ba20',
      'url(#sf-rs-field)',
      'url(#sf-rs-field)',
      '#f5f4f7',
    ])
  })

  it('falls back mint/tertiary field to the band extent and renders even without a mint segment', () => {
    const wrapper = mountRatioStrip({
      segments: [{ id: 'teal', tone: 'tertiary', wFrac: 1 }],
      yFrac: 0.5,
      hFrac: 0.2,
    })
    expect(wrapper.find('rect.sf-rs-seg1').attributes('fill')).toBe('url(#sf-rs-field)')
    const field = wrapper.find('linearGradient[id="sf-rs-field"]')
    // One tertiary segment spans the whole band: the field anchors to it.
    expect(Number(field.attributes('x1'))).toBeCloseTo(276, 4)
    expect(Number(field.attributes('x2'))).toBeCloseTo(1648.5, 4)
  })

  it('renders the chip labels with the two-sweep clip reveal', () => {
    const wrapper = mountRatioStrip({ ...data(), chips: ['LATE DATA', 'DUPLICATE ROWS', 'WRONG TOTALS'] })
    const texts = wrapper.findAll('text.sf-rs-bandtext')
    expect(texts).toHaveLength(3)
    expect(texts.map((t) => t.text())).toEqual(['LATE DATA', 'DUPLICATE ROWS', 'WRONG TOTALS'])
    expect(texts.map((t) => t.attributes('fill'))).toEqual(['#21d697', '#21d697', '#21d697'])
    expect(texts.every((t) => t.attributes('font-weight') === '700')).toBe(true)
    expect(texts.map((t) => Number(t.attributes('x')))).toEqual([730, 969, 1302])
    expect(texts.every((t) => Number(t.attributes('y')) === 683)).toBe(true) // measured label baseline
    expect(Number(texts[0].attributes('font-size'))).toBeCloseTo(20 / 0.730, 3)
    expect(texts.map((t) => Number(t.attributes('textLength')))).toEqual([160, 255, 218])
    expect(texts.every((t) => t.attributes('lengthAdjust') === 'spacing')).toBe(true)
    // The clip group carries the sweep; individual labels are unclipped.
    expect(wrapper.find('g[clip-path="url(#sf-rs-band-sweep)"]').exists()).toBe(true)
    // Two sweep rects: [702→1282] then [1282→1551] — the measured split between boxes 2–3.
    const sweeps = wrapper.findAll('rect.sf-rs-sweep')
    expect(sweeps).toHaveLength(2)
    expect(Number(sweeps[0].attributes('x'))).toBeCloseTo(702, 4)
    expect(Number(sweeps[0].attributes('width'))).toBeCloseTo(580, 4)
    expect(Number(sweeps[1].attributes('x'))).toBeCloseTo(1282, 4)
    expect(Number(sweeps[1].attributes('width'))).toBeCloseTo(269, 4)
    // No chips prop → no labels, but the clip scaffolding is harmless.
    const bare = mountRatioStrip(data())
    expect(bare.find('text.sf-rs-bandtext').exists()).toBe(false)
  })

  it('renders the measured caption pair on the third click: red left + mint right', () => {
    const wrapper = mountRatioStrip({
      ...data(),
      caption: 'CONNECTING TOOLS',
      captionColor: CAPTION_COLOR,
      captionRight: 'ACTUAL DATA PROBLEMS',
    })
    const capTexts = wrapper.findAll('text.sf-rs-caption')
    expect(capTexts).toHaveLength(2)
    expect(capTexts[0].text()).toBe('CONNECTING TOOLS')
    expect(capTexts[0].attributes('fill')).toBe('#e94343') // measured red, not chrome-dim
    expect(Number(capTexts[0].attributes('x'))).toBeCloseTo(277, 4)
    expect(Number(capTexts[0].attributes('y'))).toBeCloseTo(858, 4)
    expect(Number(capTexts[0].attributes('font-size'))).toBeCloseTo(23 / 0.730, 3)
    expect(capTexts[0].attributes('textLength')).toBe('332')
    expect(capTexts[0].attributes('lengthAdjust')).toBe('spacing')
    expect(capTexts[1].text()).toBe('ACTUAL DATA PROBLEMS')
    expect(capTexts[1].attributes('fill')).toBe('#23d598') // measured mint
    expect(Number(capTexts[1].attributes('x'))).toBeCloseTo(1224, 4)
    expect(capTexts[1].attributes('textLength')).toBe('419')

    // Without the override the left caption keeps the measured red default.
    const dim = mountRatioStrip({ ...data(), caption: 'CONNECTING TOOLS' })
    expect(dim.findAll('text.sf-rs-caption')[0].attributes('fill')).toBe('#e94343')
  })

  it('renders the two-tone header: white title + chrome-green titleAccent tail at the pinned extent', () => {
    const wrapper = mountRatioStrip({ ...data(), title: 'Less time', titleAccent: 'connecting tools' })
    const header = wrapper.find('.sf-chrome-title')
    expect(header.text()).toContain('Less time')
    expect(header.text()).toContain('connecting tools')
    expect(header.html()).toContain('#66fb00')
    // The measured title ink extent rides the shared titleTextLength prop.
    expect(header.html()).toContain('textLength="1026"')
  })

  it('surfaces the layout RangeError instead of rendering blank', () => {
    expect(() => mountRatioStrip({ segments: [], yFrac: 0.5, hFrac: 0.2 })).toThrow(RangeError)
  })
})
