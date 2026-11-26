import { type ReactNode } from 'react'
import styles from './Layout.module.css'

export type PageShellVariant = 'standard' | 'reading' | 'wide' | 'studio'
export type PageShellGap = 'none' | 'md' | 'lg'

/** 统一页面外容器：锁定四种规范幅面与标准页边距，取代各页手写 .page 壳层。 */
export function PageShell({
  as: Element = 'div',
  variant = 'standard',
  gap = 'md',
  className,
  children,
}: {
  as?: 'div' | 'main' | 'section'
  variant?: PageShellVariant
  gap?: PageShellGap
  className?: string
  children: ReactNode
}) {
  return (
    <Element
      className={className ? `${styles.pageShell} ${className}` : styles.pageShell}
      data-gap={gap}
      data-variant={variant}
    >
      {children}
    </Element>
  )
}

/** 主从双栏工作台：支持侧栏左右切换、粘性跟随与移动端首屏优先。 */
export function SplitWorkspace({
  children,
  aside,
  asidePosition = 'right',
  asideWidth = 'medium',
  stickyAside = true,
  mobileAsideFirst = false,
  className,
}: {
  children: ReactNode
  aside: ReactNode
  asidePosition?: 'left' | 'right'
  asideWidth?: 'narrow' | 'medium' | 'wide'
  stickyAside?: boolean
  mobileAsideFirst?: boolean
  className?: string
}) {
  return (
    <div
      className={className ? `${styles.splitWorkspace} ${className}` : styles.splitWorkspace}
      data-aside={asidePosition}
      data-aside-width={asideWidth}
      data-mobile-aside-first={mobileAsideFirst || undefined}
    >
      {asidePosition === 'left' ? (
        <>
          <aside className={styles.splitAside} data-sticky={stickyAside || undefined}>
            {aside}
          </aside>
          <div className={styles.splitMain}>{children}</div>
        </>
      ) : (
        <>
          <div className={styles.splitMain}>{children}</div>
          <aside className={styles.splitAside} data-sticky={stickyAside || undefined}>
            {aside}
          </aside>
        </>
      )}
    </div>
  )
}

/** 轻表面容器：仅用于独立行动台、网格卡片或弹窗，严禁卡片内再套边框小卡。 */
export function SurfaceCard({
  as: Element = 'section',
  tone = 'surface',
  padding = 'md',
  className,
  children,
}: {
  as?: 'section' | 'article' | 'div' | 'aside'
  tone?: 'surface' | 'muted' | 'stone'
  padding?: 'none' | 'sm' | 'md' | 'lg'
  className?: string
  children: ReactNode
}) {
  return (
    <Element
      className={className ? `${styles.surfaceCard} ${className}` : styles.surfaceCard}
      data-padding={padding}
      data-tone={tone}
    >
      {children}
    </Element>
  )
}

/** 标准表单/配置分区：统一设置页、培训编辑页与后台编辑区的结构秩序。 */
export function EditorSection({
  title,
  description,
  actions,
  children,
  className,
}: {
  title: string
  description?: string
  actions?: ReactNode
  children: ReactNode
  className?: string
}) {
  return (
    <section className={className ? `${styles.editorSection} ${className}` : styles.editorSection}>
      <header className={styles.editorHeader}>
        <div className={styles.editorCopy}>
          <h2 className={styles.editorTitle}>{title}</h2>
          {description ? <p className={styles.editorDescription}>{description}</p> : null}
        </div>
        {actions ? <div className={styles.editorActions}>{actions}</div> : null}
      </header>
      <div className={styles.editorBody}>{children}</div>
    </section>
  )
}

/** 编辑页底部操作栏：支持吸底保存与左侧实时草稿/校验状态提示。 */
export function EditorActionBar({
  status,
  sticky = true,
  children,
  className,
}: {
  status?: ReactNode
  sticky?: boolean
  children: ReactNode
  className?: string
}) {
  return (
    <footer
      className={className ? `${styles.editorActionBar} ${className}` : styles.editorActionBar}
      data-sticky={sticky || undefined}
    >
      <div className={styles.editorStatus}>{status}</div>
      <div className={styles.editorButtons}>{children}</div>
    </footer>
  )
}
