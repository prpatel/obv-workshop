/**
 * SchematicRows data contract + pure layout math (exact-trace sheet art_mkVNxsft §2).
 *
 * A macOS-style code window: traffic-dot chrome, an `answer_service.py` tab, seven
 * verbatim mono rows (row numbers in the gutter, teal highlight strips behind rows
 * 4–5, a cyan connector rail alongside rows 4–6), and a four-callout annotation
 * ladder on the right. Rows type in character by character (the recording's ≈9.8 s
 * typewriter, re-paced to one row per click); the strips, rail and callouts key to
 * the rows they annotate. Pure and SSR-safe: no DOM access, no mutation of inputs.
 *
 * SCALE CORRECTION (this session): every coordinate here is a DIRECT 1920×1080
 * measurement of the downscaled comparison frame (frame 861, Lanczos 2560×1440 →
 * 1920×1080). An earlier pass multiplied these values by 0.75 assuming they were
 * native — that put the whole scene ~25% too small/high and is the reason the
 * first re-capture scored SSIM 0.295. Where the sheet's prose and the pixels
 * disagreed, the pixels won and the finding is recorded here:
 *
 * - Row pitch: measured ink tops 446/507/572/632/695/757/820 — pitch ≈62.3px,
 *   matching the sheet. Code margin x=124 (rows 1–2), 4-slot indent x=204
 *   (rows 3–7). Gutter digits sit at x84–97 on EVERY row (gray #a5a5ae).
 * - The mono advance is ≈19.6px at cap ≈23.7 — the deck's mono at 32.5px with NO
 *   condensation (the condensed-face note applied to titles, not code). String
 *   literals render ~25px wider than mono over their length (tracked ≈+2.1px/char).
 * - Token colors (stroke-core estimates from run means): keywords #4298f2 ✓ sheet,
 *   comments #8f8e99 (sheet #888791 was AA-diluted), identifiers #f2f2f2 ✓,
 *   function names #38d3ec (teal — same family as the rail), `str` type
 *   annotations #34d59e (green), string literals #ebbe3a (AMBER — the sheet's
 *   "strings near-white" is wrong; every literal reads (215,174,55) in the frame).
 * - The window is a single top rule (y302, x46–1459); the sheet's left/right
 *   rules and x≈973 divider do not exist in the frame. No tab underline (the
 *   sparse ink at y360–364 is the `_`/`p`/`y` descenders).
 * - The path `data.mrk.shop/services` is sheet-authoritative but is NOT visible
 *   in the settled frame (no ink above luma 35 right of x1412); rendered per
 *   sheet, right-aligned to x1408.
 * - The teal highlight is TWO per-row strips (y615.5–672.5 and y677–733.5, both
 *   x41–1191) with a 5px gap between rows — not one solid band. The cyan rail
 *   runs x43–48.5, y618–793 (rows 4–6).
 * - Callouts sit at x≈1290–1720: ring 1 amber ABOVE its gray label; rings 2–4
 *   (cyan/blue/green) LEFT of labels at x≈1413–1417. Labels share advance
 *   ≈17.9px; caps 20 (l1) / 25 (l2/l3) / 26 (l4).
 */

/** Tone of one row token — measured constants, never palette fields. */
export type RowTokenTone = 'keyword' | 'ident' | 'fn' | 'type' | 'string' | 'comment'

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
  /** Left edge of the row's first glyph, 1920×1080 px. */
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
  /** `stroke` is the measured ring stroke width in px (rings vary: 14 on the fat
   * amber ellipse, 4–6.5 on the small ladder rings). */
  ring: { cx: number, cy: number, rx: number, ry: number, rot: number, fill: string, stroke: number }
  /** Optional short tail stroke off the ring (the hand-drawn look), 1080 px points. */
  tail?: [number, number][]
  /** Measured label ink: left edge, ink top, cap height, per-char advance, color (1080 px). */
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

/** Token colors — measured stroke cores (frame 861), constants of the tone convention. */
export const TOKEN_COLORS: Record<RowTokenTone, string> = {
  keyword: '#4298f2',
  ident: '#f2f2f2',
  fn: '#38d3ec',
  type: '#34d59e',
  string: '#ebbe3a',
  comment: '#8f8e99',
}

/** Extra per-char tracking (px) on string tokens: literals measure ~25px wider
 * than the mono advance over ~12 chars (e.g. row 4 ends x759, mono predicts 734). */
