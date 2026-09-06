/**
 * Pure tile-summary layout for the TileSummary diagram family — seg16
 * (206s–208s) exact-trace edition (spec art_PIYfX5iM, brief art_ykOcZXIM §3).
 *
 * Every constant below was re-measured at native resolution on the seg16
 * frames (2560×1440 `settled_full.png` column/row scans + connected
 * components, cross-checked against the report.json event bboxes and the
 * packet's colors.json; the report runs at half resolution, so its bboxes
 * carry a ±0.002 AA quantization the full-res scans refine). The crop maps
 * to the stage by IDENTITY: the analysis frames are full 16:9 frames, and
 * the title band lands exactly on the deck's chrome band (cap top y≈0.099,
 * baseline y≈0.149) — no scale-to-fit step (R-2).
 *
 * Structure corrections the measurements forced (the brief's inventory is
 * directional; the measured frame wins):
 * - The three tiles sit at x 0.2250/0.4586/0.6924 (not 0.13/0.28/0.43) —
 *   157–158×157.5px cards (slightly wider than tall), not 0.11w×0.17h.
 *   (An earlier 0.2277/0.0770 read came off a threshold that clipped both
 *   AA edges; row-470/560 scans at luma>60 bound the fills tightly.)
 * - The "tall cyan vertical element far right" is ONE HALF of a bracket:
 *   a thin vertical rises at x≈0.837 from the rail down to a cyan bar
 *   (y≈0.769–0.775). The acceptance diff target `settled_full.png` is
 *   authoritative for the settled state and shows: bar x 0.315–0.840,
 *   NO left vertical, and a summary line faded to an ~8% ghost. The late
 *   f0030 frame (720p) shows a wider bar and a left vertical, but the
 *   settled gate wins — the resting render reproduces settled_full.png.
 * - Small amber badges (~22px caps, #e6b62e) sit above each plate
 *   (y 0.3565–0.378), two glyphs each (read A4/A5/A2 from the ASCII
 *   masks); they fade in with their tile's wave (f0005–f0008). They ship
 *   as traced row-run paths (TILE_SUMMARY_BADGES), not font text.
 * - The label lines read EXTRACT / MOVE / LOAD (tile 2's ink is 4 glyphs
 *   wide — 0.0457 of the canvas, matching LOAD — not the earlier TRANSFORM
 *   read), and the dim line-2 copy is RESOLVED by template classification:
 *   OUT OF THE SOURCE / ACROSS THE NETWORK / STRAIGHT INTO THE WAREHOUSE
 *   (per-tile ink 0.1172 / 0.1246 / 0.1730).
 * - The in-tile glyphs are dark punch-through marks resolved by 4×
 *   downsampled frame traces: a flared vessel (extract), two rules with a
 *   threading diagonal (move), and a banded rounded box (load). They ship
 *   as traced stroke paths (TILE_SUMMARY_GLYPHS) instead of ICON_FALLBACK;
 *   a per-tile `icon` registry key still wins when supplied.
 * - The rail's left terminus is a bold open chevron (outer extent x 0.213–
 *   0.231, y 0.435–0.504, stroke ≈0.0069) — not a filled stub. The rail is
 *   CONTINUOUS in the settled state (row-scan x 416–1607): the between-tile
 *   segments reveal with tiles 2/3 and the gaps + stub fill on the bracket
 *   beat.
 *
 * Choreography (R-5/R-6, 15fps frame dumps f0001–f0030, ±66.7ms):
 * the clip OPENS on title-only (f0001–f0003) — the deck's pre-click empty
 * state is exactly the video's start state, no synthesized empty state
 * needed. Per tile the plate leads (t≈0.2), the fill and bright label
 * follow together (t≈0.267), the dim line lands last (t≈0.333), and the
 * amber badge fades in with the wave (f0005–f0008): beats at tile 1
 * t≈0.2–0.333, tile 2 + rail segment 1 t≈0.533–0.6, tile 3 + rail segment
 * 2 t≈1.133–1.2 (onsets.json). The bracket fades in at t≈1.467 (right
 * vertical + bar + rail gap-fill), and the summary text at t≈1.733
 * (+266ms — the bar→text stagger verified against the event list),
 * settling to the measured ~8% ghost opacity. Click 4 fires at the bar
 * onset (≈1.47) and the text rides it +0.266s, preserving "white text
 * last" inside the locked 4-click contract.
 *
 * All functions here are pure and deterministic: same inputs produce
 * byte-identical output, and nothing touches the DOM (SSR-safe build).
 */

