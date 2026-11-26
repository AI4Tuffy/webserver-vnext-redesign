import { ChevronLeft, ChevronRight } from 'lucide-react'
import { ActionButton } from './Interaction'
import { IconButton } from './Toolbar'
import styles from './CatalogPagination.module.css'

/** 目录页分页（含每页条数切换）：服务题库浏览与后台题目分页。 */
export function CatalogPagination({
  page,
  pageSize,
  total,
  disabled = false,
  onPageChange,
  onPageSizeChange,
}: {
  page: number
  pageSize: number
  total: number
  disabled?: boolean
  onPageChange: (page: number) => void
  onPageSizeChange: (size: number) => void
}) {
  const pageCount = Math.max(1, Math.ceil(total / pageSize))
  return (
    <nav aria-label="题库分页" className={styles.pagination}>
      <span className={styles.summary}>共 {total} 道题目</span>
      <label className={styles.pageSize}>
        每页
        <select
          aria-label="每页题目数"
          className={styles.pageSizeSelect}
          disabled={disabled}
          onChange={(event) => onPageSizeChange(Number(event.currentTarget.value))}
          value={pageSize}
        >
          {[20, 50, 100].map((size) => (
            <option key={size} value={size}>
              {size}
            </option>
          ))}
        </select>
      </label>
      <div className={styles.actions}>
        <ActionButton
          aria-label="上一页"
          disabled={disabled || page <= 1}
          icon={<ChevronLeft size={16} />}
          onClick={() => onPageChange(page - 1)}
          shape="pill"
          size="sm"
          type="button"
        >
          上一页
        </ActionButton>
        <span aria-live="polite" className={styles.pageIndicator}>
          {page} / {pageCount}
        </span>
        <ActionButton
          aria-label="下一页"
          disabled={disabled || page >= pageCount}
          icon={<ChevronRight size={16} />}
          onClick={() => onPageChange(page + 1)}
          shape="pill"
          size="sm"
          type="button"
        >
          下一页
        </ActionButton>
      </div>
    </nav>
  )
}

/** 标准页码分页条：圆形描边翻页按钮，统一前后台列表页脚。 */
export function PaginationBar({
  page,
  pageCount,
  total,
  label = '分页',
  quiet = false,
  disabled = false,
  onPageChange,
}: {
  page: number
  pageCount: number
  total?: number
  label?: string
  quiet?: boolean
  disabled?: boolean
  onPageChange: (page: number) => void
}) {
  if (pageCount <= 1) {
    return total === undefined ? null : <div className={styles.singlePageCount}>{total} 条记录</div>
  }
  return (
    <nav aria-label={label} className={styles.pagination} data-quiet={quiet || undefined}>
      <span className={styles.summary}>{total === undefined ? '' : `共 ${total} 条`}</span>
      <div className={styles.actions}>
        <IconButton
          disabled={disabled || page <= 1}
          label="上一页"
          onClick={() => onPageChange(page - 1)}
          size="sm"
          tone={quiet ? 'ghost' : 'outlined'}
        >
          <ChevronLeft size={17} />
        </IconButton>
        <strong aria-live="polite" className={styles.pageIndicator}>
          {page} / {pageCount}
        </strong>
        <IconButton
          disabled={disabled || page >= pageCount}
          label="下一页"
          onClick={() => onPageChange(page + 1)}
          size="sm"
          tone={quiet ? 'ghost' : 'outlined'}
        >
          <ChevronRight size={17} />
        </IconButton>
      </div>
    </nav>
  )
}

/** 游标分页条：用于日志流与大数据集增量翻页。 */
export function CursorPaginationBar({
  page,
  hasNext,
  onPrevious,
  onNext,
  label = '游标分页',
}: {
  page: number
  hasNext: boolean
  onPrevious: () => void
  onNext: () => void
  label?: string
}) {
  if (page <= 1 && !hasNext) return null
  return (
    <nav aria-label={label} className={styles.pagination}>
      <span className={styles.summary}>{label}</span>
      <div className={styles.actions}>
        <IconButton disabled={page <= 1} label="上一页" onClick={onPrevious} size="sm">
          <ChevronLeft size={17} />
        </IconButton>
        <strong className={styles.pageIndicator}>第 {page} 页</strong>
        <IconButton disabled={!hasNext} label="下一页" onClick={onNext} size="sm">
          <ChevronRight size={17} />
        </IconButton>
      </div>
    </nav>
  )
}
