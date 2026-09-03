/**
 * Pure center-axis layout math for VerticalSpine and HeroTile (v7 family,
 * research art_0AzKGXnD §F6).
 *
 * The spine has NO drawn connector — the axis is the vertical rhythm itself:
 * a marker slot on the center axis, then label rows stacking downward at a
 * fixed pitch, and two side-card slots flanking the axis lower down. HeroTile
 * (v7 segment 2) is a separate composition — one rounded square dead on the
 * same axis — and ships its own trivial layout here.
 *
 * Every length derives from viewBox-relative fractions measured from the
 * recording (2038×1144 source frames), never absolute pixels, so the same
 * numbers serve the 1920×1080 deck and any future embed. All functions are
 * pure and deterministic: same inputs produce byte-identical output, and
 * nothing touches the DOM (SSR-safe build).
 */

/** Layout knobs. Every field is optional; omitted fields fall back to the measured defaults. */
export interface SpineOptions {
  /** ViewBox width in user units. Default 1920. */
  width?: number
  /** ViewBox height in user units. Default 1080. */
  height?: number
  /** Center-axis x as a fraction of width (measured 970/2038 ≈ 0.476). */
  centerXFrac?: number
  /** First (marker) element center y as a fraction of height (measured 421/1144 ≈ 0.368). */
  markerYFrac?: number
  /** Center-element vertical pitch as a fraction of height (measured marker→label ≈ 0.0966). */
  pitchYFrac?: number
  /** Left card center x as a fraction of width (measured 497.5/2038 ≈ 0.244). */
  cardLeftXFrac?: number
  /** Right card center x as a fraction of width (measured 1443/2038 ≈ 0.708). */
  cardRightXFrac?: number
  /** Card center y as a fraction of height (measured ≈ 0.694). */
  cardYFrac?: number
  /** Card width as a fraction of width (measured ≈ 0.0672). */
  cardWFrac?: number
  /** Card height as a fraction of height (measured ≈ 0.097). */
  cardHFrac?: number
  /** Caption baseline y under the cards as a fraction of height (measured ≈ 0.818). */
  captionYFrac?: number
  /** Marker rhombus full width as a fraction of width (measured 90/2038 ≈ 0.044). */
  markerWFrac?: number
  /** Marker rhombus full height as a fraction of height (measured 98/1144 ≈ 0.086). */
  markerHFrac?: number
}

export interface SpineElementLayout {
  /** Position along the spine, 0-based top → bottom. */
  index: number
  /** Center-axis x in viewBox units — the same value for every element. */
  cx: number
  /** Element center y in viewBox units, cumulative downward. */
  cy: number
}

export interface SpineCardSlot {
  /** Card block center + size in viewBox units. */
  cx: number
  cy: number
  w: number
  h: number
  /** Caption baseline y beneath the card, in viewBox units. */
  captionY: number
}

export interface SpineLayout {
  /** Center-axis element slots (marker first, label rows after), top → bottom. */
  elements: SpineElementLayout[]
  /** The two flanking side-card slots; positions are data-independent. */
  cards: { left: SpineCardSlot; right: SpineCardSlot }
  /** Marker rhombus full width / height in viewBox units (measured 90×98 at source). */
  markerW: number
  markerH: number
  viewBox: { width: number; height: number }
}

/** Measured defaults (research art_0AzKGXnD §F6), expressed as fractions. */
const MEASURED = {
  width: 1920,
  height: 1080,
  centerXFrac: 0.476,
  markerYFrac: 0.368,
  pitchYFrac: 0.0966,
  cardLeftXFrac: 0.244,
  cardRightXFrac: 0.708,
  cardYFrac: 0.694,
  cardWFrac: 0.0672,
  cardHFrac: 0.097,
  captionYFrac: 0.818,
  markerWFrac: 0.044,
  markerHFrac: 0.086,
} as const

