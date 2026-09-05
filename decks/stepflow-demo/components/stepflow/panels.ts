/**
 * Panel mosaic contract + pure layout math for StackPanels diagrams
 * (exact-trace sheet art_mkVNxsft §1 — settled mosaic, native frame 440).
 *
 * The recording settles as a white plate (#f5f5f5, 1px #989898 border on
 * left/right/bottom) carrying a flush 2×2 color mosaic — blue TL, cyan TR,
 * amber BL, green BR — each fill with one 45° corner cut (~10px) showing plate
 * white, and a near-black icon+title group centered in each panel. The caption
 * row sits under the mosaic; the green panel is empty below its title. The
 * four recorded shades ride the palette's four accent slots: the slide seeds
 * `accent: '#3599fb'`, `accentAlt: '#1fd0ea'`, `accentTertiary: '#f9bc1d'`,
 * `accentQuaternary: '#1cd798'`.
 *
 * Every position is a fraction of the 1920×1080 stage, so the same numbers
 * serve the deck canvas and any future embed. All functions here are pure and
 * deterministic: same inputs produce equal output, and nothing touches the DOM
 * (SSR-safe build).
 */

/** A sheet-measured ink/geometry box, as fractions of the 1920×1080 stage. */
export interface MeasuredBox {
  xFrac: number
  yFrac: number
  wFrac: number
  hFrac: number
}

/** Which panel corner carries the 45° cut (the outer corner of the mosaic). */
export type CutCorner = 'tl' | 'tr' | 'bl' | 'br'

/** One panel of the mosaic. Positions/sizes are stage fractions. */
export interface StackPanel {
  /** Stable key — used for a11y labels and test selectors. */
  id: string
  /** Left edge as a fraction of stage width. */
  xFrac: number
  /** Top edge as a fraction of stage height. */
  yFrac: number
  /** Width as a fraction of stage width. */
  wFrac: number
  /** Height as a fraction of stage height. */
  hFrac: number
  /**
   * Color role resolved against the palette (`tertiary`/`quaternary` fall
   * back to `accent` when the override omits them).
   */
  tone: 'accent' | 'alt' | 'tertiary' | 'quaternary'
  /**
   * How the panel enters on its click: a left→right sweep fill (the stylized
   * legacy top band) or the recording's ~300ms full-size opacity fade
   * (art_mkVNxsft §1.3). Default 'fade'.
   */
  bandReveal?: 'sweep' | 'fade'
  /** All-caps panel title, rendered dark and centered per the sheet. */
  title?: string
  /** 45° corner cut on the panel's outer corner, showing plate white. */
  cutCorner?: CutCorner
  /** Icon registry key rendered dark left of the title (stepflow/icons.ts). */
  icon?: string
  /** Sheet-measured icon ink box (art_mkVNxsft §1.2). */
  iconBox?: MeasuredBox
  /** Sheet-measured title ink box (art_mkVNxsft §1.2). */
  titleBox?: MeasuredBox
}

/** Content that travels with the slide as one prop. */
export interface StackPanelsData {
  panels: StackPanel[]
  /** White caption line under the composition; lands on the closing beat. */
  caption?: string
}

/** A panel with its absolute stage rect resolved. */
export interface PanelRect extends Omit<StackPanel, 'xFrac' | 'yFrac' | 'wFrac' | 'hFrac'> {
  x: number
  y: number
  w: number
  h: number
}

export interface PanelsLayout {
  panels: PanelRect[]
  viewBox: { width: number; height: number }
}

/**
 * The settled-state white plate behind the mosaic (art_mkVNxsft §1.2): bbox
 * x222.2–1604.7, y356.9–979.9 @1080, fill #f5f5f5, 1px #989898 border on
 * left/right/bottom (the sheet sees no top border line), and ~10px 45° panel
 * corner cuts showing the plate through the fills.
 */
export interface PlateSpec extends MeasuredBox {
  fill: string
  border: string
  borderWidth: number
  /** 45° corner-cut leg, as a fraction of stage height (10/1080). */
  cutFrac: number
}

export const PLATE: PlateSpec = {
  xFrac: 222.2 / 1920,
  yFrac: 356.9 / 1080,
  wFrac: 1382.5 / 1920,
  hFrac: 623.0 / 1080,
  fill: '#f5f5f5',
  border: '#989898',
  borderWidth: 1,
  cutFrac: 10 / 1080,
}

/** The plate resolved to absolute stage units. */
export interface PlateLayout extends Omit<PlateSpec, 'xFrac' | 'yFrac' | 'wFrac' | 'hFrac' | 'cutFrac'> {
  x: number
  y: number
  w: number
  h: number
  cut: number
}

/**
 * Resolve the plate spec to absolute stage rects. Pure and SSR-safe:
 * arithmetic over the given viewBox (default 1920×1080), no DOM access.
 */
export function plateLayout(viewBox?: { width?: number; height?: number }): PlateLayout {
  const width = viewBox?.width ?? MEASURED.width
  const height = viewBox?.height ?? MEASURED.height
  const { xFrac, yFrac, wFrac, hFrac, cutFrac, ...style } = PLATE
  return {
    ...style,
    x: xFrac * width,
    y: yFrac * height,
    w: wFrac * width,
    h: hFrac * height,
    cut: cutFrac * height,
  }
}

