import { BookOpenCheck, Flag, GraduationCap, Network, ShieldCheck, Trophy } from 'lucide-react'
import { ComponentType } from 'react'
import { HairlineItem, HairlineList, SectionHeader, SurfaceCard } from '../../shared'
import { ActionButton } from '../../shared/Interaction'
import type { UserProfileHistoryItem } from './api/userProfileApi'

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
    <SurfaceCard>
      <SectionHeader title="近期经历" />
      {loading ? (
        <p role="status">正在读取经历记录...</p>
      ) : failed ? (
        <p role="status">经历记录暂时无法读取。</p>
      ) : items.length ? (
        <HairlineList aria-label="近期经历">
          {items.map((item) => {
            const Icon = historyIcons[item.type] ?? Flag
            return (
              <HairlineItem
                key={item.id}
                leading={<Icon size={16} />}
                meta={
                  <time dateTime={new Date(item.occurredAt).toISOString()}>{formatOccurredAt(item.occurredAt)}</time>
                }
                summary={item.summary}
                title={item.title}
                to={item.route || undefined}
              />
            )
          })}
        </HairlineList>
      ) : (
        <p role="status">暂无公开记录。</p>
      )}
      {hasMore ? (
        <p>
          <ActionButton disabled={loadingMore} onClick={onLoadMore} type="button">
            {loadingMore ? '正在加载...' : '加载更多'}
          </ActionButton>
        </p>
      ) : null}
    </SurfaceCard>
  )
}
