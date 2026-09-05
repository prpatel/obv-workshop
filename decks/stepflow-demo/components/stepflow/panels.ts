/**
 * Panel mosaic contract + pure layout math for StackPanels diagrams
 * (settled-truth rebuild — user8 seg08 91–94s, packet fl_bRELEFpX, measured on
 * settled_full.png 2560×1440; every fraction below ×0.75 = the 1920×1080 stage).
 *
 * The recording settles as a tightly-abutting 2×2 color mosaic directly on the
 * pure-black canvas — no white plate, no gutters: blue TL, cyan TR, amber BL,
 * green BR. A thin white perimeter frame (~6px stage) hugs the mosaic on all
 * four sides with open corners, and each panel cuts its outer corner (~17px
 * 45° chamfer) revealing a white patch behind. Near-black icon+title groups
 * sit centered in each panel; a gray caption row sits under the mosaic; the
 * static chrome header ('One' white + 'unified environment' green) and the
 * olive top-right source mark ride above. The four recorded inks ride the
 * palette's four accent slots: the slide seeds `accent: '#3799fb'`,
 * `accentAlt: '#1fd0ea'`, `accentTertiary: '#f9bb1f'`,
 * `accentQuaternary: '#1ed798'`.
 *
 * Every position is a fraction of the 1920×1080 stage, so the same numbers
 * serve the deck canvas and any future embed. All functions here are pure and
 * deterministic: same inputs produce equal output, and nothing touches the DOM
 * (SSR-safe build).
 */

/** A measured ink/geometry box, as fractions of the 1920×1080 stage. */
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
   * legacy top band) or the recording's ~300ms full-size opacity fade.
   * Default 'fade'.
   */
  bandReveal?: 'sweep' | 'fade'
  /** All-caps panel title, rendered dark and centered on its measured box. */
  title?: string
  /** 45° corner cut on the panel's outer corner, showing frame white. */
  cutCorner?: CutCorner
  /** Icon registry key rendered dark left of the title (stepflow/icons.ts). */
  icon?: string
  /** Icon container box (ink-fit compensated — see STACKPANELS_SEED). */
  iconBox?: MeasuredBox
  /** Measured title ink box (seg08 settled frame). */
  titleBox?: MeasuredBox
}

/** Content that travels with the slide as one prop. */
export interface StackPanelsData {
  panels: StackPanel[]
  /** Caption line under the composition; lands on the closing beat. */
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
 * The legacy light-trace white plate behind the mosaic (art_mkVNxsft §1.2):
 * bbox x222.2–1604.7, y356.9–979.9 @1080, fill #f5f5f5, 1px #989898 border on
 * left/right/bottom (the sheet sees no top border line), and ~10px 45° panel
 * corner cuts showing the plate through the fills. Unused by the seg08
 * settled-truth variant (which renders plateless on black) but kept for the
 * light-trace demo.
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
 * SVG path for a panel rect with one 45° corner cut (the seg08 recording cuts
 * each panel's outer corner ~17px @1080, revealing the white frame patch
 * behind). A `cut` of 0 degenerates to the plain rect outline (`corner` is
 * irrelevant then). Throws RangeError when the cut would overrun the rect — a
 * panel that cannot render its chamfer should fail loudly at authoring time.
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
 * The seg08 settled-frame header (measured on settled_1080.png at 1:1):
 * 'One' white #f5f4f7 core ink x481–638 (cap band y107–161 → cap 54),
 * 'unified environment' chrome-green #66fc00 core ink x660–1443 (cap band
 * y98–161 → cap 63), shared baseline ≈y161.5 @1080.
 */
