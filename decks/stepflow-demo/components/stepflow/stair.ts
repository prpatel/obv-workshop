/**
 * Pure staircase layout for the StairChain diagram family — settled-truth
 * exact-trace edition (seg01 14–18s @2560×1440, reference packet fl_uREjeQ0N).
 *
 * The user's directive for this wave: work BACKWARDS from the settled end
 * state and reproduce it EXACTLY. Two consequences shape this module:
 *
 * 1. The ink is TRACED, not typeset. The title ("More like software
 *    engineering"), the amber '01' marker, the top-right olive emblem, and
 *    the six dark icon glyphs inside the blocks are SVG paths extracted from
 *    the settled frame at 2560×1440 and exported here in 1080p-canvas
 *    coordinates (SEG01_INK). No font, icon registry, or shared chrome can
 *    drift them — they are the frame's own ink.
 * 2. The glow-trace connector is DROPPED: the settled reference has no
 *    connector, and the user's exact-reproduction directive supersedes the
 *    earlier quiet-trace standing choice.
 *
 * Everything else is re-measured on THIS reference (settled_full.png):
 * six circles of ⌀ ≈ 117px spanning x 0.139–0.801 (blue 1–3, cyan 4–6),
 * slate wedge bands right of blocks 1–5, block-tinted captions centered
 * under each block, and a 7-beat choreography (amber marker, then one beat
 * per block) pinned to the packet's onsets.json. The t≥2.07s waves are small
 * annotation marks below the block band, not blocks — they carry no settled
 * ink and are not rendered.
 *
 * All functions here are pure and deterministic: same inputs produce
 * byte-identical output, and nothing touches the DOM (SSR-safe build).
 */

/** One step of the staircase (data contract). */
export interface StairStep {
  /** Stable key — used for a11y labels and test selectors. */
  id: string
  /** Accent caption centered below the block. */
  caption: string
  /**
   * Block tone role: `'accent'` (the blue block fill) or `'tertiary'`
   * (the cyan fill, `accentTertiary ?? accent`). The reference is two-tone —
   * blocks 1–3 blue #3799fb, blocks 4–6 cyan #1fd0ea. Default: `'accent'`.
   */
  tone?: 'accent' | 'tertiary'
  /**
   * Optional 1-based Slidev click override for this step's reveal. When
   * omitted, the component's positional walk applies (block k = click k).
   * The reference's build order is positional for seg01, but later packets
   * may interleave — geometry stays positional, only the click remaps.
   */
  click?: number
}

/** Layout knobs. Every field is optional; omitted fields fall back to the measured defaults. */
export interface StairOptions {
  /** ViewBox width in user units. Default 1920. */
  width?: number
  /** ViewBox height in user units. Default 1080. */
  height?: number
  /** Circle diameter as a fraction of height (seg01 measured 117/1080 — isotropic, so w = h). */
  blockFrac?: number
  /** Left-edge → left-edge gaps as fractions of width (family default walk). */
  gapsXFrac?: number[]
  /** Top-edge deltas as fractions of height (family default walk). */
  topDeltasYFrac?: number[]
  /** First block's left edge as a fraction of width (family default walk). */
  leftFrac?: number
  /** First block's top edge as a fraction of height (family default walk). */
  topFrac?: number
  /**
   * Explicit per-block left edges as fractions of width. When provided, the
   * leftFrac + gapsXFrac walk is bypassed for the x axis — block i sits at
   * leftsFrac[i] * width. seg01's re-measured rhythm is not a gap walk; see
   * SEG01_PLACEMENT. Must cover `count` entries; every entry must be a
   * fraction in [0, 1].
   */
  leftsFrac?: number[]
  /**
   * Explicit per-block top edges as fractions of height. When provided, the
   * topFrac + topDeltasYFrac walk is bypassed for the y axis. Must cover
   * `count` entries; every entry must be a fraction in [0, 1].
   */
  topsFrac?: number[]
}

/** The placement subset of {@link StairOptions} the component accepts as one prop. */
export type StairPlacement = Pick<StairOptions, 'blockFrac' | 'leftsFrac' | 'topsFrac'>

export interface StairBlock {
  /** Left edge (viewBox units). */
  x: number
  /** Top edge (viewBox units) — SVG rect convention. */
  y: number
  w: number
  h: number
  /** Step index along the staircase (0-based). */
  index: number
}

export interface StairLayout {
  blocks: StairBlock[]
  viewBox: { width: number; height: number }
}

/** One revealed dip: block `index` sits `dipPx` lower than its left neighbor. */
export interface StairDip {
  index: number
  dipPx: number
}

