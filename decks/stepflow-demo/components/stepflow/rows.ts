/**
 * SchematicRows data contract + pure layout math (exact-trace sheet art_mkVNxsft §2).
 *
 * A macOS-style code window: traffic-dot chrome, an `answer_service.py` tab with a
 * right-aligned gray path, seven verbatim mono rows (row numbers in the gutter, a
 * teal band behind rows 4–5, a cyan connector rail alongside rows 4–6), and a
 * four-callout annotation ladder on the right. Rows type in character by character
 * (the recording's ≈9.8 s typewriter, re-paced to one row per click); the band, rail
 * and callouts key to the rows they annotate. Pure and SSR-safe: no DOM access, no
 * mutation of the inputs.
 *
 * Every number is measured, not fitted — source of truth is the exact-trace sheet
 * (native frame 861 of the 2560×1440 reference) re-verified this session against the
 * frame average: 1920×1080 values are native × 0.75. Where the sheet's prose and the
 * pixels disagreed, the pixels won and the finding is recorded here:
 *
 * - Row pitch: the sheet's "≈62.3px" note matches the OLD 10-row render; its own
 *   band list and the frame give ~49.5px (native ~66) — per-row measured tops are
 *   used, not a uniform pitch.
 * - Teal band: the sheet says "behind row 4", the frame shows it behind rows 4–5
 *   (native y650–782, x48–1265); the rail runs one row further (rows 4–6).
 * - Callout 1's ring is amber (mean (238,181,34), n=544 stroke px), not the gray the
 *   sheet assumed from its label; its label is gray. Labels 1/4 are gray, 2/3 white —
 *   the two small-cap labels are gray, the two large ones white.
 * - The reference mono is a condensed face (advance ≈ 0.48–0.5em vs the deck's 0.6em
 *   JetBrains Mono — the shared-chrome Direction-2 note). Code rows render at the
 *   cap-matched size and condense via scaleX so extent AND cap height match; the
 *   tab/path text uses the same treatment (x-height-matched font, scaleX pinned);
 *   the title pins its measured extent via TitleChrome's `titleTextLength`.
 *
 * Tone colors are sheet-sampled constants of the tone convention (never palette
 * fields): keywords `#4298f2`, identifiers `#f2f2f2`, string cores `#e6ebf1`,
 * comments `#888791`.
 */

/** Tone of one row token — all four are measured constants, never palette fields. */
export type RowTokenTone = 'keyword' | 'ident' | 'string' | 'comment'

/** One colored token of a row's text stream. Whitespace inside `text` is preserved (mono, `white-space: pre`). */
export interface RowToken {
  text: string
  tone: RowTokenTone
}

/** One mono row of the listing: gutter number, measured x / ink-top (1080 px), tokens. */
export interface CodeRow {
  /** Stable key — test selectors and the click schedule. */
  id: string
  /** Gutter line number ('1'–'7'). */
  number: string
  /** Left edge of the row's first glyph, 1920×1080 px (native ink start × 0.75). */
  x: number
  /** Top of the row's ink band (ascender), 1920×1080 px. */
  inkTop: number
  tokens: RowToken[]
}

/** One right-hand callout: a hand-drawn ellipse ring, optional tail, and a tracked label. */
export interface CalloutSpec {
  id: string
  /** Verbatim label text (OCR-verified against 2× crops). */
  label: string
  ring: { cx: number, cy: number, rx: number, ry: number, rot: number, fill: string }
  /** Optional short tail stroke off the ring (the hand-drawn look), 1080 px points. */
  tail?: [number, number][]
  /** Measured label ink: left edge, ink top, cap height, mono advance, color (1080 px). */
  ink: { x: number, inkTop: number, cap: number, advance: number, fill: string }
  /** 1-based click that reveals the callout. */
  click: number
}

/** The full SchematicRows scene: verbatim rows plus the measured chrome/annotation layers. */
export interface SchematicRowsData {
  rows: CodeRow[]
  callouts: CalloutSpec[]
}

export interface Canvas {
  width: number
  height: number
}

/** Token colors — sheet-sampled (§2.2), constants of the tone convention. */
export const TOKEN_COLORS: Record<RowTokenTone, string> = {
  keyword: '#4298f2',
  ident: '#f2f2f2',
  string: '#e6ebf1',
  comment: '#888791',
}

