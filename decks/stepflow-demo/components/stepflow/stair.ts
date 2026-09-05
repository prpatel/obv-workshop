/**
 * Pure staircase layout for the StairChain diagram family — exact-trace
 * edition (sheet art_4A7yguGJ, StairChain section).
 *
 * Every constant was re-measured at native resolution on the settled
 * reference frame (frames/StairChain.png, 2038×1144 → mapped 1920×1080) with
 * connected-component traces; the numbers cite the trace, not estimates:
 *
 * - The rhythm is non-uniform BY DESIGN. Left-edge → left-edge gaps
 *   332/324/317/315/268 px and top-edge deltas −65/+41/−122/−74/−73 px, so
 *   block lefts land at 63/395/719/1036/1351/1619 and tops at
 *   758/693/734/612/538/465. Block 3 dips 41px below block 2 — the
 *   recording's motion trace plays that dip as down-then-up.
 * - Blocks are CIRCLES of ⌀ ≈ 146px (native ⌀ 155–157), not rounded
 *   squares: the <40-luma corner arcs of the settled frame pin the corner
 *   radius at ~half the bbox side. Render as a rect with rx = ry = w/2.
 * - Step numbers are punched out of the fills in near-black, not light
 *   labels: per-block cap heights 40/62/53/62/62/56 px, ink widths
 *   69/53/66/50/57/56 px, band center at 0.49 of the block size (the sheet's
 *   "≈55%, center-upper" summary over-estimates; the measured bands win).
 * - A soft slate wedge (#353743 class) sits right of blocks 1–5 — blue AND
 *   cyan alike; block 6 has none (the band would overflow the canvas edge).
 *   The sheet's "blue #14345c below-left" resolves to the two-tone caption
 *   text row in the same zone, not a separate glow layer.
 *
 * All functions here are pure and deterministic: same inputs produce
 * byte-identical output, and nothing touches the DOM (SSR-safe build).
 */

/** One step of the staircase (data contract). */
export interface StairStep {
  /** Stable key — used for a11y labels and test selectors. */
  id: string
  /** Punched step number, e.g. '01' — knocked out of the fill in near-black. */
  title: string
  /** Accent caption below the block. */
  caption: string
  /**
   * Block tone role: `'accent'` (the blue block fill) or `'tertiary'`
   * (the cyan fill, `accentTertiary ?? accent`). The reference is two-tone —
   * blocks 1–3 blue #3599fb, blocks 4–6 cyan #1fd0ea (sheet §1). Default:
   * `'accent'`.
   */
  tone?: 'accent' | 'tertiary'
}

/** The amber callout that reveals before block 1. */
export interface StairCallout {
  text: string
  /** Text anchor as canvas fractions (`yFrac` is the baseline). */
  xFrac: number
  yFrac: number
  /**
   * Optional forced ink width as a fraction of canvas width — the measured
   * '3×' callout runs 85px wide at cap 45 (wider than the mono's natural
   * advance), so the seed pins it.
   */
  textLengthFrac?: number
}

/** Layout knobs. Every field is optional; omitted fields fall back to the measured defaults. */
export interface StairOptions {
  /** ViewBox width in user units. Default 1920. */
  width?: number
  /** ViewBox height in user units. Default 1080. */
  height?: number
  /** Circle diameter as a fraction of height (measured 146/1080 — isotropic, so w = h). */
  blockFrac?: number
  /** Left-edge → left-edge gaps as fractions of width (measured 332/324/317/315/268 of 1920). */
  gapsXFrac?: number[]
  /** Top-edge deltas as fractions of height (measured −65/+41/−122/−74/−73 of 1080). */
  topDeltasYFrac?: number[]
  /** First block's left edge as a fraction of width (measured 63/1920). */
  leftFrac?: number
  /** First block's top edge as a fraction of height (measured 758/1080). */
  topFrac?: number
}

export interface StairBlock {
  /** Left edge (viewBox units). */
  x: number
  /** Top edge (viewBox units) — SVG rect convention. */
  y: number
  w: number
  h: number
  /** Step index along the staircase (0-based). */
  index: number
  /** Punched-number cap height (viewBox units) for this block. */
  punchCap: number
  /** Punched-number ink width (viewBox units) — the mono face is condensed in the reference. */
  punchWidth: number
  /** Baseline for the punched number (viewBox units). */
  punchBaseline: number
  /** Slate wedge band right of this block (viewBox units), or undefined where the frame shows none. */
  wedge?: { x: number; y: number; w: number; h: number }
}

export interface StairLayout {
  blocks: StairBlock[]
  viewBox: { width: number; height: number }
}

/** One revealed dip: block `index` sits `dipPx` lower than its left neighbor. */
export interface StairDip {
  index: number
  dipPx: number
}

