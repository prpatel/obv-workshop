/**
 * Pure converge-branch layout for the ConvergeFlow diagram family — the
 * user8 seg11 recording (130s–134s), rebuilt backwards from its settled
 * end state (`seg11_130s-134s/settled_1080.png` / settled_full.png, with
 * onsets.json / colors.json / report_full.json alongside).
 *
 * Crop→stage mapping (R-2): the seg11 crop is content-tight, so its content
 * bbox maps to the full 1920×1080 stage with relative layout preserved.
 * Every constant below is a fraction of the settled frame, hand-computed to
 * canvas px as x·1920 / y·1080.
 *
 * Structure (settled-frame trace this session — pixel scans + OCR of the
 * 2560×1440 source):
 *
 *   funnel ring ⌀ + cone lines + DATA ENGINEERS row + stem   (initial state)
 *         │ drops to the bar bracket
 *   ┌─[ L cyan table: outline, 2 dividers, 2×2 cell bars ]─┐   (click 1)
 *   "SQL" cyan run + gray left label                       (click 2)
 *   [ R blue rounded plate ] with two vertical through-pins
 *   and a "PIPELINES" blue text run                        (click 3)
 *   bar bracket draw + gray right label                    (click 4)
 *   footer band with rising end ticks                      (click 5)
 *
 * - Funnel assembly (bright orange — V-4 re-measure median rgb(242,87,38)
 *   = `FUNNEL_ORANGE`): a stroked ring centered (0.5000, 0.3369) r≈21px on
 *   the 1080 canvas; two lines diverging downward from (0.4906 / 0.5094,
 *   0.3569) to (0.4813 / 0.5188, 0.3875); the "DATA ENGINEERS" tracked row
 *   spanning x0.4273–0.5711 in the cap band y0.4229–0.4410 (OCR-confirmed
 *   copy); a thin stem at x0.4998 dropping from y0.4833 to the bar.
 *   PRESENT FROM f0001 — the clip opens mid-state (R-5), so the family
 *   renders the funnel in the initial state; it never animates. Settled
 *   stroke ≈4.2px (per-column stem histograms), thicker than the old 2.5px.
 * - Bar bracket (dim orange — V-4: median rgb(191,82,28) = `BAR_ORANGE`):
 *   a 4.5px line centered y549 spanning x0.3102–0.6895 with two 5px feet
 *   hanging to y0.5382 at the ends, plus the stem meeting center. f15
 *   evidence: the stem drops first (f0039 ≈ t2.57), then the line sweeps
 *   left→right (f0041–f0044, complete ≈ t2.93) — a stroke draw, not a fade.
 * - Left cyan table [0.2836, 0.5799 → 0.3379, 0.6569]: stroked outline
 *   (≈5px), TWO interior dividers (y≈653 and y≈680, ≈5.5px full-width
 *   bands) splitting three cells — top cell empty, lower two cells each
 *   carrying a pair of ≈5.5×20px vertical bars at x≈578.75/611.75 (the
 *   settled frame's cell glyphs; OCR finds no text — they render as bars).
 * - "SQL" cyan run under the table: ink x553–641.5, cap band y761–791.5
 *   (OCR-confirmed copy, tracked wide). The old stroked lower box does not
 *   exist in the settled frame — it is bare text.
 * - Right blue column: a ROUNDED plate (outer x1268–1376.5, y644–690.5,
 *   ≈6.5px stroke, r≈6.5) with TWO vertical through-pins (x≈1288/1357,
 *   ≈6.5px) crossing the plate from y634.5 to y699.5 — the settled frame
 *   reads as a plug/junction, not a text box; the old "DWH" copy is gone.
 * - "PIPELINES" blue text run: ink x1207–1441, cap band y760.5–791.5
 *   (OCR-confirmed). The old row of six small stroked boxes was a
 *   mis-read of these tracked glyphs — it is one text run.
 * - Base labels (settled ink rgb(167,166,171) = `LABEL_GRAY` — NOT white):
 *   left "QUERIES DRAFTED IN SECONDS" ink x0.2145–0.4066, right "WHAT MOVES
 *   THE DATA EVERY DAY" ink x0.5800–0.7957, cap band y0.7625–0.7799.
 * - Title (chrome-green lead first): green "SQL" ink x402–556 over the
 *   white lowercase tail "and pipelines still matter" ink x573–1521; the
 *   tail sits on its own baseline (x-height band y≈118.5–156.5, baseline
 *   ≈156.5) — see ConvergeFlow.vue's title tokens.
 * - Footer: solid rgb(64,63,66) = `FOOTER_GRAY` band x0.1934–0.8063,
 *   y0.8410–0.8451, with short end ticks rising to y0.8035 at both ends.
 *
 * Beat schedule (re-pinned from onsets.json + the f15 dumps; 15fps):
 *   [0.933, 1.533, 2.2, 2.533, 3.067] —
 *   1 left table (outline, then dividers ≈+130ms, cell bars ≈+200ms) ·
 *   2 "SQL" + left label (label ≈+130ms) · 3 right plate + pins (+≈70ms)
 *   + "PIPELINES" (≈+200ms) · 4 right label + bar draw · 5 footer.
 *
 * All functions here are pure and deterministic (byte-identical output for
 * the same inputs) and touch no DOM, so the module is SSR-safe.
 */

