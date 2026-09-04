/**
 * Pure hex-cluster layout math for the HexCluster diagram family — the
 * exact-trace rebuild (sheet art_4A7yguGJ, HexCluster section).
 *
 * The recording's composition is NOT a standalone honeycomb: it is two
 * bordered cluster plates on the black canvas, each carrying a faint flat-top
 * honeycomb web and a tone-colored in-panel label. Left plate x12–584,
 * y423–849; right plate x630–1196, y426–846 (sheet §3, confirmed by border
 * runs in the settled frame this session). All content ends at x1402 — the
 * right third of the canvas stays empty.
 *
 * The web's settled strokes are extremely dim — medians #0a161a (left) and
 * #0d1320 (right), brightest accents #1a2a30, i.e. ~6–10% effective white
 * (sheet §3, the single biggest correction vs the old bright-outline model).
 * The bright web exists only mid-sequence: blue #3997f5 (left) / cyan
 * #22cde5 (right), measured from bright-frame f350 medians, and the web dims
 * to the settled state in the 5.9–6.6s transition.
 *
 * Web geometry (measured this session with a ring-fraction Hough over the
 * union of bright frames f230/f260/f300/f350): flat-top hexagons, R ≈ 45–60
 * at 1920×1080 (2R ≈ 90–128 ≈ the sheet's "cell size 90–140px"), lit in
 * small clusters — left ≈ (140–330, 640–730), right ≈ (760–880, 630–770)
 * plus one outlier cell near (1006, 709). The layout emits a flat-top
 * honeycomb patch anchored on each measured cluster centroid.
 *
 * Every length derives from viewBox-relative fractions (the measured ratios),
 * never absolute pixels. All functions here are pure and deterministic: same
 * inputs produce byte-identical output, and nothing touches the DOM.
 */

/** One cluster plate's data — a label plus the tone family of its web. */
export interface HexPlateData {
  /** Stable key — used for a11y labels and test selectors. */
  id: string
  /** In-panel label (the settled frame reads 'INGESTION' left, 'NODE' right). */
  label: string
  /** Tone family: 'cyan' renders the measured cyan label/web pair, 'blue' the blue one. */
  tone: 'cyan' | 'blue'
}

/** Full slide payload, as an MCP agent would emit it. */
export interface HexClusterData {
  plates: HexPlateData[]
}

/** Layout knobs. Every field is optional; omitted fields fall back to the measured defaults. */
export interface HexClusterOptions {
  /** ViewBox width in user units. Default 1920. */
  width?: number
  /** ViewBox height in user units. Default 1080. */
  height?: number
  /** Flat-top web cell circumradius as a fraction of height (measured R ≈ 45/1080 ≈ 0.0417). */
  webRFrac?: number
  /** Outline stroke width of the web cells and plate borders, as a fraction of height (≈ 3px at 1080). */
  strokeFrac?: number
}

/** One laid-out plate: measured bounds, its honeycomb patch, and label anchor. */
export interface HexPlate {
  id: string
  data: HexPlateData
  /** Plate bounds in viewBox units (the sheet's measured bboxes). */
  x: number
  y: number
  width: number
  height: number
  /** Corner radius in viewBox units. */
  rx: number
  /** Web cells belonging to this plate. */
  cells: HexCell[]
  /** In-panel label: centered on the plate, cap band at the measured y489–519. */
  label: { text: string; cx: number; baseline: number; capHeight: number }
}

/** One flat-top hexagon of a plate's web. */
export interface HexCell {
  /** Owning plate id. */
  plateId: string
  cx: number
  cy: number
  /** `M … L … Z` path through the six vertices. */
  path: string
  /** The optional pre-build core: one filled cell that leads the right plate's build. */
  core: boolean
}

export interface HexClusterLayout {
  plates: HexPlate[]
  cells: HexCell[]
  viewBox: { width: number; height: number }
  /** Web cell circumradius in viewBox units. */
  webR: number
  /** Web/plate stroke width in viewBox units. */
  strokeWidth: number
}

/**
 * Measured color contract (sheet §3 + this session's frame medians). The
 * settled strokes are the whole point of the rebuild: ~6–10% effective white,
 * never bright outlines. Bright tones exist only mid-sequence; the component
 * binds the dim to the final click.
 */
export const HEX_COLORS = {
  /** Plate interior fill — measured median (12,11,16) across both plates. */
  plateFill: '#0c0b10',
  /** Plate borders — measured medians: left (3,29,33), right (14,25,41). */
  plateStroke: { left: '#031d21', right: '#0e1929' } as const,
  /** Settled web strokes — the sheet's dim medians. */
  settledStroke: { left: '#0a161a', right: '#0d1320' } as const,
  /** Settled web accents — the sheet's brightest settled cells. */
  settledAccent: '#1a2a30',
  /** Bright mid-sequence web strokes — f350 medians: left (57,150,244), right (34,204,228). */
  brightStroke: { left: '#3997f5', right: '#22cde5' } as const,
  /** In-panel labels — the sheet's #26c8dd / #3b95eb caps. */
  label: { cyan: '#26c8dd', blue: '#3b95eb' } as const,
} as const