/** Round a path coordinate to 1/10000 px so the rendered `d` stays readable. */
function coord(value: number): number {
  return Number(value.toFixed(4))
}

/**
 * SVG path for a panel rect with one 45° corner cut (art_mkVNxsft §1.2: ~10px
 * chamfers at each panel's outer corner, showing the plate white behind). A
 * `cut` of 0 degenerates to the plain rect outline (`corner` is irrelevant
 * then). Throws RangeError when the cut would overrun the rect — a panel that
 * cannot render its chamfer should fail loudly at authoring time.
 */
export function panelPath(
  rect: { x: number; y: number; w: number; h: number },
  cut: number,
  corner: CutCorner = 'tl',
): string {
  const { x, y, w, h } = rect
  if (!Number.isFinite(cut) || cut < 0) {
    throw new RangeError(`panelPath: cut must be a finite non-negative length, received ${cut}`)
  }
  if (cut > 0 && 2 * cut > Math.min(w, h)) {
    throw new RangeError(`panelPath: cut ${cut} overruns the ${w}×${h} rect`)
  }
  if (cut === 0) return `M ${coord(x)} ${coord(y)} H ${coord(x + w)} V ${coord(y + h)} H ${coord(x)} Z`
  switch (corner) {
    case 'tl': return `M ${coord(x + cut)} ${coord(y)} H ${coord(x + w)} V ${coord(y + h)} H ${coord(x)} V ${coord(y + cut)} Z`
    case 'tr': return `M ${coord(x)} ${coord(y)} H ${coord(x + w - cut)} L ${coord(x + w)} ${coord(y + cut)} V ${coord(y + h)} H ${coord(x)} Z`
    case 'bl': return `M ${coord(x)} ${coord(y)} H ${coord(x + w)} V ${coord(y + h)} H ${coord(x + cut)} L ${coord(x)} ${coord(y + h - cut)} Z`
    case 'br': return `M ${coord(x)} ${coord(y)} H ${coord(x + w)} V ${coord(y + h - cut)} L ${coord(x + w - cut)} ${coord(y + h)} H ${coord(x)} Z`
  }
}

/**
 * The sheet's measured header (art_mkVNxsft §1.2): 'One' white #f5f5f5 ink
/**
 * The seg08 settled-frame header (re-measured on the restart reference —
 * the restart video's header is smaller and lower than the v1-era sheet:
 * ink y98–162, x480–1444): 'One' white #f5f5f5 ink x480–640, 'unified
 * environment' green #66fc00 ink x662–1444, per-run caps scaled from the
 * settled read (42 / 64), shared baseline ≈y162 @1080.
 */
export const STACKPANELS_HEADER = {
  lead: 'One',
  accent: 'unified environment',
  leadBox: { xFrac: 480 / 1920, wFrac: 160 / 1920 },
  accentBox: { xFrac: 662 / 1920, wFrac: 782 / 1920 },
  leadCapHeight: 42,
  accentCapHeight: 64,
  baseline: 162.0,
} as const

/**
 * The sheet's measured caption (art_mkVNxsft §1.2): 'ONE ENVIRONMENT' white
 * #f5f5f5, ink x670.5–1147.0 y1036.6–1064.9 (cap 29.3 @1080), centered under
 * the mosaic (center x≈908.8, not canvas-centered).
 */
export const STACKPANELS_CAPTION = {
  text: 'ONE ENVIRONMENT',
  box: { xFrac: 670.5 / 1920, yFrac: 1036.6 / 1080, wFrac: 476.5 / 1920, hFrac: 29.3 / 1080 },
} as const

/**
 * The sheet's measured four-panel mosaic (art_mkVNxsft §1.2) — the demo
 * slide's data source of truth and the fixture both test files mount. Panel
 * rects are the sheet's 1080p bboxes; title boxes are the sheet's native ink
 * bboxes converted by the 2038→1920 (×0.94171) / 1144→1080 (×0.944055)
 * factors; icon boxes are the sheet's 1080p ink extents. The green panel is
 * empty below its title (the wave-1 secondary rows are gone), and each panel
 * cuts its outer corner: TL/TR/BL/BR respectively.
 */
