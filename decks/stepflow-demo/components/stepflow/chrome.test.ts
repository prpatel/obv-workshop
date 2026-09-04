import { describe, expect, it } from 'vitest'
import {
  CAP_HEIGHT_RATIO,
  CHROME_GREEN,
  TOP_RIGHT_BADGE,
  titleBaseline,
  titleFontSize,
} from './chrome'

describe('chrome constants', () => {
  it('keeps the titleAccent convention green a constant (#66fc00-class, never a palette field)', () => {
    expect(CHROME_GREEN).toBe('#66fb00')
  })

  it('documents the recording badge at the sheet-measured box x1850–1901, y19–61', () => {
    expect(TOP_RIGHT_BADGE.x).toBe(1850)
    expect(TOP_RIGHT_BADGE.y).toBe(19)
    expect(TOP_RIGHT_BADGE.x + TOP_RIGHT_BADGE.width).toBe(1901)
    expect(TOP_RIGHT_BADGE.y + TOP_RIGHT_BADGE.height).toBe(61)
    expect(TOP_RIGHT_BADGE.fill).toBe('#7ca424')
  })
})

describe('titleFontSize', () => {
  it('converts a sheet-measured cap height to font size via the measured glyph ratio', () => {
    expect(titleFontSize(78)).toBeCloseTo(78 / CAP_HEIGHT_RATIO, 10)
  })

  it('lands the sheet cap-height range (43-97px) in a sane font-size range', () => {
    expect(titleFontSize(43)).toBeGreaterThan(50)
    expect(titleFontSize(97)).toBeLessThan(135)
  })

  it('rejects non-positive cap heights', () => {
    expect(() => titleFontSize(0)).toThrow(RangeError)
    expect(() => titleFontSize(-3)).toThrow(RangeError)
  })
})

describe('titleBaseline', () => {
  it('sits the baseline at the bottom of the cap band (wave-2 consensus band y98–176, cap 78)', () => {
    expect(titleBaseline(98, 78)).toBe(176)
  })

  it('agrees with the team-D Title rows (cap top + cap height)', () => {
    expect(titleBaseline(49, 77)).toBe(126) // NodeEdge sheet: y49–126, cap 77
  })

  it('rejects negative band tops', () => {
    expect(() => titleBaseline(-1, 78)).toThrow(RangeError)
  })
})
