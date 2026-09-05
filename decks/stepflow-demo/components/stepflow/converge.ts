/**
 * Pure converge-branch layout for the ConvergeFlow diagram family — the
 * user8 seg11 recording (130s–134s), measured on its settled frame
 * (2560×1440; `user8-analysis/seg11_130s-134s/settled.png`, report.json and
 * the f15 dumps alongside).
 *
 * Crop→stage mapping (R-2): the seg11 crop is content-tight, so its content
 * bbox maps to the full 1920×1080 stage with relative layout preserved.
 * Every constant below is a fraction of the settled frame, hand-computed to
 * canvas px as x·1920 / y·1080.
 *
 * Structure (traced this session on settled.png + report.json's seg11
 * structure):
 *
 *   funnel ring ⌀ + cone lines + tick row + stem   (initial state)
 *         │ drops to the bar bracket
 *   └─[ L cyan column ]        [ R blue column ]   (clicks 1–3)
 *   left label        right label                  (clicks 2 & 4)
 *   footer band with rising end ticks              (click 5)
 *
 * - Funnel assembly (bright orange — V-4 re-measure median rgb(242,87,38)
 *   = `FUNNEL_ORANGE`): a stroked ring centered (0.5000, 0.3369) r≈21px on
 *   the 1080 canvas; two lines diverging downward from (0.4906 / 0.5094,
 *   0.3569) to (0.4813 / 0.5188, 0.3875); an orange tick row spanning
 *   x0.4273–0.5711 in the cap band y0.4229–0.4410; a thin stem at x0.4998
 *   dropping from y0.4833 to the bar. PRESENT FROM f0001 — the clip opens
 *   mid-state (R-5), so the family renders the funnel in the initial
 *   state; it never animates.
 * - Bar bracket (dim orange — V-4: median rgb(191,82,28) = `BAR_ORANGE`,
 *   NOT the #f85721 token; report red[0] bbox [0.3102, 0.4833, 0.6895,
 *   0.5382]): a 3px line y0.508–0.511 spanning x0.3102–0.6895 with two
 *   feet hanging to y0.5382 at the ends, plus the stem meeting center.
 *   f15 evidence: the stem drops first (f0039 ≈ t2.60), then the line
 *   sweeps left→right (f0041–f0044, complete ≈ t2.93) — a stroke draw,
 *   not a fade.
 * - Columns: cyan left — main box [0.2836, 0.5799 → 0.3379, 0.6569] plus
 *   lower box [0.2883, 0.7049 → 0.3340, 0.7396]; blue right — main box
 *   [0.6605, 0.5889 → 0.7172, 0.6479] plus a row of SIX small boxes
 *   across [0.6289, 0.7049 → 0.7500, 0.7326]. The brief's "blue column,
 *   double height" wording is artifact shorthand — the measured boxes
 *   above win.
 * - Base labels (white, cap band y0.7625–0.7799): left ink x0.2145–0.4066,
 *   right ink x0.5800–0.7957 — the brief's "white base bar" is a text row,
 *   not a fill.
 * - Footer: solid rgb(64,63,66) = `FOOTER_GRAY` band x0.1934–0.8063,
 *   y0.8410–0.8451, with short end ticks rising to y0.8035 at both ends.
 *
 * Beat schedule (pinned from the f15 dumps; 15fps ≈ 66.7ms/frame):
 *   [1.07, 1.53, 2.20, 2.60, 3.07] —
 *   1 left main box · 2 left lower box + left label · 3 right column ·
 *   4 bar draw + right label · 5 footer.
 * The draft's bar beat 2.67 moves to 2.60: the stem is already present at
 * f0039 (the report's event trace misses the thin stem at that class).
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

/** A two-point stroke, canvas px. */
export interface ConvergeLine {
  x1: number
  y1: number
  x2: number
  y2: number
}

/** A white base label's measured ink run and cap band, canvas px. */
export interface ConvergeLabel {
  x: number
  baseline: number
  capHeight: number
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
    label: ConvergeLabel
    stem: { x: number; y1: number; y2: number }
  }
  /** The bar bracket: line + hanging end feet (draws on click 4). */
  bar: ConvergeBox & { footW: number; footBottom: number }
  columns: {
    left: ConvergeBox
    leftLower: ConvergeBox
    right: ConvergeBox
    /** The measured row of six small boxes across the right column's base. */
    rightRow: ConvergeBox[]
  }
  labels: { left: ConvergeLabel; right: ConvergeLabel }
  footer: { x: number; y: number; w: number; h: number; tickTop: number; tickW: number }
}

