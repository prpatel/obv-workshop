/**
 * Pure layout for the PillarRow family — the seg05 (61–63s) three-card icon
 * row, settled-truth edition.
 *
 * Every constant below is re-measured directly from the settled reference
 * frame (settled_full.png, 2560×1440 → mapped 1920×1080) by connected-
 * component / scanline census / ASCII structural maps (work/refmeasure*.py and
 * this rebuild's badge+glyph census), and the docblock cites those
 * measurements, not estimates:
 *
 * - Three near-black organizing plates at the dim-mask boxes x 0.1445–0.3094
 *   / 0.3598–0.5594 / 0.6199–0.8195, y ≈0.4576–0.6722 — solid near-black
 *   fills (dim-mask means [15,13,15] / [12,14,20] / [13,14,17]), no visible
 *   stroke, station 1 narrower than 2/3.
 * - Glyph ink boxes x 0.1508–0.2066 / 0.4098–0.4648 / 0.6715–0.7277, shared
 *   y band 0.4681–0.5604 (≈99px tall at 1920). Settled ASCII maps show every
 *   station glyph is a BIG CIRCLE OUTLINE (~99px) with a small pictogram
 *   (~45% of the box) centered inside it — the component composes that
 *   anatomy from the registry icon at the measured ~3.5px canvas stroke.
 * - Accent badges are THIN CIRCLE OUTLINES (settled ASCII maps; the earlier
 *   pin reading — ring + core disc + tail — was wrong): circles centered
 *   (590,641) / (1092,641) / (1580,640), radii 47.5 / 47.5 / 46.5px, ~3.5px
 *   strokes, straddling each plate's right edge, each carrying a small bright
 *   mini-icon at its center (station 1: two square reel outlines over a solid
 *   bar — a cassette read; station 2: a solid diamond 45×50; station 3: a
 *   pennant flag). Badge hues (settled cores): #f96200 / #fb3929 / #bb0278.
 * - TWO label rows under each glyph (the second was deferred in the previous
 *   edition and is now included): row A cap band y 0.5771–0.591 with ink
 *   runs 0.1590–0.1941 (5 chars) / 0.4059–0.4695 (9) / 0.6781–0.7203 (6);
 *   row B cap band y 0.6042–0.6153, nine small chars per station over
 *   0.0574 of width starting 0.1477 / 0.4086 / 0.6699.
 * - The "summary rows" are NOT continuous lines: luma-40 column census finds
 *   sparse per-station caption clusters — row 1 (badge-hued) 8 / 10 / 7
 *   chars at x 0.2789 / 0.5328 / 0.7984, y ≈0.6542–0.6736, cores
 *   [208,123,66] / [212,96,88] / [183,69,136] (orange / salmon / magenta —
 *   each matching its station's badge hue); row 2 (gray) 6 / 9 / 8 chars at
 *   x 0.2883 / 0.5398 / 0.7937, y ≈0.6812–0.6979, cores ≈[108,108,109].
 * - Title: two-tone run splits at x 0.4359 (white head 0.2809–0.4359, green
 *   tail 0.4359–0.7203 — the tail is ~1.8× the head's ink, a ~15-char run,
 *   not the previous 8-char pin), cap band y 0.0938–0.1493 (cap ≈60px).
 * - Reveal onsets (f15 progressive frames): glyph+label 1 @0.067s, badge 1
 *   @0.267s, glyph+label 2 @0.600s, badge 2 @0.733s, glyph+label 3 @1.000s
 *   (badge 3 rides its card), caption clusters @1.467s completing ≈1.933s.
 *
 * All functions here are pure and deterministic: same inputs produce
 * byte-identical output, and nothing touches the DOM (SSR-safe build).
 */

/** One pillar card (data contract) — content travels with the slide. */
export interface PillarCard {
  /** Stable key — used for a11y labels, test selectors, and :key. */
  id: string
  /** Label row A under the glyph (hue-matched per station). */
  label: string
  /** Label row B — the small dim secondary row (deferred element, now rendered). */
  sublabel: string
  /** Badge-hued caption cluster under the badge (summary row 1, per station). */
  caption: string
  /** Gray meta caption cluster (summary row 2, per station). */
  captionMeta: string
  /** Lucide registry key resolved through `iconPath ?? ICON_FALLBACK`. */
  icon: string
  /** Optional clockwise rotation (degrees) for the pictogram inside its
   * circle — station 1's settled pictogram reads as a portrait envelope. */
  iconRotate?: number
}