/** One tile of the summary row (data contract). */
export interface TileSummaryTile {
  /** Stable key — used for a11y labels, glyph lookup, and test selectors. */
  id: string
  /** Bright label line 1, centered under the tile (seed reads EXTRACT / MOVE / LOAD). */
  label: string
  /** Dim label line 2 — template-classified from the frame; the slide may override. */
  sublabel?: string
  /**
   * icons.ts registry key for the tile's punch-through glyph. The seg16
   * marks ship as traced paths (TILE_SUMMARY_GLYPHS); a registry key
   * overrides the trace when supplied.
   */
  icon?: string
  /**
   * Tile left edge as a fraction of canvas width. Measured per tile
   * (0.2250 / 0.4586 / 0.6924); the seed carries the measured values.
   */
  xFrac: number
  /**
   * Tile width as a fraction of canvas width. Measured per tile
   * (0.0820 / 0.0823 / 0.0818).
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
  /** Glyph ink band inside the tile (viewBox units) — traced per tile. */
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
  /** Delay in ms behind the bracket click (the settled right leg: 0). */
  delayMs: number
}

/** A traced amber badge above a plate: settled-ink path + its reveal click. */
export interface TileSummaryBadge {
  path: string
  click: number
}

export interface TileSummaryLayout {
  tiles: TileSummaryRect[]
  rail: TileSummaryRailSegment[]
  /** Left terminus chevron: polyline points + stroke width (viewBox units). */
  leftMark: { points: string; strokeW: number; click: number }
  /** The settled bracket's single (right) leg — settled_full.png has no left vertical. */
  vertical: TileSummaryVertical
  bar: { x: number; y: number; w: number; h: number }
  /** Amber badges above the plates, riding their tile's wave. */
  badges: TileSummaryBadge[]
  /** Dim summary line under the bar (measured box; the copy is a prop). */
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
  // per-tile, from the 4× downsampled glyph traces (t1 vessel 627–739 ×
  // 643–722, t2 rules+diagonal 1237–1321 × 638–722, t3 banded box
  // 1831–1919 × 630–730 native), re-expressed on the corrected tile boxes
  // so each glyph keeps its absolute traced position.
  iconBoxes: [
    { xFrac: 0.2424, yFrac: 0.3095, wFrac: 0.5304, hFrac: 0.3762 },
    { xFrac: 0.2982, yFrac: 0.2857, wFrac: 0.3981, hFrac: 0.3762 },
    { xFrac: 0.279, yFrac: 0.2476, wFrac: 0.4204, hFrac: 0.4762 },
  ],
  // Rail band y 0.4701–0.4764 (core 677–686 native). Between-tile segments
  // span tile edge to tile edge (per the corrected 432/880.5/1329.5 lefts);
  railYFrac: 0.4701,
  railHFrac: 0.00625,
  // The settled rail is CONTINUOUS (settled_full.png row-scan x 416–1607):
  // the two between-tile segments ride tiles 2/3 and the bracket beat
  // fills the chevron→tile-1 gap, both mid gaps, and the right stub.
  railSegs: [
    { x0Frac: 0.307, x1Frac: 0.4586, click: 2 }, // tile 1 → tile 2
    { x0Frac: 0.541, x1Frac: 0.6924, click: 3 }, // tile 2 → tile 3
    { x0Frac: 0.213281, x1Frac: 0.307, click: 4 }, // rail left terminus (x≈409.5, under the chevron arms) → segment 1
    { x0Frac: 0.4586, x1Frac: 0.541, click: 4 }, // close gap 1
    { x0Frac: 0.6924, x1Frac: 0.7723, click: 4 }, // tile 3 → stub
    { x0Frac: 0.7723, x1Frac: 0.8385, click: 4 }, // stub into the right vertical
  ],
  // Left terminus: a small thin '>' chevron hugging tile 1's left edge —
  // centerline apex (0.225521, 0.470370), arm tips (0.213542,
  // 0.459259 / 0.483333), stroke ≈0.002865 (settled_full.png rows 496–522:
  // a ~26×23px mark whose apex merges into the tile fill edge). An earlier
  // "bold 35×74px chevron" read conflated that fill-edge column with the
  // mark; the ASCII scan separates them. Rides tile 1's wave (the t≈0.2
  // plate event covers its zone).
  leftMark: {
    apex: { xFrac: 0.225521, yFrac: 0.47037 },
    armYFracs: [0.459259, 0.483333],
    armXFrac: 0.213542,
    strokeFrac: 0.002865,
  },
  // Bracket leg: the settled frame's single right vertical, rail center
  // (0.4722) → bar center (0.7715) at x 0.8367 (settled_full.png; no left
  // vertical exists in the gate target).
  vertical: {
    xFrac: 0.8367,
    wFrac: 0.0031,
    delayMs: 0,
    topYFrac: 0.4722,
    bottomYFrac: 0.7715,
  },
  // Cyan bar at its SETTLED extent (settled_full.png rows 830–835):
  // x 0.3152–0.8371, y 0.7681–0.7737 (sub-pixel edge scan: left 605.2,
  // right 1607.3). The late f0030 sweep is not reproduced — the gate frame
  // wins.
  bar: { xFrac: 0.31521, wFrac: 0.52191, yFrac: 0.7681, hFrac: 0.00556 },
  // Label bands under the tiles (bright line 1, dim line 2), per-tile
  // measured ink widths (mono advance; textLength pins absorb the face
  // difference). Tile 2's line-1 ink is 4 glyphs (MOVE), matching LOAD.
  labelLine1: { yFrac: 0.5806, hFrac: 0.0243, inkWs: [0.0824, 0.0457, 0.0449] },
  labelLine2: { yFrac: 0.6308, hFrac: 0.0132, inkWs: [0.1172, 0.1246, 0.173] },
  // Summary line under the bar: measured from the f0030 ghost (ink x
  // 0.2969–0.7180, cap band 0.7750–0.7958). The copy settles at ~8%
  // opacity in the reference (no pixel above luma 30 in the text zone) —
  // the resting render fades to the same ghost.
  summary: { xFrac: 0.2969, wFrac: 0.4211, capTopFrac: 0.775, baselineFrac: 0.7958 },
  summarySettledOpacity: 0.08,
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
  // Near-black plate fill sampled from the colors.json plate-interior
  // modal (#040b0b, 20.8% share at t=0.2–0.333; luma ≈ 8 on the #000303
  // canvas). It reads as a faint outline on the black canvas; the locked
  // V-3 decision keeps it near-black (divergences are opt-in).
  plateFill: '#040b0b',
} as const