export const STACKPANELS_HEADER = {
  lead: 'One',
  accent: 'unified environment',
  // Pin boxes are bearing-compensated against rendered MAD, not raw ink
  // extents: textLength=spacing redistributes ADVANCES, so interior glyph
  // centers shift with box width. Lead uses the tight 480+160 box (its
  // compressed tracking keeps 'One' centers nearest the reference's
  // proportional spacing); the accent takes the wider 655+798 box. Measured
  // reference ink: lead x481–638, accent x660–1443 @1080.
  leadBox: { xFrac: 480 / 1920, wFrac: 160 / 1920 },
  accentBox: { xFrac: 655 / 1920, wFrac: 798 / 1920 },
  leadCapHeight: 54,
  accentCapHeight: 63,
  baseline: 161.5,
} as const

/**
 * The seg08 settled-frame caption (measured on settled_1080.png at 1:1):
 * 'ONE ENVIRONMENT' gray ink x769–1143 y907–928 (core cap ≈21.5 @1080; box
 * y906 h22 pins the baseline at 928), centered under the mosaic (center
 * x≈956.7). The measured gray #636363 lands through the slide's
 * `captionColor` prop — the legacy light-trace variant keeps its white caption.
 */
export const STACKPANELS_CAPTION = {
  text: 'ONE ENVIRONMENT',
  box: { xFrac: 768.8 / 1920, yFrac: 906 / 1080, wFrac: 375.7 / 1920, hFrac: 22 / 1080 },
} as const

/**
 * The seg08 settled-frame olive top-right source mark (measured on
 * settled_1080.png: ink x1849–1900, y17–62 @1080, median ink #7fa33c). The
 * glyph is unidentifiable at 53×46 px, so the mark ships as the faithful ink
 * raster (alpha-unpremultiplied against the black canvas it sits on) — the
 * render is pixel-identical to the reference over black. Static from frame 1;
 * the slide opts in with the `badge` prop.
 */
