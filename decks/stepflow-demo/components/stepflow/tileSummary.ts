/**
 * Pure tile-summary layout for the TileSummary diagram family — seg16
 * (206s–208s) exact-trace edition (spec art_PIYfX5iM, brief art_ykOcZXIM §3).
 *
 * Every constant below was re-measured at native resolution on the seg16
 * frames (2560×1440 `settled.png` column/row scans + connected components,
 * cross-checked against the report.json event bboxes; the report runs at
 * half resolution, so its bboxes carry a ±0.002 AA quantization the full-res
 * scans refine). The crop maps to the stage by IDENTITY: the analysis frames
 * are full 16:9 frames, and the title band lands exactly on the deck's chrome
 * band (cap top y≈0.099, baseline y≈0.149) — no scale-to-fit step (R-2).
 *
 * Structure corrections the measurements forced (the brief's inventory is
 * directional; the measured frame wins):
 * - The three tiles sit at x 0.2277/0.4613/0.6953 (not 0.13/0.28/0.43) —
 *   147.8×157.5px cards (slightly taller than wide), not 0.11w×0.17h.
 * - The "tall cyan vertical element far right" is ONE HALF of a bracket:
 *   a thin vertical rises at x≈0.196 AND x≈0.838 from the rail down to a
 *   full-width cyan bar (y≈0.769–0.774). The left vertical arrives last
 *   (t≈1.667); `settled.png` (the analyzer's settled pick) is a mid-state
 *   frame that still lacks it — f0030 is the clip's true final state.
 * - The "white base strip + gray plate" under each tile resolves to a
 *   near-black card (plate interior luma ≈ 0–14 on the black canvas;
 *   sampled rgb(12,15,0) at f0008) behind the tile plus two centered label
 *   lines: bright line 1 (EXTRACT / TRANSFORM / LOAD, read from the frame)
 *   and a dim line 2 whose copy stays unresolved at this resolution — it
 *   ships as `sublabel` and is seeded by the integration slide (the
 *   StepPanel approximate-OCR precedent).
 * - The in-tile glyphs are dark punch-through marks (tile 1 funnel-like,
 *   tile 2 two bars + diagonal, tile 3 a stacked-segment box). Identification
 *   is low-confidence, so the component renders ICON_FALLBACK rather than
 *   guessing registry keys (the TileGrid/seg05 precedent); per-tile `icon`
 *   keys upgrade the rendering once confirmed.
 *
 * Choreography (R-5/R-6, 15fps frame dumps f0001–f0030, ±66.7ms):
 * the clip OPENS on title-only (f0001–f0003) — the deck's pre-click empty
 * state is exactly the video's start state, no synthesized empty state
 * needed. Per tile the plate leads (~130ms), the fill and bright label
 * follow together, the dim line lands last (+~66ms): beats at t≈0.2–0.333
 * (tile 1), 0.533–0.6 (tile 2 + rail segment 1), 1.133–1.2 (tile 3 + rail
 * segment 2). The bracket fades in at t≈1.467 (right vertical + bar), the
 * left vertical at t≈1.667, and the dim-white summary text at t≈1.733 —
 * the video ends (f0030, t≈1.93) with that text still mid-fade. Draft
 * schedule [0.33, 0.60, 1.20, 1.80]: the first three entries pin exactly;
 * the fourth corresponds to the text-completion beat — click 4 fires at
 * the bar onset (≈1.47) and the text rides it +0.266s, preserving "white
 * text last" inside the locked 4-click contract.
 *
 * All functions here are pure and deterministic: same inputs produce
 * byte-identical output, and nothing touches the DOM (SSR-safe build).
 */