/** Near-black backing-card fill (see MEASURED.plateFill provenance). */
export const TILE_SUMMARY_PLATE_FILL = MEASURED.plateFill

/** Settled summary-line opacity — the measured ~8% fade ghost. */
export const TILE_SUMMARY_SUMMARY_OPACITY = MEASURED.summarySettledOpacity

/** Amber badge ink (measured native peak [226,178,42] on the AA'd mask). */
export const TILE_SUMMARY_BADGE_FILL = '#e6b62e'

/** Tile corner radius in canvas units (settled-frame corner arcs, ±2px). */
export const TILE_SUMMARY_RX = MEASURED.tileRxPx

/**
 * Glyph stroke width in the traced paths' 24-unit space. The reference
 * glyphs render ~5px at 1080p (scale ≈3.7 through the icon box); the stock
 * width 2 lands ~7.4px and reads heavier than the frame.
 */
export const TILE_SUMMARY_GLYPH_STROKE = 1.6

/**
 * SVG-native stroke added to the chrome title glyphs. The reference header
 * holds ~27.6k ink px in its band; the bundled mono face at weight 700
 * paints ~15.7k in the same box (43% deficit vs the recording's condensed
 * bold). Stroke width 4 in the fill color recovers the density without a
 * non-bundled face.
 */