export const STACKPANELS_BADGE = {
  box: { xFrac: 1849 / 1920, yFrac: 17 / 1080, wFrac: 53 / 1920, hFrac: 46 / 1080 },
  dataUri: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAADUAAAAuCAYAAACI91EoAAAWj0lEQVR42p2aa3Rd1XXvf3PtfV56S7YsW/j9ipEMGGTqJAYspw7FQAkkPeKmJEBGG/uO0RFoQ8blJh/uOaf0tqUXQh1ob1AZzQhpMohOIIXwDrlILo5jkMAYy4D8wMYP2bJlvc9zrzXvh3Nky+DmQ9cYZ+yz99ln7fVfc87//K+5tvBfaaomDgKwCczFbqkH6Qd3J1TOgsYILMzDkW/C4Th4KyE0AhZgoHzc8oPNhhUrYHKrpvtbWdqMtm1Bu+mmnY0WEHjdQLsDVEAgCaTQji4hnQbSKjMGev67iF70ernFy0BaQJpB6ssAR0BPgG0Grx5kE8ythE0GNlH6T9HC0yPw2/+A0fngVYBpAOedQJof+rbCMeAo6e/vtC3l5z3OD2Q1UbeAXxrYzD2b76E1S+ylHuYUajjDmIxqR1wgDYD/n1hCENEyIAGmQV4ABmAleNVgfJAAdAGYNVDTANd58McAFtIChxxcG4I7Z8PGmyE9Abt3g/oMea3N++CG0wqjcCrDfGAHSB9QzxuhQ4ywVV4bW64vR3jpXqrf1eK8bzJ+pIkcIAwNnZt8+T0WkU9YR1pA2oHTYOaDlwddBjIO3mkI6sFrgbUCNwoscfDGWfj5XJFT0/2Mqa6ogK0CSx3szsEvhjl8aDHPCGdO+pzZAY2BpGf9s6SJ2jQ5B2vlAa5vaOeuOdXUzatlqGqY9Ec93Lb/Ph6ZhH2obFHoA/r+U1ASnwHqk3ETBu8yMIdA01D4KwivghVVcKOBqxQGJuDnDSLvAXSpegD9oCkRB5BRvSYEXxZYULS8lvf4zQMPMXjzd7Cj/GP0YZJyCeuq1rK4eQlvr5xH05oQoSbLlAsRI0ylC1O9q5f3XtzP4dNxORG00qfQeVFQEi99SJddrfW821EJxgPJgauHcBU0huALUoqbUw5eOAbbl0A+UZ6YaSClx6hIOWb3qlatoHCrwb8OXMgy9sIBvvdmhvdq8pxeUsGaK4TYfMfxaIHAKBiLkTC+ekSZRbPJc+bpR9j5UiJ5guZBivRdBNRMEgCYSQTxw4cNniccPFjkqvZaKoJ1+P6tOFeJMc8Br4nIMIAmEiaZTJoU2AuIp9wSqmYa7JQenR+i7isw8bk8h7MFPpgYo6c+x/FQnqMaUKBAxAVUOKgzHoF4WFdPQ4VQ///eJfuz9X1duR0PEsRbup3MnMFpMkiWQbQDWfDmgGsDpSOt3L8+wqWNlxP2bgeaUN1LMf+kVFYe064uj5GlhtcOOdL9iiZLhDvDUucnEUmQKFsy5QAmR3RNJMrX/LBdcsa8Hpvgd6cK7DUFBvwso6bAJFli4jGbEI22ltNRYcXu7VQ+2UPr0CY2BFu4Tz/JfhfEzkDJSnoFhADHE7csIubfgJFrsO4QgT4ileG3pi1DPC4kk7bMrJRZUz7FrOW8kSKlJaslTJIkIrIb2D06qjeEald11NK0LMdlZ8Z5LhNwUh1jxjApiodjSgMKTghXFpGKNM/pBIfNFrC+qpoZbPcpl+sQKUypNgIbqQjdCExSdJ0cPLtTVjdNaiJxfiIk+SmLpEAvxqwJlFQZ7z5SkgTVLvWS/Whdnbzc+RPd237T/D+eXX/ZBmVqjs+RCWGwmOFDhSmEggQoISoqIkQqoEebaJc07UbKbmdmzmh36eCvhKqagDUVPrcZCFO0vYzknpWmqpMKQuJ1j1R3CUi89fzA0/2lGNLkhWg6MKQxQPQzs2B8GDsIWSjHnJbGsIUtfqd0FgFO6ptLq1jSUSC/NstI7AyvTQYMFC3HrOFgOMwXp/YR+tF/46HeOA+bOOPWdHRguruRvr5zlpKNIsEVMGeW5Wsx3/13hYPAwxL2H5emqpPapWG6usw5QBe09IUAZzpBC0ocB2Q+HCY7uK0kj17VBc39et0KQBC0k07bpXGPDerPlauPVsnsB89S9Xc+83fXclldFa3RCM0WjELIr6C5EuCzLKAFMC0tyOluTFvbuad7XapeDC41wnVFsp0PkPxHEfkgkVA/Hlcv2Q/0x6U0+CT0NnuQhk2vGdJpJ+kOSyJVdrPkeYBJlLRY1Zf8E/qrK5+4Z/2se1VqL2XLTY1ccy3C9CRpnLTb0IPfUkP1Iogsl9r+Rx6r+36B8LMxlsXCLDSKWocJ+8Qq27jZW02tad057qGq3o8SGlVNhAeUSK9SMaBEcrrnNqunf6a6swmgq0s9VTWJDeq/uE0jqnEPNFaDNoAa0BCo9/pHGu3aro2glTRpJRvURxEUaWvTEGhYdW/D+/rwXz+pa7d06erv7tXk/ap76lUphUP5/vOsrNKrvSGA1/Wjz36sO17dq6mf9OqVP35Hb+p6Xi+7+/P679Wv6GClDnwr4gPcneyz0CrHu1UGBght2UIAgcMZzeY/G1VVD5IqpJQeFXow3Ju2tBGM38/kU/ErWjrZP3IHiSUhCldfunhBaJeafevIvYJsASmFVlUCpQ83Tp1YMmYRLZtyRIafIPl/MmsTk5t646ZDxKKYaauVzCx6iC6nqrKDj0MGwccTh1EPCFGo+SK1XhijQCmeSnKthWeeILz7RWqS9xA9ddSvGB0xlQN7MCI4SGovbT4g/5xm1SHt/aPrexdUp+MPty7hlm9/lSs3VtP/BxmOLd5GcvsEvct/RXYxSLB8OSFa8Oe0oiB2EhEwYSVrBa8YZYnf2Yf206LTvD9tqWkCSQMiol7JLfAwqvjG4eERrloJ/irmKMfHxT99GlNiv5v4wd8kC7vev3usabMUmhhiarQxP3QMHzCCqHaoA7Gf/5PvLR1n/51/TsXLWd6OTpGtnaBQ0c2evZtZ3xBldMEp3p63jkYADhygANAVB1Gkk5Hc7dTk8xx4M0Sru5Ntd9XrY/90P6lBBSmtkxKgyd+zqHOAiCOXr6CpegXzYw4yVC82Zmkc/T5xuZsj9C3+RtWCzbcvD/PVG3IcuDRWlyuEQucTaHu6dBTqxZIrNLOqbS5myTin99fhh5s5FJ1N5pI434jHiJ56m/91pEvxnlSp2KYSTiKCoM3k8o7as1GWTXSSfApGJ79C6Jv38UqFgJYWfufXOzNbaEbuEZwVjDE01Hl8aI6wUxn+vPgPkpYsh+QfePAPatErPc42B9i6AierPU7aWfMWu+n+J8v9+Sw0OSZOWmzRYyIziX5Uz+LqleyvCnHCxqgYnsOK8WvkN4X39IEF81j3lRxnDs3nT19IJNRsFSnu0L/rHiZU+ZRw6ut659Or2Pq1m7mt+mGYgqTOlCTlxY8KEMFXQXSaJi3GE/zwIG95DbQCcfwjdEQf4tabcvz6SwEFwgR2jKKbx3zjc7Vd0IhLJJAUaC9YASxT9ZVcf+IYY7squLbO8GNtZtXCKN5kjOUf9/LLNzbw57fv0+9Fj/HD3kqkepDJQQS7Tzs8kpj1fPfd0lDxboIDcR5PtTBXUT2vfgWYTgldaZm2FOcAhUUJFLLhGvKNaY4OTh3GN//A1a01rGyfAjJM2Rx5CgSSx5oAK3U12LIDM+0WRdyYR4P8Gw++v5mbn61iYa6WyysNDadC1J/9EXv27WP3D2NcvnAZf9O+kwd++hR/v0dRSZ8ThnEpp2oFSAs2JSl3MUXP742sQB2B8bBVNRz0es9iTA1XLgmw1TmweUImwEgeI/YcC2U0lSqp7GQiCYpY/LEQFWY5MVFR59NyRJj13nZ27/4lPU8vhtNx+dd3nqLnh0fJ7Orkfw49SpeWmD2hJUDpCyWH4s1YLUgaDF0Y4q1CPD4jZ83U4CJKgMMSRqvqmPKHhhDfAxxHQ4JX8AgrKIbMtPUVI6arS70OxKVKhjJZ8rsjLMwuYsl4OQW9H0c/TG/e7vMxSiOh+X9F+LvCEZBDbNMIh/F4X4VqlK60LUuq6fqH+8Tyx4uDEKcoHR2qYGhpQTo69IAepzTGacEqCp6JMq92lO1ufBzjWyxK3pT61fOeNuNbvB9JxJGUiEtoQjawdQhhMKGEFTxQt3YrZlEW4WqEw8DbaDyBB+od6sdl56Gt62AIXA9p4sRJMyTQ40p6VlTOp6biOaKYmrqEj98ZZ9FVDbnkt6P7mdCq8n0OsDgRnHi4qho+8OdXEPiKOqVgS6W36c+nWxIlWZoglyQJiaSBVFCasG7z0Ift+p0e7NLTSH0MnZdF2sHRDu10Q/tpBx0OFJG0pkvRJI9xqvIPNVPTgFbMgaXAYWDMYr/mFb3f4oImFq+eAhv4RBdEyA5Mc6JDxBIgWHGY2gaC8IbV5Pwc2RGhaspgI9PYP7Vi3IcCmpbzl+KkHCB0b4DkYr+7h0If6P2thOLXYLiHAun+kGxcXTg366f/vVoaZeIj/ahuLnOv8gitKpU9yAtumcX81oNDwB0e3iAhdpHnS/ih9UhIQY9O03wBBIw6HJaCl2UocpiMu5sT+OMcGK9jad7hYkpBFYsrxeynW7x8SOMElBQKPU6rhyXFEqeqJglBvA8P8JLx1YHmR64iHJwkcKvxq5apnvgFVGlAtNIVmBcovcUcJ2IxVqoyqR6LfB8Ffs7k5GwisWbUjSNMQXhSUdUy2TvyOJwUMRQZja6CCk7syPjD7J6sZnlecMZhy2540UoyHWmxF67MdXpxGajqHCCfEhlLqtYBG5PBuCVMM5B1vn+NwTwF80ZFpAj8amJYK4BIdpJM2GfIOHz1yeITAjYTi83BMkk+u5eYL4qLzczHjgIOD8F3jvHYXEJVnG484++nOLEAzQqfLi8rCE6dpMUqGlLVpcAsIAZ8DNwCzBOR76jqOuAUqm8BUYe7zfhhB2//JaxcYUr1m9p8nuWqXQMQ19FhbDiM9X2sMTgvxFqUtyF4B/ylWO93/Gb/B1x6PEbtQvXrs1mPxqulvFJWMgKzgQbrMxGr4Iqa//vT9lDZJL7VixdmP4GRLwJ/BtQCmfK1RlW9FggTBHMQUSaxxpkz4J2AK68Umb0LBv8NwqsjES4X6bAi4lDOBEXyRw8yXCzwYW6KtP8cz4mEfp2Ef5GIvMuNKwss2TjOticnRFYXtJQ8z1fBcOIoqIeGfBorV8zCmQCsEnPnAX3C9TJZPadK4MfAu6ViKwWgAZgA1lMohAikWTOF6/DsDTiXKRT8n0D42qKObYZFd4FmhoZ4oTwcOTLAvkyB96+6Tk5X1/FMdYPs6e5HSus3jGrCJ5HwZGaeQfVCreuAAgoRn/rqTW1Y/yQUPObmLe+LwagQRcmIAxFCOlmYVQSVZBIvlZKJqawGkzliJszCGp8aO8VTsXq+gEWxwedBIwSFN7Ch3r+9Ofzht18xP4tEavQEY7/rpzZzYwe2tAEBa9ZzFhjekFB/chBZWqnhjc8TkEJRoRU0nsRpCsO+fQIwwYmgiog1zFVLVCwBAeMCsQgUqvij/yHmAFhLhSuBN6UJYhQli0OQGjwFPp/8SURVxRlGCiE0CPDzll9UNMgbwE4CewJrHyXe2Sn1Ve9IdaS/dQ5aG5WBqHBgkdSO3thBUM56QgKhC6ULelrRvk249Pby7xtKOy3903VDBTbVm5KgjYUck6GAIwYMjkAcOVGKEhD4rM6J/xFYJaozZVjAuDgyzhF4oUaaBBlsg8L1fF1yjqEsmJ++Td9t9UR6H9cQ+/dvZ8UKIyJZ/daLEb3/dZ+BapGtBKoq3d143d24VOqcGwnJJNB6oav3x3VGXnStYDrBtNHG2q2lklkMqbVMRPJ85AEBKI4clogE5IQlJ53/Mdgsk6MRprlCGWe5nMW3lZyKKtH7jujQ82+QfVVERm54Ud9obcZ/eAB5vo/C/Z24tawsKhj91rYIjz5oeXSOQouDNhG5QHGVc3rKQUKg/0JFnpw+L1Vu/4kN0kOPQ3rdi1PMb634eJNSvHWCs2N5ikWHlEQwnoCzUebVYNfEfCCw5Ed8RD0Ei3WGrBb4gAkiBVhWGWP1n21k0foPivrsql/zxstryCzfRvjmedh+UFUVOjqER+8NSoNtPZ+pL0qp59hLEyCp6WJmubaeICEpSWoPEtysVDyWY3Ms8sH1eQ5cMsXx3BTvTgUcdwbxoSRzihSdoa6a6JKYD2iYwlgFYkuS1hmPglgOyBRnNGDPeJ5srpLaJXN8774zmyOfO6vBMyslui8FbHlcQ0mwqXTalsRtq6ZLgM5tB30KXAdCC0oS9qUR4iU220C7aaeblKQCNGX28qurG1j05YrISNso+zPjvDyW5bgrctoEjIShAoOoQXEUrKGihvqmqMzT4xV/z10tlzL6l4J4iu/OoiaEJ1E8QrhAUPWJuAa+XB2jpdpj0cTJs0tffW0X2++9kf3LwYRb0H2lWJihOsRdUBUqpfPz5wl4PSkmCSRJsFFSAcCvD+plaxZxPd7JzxU5Hp7ih8U8g1MFCiZD4FkCFKseOTJYcmBqiDCXlnxA8TGfE80Umt8djbDAFil4FmvCVGGwWlLBzgiqSuBNsTOT42AmzPxIfcO1f3r75prP3qqhpxex7EUEC+oltLwpcNEcLtN5RgDZ0I1U0ys90uZtRHI7dPecBXi3RNjzRcvRpixHjxY5M5HhhFgK4kA9rJYSbiA+gXoEnsEBPg7r5ckZv20Q5jUvchFQR8EVyfshqrQU24aAQAQjHoGb5APx2I9HqOgxeKyKK+ujrPiLQQ6vO6PHn71M5K2UlDbU9mmHpGXaagk5TwCioGbLFkxfH6yVtcWvf11r7v+eXj+XoRsDDi3J8e7EFK8eKzKSd+AXiYkSEocTD88p1oCVUAmKGKw4rHX4ksf3/KDtHvsf1A03UuyLcskaj0xEiRg9p68CAUURsVRrwKgoo8bxClPszEZozNTyF5fXUdm6X5/f8SannrlD5BCK6dK413Fui0e0TBBmyxZMZ6cUQUV16uqA4LYihStO8lhhig+Hcxx3AVPOozpkqC3LB1GDuFJHnhN8EQJVAjWICbPIL1J/eILTZwXtCtMdNw+0115yPZtujXHpVVnOeI5ASsnYneNkR7a8JaiqBBohcDGwMb5UiDG7OkJtvbJgPEP+lV/y/C/uk/vOohv8BN0uWZY2JYoXPXJSl14ym1vEO/yFgJzkGJkc4hE3Sd7LglGcehQdIIZqJ6gIiiUvDgQcFeDGcTJFOBzhksxhdj7xGOveFLo0XJ8mNtIl+btpbbyVtZef5cNapVimWe/cejjLmIEoUInDo5lJmUcOn1WmgnA+TLPUsXVeNU0bFDMYYLoaeWk70mHRLg/psNte1Mgdn+OrVZX8YSRUlCIv7Jli99lxToVG+HnFMDXhHHMjSkyFU0YYkggLnSHAI6tF8lKKHyP1xIJTFO0prD1Aze6/ZXhX29rDUxJX9VpA0qTNPkYUtjrYIBto5zM0S4ScWc4KaogJLKbAsIETwCADxGQPTQA0AcuYpfCguYu/vmQOi74cJXalhYMF+NlZODYH2nz4E6BaoScDr2VgImDMDqNuN7u5jGpdxoSM4wuMUUstSpWOM/kJ6hljFzV+M2dzUd6xQ9xh64iaUXJOUDUJuk037XwGZATkG/vL3LUCYoeRiIeEPYRm8E8izC11e6r8mdlq2GEMUVvNArOOOVeFSu9WfMbBiECTg548vHQEPoqBZ0ELQ7jjruSeTUDTJzttuki9z6GvNuPaD5fOFy8ulRw6QYXynm+89C6RmX5ZamYHVSCx8rXIjN/mf+JBx0ovjpRL08gAFNdDzSxYZ2BFAG8NwO7/DbkExHIXyifaTp4U5s7VT1WcL15Wn3ndzjz//w19xOi8wulaAAAAAElFTkSuQmCC',
} as const

