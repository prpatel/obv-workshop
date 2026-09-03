// Lucide icon registry for StepFlow — exact Lucide geometry, inlined as strings.
//
// Markup is copied verbatim from lucide-static@1.40.0 (a devDependency used only
// as the copying source — there is no runtime dependency and no network fetch at
// render time). ISC License — Copyright (c) 2026 Lucide Icons and Contributors.
// Upstream files: node_modules/lucide-static/icons/<name>.svg
//
// Each value is the CHILDREN of the upstream <svg>, not the whole file. The host
// <svg> in StepFlow.vue carries the shared stroke conventions
// (viewBox="0 0 24 24", fill="none", stroke="currentColor", stroke-width="2",
// stroke-linecap="round", stroke-linejoin="round") so one `stroke` attribute
// recolors every icon inside a disc.
const ICON_REGISTRY: Record<string, string> = {
  'git-branch': `<path d="M15 6a9 9 0 0 0-9 9V3" />
  <circle cx="18" cy="6" r="3" />
  <circle cx="6" cy="18" r="3" />`,
  'square-terminal': `<path d="m7 11 2-2-2-2" />
  <path d="M11 13h4" />
  <rect width="18" height="18" x="3" y="3" rx="2" ry="2" />`,
  'flask-conical': `<path d="M14 2v6a2 2 0 0 0 .245.96l5.51 10.08A2 2 0 0 1 18 22H6a2 2 0 0 1-1.755-2.96l5.51-10.08A2 2 0 0 0 10 8V2" />
  <path d="M6.453 15h11.094" />
  <path d="M8.5 2h7" />`,
  braces: `<path d="M8 3H7a2 2 0 0 0-2 2v5a2 2 0 0 1-2 2 2 2 0 0 1 2 2v5c0 1.1.9 2 2 2h1" />
  <path d="M16 21h1a2 2 0 0 0 2-2v-5c0-1.1.9-2 2-2a2 2 0 0 1-2-2V5a2 2 0 0 0-2-2h-1" />`,
  'rotate-cw': `<path d="M21 12a9 9 0 1 1-9-9c2.52 0 4.93 1 6.74 2.74L21 8" />
  <path d="M21 3v5h-5" />`,
  server: `<rect width="20" height="8" x="2" y="2" rx="2" ry="2" />
  <rect width="20" height="8" x="2" y="14" rx="2" ry="2" />
  <line x1="6" x2="6.01" y1="6" y2="6" />
  <line x1="6" x2="6.01" y1="18" y2="18" />`,
  database: `<ellipse cx="12" cy="5" rx="9" ry="3" />
  <path d="M3 5V19A9 3 0 0 0 21 19V5" />
  <path d="M3 12A9 3 0 0 0 21 12" />`,
  cloud: `<path d="M17.5 19H9a7 7 0 1 1 6.71-9h1.79a4.5 4.5 0 1 1 0 9Z" />`,
  // v7 hero tile icon (visual identification: person glyph — circular head
  // merged into a shoulder arch; user-round over user because the arch touches
  // the head in the recording crop).
  'user-round': `<circle cx="12" cy="8" r="5" />
  <path d="M20 21a8 8 0 0 0-16 0" />`,
}

// Visible generic fallback (Lucide "circle-help") for unknown keys, in the same
// stroke conventions. The component contract is `iconPath(key) ?? ICON_FALLBACK`
// — never `undefined` into v-html.
export const ICON_FALLBACK: string = `<circle cx="12" cy="12" r="10" />
  <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" />
  <path d="M12 17h.01" />`

/**
 * Resolve an icon key to its Lucide inner SVG markup.
 *
 * Returns `undefined` for keys not in the registry — the caller decides how to
 * fall back (the component pairs this with `ICON_FALLBACK` and can warn on the
 * miss). Pure lookup: same key, same output, no side effects.
 */
export function iconPath(key: string): string | undefined {
  return ICON_REGISTRY[key]
}
