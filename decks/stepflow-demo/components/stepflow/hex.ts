/**
 * Pure hex-cluster layout math for the HexCluster diagram family.
 *
 * Reproduces the v5 recording composition (research art_0AzKGXnD §F4, re-measured
 * this session at 1fps frame f006 with polar profiles — see the constant comments):
 * three outlined cells in a honeycomb V — two on a top row, one centered between
 * and below them ("half a slot lower") — revealed one cell per click with a
 * stroke-draw around each outline.
 *
 * Every length derives from viewBox-relative fractions (the measured ratios),
 * never absolute pixels, so the same numbers serve the 1920×1080 deck and any
 * future embed. All functions here are pure and deterministic: same inputs
 * produce byte-identical output, and nothing touches the DOM (SSR-safe build).
 *
 * Settled-state note (fidelity rework): the recording builds the V through frame
 * f006 and then RE-FLOWS — the settled state the wave-1 census measured is a
 * single row of three tangent cells (centers ≈ 24.8/47.5/70.3%w, cy ≈ 0.603·h,
 * span x ≈ 13.4–81.7%w). The measured defaults here stay the mid-reveal V;
 * slides ship the settled row via `arrangement: 'row'` + geometry overrides.
 *
 * Measured-shape note: the v5 outlines are geometrically CIRCLES (radial spread
 * < 0.5% across all 360°, where a regular hexagon varies 15.5% between facet
 * midpoints and vertices). The family design locked hexagon outlines for this
 * component (name, roster row, and contract all say hexagon), so the measured
 * across-diameter (~0.4056 of canvas height) is mapped onto a pointy-top
 * hexagon's vertical extent (2R). Recorded as an accepted deviation in the
 * deck README; flipping to circles would be a one-constant change here.
 */

/** Pointy-top hexagon or "row" arrangement for the cluster. */
export type HexArrangement = 'v' | 'row'

/** Layout knobs. Every field is optional; omitted fields fall back to the measured defaults. */
export interface HexOptions {
  /** ViewBox width in user units. Default 1920. */
  width?: number
  /** ViewBox height in user units. Default 1080. */
  height?: number
  /** Hexagon circumradius as a fraction of height (measured across ≈ 0.4056·h → R ≈ 0.2028; normalized to 0.203). */
  hexRFrac?: number
  /** Same-row neighbor center spacing as a fraction of width (measured 1394/2038 ≈ 0.684). */
  pitchXFrac?: number
  /** 'v' arrangement: second-row drop as a fraction of height (measured 274/1144 ≈ 0.2395). */
  dropFrac?: number
  /** Top row (or sole row) center height as a fraction of height (measured 622/1144 ≈ 0.5439). */
  topFrac?: number
  /** Cluster axis x as a fraction of width. Default 0.5 (the recording sits at ≈ 0.476; normalized to center). */
  centerXFrac?: number
  /** Outline stroke width as a fraction of height (measured ≈ 9/1144 ≈ 0.008). */
  strokeFrac?: number
}

/** One laid-out cell: center, vertices, SVG path data, and the analytic outline length. */
export interface HexCell {
  /** 0-based position in the cluster (data order on the slide). */
  index: number
  cx: number
  cy: number
  /** Six vertices, pointy-top, clockwise from the top vertex — the stroke-draw start point. */
  vertices: Array<[number, number]>
  /** `M … L … Z` path through the six vertices. */
  path: string
  /** Analytic perimeter — 6 × R for a regular hexagon; no DOM path measurement. */
  perimeter: number
}

export interface HexLayout {
  cells: HexCell[]
  arrangement: HexArrangement
  viewBox: { width: number; height: number }
  /** Cluster axis x in viewBox units (centerXFrac × width) — chrome centers here. */
  axisX: number
  /** Absolute hexagon circumradius in viewBox units (hexRFrac × height). */
  hexR: number
  /** Absolute outline stroke width in viewBox units (strokeFrac × height). */
  strokeWidth: number
}

/**
 * Node data contract for HexCluster diagrams. Content travels with the slide:
 * a diagram is data-in via props, never global state. Icons key into the Lucide
 * registry (`icons.ts`); unknown keys render the visible fallback.
 */
