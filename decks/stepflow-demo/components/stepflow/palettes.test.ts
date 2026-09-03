import { describe, expect, it } from 'vitest'
import { chainBlue, cyanOnBlack, orangeSpine, resolvePalette, statusAmber } from './palettes'
import type { StepFlowPalette, StepFlowPaletteOverride } from './palettes'

describe('presets', () => {
  it('cyanOnBlack deep-equals the measured reference literals', () => {
    expect(cyanOnBlack).toEqual({
      accent: '#23d7ed',
      track: '#40424e',
      subtext: '#a6a8ae',
      iconStroke: '#000000',
      glow: { peak: 0.28, spread: 60 },
    })
  })

  it('orangeSpine deep-equals the family-recording literals', () => {
    expect(orangeSpine).toEqual({
      accent: '#f85721',
      track: '#40424e',
      subtext: '#a6a8ae',
      iconStroke: '#000000',
      glow: { peak: 0.28, spread: 60 },
    })
  })

  it('statusAmber deep-equals the family-recording literals with the red accentAlt', () => {
    expect(statusAmber).toEqual({
      accent: '#f7ba20',
      accentAlt: '#e5413f',
      track: '#40424e',
      subtext: '#a6a8ae',
      iconStroke: '#000000',
      glow: { peak: 0.28, spread: 60 },
    })
  })

  it('chainBlue deep-equals the v1-measured literals with the locked amber alternate', () => {
    expect(chainBlue).toEqual({
      accent: '#349aea',
      accentAlt: '#f7ba20',
      track: '#40424e',
      subtext: '#a6a8ae',
      iconStroke: '#000000',
      glow: { peak: 0.28, spread: 60 },
    })
  })
})

describe('resolvePalette', () => {
  it('returns the full measured default with no arguments', () => {
    expect(resolvePalette()).toEqual(cyanOnBlack)
  })
  it('overriding accent only leaves every other field at the measured default', () => {
    expect(resolvePalette({ accent: '#ff0055' })).toEqual({ ...cyanOnBlack, accent: '#ff0055' })
  })

  it('overriding glow.peak preserves the default glow.spread', () => {
    expect(resolvePalette({ glow: { peak: 0.5 } }).glow).toEqual({ peak: 0.5, spread: 60 })
  })

  it('overriding glow.spread preserves the default glow.peak', () => {
    expect(resolvePalette({ glow: { spread: 120 } }).glow).toEqual({ peak: 0.28, spread: 120 })
  })

  it('does not throw or corrupt known fields when the override carries an unknown key', () => {
    const weird = { accent: '#00ff88', notARealPaletteKey: 'ignored' } as unknown as StepFlowPaletteOverride
    let result!: StepFlowPalette
    expect(() => {
      result = resolvePalette(weird)
    }).not.toThrow()
    // toMatchObject asserts every known field exactly while tolerating the
    // unknown key's harmless pass-through — the contract is "no corruption",
    // not runtime key stripping.
    expect(result).toMatchObject({ ...cyanOnBlack, accent: '#00ff88' })
  })

  it('resolves the complete chainBlue preset to itself over the measured default', () => {
    expect(resolvePalette(chainBlue)).toEqual(chainBlue)
  })

  it('passes an accentTertiary override through untouched', () => {
    expect(resolvePalette({ accentTertiary: '#1cd798' }).accentTertiary).toBe('#1cd798')
  })

  it('an accentTertiary override does not disturb the resolved accent', () => {
    expect(resolvePalette({ accentTertiary: '#1cd798' }).accent).toBe(cyanOnBlack.accent)
  })

  it('when omitted, accentTertiary stays undefined and consumers fall back to the resolved accent', () => {
    // Documented consumer contract: `palette.accentTertiary ?? palette.accent`.
    const resolved = resolvePalette()
    expect(resolved.accentTertiary).toBeUndefined()
    expect(resolved.accentTertiary ?? resolved.accent).toBe(cyanOnBlack.accent)
    // The fallback reads the RESOLVED accent, so an accent override flows into it.
    const overridden = resolvePalette({ accent: '#ff0055' })
    expect(overridden.accentTertiary ?? overridden.accent).toBe('#ff0055')
  })
})
