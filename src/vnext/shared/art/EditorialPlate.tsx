import { type ReactNode } from 'react'
import styles from './EditorialPlate.module.css'
import { ModulePageArt, type ModuleArtKind } from './ModulePageArt'

/**
 * 全站插画配额注册表：只允许在首页封面、一级模块主刊头、个人档案、积分榜、
 * 题目方向印记与认证扉页使用叙事插画；二级管理页与后台工作台禁止强塞大图。
 */
export type EditorialPlateSlot =
  | 'home-hero'
  | 'module-games'
  | 'module-practice'
  | 'module-training'
  | 'module-teams'
  | 'module-teamlab'
  | 'profile-journal'
  | 'practice-journal'
  | 'challenge-category'
  | 'scoreboard-podium'
  | 'auth-emblem'

const MODULE_KINDS: Partial<Record<EditorialPlateSlot, ModuleArtKind>> = {
  'module-games': 'games',
  'module-practice': 'practice',
  'module-training': 'training',
  'module-teams': 'teams',
  'module-teamlab': 'teamlab',
}

/**
 * 统一插画容器槽位：
 * 1) 保留并承载现有 SVG 作品（children），或按 module-* 槽位直接渲染 ModulePageArt；
 * 2) 支持未来传入静态高精美术图（staticSrc / darkStaticSrc）无缝覆盖；
 * 3) 外框使用双模语义底色，避免日夜切换出现硬白膏药块。
 */
export function EditorialPlate({
  slot,
  alt = '',
  staticSrc,
  darkStaticSrc,
  aspect = '16/10',
  framed = true,
  children,
  className,
}: {
  slot: EditorialPlateSlot
  alt?: string
  staticSrc?: string | null
  darkStaticSrc?: string | null
  aspect?: '16/10' | '20/13' | '4/3' | 'auto'
  framed?: boolean
  children?: ReactNode
  className?: string
}) {
  const moduleKind = MODULE_KINDS[slot]
  const content = staticSrc ? (
    <>
      <img alt={alt} className={darkStaticSrc ? styles.lightMedia : styles.media} loading="lazy" src={staticSrc} />
      {darkStaticSrc ? <img alt={alt} className={styles.darkMedia} loading="lazy" src={darkStaticSrc} /> : null}
    </>
  ) : (
    children ?? (moduleKind ? <ModulePageArt kind={moduleKind} /> : null)
  )

  return (
    <figure
      aria-hidden={alt ? undefined : true}
      className={className ? `${styles.plate} ${className}` : styles.plate}
      data-aspect={aspect}
      data-framed={framed ? 'true' : 'false'}
      data-slot={slot}
    >
      {content}
    </figure>
  )
}
