/**
 * NodeEdge data contract + pure layout math (diagram-family spec, NodeEdge).
 *
 * Free-position network: node positions are DATA (canvas fractions), never
 * computed — the recording's network is hand-placed. Edges are polylines over
 * the same fractions; their analytic lengths drive the StepFlow dim-base +
 * stacked accent-copy dashoffset draw. Pure and SSR-safe: no DOM access, no
 * mutation of the inputs.
 *
 * Measured from the v3 recording (research art_0AzKGXnD §F2, re-verified this
 * session against frame crops): ~100px-diameter circular node outlines
 * (5.0%w — the earlier "square nodes" read was the bounding box), thin ~6px
 * edges, one tall red status run, and a status layer of block/outline/arrow
 * elements. The recording's amber→red swap is modeled appearance-only: the
 * status layer reveals additively, one click per element.
 */

import { polylineLength, polylinePath } from './paths'

// The helpers live in `./paths` since SchematicRows became the third consumer
// (rule of three); re-exported so existing `./nodeEdge` imports keep working.
export { polylineLength, polylinePath }

/** A free-position node. `(xFrac, yFrac)` is the circle CENTER as a canvas fraction. */
export interface FlowNode {
  /** Stable key — edge endpoints, status attachment, and test selectors. */
  id: string
  /** Circle-center x as a fraction of the canvas width. */
  xFrac: number
  /** Circle-center y as a fraction of the canvas height. */
  yFrac: number
  /** Palette role: `accent` | `alt` stroke, or `plain` chrome-white with a dark icon. */
  tone: 'accent' | 'alt' | 'plain'
  /** Key into the icon registry (`iconPath`); unknown keys render the fallback. */
  icon?: string
  /** Short label rendered inside the circle (plain/icon nodes may omit it). */
  label?: string
}

/** A polyline edge. `points` are canvas fractions; `status` edges draw in `accentAlt` (red). */
export interface FlowEdge {
  /** Id of the start node (`FlowNode.id`). */
  from: string
  /** Id of the end node (`FlowNode.id`). */
  to: string
  /** Polyline vertices as canvas fractions, first → last. */
  points: [number, number][]
  /** Red status edge → dim base + accentAlt draw; plain edges draw in `accent`. */
  status?: boolean
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

/** Measured node geometry, v3 recording (fractions of the 1920×1080 canvas). */
export const NODE_R_FRAC = 0.025 // circle radius ≈ 48px (diameter ≈ 5.0%w)
export const NODE_STROKE = 3 // outline stroke, px
export const EDGE_STROKE = 6 // measured thin edge stroke ≈ 6px at 2038w

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

/** Resolved px geometry for one node, ready to render. */
export interface NodeLayout {
  id: string
  cx: number
  cy: number
  r: number
  tone: FlowNode['tone']
  icon?: string
  label?: string
}

/** Resolved px geometry for one edge, ready to render. */
export interface EdgeLayout {
  from: string
  to: string
  status: boolean
  d: string
  /** Analytic length — the dashoffset draw distance (`--sf-drawn`). */
  length: number
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
/** Gap between a status element and its node's circle edge. */
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
 *   LEFT of the circle, the arrow hangs BELOW it.
 */
export function nodeEdgeLayout(data: NodeEdgeData, viewBox: Canvas = { width: 1920, height: 1080 }): NodeEdgeLayout {
  if (data.nodes.length === 0) {
    throw new RangeError('NodeEdge needs at least one node')
  }
  const r = NODE_R_FRAC * viewBox.width
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
    r,
    tone: node.tone,
    icon: node.icon,
    label: node.label,
  }))

  const edges: EdgeLayout[] = data.edges.map((edge) => {
    if (!byId.has(edge.from)) {
      throw new RangeError(`edge references unknown node "${edge.from}"`)
    }
    if (!byId.has(edge.to)) {
      throw new RangeError(`edge references unknown node "${edge.to}"`)
    }
    const pts = edgePoints(edge.points, viewBox)
    return { from: edge.from, to: edge.to, status: edge.status ?? false, d: polylinePath(pts), length: polylineLength(pts) }
  })

  const status: StatusLayout[] = (data.status ?? []).map((el) => {
    const node = byId.get(el.attach)
    if (!node) {
      throw new RangeError(`status references unknown node "${el.attach}"`)
    }
    const cx = node.xFrac * viewBox.width
    const cy = node.yFrac * viewBox.height
    if (el.kind === 'block') {
      // Solid block hangs left of the circle, vertically centered on it.
      return { ...el, cx: cx - r - STATUS_GAP - STATUS_BLOCK.w / 2, cy, w: STATUS_BLOCK.w, h: STATUS_BLOCK.h }
    }
    if (el.kind === 'outline') {
      return { ...el, cx: cx - r - STATUS_GAP - STATUS_OUTLINE.w / 2, cy, w: STATUS_OUTLINE.w, h: STATUS_OUTLINE.h }
    }
    // Arrow glyph hangs below the circle.
    return { ...el, cx, cy: cy + r + STATUS_GAP + STATUS_ARROW.h / 2, w: STATUS_ARROW.w, h: STATUS_ARROW.h }
  })

  return { nodes, edges, status, viewBox }
}