export interface ConvergeOptions {
  width?: number
  height?: number
  /** Number of small boxes in the right column's base row (measured: 6). */
  rightRowCount?: number
}

/**
 * Measured constants, fractions of the 2560×1440 settled frame. Names match
 * the structure above; boxes are [x, y, w, h].
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
  lineTop: 0.508,
  lineH: 0.003,
  barX: 0.3102,
  barW: 0.3793,
  footW: 0.0016,
  footBottom: 0.5382,
  leftMain: [0.2836, 0.5799, 0.0543, 0.077] as const,
  leftLower: [0.2883, 0.7049, 0.0457, 0.0347] as const,
  rightMain: [0.6605, 0.5889, 0.0567, 0.059] as const,
  rightRow: [0.6289, 0.7049, 0.1211, 0.0277] as const,
  rightRowBoxW: 0.0145,
  leftLabel: [0.2145, 0.1921] as const,
  rightLabel: [0.58, 0.2157] as const,
  labelCapTop: 0.7625,
  labelCapH: 0.0174,
  labelBaseline: 0.777,
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

/** Base-label white (deck canvas white, per the settled frame). */
export const LABEL_WHITE = '#f5f4f7'

/** Footer band + end ticks, settled median rgb(64,63,66). */
export const FOOTER_GRAY = '#403f42'

/**
 * Family palette roles: the right column is the measured main-box blue
 * (median rgb(60,150,244)); the left column rides the deck's cyan role
 * (settled median rgb(34,206,229)). Orange tones are family constants
 * above, not palette fields — they re-measured to their own dim/bright pair.
 */
export const convergePalette: StepFlowPaletteOverride = {
  accent: '#3c96f4',
  accentTertiary: '#22cee5',
}

/**
 * Seed content read from the settled frame: the two-tone title (chrome-green
 * 'ETL' lead — three glyphs at the measured 153px ink run — over the white
 * tail), the two base labels, and the funnel tick row. In-box glyph rows are
 * sub-resolution at native 1080p and stay prop-driven; tick identities are
 * low-confidence (the row's geometry is exact, its copy is provisional —
 * the integration pass may refine it).
 */
export const CONVERGE_SEED = {
  titleAccent: 'ETL',
  title: 'EVERYTHING CONVERGES',
  labels: { left: 'CI logs', right: 'PDF export' },
  funnelLabel: '1.0 1.1 1.2 1.3 1.4 1.5 1.6 1.7 1.8',
  rightBoxText: 'DWH',
} as const

/**
 * The five pinned beat onsets (seconds into seg11) — one per reveal click.
 * The schedule lands with the slide in the integration PR (AutoAdvance
 * seed); the click mapping here is 1:1 with the component's v-click indexes.
 */
export const CONVERGE_BEAT_SCHEDULE = [1.07, 1.53, 2.2, 2.6, 3.07] as const

/** Build the measured converge layout on a 1920×1080 canvas by default. */
export function convergeLayout(opts: ConvergeOptions = {}): ConvergeLayout {
  const { width = 1920, height = 1080, rightRowCount = 6 } = opts
  if (!(width > 0) || !(height > 0)) {
    throw new RangeError(`width and height must be positive, received ${width}×${height}`)
  }
  if (!Number.isInteger(rightRowCount) || rightRowCount < 1) {
    throw new RangeError(`rightRowCount must be a positive integer, received ${rightRowCount}`)
  }

  const lineBottom = M.lineTop + M.lineH
  // Strokes are drawn on their centerlines; the feet hang from the line's
  // bottom edge to footBottom (report red[0]'s y-extent).
  const rightRowGap = (M.rightRow[2] * width - rightRowCount * M.rightRowBoxW * width) / (rightRowCount - 1 || 1)

  const rightRow: ConvergeBox[] = Array.from({ length: rightRowCount }, (_, i) => ({
    x: M.rightRow[0] * width + i * (M.rightRowBoxW * width + rightRowGap),
    y: M.rightRow[1] * height,
    w: M.rightRowBoxW * width,
    h: M.rightRow[3] * height,
  }))

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
      leftLower: { x: M.leftLower[0] * width, y: M.leftLower[1] * height, w: M.leftLower[2] * width, h: M.leftLower[3] * height },
      right: { x: M.rightMain[0] * width, y: M.rightMain[1] * height, w: M.rightMain[2] * width, h: M.rightMain[3] * height },
      rightRow,
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