export interface HexNodeData {
  /** Stable key — used for a11y labels and test selectors. */
  id: string
  /** Mono uppercase title inside the cell. */
  title: string
  /** One-line dim caption under the title. */
  caption: string
  /** Key into the icon registry (`iconPath`). */
  icon: string
  /** Icon tone: 'tertiary' renders in `accentTertiary ?? accent` (teal-green in the recording); default accent. */
  tone?: 'accent' | 'tertiary'
}

/** Full slide payload, as an MCP agent would emit it. */
export interface HexClusterData {
  nodes: HexNodeData[]
  arrangement?: HexArrangement
}

/** Measured defaults (v5 re-measure, this session), expressed as fractions. */
const MEASURED = {
  width: 1920,
  height: 1080,
  hexRFrac: 0.203,
  pitchXFrac: 0.684,
  dropFrac: 0.2395,
  topFrac: 0.5439,
  centerXFrac: 0.5,
  strokeFrac: 0.008,
} as const

/** Format a coordinate for path data: 4 decimal places, trailing zeros trimmed. */
function fmt(n: number): string {
  return String(parseFloat(n.toFixed(4)))
}

export function hexLayout(
  count: number,
  arrangement: HexArrangement = 'v',
  opts?: HexOptions,
): HexLayout {
  if (!Number.isInteger(count) || count < 1) {
    throw new RangeError(`count must be a positive integer, received ${count}`)
  }
  if (arrangement !== 'v' && arrangement !== 'row') {
    throw new RangeError(`arrangement must be 'v' or 'row', received ${String(arrangement)}`)
  }

  const width = opts?.width ?? MEASURED.width
  const height = opts?.height ?? MEASURED.height
  const hexRFrac = opts?.hexRFrac ?? MEASURED.hexRFrac
  const pitchXFrac = opts?.pitchXFrac ?? MEASURED.pitchXFrac
  const dropFrac = opts?.dropFrac ?? MEASURED.dropFrac
  const topFrac = opts?.topFrac ?? MEASURED.topFrac
  const centerXFrac = opts?.centerXFrac ?? MEASURED.centerXFrac
  const strokeFrac = opts?.strokeFrac ?? MEASURED.strokeFrac

  const hexR = hexRFrac * height
  const pitchX = pitchXFrac * width
  const strokeWidth = strokeFrac * height
  const axisX = centerXFrac * width
  const topY = topFrac * height
  const dropY = dropFrac * height

  // 'v': top row holds ceil(n/2) cells, the rest centered between and below them
  // (half a slot lower — the recording's V). 'row': one line, vertically at topY.
  const topCount = arrangement === 'v' ? Math.ceil(count / 2) : count
  const bottomCount = count - topCount

  const centers: Array<{ cx: number; cy: number }> = []
  for (let i = 0; i < topCount; i++) {
    centers.push({ cx: axisX + (i - (topCount - 1) / 2) * pitchX, cy: topY })
  }
  for (let j = 0; j < bottomCount; j++) {
    centers.push({ cx: axisX + (j - (bottomCount - 1) / 2) * pitchX, cy: topY + dropY })
  }

  // Pointy-top vertices, clockwise from the top vertex (the stroke-draw origin).
  // Side length equals the circumradius R, so the perimeter is exactly 6·R.
  const sqrt3HalfR = (Math.sqrt(3) / 2) * hexR
  const halfR = hexR / 2

  const cells: HexCell[] = centers.map((c, index) => {
    const vertices: Array<[number, number]> = [
      [c.cx, c.cy - hexR],
      [c.cx + sqrt3HalfR, c.cy - halfR],
      [c.cx + sqrt3HalfR, c.cy + halfR],
      [c.cx, c.cy + hexR],
      [c.cx - sqrt3HalfR, c.cy + halfR],
      [c.cx - sqrt3HalfR, c.cy - halfR],
    ]
    const d = vertices.map(([x, y], k) => `${k === 0 ? 'M' : 'L'} ${fmt(x)} ${fmt(y)}`).join(' ') + ' Z'
    return { index, cx: c.cx, cy: c.cy, vertices, path: d, perimeter: 6 * hexR }
  })

  return { cells, arrangement, viewBox: { width, height }, axisX, hexR, strokeWidth }
}
