import { Search, X } from 'lucide-react'
import { forwardRef, type ChangeEvent, type ReactNode } from 'react'
import styles from './Toolbar.module.css'

/** 标准筛选工具条：把搜索框、切换胶囊与过滤控件贴近结果列表排布。 */
export function FilterBar({ children, className }: { children: ReactNode; className?: string }) {
  return <section className={className ? `${styles.toolbar} ${className}` : styles.toolbar}>{children}</section>
}

export const FilterToolbar = FilterBar

export function ToolbarGroup({
  children,
  grow = false,
  align = 'start',
}: {
  children: ReactNode
  grow?: boolean
  align?: 'start' | 'end'
}) {
  return (
    <div className={styles.toolbarGroup} data-align={align} data-grow={grow || undefined}>
      {children}
    </div>
  )
}

/** 统一搜索框：支持胶囊（前台目录）与微圆角（后台工程表）两档形态，附带无障碍清空按钮。 */
export function SearchInput({
  value,
  onValueChange,
  onChange,
  label,
  placeholder,
  shape = 'pill',
  size = 'md',
  clearable = true,
  className,
}: {
  value: string
  onValueChange?: (value: string) => void
  onChange?: (event: ChangeEvent<HTMLInputElement>) => void
  label: string
  placeholder?: string
  shape?: 'pill' | 'rounded'
  size?: 'sm' | 'md'
  clearable?: boolean
  className?: string
}) {
  const handleChange = (event: ChangeEvent<HTMLInputElement>) => {
    onChange?.(event)
    onValueChange?.(event.currentTarget.value)
  }

  return (
    <label
      className={className ? `${styles.searchBox} ${className}` : styles.searchBox}
      data-shape={shape}
      data-size={size}
    >
      <Search aria-hidden="true" size={size === 'sm' ? 16 : 18} />
      <input
        aria-label={label}
        className={styles.searchField}
        onChange={handleChange}
        placeholder={placeholder ?? label}
        type="search"
        value={value}
      />
      {clearable && value ? (
        <button
          aria-label={`清空${label}`}
          className={styles.clearButton}
          onClick={() => onValueChange?.('')}
          type="button"
        >
          <X aria-hidden="true" size={14} />
        </button>
      ) : null}
    </label>
  )
}

/** 统一图标按钮：收敛 36px/44px 热区、圆形/微圆角形态及悬浮描边过渡。 */
export const IconButton = forwardRef<
  HTMLButtonElement,
  Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, 'aria-label'> & {
    label: string
    shape?: 'circle' | 'rounded'
    size?: 'sm' | 'md'
    tone?: 'ghost' | 'outlined' | 'strong'
    active?: boolean
    children: ReactNode
  }
>(function IconButton(
  { label, shape = 'circle', size = 'md', tone = 'outlined', active = false, className, type = 'button', children, ...props },
  ref
) {
  return (
    <button
      aria-label={label}
      className={className ? `${styles.iconButton} ${className}` : styles.iconButton}
      data-active={active || undefined}
      data-shape={shape}
      data-size={size}
      data-tone={tone}
      ref={ref}
      title={props.title ?? label}
      type={type}
      {...props}
    >
      {children}
    </button>
  )
})