export const STRING_EXTRA_TRACKING = 2.1

/** Window chrome: one dim top rule (measured y299–305 soft profile peaking
 * y303–304 at luma ≈37 — rendered as a 2.5px core at the peak luma, blurred
 * 1.3px in the component to reproduce the soft profile). */
export const WINDOW_FRAME = {
  top: { x: 46, y: 302, w: 1413, h: 2.5, fill: '#2b261e' },
} as const

/** Window ambience plates (measured flat fills in the settled frame): a chrome
 * band behind the dots/tab/rule, the dark code canvas, and the slightly blue
 * callout-column canvas. The frame is NOT pure black below the chrome — these
 * three plates are the dominant background. */
export const WINDOW_PLATES = {
  band: { x: 14, y: 312, w: 1794, h: 81, fill: '#19181d' },
  main: { x: 14, y: 395, w: 1206, h: 685, fill: '#080808' },
  right: { x: 1220, y: 395, w: 588, h: 685, fill: '#0c0b10' },
} as const

/** Traffic dots (measured centers (63.3/96.8/131.6, 348.9), d≈20). */
export const TRAFFIC_DOTS = [
  { cx: 63.3, cy: 348.9, r: 10, fill: '#fb5c55' },
  { cx: 96.8, cy: 348.9, r: 10, fill: '#f5b839' },
  { cx: 131.6, cy: 348.9, r: 10, fill: '#30bf49' },
] as const

/** Tab text: a SMALLER, letter-spaced label than the code rows — the frame's tab
 * ink is cap ≈17 (y341–358) over 17 chars spanning x187–492 (advance ≈18.3px),
 * i.e. font ≈23.3 with +4.3px/char tracking. No underline — the y360–364 ink is
 * the `_`/`p`/`y` descenders.
 *
 * The sheet's right-aligned `data.mrk.shop/services` path is NOT visible in the
 * settled frame (no ink above luma 35 right of x1412 beyond a 3-px stray cluster
 * at x1412–1414 and a dim ~46px cluster at x1412–1458 too small for any string);
 * it is therefore not rendered — recorded here so the divergence is traceable. */
export const TAB_TEXT = {
  text: 'answer_service.py',
  x: 187,
  baseline: 358,
  font: 23.3,
  tracking: 4.3,
  fill: '#e4e3e8',
} as const

/** Gutter row numbers (measured digit ink x84–97 on every row, gray; the glyph
 * side-bearing at font 32.5 is ≈4px, so the text anchor sits at 80.5). */
export const ROW_NUMBER_STYLE = { x: 80.5, font: 32.5, fill: '#a5a5ae' } as const

/** Code-row typography: the deck mono at 32.5px, uncondensed — measured advance
 * ≈19.6px (0.6em), cap ≈23.7px, row-1 extent 124→743 within 1%. */
export const ROW_FONT = 32.5
export const ROW_SCALE_X = 1
/** Line-box top → ink-top offset for the mono stack at font 32.5 / line-height 1. */
export const ROW_EM_TO_INK = 1.4
/** Ink-top → baseline offset (cap 0.729em at font 32.5) — shared by code and gutter numbers. */
export const ROW_BASELINE = 23.7

/** Teal highlight strips behind rows 4 and 5 (measured y615.5–672.5 / y677–733.5,
 * both x41–1191, 5px gap between rows). */
export const HIGHLIGHT_BANDS = [
  { y: 615.5, h: 57 },
  { y: 677, h: 56.5 },
] as const
export const HIGHLIGHT_BAND = { x: 41, w: 1150, fill: '#08272c' } as const

/** Cyan connector rail alongside rows 4–6 (measured x43–48.5, y618–793). */
export const CONNECTOR_RAIL = { x: 43, y: 618, w: 5.5, h: 175, fill: '#35c2ea' } as const

/** Click choreography (sheet §2.3 motion trace re-paced to the README's 10 clicks):
 * chrome pops (1), callout 1 (2), then rows type one per click; the rail draws on
 * click 6, just before row 4, whose click (7) also brings the strips and callout 2;
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
 * average (indent: rows 3–7 one 4-slot step at x204; no trailing ';' on row 4;
 * '->' ASCII arrow; row 7 keeps its leading `return `). Token tones are the
 * measured cores: keywords blue, fn names teal, `str` green, literals amber. */
