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
 * 2.4 / 3.133), the left annotation pops (3.733), the amber group pops
 * (4.6), and the title re-bursts in a chrome-green glow (5.867).
 *
 * Element inventory (task brief) maps to the measured frame as follows: the
 * plate's 'four sequential sub-blocks' are the three numbered rows plus the
 * bottom-left annotation group — the settled frame shows exactly three
 * in-plate rows (report.json events 1.667/2.4/3.133s), and the fourth
 * sequential beat is the left annotation (3.733s), which sits below the
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
 * Seed copy (STEP_PANEL_SEED) was decoded from the settled frame by per-cell
 * template classification plus glyph-run counting: the three row labels are
 * the benefit words RELIABLE / FRESH / USEFUL (8 / 5 / 6 uniform cells), row
 * titles are the long single lines (32 / 30 / 39 chars), the left annotation
 * is 'what drove revenue last week', the right line ends with an arrow
 * glyph, and the digit run is seven advance cells. The chip label keeps
 * 'VIBE CODING' — its measured extent matches 11 JetBrains Mono Bold cells
 * at the box's own cap height to within 0.2px.
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
  /** Mono accent benefit label left of the title (e.g. 'RELIABLE'). */
  label: string
  /** Long single-line row title. */
  title: string
  /** Label color role resolved against the palette. */
  tone: StepTone
}

/** Bottom annotation group content (one line, measured single run). */
export interface StepAnnotation {
  line: string
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

/** Measured row-title gray (settled-frame glyph cores, #b0aeb7 brightened by AA). */
export const STEP_PANEL_ROW_TEXT = '#a8aab2'

/** Measured title white tail + chip label ink (settled-frame glyph cores;
 * the full-res sample reads #f5f5f7, dimmer than pure white). */
export const STEP_PANEL_TITLE_WHITE = '#f5f5f7'

/** Measured right-annotation line gray (settled-frame glyph cores). */
export const STEP_PANEL_DIM_TEXT = '#a5a5a8'

/** Measured amber digit-run tone (settled-frame glyph cores, lighter than the bars). */
export const STEP_PANEL_DIGIT_GOLD = '#f8bd1c'

/** Measured badge tones (settled-frame top-right glyph strokes). */
export const STEP_PANEL_BADGE_LIME = '#8cb42c'
export const STEP_PANEL_BADGE_GRAY = '#9c9c9c'

/** Measured annotation orange (research-brief settled median, seg12-confirmed). */
export const STEP_PANEL_ORANGE = '#f85721'

/**
 * Digit-run settled ink at 1080p measures rgb(216,178,78) — the date run is
 * a dim gold, distinctly darker than the solid '18' pair (#f8bd1c).
 */
export const STEP_PANEL_DIGIT_DIM = '#d8b24e'

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
    label: { xFrac: 0.1434, yFrac: 0.4316, wFrac: 0.1027, hFrac: 0.0243 },
    title: { xFrac: 0.3094, yFrac: 0.4367, wFrac: 0.2328, hFrac: 0.0151 },
  },
  {
    band: { xFrac: 0.1219, yFrac: 0.5194, wFrac: 0.7554, hFrac: 0.1014 },
    label: { xFrac: 0.1434, yFrac: 0.554, wFrac: 0.0621, hFrac: 0.0243 },
    title: { xFrac: 0.3094, yFrac: 0.5591, wFrac: 0.1851, hFrac: 0.0151 },
  },
  {
    band: { xFrac: 0.1219, yFrac: 0.6389, wFrac: 0.7554, hFrac: 0.1028 },
    label: { xFrac: 0.143, yFrac: 0.6767, wFrac: 0.0761, hFrac: 0.0243 },
    title: { xFrac: 0.3094, yFrac: 0.6818, wFrac: 0.2648, hFrac: 0.0151 },
  },
]

/**
 * Bottom annotation row (below the plate, y≈0.76–0.83): left group = orange
 * edge bar + orange terminal glyph + white line (3.733s burst); right group
 * = the gold '18' digit pair + dim-gold date run + white line (4.6s
 * burst). Boxes from the settled-frame connected components.
 */
export const STEP_PANEL_ANNOTATION: {
  leftBar: MeasuredBox
  leftGlyph: MeasuredBox
  leftText: MeasuredBox
  /** Measured gold digit pair ('18' glyphs, not solid bars — frame
   * column/row profiles show a JBM-style flag+stem+serif '1' and a
   * two-loop '8'). */
  goldPair: MeasuredBox
  digits: MeasuredBox
  rightText: MeasuredBox
} = {
  leftBar: { xFrac: 0.1219, yFrac: 0.7597, wFrac: 0.0042, hFrac: 0.066 },
  leftGlyph: { xFrac: 0.1422, yFrac: 0.7778, wFrac: 0.0152, hFrac: 0.0326 },
  leftText: { xFrac: 0.1719, yFrac: 0.781, wFrac: 0.3039, hFrac: 0.023 },
  goldPair: { xFrac: 0.6339, yFrac: 0.7602, wFrac: 0.0552, hFrac: 0.0667 },
  digits: { xFrac: 0.702, yFrac: 0.7668, wFrac: 0.0782, hFrac: 0.0201 },
  rightText: { xFrac: 0.7016, yFrac: 0.8054, wFrac: 0.1755, hFrac: 0.0144 },
}

/**
 * Top-right badge (settled static state): two lime glyph bars plus a pale
 * gray mark, floating on the canvas with no pill background. Measured from
 * the settled frame's top-right ink (x 0.9633–0.9898, y 0.0160–0.0576).
 */