/** Layout knobs. Every field is optional; omitted fields fall back to the measured defaults. */
export interface PillarOptions {
  /** ViewBox width in user units. Default 1920. */
  width?: number
  /** ViewBox height in user units. Default 1080. */
  height?: number
}

/** Near-black organizing plate behind one station. */
export interface PillarPlate {
  x: number
  y: number
  w: number
  h: number
}

/** The station's icon ink box. */
export interface PillarGlyph {
  cx: number
  cy: number
  size: number
}

/**
 * Companion accent badge: a thin circle outline straddling the plate's right
 * edge, carrying a small bright mini-icon at its center (settled-frame ASCII
 * maps: badge 1 = cassette reels + solid bar, badge 2 = solid diamond,
 * badge 3 = pennant flag). No fill, no core disc, no tail — the earlier pin
 * reading was wrong; the reference circles are open rings.
 */
export interface PillarBadge {
  cx: number
  cy: number
  /** Circle radius (outline). */
  r: number
  /** Raw SVG markup for the mini icon, in a 48-box centered on (0,0). */
  icon: string
}

/** One measured text run (label row or caption cluster). */
export interface PillarText {
  x: number
  baselineY: number
  capHeight: number
  /** Pinned ink width — the measured run extent (spacing-only pin). */
  textLength: number
}

export interface PillarCardLayout {
  index: number
  plate: PillarPlate
  glyph: PillarGlyph
  badge: PillarBadge
  label: PillarText
  sublabel: PillarText
  caption: PillarText
  captionMeta: PillarText
}

export interface PillarLayout {
  cards: PillarCardLayout[]
  viewBox: { width: number; height: number }
}

/**
 * Measured reveal onsets in seconds (f15 progressive frames — see module
 * docblock). Beat k maps to the component's v-click k: card 1, badge 1,
 * card 2, badge 2, card 3 (+ its badge), caption clusters.
 */
export const REVEAL_BEATS_SEC = [0.067, 0.267, 0.6, 0.733, 1.0, 1.467] as const

/**
 * Measured constants — fractions of the 1920×1080 canvas unless noted
 * (see module docblock for provenance).
 */
const MEASURED = {
  width: 1920,
  height: 1080,
  // Plates: dim-mask boxes per station (station 1 is narrower than 2/3).
  plates: [
    { x: 0.1445, y: 0.4576, w: 0.1649, h: 0.2146 },
    { x: 0.3598, y: 0.4583, w: 0.1996, h: 0.2139 },
    { x: 0.6199, y: 0.4576, w: 0.1996, h: 0.2125 },
  ],
  // Glyph ink boxes.
  glyphLefts: [0.1508, 0.4098, 0.6715],
  glyphWidths: [0.0558, 0.055, 0.0562],
  glyphTop: 0.4681,
  glyphHeight: 0.0923,
  // Glyph strokes are applied in canvas px via non-scaling stroke (the
  // reference scanline stroke is ~3.5px at 1920).
  glyphStrokePx: 3.5,
  // Badges: thin circle outlines straddling each plate's right edge (settled
  // ASCII maps + chord fits): centers (590,641)/(1092,641)/(1580,640),
  // radii 47.5/47.5/46.5px (radial-peak fit −2px), ~3.5px strokes; bright
  // mini-icon at each center.
  badgeCx: [0.307292, 0.56875, 0.822917],
  badgeCy: [0.593519, 0.593519, 0.592593],
  badgeR: [0.043983, 0.043983, 0.043057],
  // Label row A: ink-run lefts and extents (cap band 0.5771–0.591).
  labelLefts: [0.159, 0.4059, 0.6781],
  labelTextLengths: [0.0351, 0.0636, 0.0422],
  labelCapTop: 0.5771,
  labelCapHeight: 0.0139,
  // Label row B: nine small chars per station (cap band 0.6042–0.6153).
  sublabelLefts: [0.1477, 0.4086, 0.6699],
  sublabelTextLength: 0.0574,
  sublabelCapTop: 0.6042,
  sublabelCapHeight: 0.0111,
  // Badge-hued caption clusters (summary row 1, per station).
  captionLefts: [0.2789, 0.5328, 0.7984],
  captionTextLengths: [0.0566, 0.0711, 0.0489],
  captionCapTops: [0.6562, 0.6562, 0.6542],
  captionCapHeights: [0.0174, 0.0139, 0.0173],
  // Gray meta caption clusters (summary row 2, per station).
  metaLefts: [0.2883, 0.5398, 0.7937],
  metaTextLengths: [0.0375, 0.0571, 0.0575],
  metaCapTops: [0.684, 0.684, 0.6812],
  metaCapHeights: [0.0139, 0.0111, 0.0112],
} as const

