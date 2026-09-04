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
 * - Click choreography (native v-clicks): node i is click i + 1, edge j is
 *   click `nodes.length + j + 1`, status k is click
 *   `nodes.length + edges.length + k + 1` — nodes in data order, then edges,
 *   then the status layer one element per click.
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
