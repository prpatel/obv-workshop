/**
 * Pure serpentine layout math for StepFlow diagrams (build-spec deliverable D2a).
 *
 * Reproduces the track anatomy measured from the reference screenshot
 * (stepflow-visual-spec art_0VvS7Nb1 §3–§4): a lead-in stub, a top lane, a right
 * U-turn, a return lane running between the rows, a left U-turn, and a bottom lane
 * whose final segment terminates under the last disc. The whole track is ONE
 * continuous SVG path so the component can reveal it with a single
 * stroke-dashoffset animation.
 *
 * Every length derives from viewBox-relative fractions (the measured ratios),
 * never absolute pixels, so the same numbers serve the 1920×1080 deck and any
 * future embed. All functions here are pure and deterministic: same inputs
 * produce byte-identical output, and nothing touches the DOM (SSR-safe build).
 */

/** Layout knobs. Every field is optional; omitted fields fall back to the measured defaults. */
export interface SerpentineOptions {
  /** Grid columns; defaults to ceil(stepCount / 2), minimum 2. Raised to fit the nodes when given smaller. */
  cols?: number
  /** ViewBox width in user units. Default 1920. */
  width?: number
  /** ViewBox height in user units. Default 1080. */
  height?: number
  /** Column pitch as a fraction of width (measured 760/2096 ≈ 0.363). */
  pitchXFrac?: number
  /** Row pitch as a fraction of height (measured 485/848 ≈ 0.572). */
  pitchYFrac?: number
  /** Disc radius as a fraction of height (measured 71/848 ≈ 0.0838). */
  discRFrac?: number
  /** Track stroke width as a fraction of height (measured 21/848 ≈ 0.0248). */
  trackWidthFrac?: number
  /** Return-lane offset as a fraction of the row pitch (measured ≈ 0.57 — deliberately not the midpoint). */
  returnLaneFrac?: number
  /**
   * Lead-in stub length as a fraction of the column pitch. The 0.2 default is
   * APPROXIMATE — derived by eye from the reference screenshot (stub ≈ 92 px at
   * source scale); refine at component-stage visual review.
   */
  leadInFrac?: number
}

export interface NodeLayout {
  cx: number
  cy: number
  /** 0 = top row, 1 = bottom row. */
  lane: 0 | 1
  /** Step index along the flow (0-based). */
  index: number
}

export interface TrackLayout {
  /** One continuous path: M + H segments + two semicircular A arcs (when both lanes exist). */
  d: string
  /** Analytic path length — no DOM path measurement. */
  totalLength: number
  /**
   * Arc length along the path at which node i's reveal segment completes — the
   * dash-reveal boundary the component animates to. Strictly increasing, and
   * nodeDistances[stepCount - 1] === totalLength because the path ends under the
   * last disc.
   */
  nodeDistances: number[]
}

export interface SerpentineLayout {
  nodes: NodeLayout[]
  track: TrackLayout
  viewBox: { width: number; height: number }
  /** Absolute disc radius in viewBox units (discRFrac × height). */
  discR: number
  /** Absolute track stroke width in viewBox units (trackWidthFrac × height). */
  trackWidth: number
}

/** Measured defaults (stepflow-visual-spec art_0VvS7Nb1 §3–§4), expressed as fractions. */
const MEASURED = {
  width: 1920,
  height: 1080,
  pitchXFrac: 0.363,
  pitchYFrac: 0.572,
  discRFrac: 0.0838,
  trackWidthFrac: 0.0248,
  returnLaneFrac: 0.57,
  leadInFrac: 0.2,
} as const

/** Format a coordinate for path data: 4 decimal places, trailing zeros trimmed. */
function fmt(n: number): string {
  return String(parseFloat(n.toFixed(4)))
}

