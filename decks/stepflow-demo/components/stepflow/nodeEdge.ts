/**
 * NodeEdge data contract + pure layout math (diagram-family spec, NodeEdge).
 *
 * Free-position network: node positions are DATA (canvas fractions), never
 * computed — the recording's network is hand-placed. Edges are polylines over
 * the same fractions, revealed as fast opacity pops. Pure and SSR-safe: no DOM
 * access, no mutation of the inputs.
 *
 * Primitive re-measured against the src-3 recording settle frame (t=4.0,
 * fidelity report art_v4jVdTnp §2, which corrects the earlier "circular
 * outline" read — those were the bounding boxes): nodes are ~100px SQUARES —
 * a #0b0a11 plate, ~6px colored border, and a 3-line ~20px tone-colored label
 * INSIDE — plus one taller solid bright-red status square. Edges are dim red
 * (the palette track), ~6px; bright red is reserved for the status square.
 *
 * The v3 recording's status overlay (block/outline/arrow hung off a node)
 * remains part of the contract, one click per element after nodes and edges.
 *
 * END STATE (exact-trace sheet art_4A7yguGJ §2): the recording's network is a
 * MID-state — it hard-cuts out at t≈4417 ms (frame 265) and the clip settles
 * on a terminal/log composition: traffic-light title bar, `$ meshctl
 * status --verbose` command line, a teal block cursor + `nodes : 6 healthy · 2`
 * stat row, a very dim late center element, and an otherwise empty right
 * third / bottom. The slide therefore binds the whole network scene to v-click
 * RANGES that end at the cut beat: the scene reveals per element, holds, and
 * vanishes instantly at `nodeEdgeClickPlan(...).cutClick` (native Slidev click
 * ranges `[start, end)` — hidden at/after the cut, restored on backward nav).
 * The terminal/log panel is static chrome, visible at every click count: it is
 * the reference's initial state AND its settled state.
 */

import { polylinePath } from './paths'

// The helper lives in `./paths` (shared with SchematicRows); re-exported so
// existing `./nodeEdge` imports keep working.
export { polylinePath }

/** A free-position node. `(xFrac, yFrac)` is the square CENTER as a canvas fraction. */
export interface FlowNode {
  /** Stable key — edge endpoints, status attachment, and test selectors. */
  id: string
  /** Center x as a fraction of the canvas width. */
  xFrac: number
  /** Center y as a fraction of the canvas height. */
  yFrac: number
  /**
   * Palette role: `accent`/`alt` borders map to the palette fields, `plain` is
   * chrome white, and `status` renders the solid bright-red status square.
   */
  tone: 'accent' | 'alt' | 'plain' | 'status'
  /**
   * Label lines rendered INSIDE the square, one per line (~20px, tone-colored).
   * A single string is one line; the recording's nodes carry three.
   */
  label?: string | string[]
}

/** A polyline edge. `points` are canvas fractions; edges render in the palette track (dim red). */
export interface FlowEdge {
  /** Id of the start node (`FlowNode.id`). */
  from: string
  /** Id of the end node (`FlowNode.id`). */
  to: string
  /** Polyline vertices as canvas fractions, first → last. */
  points: [number, number][]
}

/**
 * A status element hung near one node: a solid block, an outlined box, or an
 * arrow glyph. Rendered beside/below the attached node — position is derived,
 * not authored. One click per element, revealed after nodes and edges.
 */
export interface FlowStatus {
  /** Id of the node this element hangs off (`FlowNode.id`). */
  attach: string
  /** Short label; rendered inside block/outline and beneath the arrow glyph. */
  text: string
  /** Palette role of the element's fill/stroke and its label. */
  tone: 'alt' | 'accent'
  /** Solid rounded block, outlined box, or down-arrow glyph. */
  kind: 'block' | 'outline' | 'arrow'
}

