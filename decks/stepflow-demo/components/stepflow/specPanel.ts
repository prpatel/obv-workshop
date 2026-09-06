/**
 * Pure layout for the SpecPanel diagram family — the seg14 source (2560×1440,
 * 105 f15 dumps + settled frame), measured from the settled-truth packet
 * (fl_KbQNQoum: settled_full.png / settled_1080.png / onsets.json /
 * colors.json / report_full.json) plus settled-frame pixel and OCR reads.
 *
 * SCENE. One huge near-black plate (settled fill #0f0e11, luma ≈14 — a dim
 * plate on the black canvas, not a gray card) carrying a progressive build:
 *
 *   - a window-chrome status row (traffic dots + dim mono path text + a teal
 *     `<zap> AI ASSISTED` cluster on the right),
 *   - a wide-tracked dim heading, then a white cursor-over-square icon with
 *     its bright line and a dim second line (the red group),
 *   - a red edge strip beside that group,
 *   - a teal edge strip + teal smile tile (teal ring, eyes + smile) with a
 *     bright line and a dim closing line (the teal group).
 *
 * The two-tone title ("Using it" white / "properly" chrome green) sits above
 * the plate, centered like every family.
 *
 * R-2 CROP MAPPING. The seg14 crop frames the full 16:9 slide — the title
 * band and plate margins read as full-frame fractions, so crop fractions map
 * 1:1 to stage fractions (×1920 / ×1080 on the default viewBox).
 *
 * R-4 ROW REVEAL — FADE, NOT TYPEWRITER (decided from the f15 dumps). Every
 * row arrives at its full x-extent within ONE 66.7 ms frame and ramps pixels
 * over the following 2–4 frames — an opacity fade of ~200–270 ms. A
 * typewriter would march the x-extent rightward frame by frame; here it is
 * stable from onset.
 *
 * BEAT MODEL (7 clicks, onsets pinned to the report's event times — 15 fps
 * ≈ ±66.7 ms). Sub-beats ride the click whose press window they fall in:
 *
 *   click 1  t0.467  plate dim wave (fill fades to luma ≈3.8)
 *   click 2  t0.600  plate full wave (t0.533) + status row + traffic dots +
 *                    teal cluster (t0.6–0.667) + heading (t0.867, +267 ms)
 *   click 3  t2.000  cursor-square icon (t1.933) + its bright line (t2.0)
 *   click 4  t3.133  red edge strip (red t3.133 → orange t3.2, settles
 *                    rgb(236,65,63)) + its dim line (t3.467, +334 ms)
 *   click 5  t4.467  teal smile tile (t4.467) + teal strip (t4.667, +200 ms)
 *   click 6  t5.067  the bright teal statement line
 *   click 7  t6.533  the dim closing line
 *
 * The heading's reference onset is t0.867 — a sub-beat of the t0.600 press,
 * not the t2.000 press; it renders 267 ms after click 2 so the deck timeline
 * matches the recording frame for frame.
 *
 * CONTENT. Copy is OCR-read from the settled frame (readable at 3–4× with
 * thresholding): status `data.mrk.shop/workspace`, cluster `AI ASSISTED`
 * behind a chevron-bolt mark, heading `THE IMPORTANT SKILL`, body group
 * `USING AN AI TOOL` / `ANYONE CAN OPEN THE PANEL`, teal group `USING IT
 * PROPERLY` / `KNOWING WHEN THE OUTPUT IS WRONG`. Per-row ink tones are
 * measured medians: bright #f5f4f7, dim #a5a5ad (closing #9c9ba1), teal
 * #2ac898 — the reference alternates tone per row, so tone is data, not a
 * family default.
 *
 * All functions here are pure and deterministic: same inputs produce
 * byte-identical output, and nothing touches the DOM (SSR-safe build).
 */

/** One measured ink box in viewBox units (fractions × 1920 / × 1080). */
export interface SpecBox {
  x: number
  y: number
  w: number
  h: number
}

/** Tone of one row's ink — measured settles, never palette guesses. */
export type SpecRowTone = 'bright' | 'dim' | 'teal'