/** Window frame rules (native x23–1916, top y317–323, divider x1297, y326–1143 × 0.75). */
export const WINDOW_FRAME = {
  top: { x: 27.75, y: 237.75, w: 1398.75, h: 4.5, fill: '#221e18' },
  left: { x: 17.25, y: 244.5, w: 2.25, h: 612.75, fill: '#221e18' },
  right: { x: 1435.5, y: 244.5, w: 2.25, h: 612.75, fill: '#221e18' },
  divider: { x: 972, y: 237.75, w: 2.25, h: 619.5, fill: '#191a1d' },
} as const

/** Traffic dots (native centers (66/102.5/139.5, 369.5), d≈20 × 0.75). */
export const TRAFFIC_DOTS = [
  { cx: 49.5, cy: 277.1, r: 7.2, fill: '#fb5c55' },
  { cx: 76.9, cy: 277.1, r: 7.2, fill: '#f5b839' },
  { cx: 104.6, cy: 277.1, r: 7.2, fill: '#30bf49' },
] as const

/** Tab text + its underline, and the right-aligned path (native ink × 0.75).
 * Same condensed face as the code rows: the font is x-height-matched (measured
 * x-height 18 ÷ 0.55) and scaleX pins the measured ~14.3px advance. */
export const TAB_TEXT = {
  text: 'answer_service.py',
  x: 149.25,
  baseline: 285,
  font: 32.7,
  scaleX: 0.729,
  fill: '#f5f4f7',
  underline: { x: 234.75, y: 285.5, w: 152.25, h: 3, fill: '#f3f2f7' },
} as const

export const PATH_TEXT = {
  text: 'data.mrk.shop/services',
  rightEdge: 1407.75,
  baseline: 285,
  font: 32.7,
  scaleX: 0.729,
  fill: '#a5a4ae',
} as const

/** Gutter row numbers (native x89–102, digit height 22 × 0.75). */
export const ROW_NUMBER_STYLE = { x: 66.75, font: 22.6, fill: '#a5a5ae' } as const

/** Code-row typography. Font 32px at advance-matched cap; the condensed face is
 * reproduced with scaleX (0.8333 = measured 16px advance ÷ 0.6em × 32px advance),
 * so glyph extents AND cap height both match the reference. */
export const ROW_FONT = 32
export const ROW_SCALE_X = 16 / (0.6 * 32)
/** Line-box top → ink-top offset for the mono stack at font 32 / line-height 1. */
export const ROW_EM_TO_INK = 4.67
/** Ink-top → baseline offset (cap 0.729em at font 32) — shared by code and gutter numbers. */
export const ROW_BASELINE = 23.33

/** Teal band behind rows 4–5 (native y650–782, x48–1265 × 0.75) — sheet §2.2 corrected by frame. */
export const HIGHLIGHT_BAND = { x: 36, y: 487, w: 912.75, h: 99.5, fill: '#08272c' } as const

/** Cyan connector rail alongside rows 4–6 (native x46–57, y653–841 × 0.75). */
export const CONNECTOR_RAIL = { x: 34.5, y: 489.75, w: 8.25, h: 141, fill: '#35c2ea' } as const

/** Click choreography (sheet §2.3 motion trace re-paced to the README's 10 clicks):
 * chrome pops (1), callout 1 (2), then rows type one per click; the rail draws on
 * click 6, just before row 4, whose click (7) also brings the band and callout 2;
 * callouts 3/4 key to rows 5/6 (clicks 8/9); row 7 closes (10). */
export const CLICK_CHROME = 1
export const CLICK_CALLOUT_1 = 2
export const FIRST_ROW_CLICK = 3
export const CLICK_RAIL = 6
export const CLICK_BAND = 7
export const TOTAL_CLICKS = 10

/** 1-based click of row `i` (0-based): the rail's click 6 shifts rows 4–7 up one
 * beat, so the schedule is 3, 4, 5, 7, 8, 9, 10 — ten clicks total. */
export function rowClick(i: number): number {
  return i + FIRST_ROW_CLICK + (i >= CLICK_RAIL - FIRST_ROW_CLICK ? 1 : 0)
}

