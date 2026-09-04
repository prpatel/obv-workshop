import { describe, expect, it } from 'vitest'
import { hexClusterLayout, flatTopVertices, flatTopPath, HEX_COLORS } from './hex'

// Hand-computed constants for the default 1920×1080 canvas, from the measured
// fractions (the exact-trace sheet art_4A7yguGJ §3, re-confirmed by border-run
// and ring-fraction measurements this session — derivations in hex.ts):
//   webR       = 0.0417 · 1080 = 45.036            (cell 2R ≈ 90–128 ≈ the sheet's 90–140px)
//   strokeWidth = 0.0028 · 1080 = 3.024            (plate borders ≈ 3px)
//   left plate  = x12 y423 w572 h426                (sheet bbox, mapped 1920×1080)
//   right plate = x630 y426 w566 h420
const WEB_R = (0.0417 * 1080)
const STROKE = (0.0028 * 1080)

/** Effective-white luminance of a hex color — the dim contract is a luma band, not exact pixels. */
function effectiveWhite(hex: string): number {
  const n = parseInt(hex.slice(1), 16)
  const r = (n >> 16) & 255
  const g = (n >> 8) & 255
  const b = n & 255
  return (0.2126 * r + 0.7152 * g + 0.0722 * b) / 255
}

describe('hexClusterLayout — measured plate bounds', () => {
  const layout = hexClusterLayout()

  it('bounds the left plate at x12 y423 572×426', () => {
    const left = layout.plates[0]
    expect(left.id).toBe('left')
    expect(left.x).toBeCloseTo(12, 6)
    expect(left.y).toBeCloseTo(423, 6)
    expect(left.width).toBeCloseTo(572, 6)
    expect(left.height).toBeCloseTo(426, 6)
  })

  it('bounds the right plate at x630 y426 566×420', () => {
    const right = layout.plates[1]
    expect(right.id).toBe('right')
    expect(right.x).toBeCloseTo(630, 6)
    expect(right.y).toBeCloseTo(426, 6)
    expect(right.width).toBeCloseTo(566, 6)
    expect(right.height).toBeCloseTo(420, 6)
  })

  it('keeps every web cell inside its own plate (the old overflow is gone)', () => {
    for (const plate of layout.plates) {
      for (const cell of plate.cells) {
        expect(cell.cx).toBeGreaterThan(plate.x)
        expect(cell.cx).toBeLessThan(plate.x + plate.width)
        expect(cell.cy).toBeGreaterThan(plate.y)
        expect(cell.cy).toBeLessThan(plate.y + plate.height)
      }
    }
  })

  it('keeps all content in the left two-thirds — the right third stays empty', () => {
    // Sheet §3: content ends x1402. The furthest geometry (right plate edge
    // 1196, outlier cell + R, label half-width margin) must clear it.
    const right = layout.plates[1]
    const maxX = Math.max(
      right.x + right.width,
      ...layout.cells.map((c) => c.cx + layout.webR),
    )
    expect(maxX).toBeLessThan(1402)
  })
})

describe('hexClusterLayout — web geometry', () => {
  const layout = hexClusterLayout()

  it('uses the measured cell radius and stroke width', () => {
    expect(layout.webR).toBeCloseTo(WEB_R, 6) // 45.036
    expect(layout.strokeWidth).toBeCloseTo(STROKE, 6) // 3.024
    expect(layout.viewBox).toEqual({ width: 1920, height: 1080 })
  })

  it('builds flat-top hexagon rings that close with all six sides equal to R', () => {
    for (const cell of layout.cells) {
      const verts = flatTopVertices(cell.cx, cell.cy, layout.webR)
      expect(verts).toHaveLength(6)
      for (let k = 0; k < 6; k++) {
        const [ax, ay] = verts[k]
        const [bx, by] = verts[(k + 1) % 6] // wraps v5 → v0: the ring closes
        expect(Math.hypot(bx - ax, by - ay)).toBeCloseTo(layout.webR, 6)
      }
      // Flat-top: vertices at angles 0°/60°/…, so the right vertex lies on the
      // center's horizontal and the top edge's endpoints share its y.
      expect(verts[0][1]).toBeCloseTo(cell.cy, 6)
      expect(verts[1][1]).toBeCloseTo(verts[2][1], 6)
    }
  })

  it('lands cluster cell counts in the sheet census (6–9 per panel)', () => {
    // Left: 5-cell ring patch; right: 6-cell ring + measured outlier; plus
    // the pre-build core on the right — 6 and 8 respectively.
    expect(layout.plates[0].cells).toHaveLength(5)
    expect(layout.plates[1].cells).toHaveLength(6 + 1) // ring + outlier
    expect(layout.cells.at(-1)?.core).toBe(true) // the core rides last
  })

  it('anchors the clusters on the measured centroids', () => {
    const left = layout.plates[0].cells
    const leftCentroid = left.reduce((s, c) => s + c.cx, 0) / left.length
    expect(leftCentroid).toBeCloseTo(228, 0)
    const right = layout.plates[1].cells.filter((c) => !c.core)
    const rightCentroid = right.reduce((s, c) => s + c.cx, 0) / right.length
    expect(rightCentroid).toBeCloseTo((6 * 800 + 1006) / 7, 0) // ring + outlier
  })

  it('emits exact path data for a known cell', () => {
    const cell = layout.plates[0].cells[0]
    // Byte-stable against the pure helper: the component renders this string.
    expect(cell.path).toBe(flatTopPath(cell.cx, cell.cy, layout.webR))
    expect(cell.path.startsWith('M ')).toBe(true)
    expect(cell.path.endsWith(' Z')).toBe(true)
  })
})