/**
 * The seg08 settled-frame white perimeter frame + corner patches (measured).
 * Four ~6px white bars hug the mosaic with open corners, drawn clockwise from
 * the top-left at the recording's 2.133–2.533s perimeter pass (all four land
 * on the last panel click at 1.2s, hence the delays): top (L→R), right (T→B),
 * bottom (R→L), left (B→T). Each patch is a white square sitting exactly
 * behind a panel's outer chamfer — the cut reveals it as a triangle. The
 * chamfer leg doubles as the dark variant's panel cut (17/1080).
 */
export interface FrameSegment {
  id: 'top' | 'right' | 'bottom' | 'left'
  xFrac: number
  yFrac: number
  wFrac: number
  hFrac: number
  /** Delay after the last panel click, ms (recording: click4@1.2s + offset). */
  delayMs: number
}

export interface FramePatch {
  id: 'tl' | 'tr' | 'bl' | 'br'
  xFrac: number
  yFrac: number
  /** Delay after the last panel click, ms — rides its segment. */
  delayMs: number
}

export const STACKPANELS_FRAME = {
  color: '#f5f4f7',
  /** 45° chamfer leg on every panel's outer corner, fraction of stage height. */
  cutFrac: 17 / 1080,
  /** In-panel icon+title pass delay after the last panel click (2.133s − 1.2s). */
  labelDelayMs: 933,
  /** Caption delay after the last panel click (2.6s − 1.2s). */
  captionDelayMs: 1400,
  segments: [
    { id: 'top', xFrac: 406.5 / 1920, yFrac: 348 / 1080, wFrac: 1107 / 1920, hFrac: 6 / 1080, delayMs: 933 },
    { id: 'right', xFrac: 1518 / 1920, yFrac: 358.5 / 1080, wFrac: 6 / 1920, hFrac: 487.5 / 1080, delayMs: 1000 },
    { id: 'bottom', xFrac: 405 / 1920, yFrac: 849 / 1080, wFrac: 1110 / 1920, hFrac: 7.5 / 1080, delayMs: 1067 },
    { id: 'left', xFrac: 396 / 1920, yFrac: 358.5 / 1080, wFrac: 6 / 1920, hFrac: 488.3 / 1080, delayMs: 1200 },
  ] as FrameSegment[],
  patches: [
    { id: 'tl', xFrac: 402 / 1920, yFrac: 354 / 1080, delayMs: 933 },
    { id: 'tr', xFrac: 1501 / 1920, yFrac: 354 / 1080, delayMs: 1000 },
    { id: 'bl', xFrac: 402 / 1920, yFrac: 832 / 1080, delayMs: 1200 },
    { id: 'br', xFrac: 1501 / 1920, yFrac: 832 / 1080, delayMs: 1067 },
  ] as FramePatch[],
} as const