/** Measured constants — mapped px on the 1920×1080 canvas (family default walk). */
const MEASURED = {
  width: 1920,
  height: 1080,
  blockPx: 146,
  gapsX: [332, 324, 317, 315, 268],
  topDeltasY: [-65, 41, -122, -74, -73],
  left: 63,
  top: 758,
} as const

/**
 * seg01's re-measured block placement (settled_full.png connected components,
 * 2560×1440 source): six circles of ⌀ ≈ 117 native-canvas px (blockFrac
 * 117/1080); lefts 0.139063 / 0.280208 / 0.417708 (blue run) and 0.551563 /
 * 0.685938 / 0.799479 (cyan run); tops descend 0.625 → 0.405556 with block 3's
 * dip (top 0.607407 vs block 2's 0.576852 — +33px on the 1080 canvas).
 * Explicit fractions, not a gap walk: the re-measured pitch is not expressible
 * as a uniform rhythm.
 */
export const SEG01_PLACEMENT: StairPlacement = {
  blockFrac: 117 / 1080,
  leftsFrac: [267, 538, 802, 1059, 1317, 1535].map((v) => v / 1920),
  topsFrac: [675, 623, 656, 557, 497, 438].map((v) => v / 1080),
}

/**
 * Fractions must cover `count` entries and sit in [0, 1] — bad placement data
 * is a RangeError at the call site, never a silent off-canvas layout.
 */
function validateFractions(name: string, fracs: number[], count: number): void {
  if (fracs.length < count) {
    throw new RangeError(`${name} must cover ${count} blocks, received ${fracs.length}`)
  }
  fracs.forEach((f, i) => {
    if (!Number.isFinite(f) || f < 0 || f > 1) {
      throw new RangeError(`${name}[${i}] must be a fraction in [0, 1], received ${f}`)
    }
  })
}

export function stairLayout(count: number, opts?: StairOptions): StairLayout {
  if (!Number.isInteger(count) || count < 1) {
    throw new RangeError(`count must be a positive integer, received ${count}`)
  }

  const width = opts?.width ?? MEASURED.width
  const height = opts?.height ?? MEASURED.height
  const blockPx = (opts?.blockFrac ?? MEASURED.blockPx / MEASURED.height) * height
  const left = (opts?.leftFrac ?? MEASURED.left / MEASURED.width) * width
  const top = (opts?.topFrac ?? MEASURED.top / MEASURED.height) * height
  // Default gaps/deltas in canvas fractions; count > 6 repeats the last step.
  const gapsXFrac = opts?.gapsXFrac ?? MEASURED.gapsX.map((g) => g / MEASURED.width)
  const topDeltasYFrac = opts?.topDeltasYFrac ?? MEASURED.topDeltasY.map((d) => d / MEASURED.height)

  // Explicit placement (per-block fractions) bypasses the walk per axis —
  // the walk inputs are dead there, so they also skip coverage validation.
  const leftsFrac = opts?.leftsFrac
  const topsFrac = opts?.topsFrac

  if (leftsFrac) validateFractions('leftsFrac', leftsFrac, count)
  if (topsFrac) validateFractions('topsFrac', topsFrac, count)
  if (!leftsFrac && gapsXFrac.length < count - 1) {
    throw new RangeError(`gapsXFrac must cover ${count - 1} steps`)
  }
  if (!topsFrac && topDeltasYFrac.length < count - 1) {
    throw new RangeError(`topDeltasYFrac must cover ${count - 1} steps`)
  }

  const blocks: StairBlock[] = []
  let x = left
  let y = top
  for (let i = 0; i < count; i++) {
    if (leftsFrac) x = leftsFrac[i]! * width
    if (topsFrac) y = topsFrac[i]! * height
    blocks.push({ x, y, w: blockPx, h: blockPx, index: i })
    if (i < count - 1) {
      if (!leftsFrac) x += gapsXFrac[i]! * width
      if (!topsFrac) y += topDeltasYFrac[i]! * height
    }
  }

  return { blocks, viewBox: { width, height } }
}

/** Blocks whose top sits lower than their left neighbor — the dip sites. */
export function stairDips(blocks: StairBlock[]): StairDip[] {
  const dips: StairDip[] = []
  for (let i = 1; i < blocks.length; i++) {
    const dipPx = blocks[i]!.y - blocks[i - 1]!.y
    if (dipPx > 0) dips.push({ index: i, dipPx })
  }
  return dips
}

/** One exact-trace ink element: an SVG path in 1080p-canvas coordinates. */
export interface StairInk {
  /** Stable key — test selectors. */
  id: string
  /** Absolute-coordinate path data (M/L/Z subpaths, fill-rule evenodd). */
  d: string
  /** Flat fill sampled from the settled frame (colors.json modal hex). */
  fill: string
}