describe('hexClusterLayout — labels', () => {
  const layout = hexClusterLayout()

  it('carries the crop-verified strings inside the panels', () => {
    expect(layout.plates[0].data.label).toBe('INGESTION')
    expect(layout.plates[1].data.label).toBe('NODE')
  })

  it('centers each label on its plate at the measured cap band y489–519', () => {
    for (const plate of layout.plates) {
      expect(plate.label.cx).toBeCloseTo(plate.x + plate.width / 2, 6)
      expect(plate.label.baseline).toBeCloseTo(489 + 31, 6) // cap top + cap height
      expect(plate.label.capHeight).toBeCloseTo(31, 6)
    }
  })
})

describe('HEX_COLORS — the stroke/dim contract (sheet §3)', () => {
  it('settles the web strokes at ~6–10% effective white — never bright outlines', () => {
    for (const settled of [HEX_COLORS.settledStroke.left, HEX_COLORS.settledStroke.right]) {
      const w = effectiveWhite(settled)
      expect(w).toBeGreaterThanOrEqual(0.06)
      expect(w).toBeLessThanOrEqual(0.10)
    }
  })

  it('keeps settled accents barely brighter than the stroke band (#1a2a30)', () => {
    // #1a2a30 computes to ≈15.3% effective white — still dim, a notch above
    // the 6–10% stroke band, never a bright outline.
    expect(effectiveWhite(HEX_COLORS.settledAccent)).toBeCloseTo(0.153, 3)
    expect(effectiveWhite(HEX_COLORS.settledAccent)).toBeGreaterThan(
      effectiveWhite(HEX_COLORS.settledStroke.left),
    )
    expect(effectiveWhite(HEX_COLORS.settledAccent)).toBeLessThan(0.2)
  })

  it('reserves the bright tones for the mid-sequence web only', () => {
    // The bright web (blue left / cyan right) is many times the settled band —
    // it exists only mid-sequence and dims in the 5.9–6.6s transition.
    expect(effectiveWhite(HEX_COLORS.brightStroke.left)).toBeGreaterThan(0.4)
    expect(effectiveWhite(HEX_COLORS.brightStroke.right)).toBeGreaterThan(0.4)
  })

  it('fills the plates with the measured dim wash and borders them per side', () => {
    expect(HEX_COLORS.plateFill).toBe('#0c0b10')
    expect(HEX_COLORS.plateStroke.left).toBe('#031d21')
    expect(HEX_COLORS.plateStroke.right).toBe('#0e1929')
  })

  it('ships the sheet-measured label tones', () => {
    expect(HEX_COLORS.label.cyan).toBe('#26c8dd')
    expect(HEX_COLORS.label.blue).toBe('#3b95eb')
  })
})

describe('hexClusterLayout — options and determinism', () => {
  it('rescales every bound from a custom viewBox', () => {
    const layout = hexClusterLayout({ width: 960, height: 540 })
    const left = layout.plates[0]
    expect(left.x).toBeCloseTo(6, 6)
    expect(left.y).toBeCloseTo(211.5, 6)
    expect(left.width).toBeCloseTo(286, 6)
    expect(layout.webR).toBeCloseTo(WEB_R / 2, 6)
  })

  it('is deterministic — same inputs, byte-identical output', () => {
    expect(JSON.stringify(hexClusterLayout())).toBe(JSON.stringify(hexClusterLayout()))
  })
})
