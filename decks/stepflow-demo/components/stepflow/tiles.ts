/**
 * TileGrid data contract + pure layout math (diagram-family spec, wave-2 —
 * research art_2kSBGNmJ §3.5).
 *
 * A uniform-pitch tile grid: tile i lands at column `i % cols`, row
 * `floor(i / cols)` (row-major — the recording builds row 1 left→right, then
 * row 2). Positions are DERIVED from the index and the pitch constants, unlike
 * NodeEdge where positions are data. The matrix (src 57–60s) and flat-row
 * (src 107–110s) variants fold in as seed-data arrangements of the same
 * contract — per-tile `wFrac`/`hFrac` overrides and tone coding, no extra
 * components.
 *
 * Pure and SSR-safe: no DOM access, no mutation of the inputs.
 */

/** One tile. Tone selects the palette role; size can override the grid default. */
export interface Tile {
  /** Stable key — test selectors and authoring reference. */
  id: string
  /** Key into the icon registry (`iconPath`); unknown keys render the fallback. */
  icon?: string
  /** Short uppercase label rendered under the icon. */
  label?: string
  /** Cyan mini-label row above the below-tile label (e.g. a step index). */
  mini?: string
  /**
   * Palette role of the tile fill: `accent` (cyan grid tiles), `alt`
   * (accentAlt when the palette provides it — the matrix's amber/orange cells),
   * `tertiary` (teal), `status` (measured status red), `plain` (chrome-white
   * icon tile). Defaults to `accent`.
   */
  tone?: 'accent' | 'alt' | 'tertiary' | 'status' | 'plain'
  /** Per-tile width override, canvas fraction (the matrix's larger cells). */
  wFrac?: number
  /** Per-tile height override, canvas fraction. */
  hFrac?: number
}

/** The full TileGrid diagram: tiles + the uniform grid pitch. */
export interface TileGridData {
  tiles: Tile[]
  /** Columns per row; tile i wraps to the next row every `cols` tiles. */
  cols: number
  /** Default tile width/height, canvas fractions. */
  tileWFrac: number
  tileHFrac: number
  /** Column/row pitch (origin-to-origin), canvas fractions. */
  pitchXFrac: number
  pitchYFrac: number
  /** Top-left corner of the first tile, canvas fractions. */
  x0Frac: number
  y0Frac: number
}

export interface Canvas {
  width: number
  height: number
}

/**
 * Measured status red — the `statusAmber.accentAlt` token value. The shared
 * palette has no fourth accent slot and this wave adds no palette fields, so
 * the matrix's red cells resolve to this constant (chrome-class, like
 * NodeEdge's PLAIN_STROKE — never a palette field).
 */
export const TILE_STATUS = '#e5413f'

/**
 * Measured chrome white (the v3 plain-node stroke) — the matrix's white icon tile.
 */
export const TILE_PLAIN = '#f5f4f7'

/**
 * Measured hex-tile tones (wave-2 fidelity rework — report art_iHm120ov
 * §TileGrid, t=33.0s reads at the 1920×1080 reference scale). Chrome-class
 * constants like TILE_STATUS: the shared palette has no slots for them and
 * this wave adds no palette fields (changing `cyanOnBlack` would move the
 * untouched StepFlow slide).
 *
 * - TILE_CORE — the hex tile's saturated inner fill (the #23d7ed accent read
 *   darker at the settled state).
 * - TILE_TRACK — the connector track through tile centers (darker than the
 *   palette's generic #40424e track token on this family).
 * - TILE_SHEEN — the bright light-cyan dash where the track enters the first
 *   tile's lit left vertex.
 * - TILE_MINI — the cyan mini-label row under each tile (the white row under
 *   it uses the palette `subtext` token, measured #a8a8b0 ≈ #a6a8ae).
 */
export const TILE_CORE = '#1ed0e8'
export const TILE_TRACK = '#353642'
export const TILE_SHEEN = '#a0ecfb'
export const TILE_MINI = '#20d0e8'

/** Resolved px geometry for one tile, ready to render. */
export interface TileLayout {
  id: string
  /** Column/row index in the row-major build (drives the click order). */
  col: number
  row: number
  /** Left edge, px in the viewBox. */
  x: number
  /** Top edge, px in the viewBox. */
  y: number
  w: number
  h: number
  tone: NonNullable<Tile['tone']>
  icon?: string
  label?: string
  mini?: string
}

