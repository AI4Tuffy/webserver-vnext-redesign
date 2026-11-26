import { type ReactNode } from 'react'
import { type StatusTone } from './Primitives'
import styles from './SpecStrip.module.css'

/** 顶部细线规格条：用于核心数据指标、赛事规格与服务器遥测概览，统一取代零散方框统计卡。 */
export function SpecStrip({
  children,
  density = 'compact',
  className,
}: {
  children: ReactNode
  density?: 'compact' | 'comfortable'
  className?: string
}) {
  return (
    <section className={className ? `${styles.specStrip} ${className}` : styles.specStrip} data-density={density}>
      {children}
    </section>
  )
}

export const MetricStrip = SpecStrip

export function SpecItem({
  label,
  value,
  detail,
  tone = 'neutral',
}: {
  label: string
  value: ReactNode
  detail?: ReactNode
  tone?: StatusTone
}) {
  return (
    <div className={styles.specItem} data-tone={tone}>
      <span className={styles.specLabel}>{label}</span>
      <strong className={styles.specValue}>{value}</strong>
      {detail ? <small className={styles.specDetail}>{detail}</small> : null}
    </div>
  )
}

export const MetricItem = SpecItem

/** 资源水位计：用于节点算力与配额监控，纯扁平类名与语义色阶。 */
export function ResourceMeter({
  label,
  value,
  max,
  detail,
}: {
  label: string
  value: number
  max: number
  detail?: string
}) {
  const ratio = max > 0 ? Math.min(1, Math.max(0, value / max)) : 0
  const level = ratio >= 0.9 ? 'danger' : ratio >= 0.7 ? 'warning' : 'normal'
  return (
    <div className={styles.meter} data-level={level}>
      <div className={styles.meterHeader}>
        <strong className={styles.meterLabel}>{label}</strong>
        <small className={styles.meterDetail}>{detail ?? `${value} / ${max}`}</small>
      </div>
      <progress aria-label={label} className={styles.meterProgress} max={Math.max(max, 1)} value={value} />
    </div>
  )
}
