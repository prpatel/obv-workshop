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
  /**
   * Optional 1-based Slidev click override for this step's reveal. When
   * omitted, the component's positional walk applies (callout = click 1,
   * block k = click k + 1). Expresses the recording's non-positional build
   * orders — e.g. seg01's interleaved blue/cyan mapping — without reordering
   * the steps array: geometry stays positional, only the click remaps.
   */
  click?: number
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

/** One late annotation element (seg01's post-build waves): a tiny teal mark or a small white text run. */
export interface StairAnnotation {
  /** Stable key — test selectors. */
  id: string
  /** Left edge as a fraction of canvas width. */
  xFrac: number
  /**
   * Vertical anchor as a fraction of canvas height: the mark box's TOP edge
   * (rect convention) in mark mode, or the text BASELINE in text mode (the
   * callout's convention).
   */
  yFrac: number
  /** Mark mode: box width as a fraction of canvas width. Omit for text mode. */
  wFrac?: number
  /** Mark mode: box height as a fraction of canvas height. Omit for text mode. */
  hFrac?: number
  /** Text mode: the run's content, rendered small and white at (xFrac, yFrac). */
  text?: string
  /** Text mode: font size as a fraction of canvas height. Defaults to the caption size. */
  sizeFrac?: number
  /** 1-based click that reveals this element (the recording's late waves, t2.07+). */
  click: number
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
  /**
   * Explicit per-block left edges as fractions of width. When provided, the
   * leftFrac + gapsXFrac walk is bypassed for the x axis — block i sits at
   * leftsFrac[i] * width. seg01's re-measured rhythm (report.json connected
   * components) is not a gap walk; see SEG01_PLACEMENT. Must cover `count`
   * entries; every entry must be a fraction in [0, 1].
   */
  leftsFrac?: number[]
  /**
   * Explicit per-block top edges as fractions of height. When provided, the
   * topFrac + topDeltasYFrac walk is bypassed for the y axis. Must cover
   * `count` entries; every entry must be a fraction in [0, 1].
   */
  topsFrac?: number[]
}

/** The placement subset of {@link StairOptions} the component accepts as one prop. */
export type StairPlacement = Pick<StairOptions, 'blockFrac' | 'leftsFrac' | 'topsFrac'>

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

/**
 * seg01's re-measured block placement (split-ascent; 2560×1440 source —
 * user8-analysis report.json, settled-frame connected components, the
 * analyzer's hue-explicit blue-class list; the cyan-class list agrees within
 * 0.2% anti-aliasing tolerance). Six circles of ≈0.061w (⌀ ≈ 156 native px →
 * blockFrac 156.2/1440 ≈ 0.1085); lefts 0.1391 / 0.2797 / 0.4172 (blue run)
 * and 0.5516 / 0.6855 / 0.7992 (cyan run); tops descend 0.625 → 0.4056 with
 * block 3's dip (top 0.6062 vs block 2's 0.5757 — +32.94px on the 1080
 * canvas). Explicit fractions, not a gap walk: the re-measured pitch is not
 * expressible as the gen-7 left→right rhythm.
 */
export const SEG01_PLACEMENT: StairPlacement = {
  blockFrac: 0.1085,
  leftsFrac: [0.1391, 0.2797, 0.4172, 0.5516, 0.6855, 0.7992],
  topsFrac: [0.625, 0.5757, 0.6062, 0.5153, 0.4611, 0.4056],
}

/**
 * Fractions must cover `count` entries and sit in [0, 1] — bad placement data
 * is a RangeError at the call site, never a silent off-canvas layout.
 */
function validateFractions(name: string, fracs: number[], count: number): void {
  if (fracs.length < count) {
    throw new RangeError(`${name} must cover ${count} blocks, received ${fracs.length}`)
  }
  fracs.forEach((f, i) => {
    if (!Number.isFinite(f) || f < 0 || f > 1) {
      throw new RangeError(`${name}[${i}] must be a fraction in [0, 1], received ${f}`)
    }
  })
}

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

  // Explicit placement (per-block fractions) bypasses the walk per axis —
  // the walk inputs are dead there, so they also skip coverage validation.
  const leftsFrac = opts?.leftsFrac
  const topsFrac = opts?.topsFrac

  if (leftsFrac) validateFractions('leftsFrac', leftsFrac, count)
  if (topsFrac) validateFractions('topsFrac', topsFrac, count)
  if (!leftsFrac && gapsXFrac.length < count - 1) {
    throw new RangeError(`gapsXFrac must cover ${count - 1} steps`)
  }
  if (!topsFrac && topDeltasYFrac.length < count - 1) {
    throw new RangeError(`topDeltasYFrac must cover ${count - 1} steps`)
  }

  const blocks: StairBlock[] = []
  let x = left
  let y = top
  for (let i = 0; i < count; i++) {
    if (leftsFrac) x = leftsFrac[i] * width
    if (topsFrac) y = topsFrac[i] * height
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
      if (!leftsFrac) x += gapsXFrac[i] * width
      if (!topsFrac) y += topDeltasYFrac[i] * height
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