/** The full NodeEdge diagram: nodes, edges, and the optional status layer. */
export interface NodeEdgeData {
  nodes: FlowNode[]
  edges: FlowEdge[]
  status?: FlowStatus[]
}

export interface Canvas {
  width: number
  height: number
}

/** Measured node geometry, src-3 settle frame (fractions of the 1920×1080 canvas). */
export const NODE_SIZE_FRAC = 0.05 // square side ≈ 96px at 1920 (≈101px at the recording's native 2038w)
export const NODE_RX = 10 // plate corner radius
export const NODE_STROKE = 6 // measured colored border 6–8px at native scale
export const NODE_PLATE = '#0b0a11' // near-black plate under the border
export const EDGE_STROKE = 6 // measured thin edge stroke ≈ 6px
/** Bright red is reserved for the status square (a convention constant, like the chrome green). */
export const STATUS_RED = '#ec413f'
/** Measured status-square geometry: 108×158 at the recording's native 2038×1144. */
export const STATUS_SQUARE = { w: 102, h: 149 } as const
/** Label metrics inside a square: ~20px glyphs, ~26px line pitch at 1080. */
export const LABEL_SIZE_FRAC = 20 / 1080
export const LABEL_PITCH_FRAC = 26 / 1080

/**
 * Click choreography for the cut-to-end-state sequence (pure; the component
 * binds native Slidev click ranges from it).
 *
 * Reveals are one click per element in data order — nodes, then edges, then
 * status — except the FINAL TWO edges, which pop as one beat (the recording's
 * build interleaves; the demo's replay hookups land together). The hard cut
 * is the click after the last reveal: every network-scene element is bound to
 * the range `[reveal, cutClick)` so it vanishes at the cut, and elements that
 * first appear AT the cut bind `cutClick` itself. `total === cutClick` keeps
 * the family capture contract (`?clicks=13` is the settled end state).
 */
export interface NodeEdgeClickPlan {
  /** Reveal click per node (1-based, data order). */
  nodeClicks: number[]
  /** Reveal click per edge (data order; the final two edges share one beat). */
  edgeClicks: number[]
  /** Reveal click per status element (after the edges). */
  statusClicks: number[]
  /** The hard-cut beat: the network scene is visible strictly below this click. */
  cutClick: number
  /** Total slide clicks — equals `cutClick` (the cut lands the settled state). */
  total: number
}

export function nodeEdgeClickPlan(nodeCount: number, edgeCount: number, statusCount = 0): NodeEdgeClickPlan {
  const pairLastEdges = edgeCount >= 2
  const nodeClicks = Array.from({ length: nodeCount }, (_, i) => i + 1)
  const edgeClicks = Array.from({ length: edgeCount }, (_, j) => {
    if (pairLastEdges && j >= edgeCount - 2) {
      return nodeCount + edgeCount - 1
    }
    return nodeCount + j + 1
  })
  const lastEdgeClick = edgeClicks.length > 0 ? edgeClicks[edgeClicks.length - 1]! : nodeCount
  const statusClicks = Array.from({ length: statusCount }, (_, k) => lastEdgeClick + 1 + k)
  const lastReveal = Math.max(nodeCount, lastEdgeClick, statusClicks.length > 0 ? statusClicks[statusClicks.length - 1]! : 0)
  const cutClick = lastReveal + 1
  return { nodeClicks, edgeClicks, statusClicks, cutClick, total: cutClick }
}

/** Content of the terminal/log end-state panel (the settled composition's text). */
export interface TerminalLogData {
  /** Command line after the `$ ` prompt, e.g. `meshctl status --verbose`. */
  command: string
  /** Stat row after the block cursor, e.g. `nodes : 6 healthy · 2`. */
  stat: string
}

