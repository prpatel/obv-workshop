/**
 * Pure layout for the PillarRow family — the seg05 (61–63s) three-card icon
 * row, exact-trace edition.
 *
 * Every constant is re-measured from the settled reference frame's
 * connected-component structure (user8-analysis/report.json, seg05_61s-63s
 * `structure` classes; 2560×1440 → mapped 1920×1080), and the numbers cite
 * those bboxes, not estimates:
 *
 * - Three stations on a uniform pitch: glyph-cluster lefts 0.1512 / 0.4125 /
 *   0.6738 of canvas width (pitch 0.2613), ink boxes 0.0508–0.0511 wide ×
 *   0.0909 tall — a ~98px square at 1920×1080, all sharing the y band
 *   0.4688–0.5597.
 * - Each glyph has a companion ACCENT BADGE lower-right: union boxes x
 *   0.282–0.3328 and 0.543–0.5941, y 0.5486–0.6389 (station 3's badge is too
 *   dim for the hue classes and is derived by extending station 2 with the
 *   0.261 badge pitch → left 0.804). The badge reads as a ring outline
 *   (0.0422×0.0847 at station 1) around a solid core (0.0258×0.0466).
 * - Labels are small hue-matched text rows under the glyphs — cap band y
 *   0.5771–0.591, first-char inks at x 0.1594 / 0.4133 / 0.6785, per-char
 *   advance 0.00708 of width (station 1's five-char pitch).
 * - Near-black organizing plates (the V-3 correction): the card boxes
 *   x≈0.13–0.29 / 0.38–0.54 / 0.64–0.80, y≈0.45–0.65 are DIM plates on the
 *   black canvas (luma 6–40), never light-gray fills. The plate boxes are the
 *   task-pinned composition; the dim-pixel masks show no strong inner
 *   structure, so the plates stay plain near-black rounded rects.
 * - Two summary text rows below the card band: y 0.6542–0.6743 (warm
 *   salmon median #d16157) and y 0.6813–0.6986 (neutral gray #686868), ink
 *   x-extents 0.2789–0.8469 and 0.2883–0.8508.
 * - Station hues (settled medians): glyph strokes #efeff0 / #37a9cd / #3bbe9e;
 *   badge fills #f96300 / #e34b26 / #8f0b5d (station 2 carries a red ring
 *   #e5342b around a red-orange core); label fills #eeeff0 / #51bdda /
 *   #44d0a8.
 * - Reveal onsets (f15 progressive frames): glyph+label 1 @0.067s, badge 1
 *   @0.267s, glyph+label 2 @0.600s, badge 2 @0.733s, glyph+label 3 @1.000s
 *   (badge 3 rides its card — too dim for its own beat), summary rows
 *   @1.467s completing ≈1.933s. The draft [0.07, 0.40, 0.73, 1.07, 1.47,
 *   1.87] schedule is superseded by these measured onsets; the final
 *   schedule lands with the slide in the integration PR.
 *
 * All functions here are pure and deterministic: same inputs produce
 * byte-identical output, and nothing touches the DOM (SSR-safe build).
 */

/** One pillar card (data contract) — content travels with the slide. */
export interface PillarCard {
  /** Stable key — used for a11y labels, test selectors, and :key. */
  id: string
  /** Small label row under the glyph (hue-matched per station). */
  label: string
  /** Lucide registry key resolved through `iconPath ?? ICON_FALLBACK`. */
  icon: string
}

/** Layout knobs. Every field is optional; omitted fields fall back to the measured defaults. */
export interface PillarOptions {
  /** ViewBox width in user units. Default 1920. */
  width?: number
  /** ViewBox height in user units. Default 1080. */
  height?: number
}

/** Near-black organizing plate behind one station (V-3: dim, never light gray). */
export interface PillarPlate {
  x: number
  y: number
  w: number
  h: number
}

/** The station's icon ink box — a ~98px square centered on the cluster. */
export interface PillarGlyph {
  cx: number
  cy: number
  size: number
}

/** Companion accent badge lower-right of the glyph: ring + solid core ellipses. */
export interface PillarBadge {
  cx: number
  cy: number
  /** Ring ellipse radii (stroke only). */
  rx: number
  ry: number
  /** Solid core ellipse radii (filled). */
  coreRx: number
  coreRy: number
}

/** Hue-matched label row under the glyph. */
export interface PillarLabel {
  x: number
  baselineY: number
  capHeight: number
  /** Pinned ink width: label length × the measured per-char advance. */
  textLength: number
}

/** Summary text row below the card band. */
export interface PillarTextRow {
  x: number
  baselineY: number
  capHeight: number
  /** Pinned ink width — the measured row extent (the recording's condensed mono). */
  textLength: number
}

export interface PillarCardLayout {
  index: number
  plate: PillarPlate
  glyph: PillarGlyph
  badge: PillarBadge
  label: PillarLabel
}

export interface PillarLayout {
  cards: PillarCardLayout[]
  textRows: PillarTextRow[]
  viewBox: { width: number; height: number }
}

/**
 * Measured reveal onsets in seconds (f15 progressive frames — see module
 * docblock). Beat k maps to the component's v-click k: card 1, badge 1,
 * card 2, badge 2, card 3 (+ its badge), summary rows.
 */
