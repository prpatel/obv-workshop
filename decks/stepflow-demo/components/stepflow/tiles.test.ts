// @vitest-environment happy-dom
import { describe, expect, it, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import TileGrid from '../TileGrid.vue'
import { hexPath, tileGridLayout, tileTrackLines, type Tile } from './tiles'

/**
 * Slidev registers the v-click directive globally at runtime; the render tests
 * stub it with a recorder — every mounted binding value lands in `clicks`, so
 * the test asserts the exact click numbers (and their order) the component
 * consumes on the slide.
 */
type TileGridProps = {
  tiles: Tile[]
  cols: number
  tileWFrac: number
  tileHFrac: number
  pitchXFrac: number
  pitchYFrac: number
  x0Frac: number
  y0Frac: number
  palette?: object
  title?: string
  titleAccent?: string
}

function mountTileGrid(props: TileGridProps, clicks: number[] = []) {
  return mount(TileGrid, {
    props,
    global: {
      directives: {
        click: {
          mounted(_el: unknown, binding: { value?: unknown }) {
            clicks.push(binding.value as number)
          },
        },
      },
    },
  })
}

/**
 * Demo grid seed — the source recording's measured constants (research
 * art_2kSBGNmJ §3.5, src 25–35s): six 6.2%w × 9.7%h tiles, column pitch
 * 27.5%w, row pitch 225px/720 = 31.25%h (the research's "31.3%h" rounded),
 * origin at 250px/1280, 277px/720.
 */
const GRID = {
  cols: 3,
  tileWFrac: 0.062,
  tileHFrac: 0.097,
  pitchXFrac: 0.275,
  pitchYFrac: 0.3125,
  x0Frac: 0.1953125,
  y0Frac: 0.384722,
}

const gridTiles: Tile[] = [
  { id: 'extract', icon: 'database', label: 'EXTRACT', mini: '01' },
  { id: 'transform', icon: 'cpu', label: 'TRANSFORM', mini: '02' },
  { id: 'load', icon: 'boxes', label: 'LOAD', mini: '03' },
  { id: 'orchestrate', icon: 'git-branch', label: 'ORCHESTRATE', mini: '04' },
  { id: 'quality', icon: 'layers', label: 'QUALITY', mini: '05' },
  { id: 'serve', icon: 'server', label: 'SERVE', mini: '06' },
]

/**
 * Matrix seed — the src 57–60s variant normalized onto the uniform-pitch
 * contract: 3×3 tone-coded cells (5.2%w × 9.3%h, 67px at source) including a
 * chrome-white icon tile, the amber/orange family as `alt`, the measured
 * status red, and one enlarged cell (84×98px → 0.065625 × 0.136111). The
 * recording's irregular column/row steps (116–138px / 123–152px) collapse to
 * the normalized pitches below — a seed-data arrangement, per the spec.
 */
const MATRIX = {
  cols: 3,
  tileWFrac: 0.052,
  tileHFrac: 0.093,
  pitchXFrac: 0.093,
  pitchYFrac: 0.191,
  x0Frac: 0.411719, // 527px/1280
  y0Frac: 0.344444, // 248px/720
}

const matrixTiles: Tile[] = [
  { id: 'hub', tone: 'plain', icon: 'cpu' },
  { id: 'a', tone: 'accent' },
  { id: 'b', tone: 'accent' },
  { id: 'c', tone: 'alt' },
  { id: 'd', tone: 'alt', wFrac: 0.065625, hFrac: 0.136111 }, // the 84×98px cell
  { id: 'e', tone: 'accent' },
  { id: 'f', tone: 'status' },
  { id: 'g', tone: 'accent' },
  { id: 'h', tone: 'tertiary' },
]

/**
 * Flat-row seed — the src 107–110s variant: eight 50–51px × 55px tiles on one
 * row (y = 393px/720). The recording's two groups of four (with a visible
 * group gap) normalize to a tone split — four accent tiles then four tertiary
 * — under the uniform-pitch contract; x0/pitch are authoring choices (the
 * research measured only sizes and y for this variant).
 */
const ROW = {
  cols: 8,
  tileWFrac: 0.0395,
  tileHFrac: 0.0764,
  pitchXFrac: 0.0625,
  pitchYFrac: 0.313,
  x0Frac: 0.261719,
  y0Frac: 0.545833,
}

const rowTiles: Tile[] = [
  { id: 'r1', tone: 'accent' },
  { id: 'r2', tone: 'accent' },
  { id: 'r3', tone: 'accent' },
  { id: 'r4', tone: 'accent' },
  { id: 'r5', tone: 'tertiary' },
  { id: 'r6', tone: 'tertiary' },
  { id: 'r7', tone: 'tertiary' },
  { id: 'r8', tone: 'tertiary' },
]

describe('tileGridLayout — measured grid arrangement (3×2, src 25–35s)', () => {
  it('places all six tiles at the hand-computed px rects', () => {
    const l = tileGridLayout({ tiles: gridTiles, ...GRID })

    // Hand-computed at 1920×1080:
    //   w = 0.062 × 1920 = 119.04        h = 0.097 × 1080 = 104.76
    //   x0 = 0.1953125 × 1920 = 375      y0 = 0.384722 × 1080 = 415.49976
    //   col pitch = 0.275 × 1920 = 528   row pitch = 0.3125 × 1080 = 337.5
    const expected = [
      { x: 375, y: 415.49976 },
      { x: 903, y: 415.49976 },
      { x: 1431, y: 415.49976 },
      { x: 375, y: 752.99976 },
      { x: 903, y: 752.99976 },
      { x: 1431, y: 752.99976 },
    ]
    expect(l.tiles).toHaveLength(6)
    l.tiles.forEach((tile, i) => {
      expect(tile.x, `tile ${i} x`).toBeCloseTo(expected[i].x, 6)
      expect(tile.y, `tile ${i} y`).toBeCloseTo(expected[i].y, 6)
      expect(tile.w, `tile ${i} w`).toBeCloseTo(119.04, 6)
      expect(tile.h, `tile ${i} h`).toBeCloseTo(104.76, 6)
    })
  })

  it('derives the row-major build order from the index', () => {
    const l = tileGridLayout({ tiles: gridTiles, ...GRID })

    expect(l.tiles.map((t) => [t.col, t.row])).toEqual([
      [0, 0], [1, 0], [2, 0],
      [0, 1], [1, 1], [2, 1],
    ])
  })

  it('wraps partial rows to the next row (7 tiles, 3 cols)', () => {
    // The measured 27.5%w pitch fits only 3 columns and the measured row pitch
    // only 2 rows on the 1920×1080 canvas, so this wrap case tightens the row
    // pitch to 10%h — the wrap math is what's under test, not the measured
    // constants. 7 tiles at cols 3 → rows of 3, 3, 1.
    const seven = gridTiles.concat([{ id: 'x7' }])
    const l = tileGridLayout({ tiles: seven, ...GRID, pitchYFrac: 0.1 })

    expect(l.tiles[3]).toMatchObject({ col: 0, row: 1 })
    expect(l.tiles[6]).toMatchObject({ col: 0, row: 2 })
    expect(l.tiles[6].x).toBeCloseTo(375, 6) // same column as tile 0
    expect(l.tiles[6].y).toBeCloseTo(631.49976, 6) // y0 + 2 × (0.1 × 1080)
  })

  it('is deterministic for the same inputs', () => {
    expect(JSON.stringify(tileGridLayout({ tiles: gridTiles, ...GRID })))
      .toBe(JSON.stringify(tileGridLayout({ tiles: gridTiles, ...GRID })))
  })
})

describe('tileGridLayout — matrix arrangement (3×3 normalized, src 57–60s)', () => {
  it('respects per-tile wFrac/hFrac overrides over the grid defaults', () => {
    const l = tileGridLayout({ tiles: matrixTiles, ...MATRIX })

    // Hand-computed at 1920×1080:
    //   defaults: w = 0.052 × 1920 = 99.84, h = 0.093 × 1080 = 100.44
    //   x0 = 0.411719 × 1920 = 790.50048, y0 = 0.344444 × 1080 = 371.99952
    //   col pitch = 0.093 × 1920 = 178.56, row pitch = 0.191 × 1080 = 206.28
    const first = l.tiles[0]
    expect(first.x).toBeCloseTo(790.50048, 6)
    expect(first.y).toBeCloseTo(371.99952, 6)
    expect(first.w).toBeCloseTo(99.84, 6)
    expect(first.h).toBeCloseTo(100.44, 6)
    expect(first.tone).toBe('plain')

    // Tile 4 sits at col 1, row 1 with the enlarged 84×98px cell:
    //   x = (0.411719 + 0.093) × 1920 = 969.06048
    //   y = (0.344444 + 0.191) × 1080 = 578.27952
    //   w = 0.065625 × 1920 = 126, h = 0.136111 × 1080 = 146.99988
    const enlarged = l.tiles[4]
    expect(enlarged.x).toBeCloseTo(969.06048, 6)
    expect(enlarged.y).toBeCloseTo(578.27952, 6)
    expect(enlarged.w).toBeCloseTo(126, 6)
    expect(enlarged.h).toBeCloseTo(146.99988, 6)
    expect(enlarged.tone).toBe('alt')

    // Tile 8 lands at col 2, row 2, still default-sized:
    //   x = 790.50048 + 2 × 178.56 = 1147.62048
    //   y = 371.99952 + 2 × 206.28 = 784.55952
    const last = l.tiles[8]
    expect(last.col).toBe(2)
    expect(last.row).toBe(2)
    expect(last.x).toBeCloseTo(1147.62048, 6)
    expect(last.y).toBeCloseTo(784.55952, 6)
    expect(last.tone).toBe('tertiary')
  })
})

describe('tileGridLayout — flat-row arrangement (8 tiles, src 107–110s)', () => {
  it('lays one row of eight tiles sharing the measured y', () => {
    const l = tileGridLayout({ tiles: rowTiles, ...ROW })

    // Hand-computed at 1920×1080:
    //   w = 0.0395 × 1920 = 75.84,  h = 0.0764 × 1080 = 82.512
    //   x0 = 0.261719 × 1920 = 502.50048, y0 = 0.545833 × 1080 = 589.49964
    //   col pitch = 0.0625 × 1920 = 120
    expect(l.tiles).toHaveLength(8)
    l.tiles.forEach((tile, i) => {
      expect(tile.row, `tile ${i} row`).toBe(0)
      expect(tile.col, `tile ${i} col`).toBe(i)
      expect(tile.y, `tile ${i} y`).toBeCloseTo(589.49964, 6)
      expect(tile.w, `tile ${i} w`).toBeCloseTo(75.84, 6)
      expect(tile.h, `tile ${i} h`).toBeCloseTo(82.512, 6)
    })
    expect(l.tiles[0].x).toBeCloseTo(502.50048, 6)
    // x = (0.261719 + 7 × 0.0625) × 1920 = 1342.50048
    expect(l.tiles[7].x).toBeCloseTo(1342.50048, 6)
    // The two groups of four read as accent (cyan) then tertiary (teal).
    expect(l.tiles.map((t) => t.tone)).toEqual([
      'accent', 'accent', 'accent', 'accent',
      'tertiary', 'tertiary', 'tertiary', 'tertiary',
    ])
  })
})

describe('hexPath — pointed left-right hexagon (t=33.0s anatomy)', () => {
  it('draws left/right points at mid-height and flat top/bottom edges', () => {
    // Half-width points, quarter-width top/bottom edges, exact centering.
    expect(hexPath(100, 100, 40, 20)).toBe(
      'M 80 100 L 90 90 L 110 90 L 120 100 L 110 110 L 90 110 Z',
    )
  })

  it('rejects non-positive dimensions — never render blank', () => {
    expect(() => hexPath(0, 0, 0, 10)).toThrow(RangeError)
    expect(() => hexPath(0, 0, 10, -1)).toThrow(RangeError)
  })
})

describe('tileTrackLines — per-row connector track behind the tiles', () => {
  it('draws one line per occupied row through the tile centers with measured overhangs', () => {
    const l = tileGridLayout({ tiles: gridTiles, ...GRID })
    const lines = tileTrackLines(l.tiles)

    expect(lines).toHaveLength(2)
    // Row 0: track starts ~56px left of tile 0 (0.47 × 119.04) and runs ~84px
    // past tile 2's right edge (0.70 × 119.04) — the t=33.0s reads.
    expect(lines[0].x1).toBeCloseTo(375 - 0.47 * 119.04, 6)
    expect(lines[0].x2).toBeCloseTo(1550.04 + 0.7 * 119.04, 6)
    expect(lines[0].y).toBeCloseTo(415.49976 + 104.76 / 2, 6)
    expect(lines[1].y).toBeCloseTo(752.99976 + 104.76 / 2, 6)
  })

  it('collapses a single-row arrangement to one line and handles empty input', () => {
    const row = tileGridLayout({ tiles: rowTiles, ...ROW })
    expect(tileTrackLines(row.tiles)).toHaveLength(1)
    expect(tileTrackLines([])).toEqual([])
  })
})

describe('tileGridLayout — validation (RangeError, never render blank)', () => {
  it('rejects an empty tile list and bad column counts', () => {
    expect(() => tileGridLayout({ tiles: [], ...GRID })).toThrow(RangeError)
    expect(() => tileGridLayout({ tiles: gridTiles, ...GRID, cols: 0 })).toThrow(RangeError)
    expect(() => tileGridLayout({ tiles: gridTiles, ...GRID, cols: 2.5 })).toThrow(RangeError)
  })

  it('rejects out-of-range fractions — a typo like 12.0 throws, not explodes', () => {
    expect(() => tileGridLayout({ tiles: gridTiles, ...GRID, tileWFrac: 12 })).toThrow(RangeError)
    expect(() => tileGridLayout({ tiles: gridTiles, ...GRID, tileHFrac: -0.1 })).toThrow(RangeError)
    expect(() => tileGridLayout({ tiles: gridTiles, ...GRID, pitchXFrac: 1.1 })).toThrow(RangeError)
    expect(() => tileGridLayout({ tiles: gridTiles, ...GRID, pitchYFrac: -0.01 })).toThrow(RangeError)
    expect(() => tileGridLayout({ tiles: gridTiles, ...GRID, x0Frac: 12 })).toThrow(RangeError)
    expect(() => tileGridLayout({ tiles: gridTiles, ...GRID, y0Frac: -0.01 })).toThrow(RangeError)
  })

  it('rejects out-of-range per-tile overrides', () => {
    const bad: Tile[] = [{ id: 'big', wFrac: 12 }]
    expect(() => tileGridLayout({ tiles: bad, ...GRID })).toThrow(RangeError)
  })

  it('rejects a grid whose resolved rects run off the canvas', () => {
    // x0 0.9 + two 0.275-pitch columns pushes tile 2 to x 2784px on a 1920 canvas.
    const wide = { ...GRID, x0Frac: 0.9 }
    expect(() => tileGridLayout({ tiles: gridTiles, ...wide })).toThrow(RangeError)
  })
})

describe('TileGrid component', () => {
  const props: TileGridProps = { tiles: gridTiles, ...GRID }

  it('renders one group per tile with the measured canvas and an accessible name', () => {
    const wrapper = mountTileGrid(props)

    expect(wrapper.find('svg.tilegrid').exists()).toBe(true)
    expect(wrapper.findAll('.sf-tg-tile')).toHaveLength(6)
    expect(wrapper.find('svg.tilegrid').attributes('viewBox')).toBe('0 0 1920 1080')
    expect(wrapper.find('svg.tilegrid').attributes('role')).toBe('img')
    expect(wrapper.find('svg.tilegrid').attributes('aria-label')).toBe('6-tile grid diagram')
  })

  it('consumes exactly six clicks in row-major order — one per tile', () => {
    const clicks: number[] = []
    mountTileGrid(props, clicks)

    expect(clicks).toEqual([1, 2, 3, 4, 5, 6])
  })

  it('applies the tone system: measured hex core plus palette roles and status/plain constants', () => {
    const wrapper = mountTileGrid({
      tiles: matrixTiles,
      ...MATRIX,
      palette: { accentAlt: '#f7ba20', accentTertiary: '#1cd798' },
    })
    const hexes = wrapper.findAll('.sf-tg-hex')

    expect(hexes[0].attributes('fill')).toBe('#f5f4f7') // plain → chrome white
    expect(hexes[1].attributes('fill')).toBe('#1ed0e8') // accent → measured hex core
    expect(hexes[3].attributes('fill')).toBe('#f7ba20') // alt → accentAlt (amber)
    expect(hexes[4].attributes('fill')).toBe('#f7ba20') // enlarged alt cell
    expect(hexes[6].attributes('fill')).toBe('#e5413f') // status → measured red
    expect(hexes[8].attributes('fill')).toBe('#1cd798') // tertiary → teal
  })

  it('renders the hex core at the measured fraction of each tile box', () => {
    const wrapper = mountTileGrid({ tiles: matrixTiles, ...MATRIX })
    const hexes = wrapper.findAll('.sf-tg-hex')

    // Tile 0: cx = 790.50048 + 99.84/2 = 840.42048, cy = 371.99952 + 100.44/2 = 422.21952;
    // core w = 99.84 × 0.825 = 82.368, h = 100.44 × 0.93 = 93.4092.
    expect(hexes[0].attributes('d')).toBe(hexPath(840.42048, 422.21952, 82.368, 93.4092))
    // Enlarged alt cell: cx = 969.06048 + 63 = 1032.06048, cy = 578.27952 + 73.49994 = 651.77946.
    expect(hexes[4].attributes('d')).toBe(hexPath(1032.06048, 651.77946, 126 * 0.825, 146.99988 * 0.93))
  })

  it('draws a glow halo per tile (blurred copy, measured opacity) behind the core', () => {
    const wrapper = mountTileGrid(props)
    const halos = wrapper.findAll('.sf-tg-halo')

    expect(halos).toHaveLength(6)
    expect(halos[0].attributes('opacity')).toBe('0.6')
    expect(halos[0].attributes('filter')).toMatch(/^url\(#.*\)$/)
    // Same geometry as the core it glows for.
    expect(halos[0].attributes('d')).toBe(wrapper.findAll('.sf-tg-hex')[0].attributes('d'))
    // The filter def carries the measured blur in the shared id namespace.
    const filter = wrapper.find('filter')
    expect(filter.exists()).toBe(true)
    expect(filter.find('feGaussianBlur').attributes('stdDeviation')).toBe('18')
  })

  it('draws the connector track behind the tiles (#353642, ~12px, through tile centers)', () => {
    const wrapper = mountTileGrid(props)
    const lines = wrapper.findAll('.sf-tg-track')

    expect(lines).toHaveLength(2)
    expect(lines[0].attributes('stroke')).toBe('#353642')
    expect(Number(lines[0].attributes('stroke-width'))).toBeCloseTo(12, 6)
    expect(Number(lines[0].attributes('y1'))).toBeCloseTo(467.87976, 6)
    expect(Number(lines[0].attributes('x1'))).toBeCloseTo(319.0512, 6)
    expect(Number(lines[0].attributes('x2'))).toBeCloseTo(1633.368, 6)
  })

  it('marks the first tile with the lit-vertex sheen on the track', () => {
    const wrapper = mountTileGrid(props)
    const sheens = wrapper.findAll('.sf-tg-sheen')

    expect(sheens).toHaveLength(1)
    expect(sheens[0].attributes('stroke')).toBe('#a0ecfb')
    // Dash ends 16px left of tile 0's hex point (cx − w/2 = 385.416).
    expect(Number(sheens[0].attributes('x2'))).toBeCloseTo(385.416 - 16, 6)
    expect(Number(sheens[0].attributes('x1'))).toBeCloseTo(385.416 - 16 - 50, 6)
    expect(Number(sheens[0].attributes('y1'))).toBeCloseTo(467.87976, 6)
  })

  it('honors per-tile size overrides in the rendered hexes', () => {
    const wrapper = mountTileGrid({ tiles: matrixTiles, ...MATRIX })
    const hexes = wrapper.findAll('.sf-tg-hex')

    // The enlarged alt cell (126 × 146.99988 box) renders a proportionally
    // larger hexagon than its default-sized siblings (99.84 × 100.44).
    const w = (d: string): number => {
      const xs = d.match(/-?[\d.]+/g)?.filter((_, i) => i % 2 === 0).map(Number) ?? []
      return Math.max(...xs) - Math.min(...xs)
    }
    // hexPath rounds vertices to 2 decimals, so read the width at that precision.
    expect(w(hexes[4].attributes('d'))).toBeCloseTo(126 * 0.825, 1)
    expect(w(hexes[0].attributes('d'))).toBeCloseTo(99.84 * 0.825, 1)
  })

  it('renders the grid tiles with ~40px near-black icons centered in the hexes', () => {
    const wrapper = mountTileGrid(props)
    const icons = wrapper.findAll('.sf-tg-icon')

    expect(icons).toHaveLength(6)
    // Measured t=33.0s: near-black strokes on the cyan hex (the wave-1 teal
    // read rendered sub-visible contrast).
    expect(icons[0].attributes('stroke')).toBe('#000000')
    // Tile 0: hex center (434.52, 467.87976), size 40 → translate (414.52, 447.8798),
    // scale 40/24 = 1.6667 → rendered stroke 2 × 1.6667 ≈ 3.3px.
    expect(icons[0].attributes('transform')).toContain('414.52')
    expect(icons[0].attributes('transform')).toContain('447.8798')
    expect(icons[0].attributes('transform')).toContain('scale(1.6667)')
  })

  it('renders the below-tile double label rows: cyan mini over white label', () => {
    const wrapper = mountTileGrid(props)
    const minis = wrapper.findAll('.sf-tg-mini')
    const labels = wrapper.findAll('.sf-tg-label')

    expect(minis).toHaveLength(6)
    expect(labels).toHaveLength(6)
    expect(minis[0].text()).toBe('01')
    expect(minis[0].attributes('fill')).toBe('#20d0e8')
    // Both rows centered under the hex, measured offsets below the box bottom.
    expect(Number(minis[0].attributes('y'))).toBeCloseTo(415.49976 + 104.76 + 25.5, 6)
    expect(labels[0].text()).toBe('EXTRACT')
    expect(labels[0].attributes('fill')).toBe('#a6a8ae')
    expect(Number(labels[0].attributes('y'))).toBeCloseTo(415.49976 + 104.76 + 55.5, 6)
    expect(Number(labels[0].attributes('font-size'))).toBeCloseTo(16, 6)
  })

  it('renders the fallback icon and warns on an unknown icon key', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
    try {
      const bad: Tile[] = [{ id: 'x', icon: 'not-a-key' }]
      const wrapper = mountTileGrid({ tiles: bad, ...GRID })

      expect(warn).toHaveBeenCalledWith(expect.stringContaining('not-a-key'))
      // ICON_FALLBACK (Lucide circle-help) geometry must be in the markup.
      expect(wrapper.find('.sf-tg-icon').html()).toContain('r="10"')
    } finally {
      warn.mockRestore()
    }
  })

  it('colors plain-tile icons dark in palette iconStroke and skips its label', () => {
    const wrapper = mountTileGrid({ tiles: matrixTiles, ...MATRIX })
    const groups = wrapper.findAll('.sf-tg-tile')

    expect(groups[0].find('.sf-tg-icon').attributes('stroke')).toBe('#000000')
    expect(groups[0].find('.sf-tg-label').exists()).toBe(false) // icon-only tile
  })

  it('carries the measured timing constants, the hidden-state snap, and the reduced-motion block in its rendered styles', () => {
    mountTileGrid(props)

    const css = Array.from(document.querySelectorAll('style'))
      .map((tag) => tag.textContent ?? '')
      .join('\n')

    expect(css).toContain('150ms') // tile fade
    expect(css).toContain('120ms') // tile rise
    // Backward nav snaps: the hidden state disables transitions entirely.
    const hiddenRule = css.match(/\.sf-tg-tile\.slidev-vclick-hidden[^{]*\{[^}]*\}/)?.[0] ?? ''
    expect(hiddenRule).toContain('transition: none')
    expect(css).toContain('prefers-reduced-motion') // transitions disabled, instant state
  })

  it('renders the two-tone header: white title + chrome-green titleAccent tail', () => {
    const wrapper = mountTileGrid({ ...props, title: 'DATA', titleAccent: 'TOOLING' })
    const header = wrapper.find('text.header')

    expect(header.text()).toContain('DATA')
    expect(header.html()).toContain('#66fb00')
  })
})