/**
 * Measured terminal/log end-state geometry, 1920×1080 (exact-trace sheet
 * art_4A7yguGJ §2.2, mapped ×0.94210/×0.94336 from the 2038×1144 source).
 * Colors are measured constants — recording chrome, not palette roles.
 *
 * - Traffic lights: ≈23 px circles at y358–380 — red x32–54, amber x67–89,
 *   green x102–123 (centers 43/78/112.5, r 11).
 * - Command line `$ meshctl status --verbose`: band x128–606, y357–380. 26
 *   glyphs over 478 px = 18.4 px/char at cap 23 (font-size 23/0.730 = 31.5,
 *   the standard 0.6 em mono advance — this row is NOT condensed).
 * - Stat row: text x128–387 (259 px over 21 glyphs = 12.33 px/char at cap 20 —
 *   the recordings' condensed face; the component pins it with textLength),
 *   teal block cursor x77–105, y461–500 (28×39, taller than the text).
 * - Late dim center element: x873–953, y540–642 (~81×102), ≈#16202a — at the
 *   noise floor; size/position/dimness are what register.
 */
export const TERMINAL_LOG_MEASURED = {
  lights: { cy: 369, r: 11, centersX: [43, 78, 112.5], colors: ['#f85c53', '#f9b82d', '#27c43d'] },
  command: { x: 128, centerlineY: 368.5, fontSize: 30.6, advance: 478 / 26, prompt: '$', promptColor: '#f9b82d', textColor: '#838288' },
  stat: { x: 128, centerlineY: 481.5, fontSize: 26.6, advance: 259 / 21, textColor: '#5e5d62' },
  cursor: { x: 77, y: 461, w: 28, h: 39, color: '#225d66' },
  center: { x: 873, y: 540, w: 81, h: 102, color: '#16202a' },
} as const

/** Resolved px geometry for the terminal/log end-state panel. */
export interface TerminalLogLayout {
  lights: { cx: number; cy: number; r: number; color: string }[]
  /** `$` prompt glyph, then the command body with its pinned extent. */
  prompt: { x: number; y: number; fontSize: number; color: string; text: string }
  command: { x: number; y: number; fontSize: number; textLength: number; color: string; text: string }
  stat: { x: number; y: number; fontSize: number; textLength: number; color: string; text: string }
  cursor: { x: number; y: number; w: number; h: number; color: string }
  center: { x: number; y: number; w: number; h: number; color: string }
}

/**
 * Resolve the terminal/log end-state geometry for the given viewBox. Text
 * extents derive from the measured per-glyph advance × string length, so a
 * different command/stat string still fills its measured row.
 */
export function terminalLogLayout(data: TerminalLogData, viewBox: Canvas = { width: 1920, height: 1080 }): TerminalLogLayout {
  const sx = viewBox.width / 1920
  const sy = viewBox.height / 1080
  const m = TERMINAL_LOG_MEASURED
  const commandAdvance = m.command.advance * sx
  return {
    lights: m.lights.centersX.map((cx, i) => ({
      cx: cx * sx,
      cy: m.lights.cy * sy,
      r: m.lights.r * sy,
      color: m.lights.colors[i]!,
    })),
    prompt: {
      x: m.command.x * sx,
      y: m.command.centerlineY * sy,
      fontSize: m.command.fontSize * sy,
      color: m.command.promptColor,
      text: m.command.prompt,
    },
    command: {
      // Body sits one advance after the prompt: `$ meshctl status --verbose`.
      x: (m.command.x + commandAdvance) * sx,
      y: m.command.centerlineY * sy,
      fontSize: m.command.fontSize * sy,
      // ` ` + command: one leading space after the prompt glyph.
      textLength: commandAdvance * (data.command.length + 1),
      color: m.command.textColor,
      text: ` ${data.command}`,
    },
    stat: {
      x: m.stat.x * sx,
      y: m.stat.centerlineY * sy,
      fontSize: m.stat.fontSize * sy,
      textLength: m.stat.advance * sx * data.stat.length,
      color: m.stat.textColor,
      text: data.stat,
    },
    cursor: {
      x: m.cursor.x * sx,
      y: m.cursor.y * sy,
      w: m.cursor.w * sx,
      h: m.cursor.h * sy,
      color: m.cursor.color,
    },
    center: {
      x: m.center.x * sx,
      y: m.center.y * sy,
      w: m.center.w * sx,
      h: m.center.h * sy,
      color: m.center.color,
    },
  }
}

