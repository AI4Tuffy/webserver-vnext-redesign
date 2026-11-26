import { Clock3, Users } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { useSearchParams } from 'react-router'
import { PaginationBar } from '../../shared/CatalogPagination'
import { HairlineItem, HairlineList } from '../../shared/DataView'
import { PageShell } from '../../shared/Layout'
import { DataState, PageHeader, StatusBadge } from '../../shared/Primitives'
import { SegmentedControl, segmentedItemClassName } from '../../shared/SegmentedControl'
import { FilterBar, SearchInput } from '../../shared/Toolbar'
import { EditorialPlate } from '../../shared/art/EditorialPlate'
import { useVNextPageTitle } from '../../shared/useVNextPageTitle'
import { GamePoster } from './GamePosterArt'
import styles from './GamesPage.module.css'
import {
  formatGameRange,
  GameListStatus,
  gameStatusLabel,
  gameStatusTone,
  participationLabel,
  useGameCatalog,
} from './gameCatalog'

const PAGE_SIZE = 10
const validStatuses = new Set<GameListStatus>(['ongoing', 'upcoming', 'ended'])

const statusFilters: Array<{ value: GameListStatus | null; label: string }> = [
  { value: null, label: '全部' },
  { value: 'ongoing', label: '进行中' },
  { value: 'upcoming', label: '即将开始' },
  { value: 'ended', label: '已结束' },
]

function parsePage(value: string | null) {
  const page = Number(value)
  return Number.isInteger(page) && page > 0 ? page : 1
}

export function GamesPage() {
  const catalog = useGameCatalog()
  const [searchParams, setSearchParams] = useSearchParams()
  const statusValue = searchParams.get('status')
  const status = validStatuses.has(statusValue as GameListStatus) ? (statusValue as GameListStatus) : null
  const page = parsePage(searchParams.get('page'))
  const [query, setQuery] = useState(searchParams.get('q') ?? '')

  useVNextPageTitle('赛事中心')

  useEffect(() => {
    setQuery(searchParams.get('q') ?? '')
  }, [searchParams])

  useEffect(() => {
    const current = searchParams.get('q') ?? ''
    if (query.trim() === current) return undefined

    const timer = window.setTimeout(() => {
      const next = new URLSearchParams(searchParams)
      const normalized = query.trim()
      if (normalized) next.set('q', normalized)
      else next.delete('q')
      next.delete('page')
      setSearchParams(next, { replace: true })
    }, 250)

    return () => window.clearTimeout(timer)
  }, [query, searchParams, setSearchParams])

  const counts = useMemo(() => {
    const result = { all: 0, ongoing: 0, upcoming: 0, ended: 0 }
    for (const game of catalog.games ?? []) {
      result.all += 1
      result[game.status] += 1
    }
    return result
  }, [catalog.games])

  const filteredGames = useMemo(() => {
    const normalizedQuery = (searchParams.get('q') ?? '').trim().toLocaleLowerCase('zh-CN')
    return (catalog.games ?? []).filter((game) => {
      if (status && game.status !== status) return false
      if (!normalizedQuery) return true
      return `${game.title ?? ''} ${game.summary ?? ''}`.toLocaleLowerCase('zh-CN').includes(normalizedQuery)
    })
  }, [catalog.games, searchParams, status])

  const pageCount = Math.max(1, Math.ceil(filteredGames.length / PAGE_SIZE))
  const safePage = Math.min(page, pageCount)
  const visibleGames = filteredGames.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE)

  useEffect(() => {
    if (catalog.isLoading || catalog.error || page <= pageCount) return
    const next = new URLSearchParams(searchParams)
    if (pageCount <= 1) next.delete('page')
    else next.set('page', String(pageCount))
    setSearchParams(next, { replace: true })
  }, [catalog.isLoading, catalog.error, page, pageCount, searchParams, setSearchParams])

  const setStatus = (nextStatus: GameListStatus | null) => {
    const next = new URLSearchParams(searchParams)
    if (nextStatus) next.set('status', nextStatus)
    else next.delete('status')
    next.delete('page')
    setSearchParams(next)
  }

  const setPage = (nextPage: number) => {
    const next = new URLSearchParams(searchParams)
    if (nextPage <= 1) next.delete('page')
    else next.set('page', String(nextPage))
    setSearchParams(next)
    window.scrollTo({
      top: 0,
      behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth',
    })
  }

  return (
    <PageShell>
      <PageHeader title="赛事中心" illustration={<EditorialPlate aspect="20/13" slot="module-games" />} />

      <FilterBar>
        <SearchInput
          className={styles.search}
          label="搜索赛事"
          onValueChange={setQuery}
          placeholder="搜索赛事名称或简介"
          value={query}
        />
        <SegmentedControl activeKey={status ?? 'all'} aria-label="赛事状态" className={styles.filters} role="group">
          {statusFilters.map((filter) => (
            <button
              aria-pressed={status === filter.value}
              className={segmentedItemClassName}
              key={filter.label}
              onClick={() => setStatus(filter.value)}
              type="button"
            >
              {filter.label}
              <span className={styles.filterCount}>{counts[filter.value ?? 'all']}</span>
            </button>
          ))}
        </SegmentedControl>
      </FilterBar>

      {catalog.isLoading ? (
        <DataState loading title="赛事加载中" />
      ) : catalog.error ? (
        <DataState description="请稍后刷新重试。" title="赛事加载失败" />
      ) : visibleGames.length > 0 ? (
        <HairlineList aria-label="赛事列表">
          {visibleGames.map((game) => (
            <HairlineItem
              key={game.id}
              leading={
                <span className={styles.poster}>
                  <GamePoster seed={game.id} src={game.poster} status={game.status} title={game.title} />
                </span>
              }
              meta={
                <>
                  <span className={styles.meta}>
                    <Users aria-hidden="true" size={15} />
                    {participationLabel(game.limit)}
                  </span>
                  <span className={styles.meta}>
                    <Clock3 aria-hidden="true" size={15} />
                    {formatGameRange(game)}
                  </span>
                </>
              }
              summary={game.summary || '赛事介绍尚未填写。'}
              title={
                <div className={styles.titleLine}>
                  <h2 className={styles.title}>{game.title || `赛事 ${game.id}`}</h2>
                  <StatusBadge tone={gameStatusTone(game.status)}>{gameStatusLabel(game.status)}</StatusBadge>
                </div>
              }
              to={`/games/${game.id}`}
            />
          ))}
        </HairlineList>
      ) : (
        <DataState description="调整关键词或状态筛选后重试。" title="没有符合条件的赛事" />
      )}

      <PaginationBar onPageChange={setPage} page={safePage} pageCount={pageCount} />
    </PageShell>
  )
}