/**
 * Emit geometry at 1e-6 precision: IEEE-754 products like 0.13×1920 become
 * 249.60000000000002 in float math; the layout is a measured spec, so values
 * round at the construction boundary — clean SVG attributes, still deterministic
 * and well inside the 1e-6 test tolerance.
 */
const r6 = (n: number): number => Math.round(n * 1e6) / 1e6

function textRun(
  left: number,
  capTop: number,
  capHeight: number,
  textLength: number,
  width: number,
  height: number,
): PillarText {
  return {
    x: r6(left * width),
    baselineY: r6((capTop + capHeight) * height),
    capHeight: r6(capHeight * height),
    textLength: r6(textLength * width),
  }
}

/**
 * Badge mini-icons, drawn in a 48-box centered on the badge circle's center
 * (settled-frame ASCII maps; 1 unit = 1 canvas px at 1920×1080):
 *
 * - station 1: two square reel outlines (20×19) over a solid bar (44×28)
 *   — a cassette/film-cartridge read of the reference mark;
 * - station 2: a solid diamond 45×50 (the reference's filled rotated square);
 * - station 3: a pennant flag — 3px pole + stroked pennant, matching the
 *   station's banner glyph.
 */
const BADGE_ICONS = [
  `<rect x="-22" y="-24" width="20" height="19" fill="none" stroke="currentColor" stroke-width="3"/>` +
    `<rect x="2" y="-24" width="20" height="19" fill="none" stroke="currentColor" stroke-width="3"/>` +
    `<rect x="-22" y="-4" width="44" height="28" fill="currentColor"/>`,
  `<polygon points="0,-25 22.5,0 0,25 -22.5,0" fill="currentColor"/>`,
  `<line x1="-21" y1="-25" x2="-21" y2="24" stroke="currentColor" stroke-width="3"/>` +
    `<polygon points="-21,-25 23,-13 -21,-1" fill="none" stroke="currentColor" stroke-width="3"/>`,
] as const

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
    const glyphLeft = MEASURED.glyphLefts[i]! * width
    const glyphW = MEASURED.glyphWidths[i]! * width
    const plate = MEASURED.plates[i]!
    return {
      index: i,
      plate: {
        x: r6(plate.x * width),
        y: r6(plate.y * height),
        w: r6(plate.w * width),
        h: r6(plate.h * height),
      },
      glyph: {
        cx: r6(glyphLeft + glyphW / 2),
        cy: r6((MEASURED.glyphTop + MEASURED.glyphHeight / 2) * height),
        size: r6(glyphW),
      },
      badge: {
        cx: r6(MEASURED.badgeCx[i]! * width),
        cy: r6(MEASURED.badgeCy[i]! * height),
        r: r6(MEASURED.badgeR[i]! * height),
        icon: BADGE_ICONS[i]!,
      },
      label: textRun(
        MEASURED.labelLefts[i]!, MEASURED.labelCapTop, MEASURED.labelCapHeight,
        MEASURED.labelTextLengths[i]!, width, height,
      ),
      sublabel: textRun(
        MEASURED.sublabelLefts[i]!, MEASURED.sublabelCapTop, MEASURED.sublabelCapHeight,
        MEASURED.sublabelTextLength, width, height,
      ),
      caption: textRun(
        MEASURED.captionLefts[i]!, MEASURED.captionCapTops[i]!, MEASURED.captionCapHeights[i]!,
        MEASURED.captionTextLengths[i]!, width, height,
      ),
      captionMeta: textRun(
        MEASURED.metaLefts[i]!, MEASURED.metaCapTops[i]!, MEASURED.metaCapHeights[i]!,
        MEASURED.metaTextLengths[i]!, width, height,
      ),
    }
  })

  return { cards: cardsOut, viewBox: { width, height } }
}
