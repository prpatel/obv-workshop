/**
 * Pure layout for the SpecPanel diagram family — the seg14 source (2560×1440,
 * 105 f15 dumps + settled frame), measured from `/home/user/work/user8-analysis/
 * report.json` (seg14_153s-160s) and settled-frame pixel sampling.
 *
 * SCENE. One huge near-black plate (V-3: settled fill rgb(13,13,16), luma ≈14 —
 * a dim plate on the black canvas, not a gray card) carrying a progressive
 * build: a window-chrome status row (traffic dots + dim mono text + a teal
 * status cluster), a heading + body group, a red edge accent with its line,
 * a teal edge accent pair lower-left, and two late text rows. The two-tone
 * title sits above the plate, centered like every family.
 *
 * R-2 CROP MAPPING. The seg14 crop frames the full 16:9 slide — the title band
 * (y 0.099–0.150) and plate margins read as full-frame fractions, so crop
 * fractions map 1:1 to stage fractions (×1920 / ×1080 on the default viewBox).
 *
 * R-4 ROW REVEAL — FADE, NOT TYPEWRITER (decided from the f15 dumps before the
 * restructure deletes rows.ts; recorded here because the restructure depends on
 * it). Every row arrives at its full x-extent within ONE 66.7 ms frame and
 * ramps pixels over the following 2–4 frames — an opacity fade of ~200–270 ms:
 *
 *   row 1  t0.600  f0009:   0 →  966 px, extent already [0.135, 0.863]
 *   row 2  t2.000  f0030: 617 → 3969 px, extent already [0.173, 0.475]
 *   row 3  t5.067  f0076: 450 → 4727 px, extent already [0.144, 0.495]
 *   row 4  t6.533  f0098: 203 → 1366 px, extent already [0.144, 0.522]
 *
 * A typewriter marches the x-extent rightward frame by frame; here it is
 * stable from onset (later drift ≤0.004 ≈ 3 px at half-res is anti-alias
 * settle). rows.ts's per-char helper (`rowChars`/`rowCharDelayMs`) is therefore
 * NOT extracted — the restructure can delete it with this family.
 *
 * BEAT MODEL (7 clicks, the approved draft schedule with onsets re-pinned to
 * the report's event times — 15 fps ≈ ±66.7 ms):
 *
 *   click 1  t0.467  plate dim wave    (fill fades to luma ≈3.8 — measured
 *                                      plate-region mean between f0007/f0008)
 *   click 2  t0.600  plate full wave (t0.533, rides this beat — the draft
 *                                      pins the row onset) + status row,
 *                                      traffic dots, teal cluster (t0.6–0.667)
 *   click 3  t2.000  heading + body group (sub-chunks t0.867–2.2 within the
 *                                      band fold into this beat)
 *   click 4  t3.133  red edge strip (red t3.133 → orange t3.2; settles
 *                                      rgb(236,65,63)) + its text line
 *                                      (t3.467, transition-delay 300 ms)
 *   click 5  t4.467  teal edge strip + dark tile with teal glyph (t4.467–4.667)
 *   click 6  t5.067  spec statement line (the tallest row band)
 *   click 7  t6.533  closing line
 *
 * RESOLUTION-LIMITED CONTENT. Glyph-level copy of the small mono rows is not
 * resolvable even at 6× upscale; the seed carries legible-in-spirit text and
 * the component pins each row's MEASURED ink extent (spacing-only textLength —
 * glyphs never squeeze), so the composition matches the frame regardless. The
 * restructure PR owns final deck copy.
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
  /** Measured ink box (viewBox units); `h` is the row's cap band. */
  box: SpecBox
  /** 1-based click that fades this row in. */
  click: number
  /** Transition delay inside the click window (ms) — sub-beat ordering. */
  delayMs: number
  tone: SpecRowTone
  /** Lines to render (mono, `\n`-free); the component pins extents. */
  lines: string[]
  /** Cap height (viewBox units) — the measured band height. */
  cap: number
}

