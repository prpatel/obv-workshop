/**
 * Shared polyline path helpers for the diagram family.
 *
 * Born inside `nodeEdge.ts` (StepFlow's track was the first consumer of the
 * dashoffset draw, NodeEdge's edges the second) and extracted here when
 * SchematicRows' schematic lines became the third consumer — the rule of
 * three, honored at the moment it triggered (diagram-family spec, "Code
 * sharing" decision). Pure and SSR-safe: no DOM access, no mutation of the
 * inputs.
 */

/** SVG polyline path `d` for absolute px points: `M x y L x y …`. */
export function polylinePath(points: [number, number][]): string {
  return points.map(([x, y], i) => `${i === 0 ? 'M' : 'L'} ${x} ${y}`).join(' ')
}

/** Analytic polyline length: the sum of its segment lengths. */
export function polylineLength(points: [number, number][]): number {
  let total = 0
  for (let i = 1; i < points.length; i++) {
    const dx = points[i][0] - points[i - 1][0]
    const dy = points[i][1] - points[i - 1][1]
    total += Math.hypot(dx, dy)
  }
  return total
}
