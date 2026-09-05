/**
 * StepPanel contract + pure layout math for the seg15 four-step panel diagram
 * (measured blueprint art_uJLWLoa8 seg15 — settled frame, 2560×1440 trace).
 *
 * The recording opens on a settled pre-clip state: a blue+white header chip
 * ('vibe coding' mark + label) top-left, a large near-black plate holding
 * three numbered sub-block rows (blue/cyan/teal mono labels + white titles),
 * a bottom-left orange annotation group (bar + terminal glyph + white line),
 * and a bottom-right amber annotation group (two amber bars + amber digits +
 * white line). Above everything sits the two-tone title — chrome-green
 * 'vibe coding' FIRST, then white 'to spec-driven shipping' (the accentFirst
 * convention, like VerticalSpine). The clip's reveal is one sequential pass:
 * the plate outline draws (1.2s), each row band + its text lands (1.667 /
 * 2.4 / 3.133), the left annotation pops (3.667), the amber group pops
 * (4.6), and the title re-bursts in a chrome-green glow (5.867).
 *
 * Element inventory (task brief) maps to the measured frame as follows: the
 * plate's 'four sequential sub-blocks' are the three numbered rows plus the
 * bottom-left annotation group — the settled frame shows exactly three
 * in-plate rows (report.json events 1.667/2.4/3.133s), and the fourth
 * sequential beat is the left annotation (3.667s), which sits below the
 * plate. The bottom annotation row carries orange-left / amber-right per the
 * brief.
 *
 * Every position is a fraction of the 1920×1080 stage (the 2560×1440 trace
 * maps 1:1 proportionally), so the same numbers serve the deck canvas and any
 * future embed. All functions here are pure and deterministic: same inputs
 * produce equal output, and nothing touches the DOM (SSR-safe build).
 *
 * Text rendering follows the generation-7 typography lock: runs pin to their
 * measured ink extents with spacing-only textLength (pinAttrs) — glyphs are
 * never squeezed. Note: seg15's recorded face is markedly more condensed than
 * the deck mono at equal glyph height (the wave-1 systemic note amplified at
 * this resolution), so title pins are heavy; the measured extent is the
 * contract and the visual call lands in the integration evidence PR.
 *
 * Seed copy (STEP_PANEL_SEED) is OCR-approximate at 2560×1440 for the small
 * dim lines; geometry is measured. Final strings are the integration PR's
 * call against the 60fps source.
 */

/** A trace-measured ink/geometry box, as fractions of the 1920×1080 stage. */
export interface MeasuredBox {
  xFrac: number
  yFrac: number
  wFrac: number
  hFrac: number
}

/** Color role resolved against the slide palette (same contract as StackPanel). */
export type StepTone = 'accent' | 'alt' | 'tertiary' | 'quaternary'

/** One numbered sub-block row inside the plate. */
export interface StepRow {
  /** Stable key — used for a11y labels and test selectors. */
  id: string
  /** Mono accent label left of the title (e.g. '01 // DRAFT'). */
  label: string
  /** White bold row title. */
  title: string
  /** Dim subline under the title (not trace-measured; seed-level). */
  sub?: string
  /** Label color role resolved against the palette. */
  tone: StepTone
}

/** Bottom annotation group content (one bright line + optional dim line). */
export interface StepAnnotation {
  line: string
  sub?: string
}

/** Content that travels with the slide as one prop. */
export interface StepPanelData {
  rows: StepRow[]
  /** Bottom-left orange-annotated group (bar + terminal glyph + lines). */
  annotationLeft: StepAnnotation
  /** Bottom-right amber-annotated group (bars + digits + line). */
  annotationRight: StepAnnotation
  /** Amber digit run next to the two amber bars (date-like). */
  dateDigits: string
}

/** An absolute stage-unit box. */
export interface Box {
  x: number
  y: number
  w: number
  h: number
}

function resolveBox(b: MeasuredBox, width: number, height: number): Box {
  return { x: b.xFrac * width, y: b.yFrac * height, w: b.wFrac * width, h: b.hFrac * height }
}

