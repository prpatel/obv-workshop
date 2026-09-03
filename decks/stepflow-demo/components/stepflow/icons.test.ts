import { describe, expect, it } from 'vitest'
import { ICON_FALLBACK, iconPath } from './icons'

// Keys the demo deck renders (spec art_wPQf68dA §steps; visual mappings from
// stepflow-visual-spec §7–§8).
const DEMO_KEYS = [
  'git-branch',
  'square-terminal',
  'flask-conical',
  'braces',
  'rotate-cw',
  'server',
] as const

// Icons whose real Lucide geometry is path-based. `server` is drawn with
// <rect>/<line> shapes upstream, so '<path' is not part of its markup —
// the meaningful assertion for every icon is "at least one SVG shape element".
const PATH_BASED_KEYS = DEMO_KEYS.filter((key) => key !== 'server')

// Registered for the diagram-family components (spec art_3VsrSvLm) ahead of
// their first render — same shape-markup contract as the demo keys.
const FAMILY_KEYS = ['database', 'cloud'] as const

// Lucide markup lives in the 24x24 coordinate system as stroke-based shapes;
// whatever the exact element mix, it must be real shape markup, not text/empty.
const SHAPE_MARKUP = /<(path|circle|rect|line)\b/

describe('iconPath', () => {
  it.each(DEMO_KEYS)('resolves the demo key %s to non-empty shape markup', (key) => {
    const markup = iconPath(key)
    expect(markup).toBeTruthy()
    expect(markup!.trim()).toMatch(SHAPE_MARKUP)
  })

  it.each(PATH_BASED_KEYS)('resolves %s to path-based markup', (key) => {
    expect(iconPath(key)).toContain('<path')
  })

  it('returns undefined for an unknown key', () => {
    expect(iconPath('no-such-icon')).toBeUndefined()
  })

  it('is a pure lookup — same key, same output', () => {
    expect(iconPath('git-branch')).toBe(iconPath('git-branch'))
  })
})

describe('family registry keys', () => {
  it.each(FAMILY_KEYS)('resolves the family key %s to non-empty shape markup', (key) => {
    const markup = iconPath(key)
    expect(markup).toBeTruthy()
    expect(markup!.trim()).toMatch(SHAPE_MARKUP)
  })

  it('cloud is path-based; database mixes an ellipse with paths', () => {
    expect(iconPath('cloud')).toContain('<path')
    expect(iconPath('database')).toContain('<ellipse')
    expect(iconPath('database')).toContain('<path')
  })

  it('the consumer contract holds for the family keys too', () => {
    for (const key of FAMILY_KEYS) {
      expect(iconPath(key) ?? ICON_FALLBACK).toBeTruthy()
    }
  })
})

describe('ICON_FALLBACK', () => {
  it('is non-empty path-based markup', () => {
    expect(ICON_FALLBACK).toBeTruthy()
    expect(ICON_FALLBACK).toContain('<path')
  })
})

describe('consumer contract: iconPath(key) ?? ICON_FALLBACK', () => {
  it('never yields undefined, for any key', () => {
    const keys = [...DEMO_KEYS, 'no-such-icon', '', 'Git-Branch', 'git_branch ']
    for (const key of keys) {
      const markup = iconPath(key) ?? ICON_FALLBACK
      expect(markup, `key: ${JSON.stringify(key)}`).toBeTruthy()
      expect(markup.trim()).toMatch(SHAPE_MARKUP)
    }
  })
})
