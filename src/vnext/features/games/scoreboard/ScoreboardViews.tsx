import { ChallengeInfo, ScoreboardItem, SubmissionType } from '@Api'
import { useArtId } from '../../../shared/art/artIds'
import styles from './ScoreboardPage.module.css'

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
              <strong className={mine ? styles.mineName : undefined}>{item.name}</strong>
              {division ? <span className={styles.barDivision}>{division}</span> : null}
              {mine ? <span className={styles.mineTag}>← 本队</span> : null}
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
    <div className={styles.timelineViewport}>
      <div className={styles.timeline}>
        {items.map((item) => {
          const buckets = Array.from({ length: TIMELINE_BUCKETS }, () => [] as ReturnType<typeof accepted>)
          for (const entry of accepted(item)) {
            if (entry.time >= start && entry.time <= end) buckets[bucketOf(entry.time)].push(entry)
          }
          const mine = item.id === myTeamId
          return (
            <div className={styles.lane} key={item.id}>
              <span className={mine ? styles.laneNameMine : styles.laneName}>{item.name}</span>
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
                    <span data-kind={kind} key={index} title={entries.length ? `${entries.length} 次解出` : undefined}>
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
          <div>
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
  return (
    <div className={styles.matrixViewport}>
      <table className={styles.matrix}>
        <thead>
          <tr>
            <th scope="col">名次</th>
            <th scope="col">战队</th>
            <th scope="col">赛区</th>
            <th className={styles.numeric} scope="col">
              总分
            </th>
            <th className={styles.numeric} scope="col">
              解题
            </th>
            {challenges.map((challenge) => (
              <th className={styles.challengeColumn} key={challenge.id} scope="col" title={challenge.title}>
                <span>{challenge.title}</span>
                <small>
                  {challenge.categoryCode} {challenge.score}
                </small>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {items.map((item) => {
            const mine = item.id === myTeamId
            const solved = new Map(accepted(item).map((entry) => [entry.id, entry.type]))
            return (
              <tr data-mine={mine || undefined} key={item.id}>
                <td className={styles.matrixRank}>{pad(item.rank)}</td>
                <th scope="row">
                  <span className={mine ? styles.mineName : undefined}>{item.name}</span>
                  <small>最后得分 {formatStamp(item.lastSubmissionTime)}</small>
                </th>
                <td className={styles.matrixMuted}>{divisionName(item) ?? '默认赛区'}</td>
                <td className={styles.matrixTotal}>{item.score}</td>
                <td className={styles.numeric}>{item.solvedCount}</td>
                {challenges.map((challenge) => {
                  const type = solved.get(challenge.id)
                  const cell = cellKind(solved.has(challenge.id), solvePlace(bloodRank, challenge.id, item.id, type))
                  return (
                    <td className={styles.matrixCell} key={challenge.id}>
                      <span aria-label={`${challenge.title}：${cell.text}`} data-kind={cell.kind} role="img">
                        {cell.label}
                      </span>
                    </td>
                  )
                })}
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
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
