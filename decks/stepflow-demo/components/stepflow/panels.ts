/**
 * Panel mosaic contract + pure layout math for StackPanels diagrams (family
 * blueprint F3, research art_0AzKGXnD — re-measured per the v4 recording
 * frames this session).
 *
 * The recording shows a four-panel mosaic on the black stage: a full-width top
 * band that sweeps in left→right, an amber sub-panel popping at bottom-left,
 * and a teal-green sub-panel fading in at bottom-right, with text labels
 * fading in last, stepped. The band's two recorded shades (blue #3599fb left,
 * cyan #1fd0ea right) ship as ONE `accent` band — the spec's locked read —
 * because the palette contract carries no fourth tone; see the README row.
 *
 * Every position is a fraction of the 1920×1080 stage, so the same numbers
 * serve the deck canvas and any future embed. All functions here are pure and
 * deterministic: same inputs produce equal output, and nothing touches the DOM
 * (SSR-safe build).
 */

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
  /** Color role resolved against the palette (`tertiary` falls back to `accent`). */
  tone: 'accent' | 'alt' | 'tertiary'
  /** White label rendered top-left inside the panel; fades on the label click. */
  title?: string
  /** Dark text rows inside the panel (the sub-panels in the recording). */
  rows?: string[]
  /**
   * How the panel enters on its click: a left→right sweep fill (the top band)
   * or a fade/scale pop (the sub-panels). Default 'pop'.
   */
  bandReveal?: 'sweep' | 'pop'
}

/** Content that travels with the slide as one prop. */
export interface StackPanelsData {
  panels: StackPanel[]
  /** White caption line under the composition; fades with the labels. */
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
 * Horizontal extent of the top band's sweep fill, as a fraction of the band's
 * own width. The recording's sweep covers the full band (settled sweep bbox
 * x240–1694 of the band x240–1701 at source scale), so the measured value is 1;
 * a smaller value would strand an unfilled strip at the band's right edge.
 * Exported so the component and its tests share one number.
 */
export const SWEEP_FRAC = 1

/** Measured default stage (the deck canvas). */
const MEASURED = { width: 1920, height: 1080 } as const

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
 * auto-run; native v-clicks re-pace it to one click per panel plus one label
 * click). Panel i reveals on click i + 1 in data order — the band must be
 * first to keep the sweep → pop → fade choreography; all text reveals together
 * on the final click. Total clicks = panels + 1 when any label exists,
 * otherwise panels.
 */
export function revealPlan(
  panels: StackPanel[],
  hasCaption = false,
): { panelClicks: number[]; labelClick: number; totalClicks: number } {
  const panelClicks = panels.map((_, i) => i + 1)
  const hasLabels = hasCaption || panels.some((p) => p.title || (p.rows && p.rows.length > 0))
  const labelClick = hasLabels ? panels.length + 1 : 0
  const totalClicks = labelClick > 0 ? panels.length + 1 : panels.length
  return { panelClicks, labelClick, totalClicks }
}