/** The recording's typewriter: ≈9.8 s across 7 rows (sheet §2.3), re-paced so each
 * row completes its share. Rows type on their own click; the per-char delay makes
 * the row's duration match. */
export const TYPEWRITER_TOTAL_MS = 9800
export const ROW_TYPE_MS = TYPEWRITER_TOTAL_MS / 7

/** Per-character delay (ms) so row `charCount` completes in ROW_TYPE_MS. */
export function rowCharDelayMs(charCount: number): number {
  if (charCount <= 0) throw new RangeError(`charCount must be positive, received ${charCount}`)
  return ROW_TYPE_MS / charCount
}

/** The verbatim listing — sheet §2.2, OCR flags resolved from 2× crops + the frame
 * average this session (indent: rows 3–7 one step; no trailing ';' on row 4;
 * '->' ASCII arrow; row 7 keeps its leading `return `). */
export const SCHEMATIC_ROWS_ROWS: CodeRow[] = [
  {
    id: 'imports',
    number: '1',
    x: 99,
    inkTop: 355.5,
    tokens: [
      { text: 'from ', tone: 'keyword' },
      { text: 'mrk ', tone: 'ident' },
      { text: 'import ', tone: 'keyword' },
      { text: 'service, depends', tone: 'ident' },
    ],
  },
  {
    id: 'signature',
    number: '2',
    x: 99,
    inkTop: 405.75,
    tokens: [
      { text: 'def ', tone: 'keyword' },
      { text: 'answer(question: ', tone: 'ident' },
      { text: 'str', tone: 'ident' },
      { text: ') -> ', tone: 'ident' },
      { text: 'str:', tone: 'ident' },
    ],
  },
  {
    id: 'comment',
    number: '3',
    x: 160.5,
    inkTop: 454.5,
    tokens: [
      { text: '# the AI application', tone: 'comment' },
    ],
  },
  {
    id: 'api',
    number: '4',
    x: 160.5,
    inkTop: 503.25,
    tokens: [
      { text: 'api = ', tone: 'ident' },
      { text: 'service(', tone: 'ident' },
      { text: '"answer-api"', tone: 'string' },
      { text: ')', tone: 'ident' },
    ],
  },
  {
    id: 'ctx',
    number: '5',
    x: 160.5,
    inkTop: 554.25,
    tokens: [
      { text: 'ctx = ', tone: 'ident' },
      { text: 'depends(', tone: 'ident' },
      { text: '"mart.orders"', tone: 'string' },
      { text: ')', tone: 'ident' },
    ],
  },
  {
    id: 'model',
    number: '6',
    x: 160.5,
    inkTop: 603.75,
    tokens: [
      { text: 'model = ', tone: 'ident' },
      { text: 'depends(', tone: 'ident' },
      { text: '"ai.answer_v2"', tone: 'string' },
      { text: ')', tone: 'ident' },
    ],
  },
  {
    id: 'return',
    number: '7',
    x: 160.5,
    inkTop: 654,
    tokens: [
      { text: 'return ', tone: 'keyword' },
      { text: 'model.ask(question, ctx)', tone: 'ident' },
    ],
  },
]

/** The four right-hand callouts — ring geometry/tones measured on the frame average
 * (callout 1's ring is amber, its label gray; 2/3 rings cyan/blue with white labels;
 * 4 green with a gray label), label advance/cap from the ink runs. */
