import { ArrowRight } from 'lucide-react'
import { ReactNode, useState } from 'react'
import { Link } from 'react-router'
import { posterIcon, posterSeed, PosterTheme, SpotPalette, SpotTile } from './art/spot'
import styles from './Primitives.module.css'
import stateStyles from './StatePrimitives.module.css'

/** 统一页面刊头：支持叙事大图版与紧凑工程态，eyebrow 可选（禁止机械英文装饰标签）。 */
export function PageHeader({
  eyebrow,
  title,
  description,
  actions,
  illustration,
  density = 'editorial',
  border = true,
}: {
  eyebrow?: string
  title: ReactNode
  description?: ReactNode
  actions?: ReactNode
  illustration?: ReactNode
  density?: 'editorial' | 'compact'
  border?: boolean
}) {
  return (
    <header
      className={styles.pageHeading}
      data-border={border ? 'true' : 'false'}
      data-density={density}
      data-illustrated={illustration ? 'true' : undefined}
    >
      <div className={styles.pageCopy}>
        {eyebrow ? <span className={styles.eyebrow}>{eyebrow}</span> : null}
        <h1 className={styles.pageTitle}>{title}</h1>
        {description ? <p className={styles.pageDescription}>{description}</p> : null}
      </div>
      {actions ? <div className={styles.pageActions}>{actions}</div> : null}
      {illustration ? <div className={styles.pageIllustration}>{illustration}</div> : null}
    </header>
  )
}

export const PageHeading = PageHeader

/** 统一分节标题：支持可选副标题、右置跳转链接或自定义操作。 */
export function SectionHeader({
  eyebrow,
  title,
  description,
  actions,
  route,
  routeLabel,
}: {
  eyebrow?: string
  title: ReactNode
  description?: ReactNode
  actions?: ReactNode
  route?: string
  routeLabel?: string
}) {
  return (
    <header className={styles.sectionHeading}>
      <div className={styles.sectionCopy}>
        {eyebrow ? <span className={styles.eyebrow}>{eyebrow}</span> : null}
        <h2 className={styles.sectionTitle}>{title}</h2>
        {description ? <p className={styles.sectionDescription}>{description}</p> : null}
      </div>
      {actions ? (
        <div className={styles.sectionActions}>{actions}</div>
      ) : route && routeLabel ? (
        <Link className={styles.sectionLink} to={route}>
          {routeLabel}
          <ArrowRight size={16} />
        </Link>
      ) : null}
    </header>
  )
}

export const SectionHeading = SectionHeader

export type StatusTone = 'success' | 'info' | 'warning' | 'danger' | 'neutral' | 'accent'

/** 统一状态徽章：前后台共用，语义色彩克制，支持可选图标与轻量脉冲指示。 */
export function StatusBadge({
  children,
  tone = 'neutral',
  icon,
  pulse = false,
  className,
}: {
  children: ReactNode
  tone?: StatusTone
  icon?: ReactNode
  pulse?: boolean
  className?: string
}) {
  return (
    <span
      className={className ? `${stateStyles.statusPill} ${className}` : stateStyles.statusPill}
      data-icon={Boolean(icon) || undefined}
      data-pulse={pulse || undefined}
      data-tone={tone}
    >
      {icon ? (
        <i aria-hidden="true" className={stateStyles.statusIcon}>
          {icon}
        </i>
      ) : null}
      {children}
    </span>
  )
}

export const StatusPill = StatusBadge

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
    <div className={stateStyles.dataState} role={loading ? 'status' : undefined}>
      {loading ? (
        <span aria-hidden="true" className={stateStyles.loadingMark}>
          <i className={stateStyles.loadingDot} />
          <i className={stateStyles.loadingDot} />
          <i className={stateStyles.loadingDot} />
        </span>
      ) : (
        <span aria-hidden="true" className={stateStyles.emptyMark} />
      )}
      <strong className={stateStyles.dataStateTitle}>{stateTitle}</strong>
      <p className={stateStyles.dataStateDescription}>{stateDescription}</p>
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
    return <img alt={alt} className={stateStyles.posterImage} loading="lazy" onError={() => setFailed(true)} src={src} />
  }

  return (
    <span className={stateStyles.posterArt}>
      <SpotTile
        icon={posterIcon(theme, seed ?? posterSeed(alt))}
        palette={posterTonePalettes[tone]}
        seed={seed ?? posterSeed(alt)}
      />
    </span>
  )
}