/** The seg01 traced-ink set, indexed by element. */
export interface Seg01Ink {
  /** White title lead "More like " — static plate ink. */
  titleWhite: StairInk
  /** Green title tail "software engineering" — static plate ink. */
  titleGreen: StairInk
  /** Amber '01' marker above block 1 — click 1 of the choreography. */
  amber01: StairInk
  /** Top-right olive emblem — static plate ink. */
  badge: StairInk
  /** Dark icon glyphs punched into each block, indexed by block position. */
  icons: StairInk[]
}

/** Measured slate wedge bands, as absolute canvas fractions (x, y, w, h). */
export interface Seg01Wedge {
  xFrac: number
  yFrac: number
  wFrac: number
  hFrac: number
}

/** Measured caption typography for the seg01 reference. */
export interface Seg01CaptionSpec {
  /** Caption baseline below the block's bottom edge, px on the 1080 canvas. */
  gapPx: number
  /** Font size as a fraction of canvas height (13.4px/char ÷ 0.6em mono advance). */
  sizeFrac: number
  /** Pinned ink widths per block index (px on the 1920 canvas), spacing-only. */
  textLengthsPx: number[]
  /** Caption ink under the blue blocks (core sample). */
  blue: string
  /** Caption ink under the cyan blocks (core sample). */
  cyan: string
}

/**
 * The seg01 settled-frame ink, traced from settled_full.png at 2560×1440 and
 * scaled ×0.75 into 1080p-canvas coordinates. Path fills are the packet's
 * modal hexes (colors.json): title white #f4f4f6, title green #66f605, amber
 * marker #eab72a, olive emblem #859e4e, near-black icon knockout #02050d.
 * Traces validate at IoU 0.86–0.96 against the source masks (titles/amber/
 * badge) and 0.55–0.81 for the icons (the 1080p mask threshold clips the
 * anti-aliased thin strokes the traces carry).
 */
