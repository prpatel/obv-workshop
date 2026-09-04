/**
 * SegmentTimeline data contract + pure layout math (wave-2 family; fidelity
 * rework per art_iHm120ov §SegmentTimeline, measured against the source's
 * 211–222s timeline at ref frame t=220.5, read at 1920×1080).
 *
 * Structure (the wave-2 rework — the family's identity): a thin dim track at
 * the node axis carries bright segment fills running between the nodes, one
 * glowing disc per segment sitting just inside its fill's right end, a 2px
 * node-colored tick dropping from each node to a two-row white label block,
 * and a bright white lead segment capping the track's right end. The prior
 * 68px-tall two-tone bar, the authored tick list, and the right-side chip are
 * gone — nodes are derived from the fills they cap, so ticks and labels can
 * never drift off their nodes.
 *
 * Measured from ref frame t=220.5 (1920×1080): track y490–502 (12px) spanning
 * x306–1653; fills blue x313–540, cyan x560–960, red x980–~1460 settled —
 * each fill starts at the previous node's disc edge and ends 30px past its
 * own node's center; nodes ~100px diameter at (510, 930, 1430) on the track
 * axis with glow halos reaching a 149–182px footprint; 2px ticks from the
 * track bottom to y659; label rows (26px + 16px glyphs) centered under the
 * nodes, baselines y729/y779; white lead x1509–1641 inset 12px from the
 * track's right end. Palette: blue #3699fa / cyan #1ed0e8 / red #f75720, dim
 * track #001010, white lead #f5f4f7, labels #f0f0f0.
 *
 * Choreography (native v-clicks): click i pops node i (~140ms scale pop),
 * fades its tick + labels in after a beat (~250ms, 120ms delayed), and sweeps
 * fill i left→right over ~2.4s — so each fill completes just before the next
 * click pops the next node (sweep-then-pop; measured 10–90% over 2550ms,
 * node pops 100–150ms, node-to-node beat ~2.5s).
 *
 * Pure and SSR-safe: no DOM access, no mutation of the inputs.
 */

/** Tone roles for the measured blue/cyan/red trio (`accentTertiary` falls back to `accent` when a custom palette omits it). */
export type TimelineTone = 'accent' | 'tertiary' | 'alt'

/** One track segment, capped by its glowing node. */
export interface TimelineSegment {
  /** Stable key — test selectors and per-segment reveal identity. */
  id: string
  /** Palette role: `accent` (blue), `tertiary` (cyan), or `alt` (red). */
  tone: TimelineTone
  /** Big white label row centered under the node (reveals with the node). */
  label?: string
  /** Smaller white sub-label row beneath `label`. */
  sublabel?: string
  /**
   * Proportional share of the fillable span, in canvas-width-fraction units
   * (the measured composition is 0.118229 blue + 0.208333 cyan + 0.25 red).
   * Shares are normalized across segments; omitted = one equal share.
   */
  wFrac?: number
}

/** The full SegmentTimeline composition: segments over a measured track. */
export interface SegmentTimelineData {
  /** Contiguous segments, left → right. At least one. */
  segments: TimelineSegment[]
  /** Track top y as a fraction of the canvas height. */
  yFrac: number
  /** Track height as a fraction of the canvas height. */
  hFrac: number
  /** Track left x as a fraction of the canvas width. */
  x0Frac: number
  /** Track right x as a fraction of the canvas width. */
  x1Frac: number
}

export interface Canvas {
  width: number
  height: number
}

