/**
 * SegmentTimeline data contract + pure layout math + beat schedule (exact-trace
 * rework per art_lYM2KXza §SegmentTimeline, measured against the source's
 * settled frame at 1920×1080 and frame-stepped at 60fps).
 *
 * Structure: a thin dim track (x315–1460, y494–499) carries three contiguous
 * bright fills that tile it exactly node-right-edge → node-right-edge (blue
 * x315–563, cyan x563–1012, red x1012–1460); one solid hue disc (d≈103) per
 * segment sits centered on the track axis with a dark two-digit number inside
 * (01/02/03 — the settled frame shows crisp disc edges, no persistent glow
 * halo); a 4px hue-matched tick drops from just below each disc (y550–692,
 * 142px) to a two-row label block — bold white row 1 centered ≈27px right of
 * the node center, dim row 2 centered on the node (nodes 1–2 only); a white
 * arrow (6px shaft on the track axis x1510–1641, open chevron head 25px deep,
 * 33px tall) caps the composition past the track's right end; a legend column
 * centered on node 3's axis (three hue words, a 5px hue bar under each, and a
 * dim note) fades in last.
 *
 * Measured from the settled ref frame (1920×1080): track y494–499 (6px,
 * x315–1460); nodes r51.5 at x511/960/1408, cy≈496.5; ticks 4×142 at
 * y550–692; row-1 glyph band y709–729 (cap 21 → 28px mono), row-2 band
 * y763–779 (cap 13 → 18px mono); arrow x1510–1641 y479–513; legend words
 * y762–779 (24px mono), bars y794–798, note band y819–832. Palette: blue
 * #3699fa / cyan #1ed0e8 / red #f75720, dim track #001010, arrow white
 * #f5f4f7, row-1 labels #fefefe, row-2 + note #b1b1bb, node digits #050505.
 *
 * Choreography (native v-clicks + AutoAdvance): the slide pins the measured
 * pops via AutoAdvance's stepScheduleSec — clicks at 2300/4730/6880ms, 0ms
 * drift from the recording (whose beats are non-uniform ≈2.2–2.4s apart;
 * beatSchedule(3, 6900) below documents why uniform spacing would drift).
 * Per click: the node pops (~100ms scale/fade), its fill sweeps its span
 * (~150ms ease-out, hard hold — no continuous drift), the tick + row-1 label
 * cascade in ~400ms after the pop, the row-2 dim label ~1300ms after the pop
 * (≈900ms after the cascade), and the legend fades in last — 1500ms after the
 * final click over 1.6s (measured 8400→10000, settled ≈10.1s).
 *
 * Pure and SSR-safe: no DOM access, no mutation of the inputs.
 */

/** Tone roles for the measured blue/cyan/red trio (`accentTertiary` falls back to `accent` when a custom palette omits it). */
export type TimelineTone = 'accent' | 'tertiary' | 'alt'