/**
 * Convert canvas-fraction points to absolute px in the given viewBox.
 * Pure; validates the fraction range so a typo like `12.0` throws instead of
 * silently exploding the layout.
 */
export function edgePoints(points: [number, number][], viewBox: Canvas = { width: 1920, height: 1080 }): [number, number][] {
  if (points.length < 2) {
    throw new RangeError(`edge needs at least 2 points, got ${points.length}`)
  }
  return points.map(([xFrac, yFrac]) => {
    if (!(xFrac >= 0 && xFrac <= 1) || !(yFrac >= 0 && yFrac <= 1)) {
      throw new RangeError(`edge point (${xFrac}, ${yFrac}) is outside the [0, 1] canvas-fraction range`)
    }
    return [xFrac * viewBox.width, yFrac * viewBox.height] as [number, number]
  })
}

/** Normalize the label into one string per rendered line. */
export function labelLines(label: string | string[] | undefined): string[] {
  if (!label) return []
  return Array.isArray(label) ? label : [label]
}

/** Resolved px geometry for one node, ready to render. */
export interface NodeLayout {
  id: string
  cx: number
  cy: number
  /** Square side (status squares are taller than wide). */
  w: number
  h: number
  tone: FlowNode['tone']
  label: string[]
}

/** Resolved px geometry for one edge, ready to render. */
export interface EdgeLayout {
  from: string
  to: string
  d: string
}

/** Resolved px geometry for one status element, ready to render. */
export interface StatusLayout {
  attach: string
  text: string
  tone: FlowStatus['tone']
  kind: FlowStatus['kind']
  cx: number
  cy: number
  w: number
  h: number
}

export interface NodeEdgeLayout {
  nodes: NodeLayout[]
  edges: EdgeLayout[]
  status: StatusLayout[]
  viewBox: Canvas
}

/** Measured status-element sizes (v3 recording), px on the 1920×1080 canvas. */
export const STATUS_BLOCK = { w: 100, h: 150 } as const
export const STATUS_OUTLINE = { w: 100, h: 170 } as const
export const STATUS_ARROW = { w: 64, h: 100 } as const
/** Gap between a status element and its node's square edge. */
export const STATUS_GAP = 20

/**
 * Resolve the full render layout for a NodeEdge diagram.
 *
 * - Node positions are data; edges must reference known node ids and keep
 *   their points inside the canvas — violations throw RangeError, never render
 *   blank.
 * - Reveal click choreography lives in `nodeEdgeClickPlan` (nodes in data
 *   order, then edges, then the status layer; the final two edges share one
 *   beat; the hard cut follows the last reveal).
 * - Status geometry derives from the attached node: block/outline hang to the
 *   LEFT of the square, the arrow hangs BELOW it.
 */