/** One tile of the summary row (data contract). */
export interface TileSummaryTile {
  /** Stable key — used for a11y labels and test selectors. */
  id: string
  /** Bright label line 1, centered under the tile (seed reads EXTRACT / TRANSFORM / LOAD). */
  label: string
  /** Dim label line 2 (copy unresolved at capture resolution — integration pass seeds it). */
  sublabel?: string
  /**
   * icons.ts registry key for the tile's punch-through glyph. The seg16 marks
   * are unconfirmed (see module docblock), so the seed omits this and the
   * component renders ICON_FALLBACK until a frame-crop pass pins the keys.
   */
  icon?: string
  /**
   * Tile left edge as a fraction of canvas width. Measured per tile
   * (0.2277 / 0.4613 / 0.6953); the seed carries the measured values.
   */
  xFrac: number
  /**
   * Tile width as a fraction of canvas width. Measured per tile
   * (0.0770 / 0.0774 / 0.0770).
   */
  wFrac: number
}

/** Layout knobs. Every field is optional; omitted fields fall back to the measured defaults. */
export interface TileSummaryOptions {
  /** ViewBox width in user units. Default 1920. */
  width?: number
  /** ViewBox height in user units. Default 1080. */
  height?: number
}

/** A measured box in canvas fractions (the panels.ts MeasuredBox shape). */
export interface TileSummaryBox {
  xFrac: number
  yFrac: number
  wFrac: number
  hFrac: number
}

/** Absolute tile card: fill, backing plate, label bands, and glyph box. */
export interface TileSummaryRect {
  id: string
  label: string
  sublabel?: string
  icon?: string
  /** Tile fill rect (viewBox units). */
  x: number
  y: number
  w: number
  h: number
  /** Near-black backing card behind tile + labels (viewBox units). */
  plate: { x: number; y: number; w: number; h: number }
  /** Bright label line 1: baseline + pinned ink extent (viewBox units). */
  labelBox: { centerX: number; baseline: number; capHeight: number; inkW: number }
  /** Dim label line 2 — present only when the tile carries a sublabel. */
  sublabelBox?: { centerX: number; baseline: number; capHeight: number; inkW: number }
  /** Glyph ink band inside the tile (viewBox units) — approximate; see docblock. */
  iconBox: { x: number; y: number; w: number; h: number }
  /** Click that reveals this tile's wave (1-based, native v-click). */
  click: number
}

/** One rail segment: a band of the horizontal connector, revealed with a beat. */
export interface TileSummaryRailSegment {
  x: number
  y: number
  w: number
  h: number
  /** Click that reveals this segment (tile 2's wave, tile 3's wave, or the bracket). */
  click: number
}

/** Thin vertical leg of the bracket, rail → bar (viewBox units). */
export interface TileSummaryVertical {
  x: number
  y: number
  w: number
  h: number
  /** Delay in ms behind the bracket click (right leg 0, left leg 200 — measured onsets). */
  delayMs: number
}

export interface TileSummaryLayout {
  tiles: TileSummaryRect[]
  rail: TileSummaryRailSegment[]
  verticals: { left: TileSummaryVertical; right: TileSummaryVertical }
  bar: { x: number; y: number; w: number; h: number }
  /** Dim-white summary line under the bar (measured box; the copy is a prop). */
  summaryBox: { centerX: number; baseline: number; capHeight: number; inkW: number }
  /** Two-tone header: pinned ink boxes at the shared measured baseline. */
  header: {
    lead: { x: number; w: number }
    accent: { x: number; w: number }
    capTop: number
    baseline: number
    capHeight: number
  }
  viewBox: { width: number; height: number }
}

/**
 * The re-paced click plan: one wave per tile (plate → fill → labels), the
 * bracket (verticals + bar) on the closing beat, and the summary text riding
 * that beat 266ms behind it (measured onsets t≈1.467 bar, t≈1.733 text).
 * Total clicks = 4 for the measured three-tile seed — the README capture
 * contract count. The step schedule lands with the integration slide; this
 * plan is the v-click mapping it must honor.
 */
export interface TileSummaryPlan {
  tileClicks: number[]
  bracketClick: number
  /** Summary text delay behind the bracket click, seconds (measured 1.733 − 1.467). */
  summaryDelaySec: number
  totalClicks: number
}

