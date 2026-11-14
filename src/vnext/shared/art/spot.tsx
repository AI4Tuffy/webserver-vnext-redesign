import styles from './Art.module.css'
import { useArtId } from './artIds'
import { SPOT_ICONS, SpotIconName } from './spotIcons'

export type { SpotIconName } from './spotIcons'

/*
 * 小组件的手绘图标卡（卡片缩略图、入口卡片等占篇幅小的位置）：
 * 低饱和色底，中间一块手剪的不规则多边形浅色徽章，徽章里一枚墨线小图标，只有一处同色系深色填充。
 * 大幅插图请用 print.tsx 的图版；两者是不同的设计。颜色来自 tokens.css 的 --yn-spot-*，随日夜主题切换。
 */

export type SpotPalette = 'peach' | 'lavender' | 'sage' | 'sky' | 'sand'

const round = (value: number) => Math.round(value * 10) / 10

function seeded(seed: number) {
  let state = (Math.abs(Math.trunc(seed)) % 2147483646) + 1
  return () => {
    state = (state * 48271) % 2147483647
    return state / 2147483647
  }
}

/** 手剪感的不规则十边形徽章轮廓。 */
export function badgePath(cx: number, cy: number, r: number, seed: number) {
  const random = seeded(seed * 7 + 3)
  const sides = 10
  const offset = random() * Math.PI
  const points = Array.from({ length: sides }, (_, index) => {
    const angle = offset + (index / sides) * Math.PI * 2 + (random() - 0.5) * 0.2
    const radius = r * (0.94 + random() * 0.1)
    return `${round(cx + radius * Math.cos(angle))} ${round(cy + radius * Math.sin(angle))}`
  })
  return `M${points.join('L')}Z`
}

/** 让线条略微抖动、像笔画出来的位移滤镜。 */
function HandFilter({ id, seed }: { id: string; seed: number }) {
  return (
    <filter height="140%" id={`${id}-hand`} width="140%" x="-20%" y="-20%">
      <feTurbulence baseFrequency="0.045" numOctaves="2" seed={Math.abs(seed) % 97} type="fractalNoise" />
      <feDisplacementMap in="SourceGraphic" scale="1.8" xChannelSelector="R" yChannelSelector="G" />
    </filter>
  )
}

/** 徽章 + 居中图标；图标按 64 单位方框绘制，缩放到徽章直径的约六成。 */
function Badge({ id, cx, cy, r, icon, seed, chip = false }: { id: string; cx: number; cy: number; r: number; icon: SpotIconName; seed: number; chip?: boolean }) {
  const Icon = SPOT_ICONS[icon]
  const scale = round(((r * 1.42) / 64) * 100) / 100
  return (
    <g>
      <path className={chip ? styles.spotChip : styles.spotBadge} d={badgePath(cx, cy, r, seed)} />
      <g filter={`url(#${id}-hand)`} transform={`translate(${round(cx - 32 * scale)} ${round(cy - 32 * scale)}) scale(${scale})`}>
        <g strokeLinecap="round" strokeLinejoin="round" strokeWidth="2">
          <Icon />
        </g>
      </g>
    </g>
  )
}

/** 卡片缩略图：色底 + 居中徽章图标。 */
export function SpotTile({
  palette,
  icon,
  seed = 0,
  width = 320,
  height = 200,
}: {
  palette: SpotPalette
  icon: SpotIconName
  seed?: number
  width?: number
  height?: number
}) {
  const id = useArtId('spot')
  return (
    <svg aria-hidden="true" className={`${styles.svg} ${styles.spot}`} data-palette={palette} preserveAspectRatio="xMidYMid slice" viewBox={`0 0 ${width} ${height}`}>
      <defs>
        <HandFilter id={id} seed={seed} />
      </defs>
      <rect className={styles.spotField} height={height} width={width} />
      <Badge cx={width / 2} cy={height / 2} icon={icon} id={id} r={height * 0.32} seed={seed} />
    </svg>
  )
}

/**
 * 只有徽章和图标、没有色底的小图标，用于入口卡片、列表等更小的位置。
 * 直接放在浅色卡片上时，日间主题徽章改用色底颜色以免太淡，夜间仍用浅色徽章。
 */
export function SpotIcon({ palette, icon, seed = 0, size = 48 }: { palette: SpotPalette; icon: SpotIconName; seed?: number; size?: number }) {
  const id = useArtId('spot-icon')
  return (
    <svg aria-hidden="true" className={styles.spot} data-palette={palette} height={size} viewBox="0 0 64 64" width={size}>
      <defs>
        <HandFilter id={id} seed={seed} />
      </defs>
      <Badge chip cx={32} cy={32} icon={icon} id={id} r={30} seed={seed} />
    </svg>
  )
}

export type PosterTheme = 'game' | 'course'

const POSTER_ICONS: Record<PosterTheme, SpotIconName[]> = {
  game: ['flag', 'trophy', 'padlock', 'terminal', 'target'],
  course: ['book', 'lightbulb', 'magnifier', 'checklist', 'chat'],
}

/** 卡片占位图的图标：按主题与编号轮换，相邻编号一定不同。 */
export function posterIcon(theme: PosterTheme, seed: number): SpotIconName {
  const icons = POSTER_ICONS[theme]
  return icons[Math.abs(Math.trunc(seed)) % icons.length]
}

/** 由任意文字得到稳定的非负整数，用于没有编号时挑选图标。 */
export function posterSeed(text: string) {
  let hash = 0
  for (const char of text) hash = (hash * 31 + (char.codePointAt(0) ?? 0)) | 0
  return Math.abs(hash)
}