export const SEG01_INK: Seg01Ink = {
  titleWhite: { id: 'title-white', fill: '#f4f4f6', d: 'M600.8 119.2L600.8 160.5L617.2 160.5L617.2 119.2ZM675.0 123.8L670.5 129.0L668.2 134.2L668.2 144.8L670.5 150.8L673.5 154.5L681.8 159.8L687.8 161.2L702.0 160.5L707.2 158.2L710.2 155.2L702.0 146.2L696.0 149.2L690.8 149.2L684.8 144.8L686.2 143.2L714.0 143.2L714.0 135.8L712.5 130.5L706.5 123.0L701.2 120.0L695.2 118.5L687.8 118.5L681.8 120.0ZM684.8 133.5L689.2 129.8L693.8 129.8L697.5 132.8L698.2 135.0L685.5 135.8ZM483.0 119.2L483.0 160.5L499.5 160.5L499.5 139.5L500.2 137.2L506.2 132.8L510.8 132.8L512.2 134.2L511.5 144.0L515.2 152.2L523.5 159.0L531.0 161.2L542.2 161.2L547.5 159.8L554.2 155.2L546.0 146.2L540.0 149.2L534.0 149.2L528.8 145.5L529.5 143.2L557.2 143.2L556.5 132.0L554.2 127.5L547.5 121.5L538.5 118.5L527.2 119.2L519.8 123.0L513.0 130.5L512.2 118.5L504.0 120.0L500.2 123.0L498.8 122.2L498.8 119.2ZM528.0 134.2L531.0 130.5L537.0 129.8L542.2 135.0L528.8 135.8ZM448.5 119.2L439.5 123.8L433.5 132.0L432.0 141.0L435.0 150.8L442.5 158.2L451.5 161.2L461.2 161.2L471.0 157.5L476.2 153.0L480.0 144.8L480.0 135.0L477.8 129.0L473.2 123.8L466.5 120.0L459.8 118.5ZM454.5 131.2L459.8 132.0L463.5 137.2L462.8 144.8L458.2 148.5L453.0 147.8L449.2 143.2L449.2 136.5ZM366.0 108.0L366.0 160.5L381.8 160.5L382.5 138.0L393.8 156.0L401.2 156.0L412.5 137.2L413.2 160.5L429.0 160.5L429.0 108.0L414.8 108.0L397.5 135.8L380.2 108.0ZM622.5 104.2L622.5 160.5L639.0 160.5L639.0 150.8L642.0 147.8L652.5 160.5L672.0 160.5L654.0 137.2L671.2 119.2L651.0 119.2L639.8 130.5L639.0 105.0ZM579.8 104.2L579.8 160.5L596.2 160.5L596.2 104.2ZM604.5 99.0L599.2 104.2L600.0 111.0L603.0 114.0L607.5 115.5L611.2 115.5L616.5 113.2L619.5 107.2L618.0 102.0L615.8 99.8L611.2 98.2Z' },
  titleGreen: { id: 'title-green', fill: '#66f605', d: 'M1439.2 119.2L1439.2 159.8L1455.8 160.5L1456.5 119.2ZM1243.5 119.2L1242.8 159.8L1260.0 160.5L1260.0 119.2ZM1524.8 118.5L1515.8 123.0L1512.0 127.5L1509.0 134.2L1509.0 143.2L1514.2 152.2L1520.2 156.8L1524.8 158.2L1534.5 158.2L1539.8 155.2L1540.5 158.2L1535.2 163.5L1525.5 163.5L1518.0 159.8L1512.0 171.0L1518.8 174.8L1526.2 176.2L1542.0 175.5L1548.0 173.2L1554.8 167.2L1557.8 159.0L1557.8 119.2L1542.0 119.2L1542.0 121.5L1540.5 122.2L1533.8 118.5ZM1533.0 131.2L1535.2 131.2L1540.5 135.0L1540.5 141.0L1538.2 144.0L1535.2 145.5L1529.2 144.0L1526.2 138.8L1528.5 133.5ZM1503.8 124.5L1500.8 121.5L1493.2 118.5L1485.8 118.5L1478.2 122.2L1476.8 119.2L1461.0 119.2L1461.0 160.5L1477.5 160.5L1478.2 136.5L1482.0 132.8L1486.5 132.8L1489.5 136.5L1489.5 160.5L1506.8 160.5L1506.8 132.0ZM1437.8 118.5L1428.8 120.0L1425.0 123.0L1424.2 119.2L1408.5 119.2L1408.5 160.5L1425.0 160.5L1425.8 137.2L1430.2 133.5L1437.8 133.5ZM1313.2 134.2L1312.5 143.2L1315.5 150.8L1322.2 157.5L1332.0 161.2L1344.8 161.2L1352.2 158.2L1356.0 155.2L1347.8 146.2L1343.2 148.5L1338.0 149.2L1332.8 147.0L1331.2 145.5L1332.0 144.0L1359.0 144.0L1360.5 145.5L1362.0 150.8L1368.8 157.5L1377.8 161.2L1391.2 161.2L1400.2 157.5L1402.5 154.5L1394.2 146.2L1389.8 148.5L1384.5 149.2L1380.0 147.8L1377.8 144.8L1406.2 143.2L1406.2 135.8L1401.8 126.0L1397.2 122.2L1388.2 118.5L1378.5 118.5L1368.8 122.2L1364.2 126.0L1359.8 134.2L1355.2 126.0L1347.0 120.0L1341.0 118.5L1332.0 118.5L1326.0 120.0L1320.0 123.8L1315.5 129.0ZM1377.0 134.2L1381.5 129.8L1385.2 129.8L1389.0 132.8L1388.2 135.8L1378.5 135.8ZM1330.5 135.0L1331.2 132.8L1335.0 129.8L1338.0 129.8L1341.0 131.2L1342.5 133.5L1341.8 135.8ZM1307.2 124.5L1302.0 120.0L1297.5 118.5L1289.2 118.5L1281.8 122.2L1280.2 119.2L1264.5 119.2L1264.5 160.5L1281.8 159.8L1281.8 137.2L1286.2 132.8L1290.0 132.8L1293.0 136.5L1293.0 160.5L1310.2 160.5L1310.2 131.2ZM1206.0 118.5L1198.5 121.5L1192.5 127.5L1189.5 136.5L1191.0 146.2L1192.5 149.2L1200.8 156.8L1205.2 158.2L1215.0 158.2L1220.2 156.0L1221.0 159.0L1218.8 162.0L1215.8 163.5L1206.0 163.5L1198.5 159.8L1192.5 171.0L1195.5 173.2L1206.8 176.2L1222.5 175.5L1230.8 171.8L1235.2 167.2L1238.2 160.5L1239.0 120.0L1222.5 119.2L1221.8 123.0L1218.8 120.0L1214.2 118.5ZM1213.5 131.2L1218.8 132.8L1221.8 136.5L1221.0 141.8L1215.8 145.5L1212.8 145.5L1207.5 140.2L1208.2 135.0ZM1184.2 124.5L1181.2 121.5L1174.5 118.5L1166.2 118.5L1158.8 122.2L1157.2 119.2L1141.5 119.2L1141.5 160.5L1158.0 160.5L1158.8 137.2L1163.2 132.8L1167.0 132.8L1170.0 136.5L1170.0 160.5L1187.2 160.5L1187.2 131.2ZM1101.0 123.0L1095.0 129.8L1092.8 137.2L1093.5 146.2L1096.5 152.2L1101.0 156.8L1111.5 161.2L1124.2 161.2L1129.5 159.8L1136.2 155.2L1128.0 146.2L1123.5 148.5L1117.5 149.2L1113.0 147.8L1111.5 145.5L1113.0 144.0L1139.2 144.0L1139.2 133.5L1136.2 127.5L1131.8 123.0L1121.2 118.5L1111.5 118.5ZM1110.8 133.5L1112.2 131.2L1115.2 129.8L1118.2 129.8L1122.0 132.0L1121.2 135.8L1111.5 135.8ZM998.2 120.0L998.2 160.5L1015.5 159.8L1015.5 139.5L1019.2 134.2L1023.0 132.8L1027.5 134.2L1026.8 141.8L1027.5 146.2L1030.5 152.2L1035.0 156.8L1045.5 161.2L1058.2 161.2L1063.5 159.8L1070.2 155.2L1062.0 146.2L1057.5 148.5L1051.5 149.2L1048.5 148.5L1045.5 145.5L1046.2 144.0L1073.2 143.2L1073.2 134.2L1070.2 127.5L1065.8 123.0L1060.5 120.0L1055.2 118.5L1045.5 118.5L1040.2 120.0L1035.0 123.0L1029.0 129.8L1028.2 118.5L1023.8 118.5L1015.5 122.2L1014.0 119.2ZM1044.8 133.5L1047.8 130.5L1052.2 129.8L1056.0 132.0L1056.8 135.0L1045.5 135.8ZM733.5 131.2L734.2 137.2L738.8 142.5L744.0 144.8L756.0 146.2L757.5 147.8L756.0 150.0L747.8 150.0L739.5 147.0L737.2 147.8L733.5 157.5L744.8 161.2L759.0 161.2L764.2 159.8L771.0 155.2L774.0 149.2L779.2 155.2L789.0 160.5L803.2 161.2L808.5 159.8L818.2 152.2L821.2 146.2L822.0 133.5L825.0 134.2L825.8 160.5L842.2 160.5L843.0 135.0L844.5 133.5L851.2 133.5L852.0 131.2L854.2 132.0L854.2 147.0L856.5 154.5L862.5 159.8L867.0 161.2L881.2 160.5L882.8 159.8L882.8 157.5L879.8 148.5L873.8 148.5L871.5 144.8L871.5 132.0L880.5 131.2L881.2 126.0L894.0 160.5L910.5 160.5L917.2 143.2L924.0 160.5L939.8 160.5L945.8 146.2L951.0 129.0L953.2 125.2L958.5 134.2L964.5 131.2L972.8 131.2L976.5 134.2L975.8 135.8L962.2 136.5L953.2 141.0L951.0 145.5L951.0 152.2L955.5 158.2L960.8 161.2L971.2 161.2L976.5 158.2L978.8 160.5L994.5 159.8L993.8 131.2L990.8 125.2L983.2 120.0L977.2 118.5L966.0 118.5L954.8 122.2L954.8 119.2L939.8 119.2L936.0 131.2L932.2 138.8L929.2 133.5L924.8 119.2L910.5 119.2L904.5 136.5L902.2 138.0L895.5 119.2L873.0 119.2L871.5 117.8L870.8 109.5L855.0 109.5L854.2 117.8L852.8 119.2L849.0 119.2L847.5 121.5L843.0 121.5L842.2 120.0L845.2 116.2L850.5 117.0L854.2 106.5L853.5 105.0L848.2 103.5L840.0 103.5L834.8 105.0L830.2 108.0L826.5 114.0L825.8 120.0L824.2 121.5L819.8 121.5L819.0 129.0L815.2 124.5L807.8 120.0L802.5 118.5L792.0 118.5L783.8 121.5L775.5 129.0L771.8 140.2L767.2 136.5L753.0 134.2L750.0 132.0L753.0 129.8L758.2 129.8L767.2 132.8L771.8 121.5L761.2 118.5L749.2 118.5L738.0 123.0L735.0 126.8ZM975.8 144.0L976.5 148.5L974.2 150.8L970.5 151.5L968.2 150.0L967.5 147.0L969.0 144.8ZM796.5 131.2L800.2 132.0L804.0 136.5L804.0 143.2L798.8 148.5L795.8 148.5L793.5 147.0L790.5 142.5L791.2 135.0ZM1440.0 100.5L1437.8 104.2L1437.8 108.8L1440.0 113.2L1445.2 115.5L1451.2 115.5L1455.8 113.2L1458.0 108.8L1458.0 104.2L1455.8 100.5L1450.5 98.2L1446.0 98.2ZM1242.0 102.8L1242.0 111.0L1243.5 113.2L1246.5 114.8L1256.2 114.8L1259.2 113.2L1261.5 109.5L1260.8 102.0L1257.0 99.0L1249.5 98.2L1245.0 99.8Z' },
  amber01: { id: 'amber-01', fill: '#eab72a', d: 'M266.2 499.5L265.5 504.0L267.0 505.5L270.0 505.5L271.5 504.0L270.8 499.5ZM311.2 484.5L303.0 490.5L303.0 497.2L309.8 492.0L312.0 492.0L312.0 513.8L303.0 514.5L303.0 520.5L326.2 520.5L326.2 514.5L318.8 513.8L318.8 484.5ZM264.0 484.5L258.0 489.0L256.5 493.5L256.5 512.2L258.0 516.0L261.0 519.0L266.2 521.2L270.8 521.2L275.2 519.8L279.8 514.5L280.5 494.2L279.0 489.0L276.0 486.0L273.0 484.5ZM267.0 489.8L270.0 489.8L273.8 492.8L273.8 512.2L270.0 515.2L267.0 515.2L263.2 512.2L263.2 493.5Z' },
  badge: { id: 'badge', fill: '#859e4e', d: 'M1876.5 43.5L1873.5 43.5L1872.0 45.0L1871.2 44.2L1871.2 46.5L1869.0 48.0L1867.5 45.0L1866.8 49.5L1864.5 45.0L1863.8 49.5L1865.2 47.2L1866.8 49.5L1871.2 47.2L1872.0 45.8L1873.5 48.0L1872.0 45.8L1873.5 43.5L1876.5 45.8L1875.8 47.2L1877.2 45.8L1875.8 44.2ZM1892.2 41.2L1889.2 41.2L1889.2 42.8L1887.0 45.0L1886.2 42.8L1887.8 41.2L1884.8 43.5L1883.2 42.8L1884.8 41.2L1878.8 42.8L1880.2 43.5L1881.0 46.5L1881.8 42.0L1882.5 45.8L1884.0 45.8L1884.0 43.5L1887.8 45.0L1890.8 42.8L1891.5 44.2ZM1871.2 31.5L1868.2 31.5L1869.0 35.2L1867.5 36.8L1866.8 32.2L1864.5 33.8L1863.0 32.2L1863.0 39.0L1863.0 35.2L1863.8 34.5L1865.2 36.0L1866.0 33.8L1866.8 38.2L1869.8 35.2L1873.5 37.5L1870.5 35.2ZM1869.0 32.2L1870.5 31.5L1871.2 33.0L1869.8 33.8ZM1883.2 29.2L1881.0 30.8L1878.8 30.0L1879.5 34.5L1880.2 32.2L1883.2 35.2L1881.0 32.2ZM1849.5 37.5L1850.2 52.5L1852.5 58.5L1868.2 58.5L1875.0 62.2L1880.2 59.2L1897.5 59.2L1900.5 57.0L1896.8 21.8L1894.5 20.2L1885.5 23.2L1876.5 18.0L1873.5 18.0L1856.2 27.8L1855.5 33.8L1850.2 36.0ZM1874.2 18.8L1880.2 21.0L1893.8 29.2L1893.8 50.2L1875.8 60.8L1869.8 58.5L1856.2 50.2L1856.2 29.2Z' },
  icons: [
    'M298.5 726.0L298.5 741.8L301.5 744.8L306.8 744.8L307.5 745.5L307.5 749.2L309.0 749.2L309.0 745.5L309.8 744.8L342.0 744.8L342.8 748.5L344.2 749.2L344.2 746.2L345.8 744.8L350.2 744.8L353.2 742.5L353.2 725.2L351.0 723.0L345.8 723.0L344.2 720.8L344.2 717.8L342.8 718.5L342.8 721.5L341.2 723.0L310.5 723.0L309.0 720.8L309.0 718.5L307.5 717.8L307.5 722.2L306.8 723.0L300.8 723.0L300.0 725.2ZM349.5 724.5L351.8 726.8L351.8 740.2L350.2 742.5L346.5 743.2L344.2 741.8L344.2 726.0L345.8 724.5ZM336.8 724.5L342.0 724.5L342.8 725.2L342.8 741.8L342.0 742.5L336.0 742.5L335.2 741.8L336.0 738.8L336.0 729.0L335.2 727.5ZM315.8 725.2L316.5 724.5L333.0 724.5L333.8 725.2L333.8 741.8L332.2 743.2L330.8 742.5L316.5 742.5L315.8 741.8ZM312.8 724.5L313.5 725.2L313.5 741.8L310.5 743.2L309.0 741.8L309.0 726.0L310.5 724.5ZM302.2 724.5L306.8 724.5L307.5 725.2L307.5 741.8L306.8 742.5L301.5 742.5L300.8 741.8L300.8 726.0Z',
    'M578.2 660.0L576.0 662.2L576.0 678.8L575.2 679.5L576.0 699.8L583.5 704.2L587.2 704.2L589.5 705.8L603.8 705.8L606.8 704.2L609.8 704.2L615.8 701.2L617.2 699.8L617.2 690.8L618.0 690.0L617.2 662.2L612.8 658.5L599.2 655.5L585.0 657.0L579.8 660.0ZM576.8 688.5L578.2 685.5L582.8 687.8L585.8 687.8L588.8 689.2L604.5 689.2L607.5 687.8L610.5 687.8L612.0 686.2L615.0 685.5L615.8 686.2L615.8 695.2L616.5 696.8L614.2 700.5L606.0 703.5L588.0 703.5L582.0 702.0L578.2 699.8L576.8 696.8L576.8 690.0L577.5 689.2ZM576.8 670.5L578.2 669.0L581.2 669.8L582.8 671.2L586.5 671.2L588.8 672.8L603.8 672.8L607.5 671.2L610.5 671.2L612.0 669.8L615.0 669.0L615.8 669.8L615.8 681.8L614.2 684.0L606.8 687.0L602.2 687.0L601.5 687.8L586.5 687.0L578.2 683.2L576.8 680.2L577.5 679.5L576.8 678.8L576.8 673.5L577.5 672.8ZM577.5 663.8L579.0 661.5L582.8 659.2L586.5 659.2L591.0 657.8L603.8 657.8L612.8 660.8L615.8 663.8L615.8 665.2L614.2 667.5L606.8 670.5L591.0 671.2L590.2 670.5L586.5 670.5L579.0 667.5Z',
    'M834.0 696.0L834.0 731.2L836.2 734.2L838.5 735.0L882.8 735.0L885.8 733.5L887.2 729.8L887.2 726.0L886.5 725.2L887.2 723.8L887.2 719.2L886.5 718.5L887.2 714.8L886.5 700.5L887.2 697.5L884.2 693.0L837.0 693.0ZM871.5 722.2L884.2 722.2L885.0 723.0L885.0 731.2L882.8 733.5L871.5 733.5L870.0 732.0L870.8 731.2L870.8 726.0L870.0 725.2ZM854.2 723.0L855.0 722.2L867.8 722.2L868.5 723.0L868.5 732.8L867.8 733.5L855.0 733.5L854.2 732.8ZM836.2 723.0L837.0 722.2L851.2 722.2L852.0 723.0L852.0 732.8L851.2 733.5L838.5 733.5L836.2 731.2ZM870.0 709.5L870.8 708.8L884.2 708.8L885.0 709.5L885.0 720.0L884.2 720.8L871.5 720.8L870.8 720.0ZM854.2 709.5L855.0 708.8L867.8 708.8L868.5 709.5L868.5 720.0L867.8 720.8L855.0 720.8L854.2 720.0ZM836.2 709.5L837.0 708.8L851.2 708.8L852.0 709.5L852.0 720.0L851.2 720.8L837.8 720.8L836.2 719.2ZM836.2 696.0L838.5 694.5L882.8 694.5L885.0 696.0L885.0 705.8L884.2 706.5L837.0 706.5L836.2 705.8Z',
    'M1134.8 591.0L1130.2 589.5L1126.5 591.0L1123.5 594.8L1123.5 599.2L1125.0 602.2L1129.5 604.5L1129.5 608.2L1126.5 614.2L1124.2 616.5L1118.2 619.5L1112.2 621.0L1110.8 623.2L1113.8 623.2L1124.2 618.8L1128.8 614.2L1131.8 605.2L1136.2 602.2L1137.8 600.0L1137.8 594.8ZM1125.8 594.0L1128.8 591.8L1132.5 591.8L1135.5 594.8L1136.2 597.0L1135.5 600.0L1132.5 602.2L1127.2 601.5L1125.8 600.0ZM1106.2 589.5L1101.0 591.0L1098.0 595.5L1098.0 598.5L1099.5 601.5L1101.8 603.8L1103.2 603.8L1104.8 606.0L1104.0 606.8L1104.0 610.5L1104.8 611.2L1104.0 612.0L1104.0 615.8L1104.8 616.5L1104.0 619.5L1104.8 621.8L1104.0 622.5L1104.8 624.0L1098.0 630.8L1098.8 636.0L1103.2 639.8L1107.8 639.8L1112.2 635.2L1112.2 629.2L1106.2 624.8L1106.2 605.2L1107.8 603.8L1109.2 603.8L1112.2 600.0L1112.2 594.0ZM1102.5 627.8L1107.8 627.8L1110.8 630.8L1110.8 633.8L1107.8 637.5L1102.5 637.5L1100.2 635.2L1100.2 630.0ZM1104.0 591.8L1107.0 591.8L1110.0 594.0L1110.8 598.5L1107.8 602.2L1103.2 602.2L1100.2 599.2L1100.2 594.8Z',
    'M1364.2 531.8L1368.0 533.2L1368.0 549.8L1353.0 573.8L1352.2 576.0L1353.0 579.0L1356.0 581.2L1394.2 581.2L1397.2 579.8L1398.8 576.8L1398.0 574.5L1382.2 548.2L1382.2 544.5L1383.0 543.8L1382.2 543.0L1383.0 542.2L1382.2 533.2L1386.8 531.8L1385.2 530.2L1384.5 531.0L1383.8 530.2L1380.0 531.0L1368.0 530.2ZM1354.5 575.2L1358.2 568.5L1362.0 564.0L1389.0 564.0L1396.5 575.2L1396.5 577.5L1395.0 579.0L1356.0 579.0L1354.5 577.5ZM1371.0 532.5L1380.0 532.5L1380.8 533.2L1380.8 549.0L1387.5 560.2L1386.8 562.5L1365.0 562.5L1363.5 561.0L1367.2 553.5L1370.2 549.8L1370.2 533.2Z',
    'M1615.5 474.0L1614.0 474.0L1614.0 485.2L1613.2 486.0L1602.0 486.0L1601.2 487.5L1602.0 488.2L1614.8 488.2L1615.5 487.5ZM1588.5 474.0L1581.0 477.0L1576.5 480.8L1572.0 488.2L1570.5 498.0L1572.0 504.0L1574.2 508.5L1578.8 513.8L1587.8 518.2L1592.2 518.2L1593.0 519.0L1593.8 518.2L1599.0 518.2L1605.8 515.2L1613.2 507.0L1613.2 504.8L1614.8 503.2L1615.5 495.8L1614.8 495.0L1612.5 504.0L1609.5 509.2L1600.5 516.0L1596.8 516.8L1587.0 516.0L1581.0 513.0L1574.2 504.8L1574.2 502.5L1572.8 500.2L1572.8 492.0L1574.2 487.5L1581.0 479.2L1587.0 476.2L1595.2 475.5L1602.8 477.8L1607.2 480.8L1608.0 482.2L1609.5 480.8L1605.8 477.0L1599.0 474.0Z',
  ].map((d, i) => ({ id: `icon-${i + 1}`, fill: '#02050d', d })),
}

