import { ChallengeInfo, ScoreboardItem, SubmissionType } from '@Api'
import { DataTable, type DataColumn } from '../../../shared'
import { useArtId } from '../../../shared/art/artIds'
import styles from './ScoreboardViews.module.css'

export interface MatrixChallenge extends ChallengeInfo {
  categoryCode: string
}

const TIMELINE_BUCKETS = 24

function pad(value: number) {
  return String(value).padStart(2, '0')
}

export function formatClock(value?: number) {
  if (!value) return '--'
  return new Intl.DateTimeFormat('zh-CN', { hour: '2-digit', minute: '2-digit', hour12: false }).format(value)
}

export function formatStamp(value?: number) {
  if (!value) return '暂无提交'
  return new Intl.DateTimeFormat('zh-CN', {
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).format(value)
}

function accepted(item: ScoreboardItem) {
  return (item.solvedChallenges ?? []).filter((entry) => entry.type !== SubmissionType.Unaccepted)
}

export type BloodRankLookup = (challengeId: number, teamId: number) => number | undefined

/** 解出名次：优先使用题目 bloods 顺序，缺失时回退到提交类型。 */
function solvePlace(lookup: BloodRankLookup, challengeId: number, teamId: number, type?: SubmissionType) {
  const place = lookup(challengeId, teamId)
  if (place !== undefined) return place + 1
  if (type === SubmissionType.FirstBlood) return 1
  if (type === SubmissionType.SecondBlood) return 2
  if (type === SubmissionType.ThirdBlood) return 3
  return undefined
}

export function createBloodRankLookup(challenges: ChallengeInfo[]): BloodRankLookup {
  const ranks = new Map<string, number>()
  for (const challenge of challenges) {
    ;(challenge.bloods ?? []).forEach((blood, index) => ranks.set(`${challenge.id}:${blood.id}`, index))
  }
  return (challengeId, teamId) => ranks.get(`${challengeId}:${teamId}`)
}

export function ScoreBars({
  items,
  maxScore,
  myTeamId,
  divisionName,
}: {
  items: ScoreboardItem[]
  maxScore: number
  myTeamId?: number
  divisionName: (item: ScoreboardItem) => string | undefined
}) {
  const hatchId = useArtId('score-hatch')
  const scale = maxScore > 0 ? 1000 / maxScore : 0

  return (
    <div className={styles.bars}>
      <svg aria-hidden="true" className={styles.svgDefs} focusable="false">
        <defs>
          <pattern height="14" id={hatchId} patternTransform="rotate(45)" patternUnits="userSpaceOnUse" width="14">
            <rect className={styles.hatchLine} height="14" width="2" />
          </pattern>
        </defs>
      </svg>
      {items.map((item) => {
        const mine = item.id === myTeamId
        const ctf = Math.max(0, Math.min(item.ctfScore, item.score))
        const other = Math.max(0, item.score - ctf)
        const ctfWidth = ctf * scale
        const otherWidth = other * scale
        const division = divisionName(item)
        return (
          <div className={styles.barRow} key={item.id}>
            <div className={styles.barHead}>
              <span className={styles.barRank}>{pad(item.rank)}</span>
              <strong className={styles.team} data-mine={mine || undefined}>
                {item.name}
              </strong>
              {division ? <span className={styles.meta}>{division}</span> : null}
              {mine ? (
                <span className={styles.team} data-mine>
                  本队
                </span>
              ) : null}
            </div>
            <div className={styles.barLine}>
              <svg aria-hidden="true" className={styles.barSvg} preserveAspectRatio="none" viewBox="0 0 1000 56">
                {ctfWidth > 0 ? <rect className={styles.barSolid} height="56" width={ctfWidth} /> : null}
                {otherWidth > 0 ? (
                  <rect
                    className={styles.barHatchFrame}
                    fill={`url(#${hatchId})`}
                    height="55"
                    width={Math.max(otherWidth - 1, 1)}
                    x={ctfWidth + 0.5}
                    y="0.5"
                  />
                ) : null}
              </svg>
              <strong className={styles.barTotal}>{item.score}</strong>
            </div>
            <div className={styles.barFacts}>
              <span>CTF {item.ctfScore}</span>
              {other ? <span>其他赛制 {other}</span> : null}
              <span>已解 {item.solvedCount}</span>
              <span>最后得分 {formatStamp(item.lastSubmissionTime)}</span>
            </div>
          </div>
        )
      })}
    </div>
  )
}

export function SolveTimeline({
  items,
  categoryOf,
  bloodRank,
  start,
  end,
  myTeamId,
}: {
  items: ScoreboardItem[]
  categoryOf: Map<number, string>
  bloodRank: BloodRankLookup
  start: number
  end: number
  myTeamId?: number
}) {
  const span = Math.max(end - start, 1)
  const bucketOf = (time: number) =>
    Math.min(TIMELINE_BUCKETS - 1, Math.max(0, Math.floor(((time - start) / span) * TIMELINE_BUCKETS)))

  return (
    <div aria-label="解题时间轴，横向滚动查看全部时段" className={styles.timelineViewport} role="region" tabIndex={0}>
      <div className={styles.timeline}>
        {items.map((item) => {
          const buckets = Array.from({ length: TIMELINE_BUCKETS }, () => [] as ReturnType<typeof accepted>)
          for (const entry of accepted(item)) {
            if (entry.time >= start && entry.time <= end) buckets[bucketOf(entry.time)].push(entry)
          }
          const mine = item.id === myTeamId
          return (
            <div className={styles.lane} key={item.id}>
              <span className={styles.laneName} data-mine={mine || undefined} title={item.name}>
                {item.name}
              </span>
              <div className={styles.laneCells}>
                {buckets.map((entries, index) => {
                  const kind = entries.some((entry) => solvePlace(bloodRank, entry.id, item.id, entry.type) === 1)
                    ? 'first'
                    : entries.length
                      ? 'later'
                      : 'none'
                  const label =
                    entries.length > 1 ? `×${entries.length}` : (categoryOf.get(entries[0]?.id ?? -1) ?? '').slice(0, 1)
                  return (
                    <span
                      className={styles.cell}
                      data-kind={kind}
                      key={index}
                      title={entries.length ? `${entries.length} 次解出` : undefined}
                    >
                      {entries.length ? label : null}
                    </span>
                  )
                })}
              </div>
              <span className={styles.laneTotal}>{item.ctfScore}</span>
            </div>
          )
        })}
        <div className={styles.axis}>
          <span />
          <div className={styles.axisTimes}>
            <span>{formatClock(start)}</span>
            <span>{formatClock(start + span / 2)}</span>
            <span>{formatClock(end)}</span>
          </div>
          <span>CTF</span>
        </div>
      </div>
    </div>
  )
}

function cellKind(solved: boolean, place?: number) {
  if (!solved) return { kind: 'none', label: '', text: '未解出' }
  if (place === 1) return { kind: 'first', label: '1', text: '一血' }
  if (place === 2) return { kind: 'later', label: '2', text: '二血' }
  if (place === 3) return { kind: 'later', label: '3', text: '三血' }
  return { kind: 'later', label: '', text: '已解出' }
}

export function SolveMatrix({
  items,
  challenges,
  bloodRank,
  myTeamId,
  divisionName,
}: {
  items: ScoreboardItem[]
  challenges: MatrixChallenge[]
  bloodRank: BloodRankLookup
  myTeamId?: number
  divisionName: (item: ScoreboardItem) => string | undefined
}) {
  const rows = items.map((item) => ({
    ...item,
    solved: new Map(accepted(item).map((entry) => [entry.id, entry.type])),
  }))
  type MatrixRow = (typeof rows)[number]
  const columns: DataColumn<MatrixRow>[] = [
    { id: 'rank', header: '名次', width: 'compact', render: (item) => pad(item.rank) },
    {
      id: 'team',
      header: '战队',
      width: 'wide',
      render: (item) => (
        <>
          <strong className={styles.team} data-mine={item.id === myTeamId || undefined}>
            {item.name}
          </strong>
          <small className={styles.meta}>最后得分 {formatStamp(item.lastSubmissionTime)}</small>
        </>
      ),
    },
    { id: 'division', header: '赛区', render: (item) => divisionName(item) ?? '默认赛区' },
    { id: 'score', header: '总分', width: 'compact', align: 'right', render: (item) => item.score },
    { id: 'solves', header: '解题', width: 'compact', align: 'right', render: (item) => item.solvedCount },
    ...challenges.map(
      (challenge): DataColumn<MatrixRow> => ({
        id: String(challenge.id),
        width: 'compact',
        header: (
          <>
            <span className={styles.challengeTitle} title={challenge.title}>
              {challenge.title}
            </span>
            <small className={styles.meta}>
              {challenge.categoryCode} {challenge.score}
            </small>
          </>
        ),
        render: (item) => {
          const place = solvePlace(bloodRank, challenge.id, item.id, item.solved.get(challenge.id))
          const cell = cellKind(item.solved.has(challenge.id), place)
          return (
            <span
              aria-label={`${challenge.title}：${cell.text}`}
              className={styles.cell}
              data-kind={cell.kind}
              role="img"
              title={cell.text}
            >
              {cell.label}
            </span>
          )
        },
      })
    ),
  ]

  return <DataTable caption="各战队解题明细" columns={columns} rowKey={(item) => item.id} rows={rows} />
}

export function scoreboardTotals(items: ScoreboardItem[], bloodRank: BloodRankLookup) {
  const firstBloods = (item: ScoreboardItem) =>
    accepted(item).filter((entry) => solvePlace(bloodRank, entry.id, item.id, entry.type) === 1).length
  let flags = 0
  let bloods = 0
  for (const item of items) {
    flags += accepted(item).length
    bloods += firstBloods(item)
  }
  const leader = items[0]
  return { flags, bloods, leaderBloods: leader ? firstBloods(leader) : 0 }
}
