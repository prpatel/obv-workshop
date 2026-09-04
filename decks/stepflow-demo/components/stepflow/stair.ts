/**
 * Pure staircase layout math for the StairChain diagram family (family spec
 * art_3VsrSvLm; measured blueprint art_0AzKGXnD §2/F1).
 *
 * Every length derives from canvas-relative fractions (the measured ratios of
 * the 2038×1144 v1 recording), never absolute pixels, so the same numbers serve
 * the 1920×1080 deck and any future embed. Blocks ascend left → right with a
 * uniform per-step lift by default; a per-block `lift` override exists because
 * the recording's silhouette is not strictly uniform — its RETRY block dips
 * 43px below its neighbor and the climb resumes from there. Re-measured at
 * full resolution on the settled frames (f008–f010, pixel-identical connected
 * components), so the dip is design, not noise.
 *
 * All functions here are pure and deterministic: same inputs produce
 * byte-identical output, and nothing touches the DOM (SSR-safe build).
 */

/** One step of the staircase (data contract, art_0AzKGXnD §2/F1). */
export interface StairStep {
  /** Stable key — used for a11y labels and test selectors. */
  id: string
  /** Uppercase white label rendered inside the block. */
  title: string
  /** One accent-colored caption line below the block. */
  caption: string
  /**
   * Block tone role: `'accent'` (the blue block fill) or `'tertiary'`
   * (the cyan fill, `accentTertiary ?? accent`). The v1 recording is two-tone
   * — blocks 1–3 blue #3599fb, blocks 4–6 cyan #1fd0ea (frame t=7.9, wave-1
   * report art_v4jVdTnp §1) — so the demo seeds the split through the slide's
   * palette override. Default: `'accent'`.
   */
  tone?: 'accent' | 'tertiary'
  /**
   * Optional per-block lift override: this block's total rise above the base
   * block, as a fraction of canvas height. Default: `index × liftFrac`
   * (uniform ascent). Overriding one block never cascades into its neighbors.
   */
  lift?: number
}

/** The amber callout that floats above-left and reveals before block 1. */
export interface StairCallout {
  text: string
  /** Text anchor as canvas fractions (`yFrac` is the baseline). */
  xFrac: number
  yFrac: number
}

/** Layout knobs. Every field is optional; omitted fields fall back to the measured defaults. */
export interface StairOptions {
  /** ViewBox width in user units. Default 1920. */
  width?: number
  /** ViewBox height in user units. Default 1080. */
  height?: number
  /** Block width as a fraction of width (measured 158/2038 ≈ 0.078). */
  blockWFrac?: number
  /** Block height as a fraction of height (measured 156/1144 ≈ 0.137). */
  blockHFrac?: number
  /** Horizontal pitch as a fraction of width (measured 337/2038 ≈ 0.165). */
  pitchXFrac?: number
  /** Uniform per-step lift as a fraction of height (measured mean step 78/1144 ≈ 0.068). */
  liftFrac?: number
  /** First block's left margin as a fraction of width (measured 67/2038 ≈ 0.033). */
  leftFrac?: number
  /** Base block's bottom edge as a fraction of height (measured 958/1144 ≈ 0.837). */
  baseBottomFrac?: number
  /**
   * Per-block rise above the base block, as fractions of height; `lifts[i]`
   * overrides block i's default (`i × liftFrac`). Entries may be undefined
   * (sparse). The component maps `StairStep.lift` into this array.
   */
  lifts?: (number | undefined)[]
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
}

export interface StairLayout {
  blocks: StairBlock[]
  viewBox: { width: number; height: number }
}

/** Measured defaults (art_0AzKGXnD §2/F1), expressed as fractions. */
const MEASURED = {
  width: 1920,
  height: 1080,
  blockWFrac: 0.078,
  blockHFrac: 0.137,
  pitchXFrac: 0.165,
  liftFrac: 0.068,
  leftFrac: 0.033,
  baseBottomFrac: 0.837,
} as const

export function stairLayout(count: number, opts?: StairOptions): StairLayout {
  if (!Number.isInteger(count) || count < 1) {
    throw new RangeError(`count must be a positive integer, received ${count}`)
  }

  const width = opts?.width ?? MEASURED.width
  const height = opts?.height ?? MEASURED.height
  const blockWFrac = opts?.blockWFrac ?? MEASURED.blockWFrac
  const blockHFrac = opts?.blockHFrac ?? MEASURED.blockHFrac
  const pitchXFrac = opts?.pitchXFrac ?? MEASURED.pitchXFrac
  const liftFrac = opts?.liftFrac ?? MEASURED.liftFrac
  const leftFrac = opts?.leftFrac ?? MEASURED.leftFrac
  const baseBottomFrac = opts?.baseBottomFrac ?? MEASURED.baseBottomFrac

  const w = blockWFrac * width
  const h = blockHFrac * height
  const pitchX = pitchXFrac * width
  const left = leftFrac * width
  const baseBottom = baseBottomFrac * height

  const blocks: StairBlock[] = []
  for (let i = 0; i < count; i++) {
    const lift = (opts?.lifts?.[i] ?? i * liftFrac) * height
    blocks.push({ x: left + i * pitchX, y: baseBottom - lift - h, w, h, index: i })
  }

  return { blocks, viewBox: { width, height } }
}
