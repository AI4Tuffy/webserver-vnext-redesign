import type { ReactNode } from 'react'
import styles from './Art.module.css'

/*
 * 杂志插图的印刷零件。每张插图是一期杂志里的一幅「图版」：画法取自题材本身的历史与功能
 * （蓝图、铜版画、打孔卡、绿条打印纸、翻牌显示屏……），再统一配上图版编号与图注、裁切线、
 * 纸张颗粒和孔版印刷（risograph）的套色错位，让不同画法读起来像同一本刊物。
 * 印刷色固定，不随界面主题变化；插图内文字只用拉丁字符。
 */

export const PRINT = {
  paper: '#f1ece1',
  paperWarm: '#e7dfcc',
  newsprint: '#e9e6dc',
  ink: '#1a1916',
  pencil: '#77736a',
  riso: '#e5484d',
  risoBlue: '#2d5fa8',
  risoYellow: '#f0c03e',
  prussian: '#1e3e66',
  blueprintLine: '#dfe9f5',
  greenbar: '#d6e6cf',
  clay: '#c4613f',
  sage: '#6f8f7a',
  night: '#1d1c1a',
  // 平装书按学科区分封面的三种颜色
  coverOrange: '#e0732f',
  coverGreen: '#3f7d55',
  coverBlue: '#3e6f9c',
} as const

export const round = (value: number) => Math.round(value * 10) / 10

/** 颗粒、排线、点阵、方格。图案 id 以传入的 id 为前缀，同页多张插图互不冲突。 */
export function PrintDefs({ id, grain = 0.2 }: { id: string; grain?: number }) {
  return (
    <defs>
      <filter height="100%" id={`${id}-grain`} width="100%" x="0" y="0">
        <feTurbulence baseFrequency="0.95" numOctaves="3" result="noise" stitchTiles="stitch" type="fractalNoise" />
        <feColorMatrix in="noise" type="saturate" values="0" />
        <feComponentTransfer>
          <feFuncA tableValues={`0 ${grain}`} type="table" />
        </feComponentTransfer>
      </filter>
      <pattern height="3" id={`${id}-hatch`} patternTransform="rotate(40)" patternUnits="userSpaceOnUse" width="3">
        <path d="M0 0V3" stroke={PRINT.ink} strokeWidth="0.6" />
      </pattern>
      <pattern height="3" id={`${id}-hatchLight`} patternTransform="rotate(40)" patternUnits="userSpaceOnUse" width="3">
        <path d="M0 0V3" stroke={PRINT.blueprintLine} strokeOpacity="0.7" strokeWidth="0.5" />
      </pattern>
      <pattern height="3" id={`${id}-cross`} patternTransform="rotate(-35)" patternUnits="userSpaceOnUse" width="3">
        <path d="M0 0V3M0 0H3" stroke={PRINT.ink} strokeWidth="0.5" />
      </pattern>
      <pattern height="2.4" id={`${id}-vlines`} patternUnits="userSpaceOnUse" width="2.4">
        <path d="M0 0V2.4" stroke={PRINT.ink} strokeWidth="0.5" />
      </pattern>
      <pattern height="10" id={`${id}-grid`} patternUnits="userSpaceOnUse" width="10">
        <path d="M10 0H0V10" fill="none" stroke={PRINT.ink} strokeOpacity="0.16" strokeWidth="0.5" />
      </pattern>
      <pattern height="12" id={`${id}-blueGrid`} patternUnits="userSpaceOnUse" width="12">
        <path d="M12 0H0V12" fill="none" stroke={PRINT.blueprintLine} strokeOpacity="0.18" strokeWidth="0.5" />
      </pattern>
    </defs>
  )
}

export function url(id: string, name: 'grain' | 'hatch' | 'hatchLight' | 'cross' | 'vlines' | 'grid' | 'blueGrid') {
  return `url(#${id}-${name})`
}

/** 纸张颗粒：以正片叠底盖在最上层。 */
export function Grain({ id, width, height }: { id: string; width: number; height: number }) {
  return <rect className={styles.multiply} filter={url(id, 'grain')} height={height} pointerEvents="none" width={width} />
}

/** 孔版套色：同一形状用两种油墨各印一次，第二版轻微错位，重叠处正片叠底。 */
export function Misregister({ first, second, dx = 2, dy = 1.5, children }: { first: string; second: string; dx?: number; dy?: number; children: (color: string) => ReactNode }) {
  return (
    <g>
      <g className={styles.multiply}>{children(first)}</g>
      <g className={styles.multiply} transform={`translate(${dx} ${dy})`}>
        {children(second)}
      </g>
    </g>
  )
}

/**
 * 程序化网点：在矩形区域按网格画圆点，半径由 tone(u, v) 决定（0 至 1，u、v 为区域内的相对坐标）。
 * 网点角度 45°，像铜版印刷的半色调。
 */
