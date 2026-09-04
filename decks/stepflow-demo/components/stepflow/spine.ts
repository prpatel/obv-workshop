/**
 * Pure center-axis layout math for VerticalSpine and HeroTile (v7 family,
 * exact-trace sheet art_mkVNxsft §3/§4).
 *
 * The spine has NO drawn connector line — the axis is the vertical rhythm
 * itself: an icon slot on the center axis, then label rows stacking downward
 * at a fixed pitch, two side-card slots flanking the axis lower down, and a
 * short stub + horizontal axis rule crossing the axis under the label block.
 * HeroTile (v7 segment 2) is a separate composition — one rounded square dead
 * on the same axis with its cutout glyph and tight red halo.
 *
 * Every length derives from viewBox-relative fractions measured from the
 * settled recording frames (2038×1144 source, traced for art_mkVNxsft), never
 * absolute pixels, so the same numbers serve the 1920×1080 deck and any
 * future embed. All functions are pure and deterministic: same inputs produce
 * byte-identical output, and nothing touches the DOM (SSR-safe build).
 */

/** Layout knobs. Every field is optional; omitted fields fall back to the measured defaults. */
export interface SpineOptions {
  /** ViewBox width in user units. Default 1920. */
  width?: number
  /** ViewBox height in user units. Default 1080. */
  height?: number
  /** Center-axis x as a fraction of width (measured 913/1920). */
  centerXFrac?: number
  /** Axis-icon center y as a fraction of height (measured 396.95/1080). */
  markerYFrac?: number
  /** Center-element vertical pitch as a fraction of height (icon→label ≈ 104.35/1080). */
  pitchYFrac?: number
  /** Left card center x as a fraction of width (measured 468/1920). */
  cardLeftXFrac?: number
  /** Right card center x as a fraction of width (measured 1358.95/1920). */
  cardRightXFrac?: number
  /** Card center y as a fraction of height (measured 749.55/1080 — both cards). */
  cardYFrac?: number
  /** Left card width as a fraction of width (measured 130/1920). */
  cardWFrac?: number
  /** Left card height as a fraction of height (measured 103.9/1080). */
  cardHFrac?: number
  /** Right card width as a fraction of width (measured 135.5/1920) — the cards are NOT equal. */
  cardRightWFrac?: number
  /** Right card height as a fraction of height (measured 55.5/1080). */
  cardRightHFrac?: number
  /** Caption center y under the cards as a fraction of height (measured 883.1/1080). */
  captionYFrac?: number
  /** Axis glyph full width as a fraction of width (measured 85.7/1920). */
  iconWFrac?: number
  /** Axis glyph full height as a fraction of height (measured 93.5/1080). */
  iconHFrac?: number
  /** Axis stub width as a fraction of width (measured 6.3/1920). */
  stubWFrac?: number
  /** Axis stub height as a fraction of height (measured 32.1/1080). */
  stubHFrac?: number
  /** Axis stub top y as a fraction of height (measured 567.4/1080). */
  stubYFrac?: number
  /** Axis rule left x as a fraction of width (measured 464.3/1920). */
  ruleX1Frac?: number
  /** Axis rule right x as a fraction of width (measured 1361.7/1920). */
  ruleX2Frac?: number
  /** Axis rule top y as a fraction of height (measured 602.3/1080). */
  ruleYFrac?: number
  /** Axis rule thickness as a fraction of height (measured 4.7/1080). */
  ruleHFrac?: number
  /** Footer text baseline as a fraction of height (measured 959.4/1080). */
  footerYFrac?: number
  /** Bottom rule center y as a fraction of height (measured 1047.85/1080). */
  footerRuleYFrac?: number
  /** Bottom rule width as a fraction of width (measured 1441.8/1920). */
  footerRuleWFrac?: number
  /** Bottom rule thickness as a fraction of height (measured 5.7/1080). */
  footerRuleHFrac?: number
}

export interface SpineElementLayout {
  /** Position along the spine, 0-based top → bottom. */
  index: number
  /** Center-axis x in viewBox units — the same value for every element. */
  cx: number
  /** Element center y in viewBox units, cumulative downward. */
  cy: number
}

/** Axis chrome under the label block: stub + horizontal rule crossing the axis. */
export interface SpineAxisLayout {
  /** Stub center x (the axis) in viewBox units. */
  stubCx: number
  /** Stub top y in viewBox units. */
  stubY: number
  /** Stub width / height in viewBox units. */
  stubW: number
  stubH: number
  /** Rule span in viewBox units (left/right x, top y, thickness). */
  ruleX1: number
  ruleX2: number
  ruleY: number
  ruleH: number
}