export interface TileGridLayout {
  tiles: TileLayout[]
  viewBox: Canvas
}

/** One per-row connector track line, resolved to viewBox px. */
export interface TileTrackLine {
  x1: number
  x2: number
  y: number
}

// Measured track overhangs (t=33.0s): the row's track starts ~56px left of the
// first tile box and runs ~84px past the last one — 0.47 / 0.70 of that row's
// 119px tile box, so the overhangs scale with the tiles.
const TRACK_OVERHANG_LEFT = 0.47
const TRACK_OVERHANG_RIGHT = 0.7

/**
 * Connector track lines — one per occupied row, through the row's tile
 * centers, drawn behind the tiles (the source renders the track under both
 * rows of the 3×2 grid). Pure; SSR-safe.
 */
export function tileTrackLines(tiles: TileLayout[]): TileTrackLine[] {
  if (tiles.length === 0) return []
  const rows = new Map<number, TileLayout[]>()
  for (const tile of tiles) {
    const row = rows.get(tile.row) ?? []
    row.push(tile)
    rows.set(tile.row, row)
  }
  return [...rows.keys()].sort((a, b) => a - b).map((row) => {
    const rowTiles = rows.get(row)! // every key was just set above
    const first = rowTiles.reduce((a, b) => (a.x <= b.x ? a : b))
    const last = rowTiles.reduce((a, b) => (a.x + a.w >= b.x + b.w ? a : b))
    const y = rowTiles.reduce((sum, t) => sum + t.y + t.h / 2, 0) / rowTiles.length
    return {
      x1: first.x - TRACK_OVERHANG_LEFT * first.w,
      x2: last.x + last.w * (1 + TRACK_OVERHANG_RIGHT),
      y,
    }
  })
}

function r2(n: number): number {
  return Math.round(n * 100) / 100
}

/**
 * Pointed left-right hexagon path centered at (cx, cy) — the source tiles'
 * shape (t=33.0s: a ~98×97px core inside the demo's 119×104 box: flat
 * top/bottom edges spanning the middle half of the width, left/right points
 * at mid-height). Pure; SSR-safe.
 *
 * @throws RangeError on non-positive width/height — never render blank.
 */
export function hexPath(cx: number, cy: number, w: number, h: number): string {
  if (!(w > 0) || !(h > 0)) {
    throw new RangeError(`hexPath needs positive width/height, got ${w} × ${h}`)
  }
  const hw = w / 2
  const hh = h / 2
  const q = w / 4
  return [
    `M ${r2(cx - hw)} ${r2(cy)}`, // left point
    `L ${r2(cx - q)} ${r2(cy - hh)}`, // top edge
    `L ${r2(cx + q)} ${r2(cy - hh)}`,
    `L ${r2(cx + hw)} ${r2(cy)}`, // right point
    `L ${r2(cx + q)} ${r2(cy + hh)}`, // bottom edge
    `L ${r2(cx - q)} ${r2(cy + hh)}`,
    'Z',
  ].join(' ')
}

function requireFraction(name: string, value: number): void {
  if (!(value >= 0 && value <= 1)) {
    throw new RangeError(`${name} (${value}) is outside the [0, 1] canvas-fraction range`)
  }
}

/**
 * Resolve the full render layout for a TileGrid.
 *
 * - Row-major index→rect: tile i → column `i % cols`, row `floor(i / cols)`;
 *   rect = origin + col·pitch / row·pitch, sized by the tile's override or the
 *   grid default.
 * - Every fraction (grid + per-tile overrides) must land in [0, 1] and every
 *   resolved rect must stay inside the canvas — violations throw RangeError,
 *   never render blank.
 * - Click choreography (native v-clicks): tile i is click i + 1 — the
 *   recording's row-major build order.
 */
