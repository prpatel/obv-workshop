/**
 * Palette contract for StepFlow-style diagrams.
 *
 * All default values are pixel-measured from the reference screenshot
 * (stepflow-visual-spec, art_0VvS7Nb1 §2–§7) and ship as the `cyanOnBlack`
 * preset — never hardcoded in component bodies.
 */

export interface StepFlowPalette {
  /** Disc fill and step-title color (measured #23d7ed). */
  accent: string
  /** Connector track color (measured #40424e). */
  track: string
  /** Dim caption text under step titles (measured #a6a8ae). */
  subtext: string
  /** Icon stroke inside discs; must contrast with the accent (measured #000000). */
  iconStroke: string
  /**
   * Optional second accent for status colors. Family recordings show amber
   * #f7ba20, red #e5413f, and orange #f85721 across the diagram family (§13).
   */
  accentAlt?: string
  /**
   * Optional third accent for the family recordings' teal-green (#1cd798 in
   * v4, #20c88c in v5). Deep-merged like `glow` — an override wins — and when
   * omitted, consumers fall back to `accent`:
   * `palette.accentTertiary ?? palette.accent`.
   */
  accentTertiary?: string
  /** Glow behind each disc: peak luminance fraction at the disc edge, falloff in px (§4: 0.28 peak, invisible by ~60px). */
  glow: { peak: number; spread: number }
}

/** Override shape accepted by `resolvePalette`: any top-level field, with `glow` deep-mergeable per channel. */
export type StepFlowPaletteOverride = Partial<Omit<StepFlowPalette, 'glow'>> & {
  glow?: Partial<StepFlowPalette['glow']>
}

/** Measured house style — the default preset. */
export const cyanOnBlack: StepFlowPalette = {
  accent: '#23d7ed',
  track: '#40424e',
  subtext: '#a6a8ae',
  iconStroke: '#000000',
  glow: { peak: 0.28, spread: 60 },
}

/** Orange vertical-spine variant observed in the family recordings (§13). */
export const orangeSpine: StepFlowPalette = {
  accent: '#f85721',
  track: '#40424e',
  subtext: '#a6a8ae',
  iconStroke: '#000000',
  glow: { peak: 0.28, spread: 60 },
}

/** Amber accent with a red status alternate, per the node-edge family recording (§13). */
export const statusAmber: StepFlowPalette = {
  accent: '#f7ba20',
  accentAlt: '#e5413f',
  track: '#40424e',
  subtext: '#a6a8ae',
  iconStroke: '#000000',
  glow: { peak: 0.28, spread: 60 },
}

/**
 * Cool blue of the staircase/network family recordings, normalized to the
 * measured v1 accent #349aea (blue-family hues read #27b5db–#2692bd across
 * v5/v7 — one family at different balances, §13), with the locked amber as
 * the alternate. Shape matches the locked default preset exactly; the black
 * background is the deck canvas, not a palette field.
 */
export const chainBlue: StepFlowPalette = {
  accent: '#349aea',
  accentAlt: '#f7ba20',
  track: '#40424e',
  subtext: '#a6a8ae',
  iconStroke: '#000000',
  glow: { peak: 0.28, spread: 60 },
}

/**
 * Cool step blue measured across the wave-2 family frames (art_iHm120ov:
 * ColumnRow column 1 #3698fb, SegmentTimeline node 1 #3699fa). Ship-endpoint
 * constant like the other measured accents — never hardcoded at call sites.
 */
export const stepBlue = '#3698fb'

/**
 * Merge a partial palette over the measured default.
 *
 * - No argument returns the full `cyanOnBlack` preset.
 * - `glow` is deep-merged: overriding `peak` keeps the default `spread`, and vice versa.
 * - Optional top-level accents (`accentAlt`, `accentTertiary`) follow the same
 *   override-wins rule; an omitted `accentTertiary` stays undefined and the
 *   consumer falls back to `accent`.
 * - Unknown keys are tolerated (no validation, no throw); typed fields always resolve.
 * - Pure: no DOM access, no mutation of the presets or the override.
 */
export function resolvePalette(override?: StepFlowPaletteOverride): StepFlowPalette {
  return {
    ...cyanOnBlack,
    ...override,
    glow: { ...cyanOnBlack.glow, ...override?.glow },
  }
}