export interface SpineFooterLayout {
  /** Bottom rule center on the spine axis, in viewBox units. */
  ruleCx: number
  /** Bottom rule center y in viewBox units. */
  ruleCy: number
  /** Bottom rule width in viewBox units. */
  ruleW: number
  /** Bottom rule thickness in viewBox units. */
  ruleH: number
  /** Gray footer-line baseline; line x positions are the card centers. */
  lineY: number
}

export interface SpineCardSlot {
  /** Card block center + size in viewBox units. */
  cx: number
  cy: number
  w: number
  h: number
  /** Caption center y beneath the card, in viewBox units. */
  captionY: number
}

export interface SpineLayout {
  /** Center-axis element slots (icon first, label rows after), top → bottom. */
  elements: SpineElementLayout[]
  /** The two flanking side-card slots; positions are data-independent. */
  cards: { left: SpineCardSlot; right: SpineCardSlot }
  /** Axis glyph full width / height in viewBox units (measured 85.7×93.5 at 1080 scale). */
  iconW: number
  iconH: number
  /** Axis chrome: stub + horizontal rule crossing the axis under the labels. */
  axis: SpineAxisLayout
  /** Footer chrome: gray lines + the dim bottom rule, revealed last. */
  footer: SpineFooterLayout
  viewBox: { width: number; height: number }
}

/** Measured defaults (art_mkVNxsft §3 traces), expressed as fractions. */
const MEASURED = {
  width: 1920,
  height: 1080,
  centerXFrac: 0.475520833333,
  markerYFrac: 0.367546296296,
  pitchYFrac: 0.09662037037,
  cardLeftXFrac: 0.24375,
  cardRightXFrac: 0.707786458333,
  cardYFrac: 0.694027777778,
  cardWFrac: 0.067708333333,
  cardHFrac: 0.096203703704,
  cardRightWFrac: 0.070572916667,
  cardRightHFrac: 0.051388888889,
  captionYFrac: 0.817685185185,
  iconWFrac: 0.044635416667,
  iconHFrac: 0.086574074074,
  stubWFrac: 0.00328125,
  stubHFrac: 0.029722222222,
  stubYFrac: 0.52537037037,
  ruleX1Frac: 0.241822916667,
  ruleX2Frac: 0.70921875,
  ruleYFrac: 0.557685185185,
  ruleHFrac: 0.004351851852,
  footerYFrac: 0.888333333333,
  footerRuleYFrac: 0.970046296296,
  footerRuleWFrac: 0.7509375,
  footerRuleHFrac: 0.005277777778,
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

  const card = (cxFrac: number, wFrac: number, hFrac: number): SpineCardSlot => ({
    cx: cxFrac * width,
    cy: (opts?.cardYFrac ?? MEASURED.cardYFrac) * height,
    w: wFrac * width,
    h: hFrac * height,
    captionY: (opts?.captionYFrac ?? MEASURED.captionYFrac) * height,
  })

  return {
    elements,
    cards: {
      left: card(
        opts?.cardLeftXFrac ?? MEASURED.cardLeftXFrac,
        opts?.cardWFrac ?? MEASURED.cardWFrac,
        opts?.cardHFrac ?? MEASURED.cardHFrac,
      ),
      right: card(
        opts?.cardRightXFrac ?? MEASURED.cardRightXFrac,
        opts?.cardRightWFrac ?? MEASURED.cardRightWFrac,
        opts?.cardRightHFrac ?? MEASURED.cardRightHFrac,
      ),
    },
    iconW: (opts?.iconWFrac ?? MEASURED.iconWFrac) * width,
    iconH: (opts?.iconHFrac ?? MEASURED.iconHFrac) * height,
    axis: {
      stubCx: cx,
      stubY: (opts?.stubYFrac ?? MEASURED.stubYFrac) * height,
      stubW: (opts?.stubWFrac ?? MEASURED.stubWFrac) * width,
      stubH: (opts?.stubHFrac ?? MEASURED.stubHFrac) * height,
      ruleX1: (opts?.ruleX1Frac ?? MEASURED.ruleX1Frac) * width,
      ruleX2: (opts?.ruleX2Frac ?? MEASURED.ruleX2Frac) * width,
      ruleY: (opts?.ruleYFrac ?? MEASURED.ruleYFrac) * height,
      ruleH: (opts?.ruleHFrac ?? MEASURED.ruleHFrac) * height,
    },
    footer: {
      ruleCx: cx,
      ruleCy: (opts?.footerRuleYFrac ?? MEASURED.footerRuleYFrac) * height,
      ruleW: (opts?.footerRuleWFrac ?? MEASURED.footerRuleWFrac) * width,
      ruleH: (opts?.footerRuleHFrac ?? MEASURED.footerRuleHFrac) * height,
      lineY: (opts?.footerYFrac ?? MEASURED.footerYFrac) * height,
    },
    viewBox: { width, height },
  }
}