export const TILE_SUMMARY_TITLE_STROKE = 4

/** The measured seg16 seed: the ETL row, in reveal order. */
export const TILE_SUMMARY_SEED: TileSummaryTile[] = [
  { id: 'extract', label: 'EXTRACT', sublabel: 'OUT OF THE SOURCE', xFrac: 0.225, wFrac: 0.082031 },
  { id: 'move', label: 'MOVE', sublabel: 'ACROSS THE NETWORK', xFrac: 0.458594, wFrac: 0.082292 },
  { id: 'load', label: 'LOAD', sublabel: 'STRAIGHT INTO THE WAREHOUSE', xFrac: 0.692448, wFrac: 0.081771 },
]

/**
 * Traced amber badges above the plates (settled_full.png native masks,
 * row-run paths in 1080p viewBox units). Reads: A4 / A5 / A2 — two glyphs
 * each, ~22px caps. They fade in with their tile's wave (f0005–f0008).
 */
export const TILE_SUMMARY_BADGES: string[] = [
  'M495.00 385.50H495.75V386.25H495.00ZM495.00 386.25H496.50V387.00H495.00ZM490.50 387.00H498.75V387.75H490.50ZM516.00 387.00H522.00V388.50H516.00ZM490.50 387.75H499.50V390.00H490.50ZM487.50 388.50H489.00V390.00H487.50ZM514.50 388.50H522.00V390.00H514.50ZM487.50 390.00H492.00V390.75H487.50ZM496.50 390.00H501.00V402.75H496.50ZM513.00 390.00H523.50V390.75H513.00ZM487.50 390.75H491.25V391.50H487.50ZM513.00 390.75H517.50V391.50H513.00ZM518.25 390.75H523.50V392.25H518.25ZM486.75 391.50H491.25V394.50H486.75ZM513.00 391.50H514.50V393.00H513.00ZM516.00 391.50H516.75V392.25H516.00ZM519.00 392.25H523.50V403.50H519.00ZM487.50 394.50H491.25V396.00H487.50ZM493.50 394.50H495.00V396.00H493.50ZM487.50 396.00H490.50V400.50H487.50ZM492.00 396.00H495.75V397.50H492.00ZM493.50 397.50H495.75V398.25H493.50ZM493.50 398.25H495.00V399.00H493.50ZM487.50 400.50H491.25V402.75H487.50ZM487.50 402.75H492.00V403.50H487.50ZM495.75 402.75H501.00V403.50H495.75ZM489.00 403.50H500.25V405.00H489.00ZM514.50 403.50H516.00V405.00H514.50ZM517.50 403.50H527.25V405.00H517.50ZM490.50 405.00H499.50V405.75H490.50ZM514.50 405.00H527.25V406.50H514.50ZM490.50 405.75H498.75V406.50H490.50ZM492.00 406.50H495.00V407.25H492.00ZM493.50 407.25H495.00V408.00H493.50Z',
  'M966.75 385.50H970.50V386.25H966.75ZM964.50 386.25H972.00V387.00H964.50ZM937.50 387.00H948.00V388.50H937.50ZM963.75 387.00H973.50V387.75H963.75ZM963.00 387.75H974.25V388.50H963.00ZM936.00 388.50H948.00V390.00H936.00ZM963.00 388.50H975.00V390.00H963.00ZM936.00 390.00H940.50V391.50H936.00ZM945.00 390.00H948.00V393.00H945.00ZM963.00 390.00H966.75V390.75H963.00ZM970.50 390.00H975.00V391.50H970.50ZM963.00 390.75H966.00V393.00H963.00ZM936.00 391.50H939.75V393.75H936.00ZM971.25 391.50H975.00V393.00H971.25ZM945.75 393.00H949.50V401.25H945.75ZM970.50 393.00H975.00V396.00H970.50ZM936.00 393.75H940.50V394.50H936.00ZM936.00 394.50H939.75V395.25H936.00ZM941.25 394.50H943.50V395.25H941.25ZM936.00 395.25H943.50V396.00H936.00ZM936.00 396.00H945.00V397.50H936.00ZM969.00 396.00H973.50V396.75H969.00ZM968.25 396.75H973.50V397.50H968.25ZM936.00 397.50H939.75V400.50H936.00ZM940.50 397.50H945.00V398.25H940.50ZM967.50 397.50H972.00V398.25H967.50ZM942.00 398.25H943.50V399.00H942.00ZM966.75 398.25H972.00V399.00H966.75ZM966.00 399.00H972.00V399.75H966.00ZM965.25 399.75H971.25V400.50H965.25ZM936.00 400.50H940.50V402.00H936.00ZM964.50 400.50H970.50V401.25H964.50ZM945.00 401.25H949.50V403.50H945.00ZM963.75 401.25H969.00V402.00H963.75ZM936.00 402.00H939.00V403.50H936.00ZM963.00 402.00H969.00V402.75H963.00ZM963.00 402.75H968.25V403.50H963.00ZM936.00 403.50H948.00V404.25H936.00ZM963.00 403.50H975.00V406.50H963.00ZM936.75 404.25H948.00V405.00H936.75ZM937.50 405.00H948.00V405.75H937.50ZM937.50 405.75H947.25V406.50H937.50ZM940.50 406.50H945.00V407.25H940.50ZM942.00 407.25H943.50V408.00H942.00Z',
  'M1389.00 385.50H1393.50V386.25H1389.00ZM1387.50 386.25H1395.00V387.00H1387.50ZM1416.00 386.25H1422.00V387.00H1416.00ZM1386.00 387.00H1396.50V388.50H1386.00ZM1411.50 387.00H1423.50V388.50H1411.50ZM1385.25 388.50H1396.50V389.25H1385.25ZM1417.50 388.50H1423.50V390.00H1417.50ZM1384.50 389.25H1396.50V390.00H1384.50ZM1384.50 390.00H1389.00V391.50H1384.50ZM1393.50 390.00H1396.50V391.50H1393.50ZM1418.25 390.00H1423.50V390.75H1418.25ZM1417.50 390.75H1422.75V391.50H1417.50ZM1384.50 391.50H1387.50V393.00H1384.50ZM1394.25 391.50H1398.00V402.00H1394.25ZM1416.75 391.50H1422.00V392.25H1416.75ZM1416.00 392.25H1420.50V393.00H1416.00ZM1384.50 393.00H1389.00V395.25H1384.50ZM1416.00 393.00H1419.75V393.75H1416.00ZM1416.00 393.75H1421.25V394.50H1416.00ZM1389.75 394.50H1392.75V395.25H1389.75ZM1416.00 394.50H1422.00V396.00H1416.00ZM1384.50 395.25H1393.50V397.50H1384.50ZM1416.00 396.00H1423.50V397.50H1416.00ZM1384.50 397.50H1389.00V402.75H1384.50ZM1389.75 397.50H1393.50V398.25H1389.75ZM1419.00 397.50H1424.25V398.25H1419.00ZM1390.50 398.25H1392.00V399.00H1390.50ZM1419.75 398.25H1424.25V399.00H1419.75ZM1420.50 399.00H1425.00V400.50H1420.50ZM1419.75 400.50H1425.00V402.00H1419.75ZM1411.50 401.25H1413.00V402.00H1411.50ZM1393.50 402.00H1398.00V403.50H1393.50ZM1410.00 402.00H1414.50V402.75H1410.00ZM1419.75 402.00H1424.25V403.50H1419.75ZM1384.50 402.75H1389.75V403.50H1384.50ZM1410.75 402.75H1414.50V403.50H1410.75ZM1386.00 403.50H1396.50V405.00H1386.00ZM1411.50 403.50H1423.50V405.00H1411.50ZM1387.50 405.00H1396.50V406.50H1387.50ZM1411.50 405.00H1422.00V405.75H1411.50ZM1412.25 405.75H1422.00V406.50H1412.25Z',
]

