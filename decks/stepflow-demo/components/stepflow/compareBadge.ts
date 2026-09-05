/**
 * Pure layout for the CompareBadge diagram family — two near-black plate
 * columns flanking a central orange badge (user8 seg12, 134s–139s).
 *
 * Every constant below was measured on the seg12 settled reference frame
 * (2560×1440, `/home/user/work/user8-analysis/seg12_134s-139s/settled.png`,
 * report.json `seg12_134s-139s`); the settled frame maps 1:1 onto the
 * 1920×1080 stage (the seg12 recording is a full-frame capture — its title
 * band y 0.0965–0.1493 matches the deck chrome convention exactly, so no
 * crop-offset fit is needed):
 *
 * - Each column is TWO stacked near-black plates, not one slab — the settled
 *   frame reads plate luma (6–40, V-3: `#12131a` median, slightly blue-tinted,
 *   NOT gray) over y 576–748 and 990–1161, with a pure-black slot between
 *   them (y 748–990) where the badge sits. Columns are x 314–978 (left) and
 *   x 1582–2246 (right) — 664px wide each, 314px margins, 604px slot.
 * - The badge is a rounded-square orange core (report `orange[0]` bbox
 *   x 0.45–0.552, y 0.4965–0.6667 → 261×245px, corner r≈30px) sitting on a
 *   dark red-brown halo circle (r≈163px at (1281, 839) — the settled "red
 *   rim": sampled `#401507`), with four dim-orange leader lines
 *   (`#bb5323`) running from the halo to each plate's inner edge. The leader
 *   endpoints read off the settled map are 4-fold symmetric around the halo
 *   center at (±297, ∓175)/(±161, ±94) offsets; they agree with report
 *   `red[0]` bbox [0.3891, 0.4583, 0.616, 0.7382] to ±12px (map resolution).
 * - The core's fill is the settled median rgb(248, 87, 33) — exactly the
 *   deck's orange `#f85721` (the research brief's exact sample).
 * - Each plate carries an icon glyph box + two text rows: a bright white
 *   headline (36px cap band native) and a dim gray detail line (20px
 *   x-height band). Line ink starts at x 468 (left plates) / x 1736 (right
 *   plates); the row y-bands are shared across plates (622/690 top, 1036/1104
 *   bottom). Line TEXT is content — it travels with the slide as
 *   `BadgeRowContent` and lands with the integration PR (the settled frame's
 *   words are not transcribable at native resolution without OCR; the boxes
 *   are measured, the words are not invented here).
 * - Reveal (event trace + f15 dumps, 15fps): the badge core fades in at
 *   t≈0.600 and reaches full orange by ≈0.80; the halo/leader rim trails at
 *   ≈0.667. Four text waves then alternate left/right: left-top ≈1.00,
 *   right-top ≈1.73, left-bottom ≈3.00, right-bottom ≈4.40 — each wave
 *   carries its plate, icon, and both text lines together (~320ms fade).
 *
 * All functions here are pure and deterministic: same inputs produce
 * byte-identical output, and nothing touches the DOM (SSR-safe build).
 */

/** A resolved rectangle in stage units (1920×1080 by default). */
export interface BadgeRect {
  x: number
  y: number
  w: number
  h: number
}

/** A resolved circle in stage units. */
export interface BadgeCircle {
  cx: number
  cy: number
  r: number
}

/** A resolved line segment in stage units. */
export interface BadgeSegment {
  x1: number
  y1: number
  x2: number
  y2: number
}

/** One measured text row: ink start, ink band top, band height, baseline. */
export interface BadgeLineBox {
  /** Ink left edge (stage units). */
  x: number
  /** Top of the ink band — cap band for bright rows, x-height band for dim rows. */
  topY: number
  /** Ink band height (stage units). */
  bandHeight: number
  /** Text baseline (stage units) — the ink band's bottom edge. */
  baseline: number
}

/** Which of the four plate rows a piece of content belongs to. */
export type BadgeRowId = 'leftTop' | 'rightTop' | 'leftBottom' | 'rightBottom'

/** A plate row with its resolved geometry and reveal click. */
export interface BadgeRowLayout {
  id: BadgeRowId
  /** 1-based Slidev click that reveals this row (badge itself is click 1). */
  click: number
  /** The near-black plate rectangle. */
  plate: BadgeRect
  /** Icon glyph box inside the plate (content = icons.ts registry key). */
  icon: BadgeRect
  /** Bright white headline row. */
  bright: BadgeLineBox
  /** Dim gray detail row. */
  dim: BadgeLineBox
}