/** One edge/tile accent: a rect (or tile+glyph pair) on its own late beat. */
export interface SpecAccent {
  id: string
  box: SpecBox
  click: number
  delayMs: number
  /** Glyph box centered in the tile (teal tile only; undefined for strips). */
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
 * the AutoAdvance `step-schedule-sec` for the seg14 slide (integration PR
 * mounts it; kept beside the geometry it paces). */
export const STEP_SCHEDULE_SEC = [0.47, 0.6, 2.0, 3.13, 4.47, 5.07, 6.53] as const

/** Total clicks the seg14 build spends — the schedule must cover every beat. */
export const SPEC_PANEL_CLICKS = 7

/** Cap-height ratio of the deck's mono face (chrome.ts convention). */
const CAP_RATIO = 0.73

/** Measured constants — fractions of the 2560×1440 seg14 crop (report.json
 * seg14_153s-160s events/structure + settled-frame sampling). The default
 * viewBox maps them 1:1 (R-2). */
const F = {
  plate: [0.1156, 0.3083, 0.8828, 0.8514],
  statusText: [0.1922, 0.3472, 0.3672, 0.3667],
  statusTeal: [0.7426, 0.3424, 0.8621, 0.3646],
  heading: [0.1711, 0.4444, 0.4156, 0.4639],
  body: [0.1727, 0.5208, 0.4813, 0.6056],
  redLine: [0.243, 0.5917, 0.4602, 0.6069],
  tealLine: [0.2438, 0.6944, 0.4984, 0.7257],
  lastLine: [0.2438, 0.7514, 0.5234, 0.7667],
  redStrip: [0.1434, 0.5097, 0.1504, 0.6285],
  tealStrip: [0.1434, 0.6688, 0.1504, 0.7875],
  tealTile: [0.1719, 0.6979, 0.2238, 0.7583],
  tealGlyph: [0.1891, 0.7125, 0.2066, 0.7438],
  dotRed: [0.1344, 0.35, 0.1426, 0.3632],
  dotAmber: [0.15, 0.35, 0.1566, 0.3632],
  dotGreen: [0.1645, 0.35, 0.1719, 0.3632],
  title: { capTop: 0.0993, capBottom: 0.15, left: 0.3367, right: 0.6672 },
  // Plate-region mean luma of the dim wave (f0008) over the settled fill
  // (rgb(13,13,16) → luma 14.0): 3.78 / 14 = 0.27.
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
 * measured crop fraction mapped onto the requested viewBox; rows carry their
 * click + sub-beat delay so the component's transitions stay declarative.
 */
export function specPanelLayout(opts?: SpecPanelOptions): SpecPanelLayout {
  const width = opts?.width ?? 1920
  const height = opts?.height ?? 1080
  if (!(width > 0) || !(height > 0)) {
    throw new RangeError(`viewBox must be positive, received ${width}×${height}`)
  }

  const status = box(F.statusText, width, height)
  const statusTeal = box(F.statusTeal, width, height)
  const heading = box(F.heading, width, height)
  const body = box(F.body, width, height)
  const redLine = box(F.redLine, width, height)
  const tealLine = box(F.tealLine, width, height)
  const lastLine = box(F.lastLine, width, height)

  const rows: SpecRow[] = [
    // Click 2: the status row fades with the full plate (row onset t0.600).
    {
      id: 'status',
      box: status,
      click: 2,
      delayMs: 0,
      tone: 'dim',
      lines: [''],
      cap: status.h,
    },
    // Click 2, one frame later (teal cluster events t0.600 → t0.667).
    {
      id: 'statusTeal',
      box: statusTeal,
      click: 2,
      delayMs: 66,
      tone: 'teal',
      lines: [''],
      cap: statusTeal.h,
    },
    // Click 3: heading + body group (t2.000; sub-chunks 0.867–2.2 fold in).
    {
      id: 'heading',
      box: heading,
      click: 3,
      delayMs: 0,
      tone: 'bright',
      lines: [''],
      cap: heading.h,
    },
    {
      id: 'body',
      box: body,
      click: 3,
      delayMs: 120,
      tone: 'bright',
      lines: ['', '', ''],
      cap: heading.h,
    },
    // Click 4: the red strip's line (t3.467, ~300 ms after the strip itself).
    {
      id: 'redLine',
      box: redLine,
      click: 4,
      delayMs: 300,
      tone: 'bright',
      lines: [''],
      cap: redLine.h,
    },
    // Click 6: the spec statement (t5.067) — the tallest row band.
    {
      id: 'tealLine',
      box: tealLine,
      click: 6,
      delayMs: 0,
      tone: 'bright',
      lines: [''],
      cap: tealLine.h,
    },
    // Click 7: the closing line (t6.533).
    {
      id: 'lastLine',
      box: lastLine,
      click: 7,
      delayMs: 0,
      tone: 'bright',
      lines: [''],
      cap: lastLine.h,
    },
  ]

  const accents: SpecAccent[] = [
    { id: 'redStrip', box: box(F.redStrip, width, height), click: 4, delayMs: 0 },
    { id: 'tealStrip', box: box(F.tealStrip, width, height), click: 5, delayMs: 0 },
    {
      id: 'tealTile',
      box: box(F.tealTile, width, height),
      click: 5,
      delayMs: 0,
      glyph: box(F.tealGlyph, width, height),
    },
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

  return {
    plate: box(F.plate, width, height),
    plateDimOpacity: F.plateDimOpacity,
    rows,
    accents,
    dots,
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
 * The slide's seed content. Glyph-level copy is resolution-limited (see
 * module docblock) — strings here are legible-in-spirit placeholders whose
 * ink extents the component pins to the measured boxes.
 */
export interface SpecPanelSeed {
  /** Status row text (dim mono, left of the teal cluster). */
  status: string
  /** Status tail in teal (right-aligned cluster). */
  statusTeal: string
  /** Group heading (click 3). */
  heading: string
  /** Body block lines (click 3, three mono lines). */
  body: [string, string, string]
  /** Line revealed with the red edge accent (click 4). */
  redLine: string
  /** Spec statement beside the teal accents (click 6). */
  tealLine: string
  /** Closing line (click 7). */
  lastLine: string
}

export const SPEC_PANEL_SEED: SpecPanelSeed = {
  status: 'main · spec approved',
  statusTeal: '✓ 3 gates passed',
  heading: 'What the build must do',
  body: ['Every slide plays its measured beats,', 'every constant cites the frame it came from,', 'every divergence is a named decision.'],
  redLine: 'Fidelity is the acceptance test.',
  tealLine: 'One source of truth: the recording.',
  lastLine: 'Ship the deck the pixels prove.',
}

/** Row font size (viewBox units) for a measured cap band. */
export function specRowFont(row: SpecRow): number {
  if (!(row.cap > 0)) {
    throw new RangeError(`row cap must be positive, received ${row.cap}`)
  }
  return row.cap / CAP_RATIO
}

/** Baseline (viewBox units) of line `i` within a row's measured band. */
export function specRowBaseline(row: SpecRow, line = 0): number {
  if (!Number.isInteger(line) || line < 0) {
    throw new RangeError(`line must be a non-negative integer, received ${line}`)
  }
  if (row.lines.length === 0) {
    throw new RangeError('row must carry at least one line')
  }
  const pitch = row.lines.length > 1 ? row.box.h / row.lines.length : 0
  return row.box.y + row.cap + line * pitch
}