export function spineLayout(count: number, opts?: SpineOptions): SpineLayout {
  if (!Number.isInteger(count) || count < 1) {
    throw new RangeError(`count must be a positive integer, received ${count}`)
  }

  const width = opts?.width ?? MEASURED.width
  const height = opts?.height ?? MEASURED.height
  const cx = (opts?.centerXFrac ?? MEASURED.centerXFrac) * width
  const markerY = (opts?.markerYFrac ?? MEASURED.markerYFrac) * height
  const pitchY = (opts?.pitchYFrac ?? MEASURED.pitchYFrac) * height

  const elements: SpineElementLayout[] = []
  for (let i = 0; i < count; i++) {
    elements.push({ index: i, cx, cy: markerY + i * pitchY })
  }

  const card = (cxFrac: number): SpineCardSlot => ({
    cx: cxFrac * width,
    cy: (opts?.cardYFrac ?? MEASURED.cardYFrac) * height,
    w: (opts?.cardWFrac ?? MEASURED.cardWFrac) * width,
    h: (opts?.cardHFrac ?? MEASURED.cardHFrac) * height,
    captionY: (opts?.captionYFrac ?? MEASURED.captionYFrac) * height,
  })

  return {
    elements,
    cards: {
      left: card(opts?.cardLeftXFrac ?? MEASURED.cardLeftXFrac),
      right: card(opts?.cardRightXFrac ?? MEASURED.cardRightXFrac),
    },
    markerW: (opts?.markerWFrac ?? MEASURED.markerWFrac) * width,
    markerH: (opts?.markerHFrac ?? MEASURED.markerHFrac) * height,
    viewBox: { width, height },
  }
}

/** HeroTile layout knobs; same fraction convention as SpineOptions. */
export interface HeroTileOptions {
  /** ViewBox width in user units. Default 1920. */
  width?: number
  /** ViewBox height in user units. Default 1080. */
  height?: number
  /** Tile center x as a fraction of width (measured 970/2038 ≈ 0.476 — the spine axis). */
  centerXFrac?: number
  /**
   * Tile center y as a fraction of height (measured 742/1144 ≈ 0.649). The
   * spec prose says "dead-center" but the measured bbox sits below the canvas
   * center — the measurement wins, matching the source recording.
   */
  centerYFrac?: number
  /** Tile side as a fraction of width (measured 244/2038 ≈ 0.12; square in viewBox units). */
  tileWFrac?: number
}

export interface HeroTileLayout {
  /** Tile center in viewBox units. */
  cx: number
  cy: number
  /** Tile side length in viewBox units (square). */
  size: number
  viewBox: { width: number; height: number }
}

const TILE_MEASURED = {
  centerXFrac: 0.476,
  centerYFrac: 0.649,
  tileWFrac: 0.12,
} as const

export function heroTileLayout(opts?: HeroTileOptions): HeroTileLayout {
  const width = opts?.width ?? 1920
  const height = opts?.height ?? 1080
  return {
    cx: (opts?.centerXFrac ?? TILE_MEASURED.centerXFrac) * width,
    cy: (opts?.centerYFrac ?? TILE_MEASURED.centerYFrac) * height,
    size: (opts?.tileWFrac ?? TILE_MEASURED.tileWFrac) * width,
    viewBox: { width, height },
  }
}

/**
 * Spine element data contract (pinned spec art_3VsrSvLm). Nodes are ordered
 * top → bottom; data order IS the click order — the component assigns one
 * native v-click per node.
 *
 * Rendering semantics by side/tone:
 * - `side: 'center'` with an empty `title` renders the solid diamond marker
 *   (the spine anchor; tone drives its color).
 * - `side: 'center'` with a `title` renders an orange label row on the axis.
 * - `side: 'left' | 'right'` renders a side card with the title inside and the
 *   caption beneath the block.
 */
export interface SpineNode {
  /** Stable key — used for a11y labels and test selectors. */
  id: string
  /** Mono uppercase text; empty string on the marker node. */
  title: string
  /** One-line caption beneath a side card. */
  caption?: string
  /** Key into the icon registry (`iconPath`); optional, side cards only. */
  icon?: string
  /** `'accent'` = cool card family; `'alt'` = spine accent (marker + label rows). */
  tone: 'accent' | 'alt'
  side: 'left' | 'right' | 'center'
}

export interface VerticalSpineData {
  nodes: SpineNode[]
}

/** HeroTile data contract — palette defaults to the `orangeSpine` preset. */
export interface HeroTileData {
  /** Key into the icon registry (`iconPath`); unknown keys render the fallback. */
  icon: string
  /** Optional mono line beneath the tile. */
  label?: string
}