/** Resolved layout for the whole composition on one canvas. */
export interface CompareBadgeLayout {
  /** Four rows in reveal order: leftTop → rightTop → leftBottom → rightBottom. */
  rows: BadgeRowLayout[]
  /** Dark red-brown halo circle behind the core (the settled "red rim"). */
  halo: BadgeCircle
  /** Orange rounded-square core. */
  core: BadgeRect & { corner: number }
  /** Dark glyph box centered in the core (content = optional icons.ts key). */
  glyph: BadgeRect
  /** Four dim leader lines from the halo to the plates' inner edges. */
  leaders: BadgeSegment[]
  viewBox: { width: number; height: number }
}

/** Slide-level content for one plate row (geometry stays in this module). */
export interface BadgeRowContent {
  id: BadgeRowId
  /** Bright white headline line. */
  bright: string
  /** Dim gray detail line. */
  dim: string
  /** Optional icons.ts registry key rendered in the row's measured tone. */
  icon?: string
  /**
   * Optional measured ink width for the bright line as a fraction of stage
   * width — pins the run spacing-only when the natural mono advance misses
   * it (title chrome convention; glyphs never squeeze).
   */
  brightInkFrac?: number
  /** Optional measured ink width for the dim line (same convention). */
  dimInkFrac?: number
}

export interface CompareBadgeOptions {
  /** ViewBox width in user units. Default 1920. */
  width?: number
  /** ViewBox height in user units. Default 1080. */
  height?: number
}

/**
 * Measured constants in NATIVE settled-frame pixels (2560×1440) — the numbers
 * cite the frame, not the stage; `compareBadgeLayout` scales them to the
 * requested canvas. Plate/icon/leader edges come from settled-frame luma
 * scanlines (6–40 plate band, this session); the core box is report.json's
 * `orange[0]` bbox; the text bands are the settled white component +
 * per-row ink profiles.
 */
const MEASURED = {
  plates: {
    leftTop: { x: 314, y: 576, w: 664, h: 172 },
    rightTop: { x: 1582, y: 576, w: 664, h: 172 },
    leftBottom: { x: 314, y: 990, w: 664, h: 171 },
    rightBottom: { x: 1582, y: 990, w: 664, h: 171 },
  },
  icons: {
    leftTop: { x: 356, y: 630, w: 68, h: 63 },
    rightTop: { x: 1620, y: 630, w: 80, h: 63 },
    leftBottom: { x: 356, y: 1046, w: 84, h: 58 },
    rightBottom: { x: 1620, y: 1030, w: 82, h: 77 },
  },
  halo: { cx: 1281, cy: 839, r: 163 },
  core: { x: 1152, y: 715, w: 261, h: 245, corner: 30 },
  // Dark glyph zone inside the core (settled-frame dark bits, rows ~784–896).
  glyph: { x: 1230, y: 784, w: 115, h: 112 },
  // 4-fold symmetric around the halo center: outer tips (±297, ∓175), inner
  // tips (±161, ±94). Order: UL, UR, LL, LR.
  leaders: [
    { x1: 984, y1: 664, x2: 1120, y2: 745 },
    { x1: 1578, y1: 664, x2: 1442, y2: 745 },
    { x1: 984, y1: 1014, x2: 1120, y2: 933 },
    { x1: 1578, y1: 1014, x2: 1442, y2: 933 },
  ],
  // Bright rows: 36px cap band (cap top 622 top plates / 1036 bottom plates).
  brightBand: { topCapY: 622, bottomCapY: 1036, cap: 36 },
  // Dim rows: 20px x-height band (690 top / 1104 bottom).
  dimBand: { topY: 690, bottomY: 1104, band: 20 },
  inkStart: { left: 468, right: 1736 },
} as const

const NATIVE = { width: 2560, height: 1440 } as const

/**
 * Settled-fill family constants (median samples on the seg12 settled frame).
 * Ambient tones are family constants, not palette roles — the badge core is
 * the exception: it rides `palette.accent` through the `orangeSpine` preset,
 * whose accent IS this exact color.
 */
export const PLATE_FILL = '#12131a'
export const HALO_FILL = '#401507'
export const LEADER_STROKE = '#bb5323'
export const BRIGHT_INK = '#f5f4f7'
export const DIM_INK = '#acadb5'
/** Exact settled core sample — the research brief pins this hex verbatim. */
export const CORE_FILL = '#f85721'