/** Measured constants — mapped px on the 1920×1080 canvas (see module docblock). */
const MEASURED = {
  width: 1920,
  height: 1080,
  blockPx: 146,
  gapsX: [332, 324, 317, 315, 268],
  topDeltasY: [-65, 41, -122, -74, -73],
  left: 63,
  top: 758,
  punchCaps: [40, 62, 53, 62, 62, 56],
  punchWidths: [69, 53, 66, 50, 57, 56],
  punchCenterYFrac: 0.49,
  // Wedge x-extent past the right edge, as fractions of the block size.
  wedgeXFrac: [0.05, 1.02],
  // Wedge y-bands per block (fraction of the block size from the block top);
  // blocks beyond the array carry no wedge.
  wedgeYFrac: [
    [0.1, 0.49],
    [0.47, 0.76],
    [-0.06, 0.44],
    [0.04, 0.48],
    [-0.06, 0.49],
  ],
} as const

export function stairLayout(count: number, opts?: StairOptions): StairLayout {
  if (!Number.isInteger(count) || count < 1) {
    throw new RangeError(`count must be a positive integer, received ${count}`)
  }

  const width = opts?.width ?? MEASURED.width
  const height = opts?.height ?? MEASURED.height
  const blockPx = (opts?.blockFrac ?? MEASURED.blockPx / MEASURED.height) * height
  const left = (opts?.leftFrac ?? MEASURED.left / MEASURED.width) * width
  const top = (opts?.topFrac ?? MEASURED.top / MEASURED.height) * height
  // Default gaps/deltas in canvas fractions; count > 6 repeats the last step.
  const gapsXFrac = opts?.gapsXFrac ?? MEASURED.gapsX.map((g) => g / MEASURED.width)
  const topDeltasYFrac = opts?.topDeltasYFrac ?? MEASURED.topDeltasY.map((d) => d / MEASURED.height)

  if (gapsXFrac.length < count - 1 || topDeltasYFrac.length < count - 1) {
    throw new RangeError(`rhythm arrays must cover ${count - 1} steps`)
  }

  const blocks: StairBlock[] = []
  let x = left
  let y = top
  for (let i = 0; i < count; i++) {
    const capIdx = Math.min(i, MEASURED.punchCaps.length - 1)
    const punchCap = (MEASURED.punchCaps[capIdx] / MEASURED.height) * height
    const punchWidth = (MEASURED.punchWidths[capIdx] / MEASURED.width) * width
    const wedgeIdx = Math.min(i, MEASURED.wedgeYFrac.length - 1)
    const band = i < MEASURED.wedgeYFrac.length ? MEASURED.wedgeYFrac[wedgeIdx] : undefined
    blocks.push({
      x,
      y,
      w: blockPx,
      h: blockPx,
      index: i,
      punchCap,
      punchWidth,
      punchBaseline: y + MEASURED.punchCenterYFrac * blockPx + punchCap / 2,
      wedge: band
        ? {
            x: x + blockPx * (1 + MEASURED.wedgeXFrac[0]),
            y: y + blockPx * band[0],
            w: blockPx * (MEASURED.wedgeXFrac[1] - MEASURED.wedgeXFrac[0]),
            h: blockPx * (band[1] - band[0]),
          }
        : undefined,
    })
    if (i < count - 1) {
      x += gapsXFrac[i] * width
      y += topDeltasYFrac[i] * height
    }
  }

  return { blocks, viewBox: { width, height } }
}

/** Blocks whose top sits lower than their left neighbor — the dip sites. */
export function stairDips(blocks: StairBlock[]): StairDip[] {
  const dips: StairDip[] = []
  for (let i = 1; i < blocks.length; i++) {
    const dipPx = blocks[i].y - blocks[i - 1].y
    if (dipPx > 0) dips.push({ index: i, dipPx })
  }
  return dips
}

/** One glow-trace segment: the diagonal from block i−1's top-center to block i's. */
export interface StairGlowTrace {
  /** Block index whose click reveals this segment (always ≥ 1 — block 0 has no predecessor). */
  index: number
  d: string
  len: number
}

/**
 * Quiet glow-trace segments (user-directed divergence, art_cRMBx282): a soft
 * hue-matched stroke tracing the staircase ascent. The recording has no
 * connector; the trace stays deliberately quiet (≤4px, ≤0.4 opacity) and each
 * segment draws inside its arriving block's existing click window — no extra
 * beats. Segment i runs between the top-centers of blocks i−1 and i.
 */
export function glowTraceSegments(blocks: StairBlock[]): StairGlowTrace[] {
  const segs: StairGlowTrace[] = []
  for (let i = 1; i < blocks.length; i++) {
    const x1 = blocks[i - 1].x + blocks[i - 1].w / 2
    const y1 = blocks[i - 1].y
    const x2 = blocks[i].x + blocks[i].w / 2
    const y2 = blocks[i].y
    const len = Math.hypot(x2 - x1, y2 - y1)
    segs.push({ index: i, d: `M ${x1} ${y1} L ${x2} ${y2}`, len })
  }
  return segs
}