export function tileGridLayout(data: TileGridData, viewBox: Canvas = { width: 1920, height: 1080 }): TileGridLayout {
  if (data.tiles.length === 0) {
    throw new RangeError('TileGrid needs at least one tile')
  }
  if (!Number.isInteger(data.cols) || data.cols < 1) {
    throw new RangeError(`cols must be a positive integer, got ${data.cols}`)
  }
  requireFraction('tileWFrac', data.tileWFrac)
  requireFraction('tileHFrac', data.tileHFrac)
  requireFraction('pitchXFrac', data.pitchXFrac)
  requireFraction('pitchYFrac', data.pitchYFrac)
  requireFraction('x0Frac', data.x0Frac)
  requireFraction('y0Frac', data.y0Frac)

  const tiles: TileLayout[] = data.tiles.map((tile, i) => {
    const col = i % data.cols
    const row = Math.floor(i / data.cols)
    const wFrac = tile.wFrac ?? data.tileWFrac
    const hFrac = tile.hFrac ?? data.tileHFrac
    requireFraction(`tile "${tile.id}" wFrac`, wFrac)
    requireFraction(`tile "${tile.id}" hFrac`, hFrac)
    const x = (data.x0Frac + col * data.pitchXFrac) * viewBox.width
    const y = (data.y0Frac + row * data.pitchYFrac) * viewBox.height
    const w = wFrac * viewBox.width
    const h = hFrac * viewBox.height
    if (x + w > viewBox.width || y + h > viewBox.height) {
      throw new RangeError(`tile "${tile.id}" rect (${x}, ${y}, ${w}, ${h}) runs outside the ${viewBox.width}×${viewBox.height} canvas`)
    }
    return { id: tile.id, col, row, x, y, w, h, tone: tile.tone ?? 'accent', icon: tile.icon, label: tile.label, mini: tile.mini }
  })

  return { tiles, viewBox }
}

// ---------------------------------------------------------------------------
// Measured motion (exact-trace sheet art_7bTnqSB3 §2.3 — 60 fps frames-seq,
// t(ms) = frame/60·1000, slide entrance at frame 15 = 250ms):
//
//   tile 1  550–633   tile 2  950–1033   tile 3  2333–2417
//   tile 4  3767–3850  tile 5  4817–4900  tile 6  6617–6750
//   connector track 8117–9117 — row 1 (track 1–2) at 8117, row 2 at 9100
//
// The inter-tile gaps GROW (400/1383/1434/1050/1800ms — not uniform), and the
// #353642 connector track stays dark until every tile is on stage.
// ---------------------------------------------------------------------------

/** Tile 1 begins its ~100ms soft fade ~550ms after the slide entrance (frames 33–38). */
export const TILE_STAGGER_FIRST_MS = 550

/**
 * Measured inter-tile reveal gaps (ms) for the six-tile demo grid — growing,
 * not uniform (frames 57/140/226/289/397 minus their predecessors).
 */
export const TILE_STAGGER_GAPS_MS = [400, 1383, 1434, 1050, 1800] as const

/** Each tile's soft fade measures ~83–150ms (frames 33–38; tile 6 trails glow); the sheet rounds to ~100ms. */
export const TILE_FADE_MS = 100

/**
 * Connector-track beats, measured from the moment the last tile's click lands
 * (source: tile 6 starts 6617ms, row-1 track 8117ms, row-2 track 9100ms).
 * Row 1 fades in ~1.5s after tile 6; row 2 trails row 1 by ~983ms. Each fade
 * is ~100ms (frames 487–491 and 546–547).
 */
export const TRACK_ROW1_DELAY_MS = 1500
export const TRACK_ROW2_DELAY_MS = 2483
export const TRACK_FADE_MS = 100

/**
 * Cumulative click-fire times (ms from run start) that reproduce the measured
 * stagger through AutoAdvance's optional step schedule: click k fires at
 * `firstMs + Σ gaps[0..k-1]` — the deck's uniform spacing cannot express the
 * growing gaps. Grids larger than the measured six tiles repeat the final
 * (longest) gap; smaller grids truncate. Pure; SSR-safe.
 */
export function tileStaggerSchedule(tiles: number, firstMs: number = TILE_STAGGER_FIRST_MS, gaps: readonly number[] = TILE_STAGGER_GAPS_MS): number[] {
  if (tiles < 1) {
    throw new RangeError(`tileStaggerSchedule needs at least one tile, got ${tiles}`)
  }
  const times: number[] = []
  let t = 0
  for (let i = 0; i < tiles; i++) {
    t += i === 0 ? firstMs : (gaps[Math.min(i - 1, gaps.length - 1)] ?? 0)
    times.push(t)
  }
  return times
}