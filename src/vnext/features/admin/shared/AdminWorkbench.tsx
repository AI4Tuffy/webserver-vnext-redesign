import { Menu } from 'lucide-react'
import { type ReactNode } from 'react'
import {
  CursorPaginationBar,
  DataTable,
  DetailDrawer,
  EditorActionBar,
  EditorSection,
  FilterBar,
  PageHeader,
  PaginationBar,
  ResourceMeter,
  SpecItem,
  SpecStrip,
  StatusBadge,
  ToolbarGroup,
  type ColumnVisibility,
  type ColumnWidth,
  type DataColumn,
} from '../../../shared'
import styles from './AdminWorkbench.module.css'

export type AdminStatusTone = 'danger' | 'info' | 'neutral' | 'success' | 'warning'
export type AdminColumnWidth = ColumnWidth
export type AdminColumnVisibility = ColumnVisibility
export type AdminDataColumn<T> = DataColumn<T>

/** 后台统一页头：收编进 shared/PageHeader，保持 compact 工程密度与可选 eyebrow。 */
export function AdminPageHeader({
  eyebrow,
  title,
  description,
  actions,
}: {
  eyebrow?: string
  title: string
  description?: string
  actions?: ReactNode
}) {
  return <PageHeader actions={actions} density="compact" description={description} eyebrow={eyebrow} title={title} />
}

export {
  CursorPaginationBar,
  DataTable,
  DetailDrawer,
  EditorActionBar as AdminEditorActionBar,
  EditorSection as AdminEditorSection,
  FilterBar as FilterToolbar,
  PaginationBar,
  ResourceMeter,
  SpecItem as MetricItem,
  SpecStrip as MetricStrip,
  StatusBadge,
  ToolbarGroup,
}

export function MobileAdminMenuButton({ onClick }: { onClick: () => void }) {
  return (
    <button aria-label="打开管理导航" className={styles.mobileMenuButton} onClick={onClick} type="button">
      <Menu size={18} />
      管理导航
    </button>
  )
}