/** One fading text row of the panel build. */
export interface SpecRow {
  /** Stable key — test selectors and a11y. */
  id: string
  /** Measured ink box (viewBox units); `cap` is the row's cap band. */
  box: SpecBox
  /** 1-based click that fades this row in. */
  click: number
  /** Transition delay inside the click window (ms) — sub-beat ordering. */
  delayMs: number
  tone: SpecRowTone
  /** Cap height (viewBox units) — the measured band height. */
  cap: number
  /** Faux-bold stroke (viewBox units) painted on the row's own fill. The
   * recording's face is heavier than any bundled JetBrains Mono weight —
   * its tall rows measure ~12.8px stems vs ~6.5px for JBM Bold, with
   * near-closed counters — so each row carries the stroke width that matches
   * its measured ink density, interpolated from two calibration renders (0
   * renders the plain face). */
  strokePx: number
  /** Bundled JetBrains Mono weight for the row — measured per element: the
   * teal status cluster matches Regular 400 ink; every other row is Bold 700. */
  weight: 400 | 500 | 700
  /** Measured per-word ink spans. The recording's word gaps deviate from a
   * uniform mono advance (its face is narrower per height), so each word is
   * pinned to its own measured extent instead of one row-wide stretch.
   * Word count always matches the seed copy's space-split. */
  words: readonly SpecWordSpan[]
  /** Measured vertical offset (viewBox units) from the shared baseline rule:
   * cross-correlated row-ink lags against the settled frame (status −2px,
   * teal cluster +2px, teal/closing lines −1px at 1080). */
  yNudge: number
}

/** One word's measured ink span (viewBox units), y-band shared with the row. */
export interface SpecWordSpan {
  box: SpecBox
}

/** What an accent renders as. Strips are solid rects; the two glyph marks
 * draw their measured shapes (cursor-over-square icon, teal smile tile). */
export type SpecAccentKind = 'strip' | 'cursorSquare' | 'smileTile'

/** One edge accent or glyph mark on its own beat. */
export interface SpecAccent {
  id: string
  box: SpecBox
  click: number
  delayMs: number
  kind: SpecAccentKind
  /** Inner glyph box (smileTile only) — the eyes+smile cluster. */
  glyph?: SpecBox
}

/** The two-tone title's measured chrome constants (viewBox units). */
export interface SpecTitle {
  capTop: number
  capHeight: number
  centerX: number
  inkWidth: number
}

export interface SpecPanelLayout {
  /** The huge near-black plate. */
  plate: SpecBox
  /** Opacity of the click-1 dim wave over the black canvas (luma 3.78 / 14). */
  plateDimOpacity: number
  rows: SpecRow[]
  accents: SpecAccent[]
  /** Row-1 traffic dots (measured window chrome), click 2. */
  dots: { id: string; cx: number; cy: number; r: number; click: number }[]
  /** The `<zap>` mark leading the status row's teal cluster (click 2). */
  statusGlyph: SpecBox
  title: SpecTitle
  viewBox: { width: number; height: number }
}

export interface SpecPanelOptions {
  /** ViewBox width in user units. Default 1920. */
  width?: number
  /** ViewBox height in user units. Default 1080. */
  height?: number
}

/** Slide-level beat schedule (seconds from run start, one entry per click) —
 * the AutoAdvance `step-schedule-sec` for the seg14 slide, pinned to the
 * packet onsets. */
export const STEP_SCHEDULE_SEC = [0.47, 0.6, 2.0, 3.13, 4.47, 5.07, 6.53] as const

/** Total clicks the seg14 build spends — the schedule must cover every beat. */
export const SPEC_PANEL_CLICKS = 7

/** Cap-height ratio of the deck's mono face (chrome.ts convention). */
const CAP_RATIO = 0.73

/** Measured constants — fractions of the 2560×1440 seg14 frame (settled-frame
 * ink bboxes + report.json events). The default viewBox maps them 1:1 (R-2). */