import type { StepFlowPaletteOverride } from './palettes'

/** A stroked rectangle, canvas px. */
export interface ConvergeBox {
  x: number
  y: number
  w: number
  h: number
}

/** A filled rectangle, canvas px (dividers, cell bars). */
export interface ConvergeRect {
  x: number
  y: number
  w: number
  h: number
}

/** A two-point stroke, canvas px. */
export interface ConvergeLine {
  x1: number
  y1: number
  x2: number
  y2: number
}

/** A measured text run: pinned ink extent + cap band, canvas px. */
export interface ConvergeRun {
  x: number
  baseline: number
  capHeight: number
  width: number
}

/** One glyph of a proportional-face run, pinned to its measured ink box. */
export interface ConvergeChar {
  char: string
  x: number
  width: number
}

/** One SVG path for the dashoffset draw pattern, with its analytic length. */
export interface ConvergeDrawPath {
  d: string
  len: number
}

export interface ConvergeLayout {
  viewBox: { width: number; height: number }
  /** The funnel assembly — initial state, never animated (clip opens mid-state). */
  funnel: {
    ring: { cx: number; cy: number; r: number }
    cone: { left: ConvergeLine; right: ConvergeLine }
    label: ConvergeRun
    stem: { x: number; y1: number; y2: number }
  }
  /** The bar bracket: line + hanging end feet (draws on click 4). */
  bar: ConvergeBox & { footW: number; footBottom: number }
  columns: {
    /** The left cyan table: stroked outline plus its interior ink. */
    left: ConvergeBox
    leftTable: {
      /** Full-width divider bands splitting the three cells (y≈653/680). */
      dividers: ConvergeRect[]
      /** The two vertical-bar glyph pairs in cells 2 and 3. */
      bars: ConvergeRect[]
    }
    right: {
      /** Stroked rounded plate, centerline rect (stroke renders half in/out). */
      plate: ConvergeBox & { rx: number }
      /** Two vertical through-pins crossing the plate (extend past it). */
      pins: { x1: number; x2: number; top: number; bottom: number; width: number }
      /** Two plate-height vertical bars inside the plate (the settled frame
       * shows four blue strokes: pins poke out, these stop at the walls). */
      slots: { x1: number; x2: number; top: number; bottom: number; width: number }
    }
  }
  /** The bare "SQL" cyan run under the left table and the blue "PIPELINES" run. */
  textRuns: { leftLower: ConvergeRun; slab: ConvergeRun }
  /** The gray base labels' measured ink runs and cap band. */
  labels: { left: ConvergeRun; right: ConvergeRun }
  /** Per-character ink boxes for the runs the recording sets in a
   * PROPORTIONAL face (settled-frame glyph clusters): the ref 'I' pitch is
   * 15px while 'P' is 31px, so a mono run-level pin cannot reproduce the
   * rhythm. Chars carry the seed's non-space glyphs in order. */
  charRuns: {
    pipelines: ConvergeChar[]
    titleTail: ConvergeChar[]
  }
  footer: { x: number; y: number; w: number; h: number; tickTop: number; tickW: number }
}

export interface ConvergeOptions {
  width?: number
  height?: number
}

/** Zip a seed run's non-space glyphs with their measured ink boxes. The
 * recording sets these runs in a proportional face, so each glyph carries its
 * own measured [x, width]; a length mismatch means the seed copy drifted from
 * the settled frame and must not render pinned. */
