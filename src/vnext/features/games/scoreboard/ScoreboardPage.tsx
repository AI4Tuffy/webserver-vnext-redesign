import { useEffect, useMemo, useState } from 'react'
import { useSearchParams } from 'react-router'
import { ScoreboardItem } from '@Api'
import {
  DataState,
  EditorialPlate,
  FilterBar,
  PageHeader,
  PageShell,
  SearchInput,
  SectionHeader,
  SegmentedControl,
  segmentedItemClassName,
} from '../../../shared'
import { useGameChallengeCatalog, useGameScoreboard } from '../gamePlayerApi'
import { useGameWorkspace } from '../workspace/GameWorkspaceShell'
import { PodiumEntry, ScoreboardArt } from './ScoreboardArt'
import styles from './ScoreboardPage.module.css'
import {
  createBloodRankLookup,
  formatStamp,
  MatrixChallenge,
  ScoreBars,
  scoreboardTotals,
  SolveMatrix,
  SolveTimeline,
} from './ScoreboardViews'

const BAR_LIMIT = 12
const TIMELINE_LIMIT = 10

export function ScoreboardPage() {
  const { gameId, game, revision } = useGameWorkspace()
  const ongoing = Date.now() >= (game.start ?? 0) && Date.now() < (game.end ?? 0)
  const { data: scoreboard, error, mutate } = useGameScoreboard(gameId, ongoing ? 30_000 : 0)
  const { data: teamInfo } = useGameChallengeCatalog(gameId, ongoing ? 30_000 : 0)
  const [searchParams, setSearchParams] = useSearchParams()
  const [query, setQuery] = useState(searchParams.get('q') ?? '')
  const divisionId = Number(searchParams.get('division')) || null
  const myTeamId = teamInfo?.rank?.id

  useEffect(() => {
    if (revision > 0) void mutate()
  }, [mutate, revision])

  useEffect(() => setQuery(searchParams.get('q') ?? ''), [searchParams])

  useEffect(() => {
    const current = searchParams.get('q') ?? ''
    if (query.trim() === current) return undefined
    const timer = window.setTimeout(() => {
      const next = new URLSearchParams(searchParams)
      if (query.trim()) next.set('q', query.trim())
      else next.delete('q')
      setSearchParams(next, { replace: true })
    }, 250)
    return () => window.clearTimeout(timer)
  }, [query, searchParams, setSearchParams])

  const divisionMap = useMemo(
    () => new Map((scoreboard?.divisions ?? []).map((division) => [division.id, division.name])),
    [scoreboard?.divisions]
  )
  const divisionName = (item: ScoreboardItem) => (item.divisionId ? divisionMap.get(item.divisionId) : undefined)

  const rankedItems = useMemo(
    () => [...(scoreboard?.items ?? [])].sort((left, right) => left.rank - right.rank),
    [scoreboard?.items]
  )
  const visibleItems = useMemo(() => {
    const keyword = (searchParams.get('q') ?? '').trim().toLocaleLowerCase('zh-CN')
    return rankedItems
      .filter((item) => !divisionId || item.divisionId === divisionId)
      .filter((item) => !keyword || `${item.name} ${item.bio ?? ''}`.toLocaleLowerCase('zh-CN').includes(keyword))
  }, [divisionId, rankedItems, searchParams])

  const challenges = useMemo<MatrixChallenge[]>(
    () =>
      Object.entries(scoreboard?.challenges ?? {}).flatMap(([category, list]) =>
        list.map((challenge) => ({ ...challenge, categoryCode: category.toUpperCase() }))
      ),
    [scoreboard?.challenges]
  )
  const categoryOf = useMemo(
    () => new Map(challenges.map((challenge) => [challenge.id, challenge.categoryCode])),
    [challenges]
  )

  const bloodRank = useMemo(() => createBloodRankLookup(challenges), [challenges])
  const totals = useMemo(() => scoreboardTotals(rankedItems, bloodRank), [bloodRank, rankedItems])
  const mine = rankedItems.find((item) => item.id === myTeamId)
  const toEntry = (item: ScoreboardItem): PodiumEntry => ({
    rank: item.rank,
    score: item.score,
    mine: item.id === myTeamId,
  })
  const podium = rankedItems.slice(0, 3).map(toEntry)
  const receipt = [...podium, ...(mine && mine.rank > 3 ? [toEntry(mine)] : [])]
  const above = mine && mine.rank > 1 ? rankedItems.find((item) => item.rank === mine.rank - 1) : undefined
  const gapToNext = mine && above ? { rank: above.rank, points: Math.max(0, above.score - mine.score) } : undefined
  const maxScore = Math.max(1, ...visibleItems.map((item) => item.score))
  const timelineEnd = Math.min(Date.now(), game.end ?? Date.now())

  const setDivision = (value: number | null) => {
    const next = new URLSearchParams(searchParams)
    if (value) next.set('division', String(value))
    else next.delete('division')
    setSearchParams(next)
  }

  return (
    <PageShell className={styles.page} gap="lg">
      <PageHeader
        title="排行榜"
        description={
          scoreboard && (
            <>
              <span className={styles.heroFacts}>
                {rankedItems.length} 支队伍 · {scoreboard.challengeCount} 道题 · {totals.flags} 次正确提交 · 更新于{' '}
                {formatStamp(scoreboard.updateTimeUtc)}
              </span>
              {mine && (
                <span className={styles.mineLine}>
                  本队 {mine.name} · 第 {mine.rank} 名 · {mine.score} 分
                  {gapToNext ? ` · 距第 ${gapToNext.rank} 名 ${gapToNext.points} 分` : ''}
                </span>
              )}
            </>
          )
        }
        illustration={
          <EditorialPlate aspect="auto" className={styles.podium} slot="scoreboard-podium">
            <ScoreboardArt
              bloodCount={totals.bloods}
              flagCount={totals.flags}
              gapToNext={gapToNext}
              leaderBloods={totals.leaderBloods}
              podium={podium}
              receipt={receipt}
              teamCount={rankedItems.length}
            />
          </EditorialPlate>
        }
      />

      <section aria-label="总分" className={styles.section}>
        <SectionHeader title="总分" />
        <FilterBar>
          <SearchInput label="搜索战队" onValueChange={setQuery} value={query} />
          <SegmentedControl activeKey={divisionId} aria-label="按赛区筛选" role="group" size="sm">
            <button
              aria-pressed={!divisionId}
              className={segmentedItemClassName}
              onClick={() => setDivision(null)}
              type="button"
            >
              全部赛区
            </button>
            {(scoreboard?.divisions ?? []).map((division) => (
              <button
                aria-pressed={divisionId === division.id}
                className={segmentedItemClassName}
                key={division.id}
                onClick={() => setDivision(division.id)}
                type="button"
              >
                {division.name}
              </button>
            ))}
          </SegmentedControl>
        </FilterBar>
        {!scoreboard && !error ? (
          <DataState loading title="积分榜加载中" />
        ) : error || !scoreboard ? (
          <DataState description="积分榜尚未生成或当前账户无权查看。" title="积分榜加载失败" />
        ) : visibleItems.length ? (
          <>
            <div className={styles.legend}>
              <span className={styles.legendItem}>
                <i className={styles.legendMark} data-kind="solid" />
                CTF
              </span>
              <span className={styles.legendItem}>
                <i className={styles.legendMark} data-kind="hatch" />
                其他赛制
              </span>
              {visibleItems.length > BAR_LIMIT ? <span>显示前 {BAR_LIMIT} 名</span> : null}
            </div>
            <ScoreBars
              divisionName={divisionName}
              items={visibleItems.slice(0, BAR_LIMIT)}
              maxScore={maxScore}
              myTeamId={myTeamId}
            />
          </>
        ) : (
          <DataState description="调整战队关键词或赛区筛选后重试。" title="没有符合条件的战队" />
        )}
      </section>

      {scoreboard && visibleItems.length > 0 && game.start && timelineEnd > game.start ? (
        <section aria-label="解题时间轴" className={styles.section}>
          <SectionHeader
            description="从开赛到现在分成 24 格。实心是该题一血，斜线是其他解出，字母是题目方向。"
            title="解题时间轴"
          />
          <div className={styles.legend}>
            <span className={styles.legendItem}>
              <i className={styles.legendMark} data-kind="solid" />
              一血
            </span>
            <span className={styles.legendItem}>
              <i className={styles.legendMark} data-kind="hatch" />
              其他解出
            </span>
          </div>
          <SolveTimeline
            bloodRank={bloodRank}
            categoryOf={categoryOf}
            end={timelineEnd}
            items={visibleItems.slice(0, TIMELINE_LIMIT)}
            myTeamId={myTeamId}
            start={game.start}
          />
        </section>
      ) : null}

      {scoreboard && visibleItems.length > 0 && challenges.length > 0 ? (
        <section aria-label="解题明细" className={styles.section}>
          <SectionHeader title="解题明细" />
          <div className={styles.legend}>
            <span className={styles.legendItem}>
              <i className={styles.legendMark} data-kind="solid" />
              一血
            </span>
            <span className={styles.legendItem}>
              <i className={styles.legendMark} data-kind="hatch" />
              二血、三血及之后
            </span>
            <span className={styles.legendItem}>
              <i className={styles.legendMark} data-kind="none" />
              未解出
            </span>
          </div>
          <SolveMatrix
            bloodRank={bloodRank}
            challenges={challenges}
            divisionName={divisionName}
            items={visibleItems}
            myTeamId={myTeamId}
          />
        </section>
      ) : null}
    </PageShell>
  )
}
