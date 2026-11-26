import { ChevronRight } from 'lucide-react'
import { type KeyboardEvent, type MouseEvent, type ReactNode } from 'react'
import { Link } from 'react-router'
import { DataState } from './Primitives'
import styles from './DataView.module.css'

export type ColumnWidth = 'compact' | 'medium' | 'wide'
export type ColumnVisibility = 'always' | 'desktop' | 'wide'

export interface DataColumn<T> {
  id: string
  header: ReactNode
  render: (row: T) => ReactNode
  width?: ColumnWidth
  visibility?: ColumnVisibility
  align?: 'left' | 'right'
}

/**
 * 开放画布发丝线列表：默认无背景填充与外框圆角，仅以 1px 暖灰横线分隔。
 * dimSiblings 开启后在支持悬停的设备上呈现 Anthropic 同级退让焦点效果。
 */
export function HairlineList({
  children,
  dimSiblings = true,
  className,
  'aria-label': ariaLabel,
}: {
  children: ReactNode
  dimSiblings?: boolean
  className?: string
  'aria-label'?: string
}) {
  return (
    <ul
      aria-label={ariaLabel}
      className={className ? `${styles.hairlineList} ${className}` : styles.hairlineList}
      data-dim-siblings={dimSiblings ? 'true' : undefined}
    >
      {children}
    </ul>
  )
}

export function HairlineItem({
  to,
  onClick,
  leading,
  meta,
  title,
  summary,
  trailing,
  children,
  className,
}: {
  to?: string
  onClick?: () => void
  leading?: ReactNode
  meta?: ReactNode
  title?: ReactNode
  summary?: ReactNode
  trailing?: ReactNode
  children?: ReactNode
  className?: string
}) {
  const interactive = Boolean(to || onClick)
  const content = children ?? (
    <>
      {leading ? <div className={styles.hairlineLeading}>{leading}</div> : null}
      <div className={styles.hairlineBody}>
        {title ? <div className={styles.hairlineTitle}>{title}</div> : null}
        {summary ? <p className={styles.hairlineSummary}>{summary}</p> : null}
        {meta ? <div className={styles.hairlineMeta}>{meta}</div> : null}
      </div>
      <div className={styles.hairlineTrailing}>
        {trailing ?? (interactive ? <ChevronRight aria-hidden="true" className={styles.hairlineArrow} size={18} /> : null)}
      </div>
    </>
  )

  return (
    <li className={className ? `${styles.hairlineRow} ${className}` : styles.hairlineRow} data-interactive={interactive || undefined}>
      {to ? (
        <Link className={styles.hairlineAction} to={to}>
          {content}
        </Link>
      ) : onClick ? (
        <button className={styles.hairlineAction} onClick={onClick} type="button">
          {content}
        </button>
      ) : (
        <div className={styles.hairlineStatic}>{content}</div>
      )}
    </li>
  )
}

function interactiveTarget(target: EventTarget | null) {
  return target instanceof Element && Boolean(target.closest('a, button, input, select, textarea, label'))
}

/** 统一工程数据表：前后台共用，支持 compact/comfortable 密度、响应式隐藏列、同级退让与键盘行激活。 */
export function DataTable<T>({
  caption,
  columns,
  rows,
  rowKey,
  onRowClick,
  emptyTitle = '暂无数据',
  emptyDescription = '当前条件下没有可展示的记录。',
  density = 'compact',
  dimSiblings = false,
}: {
  caption: string
  columns: DataColumn<T>[]
  rows: T[]
  rowKey: (row: T) => string | number
  onRowClick?: (row: T) => void
  emptyTitle?: string
  emptyDescription?: string
  density?: 'compact' | 'comfortable'
  dimSiblings?: boolean
}) {
  if (!rows.length) return <DataState description={emptyDescription} title={emptyTitle} />

  const activate = (row: T, event: MouseEvent<HTMLTableRowElement>) => {
    if (!onRowClick || interactiveTarget(event.target)) return
    onRowClick(row)
  }

  const activateWithKeyboard = (row: T, event: KeyboardEvent<HTMLTableRowElement>) => {
    if (!onRowClick || (event.key !== 'Enter' && event.key !== ' ')) return
    event.preventDefault()
    onRowClick(row)
  }

  return (
    <div className={styles.tableFrame}>
      <table
        className={styles.dataTable}
        data-density={density}
        data-dim-siblings={dimSiblings ? 'true' : undefined}
      >
        <caption className={styles.tableCaption}>{caption}</caption>
        <thead>
          <tr className={styles.tableHeadRow}>
            {columns.map((column) => (
              <th
                className={styles.tableHeadCell}
                data-align={column.align}
                data-visibility={column.visibility ?? 'always'}
                data-width={column.width ?? 'medium'}
                key={column.id}
                scope="col"
              >
                {column.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr
              className={styles.tableRow}
              data-clickable={Boolean(onRowClick) || undefined}
              key={rowKey(row)}
              onClick={(event) => activate(row, event)}
              onKeyDown={(event) => activateWithKeyboard(row, event)}
              tabIndex={onRowClick ? 0 : undefined}
            >
              {columns.map((column) => (
                <td
                  className={styles.tableCell}
                  data-align={column.align}
                  data-visibility={column.visibility ?? 'always'}
                  data-width={column.width ?? 'medium'}
                  key={column.id}
                >
                  {column.render(row)}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