/**
 * Header chip (pre-clip state, f0001): a blue rounded-square mark with the
 * white mono label to its right. Blue mark = blue[0] bbox [0.1234, 0.3083,
 * 0.148, 0.3431]; label = union of the white chip-text components
 * (x 0.1602–0.2559, y 0.3188–0.3382).
 */
export const STEP_PANEL_CHIP: { mark: MeasuredBox; label: MeasuredBox } = {
  mark: { xFrac: 0.1234, yFrac: 0.3083, wFrac: 0.0246, hFrac: 0.0348 },
  label: { xFrac: 0.1602, yFrac: 0.3188, wFrac: 0.0957, hFrac: 0.0194 },
}

/**
 * The plate: near-black panel behind the rows. Top edge from the 1.2s draw
 * event [0.1242, 0.3778, 0.4016, 0.3806] (left→right top-edge stroke); x
 * extent from the row-band events (0.1219–0.8773); bottom from the row-3
 * band (0.7417). Interior samples at #000000 (no fill distinct from the
 * canvas) with a dim #252727 outline.
 */
export const STEP_PANEL_PLATE: MeasuredBox = {
  xFrac: 0.1219,
  yFrac: 0.3778,
  wFrac: 0.7554,
  hFrac: 0.3639,
}

/** Measured plate outline tone (top-edge sample). */
export const STEP_PANEL_PLATE_STROKE = '#252727'

/** Measured row-band fill (settled-frame interior sample, rgb(18,17,20)). */
export const STEP_PANEL_ROW_FILL = '#121114'

/** Measured annotation orange (research-brief settled median, seg12-confirmed). */
export const STEP_PANEL_ORANGE = '#f85721'

/**
 * Measured seg15 family palette (art_uJLWLoa8 settled medians): blue/cyan/teal
 * row-label runs, the amber right-annotation tone, and the fixed orange left
 * annotation (STEP_PANEL_ORANGE above). The Vue component merges this over
 * the deck default via resolvePalette; a slide-level palette prop overrides
 * any slot (override wins, per palettes.ts convention).
 */
export const STEP_PANEL_PALETTE = {
  accent: '#3799fb',
  accentAlt: '#1fd0ea',
  accentTertiary: '#1ed798',
  accentQuaternary: '#f9bb1f',
} as const

/** Per-row measured boxes (band / label ink / title ink), in reveal order.
 * Bands from the 1.667 / 2.4 / 3.2s grayplate events; labels from each
 * row's accent components (blue / cyan / teal unions); titles from each
 * row's white components. */
export const STEP_PANEL_ROWS: readonly { band: MeasuredBox; label: MeasuredBox; title: MeasuredBox }[] = [
  {
    band: { xFrac: 0.1219, yFrac: 0.3958, wFrac: 0.7554, hFrac: 0.1014 },
    label: { xFrac: 0.1434, yFrac: 0.4319, wFrac: 0.1027, hFrac: 0.0243 },
    title: { xFrac: 0.3094, yFrac: 0.4389, wFrac: 0.2328, hFrac: 0.0167 },
  },
  {
    band: { xFrac: 0.1219, yFrac: 0.5194, wFrac: 0.7554, hFrac: 0.1014 },
    label: { xFrac: 0.1434, yFrac: 0.5542, wFrac: 0.0621, hFrac: 0.0243 },
    title: { xFrac: 0.3094, yFrac: 0.5611, wFrac: 0.1851, hFrac: 0.0139 },
  },
  {
    band: { xFrac: 0.1219, yFrac: 0.6389, wFrac: 0.7554, hFrac: 0.1028 },
    label: { xFrac: 0.143, yFrac: 0.6764, wFrac: 0.0761, hFrac: 0.0243 },
    title: { xFrac: 0.3094, yFrac: 0.6833, wFrac: 0.2648, hFrac: 0.0125 },
  },
]

/**
 * Bottom annotation row (below the plate, y≈0.76–0.83): left group = orange
 * edge bar + orange terminal glyph + white line (3.667s burst); right group
 * = two amber bars ('11' glyph pair) + amber digit run + white line (4.6s
 * burst). Boxes from the settled-frame connected components.
 */