/** Measured icon-glyph tones (settled medians of each row's colored bits). */
export const ICON_TONES: Record<BadgeRowId, string> = {
  leftTop: '#23cee1',
  rightTop: '#f45822',
  leftBottom: '#3b97f5',
  rightBottom: '#23cd9e',
}

/**
 * Draft beat schedule in seconds from run start, pinned against the f15
 * frame dumps (one entry per click; the badge is click 1, the four text
 * waves are clicks 2–5). 15fps pin resolution (±66.7ms): core fade onset
 * f0009, waves first visible at f0015/f0026/f0045/f0066. The slide's
 * `<AutoAdvance :step-schedule-sec>` consumes this at integration — the
 * list must cover every click (a short list repeats its final interval).
 */
export const REVEAL_BEATS_SEC = [0.6, 1.0, 1.73, 3.0, 4.4] as const

/** Reveal order of the four rows (the waves alternate left/right). */
export const ROW_IDS: readonly BadgeRowId[] = ['leftTop', 'rightTop', 'leftBottom', 'rightBottom']

/** The badge pops first; row i (0-based) reveals on click i + 2. */
export const ROW_CLICK_BASE = 2

/** Scale one native-px length to the target canvas width. */
function scaleX(px: number, width: number): number {
  return (px / NATIVE.width) * width
}

/** Scale one native-px length to the target canvas height. */
function scaleY(px: number, height: number): number {
  return (px / NATIVE.height) * height
}

/**
 * Resolve the measured seg12 composition onto a canvas.
 *
 * Defaults to the 1920×1080 stage. Throws RangeError for non-finite or
 * non-positive canvas dimensions. Pure: byte-identical output for
 * byte-identical inputs.
 */
export function compareBadgeLayout(opts?: CompareBadgeOptions): CompareBadgeLayout {
  const width = opts?.width ?? 1920
  const height = opts?.height ?? 1080
  if (!Number.isFinite(width) || width <= 0 || !Number.isFinite(height) || height <= 0) {
    throw new RangeError(`canvas dimensions must be positive finite numbers, received ${width}×${height}`)
  }

  const rows = ROW_IDS.map((id, i) => {
    const plate = MEASURED.plates[id]
    const icon = MEASURED.icons[id]
    const isTop = id === 'leftTop' || id === 'rightTop'
    const inkStart = id === 'leftTop' || id === 'leftBottom' ? MEASURED.inkStart.left : MEASURED.inkStart.right
    const brightTop = isTop ? MEASURED.brightBand.topCapY : MEASURED.brightBand.bottomCapY
    const dimTop = isTop ? MEASURED.dimBand.topY : MEASURED.dimBand.bottomY
    return {
      id,
      click: i + ROW_CLICK_BASE,
      plate: {
        x: scaleX(plate.x, width),
        y: scaleY(plate.y, height),
        w: scaleX(plate.w, width),
        h: scaleY(plate.h, height),
      },
      icon: {
        x: scaleX(icon.x, width),
        y: scaleY(icon.y, height),
        w: scaleX(icon.w, width),
        h: scaleY(icon.h, height),
      },
      bright: {
        x: scaleX(inkStart, width),
        topY: scaleY(brightTop, height),
        bandHeight: scaleY(MEASURED.brightBand.cap, height),
        baseline: scaleY(brightTop + MEASURED.brightBand.cap, height),
      },
      dim: {
        x: scaleX(inkStart, width),
        topY: scaleY(dimTop, height),
        bandHeight: scaleY(MEASURED.dimBand.band, height),
        baseline: scaleY(dimTop + MEASURED.dimBand.band, height),
      },
    }
  })

  return {
    rows,
    halo: {
      cx: scaleX(MEASURED.halo.cx, width),
      cy: scaleY(MEASURED.halo.cy, height),
      r: scaleX(MEASURED.halo.r, width),
    },
    core: {
      x: scaleX(MEASURED.core.x, width),
      y: scaleY(MEASURED.core.y, height),
      w: scaleX(MEASURED.core.w, width),
      h: scaleY(MEASURED.core.h, height),
      corner: scaleX(MEASURED.core.corner, width),
    },
    glyph: {
      x: scaleX(MEASURED.glyph.x, width),
      y: scaleY(MEASURED.glyph.y, height),
      w: scaleX(MEASURED.glyph.w, width),
      h: scaleY(MEASURED.glyph.h, height),
    },
    leaders: MEASURED.leaders.map((l) => ({
      x1: scaleX(l.x1, width),
      y1: scaleY(l.y1, height),
      x2: scaleX(l.x2, width),
      y2: scaleY(l.y2, height),
    })),
    viewBox: { width, height },
  }
}