export function Halftone({
  x,
  y,
  width,
  height,
  step,
  color,
  tone,
}: {
  x: number
  y: number
  width: number
  height: number
  step: number
  color: string
  tone: (u: number, v: number) => number
}) {
  const dots: Array<[number, number, number]> = []
  const columns = Math.ceil(width / step) + 1
  const rows = Math.ceil(height / step) + 1
  for (let row = 0; row < rows; row += 1) {
    for (let column = 0; column < columns; column += 1) {
      const cx = x + column * step + (row % 2 ? step / 2 : 0)
      const cy = y + row * step
      if (cx > x + width || cy > y + height) continue
      const value = Math.max(0, Math.min(1, tone((cx - x) / width, (cy - y) / height)))
      const r = round((step / 2) * Math.sqrt(value) * 1.05)
      if (r >= 0.25) dots.push([round(cx), round(cy), r])
    }
  }
  return (
    <g fill={color}>
      {dots.map(([cx, cy, r]) => (
        <circle cx={cx} cy={cy} key={`${cx}-${cy}`} r={r} />
      ))}
    </g>
  )
}

/** 图版编号与图注：细线 + 等宽编号 + 衬线斜体说明。 */
export function Folio({
  x,
  y,
  width,
  plate,
  note,
  color = PRINT.ink,
  size = 8,
}: {
  x: number
  y: number
  width: number
  plate: string
  note: string
  color?: string
  size?: number
}) {
  return (
    <g fill={color}>
      <path d={`M${x} ${y - size * 1.5}H${x + width}`} stroke={color} strokeOpacity="0.55" strokeWidth="0.6" />
      <text className={styles.mono} fontSize={size * 0.85} letterSpacing="0.08em" x={x} y={y}>
        {plate}
      </text>
      <text className={styles.serif} fontSize={size} fontStyle="italic" textAnchor="end" x={x + width} y={y}>
        {note}
      </text>
    </g>
  )
}

/** 四角裁切线。 */
export function CropMarks({ width, height, inset = 10, length = 8, color = PRINT.ink }: { width: number; height: number; inset?: number; length?: number; color?: string }) {
  const a = inset
  const b = inset + length
  return (
    <path
      d={`M${a} ${b}V${a}H${b}M${width - b} ${a}H${width - a}V${b}M${width - a} ${height - b}V${height - a}H${width - b}M${b} ${height - a}H${a}V${height - b}`}
      fill="none"
      stroke={color}
      strokeOpacity="0.6"
      strokeWidth="0.6"
    />
  )
}

/** 套准标记：十字加圆。 */
export function RegistrationMark({ x, y, r = 5, color = PRINT.ink }: { x: number; y: number; r?: number; color?: string }) {
  return (
    <g fill="none" stroke={color} strokeOpacity="0.7" strokeWidth="0.6">
      <circle cx={x} cy={y} r={r} />
      <path d={`M${x - r * 1.6} ${y}H${x + r * 1.6}M${x} ${y - r * 1.6}V${y + r * 1.6}`} />
    </g>
  )
}

/**
 * 年代拼贴：一幅图版沿接缝切成两半，左边是该主题最初被记录或实践时的画法，右边是今天的样子。
 * 同一物体跨过接缝延续，读者能顺着它从旧时代走到新时代。接缝处有一道纸边阴影，顶角标注年代。
 */
export function EraSplit({
  id,
  width,
  height,
  split,
  before,
  after,
  beforeTag,
  afterTag,
  beforeTagColor = PRINT.ink,
  afterTagColor = PRINT.ink,
}: {
  id: string
  width: number
  height: number
  split: number
  before: ReactNode
  after: ReactNode
  beforeTag: string
  afterTag: string
  beforeTagColor?: string
  afterTagColor?: string
}) {
  return (
    <g>
      <clipPath id={`${id}-before`}>
        <rect height={height} width={split} />
      </clipPath>
      <clipPath id={`${id}-after`}>
        <rect height={height} width={width - split} x={split} />
      </clipPath>
      <g clipPath={`url(#${id}-before)`}>{before}</g>
      <g clipPath={`url(#${id}-after)`}>{after}</g>
      <rect className={styles.multiply} fill={PRINT.ink} fillOpacity="0.14" height={height} width="2.5" x={split} />
      <path d={`M${split} 0V${height}`} stroke={PRINT.paper} strokeOpacity="0.6" strokeWidth="0.6" />
      <text className={styles.mono} fill={beforeTagColor} fontSize="7" letterSpacing="0.14em" x="10" y="14">
        {beforeTag}
      </text>
      <text className={styles.mono} fill={afterTagColor} fontSize="7" letterSpacing="0.14em" textAnchor="end" x={width - 10} y="14">
        {afterTag}
      </text>
    </g>
  )
}

/** 图注条：画面下方的一条纸带，放图版编号与说明，统一各图版的版式。 */
export function CaptionBand({ y, width, height, plate, note }: { y: number; width: number; height: number; plate: string; note: string }) {
  return (
    <g>
      <rect fill={PRINT.paper} height={height - y} width={width} y={y} />
      <Folio note={note} plate={plate} size={7} width={width - 24} x={12} y={height - 6} />
    </g>
  )
}