export const STACKPANELS_SEED: StackPanel[] = [
  {
    id: 'blue', tone: 'accent', bandReveal: 'fade', cutCorner: 'tl',
    xFrac: 229.8 / 1920, yFrac: 364.4 / 1080, wFrac: 748.6 / 1920, hFrac: 301.2 / 1080,
    icon: 'dash-grid',
    iconBox: { xFrac: 398.3 / 1920, yFrac: 489.0 / 1080, wFrac: 74.4 / 1920, hFrac: 49.1 / 1080 },
    title: 'INGESTION',
    titleBox: {
      xFrac: (550 * 0.94171) / 1920, yFrac: (526 * 0.944055) / 1080,
      wFrac: (304 * 0.94171) / 1920, hFrac: (37 * 0.944055) / 1080,
    },
  },
  {
    id: 'cyan', tone: 'alt', bandReveal: 'fade', cutCorner: 'tr',
    xFrac: 981.3 / 1920, yFrac: 364.4 / 1080, wFrac: 615.0 / 1920, hFrac: 301.2 / 1080,
    icon: 'filter',
    iconBox: { xFrac: 1086.9 / 1920, yFrac: 482.4 / 1080, wFrac: 73.3 / 1920, hFrac: 72.7 / 1080 },
    title: 'TRANSFORM',
    titleBox: {
      xFrac: (1279 * 0.94171) / 1920, yFrac: (526 * 0.944055) / 1080,
      wFrac: (308 * 0.94171) / 1920, hFrac: (37 * 0.944055) / 1080,
    },
  },
  {
    id: 'amber', tone: 'tertiary', bandReveal: 'fade', cutCorner: 'bl',
    xFrac: 229.8 / 1920, yFrac: 670.3 / 1080, wFrac: 520.8 / 1920, hFrac: 301.1 / 1080,
    icon: 'database',
    iconBox: { xFrac: 323.0 / 1920, yFrac: 784.5 / 1080, wFrac: 64.0 / 1920, hFrac: 74.6 / 1080 },
    title: 'STORAGE',
    titleBox: {
      xFrac: (464 * 0.94171) / 1920, yFrac: (852 * 0.944055) / 1080,
      wFrac: (234 * 0.94171) / 1920, hFrac: (38 * 0.944055) / 1080,
    },
  },
  {
    id: 'green', tone: 'quaternary', bandReveal: 'fade', cutCorner: 'br',
    xFrac: 753.4 / 1920, yFrac: 668.7 / 1080, wFrac: 842.9 / 1920, hFrac: 302.7 / 1080,
    icon: 'navigation-2',
    iconBox: { xFrac: 958.7 / 1920, yFrac: 809.0 / 1080, wFrac: 70.5 / 1920, hFrac: 37.8 / 1080 },
    title: 'MONITORING',
    titleBox: {
      xFrac: (1141 * 0.94171) / 1920, yFrac: (852 * 0.944055) / 1080,
      wFrac: (342 * 0.94171) / 1920, hFrac: (38 * 0.944055) / 1080,
    },
  },
]

/** Measured default stage (the deck canvas). */
const MEASURED = { width: 1920, height: 1080 } as const

/**
 * Horizontal extent of the stylized legacy sweep fill, as a fraction of the
 * band's own width (the recording's sweep covered the full band, so 1).
 * Exported so the component and its tests share one number.
 */
export const SWEEP_FRAC = 1

function assertFraction(name: string, value: number, id: string): void {
  if (!Number.isFinite(value) || value < 0 || value > 1) {
    throw new RangeError(`panel "${id}": ${name} must be a finite fraction in [0, 1], received ${value}`)
  }
}

/**
 * Resolve panel fractions to absolute stage rects.
 *
 * Pure and SSR-safe: arithmetic over the given viewBox (default 1920×1080),
 * no DOM access. Throws RangeError on a fraction outside [0, 1] or a
 * non-positive extent — a panel that cannot render should fail loudly at
 * authoring time, not silently render off-stage.
 */
export function panelsLayout(
  panels: StackPanel[],
  viewBox?: { width?: number; height?: number },
): PanelsLayout {
  const width = viewBox?.width ?? MEASURED.width
  const height = viewBox?.height ?? MEASURED.height

  const rects: PanelRect[] = panels.map((panel) => {
    assertFraction('xFrac', panel.xFrac, panel.id)
    assertFraction('yFrac', panel.yFrac, panel.id)
    assertFraction('wFrac', panel.wFrac, panel.id)
    assertFraction('hFrac', panel.hFrac, panel.id)
    if (panel.wFrac <= 0 || panel.hFrac <= 0) {
      throw new RangeError(`panel "${panel.id}": extent must be positive, received ${panel.wFrac}×${panel.hFrac}`)
    }
    const { xFrac, yFrac, wFrac, hFrac, ...rest } = panel
    return { ...rest, x: xFrac * width, y: yFrac * height, w: wFrac * width, h: hFrac * height }
  })

  return { panels: rects, viewBox: { width, height } }
}

/**
 * The re-paced click plan (spec deviation: the recording is a continuous
 * auto-run; native v-clicks re-pace it to one fade per panel plus a closing
 * beat). Panel i fades in on click i + 1 in data order — TL→TR→BL→BR on the
 * measured seed; the caption and the plate's brighten to full land on the
 * final click. Total clicks = panels + 1 when a caption exists, otherwise
 * panels.
 */
export function revealPlan(
  panels: StackPanel[],
  hasCaption = false,
): { panelClicks: number[]; labelClick: number; totalClicks: number } {
  const panelClicks = panels.map((_, i) => i + 1)
  const labelClick = hasCaption ? panels.length + 1 : 0
  const totalClicks = hasCaption ? panels.length + 1 : panels.length
  return { panelClicks, labelClick, totalClicks }
}