export function nodeEdgeLayout(data: NodeEdgeData, viewBox: Canvas = { width: 1920, height: 1080 }): NodeEdgeLayout {
  if (data.nodes.length === 0) {
    throw new RangeError('NodeEdge needs at least one node')
  }
  const side = NODE_SIZE_FRAC * viewBox.width
  const byId = new Map<string, FlowNode>()
  for (const node of data.nodes) {
    if (!(node.xFrac >= 0 && node.xFrac <= 1) || !(node.yFrac >= 0 && node.yFrac <= 1)) {
      throw new RangeError(`node "${node.id}" center (${node.xFrac}, ${node.yFrac}) is outside the [0, 1] canvas-fraction range`)
    }
    byId.set(node.id, node)
  }

  const nodes: NodeLayout[] = data.nodes.map((node) => ({
    id: node.id,
    cx: node.xFrac * viewBox.width,
    cy: node.yFrac * viewBox.height,
    w: node.tone === 'status' ? STATUS_SQUARE.w : side,
    h: node.tone === 'status' ? STATUS_SQUARE.h : side,
    tone: node.tone,
    label: labelLines(node.label),
  }))

  const edges: EdgeLayout[] = data.edges.map((edge) => {
    if (!byId.has(edge.from)) {
      throw new RangeError(`edge references unknown node "${edge.from}"`)
    }
    if (!byId.has(edge.to)) {
      throw new RangeError(`edge references unknown node "${edge.to}"`)
    }
    const pts = edgePoints(edge.points, viewBox)
    return { from: edge.from, to: edge.to, d: polylinePath(pts) }
  })

  const status: StatusLayout[] = (data.status ?? []).map((el) => {
    const node = byId.get(el.attach)
    if (!node) {
      throw new RangeError(`status references unknown node "${el.attach}"`)
    }
    const cx = node.xFrac * viewBox.width
    const cy = node.yFrac * viewBox.height
    const halfW = (node.tone === 'status' ? STATUS_SQUARE.w : side) / 2
    if (el.kind === 'block') {
      // Solid block hangs left of the square, vertically centered on it.
      return { ...el, cx: cx - halfW - STATUS_GAP - STATUS_BLOCK.w / 2, cy, w: STATUS_BLOCK.w, h: STATUS_BLOCK.h }
    }
    if (el.kind === 'outline') {
      return { ...el, cx: cx - halfW - STATUS_GAP - STATUS_OUTLINE.w / 2, cy, w: STATUS_OUTLINE.w, h: STATUS_OUTLINE.h }
    }
    // Arrow glyph hangs below the square.
    const halfH = (node.tone === 'status' ? STATUS_SQUARE.h : side) / 2
    return { ...el, cx, cy: cy + halfH + STATUS_GAP + STATUS_ARROW.h / 2, w: STATUS_ARROW.w, h: STATUS_ARROW.h }
  })

  return { nodes, edges, status, viewBox }
}

/**
 * Measured ambience of the settled composition (reference frame dark-field
 * profiles, §2.2's "right third and bottom empty" = empty of CONTENT, not of
 * the recording's glow): a #08070a floor below the title band, a soft
 * full-width #141318 band behind the terminal row, and a dimmer #0f0e11 glow
 * plateau over the left half below it. The band and glow are Gaussian-
 * feathered rectangles — the reference reads uniform in their interiors and
 * falls to the floor across ≈60px edges. All values are 1920×1080 canvas
 * pixels; `ambienceLayout` scales them for a custom viewBox.
 */
export const TERMINAL_LOG_AMBIENCE = {
  floor: { x: 0, y: 330, w: 1920, h: 750, color: '#08070a' },
  band: { x: 110, y: 341, w: 1700, h: 84, color: '#141318', blur: 24 },
  glow: { x: 60, y: 470, w: 790, h: 210, color: '#0f0e11', blur: 50 },
} as const

/** Ambience shapes scaled to a custom viewBox. */
export function ambienceLayout(viewBox: { width: number; height: number } = { width: 1920, height: 1080 }) {
  const sx = viewBox.width / 1920
  const sy = viewBox.height / 1080
  const scale = (r: { x: number; y: number; w: number; h: number; color: string; blur?: number }) => ({
    x: r.x * sx,
    y: r.y * sy,
    w: r.w * sx,
    h: r.h * sy,
    color: r.color,
    blur: (r.blur ?? 0) * Math.max(sx, sy),
  })
  return {
    floor: scale(TERMINAL_LOG_AMBIENCE.floor),
    band: scale(TERMINAL_LOG_AMBIENCE.band),
    glow: scale(TERMINAL_LOG_AMBIENCE.glow),
  }
}
