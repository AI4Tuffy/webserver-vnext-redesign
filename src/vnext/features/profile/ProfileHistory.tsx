import { BookOpenCheck, Flag, GraduationCap, Network, ShieldCheck, Trophy } from 'lucide-react'
import { ComponentType } from 'react'
import { Link } from 'react-router'
import { ActionButton } from '../../shared/Interaction'
import type { UserProfileHistoryItem } from './api/userProfileApi'
import styles from './UserProfilePage.module.css'

const historyIcons: Record<string, ComponentType<{ size?: number }>> = {
  challenge: Flag,
  competition: Trophy,
  awdp: ShieldCheck,
  penetration: Network,
  training: BookOpenCheck,
  teaching: GraduationCap,
}

function formatOccurredAt(value: number) {
  return new Intl.DateTimeFormat('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).format(value)
}

function HistoryContent({ item }: { item: UserProfileHistoryItem }) {
  const Icon = historyIcons[item.type] ?? Flag
  return (
    <>
      <span className={styles.historyIcon}>
        <Icon size={16} />
      </span>
      <span className={styles.historyCopy}>
        <time>{formatOccurredAt(item.occurredAt)}</time>
        <strong>{item.title}</strong>
        <small>{item.summary}</small>
      </span>
    </>
  )
}

export function ProfileHistory({
  items,
  loading,
  loadingMore,
  failed,
  hasMore,
  onLoadMore,
}: {
  items: UserProfileHistoryItem[]
  loading: boolean
  loadingMore: boolean
  failed: boolean
  hasMore: boolean
  onLoadMore: () => void
}) {
  return (
    <section className={styles.profilePanel}>
      <header className={styles.panelHeading}>
        <div>
          <h2>近期经历</h2>
        </div>
      </header>
      {loading ? (
        <div className={styles.panelLoading}>正在读取经历记录...</div>
      ) : failed ? (
        <div className={styles.panelLoading}>经历记录暂时无法读取。</div>
      ) : items.length ? (
        <div className={styles.historyTimeline}>
          {items.map((item) =>
            item.route ? (
              <Link className={styles.historyItem} key={item.id} to={item.route}>
                <HistoryContent item={item} />
              </Link>
            ) : (
              <div className={styles.historyItem} key={item.id}>
                <HistoryContent item={item} />
              </div>
            )
          )}
        </div>
      ) : (
        <div className={styles.panelLoading}>暂无公开记录。</div>
      )}
      {hasMore ? (
        <div className={styles.historyMore}>
          <ActionButton disabled={loadingMore} onClick={onLoadMore} type="button">
            {loadingMore ? '正在加载...' : '加载更多'}
          </ActionButton>
        </div>
      ) : null}
    </section>
  )
}