/** HeroTile layout knobs; same fraction convention as SpineOptions. */
export interface HeroTileOptions {
  /** ViewBox width in user units. Default 1920. */
  width?: number
  /** ViewBox height in user units. Default 1080. */
  height?: number
  /** Tile center x as a fraction of width (measured 914/1920 — the spine axis). */
  centerXFrac?: number
  /**
   * Tile center y as a fraction of height (measured 700.5/1080). The
   * spec prose says "dead-center" but the measured bbox sits below the canvas
   * center — the measurement wins, matching the source recording.
   */
  centerYFrac?: number
  /** Tile side as a fraction of width (measured 227/1920; square in viewBox units). */
  tileWFrac?: number
  /**
   * Halo circle radius as a fraction of width. The v7 glow is a tight ring:
   * halo luma peaks ≈0.30 opacity right at the tile edge and dies to 0 by
   * r ≈ 161.5/1920 (linear falloff traced off the settled frame).
   */
  glowRFrac?: number
  /** Cutout glyph width as a fraction of width (measured ≈95/1920). */
  iconWFrac?: number
  /** Cutout glyph height as a fraction of height (measured ≈107.5/1080). */
  iconHFrac?: number
}

export interface HeroTileLayout {
  /** Tile center in viewBox units. */
  cx: number
  cy: number
  /** Tile side length in viewBox units (square). */
  size: number
  /** Ambient halo circle radius in viewBox units (centered on the tile). */
  glowR: number
  /** Cutout glyph box in viewBox units (centered on the tile). */
  iconW: number
  iconH: number
  viewBox: { width: number; height: number }
}

const TILE_MEASURED = {
  centerXFrac: 0.476041666667,
  centerYFrac: 0.648611111111,
  tileWFrac: 0.118229166667,
  glowRFrac: 0.084114583333,
  iconWFrac: 0.049479166667,
  iconHFrac: 0.099537037037,
} as const

export function heroTileLayout(opts?: HeroTileOptions): HeroTileLayout {
  const width = opts?.width ?? 1920
  const height = opts?.height ?? 1080
  return {
    cx: (opts?.centerXFrac ?? TILE_MEASURED.centerXFrac) * width,
    cy: (opts?.centerYFrac ?? TILE_MEASURED.centerYFrac) * height,
    size: (opts?.tileWFrac ?? TILE_MEASURED.tileWFrac) * width,
    glowR: (opts?.glowRFrac ?? TILE_MEASURED.glowRFrac) * width,
    iconW: (opts?.iconWFrac ?? TILE_MEASURED.iconWFrac) * width,
    iconH: (opts?.iconHFrac ?? TILE_MEASURED.iconHFrac) * height,
    viewBox: { width, height },
  }
}

/**
 * Spine element data contract (pinned spec art_3VsrSvLm). Nodes are ordered
 * top → bottom; data order IS the click order — the component assigns one
 * native v-click per node, unless `withPrevious` folds a node into the
 * previous node's click (the v7 recording reveals icon + label together).
 *
 * Rendering semantics by side/tone:
 * - `side: 'center'` with an empty `title` renders the traced axis glyph
 *   (the spine anchor; tone drives its color).
 * - `side: 'center'` with a `title` renders an accent label row on the axis.
 * - `side: 'left' | 'right'` renders a side card (measured glyph strokes; the
 *   v7 cards carry no title text) with the optional caption beneath.
 */
export interface SpineNode {
  /** Stable key — used for a11y labels and test selectors. */
  id: string
  /** Mono uppercase text; empty/omitted on the marker node and v7 cards. */
  title?: string
  /** One-line caption beneath a side card. */
  caption?: string
  /**
   * Measured ink-run width the caption is condensed to (canvas px) — the
   * recording's condensed face runs narrower than the deck mono at equal cap.
   */
  captionWidth?: number
  /** Caption font scale override (1 = base cap 38.7px at 1080). */
  captionScale?: number
  /** Key into the icon registry (`iconPath`); optional, side cards only. */
  icon?: string
  /** `'accent'` = cool card family; `'alt'` = spine accent (glyph + label rows). */
  tone: 'accent' | 'alt'
  side: 'left' | 'right' | 'center'
  /** Reveal together with the previous node's click (choreography primitive). */
  withPrevious?: boolean
}

export interface VerticalSpineData {
  nodes: SpineNode[]
}

/**
 * HeroTile data contract — palette defaults to the `orangeSpine` preset. The
 * tile cutout renders the traced V7 marker glyph (`V7_MARKER_GLYPH`); a
 * registry `icon` overrides it.
 */
export interface HeroTileData {
  /** Key into the icon registry (`iconPath`); omitted renders the traced glyph. */
  icon?: string
  /** Optional mono line beneath the tile. */
  label?: string
}