/** Measured constants — canvas fractions (see module docblock for provenance). */
const MEASURED = {
  width: 1920,
  height: 1080,
  // Tiles share one row; each card keeps its own measured left edge and width
  // (tile 2 runs 0.8px wider at 1920 — sub-pixel, kept honest).
  tileYFrac: 0.4014,
  tileHFrac: 0.1458,
  // Corner radius read off the settled-frame corner arcs (±2px).
  tileRxPx: 16.4,
  // Near-black backing cards: centered per tile, 0.1172 wide × y 0.3542–0.6444
  // (plate 1 measured x 0.2070–0.3242 from the t=0.2–0.4 event bboxes; tiles
  // 2–3 mirror it centered on their tile centers, both validated in-frame).
  plateWFrac: 0.1172,
  plateYFrac: 0.3542,
  plateHFrac: 0.2902,
  // Glyph ink band inside a tile, as fractions of the tile's own box —
  // approximate centered band from the frame renders.
  iconBox: { xFrac: 0.15, yFrac: 0.2, wFrac: 0.7, hFrac: 0.55 },
  // Rail band y 0.4646–0.4813. Between-tile segments span tile edge to tile
  // edge (the component-measured ink 0.3102–0.4559 / 0.5437–0.6895 sits
  // inside the tiles' AA fringes); end stubs reach the verticals.
  railYFrac: 0.4646,
  railHFrac: 0.0167,
  railSegs: [
    { x0Frac: 0.1992, x1Frac: 0.2277, click: 4 }, // left stub → left vertical
    { x0Frac: 0.307, x1Frac: 0.4613, click: 2 }, // tile 1 → tile 2
    { x0Frac: 0.541, x1Frac: 0.6953, click: 3 }, // tile 2 → tile 3
    { x0Frac: 0.7723, x1Frac: 0.8352, click: 4 }, // tile 3 → right vertical
  ],
  // Bracket legs: y from the rail's bottom edge down to the bar's top edge.
  verticals: {
    left: { xFrac: 0.1945, wFrac: 0.0032, delayMs: 200 },
    right: { xFrac: 0.8369, wFrac: 0.003, delayMs: 0 },
    topYFrac: 0.4813,
    bottomYFrac: 0.7694,
  },
  // Full-width cyan bar between the verticals: x 0.2000–0.8336, y 0.7694–0.7736.
  bar: { xFrac: 0.2, wFrac: 0.6336, yFrac: 0.7694, hFrac: 0.0042 },
  // Label bands under the tiles (bright line 1, dim line 2), per-tile measured
  // ink widths at line 1 (mono advance ≈0.0117 of the canvas at cap 26.2px —
  // the reference face runs narrower than the deck mono; textLength pins absorb
  // the difference). Line-2 ink runs slightly wider (0.0902 measured on tile 1).
  labelLine1: { yFrac: 0.5806, hFrac: 0.0243, inkWs: [0.082, 0.091, 0.0508] },
  labelLine2: { yFrac: 0.6308, hFrac: 0.0132, inkWs: [0.0902, 0.0902, 0.0902] },
  // Summary line under the bar: dim white, canvas-centered (ink center 0.4988).
  summary: { xFrac: 0.3914, wFrac: 0.2148, capTopFrac: 0.7792, baselineFrac: 0.7944 },
  // Measured bar→text stagger, seconds (t≈1.733 − t≈1.467 on the f15 dumps).
  summaryDelaySec: 0.266,
  // Two-tone header: white lead + chrome-green tail on a shared baseline
  // (cap band y 0.0993–0.1486; the 0.091–0.163 frame band includes descenders).
  header: {
    lead: { xFrac: 0.3016, wFrac: 0.1461 },
    accent: { xFrac: 0.459, wFrac: 0.2414 },
    capTopFrac: 0.0993,
    capHFrac: 0.0493,
  },
  // Near-black plate fill sampled at f0008/f0030 plate interiors — rgb(12,15,0)
  // class (luma ≈ 13). It reads as a faint outline on the black canvas; the
  // locked V-3 decision keeps it near-black (divergences are opt-in).
  plateFill: '#0c0d0c',
} as const