function charBoxes(
  text: string,
  boxes: ReadonlyArray<readonly [number, number]>,
  width: number,
  label: string,
): ConvergeChar[] {
  const glyphs = [...text].filter((c) => c !== ' ')
  if (glyphs.length !== boxes.length) {
    throw new RangeError(
      `${label}: ${boxes.length} measured glyph boxes vs ${glyphs.length} non-space glyphs in the seed`,
    )
  }
  // value × (width/1920) keeps the default 1920 canvas bit-exact
  // ((31/1920)×1920 picks up a 1-ulp float error; 31×1.0 does not).
  const scale = width / 1920
  return glyphs.map((char, i) => ({
    char,
    x: boxes[i]![0] * scale,
    width: boxes[i]![1] * scale,
  }))
}

/**
 * Measured constants, fractions of the 1920×1080 stage canvas (settled-frame
 * px ÷ 1920 or ÷ 1080). Names match the structure above; boxes are [x, y, w, h].
 */
const M = {
  ringCx: 0.5,
  ringCy: 0.33685,
  ringR: 0.0109375,
  coneTopLY: 0.3569,
  coneBotLY: 0.3875,
  coneLX1: 0.4906,
  coneLX2: 0.4813,
  coneRX1: 0.5094,
  coneRX2: 0.5188,
  funnelLabelX: 0.4273,
  funnelLabelW: 0.1438,
  funnelLabelCapTop: 0.4229,
  funnelLabelCapH: 0.0181,
  stemX: 0.4998,
  stemTop: 0.4833,
  lineTop: 0.50625,
  lineH: 0.004166666666666667,
  barX: 0.3102,
  barW: 0.3793,
  footW: 0.002604166666666667,
  footBottom: 0.5382,
  leftMain: [547 / 1920, 628 / 1080, 98 / 1920, 79 / 1080] as const,
  dividerX: 0.28333333333333333,
  dividerW: 0.05416666666666667,
  divider1Y: 0.6046296296296297,
  divider2Y: 0.6296296296296297,
  dividerH: 0.005555555555555556,
  barX1: 578.75 / 1920,
  barX2: 0.3186197916666667,
  barW2: 5.5 / 1920,
  cell2Y: 0.6099537037037037,
  cell2H: 20.5 / 1080,
  cell3Y: 0.6349537037037037,
  cell3H: 17.25 / 1080,
  plate: [1271 / 1920, 0.6, 103 / 1920, 39 / 1080] as const,
  plateRx: 6.5,
  pinX1: 0.6708333333333333,
  pinX2: 1357 / 1920,
  pinTop: 636 / 1080,
  pinBottom: 699.5 / 1080,
  pinW: 0.003385416666666667,
  slotX1: 1300.5 / 1920,
  slotX2: 1339.5 / 1920,
  slotTop: 645 / 1080,
  slotBottom: 690 / 1080,
  slotW: 0.003125,
  leftLowerRun: [0.2880208333333333, 0.7328703703703704, 0.02824074074074074, 0.04609375] as const,
  slabRun: [0.6286458333333333, 0.7328703703703704, 0.028703703703703703, 0.121875] as const,
  // Proportional-face glyph boxes, [x, width] px at 1920 (settled-frame
  // connected components; merged clusters split by glyph count).
  pipelineChars: [
    [1207, 29], [1238, 11], [1253, 29], [1284, 26], [1312, 25],
    [1338, 11], [1353, 30], [1387, 26], [1414, 27],
  ] as const,
  titleTailChars: [
    [573, 45], [620, 48], [670, 49], [741, 49], [789, 22], [812, 50],
    [866, 61], [928, 22], [951, 22], [975, 24], [1000, 46], [1050, 38],
    [1105, 48], [1152, 47], [1200, 19], [1222, 18], [1262, 19], [1288, 47],
    [1336, 39], [1378, 38], [1419, 32], [1452, 38], [1491, 31],
  ] as const,
  leftLabel: [0.2145, 0.1921] as const,
  rightLabel: [0.58, 0.2157] as const,
  labelCapTop: 0.7625,
  labelCapH: 17.1 / 1080,
  labelBaseline: 840.5 / 1080,
  footer: [0.1934, 0.841, 0.6129, 0.0041] as const,
  footerTickTop: 0.8035,
  footerTickW: 0.0023,
} as const