export const SCHEMATIC_ROWS_ROWS: CodeRow[] = [
  {
    id: 'imports',
    number: '1',
    x: 124,
    inkTop: 446,
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
    x: 124,
    inkTop: 507,
    tokens: [
      { text: 'def ', tone: 'keyword' },
      { text: 'answer', tone: 'fn' },
      { text: '(question: ', tone: 'ident' },
      { text: 'str', tone: 'type' },
      { text: ') -> ', tone: 'ident' },
      { text: 'str', tone: 'type' },
      { text: ':', tone: 'ident' },
    ],
  },
  {
    id: 'comment',
    number: '3',
    x: 204,
    inkTop: 572,
    tokens: [
      { text: '# the AI application', tone: 'comment' },
    ],
  },
  {
    id: 'api',
    number: '4',
    x: 204,
    inkTop: 632,
    tokens: [
      { text: 'api = ', tone: 'ident' },
      { text: 'service', tone: 'fn' },
      { text: '(', tone: 'ident' },
      { text: '"answer-api"', tone: 'string' },
      { text: ')', tone: 'ident' },
    ],
  },
  {
    id: 'ctx',
    number: '5',
    x: 204,
    inkTop: 695,
    tokens: [
      { text: 'ctx = ', tone: 'ident' },
      { text: 'depends', tone: 'fn' },
      { text: '(', tone: 'ident' },
      { text: '"mart.orders"', tone: 'string' },
      { text: ')', tone: 'ident' },
    ],
  },
  {
    id: 'model',
    number: '6',
    x: 204,
    inkTop: 757,
    tokens: [
      { text: 'model = ', tone: 'ident' },
      { text: 'depends', tone: 'fn' },
      { text: '(', tone: 'ident' },
      { text: '"ai.answer_v2"', tone: 'string' },
      { text: ')', tone: 'ident' },
    ],
  },
  {
    id: 'return',
    number: '7',
    x: 204,
    inkTop: 820,
    tokens: [
      { text: 'return ', tone: 'keyword' },
      { text: 'model', tone: 'ident' },
      { text: '.', tone: 'ident' },
      { text: 'ask', tone: 'fn' },
      { text: '(question, ctx)', tone: 'ident' },
    ],
  },
]

/** The four right-hand callouts — ring geometry/tones measured on frame 861
 * (ring 1 amber ABOVE its gray label; rings 2–4 cyan/blue/green LEFT of labels;
 * label advance ≈17.9px shared). */
export const SCHEMATIC_ROWS_CALLOUTS: CalloutSpec[] = [
  {
    id: 'dependencies',
    label: 'DEPENDENCIES TO MAINTAIN',
    ring: { cx: 1329, cy: 512.5, rx: 35, ry: 53.5, rot: -12, fill: '#f9bc28', stroke: 14 },
    ink: { x: 1289, inkTop: 610, cap: 20, advance: 17.9, fill: '#9d9ca6' },
    click: CLICK_CALLOUT_1,
  },
  {
    id: 'api',
    label: 'API IT CALLS',
    ring: { cx: 1319.5, cy: 761.5, rx: 21.5, ry: 21.5, rot: -12, fill: '#4ec3d8', stroke: 4 },
    tail: [[1312, 781], [1294, 802]],
    ink: { x: 1413, inkTop: 750, cap: 25, advance: 17.9, fill: '#f5f4f7' },
    click: CLICK_BAND,
  },
  {
    id: 'data',
    label: 'DATA IT READS',
    ring: { cx: 1319.5, cy: 876, rx: 23.5, ry: 27, rot: -10, fill: '#4e92e2', stroke: 6.5 },
    ink: { x: 1417, inkTop: 862, cap: 25, advance: 17.9, fill: '#f5f4f7' },
    click: 8,
  },
  {
    id: 'model',
    label: 'MODEL IT ASKS',
    ring: { cx: 1319.5, cy: 985.5, rx: 28.5, ry: 27.5, rot: -8, fill: '#46c797', stroke: 4 },
    tail: [[1322, 958], [1318, 934]],
    ink: { x: 1417, inkTop: 976, cap: 26, advance: 17.9, fill: '#afaeb2' },
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
  ring: { cx: number, cy: number, rx: number, ry: number, rot: number, fill: string, stroke: number }
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
 * Callout tracking solves advance = 0.6·font + tracking for the measured advance
 * (negative for the condensed caps labels).
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