export const SCHEMATIC_ROWS_CALLOUTS: CalloutSpec[] = [
  {
    id: 'dependencies',
    label: 'DEPENDENCIES TO MAINTAIN',
    ring: { cx: 1053.75, cy: 459.4, rx: 26.25, ry: 20.6, rot: -10, fill: '#f5b839' },
    ink: { x: 1026.75, inkTop: 485.25, cap: 15.75, advance: 14.25, fill: '#a5a5af' },
    click: CLICK_CALLOUT_1,
  },
  {
    id: 'api',
    label: 'API IT CALLS',
    ring: { cx: 1050.4, cy: 605.6, rx: 17.6, ry: 20.6, rot: -12, fill: '#3dc0d4' },
    tail: [[1043, 628], [1034, 638]],
    ink: { x: 1094.25, inkTop: 594.75, cap: 19.9, advance: 16.9, fill: '#f5f4f7' },
    click: CLICK_BAND,
  },
  {
    id: 'data',
    label: 'DATA IT READS',
    ring: { cx: 1050.4, cy: 695.6, rx: 17.6, ry: 20.6, rot: -12, fill: '#4791de' },
    ink: { x: 1095, inkTop: 684.75, cap: 19.9, advance: 16.7, fill: '#f5f4f7' },
    click: 8,
  },
  {
    id: 'model',
    label: 'MODEL IT ASKS',
    ring: { cx: 1052.25, cy: 789, rx: 15.75, ry: 14.6, rot: -8, fill: '#39c596' },
    tail: [[1051, 772], [1047, 754]],
    ink: { x: 1094.25, inkTop: 775.5, cap: 15.75, advance: 14.4, fill: '#afaeb2' },
    click: 9,
  },
]

/** The demo seed: the recording's verbatim listing + measured callout ladder. */
export const SCHEMATIC_ROWS_SCENE: SchematicRowsData = {
  rows: SCHEMATIC_ROWS_ROWS,
  callouts: SCHEMATIC_ROWS_CALLOUTS,
}

/** Verbatim text of a row (tokens joined) — the OCR-verified strings tests assert. */
export function rowText(row: CodeRow): string {
  return row.tokens.map((token) => token.text).join('')
}

/** Flat per-character stream of a row, tone carried per character (the typewriter's units). */
export function rowChars(row: CodeRow): { ch: string, tone: RowTokenTone }[] {
  return row.tokens.flatMap((token) =>
    Array.from(token.text).map((ch) => ({ ch, tone: token.tone })),
  )
}

/** Resolved px geometry for one callout, ready to render (label font/tracking from
 * the measured cap + advance: font = cap ÷ 0.729, tracking = advance − 0.6·font). */
export interface CalloutLayout {
  id: string
  label: string
  ring: { cx: number, cy: number, rx: number, ry: number, rot: number, fill: string }
  tail: [number, number][]
  ink: { x: number, baseline: number, font: number, tracking: number, fill: string }
  click: number
}

export interface SchematicRowsLayout {
  rows: { id: string, number: string, x: number, y: number, inkTop: number, click: number, chars: { ch: string, tone: RowTokenTone }[], charDelayMs: number }[]
  callouts: CalloutLayout[]
  viewBox: Canvas
}

/** Label cap-height ratio of the deck's mono face (chrome.ts CAP_HEIGHT_RATIO). */
const LABEL_CAP_RATIO = 0.729

/**
 * Resolve the full render layout for the SchematicRows scene. Rows keep their
 * measured positions verbatim (x, inkTop); each row's click is FIRST_ROW_CLICK + i
 * (rows 3–9), its per-char delay completes the row's share of the ≈9.8 s typewriter.
 * Callout tracking solves advance = 0.6·font + tracking for the measured advance.
 */
export function schematicRowsLayout(data: SchematicRowsData = SCHEMATIC_ROWS_SCENE, viewBox: Canvas = { width: 1920, height: 1080 }): SchematicRowsLayout {
  if (data.rows.length === 0) {
    throw new RangeError('SchematicRows needs at least one row')
  }

  const rows = data.rows.map((row, i) => {
    const chars = rowChars(row)
    return {
      id: row.id,
      number: row.number,
      x: row.x,
      y: row.inkTop - ROW_EM_TO_INK,
      inkTop: row.inkTop,
      click: rowClick(i),
      chars,
      charDelayMs: rowCharDelayMs(chars.length),
    }
  })

  const callouts = data.callouts.map((callout) => {
    const font = callout.ink.cap / LABEL_CAP_RATIO
    const tracking = callout.ink.advance - 0.6 * font
    return {
      id: callout.id,
      label: callout.label,
      ring: callout.ring,
      tail: callout.tail ?? [],
      ink: {
        x: callout.ink.x,
        baseline: callout.ink.inkTop + callout.ink.cap,
        font,
        tracking,
        fill: callout.ink.fill,
      },
      click: callout.click,
    }
  })

  return { rows, callouts, viewBox }
}