/**
 * The seg08 settled-frame mosaic (packet fl_bRELEFpX, settled_full.png) — the
 * demo slide's data source of truth and the fixture both test files mount.
 * Panel rects are the measured 2560×1440 bboxes ×0.75; panel order is the
 * recording's onset order (blue 0.067s, cyan 0.267s, amber 0.867s, green
 * 1.2s). Icon boxes are ink-fit-compensated containers: the measured
 * near-black ink extents divided by each lucide glyph's internal fill
 * fraction (re-measured against the settled-frame render), so the rendered
 * ink lands on the recording's ink. Title boxes are the measured ink extents.
 * Each panel cuts its outer corner: TL/TR/BL/BR respectively.
 */
export const STACKPANELS_SEED: StackPanel[] = [
  {
    id: 'blue', tone: 'accent', bandReveal: 'fade', cutCorner: 'tl',
    xFrac: 402 / 1920, yFrac: 354 / 1080, wFrac: 610.5 / 1920, hFrac: 247.5 / 1080,
    icon: 'dash-grid',
    iconBox: { xFrac: 533.04 / 1920, yFrac: 445.4 / 1080, wFrac: 73.92 / 1920, hFrac: 61.2 / 1080 },
    title: 'INGESTION',
    titleBox: { xFrac: 637.5 / 1920, yFrac: 462 / 1080, wFrac: 234.7 / 1920, hFrac: 30 / 1080 },
  },
  {
    id: 'cyan', tone: 'alt', bandReveal: 'fade', cutCorner: 'tr',
    xFrac: 1013.25 / 1920, yFrac: 354 / 1080, wFrac: 504.75 / 1920, hFrac: 247.5 / 1080,
    icon: 'filter',
    iconBox: { xFrac: 1098 / 1920, yFrac: 446.04 / 1080, wFrac: 66 / 1920, hFrac: 67.92 / 1080 },
    title: 'TRANSFORM',
    titleBox: { xFrac: 1197 / 1920, yFrac: 462 / 1080, wFrac: 237 / 1920, hFrac: 30 / 1080 },
  },
  {
    id: 'amber', tone: 'tertiary', bandReveal: 'fade', cutCorner: 'bl',
    xFrac: 402 / 1920, yFrac: 603 / 1080, wFrac: 426 / 1920, hFrac: 246 / 1080,
    icon: 'database',
    iconBox: { xFrac: 473.08 / 1920, yFrac: 693.16 / 1080, wFrac: 63.84 / 1920, hFrac: 67.68 / 1080 },
    title: 'STORAGE',
    titleBox: { xFrac: 571.5 / 1920, yFrac: 712.5 / 1080, wFrac: 181.5 / 1920, hFrac: 30 / 1080 },
  },
  {
    id: 'green', tone: 'quaternary', bandReveal: 'fade', cutCorner: 'br',
    xFrac: 828 / 1920, yFrac: 601.5 / 1080, wFrac: 690 / 1920, hFrac: 247.5 / 1080,
    icon: 'navigation-2',
    iconBox: { xFrac: 981.58 / 1920, yFrac: 713.62 / 1080, wFrac: 87.84 / 1920, hFrac: 35.76 / 1080 },
    title: 'MONITORING',
    titleBox: { xFrac: 1091 / 1920, yFrac: 712.5 / 1080, wFrac: 263.5 / 1920, hFrac: 30 / 1080 },
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
 * The re-paced click plan: one fade per panel plus a closing beat. Panel i
 * fades in on click i + 1 in data order — the measured seed replays the
 * recording's onsets (blue 0.067s, cyan 0.267s, amber 0.867s, green 1.2s).
 * The legacy light-trace variant lands caption + plate brighten on the extra
 * closing click; the seg08 dark-truth variant instead rides its late
 * annotation pass (frame, labels, caption) on the FINAL panel click via
 * `annotateOnLastPanel` — that click is the last `panelClicks` entry.
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
