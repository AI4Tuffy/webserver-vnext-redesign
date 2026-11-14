import { useLayoutEffect, useRef, type FocusEvent, type ReactNode } from 'react'
import styles from './SegmentedControl.module.css'

/**
 * 标准胶囊切换：描边长条 + 等宽选项 + 滑动选中块，设计与动效取自顶栏主导航。
 * 选项是任意直接子元素（Link、NavLink 或 button），套用 segmentedItemClassName；
 * 选中项以 aria-current="page"、aria-pressed="true" 或 aria-selected="true" 标记，滑块随之移动。
 */
export const segmentedItemClassName = styles.item

interface SegmentedControlProps {
  'aria-label': string
  /** 当前选中项的标识；变化时把选中项横向滚入可见区域（不会滚动页面）。 */
  activeKey?: string | number | boolean | null
  as?: 'nav' | 'div'
  children: ReactNode
  className?: string
  /** vertical 在 900px 以下自动转为横排。 */
  orientation?: 'horizontal' | 'vertical'
  role?: 'group' | 'tablist'
  size?: 'md' | 'sm'
}

export function SegmentedControl({
  'aria-label': ariaLabel,
  activeKey,
  as: Element = 'div',
  children,
  className,
  orientation = 'horizontal',
  role,
  size = 'md',
}: SegmentedControlProps) {
  const frameRef = useRef<HTMLElement | null>(null)

  useLayoutEffect(() => {
    const frame = frameRef.current
    revealInline(frame, frame?.querySelector<HTMLElement>(selectedItemSelector) ?? null)
  }, [activeKey])

  const reveal = (event: FocusEvent<HTMLElement>) => revealInline(frameRef.current, event.target)

  return (
    <Element
      aria-label={ariaLabel}
      className={className ? `${styles.frame} ${className}` : styles.frame}
      data-orientation={orientation}
      data-size={size}
      onFocus={reveal}
      ref={(node: HTMLElement | null) => {
        frameRef.current = node
      }}
      role={role}
    >
      <div className={styles.rail}>{children}</div>
    </Element>
  )
}

const selectedItemSelector = '[aria-current="page"], [aria-pressed="true"], [aria-selected="true"]'

/** 只调整切换条自身的横向滚动，避免 scrollIntoView 连带滚动整页。 */
function revealInline(frame: HTMLElement | null, item: HTMLElement | null) {
  if (!frame || !item || frame.scrollWidth <= frame.clientWidth) return
  const frameBox = frame.getBoundingClientRect()
  const itemBox = item.getBoundingClientRect()
  if (itemBox.left < frameBox.left) frame.scrollLeft -= frameBox.left - itemBox.left + 4
  else if (itemBox.right > frameBox.right) frame.scrollLeft += itemBox.right - frameBox.right + 4
}
