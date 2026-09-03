import { describe, expect, it } from 'vitest'
import { cyanOnBlack, orangeSpine, resolvePalette, statusAmber } from './palettes'
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
})