export const STEP_PANEL_BADGE: { bars: [MeasuredBox, MeasuredBox]; mark: MeasuredBox } = {
  bars: [
    { xFrac: 0.9675, yFrac: 0.03, wFrac: 0.005, hFrac: 0.026 },
    { xFrac: 0.974, yFrac: 0.03, wFrac: 0.005, hFrac: 0.026 },
  ],
  mark: { xFrac: 0.981, yFrac: 0.018, wFrac: 0.0088, hFrac: 0.036 },
}

/**
 * Two-tone title band, PER-TOKEN pinned (glyph cores, glow-excluded per the
 * generation-7 lesson): measured cap top y0.096528, baseline y0.149306 (cap
 * 76px at 2560x1440 — settled_full.png + report_full.json structure
 * components). Chrome-green words come FIRST ('TUI' ink x0.289843-0.350391,
 * 'skin' ink x0.3625-0.448047) with the trailing comma in its own low box
 * (ink x0.447656-0.457813 hanging below the baseline), then white words
 * ('trend,' ink x0.466797-0.589583 incl. its mid comma, 'actual' ink
 * x0.591406-0.712109). Each token pins its own measured extent — a single
 * run-level pin accumulates cell-pitch drift (~15px by the white tail) that
 * the reference does not have.
 */
export const STEP_PANEL_TITLE: {
  accentWord1: MeasuredBox
  accentWord2: MeasuredBox
  accentComma: MeasuredBox
  whiteWord1: MeasuredBox
  whiteWord2: MeasuredBox
} = {
  accentWord1: { xFrac: 0.289843, yFrac: 0.096528, wFrac: 0.060547, hFrac: 0.052778 },
  accentWord2: { xFrac: 0.3625, yFrac: 0.096528, wFrac: 0.085547, hFrac: 0.052778 },
  accentComma: { xFrac: 0.447656, yFrac: 0.131944, wFrac: 0.010156, hFrac: 0.028472 },
  whiteWord1: { xFrac: 0.466797, yFrac: 0.096528, wFrac: 0.122917, hFrac: 0.052778 },
  whiteWord2: { xFrac: 0.591406, yFrac: 0.096528, wFrac: 0.120703, hFrac: 0.052778 },
}
/**
 * Pinned reveal onsets (seconds into the clip, 15fps event trace): plate
 * outline 1.200; rows 1.667 / 2.400 / 3.133; left annotation 3.733; amber
 * group 4.600; chrome-green title burst 5.867. The draft schedule's rounded
 * values [1.20, 1.67, 2.40, 3.13, 3.90, 4.67, 5.87] drift from the f15 onsets
 * at beats 5–6; these are the pinned values (beat 5 bracketed by f0056/f0057:
 * zero annotation ink at 3.700, both annotations present at 3.767). The slide
 * consumes this via
 * AutoAdvance :step-schedule-sec in the integration PR; the component maps
 * the same beats onto v-click indexes 1..7.
 */
export const STEP_BEATS: readonly [number, number, number, number, number, number, number] = [
  1.2, 1.667, 2.4, 3.133, 3.733, 4.6, 5.867,
]

/** A resolved row: the data row with its measured boxes in absolute stage units.
 * Geometry uses *Box suffixes so the row's string fields stay clean — the
 * layout never overwrites the copy with coordinates. */
export type StepRowRect = StepRow & {
  band: Box
  labelBox: Box
  titleBox: Box
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
    goldPair: Box
    digits: Box
    rightText: Box
  }
  title: {
    accentWord1: Box
    accentWord2: Box
    accentComma: Box
    whiteWord1: Box
    whiteWord2: Box
  }
  /** Settled top-right corner badge (static lime bars + gray mark). */
  badge: { bars: [Box, Box]; mark: Box }
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
      labelBox: resolveBox(measured.label, width, height),
      titleBox: resolveBox(measured.title, width, height),
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
      goldPair: resolveBox(STEP_PANEL_ANNOTATION.goldPair, width, height),
      digits: resolveBox(STEP_PANEL_ANNOTATION.digits, width, height),
      rightText: resolveBox(STEP_PANEL_ANNOTATION.rightText, width, height),
    },
    title: {
      accentWord1: resolveBox(STEP_PANEL_TITLE.accentWord1, width, height),
      accentWord2: resolveBox(STEP_PANEL_TITLE.accentWord2, width, height),
      accentComma: resolveBox(STEP_PANEL_TITLE.accentComma, width, height),
      whiteWord1: resolveBox(STEP_PANEL_TITLE.whiteWord1, width, height),
      whiteWord2: resolveBox(STEP_PANEL_TITLE.whiteWord2, width, height),
    },
    badge: {
      bars: [
        resolveBox(STEP_PANEL_BADGE.bars[0], width, height),
        resolveBox(STEP_PANEL_BADGE.bars[1], width, height),
      ],
      mark: resolveBox(STEP_PANEL_BADGE.mark, width, height),
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

/** The recording's content, decoded from the settled frame (see module header). */
export const STEP_PANEL_SEED: StepPanelData = {
  rows: [
    { id: 'draft', label: 'RELIABLE', title: 'what does done look like for you', tone: 'accent' },
    { id: 'spec', label: 'FRESH', title: 'the spec writes your task list', tone: 'alt' },
    { id: 'build', label: 'USEFUL', title: 'agent implements the task list with you', tone: 'tertiary' },
  ],
  annotationLeft: { line: 'what drove revenue last week' },
  annotationRight: { line: 'spec-driven development →' },
  dateDigits: '09·0526',
}