export function serpentineLayout(stepCount: number, opts?: SerpentineOptions): SerpentineLayout {
  if (!Number.isInteger(stepCount) || stepCount < 1) {
    throw new RangeError(`stepCount must be a positive integer, received ${stepCount}`)
  }

  const width = opts?.width ?? MEASURED.width
  const height = opts?.height ?? MEASURED.height
  const pitchXFrac = opts?.pitchXFrac ?? MEASURED.pitchXFrac
  const pitchYFrac = opts?.pitchYFrac ?? MEASURED.pitchYFrac
  const discRFrac = opts?.discRFrac ?? MEASURED.discRFrac
  const trackWidthFrac = opts?.trackWidthFrac ?? MEASURED.trackWidthFrac
  const returnLaneFrac = opts?.returnLaneFrac ?? MEASURED.returnLaneFrac
  const leadInFrac = opts?.leadInFrac ?? MEASURED.leadInFrac

  const pitchX = pitchXFrac * width
  const pitchY = pitchYFrac * height
  const discR = discRFrac * height
  const trackWidth = trackWidthFrac * height
  // The return lane sits below the top row at this fraction of the row pitch,
  // leaving the remaining (1 − fraction) drop down to the bottom row — so the two
  // U-turn radii differ (measured: ≈138 px right vs ≈104.5 px left at source scale).
  const returnLaneOffset = returnLaneFrac * pitchY
  const leadIn = leadInFrac * pitchX

  // Two lanes: the top holds ceil(n/2) discs; the bottom holds one fewer when n is odd
  // (nodes[topCount] exists only when stepCount > 1).
  const topCount = Math.ceil(stepCount / 2)
  const cols = Math.max(opts?.cols ?? topCount, topCount, 2)

  // Center the grid: node rows centered vertically, columns centered horizontally.
  // (The 16:9 canvas gains vertical breathing room versus the 2.47:1 reference;
  // the serpentine shape itself is unchanged — art_0VvS7Nb1 §1.)
  const topY = (height - pitchY) / 2
  const bottomY = topY + pitchY
  const returnY = topY + returnLaneOffset
  const x0 = (width - (cols - 1) * pitchX) / 2

  const nodes: NodeLayout[] = []
  for (let i = 0; i < stepCount; i++) {
    const lane: 0 | 1 = i < topCount ? 0 : 1
    const col = lane === 0 ? i : i - topCount
    nodes.push({ cx: x0 + col * pitchX, cy: lane === 0 ? topY : bottomY, lane, index: i })
  }

  // U-turn anchors: the departing node of the top lane and the arrival node of the
  // bottom lane. (The reference prototype floats the U-turns ~80–130 px beyond the
  // outer columns — by-eye placement; anchoring them on the grid normalizes that.)
  const lastTop = nodes[topCount - 1]
  const firstBottom = nodes[topCount] // undefined when stepCount === 1
  const lastNode = nodes[stepCount - 1]

  // Each U-turn is a semicircle whose diameter is the vertical span it connects.
  const rTurnRight = returnLaneOffset / 2
  const rTurnLeft = (pitchY - returnLaneOffset) / 2

  const stubStartX = nodes[0].cx - leadIn
  const pieces: string[] = [`M ${fmt(stubStartX)} ${fmt(topY)}`, `H ${fmt(lastTop.cx)}`]
  let acc = lastTop.cx - stubStartX

  // Reveal boundaries: distance travelled when the track reaches each disc center.
  const nodeDistances: number[] = new Array(stepCount)
  for (let i = 0; i < topCount; i++) nodeDistances[i] = nodes[i].cx - stubStartX

  if (firstBottom) {
    // Right U-turn: sweep 1 → clockwise → bulges right, matching the measured
    // outer extreme on that side (x = 2062 at source scale, art_0VvS7Nb1 §4).
    pieces.push(`A ${fmt(rTurnRight)} ${fmt(rTurnRight)} 0 0 1 ${fmt(lastTop.cx)} ${fmt(returnY)}`)
    acc += Math.PI * rTurnRight
    // Return lane runs right → left between the rows, clearing the top-row discs
    // (the 0.57 offset keeps it well below the disc bottoms). Skipped when a
    // custom cols collapses both anchors onto one column.
    if (firstBottom.cx !== lastTop.cx) {
      pieces.push(`H ${fmt(firstBottom.cx)}`)
      acc += lastTop.cx - firstBottom.cx
    }
    // Left U-turn: sweep 0 → counter-clockwise → bulges left (measured extreme x = 95).
    pieces.push(`A ${fmt(rTurnLeft)} ${fmt(rTurnLeft)} 0 0 0 ${fmt(firstBottom.cx)} ${fmt(bottomY)}`)
    acc += Math.PI * rTurnLeft
    // Bottom lane travels left → right and stops at the last disc's center — the
    // endpoint hides beneath the disc, matching the reference's second-row endpoint
    // (no tail after the last node).
    for (let i = topCount; i < stepCount; i++) {
      nodeDistances[i] = acc + (nodes[i].cx - firstBottom.cx)
    }
    if (lastNode.cx !== firstBottom.cx) {
      pieces.push(`H ${fmt(lastNode.cx)}`)
      acc += lastNode.cx - firstBottom.cx
    }
  }

  return {
    nodes,
    track: { d: pieces.join(' '), totalLength: acc, nodeDistances },
    viewBox: { width, height },
    discR,
    trackWidth,
  }
}
