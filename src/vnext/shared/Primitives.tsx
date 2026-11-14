import { ArrowRight } from 'lucide-react'
import { ReactNode, useState } from 'react'
import { Link } from 'react-router'
import { posterIcon, posterSeed, PosterTheme, SpotPalette, SpotTile } from './art/spot'
import styles from './Primitives.module.css'

export function PageHeading({
  eyebrow,
  title,
  description,
  actions,
  illustration,
}: {
  eyebrow: string
  title: string
  description?: string
  actions?: ReactNode
  illustration?: ReactNode
}) {
  return (
    <header className={styles.pageHeading} data-illustrated={illustration ? '' : undefined}>
      <div>
        <span>{eyebrow}</span>
        <h1>{title}</h1>
        {description ? <p>{description}</p> : null}
      </div>
      {actions ? <div className={styles.pageActions}>{actions}</div> : null}
      {illustration ? <div className={styles.pageIllustration}>{illustration}</div> : null}
    </header>
  )
}

export function SectionHeading({
  eyebrow,
  title,
  route,
  routeLabel,
}: {
  eyebrow: string
  title: string
  route?: string
  routeLabel?: string
}) {
  return (
    <header className={styles.sectionHeading}>
      <div>
        <span>{eyebrow}</span>
        <h2>{title}</h2>
      </div>
      {route && routeLabel ? (
        <Link to={route}>
          {routeLabel}
          <ArrowRight size={16} />
        </Link>
      ) : null}
    </header>
  )
}

export type StatusTone = 'success' | 'info' | 'warning' | 'neutral'

export function StatusPill({ children, tone = 'neutral' }: { children: ReactNode; tone?: StatusTone }) {
  return <span className={`${styles.statusPill} ${styles[`statusPill_${tone}`]}`}>{children}</span>
}

export function DataState<T>({
  title,
  description,
  loading = false,
  data,
  error,
  children,
}: {
  title?: string
  description?: string
  loading?: boolean
  data?: T | null
  error?: unknown
  children?: ReactNode
}) {
  if (data) return <>{children}</>
  const stateTitle = title ?? (error ? '加载失败' : loading ? '正在加载' : '暂无数据')
  const stateDescription = description ?? (error ? '数据暂时无法读取，请稍后重试。' : '当前没有可显示的内容。')
  return (
    <div className={styles.dataState} role={loading ? 'status' : undefined}>
      {loading ? (
        <span className={styles.loadingMark} aria-hidden="true">
          <i />
          <i />
          <i />
        </span>
      ) : (
        <span className={styles.emptyMark} aria-hidden="true" />
      )}
      <strong>{stateTitle}</strong>
      <p>{stateDescription}</p>
    </div>
  )
}

type PosterTone = 'green' | 'blue' | 'orange'

const posterTonePalettes: Record<PosterTone, SpotPalette> = {
  green: 'sage',
  blue: 'lavender',
  orange: 'peach',
}

/**
 * 海报图片；没有上传或加载失败时显示手绘图标卡（小组件样式，不是大幅插图）。
 * seed 决定图标（缺省时由 alt 推出），theme 决定图标组，tone 决定色调。
 */
export function PosterImage({
  src,
  alt,
  seed,
  theme = 'course',
  tone = 'green',
}: {
  src?: string | null
  alt: string
  seed?: number | null
  theme?: PosterTheme
  tone?: PosterTone
}) {
  const [failed, setFailed] = useState(false)

  if (src && !failed) {
    return <img alt={alt} className={styles.posterImage} loading="lazy" onError={() => setFailed(true)} src={src} />
  }

  return (
    <span className={styles.posterArt}>
      <SpotTile icon={posterIcon(theme, seed ?? posterSeed(alt))} palette={posterTonePalettes[tone]} seed={seed ?? posterSeed(alt)} />
    </span>
  )
}