/**
 * Bright funnel orange — V-4 re-measure: settled-frame median rgb(242,87,38).
 * The #f85721 token's hue family, but the funnel is the BRIGHT member of the
 * pair; see BAR_ORANGE for the dim one.
 */
export const FUNNEL_ORANGE = '#f25726'

/**
 * V-4 LOCKED DECISION — the bar bracket's settled tone, re-measured from the
 * seg11 settled-frame pixels at rgb(191,82,28), dimmer than the #f85721
 * token. Do not substitute the token or FUNNEL_ORANGE at bar call sites.
 */
export const BAR_ORANGE = '#bf521c'

/**
 * Base-label ink: settled-frame modal rgb(167,166,171) — the labels are DIM
 * GRAY in the recording, a notch under deck white (#f5f4f7 measures ~85
 * points brighter and over-exposes the band).
 */
export const LABEL_GRAY = '#a7a6ab'

/** Footer band + end ticks, settled median rgb(64,63,66). */
export const FOOTER_GRAY = '#403f42'

/**
 * Family palette roles: the right column is the settled bright blue
 * (median rgb(55,153,251), the seg01 settled blue family); the left column
 * rides the deck's cyan role (settled median rgb(34,206,229), colors.json
 * events #22cee6/#23cde4/#26cce3). Orange tones are family constants above,
 * not palette fields — they re-measured to their own dim/bright pair.
 */
export const convergePalette: StepFlowPaletteOverride = {
  accent: '#3799fb',
  accentTertiary: '#22cee5',
}

/**
 * Seed content OCR-confirmed off the settled frame (tesseract on the
 * 2560×1440 source): the two-tone title (green 'SQL' lead over the white
 * lowercase tail), the two gray base labels, the funnel row, and the two
 * colored text runs. The left table's cells render as measured bars (no
 * legible text at native resolution); the right plate carries no text.
 */
export const CONVERGE_SEED = {
  titleAccent: 'SQL',
  title: 'and pipelines still matter',
  labels: { left: 'QUERIES DRAFTED IN SECONDS', right: 'WHAT MOVES THE DATA EVERY DAY' },
  funnelLabel: 'DATA ENGINEERS',
  leftLowerText: 'SQL',
  slabText: 'PIPELINES',
} as const

/**
 * The five pinned beat onsets (seconds into seg11) — one per reveal click,
 * re-pinned from onsets.json: 0.933 left table, 1.533 SQL + left label,
 * 2.2 right plate (pins +0.067, PIPELINES +0.2), 2.533 right label + bar
 * draw (line sweep 2.667), 3.067 footer.
 */
export const CONVERGE_BEAT_SCHEDULE = [0.933, 1.533, 2.2, 2.533, 3.067] as const