const F = {
  plate: [0.1156, 0.3083, 0.8828, 0.8514],
  // Status path text: ascender band top to baseline (23 mono chars over the
  // measured width give a 0.82 advance/cap ratio — plain JetBrains Mono).
  statusText: [0.1922, 0.3477, 0.3688, 0.3643],
  // `AI ASSISTED` text run right of the chevron-bolt mark.
  statusTealText: [0.775, 0.3509, 0.8625, 0.3681],
  // The `<zap>` mark leading the teal cluster.
  statusTealGlyph: [0.7426, 0.3417, 0.773, 0.3688],
  heading: [0.1714, 0.4454, 0.4167, 0.4657],
  // White cursor-over-square icon left of the body line.
  bodyIcon: [0.1727, 0.5208, 0.223, 0.6042],
  bodyLine: [0.2432, 0.5352, 0.4813, 0.5667],
  redLine: [0.2427, 0.5917, 0.462, 0.6083],
  tealLine: [0.2432, 0.6944, 0.499, 0.7259],
  lastLine: [0.2432, 0.75, 0.5234, 0.7667],
  redStrip: [0.1434, 0.5097, 0.1504, 0.6285],
  tealStrip: [0.1434, 0.6688, 0.1504, 0.7875],
  tealTile: [0.1719, 0.6979, 0.2238, 0.7583],
  // Eyes+smile cluster centered in the tile ring.
  tealGlyph: [0.1891, 0.7125, 0.2066, 0.7438],
  dotRed: [0.1344, 0.35, 0.1426, 0.3632],
  dotAmber: [0.15, 0.35, 0.1566, 0.3632],
  dotGreen: [0.1645, 0.35, 0.1719, 0.3632],
  // Title: measured U-top to baseline ("Using it" — cap 0.0593 of frame
  // height); the ink run spans white lead + green tail.
  title: { capTop: 0.0907, capBottom: 0.15, left: 0.3365, right: 0.6672 },
  // Plate-region mean luma of the dim wave (f0008) over the settled fill
  // (#0f0e11 → luma 14.6): 3.78 / 14.6 ≈ 0.26 — pinned to the packet's 0.27.
  plateDimOpacity: 0.27,
} as const

function box(f: readonly number[], width: number, height: number): SpecBox {
  return {
    x: f[0] * width,
    y: f[1] * height,
    w: (f[2] - f[0]) * width,
    h: (f[3] - f[1]) * height,
  }
}

/**
 * Resolve the full render layout for the seg14 spec panel. Every box is the
 * measured frame fraction mapped onto the requested viewBox; rows carry their
 * click + sub-beat delay so the component's transitions stay declarative.
 */