export const STEP_PANEL_ANNOTATION: {
  leftBar: MeasuredBox
  leftGlyph: MeasuredBox
  leftText: MeasuredBox
  amberBars: [MeasuredBox, MeasuredBox]
  digits: MeasuredBox
  rightText: MeasuredBox
} = {
  leftBar: { xFrac: 0.1219, yFrac: 0.7597, wFrac: 0.0027, hFrac: 0.066 },
  leftGlyph: { xFrac: 0.1422, yFrac: 0.7778, wFrac: 0.0152, hFrac: 0.0326 },
  leftText: { xFrac: 0.1719, yFrac: 0.7806, wFrac: 0.3039, hFrac: 0.0222 },
  amberBars: [
    { xFrac: 0.6344, yFrac: 0.7604, wFrac: 0.0242, hFrac: 0.0653 },
    { xFrac: 0.6641, yFrac: 0.7597, wFrac: 0.0246, hFrac: 0.0674 },
  ],
  digits: { xFrac: 0.7023, yFrac: 0.7681, wFrac: 0.0754, hFrac: 0.0173 },
  rightText: { xFrac: 0.7016, yFrac: 0.8056, wFrac: 0.1742, hFrac: 0.0152 },
}

/**
 * Two-tone title band (glyph cores, glow-excluded per the generation-7
 * lesson): ascender top y0.1000, baseline y0.1486. Chrome-green 'vibe coding'
 * ink x0.2898–0.4473 comes FIRST, white 'to spec-driven shipping' ink
 * x0.4477–0.7117 follows — the accentFirst convention.
 */
export const STEP_PANEL_TITLE: { accentInk: MeasuredBox; whiteInk: MeasuredBox } = {
  accentInk: { xFrac: 0.2898, yFrac: 0.1, wFrac: 0.1575, hFrac: 0.0486 },
  whiteInk: { xFrac: 0.4477, yFrac: 0.1, wFrac: 0.264, hFrac: 0.0486 },
}

/**
 * Pinned reveal onsets (seconds into the clip, 15fps event trace): plate
 * outline 1.200; rows 1.667 / 2.400 / 3.133; left annotation 3.667; amber
 * group 4.600; chrome-green title burst 5.867. The draft schedule's rounded
 * values [1.20, 1.67, 2.40, 3.13, 3.90, 4.67, 5.87] drift from the f15 onsets
 * at beats 5–6; these are the pinned values. The slide consumes this via
 * AutoAdvance :step-schedule-sec in the integration PR; the component maps
 * the same beats onto v-click indexes 1..7.
 */
export const STEP_BEATS: readonly [number, number, number, number, number, number, number] = [
  1.2, 1.667, 2.4, 3.133, 3.667, 4.6, 5.867,
]

/** A resolved row: the data row with its measured boxes in absolute stage units. */
export type StepRowRect = StepRow & {
  band: Box
  label: Box
  title: Box
}

/** Full resolved layout for the StepPanel composition. */
export interface StepPanelLayout {
  chip: { mark: Box; label: Box }
  plate: Box
  rows: StepRowRect[]
  annotation: {
    leftBar: Box
    leftGlyph: Box
    leftText: Box
    amberBars: [Box, Box]
    digits: Box
    rightText: Box
  }
  title: { accentInk: Box; whiteInk: Box }
  viewBox: { width: number; height: number }
}

export interface StepPanelLayoutOptions {
  /** Stage width in px (default 1920). */
  width?: number
  /** Stage height in px (default 1080). */
  height?: number
}

/** The measured plate holds exactly three sub-block rows. */
const MIN_ROWS = 1
const MAX_ROWS = 3

function assertFinitePositive(name: string, value: number): void {
  if (!Number.isFinite(value) || value <= 0) {
    throw new RangeError(`${name} must be a positive finite number, got ${value}`)
  }
}

/**
 * Resolve the measured geometry against a data payload. Rows map onto the
 * measured band/label/title boxes by index — the plate holds 1..3 rows by
 * measurement, so other counts throw RangeError.
 */