/**
 * Slate wedge bands right of blocks 1–5, measured on the settled frame
 * (slate-class ink ≈ rgb(49,53,65)); block 6 has none. Rendered blurred —
 * the reference feathers the bands over ~10px.
 */
export const SEG01_WEDGES: Seg01Wedge[] = [
  { xFrac: 394 / 1920, yFrac: 682 / 1080, wFrac: 133 / 1920, hFrac: 51 / 1080 },
  { xFrac: 664 / 1920, yFrac: 679 / 1080, wFrac: 127 / 1920, hFrac: 37 / 1080 },
  { xFrac: 928 / 1920, yFrac: 625 / 1080, wFrac: 120 / 1920, hFrac: 81 / 1080 },
  { xFrac: 1186 / 1920, yFrac: 559 / 1080, wFrac: 120 / 1920, hFrac: 54 / 1080 },
  { xFrac: 1444 / 1920, yFrac: 508 / 1080, wFrac: 80 / 1920, hFrac: 45 / 1080 },
]

/**
 * Caption typography measured on the settled frame: all six captions are
 * centered on their block centers (±1px), run a 13.4px/char mono advance
 * (font-size 22.33px = 13.4/0.6), and sit with their baseline 34px below the
 * block's bottom edge. Inks are the core samples: #4999f2 under blue, #3dcadc
 * under cyan.
 */
export const SEG01_CAPTIONS: Seg01CaptionSpec = {
  gapPx: 36,
  sizeFrac: 22.333 / 1080,
  textLengthsPx: [121, 121, 106, 38, 65, 65],
  blue: '#4999f2',
  cyan: '#3dcadc',
}