/** All three line-1 reads are template-confirmed against the frame crops. */
export const TILE_SUMMARY_LABEL_CONFIDENCE = {
  extract: 'confirmed',
  move: 'confirmed',
  load: 'confirmed',
} as const

/**
 * Traced in-tile glyph marks (24-unit stroke space, the shared icon
 * conventions apply). Traced from 4× downsampled settled-frame crops:
 * extract = flared vessel with a flat top and closed base; move = two
 * full-width rules with a threading diagonal; load = rounded box with two
 * internal bands. A tile's `icon` registry key overrides its trace.
 */
export const TILE_SUMMARY_GLYPHS: Record<string, string> = {
  extract: `<path d="M9.4 1.5 H16.3" />
  <path d="M9.4 1.5 Q3.5 9.5 0 14.9 Q2.5 19.5 5.1 22.2" />
  <path d="M16.3 1.5 Q17.7 10 24 14.9 Q20.2 19.5 20.6 22.2" />
  <path d="M5.1 22.2 H20.6" />`,
  move: `<path d="M0 7.1 H24" />
  <path d="M0 18 H24" />
  <path d="M16.6 0 L20.9 6.3" />
  <path d="M1.1 18.9 L8 24" />`,
  load: `<rect x="1.2" y="1.2" width="21.6" height="21.6" rx="2.4" />
  <path d="M4.4 8.2 H19.6" />
  <path d="M4.4 16.1 H19.6" />`,
}

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
  const iconSpecs = MEASURED.iconBoxes

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
    const inkW2 = (line2.inkWs[Math.min(i, line2.inkWs.length - 1)] ?? line2.inkWs[0]!) * width

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
        x: x + iconSpecs[i]!.xFrac * w,
        y: tileY + iconSpecs[i]!.yFrac * tileH,
        w: iconSpecs[i]!.wFrac * w,
        h: iconSpecs[i]!.hFrac * tileH,
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

  const mark = MEASURED.leftMark
  const armTopY = mark.armYFracs[0] * height
  const armBottomY = mark.armYFracs[1] * height
  const leftMark = {
    points: `${mark.armXFrac * width},${armTopY} ${mark.apex.xFrac * width},${mark.apex.yFrac * height} ${mark.armXFrac * width},${armBottomY}`,
    strokeW: mark.strokeFrac * width,
    click: 1,
  }

  const vTop = MEASURED.vertical.topYFrac * height
  const vBottom = MEASURED.vertical.bottomYFrac * height
  const vertical: TileSummaryVertical = {
    x: MEASURED.vertical.xFrac * width,
    y: vTop,
    w: MEASURED.vertical.wFrac * width,
    h: vBottom - vTop,
    delayMs: MEASURED.vertical.delayMs,
  }

  const badges: TileSummaryBadge[] = TILE_SUMMARY_BADGES.map((path, i) => ({
    path,
    click: Math.min(i + 1, tiles.length),
  }))

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
    leftMark,
    vertical,
    badges,
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