export function specPanelLayout(opts?: SpecPanelOptions): SpecPanelLayout {
  const width = opts?.width ?? 1920
  const height = opts?.height ?? 1080
  if (!(width > 0) || !(height > 0)) {
    throw new RangeError(`viewBox must be positive, received ${width}×${height}`)
  }

  const mkRow = (
    id: string,
    f: readonly number[],
    click: number,
    delayMs: number,
    tone: SpecRowTone,
    strokePx: number,
    wordFs: readonly (readonly [number, number])[] = [],
    weight: 400 | 500 | 700 = 700,
    yNudge = 0,
  ): SpecRow => {
    const b = box(f, width, height)
    const words: SpecWordSpan[] = wordFs.map(([x0, x1]) => ({
      box: {
        x: x0 * width,
        y: b.y + yNudge,
        w: (x1 - x0) * width,
        h: b.h,
      },
    }))
    return { id, box: b, click, delayMs, tone, cap: b.h, strokePx, weight, words, yNudge }
  }

  const rows: SpecRow[] = [
    // Click 2: the status row fades with the full plate (row onset t0.600).
    // Stroke plan: stem widths interpolated from two calibration renders
    // (weight-700 plain vs weight-700 + first-guess stroke) against the
    // settled frame's ink coverage — tall bright rows ~4px, dim rows <1px;
    // the teal cluster matches Regular 400 with no stroke. Word spans are
    // per-word ink extents measured off the settled frame (see SpecRow.words);
    // the statusTeal 'AI' span is hand-widened — its thin I stem fell below
    // the segmentation threshold — and the heading's three words were merged
    // from letter fragments along its two largest gaps.
    mkRow('status', F.statusText, 2, 0, 'dim', 0.5, [[0.1926, 0.3702]], 700, 1.85),
    // Click 2, one frame later (teal cluster events t0.600 → t0.667).
    mkRow('statusTeal', F.statusTealText, 2, 66, 'teal', 0, [[0.7766, 0.79], [0.7943, 0.863]], 400, -1.85),
    // Click 2 sub-beat: the heading's reference onset is t0.867 — 267 ms
    // after the t0.600 press (its fade settles by t1.267, well before the
    // t2.000 body beat).
    mkRow('heading', F.heading, 2, 267, 'dim', 1, [[0.1716, 0.2059], [0.2252, 0.3388], [0.3565, 0.4174]]),
    // Click 3: cursor-square icon (t1.933) + the bright body line (t2.0).
    mkRow('bodyLine', F.bodyLine, 3, 66, 'bright', 4, [[0.2436, 0.3228], [0.3301, 0.3681], [0.3759, 0.403], [0.4103, 0.4822]]),
    // Click 4: the red strip's dim line (t3.467, 334 ms after the strip).
    mkRow('redLine', F.redLine, 4, 334, 'dim', 0.75, [[0.2431, 0.2942], [0.3056, 0.3296], [0.341, 0.3739], [0.3853, 0.4093], [0.4212, 0.4629]]),
    // Click 6: the bright teal statement (t5.067).
    mkRow('tealLine', F.tealLine, 6, 0, 'bright', 4, [[0.2436, 0.3233], [0.3317, 0.3546], [0.3624, 0.5004]], 700, 0.9),
    // Click 7: the dim closing line (t6.533).
    mkRow('lastLine', F.lastLine, 7, 0, 'dim', 0.65, [[0.2436, 0.303], [0.314, 0.3473], [0.3582, 0.3827], [0.3942, 0.4452], [0.4561, 0.4713], [0.4817, 0.5244]], 700, 0.9),
  ]

  const accents: SpecAccent[] = [
    {
      id: 'bodyIcon',
      box: box(F.bodyIcon, width, height),
      click: 3,
      delayMs: 0,
      kind: 'cursorSquare',
    },
    { id: 'redStrip', box: box(F.redStrip, width, height), click: 4, delayMs: 0, kind: 'strip' },
    {
      id: 'tealTile',
      box: box(F.tealTile, width, height),
      click: 5,
      delayMs: 0,
      kind: 'smileTile',
      glyph: box(F.tealGlyph, width, height),
    },
    // The strip lands one frame after the tile (t4.667 vs t4.467).
    { id: 'tealStrip', box: box(F.tealStrip, width, height), click: 5, delayMs: 200, kind: 'strip' },
  ]

  const dots = [F.dotRed, F.dotAmber, F.dotGreen].map((f, i) => {
    const b = box(f, width, height)
    return {
      id: ['red', 'amber', 'green'][i]!,
      cx: b.x + b.w / 2,
      cy: b.y + b.h / 2,
      r: b.w / 2,
      click: 2,
    }
  })

  // The zap glyph rides the teal cluster's measured +2px lag (same
  // cross-correlation as the statusTeal row's yNudge).
  const statusGlyphBox = box(F.statusTealGlyph, width, height)

  return {
    plate: box(F.plate, width, height),
    plateDimOpacity: F.plateDimOpacity,
    rows,
    accents,
    dots,
    statusGlyph: { ...statusGlyphBox, y: statusGlyphBox.y - 1.85 },
    title: {
      capTop: F.title.capTop * height,
      capHeight: (F.title.capBottom - F.title.capTop) * height,
      centerX: ((F.title.left + F.title.right) / 2) * width,
      inkWidth: (F.title.right - F.title.left) * width,
    },
    viewBox: { width, height },
  }
}

/**
 * The slide's seed content — the OCR-read settled-frame copy. The component
 * pins each row's ink extent to its measured box (spacing-only), so the
 * composition matches the frame even where the recording's face is condensed.
 */
export interface SpecPanelSeed {
  /** Status row path text (dim mono, left of the teal cluster). */
  status: string
  /** Status tail in teal (right-aligned cluster, after the `<zap>` mark). */
  statusTeal: string
  /** Wide-tracked dim heading (click 2 sub-beat). */
  heading: string
  /** Bright line beside the cursor-square icon (click 3). */
  bodyLine: string
  /** Dim line revealed with the red edge accent (click 4). */
  redLine: string
  /** Bright statement beside the teal accents (click 6). */
  tealLine: string
  /** Dim closing line (click 7). */
  lastLine: string
}

export const SPEC_PANEL_SEED: SpecPanelSeed = {
  status: 'data.mrk.shop/workspace',
  statusTeal: 'AI ASSISTED',
  heading: 'THE IMPORTANT SKILL',
  bodyLine: 'USING AN AI TOOL',
  redLine: 'ANYONE CAN OPEN THE PANEL',
  tealLine: 'USING IT PROPERLY',
  lastLine: 'KNOWING WHEN THE OUTPUT IS WRONG',
}

/** Row font size (viewBox units) for a measured cap band. */
export function specRowFont(row: SpecRow): number {
  if (!(row.cap > 0)) {
    throw new RangeError(`row cap must be positive, received ${row.cap}`)
  }
  return row.cap / CAP_RATIO
}

/** Baseline (viewBox units) of a row's measured cap band. */
export function specRowBaseline(row: SpecRow): number {
  return row.box.y + row.cap + row.yNudge
}