/** Measured plate bounds at 1920×1080 (sheet §3, border-run confirmed). */
const MEASURED = {
  width: 1920,
  height: 1080,
  webRFrac: 0.0417,
  strokeFrac: 0.0028,
  plateRx: 14,
  labelCap: 31,
  labelCapTop: 489,
  /**
   * Left-plate cluster: ring of 5 flat-top cells around an empty center,
   * anchored on the lit-subset centroid ≈ (228, 673).
   */
  leftClusterCx: 228,
  leftClusterCy: 675,
  /**
   * Right-plate cluster: ring of 5 + one center cell, centroid ≈ (800, 690),
   * plus the measured outlier cell near (1006, 709).
   */
  rightClusterCx: 800,
  rightClusterCy: 690,
  rightOutlierCx: 1006,
  rightOutlierCy: 709,
  /**
   * The pre-build core: one filled cell that pops in just before the builds
   * (bright by f200, gone below the plate fill after the dim) — right plate,
   * center ≈ (921, 590), R ≈ 47.
   */
  coreCx: 921,
  coreCy: 590,
  coreR: 47,
} as const

/** Format a coordinate for path data: 4 decimal places, trailing zeros trimmed. */
function fmt(n: number): string {
  return String(parseFloat(n.toFixed(4)))
}

/** Flat-top hexagon vertices, clockwise from the right vertex (angles 0°, 60°, …). */
export function flatTopVertices(cx: number, cy: number, r: number): Array<[number, number]> {
  const verts: Array<[number, number]> = []
  for (let k = 0; k < 6; k++) {
    const a = (Math.PI / 3) * k
    verts.push([cx + r * Math.cos(a), cy + r * Math.sin(a)])
  }
  return verts
}

export function flatTopPath(cx: number, cy: number, r: number): string {
  return (
    flatTopVertices(cx, cy, r)
      .map(([x, y], k) => `${k === 0 ? 'M' : 'L'} ${fmt(x)} ${fmt(y)}`)
      .join(' ') + ' Z'
  )
}

/**
 * The honeycomb patch around an anchor: the anchor's six edge-neighbor
 * positions (flat-top neighbors sit at distance √3·R, angles 30°/90°/…/330°)
 * — a ring of cells around an optionally filled center.
 */
function neighborRing(cx: number, cy: number, r: number): Array<{ cx: number; cy: number }> {
  const d = Math.sqrt(3) * r
  const cells: Array<{ cx: number; cy: number }> = []
  for (let k = 0; k < 6; k++) {
    const a = (Math.PI / 6) + (Math.PI / 3) * k
    cells.push({ cx: cx + d * Math.cos(a), cy: cy + d * Math.sin(a) })
  }
  return cells
}

/**
 * The cluster layouts: left = ring of 5 (skip the top neighbor — the measured
 * lit patch hugs the plate's lower half); right = full ring of 6 + center.
 * Cell counts land in the sheet census's 6–9 hexagons per panel once the
 * outlier and core are counted.
 */
function clusterCells(plateId: string, cx: number, cy: number, r: number, skip: number[]): HexCell[] {
  return neighborRing(cx, cy, r)
    .filter((_, k) => !skip.includes(k))
    .map((c) => ({ plateId, cx: c.cx, cy: c.cy, path: flatTopPath(c.cx, c.cy, r), core: false }))
}

export function hexClusterLayout(opts?: HexClusterOptions): HexClusterLayout {
  const width = opts?.width ?? MEASURED.width
  const height = opts?.height ?? MEASURED.height
  const webR = (opts?.webRFrac ?? MEASURED.webRFrac) * height
  const strokeWidth = (opts?.strokeFrac ?? MEASURED.strokeFrac) * height

  // Plate bounds as fractions of the measured canvas, rescaled to the viewBox.
  const kx = width / MEASURED.width
  const ky = height / MEASURED.height
  const plateDefs = [
    {
      id: 'left',
      x: 12 * kx,
      y: 423 * ky,
      width: 572 * kx,
      height: 426 * ky,
      stroke: HEX_COLORS.plateStroke.left,
      tone: 'cyan' as const,
      label: 'INGESTION',
      cells: clusterCells('left', MEASURED.leftClusterCx * kx, MEASURED.leftClusterCy * ky, webR, [1]),
    },
    {
      id: 'right',
      x: 630 * kx,
      y: 426 * ky,
      width: 566 * kx,
      height: 420 * ky,
      stroke: HEX_COLORS.plateStroke.right,
      tone: 'blue' as const,
      label: 'NODE',
      cells: [
        ...clusterCells('right', MEASURED.rightClusterCx * kx, MEASURED.rightClusterCy * ky, webR, []),
        { plateId: 'right', cx: MEASURED.rightOutlierCx * kx, cy: MEASURED.rightOutlierCy * ky, path: flatTopPath(MEASURED.rightOutlierCx * kx, MEASURED.rightOutlierCy * ky, webR), core: false },
      ],
    },
  ]

  const plates: HexPlate[] = plateDefs.map((d) => ({
    id: d.id,
    data: { id: d.id, label: d.label, tone: d.tone },
    x: d.x,
    y: d.y,
    width: d.width,
    height: d.height,
    rx: MEASURED.plateRx * ky,
    cells: d.cells,
    label: {
      text: d.label,
      cx: d.x + d.width / 2,
      baseline: (MEASURED.labelCapTop + MEASURED.labelCap) * ky,
      capHeight: MEASURED.labelCap * ky,
    },
  }))

  const coreCell: HexCell = {
    plateId: 'right',
    cx: MEASURED.coreCx * kx,
    cy: MEASURED.coreCy * ky,
    path: flatTopPath(MEASURED.coreCx * kx, MEASURED.coreCy * ky, MEASURED.coreR * ky),
    core: true,
  }

  return {
    plates,
    cells: [...plates.flatMap((p) => p.cells), coreCell],
    viewBox: { width, height },
    webR,
    strokeWidth,
  }
}