/** Measured node radius: ~50px at source height 1080 (fraction of canvas height). */
export const NODE_R_FRAC = 50 / 1080
/** Fill overshoot past its own node's center: 30px at source width 1920. */
export const FILL_PAST_FRAC = 30 / 1920
/** Gap between consecutive fills: 20px at source width 1920 (x540→560, x960→980). */
export const FILL_GAP_FRAC = 20 / 1920
/** Measured white lead width: 134px at source width 1920 (x1509–1641). */
export const LEAD_W_FRAC = 134 / 1920
/** Lead inset from the track's right end: 12px at source width 1920. */
export const LEAD_INSET_FRAC = 12 / 1920
/** Measured tick run: track bottom (y502) down to y659 = 157px at source height 1080. */
export const TICK_LEN_FRAC = 157 / 1080
/** Measured label baseline: big row glyphs y703–729. */
export const LABEL_BASELINE_FRAC = 729 / 1080
/** Measured sub-label baseline: small row glyphs y763–779. */
export const SUBLABEL_BASELINE_FRAC = 779 / 1080

/** Measured palette (ref t=220.5 node/fill/track samples) — resolved through `resolvePalette`, never hardcoded in the component body. */
export const NODE_BLUE = '#3699fa'
export const NODE_CYAN = '#1ed0e8'
export const NODE_RED = '#f75720'
export const TRACK_DIM = '#001010'
export const LEAD_WHITE = '#f5f4f7'
export const LABEL_WHITE = '#f0f0f0'

/** Glow halo reach beyond the disc: footprint 149–182px vs the ~100px discs → ~35px spread. */
export const GLOW_SPREAD = 35

/** Typography in viewBox (1920×1080) units — measured glyph heights (26px + 16px rows → ~36px/~22px fonts). */
export const LABEL_SIZE = 36
export const SUBLABEL_SIZE = 22
export const TICK_STROKE = 2 // measured 2px tick lines

/** Resolved px geometry for the dim track, ready to render. */
export interface TrackLayout {
  x: number
  y: number
  width: number
  height: number
}

/** Resolved px geometry for the bright white lead segment capping the track. */
export interface LeadLayout {
  x: number
  y: number
  width: number
  height: number
}

/** Resolved px geometry for one segment (fill + node + tick + labels), ready to render. */
export interface SegmentLayout {
  id: string
  tone: TimelineTone
  label?: string
  sublabel?: string
  /** Fill left edge px. Fill i starts at fill i−1's right edge + the measured gap. */
  x: number
  /** Sweep width px — the revealed-state `--seg-w` (hidden state is width 0). */
  width: number
  /** Node disc center/radius px. Sits `FILL_PAST` left of the fill's right end, on the track axis. */
  nodeCx: number
  nodeCy: number
  nodeR: number
  /** Outer glow radius px (disc + halo reach). */
  glowR: number
  /** Tick line x (the node's center) and span, hanging from the track bottom. */
  tickX: number
  tickY0: number
  tickLen: number
  /** Label block centered under the node. */
  labelCx: number
  labelBaseline: number
  sublabelBaseline: number
}

export interface SegmentTimelineLayout {
  track: TrackLayout
  lead: LeadLayout
  segments: SegmentLayout[]
  viewBox: Canvas
}

function requireFraction(value: number, name: string, { positive = false } = {}): void {
  const inRange = positive ? value > 0 && value <= 1 : value >= 0 && value <= 1
  if (!inRange) {
    throw new RangeError(`${name} (${value}) is outside the ${positive ? '(0, 1]' : '[0, 1]'} canvas-fraction range`)
  }
}

/**
 * Resolve the full render layout for a SegmentTimeline.
 *
 * - The track is the measured span x0Frac → x1Frac at yFrac, hFrac. The white
 *   lead caps its right end (measured width, measured inset).
 * - Fills divide the span left of the lead (minus one measured gap before it)
 *   by normalized shares, with a measured gap between consecutive fills.
 * - Node i sits on the track axis, `FILL_PAST` left of fill i's right end, so
 *   the fill sweeps through its node and just past it. Ticks and label blocks
 *   derive from the node centers — they can never drift.
 * - Violations (empty segments, unknown tone, non-positive wFrac, out-of-range
 *   fractions) throw RangeError, never render blank.
 * - Click choreography (native v-clicks): click i pops node i, fades its tick
 *   + labels in after a beat, and sweeps fill i — one click per segment.
 */