/** Near-black backing-card fill (see MEASURED.plateFill provenance). */
export const TILE_SUMMARY_PLATE_FILL = MEASURED.plateFill

/** Tile corner radius in canvas units (settled-frame corner arcs, ±2px). */
export const TILE_SUMMARY_RX = MEASURED.tileRxPx

/** The measured seg16 seed: the ETL row, in reveal order. */
export const TILE_SUMMARY_SEED: TileSummaryTile[] = [
  { id: 'extract', label: 'EXTRACT', xFrac: 0.2277, wFrac: 0.077 },
  { id: 'transform', label: 'TRANSFORM', xFrac: 0.4613, wFrac: 0.0774 },
  { id: 'load', label: 'LOAD', xFrac: 0.6953, wFrac: 0.077 },
]

/** Tile 2's line-1 read is T-R-A-N-S + approximate tail (≈8 chars of ink). */
export const TILE_SUMMARY_LABEL_CONFIDENCE = {
  extract: 'confirmed',
  transform: 'prefix-confirmed',
  load: 'confirmed',
} as const

function requireFinite(value: number, name: string): number {
  if (!Number.isFinite(value)) {
    throw new RangeError(`${name} must be finite, received ${value}`)
  }
  return value
}

function requireFraction(value: number, name: string): number {
  requireFinite(value, name)
  if (value < 0 || value > 1) {
    throw new RangeError(`${name} must be a fraction in [0, 1], received ${value}`)
  }
  return value
}

/**
 * Absolute layout for the tile-summary composition on a 1920×1080 (default)
 * canvas. Pure: throws RangeError on an empty tile list or fractions outside
 * [0, 1]; every returned number is a measured-fraction product.
 */