/** Build the measured converge layout on a 1920×1080 canvas by default. */
export function convergeLayout(opts: ConvergeOptions = {}): ConvergeLayout {
  const { width = 1920, height = 1080 } = opts
  if (!(width > 0) || !(height > 0)) {
    throw new RangeError(`width and height must be positive, received ${width}×${height}`)
  }

  const lineBottom = M.lineTop + M.lineH
  // Strokes are drawn on their centerlines; the feet hang from the line's
  // bottom edge to footBottom (report red[0]'s y-extent).

  return {
    viewBox: { width, height },
    funnel: {
      ring: { cx: M.ringCx * width, cy: M.ringCy * height, r: M.ringR * width },
      cone: {
        left: { x1: M.coneLX1 * width, y1: M.coneTopLY * height, x2: M.coneLX2 * width, y2: M.coneBotLY * height },
        right: { x1: M.coneRX1 * width, y1: M.coneTopLY * height, x2: M.coneRX2 * width, y2: M.coneBotLY * height },
      },
      label: {
        x: M.funnelLabelX * width,
        width: M.funnelLabelW * width,
        capHeight: M.funnelLabelCapH * height,
        baseline: (M.funnelLabelCapTop + M.funnelLabelCapH) * height,
      },
      stem: { x: M.stemX * width, y1: M.stemTop * height, y2: lineBottom * height },
    },
    bar: {
      x: M.barX * width,
      y: M.lineTop * height,
      w: M.barW * width,
      h: M.lineH * height,
      footW: M.footW * width,
      footBottom: M.footBottom * height,
    },
    columns: {
      left: { x: M.leftMain[0] * width, y: M.leftMain[1] * height, w: M.leftMain[2] * width, h: M.leftMain[3] * height },
      leftTable: {
        dividers: [
          { x: M.dividerX * width, y: M.divider1Y * height, w: M.dividerW * width, h: M.dividerH * height },
          { x: M.dividerX * width, y: M.divider2Y * height, w: M.dividerW * width, h: M.dividerH * height },
        ],
        bars: [
          { x: M.barX1 * width, y: M.cell2Y * height, w: M.barW2 * width, h: M.cell2H * height },
          { x: M.barX2 * width, y: M.cell2Y * height, w: M.barW2 * width, h: M.cell2H * height },
          { x: M.barX1 * width, y: M.cell3Y * height, w: M.barW2 * width, h: M.cell3H * height },
          { x: M.barX2 * width, y: M.cell3Y * height, w: M.barW2 * width, h: M.cell3H * height },
        ],
      },
      right: {
        plate: {
          x: M.plate[0] * width,
          y: M.plate[1] * height,
          w: M.plate[2] * width,
          h: M.plate[3] * height,
          rx: M.plateRx,
        },
        pins: {
          x1: M.pinX1 * width,
          x2: M.pinX2 * width,
          top: M.pinTop * height,
          bottom: M.pinBottom * height,
          width: M.pinW * width,
        },
        slots: {
          x1: M.slotX1 * width,
          x2: M.slotX2 * width,
          top: M.slotTop * height,
          bottom: M.slotBottom * height,
          width: M.slotW * width,
        },
      },
    },
    textRuns: {
      leftLower: {
        x: M.leftLowerRun[0] * width,
        baseline: M.leftLowerRun[1] * height,
        capHeight: M.leftLowerRun[2] * height,
        width: M.leftLowerRun[3] * width,
      },
      slab: {
        x: M.slabRun[0] * width,
        baseline: M.slabRun[1] * height,
        capHeight: M.slabRun[2] * height,
        width: M.slabRun[3] * width,
      },
    },
    labels: {
      left: {
        x: M.leftLabel[0] * width,
        width: M.leftLabel[1] * width,
        capHeight: M.labelCapH * height,
        baseline: M.labelBaseline * height,
      },
      right: {
        x: M.rightLabel[0] * width,
        width: M.rightLabel[1] * width,
        capHeight: M.labelCapH * height,
        baseline: M.labelBaseline * height,
      },
    },
    charRuns: {
      pipelines: charBoxes(CONVERGE_SEED.slabText, M.pipelineChars, width, 'PIPELINES'),
      titleTail: charBoxes(CONVERGE_SEED.title, M.titleTailChars, width, 'title tail'),
    },
    footer: {
      x: M.footer[0] * width,
      y: M.footer[1] * height,
      w: M.footer[2] * width,
      h: M.footer[3] * height,
      tickTop: M.footerTickTop * height,
      tickW: M.footerTickW * width,
    },
  }
}

/**
 * The two dashoffset draw paths for the bar bracket, in f15 draw order:
 * the stem drops first (≈140ms), then the bracket draws as one path —
 * left foot rises, the line sweeps left→right, the right foot drops
 * (≈220ms). Analytic lengths pair with `--sf-len` in the component.
 */
export function convergeDrawPaths(l: ConvergeLayout): { stem: ConvergeDrawPath; bracket: ConvergeDrawPath } {
  const { funnel, bar } = l
  const lineCenterY = bar.y + bar.h / 2
  const stemLen = lineCenterY - funnel.stem.y1
  const footLen = bar.footBottom - lineCenterY
  // Coordinates render at fixed 6-decimal precision so the path strings are
  // byte-identical across runs despite float accumulation in x+w.
  const c = (v: number): string => v.toFixed(6).replace(/\.0+$|(\.\d*?)0+$/, '$1')
  return {
    stem: {
      d: `M ${c(funnel.stem.x)} ${c(funnel.stem.y1)} L ${c(funnel.stem.x)} ${c(lineCenterY)}`,
      len: stemLen,
    },
    bracket: {
      d:
        `M ${c(bar.x)} ${c(bar.footBottom)} L ${c(bar.x)} ${c(lineCenterY)} ` +
        `L ${c(bar.x + bar.w)} ${c(lineCenterY)} L ${c(bar.x + bar.w)} ${c(bar.footBottom)}`,
      len: footLen * 2 + bar.w,
    },
  }
}