export function segmentTimelineLayout(data: SegmentTimelineData, viewBox: Canvas = { width: 1920, height: 1080 }): SegmentTimelineLayout {
  if (data.segments.length === 0) {
    throw new RangeError('SegmentTimeline needs at least one segment')
  }
  for (const segment of data.segments) {
    if (segment.tone !== 'accent' && segment.tone !== 'tertiary' && segment.tone !== 'alt') {
      throw new RangeError(`segment "${segment.id}" has unknown tone "${String(segment.tone)}"`)
    }
    if (segment.wFrac !== undefined && !(segment.wFrac > 0 && Number.isFinite(segment.wFrac))) {
      throw new RangeError(`segment "${segment.id}" wFrac (${segment.wFrac}) must be a positive finite share`)
    }
  }
  requireFraction(data.x0Frac, 'x0Frac')
  requireFraction(data.x1Frac, 'x1Frac')
  requireFraction(data.yFrac, 'yFrac')
  requireFraction(data.hFrac, 'hFrac', { positive: true })
  if (data.x0Frac >= data.x1Frac) {
    throw new RangeError(`x0Frac (${data.x0Frac}) must be left of x1Frac (${data.x1Frac})`)
  }
  if (data.yFrac + data.hFrac > 1) {
    throw new RangeError(`yFrac + hFrac (${data.yFrac} + ${data.hFrac}) runs past the canvas bottom`)
  }

  const track: TrackLayout = {
    x: data.x0Frac * viewBox.width,
    y: data.yFrac * viewBox.height,
    width: (data.x1Frac - data.x0Frac) * viewBox.width,
    height: data.hFrac * viewBox.height,
  }

  const lead: LeadLayout = {
    x: track.x + track.width - LEAD_INSET_FRAC * viewBox.width - LEAD_W_FRAC * viewBox.width,
    y: track.y,
    width: LEAD_W_FRAC * viewBox.width,
    height: track.height,
  }

  // Fill spans: the track left of the lead (minus one gap before it) minus the
  // inter-fill gaps, divided by normalized shares. Omitted wFrac = one equal
  // share, so `{a: 2}, {b}` splits 2:1.
  const fillGap = FILL_GAP_FRAC * viewBox.width
  const fillableRight = lead.x - fillGap
  const available = fillableRight - track.x - fillGap * (data.segments.length - 1)
  if (available <= 0) {
    throw new RangeError(`track span leaves no room for ${data.segments.length} fills beside the lead`)
  }
  const shares = data.segments.map((segment) => segment.wFrac ?? 1)
  const shareSum = shares.reduce((total, share) => total + share, 0)

  const nodeR = NODE_R_FRAC * viewBox.height
  const nodeCy = track.y + track.height / 2
  const fillPast = FILL_PAST_FRAC * viewBox.width
  const glowR = nodeR + GLOW_SPREAD * (viewBox.height / 1080)

  let cursor = track.x
  const segments: SegmentLayout[] = data.segments.map((segment, i) => {
    const width = (shares[i] / shareSum) * available
    const fillRight = cursor + width
    const nodeCx = fillRight - fillPast
    const layout: SegmentLayout = {
      id: segment.id,
      tone: segment.tone,
      label: segment.label,
      sublabel: segment.sublabel,
      x: cursor,
      width,
      nodeCx,
      nodeCy,
      nodeR,
      glowR,
      tickX: nodeCx,
      tickY0: track.y + track.height,
      tickLen: TICK_LEN_FRAC * viewBox.height,
      labelCx: nodeCx,
      labelBaseline: LABEL_BASELINE_FRAC * viewBox.height,
      sublabelBaseline: SUBLABEL_BASELINE_FRAC * viewBox.height,
    }
    cursor = fillRight + fillGap
    return layout
  })

  return { track, lead, segments, viewBox }
}