export function tileSummaryLayout(
  tiles: TileSummaryTile[],
  opts?: TileSummaryOptions,
): TileSummaryLayout {
  if (!Array.isArray(tiles) || tiles.length === 0) {
    throw new RangeError(`tiles must be a non-empty array, received ${tiles?.length}`)
  }

  const width = opts?.width ?? MEASURED.width
  const height = opts?.height ?? MEASURED.height
  if (!(width > 0) || !(height > 0)) {
    throw new RangeError(`viewBox must be positive, received ${width}×${height}`)
  }

  const tileY = MEASURED.tileYFrac * height
  const tileH = MEASURED.tileHFrac * height
  const plateW = MEASURED.plateWFrac * width
  const plateY = MEASURED.plateYFrac * height
  const plateH = MEASURED.plateHFrac * height
  const railY = MEASURED.railYFrac * height
  const railH = MEASURED.railHFrac * height
  const iconSpec = MEASURED.iconBox

  const rects: TileSummaryRect[] = tiles.map((tile, i) => {
    requireFraction(tile.xFrac, `tiles[${i}].xFrac`)
    requireFraction(tile.wFrac, `tiles[${i}].wFrac`)
    if (!(tile.wFrac > 0)) {
      throw new RangeError(`tiles[${i}].wFrac must be positive, received ${tile.wFrac}`)
    }
    if (!tile.id) throw new RangeError(`tiles[${i}].id must be non-empty`)
    if (!tile.label) throw new RangeError(`tiles[${i}].label must be non-empty`)

    const x = tile.xFrac * width
    const w = tile.wFrac * width
    const centerX = x + w / 2
    const line1 = MEASURED.labelLine1
    const line1Cap = line1.hFrac * height
    const line2 = MEASURED.labelLine2
    const line2Cap = line2.hFrac * height
    const inkW1 = (line1.inkWs[Math.min(i, line1.inkWs.length - 1)] ?? line1.inkWs[0]!) * width
    const inkW2 = line2.inkWs[0]! * width

    return {
      id: tile.id,
      label: tile.label,
      sublabel: tile.sublabel,
      icon: tile.icon,
      x,
      y: tileY,
      w,
      h: tileH,
      plate: { x: centerX - plateW / 2, y: plateY, w: plateW, h: plateH },
      labelBox: {
        centerX,
        baseline: labelBaseline(line1.yFrac, line1Cap, height),
        capHeight: line1Cap,
        inkW: inkW1,
      },
      sublabelBox: tile.sublabel
        ? {
            centerX,
            baseline: labelBaseline(line2.yFrac, line2Cap, height),
            capHeight: line2Cap,
            inkW: inkW2,
          }
        : undefined,
      iconBox: {
        x: x + iconSpec.xFrac * w,
        y: tileY + iconSpec.yFrac * tileH,
        w: iconSpec.wFrac * w,
        h: iconSpec.hFrac * tileH,
      },
      click: i + 1,
    }
  })

  const rail: TileSummaryRailSegment[] = MEASURED.railSegs.map((seg) => ({
    x: seg.x0Frac * width,
    y: railY,
    w: (seg.x1Frac - seg.x0Frac) * width,
    h: railH,
    click: seg.click,
  }))

  const vTop = MEASURED.verticals.topYFrac * height
  const vBottom = MEASURED.verticals.bottomYFrac * height
  const leftV = MEASURED.verticals.left
  const rightV = MEASURED.verticals.right
  const verticals = {
    left: {
      x: leftV.xFrac * width,
      y: vTop,
      w: leftV.wFrac * width,
      h: vBottom - vTop,
      delayMs: leftV.delayMs,
    },
    right: {
      x: rightV.xFrac * width,
      y: vTop,
      w: rightV.wFrac * width,
      h: vBottom - vTop,
      delayMs: rightV.delayMs,
    },
  }

  const bar = {
    x: MEASURED.bar.xFrac * width,
    y: MEASURED.bar.yFrac * height,
    w: MEASURED.bar.wFrac * width,
    h: MEASURED.bar.hFrac * height,
  }

  const header = {
    lead: { x: MEASURED.header.lead.xFrac * width, w: MEASURED.header.lead.wFrac * width },
    accent: { x: MEASURED.header.accent.xFrac * width, w: MEASURED.header.accent.wFrac * width },
    capTop: MEASURED.header.capTopFrac * height,
    baseline: (MEASURED.header.capTopFrac + MEASURED.header.capHFrac) * height,
    capHeight: MEASURED.header.capHFrac * height,
  }

  return {
    tiles: rects,
    rail,
    verticals,
    bar,
    summaryBox: {
      centerX: (MEASURED.summary.xFrac + MEASURED.summary.wFrac / 2) * width,
      baseline: MEASURED.summary.baselineFrac * height,
      capHeight: (MEASURED.summary.baselineFrac - MEASURED.summary.capTopFrac) * height,
      inkW: MEASURED.summary.wFrac * width,
    },
    header,
    viewBox: { width, height },
  }
}

/** Label baseline from the measured cap band (band bottom = baseline for caps). */
function labelBaseline(yFrac: number, capHeight: number, height: number): number {
  return yFrac * height + capHeight
}

/**
 * The four-click plan for the measured seed (see TileSummaryPlan). The
 * summary text participates only when copy exists; the bracket beat is
 * unconditional, so totalClicks stays 4 either way.
 */
export function revealPlan(
  tiles: TileSummaryTile[],
  hasSummary = true,
): TileSummaryPlan {
  if (!Array.isArray(tiles) || tiles.length === 0) {
    throw new RangeError(`tiles must be a non-empty array, received ${tiles?.length}`)
  }
  return {
    tileClicks: tiles.map((_, i) => i + 1),
    bracketClick: tiles.length + 1,
    summaryDelaySec: hasSummary ? MEASURED.summaryDelaySec : 0,
    totalClicks: tiles.length + 1,
  }
}