/** One track segment: a contiguous fill, its node disc, tick, and labels. */
export interface TimelineSegment {
  /** Stable key — test selectors and per-segment reveal identity. */
  id: string
  /** Palette role: `accent` (blue), `tertiary` (cyan), or `alt` (red). */
  tone: TimelineTone
  /** Node center x as a canvas-width fraction (measured: 511, 960, 1408 over 1920). */
  nodeFrac: number
  /** Bold white row-1 label, revealed ~400ms after the node pops. */
  label?: string
  /** Dim row-2 label ~1300ms after the pop; the measured composition has these on nodes 1–2 only. */
  sublabel?: string
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

/** Measured node radius: discs span d≈103 at source height 1080. */
export const NODE_R_FRAC = 51.5 / 1080
/** Measured tick run below each disc: y550–692 = 142px at source height 1080. */
export const TICK_LEN_FRAC = 142 / 1080
/** Tick starts 2px below the disc's bottom edge (measured disc bottom y548, tick top y550). */
export const TICK_GAP = 2
/** Measured tick stroke: 3–4px column at the node center. */
export const TICK_STROKE = 4
/** Row-1 label block center sits 27px right of the node center (measured block centers 538.5/987/1435.5 vs nodes 511/960/1408). */
export const LABEL_CX_OFFSET_FRAC = 27 / 1920
/** Measured label baseline: row-1 glyphs y709–729. */
export const LABEL_BASELINE_FRAC = 729 / 1080
/** Measured row-2 baseline: dim glyphs y763–779. */
export const SUBLABEL_BASELINE_FRAC = 779 / 1080

/** Measured palette (settled ref frame) — resolved through `resolvePalette`, never hardcoded in the component body. */
export const NODE_BLUE = '#3699fa'
export const NODE_CYAN = '#1ed0e8'
export const NODE_RED = '#f75720'
export const TRACK_DIM = '#001010'
export const ARROW_WHITE = '#f5f4f7'
export const LABEL_WHITE = '#fefefe'
export const SUB_GRAY = '#b1b1bb'
export const DIGIT_INK = '#050505'
/** The legend's third word reads mint-green in the ref (blue/cyan match the segment trio). */
export const LEGEND_MINT = '#18d69a'

/** Typography in viewBox (1920×1080) units — measured glyph bands (21px and 13px caps → 28px/18px mono; digit caps 25px → 35px mono). */
export const LABEL_SIZE = 28
export const SUBLABEL_SIZE = 18
export const NODE_DIGIT_SIZE = 35
export const LEGEND_SIZE = 24
export const NOTE_SIZE = 18
/** Word gap between legend items (measured 26px between the three word runs). */
export const LEGEND_GAP = 26
/** Measured legend bar band: y794–798 (5px), one bar per word, word-width. */
export const LEGEND_BAR_Y_FRAC = 794 / 1080
export const LEGEND_BAR_H = 5

/** Measured white arrow past the track's right end: 6px shaft on the track axis (x1510–1641), open chevron head 25px deep × 33px tall (y479–513). */
export const ARROW_X0_FRAC = 1510 / 1920
export const ARROW_X1_FRAC = 1641 / 1920
export const ARROW_STROKE = 6
export const ARROW_HEAD_DEPTH = 25
export const ARROW_HEAD_HALF = 16.5

/** Choreography — measured beats and the click-relative delays derived from them (see `beatSchedule`). */
/** Measured pop onsets (ms): the recording's pops are non-uniform, ≈2.2–2.4s apart. */
export const MEASURED_POP_MS: readonly number[] = [2300, 4730, 6880]
/** Pop duration: scale/fade ~100ms (discs read solid by pop+50–100). */
export const POP_DUR_MS = 100
/** Sweep starts as the pop ends and eases out over ~150ms, then hard-holds. */
export const SWEEP_DELAY_MS = 100
export const SWEEP_DUR_MS = 150
/** Tick + row-1 label cascade: measured tick 1 at 2700 after a 2300 pop → +400. */
export const CASCADE_DELAY_MS = 400
export const CASCADE_DUR_MS = 250
/** Row-2 dim label: ≈900ms after the cascade → +1300 after the pop. */
export const SUBLABEL_DELAY_MS = 1300
export const SUBLABEL_DUR_MS = 250
/** Legend fades last: measured ink onset ≈8450 with the final pop at ≈6900 → +1500, over 1.6s (8400–10000). */
export const LEGEND_DELAY_MS = 1500
export const LEGEND_DUR_MS = 1600
/** The composition reads settled just after the legend completes (≈10.1s). */
export const SETTLE_PAD_MS = 100

/** Click-derived beat schedule for one slide run. AutoAdvance spaces clicks uniformly. */
export interface BeatSchedule {
  /** Pop onset per click (ms from slide-enter). */
  pops: number[]
  /** Fill sweep window per click (starts as the pop ends, ~150ms ease-out). */
  sweeps: Array<{ start: number, end: number }>
  /** Tick + row-1 label onset per click. */
  cascades: number[]
  /** Row-2 label onset per click. */
  sublabels: number[]
  /** Legend fade window (starts after the final click). */
  legendStart: number
  legendEnd: number
  /** Settled timestamp. */
  settle: number
}

/**
 * Derive the click-aligned beat schedule. AutoAdvance fires click i at
 * `i × durationMs / clickCount`; every sub-beat is a fixed click-relative
 * delay, so one schedule describes the whole run.
 */
export function beatSchedule(clickCount: number, durationMs: number): BeatSchedule {
  if (clickCount < 1 || !Number.isFinite(durationMs) || durationMs <= 0) {
    throw new RangeError(`beatSchedule needs a positive click count and duration (got ${clickCount}, ${durationMs})`)
  }
  const spacing = durationMs / clickCount
  const pops = Array.from({ length: clickCount }, (_, i) => (i + 1) * spacing)
  return {
    pops,
    sweeps: pops.map((pop) => ({ start: pop + SWEEP_DELAY_MS, end: pop + SWEEP_DELAY_MS + SWEEP_DUR_MS })),
    cascades: pops.map((pop) => pop + CASCADE_DELAY_MS),
    sublabels: pops.map((pop) => pop + SUBLABEL_DELAY_MS),
    legendStart: pops[pops.length - 1]! + LEGEND_DELAY_MS,
    legendEnd: pops[pops.length - 1]! + LEGEND_DELAY_MS + LEGEND_DUR_MS,
    settle: pops[pops.length - 1]! + LEGEND_DELAY_MS + LEGEND_DUR_MS + SETTLE_PAD_MS,
  }
}

/** Resolved px geometry for the dim track, ready to render. */
export interface TrackLayout {
  x: number
  y: number
  width: number
  height: number
}

/** Resolved px geometry for the white arrow capping the composition. */
export interface ArrowLayout {
  /** Shaft run (y = shaftY, 6px stroke on the track axis). */
  x0: number
  x1: number
  shaftY: number
  /** Chevron head: apex at (x1, shaftY), back corners `headDepth` left and `headHalf` above/below. */
  headDepth: number
  headHalf: number
  stroke: number
}

/** One legend word with its hue bar, positioned by the mono advance model. */
export interface LegendWordLayout {
  text: string
  color: string
  /** Word left edge and estimated mono ink width (chars × 0.6em). */
  x: number
  width: number
  barY: number
  barH: number
}

/** Resolved px geometry for the legend column (centered on the last node's axis). */
export interface LegendLayout {
  cx: number
  wordsBaseline: number
  words: LegendWordLayout[]
  note: string
  noteCx: number
  noteBaseline: number
}

/** Resolved px geometry for one segment (fill + node + tick + labels + digit), ready to render. */
export interface SegmentLayout {
  id: string
  tone: TimelineTone
  label?: string
  sublabel?: string
  /** Fill left edge px. Fill i starts at fill i−1's right edge — the fills tile the track with no gaps. */
  x: number
  /** Fill right edge px — this node's right edge (nodeCx + nodeR). */
  fillRight: number
  /** Sweep width px — the revealed-state `--seg-w` (hidden state is width 0). */
  width: number
  /** Node disc center/radius px, centered on the track axis. */
  nodeCx: number
  nodeCy: number
  nodeR: number
  /** Tick line x (the node's center) and span, hanging from just below the disc. */
  tickX: number
  tickY0: number
  tickLen: number
  /** Label block: row 1 offset ≈27px right of the node, row 2 centered on it. */
  labelCx: number
  labelBaseline: number
  sublabelCx: number
  sublabelBaseline: number
  /** Dark two-digit step number inside the disc (01/02/03). */
  digit: string
  digitCx: number
  digitBaseline: number
}

export interface SegmentTimelineLayout {
  track: TrackLayout
  arrow: ArrowLayout
  segments: SegmentLayout[]
  legend: LegendLayout
  viewBox: Canvas
}

function requireFraction(value: number, name: string, { positive = false } = {}): void {
  const inRange = positive ? value > 0 && value <= 1 : value >= 0 && value <= 1
  if (!inRange) {
    throw new RangeError(`${name} (${value}) is outside the ${positive ? '(0, 1]' : '[0, 1]'} canvas-fraction range`)
  }
}

/** Mono advance model used to position legend words: 0.6em per character. */
function monoWidth(text: string, fontSize: number): number {
  return text.length * 0.6 * fontSize
}

/**
 * Resolve the full render layout for a SegmentTimeline.
 *
 * - The track is the measured span x0Frac → x1Frac at yFrac, hFrac.
 * - Fills tile the track exactly: fill i runs from the previous node's right
 *   edge (or the track's left end) to node i's right edge, so the measured
 *   node centers fully determine the composition — no gaps, no overshoot.
 * - Ticks and label blocks derive from the node centers — they can never
 *   drift. Row 1 is offset 27px right of the node (measured); row 2 centers
 *   on the node.
 * - The white arrow caps the composition past the track's right end; the
 *   legend column centers on the last node's axis.
 * - Violations (empty segments, unknown tone, out-of-range fractions, node
 *   centers outside the track, non-monotonic nodes) throw RangeError, never
 *   render blank.
 */
export function segmentTimelineLayout(data: SegmentTimelineData, viewBox: Canvas = { width: 1920, height: 1080 }): SegmentTimelineLayout {
  if (data.segments.length === 0) {
    throw new RangeError('SegmentTimeline needs at least one segment')
  }
  for (const segment of data.segments) {
    if (segment.tone !== 'accent' && segment.tone !== 'tertiary' && segment.tone !== 'alt') {
      throw new RangeError(`segment "${segment.id}" has unknown tone "${String(segment.tone)}"`)
    }
    requireFraction(segment.nodeFrac, `segment "${segment.id}" nodeFrac`)
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

  const nodeR = NODE_R_FRAC * viewBox.height
  const nodeCy = track.y + track.height / 2
  const labelOffset = LABEL_CX_OFFSET_FRAC * viewBox.width

  let cursor = track.x
  let prevNode: TimelineSegment | undefined
  const segments: SegmentLayout[] = data.segments.map((segment, i) => {
    const nodeCx = segment.nodeFrac * viewBox.width
    if (nodeCx - nodeR < cursor) {
      throw new RangeError(`segment "${segment.id}" node (x${nodeCx}) overlaps the previous node's fill (through x${cursor})`)
    }
    if (nodeCx - nodeR < track.x || nodeCx + nodeR > track.x + track.width) {
      throw new RangeError(`segment "${segment.id}" node (x${nodeCx}, r${nodeR}) runs past the track span x${track.x}–${track.x + track.width}`)
    }
    if (prevNode !== undefined && nodeCx <= prevNode.nodeFrac * viewBox.width) {
      throw new RangeError(`segment "${segment.id}" node must sit right of segment "${prevNode.id}"'s`)
    }
    const fillRight = nodeCx + nodeR
    const layout: SegmentLayout = {
      id: segment.id,
      tone: segment.tone,
      label: segment.label,
      sublabel: segment.sublabel,
      x: cursor,
      fillRight,
      width: fillRight - cursor,
      nodeCx,
      nodeCy,
      nodeR,
      tickX: nodeCx,
      tickY0: nodeCy + nodeR + TICK_GAP,
      tickLen: TICK_LEN_FRAC * viewBox.height,
      labelCx: nodeCx + labelOffset,
      labelBaseline: LABEL_BASELINE_FRAC * viewBox.height,
      sublabelCx: nodeCx,
      sublabelBaseline: SUBLABEL_BASELINE_FRAC * viewBox.height,
      digit: String(i + 1).padStart(2, '0'),
      digitCx: nodeCx,
      digitBaseline: nodeCy + NODE_DIGIT_SIZE * 0.72 / 2,
    }
    cursor = fillRight
    prevNode = segment
    return layout
  })

  const arrow: ArrowLayout = {
    x0: ARROW_X0_FRAC * viewBox.width,
    x1: ARROW_X1_FRAC * viewBox.width,
    shaftY: nodeCy,
    headDepth: ARROW_HEAD_DEPTH * (viewBox.width / 1920),
    headHalf: ARROW_HEAD_HALF * (viewBox.height / 1080),
    stroke: ARROW_STROKE * (viewBox.height / 1080),
  }

  // Legend column centered on the last node's axis: hue words, a bar under
  // each, then the dim note. Word positions use the mono advance model with
  // the measured 26px gaps.
  const words = ['DATA', 'SOFTWARE', 'AI']
  const colors = [NODE_BLUE, NODE_CYAN, LEGEND_MINT]
  const wordsBaseline = LABEL_BASELINE_FRAC * viewBox.height
  const barY = LEGEND_BAR_Y_FRAC * viewBox.height
  const totalWidth = words.reduce((total, word) => total + monoWidth(word, LEGEND_SIZE), 0) + LEGEND_GAP * (words.length - 1)
  const legendCx = segments[segments.length - 1]!.nodeCx
  let wordCursor = legendCx - totalWidth / 2
  const legendWords: LegendWordLayout[] = words.map((word, i) => {
    const width = monoWidth(word, LEGEND_SIZE)
    const entry: LegendWordLayout = {
      text: word,
      color: colors[i]!,
      x: wordCursor,
      width,
      barY,
      barH: LEGEND_BAR_H,
    }
    wordCursor += width + LEGEND_GAP
    return entry
  })

  const legend: LegendLayout = {
    cx: legendCx,
    wordsBaseline,
    words: legendWords,
    note: 'THREE TEAMS ON ONE SHARED SYSTEM',
    noteCx: legendCx,
    noteBaseline: 832 / 1080 * viewBox.height,
  }

  return { track, arrow, segments, legend, viewBox }
}
