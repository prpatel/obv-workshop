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
  // MilestoneLanes footer chip icon: the ref frame's teal ~36×45 chip at
  // (326,856) reads as a location pin (round head, bottom tail) — map-pin.
  'map-pin': `<path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z" />
  <circle cx="12" cy="10" r="3" />`,
  cloud: `<path d="M17.5 19H9a7 7 0 1 1 6.71-9h1.79a4.5 4.5 0 1 1 0 9Z" />`,
  // v7 hero tile icon (visual identification: person glyph — circular head
  // merged into a shoulder arch; user-round over user because the arch touches
  // the head in the recording crop).
  'user-round': `<circle cx="12" cy="8" r="5" />
  <path d="M20 21a8 8 0 0 0-16 0" />`,
  // TileGrid family keys (visual identification from the research crops is
  // low-confidence — the component's visible ICON_FALLBACK covers a wrong guess).
  cpu: `<path d="M12 20v2" />
  <path d="M12 2v2" />
  <path d="M17 20v2" />
  <path d="M17 2v2" />
  <path d="M2 12h2" />
  <path d="M2 17h2" />
  <path d="M2 7h2" />
  <path d="M20 12h2" />
  <path d="M20 17h2" />
  <path d="M20 7h2" />
  <path d="M7 20v2" />
  <path d="M7 2v2" />
  <rect x="4" y="4" width="16" height="16" rx="2" />
  <rect x="8" y="8" width="8" height="8" rx="1" />`,
  boxes: `<path d="M2.97 12.92A2 2 0 0 0 2 14.63v3.24a2 2 0 0 0 .97 1.71l3 1.8a2 2 0 0 0 2.06 0L12 19v-5.5l-5-3-4.03 2.42Z" />
  <path d="m7 16.5-4.74-2.85" />
  <path d="m7 16.5 5-3" />
  <path d="M7 16.5v5.17" />
  <path d="M12 13.5V19l3.97 2.38a2 2 0 0 0 2.06 0l3-1.8a2 2 0 0 0 .97-1.71v-3.24a2 2 0 0 0-.97-1.71L17 10.5l-5 3Z" />
  <path d="m17 16.5-5-3" />
  <path d="m17 16.5 4.74-2.85" />
  <path d="M17 16.5v5.17" />
  <path d="M7.97 4.42A2 2 0 0 0 7 6.13v4.37l5 3 5-3V6.13a2 2 0 0 0-.97-1.71l-3-1.8a2 2 0 0 0-2.06 0l-3 1.8Z" />
  <path d="M12 8 7.26 5.15" />
  <path d="m12 8 4.74-2.85" />
  <path d="M12 13.5V8" />`,
  layers: `<path d="M12.83 2.18a2 2 0 0 0-1.66 0L2.6 6.08a1 1 0 0 0 0 1.83l8.58 3.91a2 2 0 0 0 1.66 0l8.58-3.9a1 1 0 0 0 0-1.83z" />
  <path d="M2 12a1 1 0 0 0 .58.91l8.6 3.91a2 2 0 0 0 1.65 0l8.58-3.9A1 1 0 0 0 22 12" />
  <path d="M2 17a1 1 0 0 0 .58.91l8.6 3.91a2 2 0 0 0 1.65 0l8.58-3.9A1 1 0 0 0 22 17" />`,
  // v5 HexCluster right-hex icon (visual identification: bot-like glyph —
  // closest registry-safe match to the recorded centered-antenna head).
  bot: `<path d="M12 8V4H8" />
  <rect width="16" height="12" x="4" y="8" rx="2" />
  <path d="M2 14h2" />
  <path d="M20 14h2" />
  <path d="M15 13v2" />
  <path d="M9 13v2" />`,
  // StackPanels TRANSFORM glyph (art_mkVNxsft §1.2; visual identification from
  // the frame-440 crops: a stroke-outline funnel narrowing into a stem).
  filter: `<path d="M10 20a1 1 0 0 0 .553.895l2 1A1 1 0 0 0 14 21v-7a2 2 0 0 1 .517-1.341L21.74 4.67A1 1 0 0 0 21 3H3a1 1 0 0 0-.742 1.67l7.225 7.989A2 2 0 0 1 10 14z" />`,
  // StackPanels MONITORING glyph (art_mkVNxsft §1.2; visual identification
  // from the frame-440 crops: a north-pointing plane squished into a wide,
  // short box — the bottom notch merges into the center stroke at that scale).
  'navigation-2': `<polygon points="12 2 19 21 12 17 5 21 12 2" />`,
  // StackPanels INGESTION glyph (art_mkVNxsft §1.2 names it a "3×3 dash-grid
  // glyph") — sheet-traced nine-dash grid; no exact Lucide equivalent at
  // 1.40 (grip is nine dots, not dashes).
  'dash-grid': `<path d="M3 5h4" />
  <path d="M10 5h4" />
  <path d="M17 5h4" />
  <path d="M3 12h4" />
  <path d="M10 12h4" />
  <path d="M17 12h4" />
  <path d="M3 19h4" />
  <path d="M10 19h4" />
  <path d="M17 19h4" />`,
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


/**
 * v7 axis/tile marker glyph — traced, not Lucide. The VerticalSpine axis icon
 * and the HeroTile tile cutout are the same mark in the source recording: a
 * ring over a horizontal bar with two splayed legs (exact-trace sheet
 * art_mkVNxsft §3.2/§4.2; run-traced from the settled frames — ring outer
 * r≈27/inner r≈21, 40-wide bar, legs diverging to the box edges). Geometry
 * lives in its own 92×99.5-unit box (native source px), NOT the shared 24-box,
 * so consumers scale it with their own measured box. Strokes use currentColor;
 * the ink fills the box edge to edge.
 */
export const V7_MARKER_GLYPH = {
  width: 92,
  height: 99.5,
  markup: `<circle cx="46" cy="27.5" r="23.75" fill="none" stroke="currentColor" stroke-width="6.5" />
  <rect x="26" y="55" width="40" height="5.5" fill="currentColor" />
  <path d="M21 59 3 99.5" fill="none" stroke="currentColor" stroke-width="6.5" />
  <path d="M71 59 89 99.5" fill="none" stroke="currentColor" stroke-width="6.5" />`,
} as const