export function stepPanelLayout(data: StepPanelData, opts: StepPanelLayoutOptions = {}): StepPanelLayout {
  const width = opts.width ?? 1920
  const height = opts.height ?? 1080
  assertFinitePositive('width', width)
  assertFinitePositive('height', height)
  const count = data.rows.length
  if (count < MIN_ROWS || count > MAX_ROWS) {
    throw new RangeError(`StepPanel holds ${MIN_ROWS}..${MAX_ROWS} rows (the measured plate has ${MAX_ROWS}), got ${count}`)
  }

  const rows: StepRowRect[] = data.rows.map((row, i) => {
    const measured = STEP_PANEL_ROWS[i]
    return {
      ...row,
      band: resolveBox(measured.band, width, height),
      label: resolveBox(measured.label, width, height),
      title: resolveBox(measured.title, width, height),
    }
  })

  return {
    chip: {
      mark: resolveBox(STEP_PANEL_CHIP.mark, width, height),
      label: resolveBox(STEP_PANEL_CHIP.label, width, height),
    },
    plate: resolveBox(STEP_PANEL_PLATE, width, height),
    rows,
    annotation: {
      leftBar: resolveBox(STEP_PANEL_ANNOTATION.leftBar, width, height),
      leftGlyph: resolveBox(STEP_PANEL_ANNOTATION.leftGlyph, width, height),
      leftText: resolveBox(STEP_PANEL_ANNOTATION.leftText, width, height),
      amberBars: [
        resolveBox(STEP_PANEL_ANNOTATION.amberBars[0], width, height),
        resolveBox(STEP_PANEL_ANNOTATION.amberBars[1], width, height),
      ],
      digits: resolveBox(STEP_PANEL_ANNOTATION.digits, width, height),
      rightText: resolveBox(STEP_PANEL_ANNOTATION.rightText, width, height),
    },
    title: {
      accentInk: resolveBox(STEP_PANEL_TITLE.accentInk, width, height),
      whiteInk: resolveBox(STEP_PANEL_TITLE.whiteInk, width, height),
    },
    viewBox: { width, height },
  }
}

/** Which v-click drives each element group (1-based Slidev click indexes). */
export interface RevealPlan {
  /** Plate outline draw. */
  plateClick: number
  /** One click per row band + its text. */
  rowClicks: number[]
  /** Bottom-left orange annotation group. */
  annotationClick: number
  /** Bottom-right amber group. */
  amberClick: number
  /** Chrome-green title burst. */
  burstClick: number
  /** Total clicks the component consumes. */
  clicksTotal: number
}

/**
 * Map the pinned seg15 beat order onto click indexes: plate, rows in order,
 * left annotation, amber group, then the closing title burst — 7 clicks for
 * the measured 3-row plate. The chip is pre-clip state (settled at f0001) and
 * pops on slide entry without consuming a click.
 */
export function revealPlan(rows: number): RevealPlan {
  if (rows < MIN_ROWS || rows > MAX_ROWS) {
    throw new RangeError(`StepPanel holds ${MIN_ROWS}..${MAX_ROWS} rows (the measured plate has ${MAX_ROWS}), got ${rows}`)
  }
  const rowClicks = Array.from({ length: rows }, (_, i) => i + 2)
  return {
    plateClick: 1,
    rowClicks,
    annotationClick: rows + 2,
    amberClick: rows + 3,
    burstClick: rows + 4,
    clicksTotal: rows + 4,
  }
}

/** The recording's content, seeded from the seg15 trace (OCR-approximate copy). */
export const STEP_PANEL_SEED: StepPanelData = {
  rows: [
    { id: 'draft', label: '01 // DRAFT', title: 'Draft', sub: 'Describe the outcome in one paragraph', tone: 'accent' },
    { id: 'spec', label: '02 // SPEC', title: 'Generate spec', sub: 'Requirements, design, and task list', tone: 'alt' },
    { id: 'build', label: '03 // BUILD', title: 'Implement', sub: 'Kiro codes the task list with you', tone: 'tertiary' },
  ],
  annotationLeft: { line: 'Vibe coding', sub: 'ad-hoc prompts, tribal knowledge' },
  annotationRight: { line: 'spec-driven development' },
  dateDigits: '09·05·26',
}