export const REVEAL_BEATS_SEC = [0.067, 0.267, 0.6, 0.733, 1.0, 1.467] as const

/** Measured constants — fractions of the 1920×1080 canvas (see module docblock). */
const MEASURED = {
  width: 1920,
  height: 1080,
  // Glyph clusters: connected-component unions of the station's icon ink.
  glyphLefts: [0.1512, 0.4125, 0.6738],
  glyphWidths: [0.0511, 0.0508, 0.0508],
  glyphTop: 0.4688,
  glyphHeight: 0.0909,
  // Accent badges: union boxes; station 3 extends station 2 by the 0.261 pitch.
  badgeLefts: [0.282, 0.543, 0.804],
  badgeWidths: [0.0508, 0.0511, 0.0508],
  badgeTop: 0.5486,
  badgeHeight: 0.0903,
  // Badge ring + core, measured on station 1 and shared by every station.
  badgeRing: { x: 0.2906, y: 0.5542, w: 0.0422, h: 0.0847 },
  badgeCore: { x: 0.2945, y: 0.5708, w: 0.0258, h: 0.0466 },
  // Labels: first-char ink lefts + cap band + per-char advance.
  labelLefts: [0.1594, 0.4133, 0.6785],
  labelCapTop: 0.5771,
  labelCapHeight: 0.0139,
  labelAdvance: 0.00708,
  // Near-black organizing plates (task-pinned composition, V-3).
  plateLefts: [0.13, 0.385, 0.64],
  plateTop: 0.45,
  plateWidth: 0.16,
  plateHeight: 0.2,
  // Summary text rows below the card band.
  rows: [
    { x: 0.2789, capTop: 0.6542, capHeight: 0.0201, textLength: 0.568 },
    { x: 0.2883, capTop: 0.6813, capHeight: 0.0173, textLength: 0.5625 },
  ],
} as const

/**
 * Emit geometry at 1e-6 precision: IEEE-754 products like 0.13×1920 become
 * 249.60000000000002 in float math; the layout is a measured spec, so values
 * round at the construction boundary — clean SVG attributes, still deterministic
 * and well inside the 1e-6 test tolerance.
 */
const r6 = (n: number): number => Math.round(n * 1e6) / 1e6

export function pillarRowLayout(cards: PillarCard[], opts?: PillarOptions): PillarLayout {
  if (!Array.isArray(cards) || cards.length < 1 || cards.length > 3) {
    throw new RangeError(`the reference composition has three pillars, received ${cards?.length}`)
  }
  if (new Set(cards.map((c) => c.id)).size !== cards.length) {
    throw new RangeError('card ids must be unique')
  }
  if (cards.some((c) => typeof c.label !== 'string' || c.label.trim().length === 0)) {
    throw new RangeError('card labels must be non-empty')
  }

  const width = opts?.width ?? MEASURED.width
  const height = opts?.height ?? MEASURED.height

  const cardsOut: PillarCardLayout[] = cards.map((card, i) => {
    const glyphLeft = MEASURED.glyphLefts[i] * width
    const glyphW = MEASURED.glyphWidths[i] * width
    const badgeLeft = MEASURED.badgeLefts[i] * width
    const badgeBoxW = MEASURED.badgeWidths[i] * width
    // Ring/core geometry is measured on station 1 and shared; anchor both
    // ellipses at the badge union box's center.
    const ringW = MEASURED.badgeRing.w * width
    const ringH = MEASURED.badgeRing.h * height
    const coreW = MEASURED.badgeCore.w * width
    const coreH = MEASURED.badgeCore.h * height
    return {
      index: i,
      plate: {
        x: r6(MEASURED.plateLefts[i] * width),
        y: r6(MEASURED.plateTop * height),
        w: r6(MEASURED.plateWidth * width),
        h: r6(MEASURED.plateHeight * height),
      },
      glyph: {
        cx: r6(glyphLeft + glyphW / 2),
        cy: r6((MEASURED.glyphTop + MEASURED.glyphHeight / 2) * height),
        size: r6(glyphW),
      },
      badge: {
        cx: r6(badgeLeft + badgeBoxW / 2),
        cy: r6((MEASURED.badgeTop + MEASURED.badgeHeight / 2) * height),
        rx: r6(ringW / 2),
        ry: r6(ringH / 2),
        coreRx: r6(coreW / 2),
        coreRy: r6(coreH / 2),
      },
      label: {
        x: r6(MEASURED.labelLefts[i] * width),
        baselineY: r6((MEASURED.labelCapTop + MEASURED.labelCapHeight) * height),
        capHeight: r6(MEASURED.labelCapHeight * height),
        textLength: r6(card.label.length * MEASURED.labelAdvance * width),
      },
    }
  })

  const textRows: PillarTextRow[] = MEASURED.rows.map((row) => ({
    x: r6(row.x * width),
    baselineY: r6((row.capTop + row.capHeight) * height),
    capHeight: r6(row.capHeight * height),
    textLength: r6(row.textLength * width),
  }))

  return { cards: cardsOut, textRows, viewBox: { width, height } }
}
