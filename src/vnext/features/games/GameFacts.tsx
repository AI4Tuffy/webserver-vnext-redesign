import { UserRound, Users } from 'lucide-react'
import { ReactNode, useId } from 'react'
import { DetailedGameInfoModel } from '@Api'
import styles from './GameFacts.module.css'
import { participationLabel } from './gameCatalog'

/** 当年的比赛省去年份，放得进一栏不折行。 */
function shortDate(value: number) {
  const sameYear = new Date(value).getFullYear() === new Date().getFullYear()
  return new Intl.DateTimeFormat('zh-CN', {
    year: sameYear ? undefined : 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).format(value)
}

/** 剩余时间拆成「天、小时、分钟」；不满一天时省去天，始终写出分钟。 */
export function durationParts(ms: number): Array<[number, string]> {
  const totalMinutes = Math.max(0, Math.floor(ms / 60_000))
  const days = Math.floor(totalMinutes / 1440)
  const hours = Math.floor((totalMinutes % 1440) / 60)
  const minutes = totalMinutes % 60
  const parts: Array<[number, string]> = []
  if (days) parts.push([days, '天'])
  if (days || hours) parts.push([hours, '小时'])
  parts.push([minutes, '分钟'])
  return parts
}

/** 数字用衬线大字，单位用小一号的字。 */
function Duration({ ms }: { ms: number }) {
  return (
    <>
      {durationParts(ms).map(([value, unit]) => (
        <span className={styles.durationPart} key={unit}>
          {value}
          <small>{unit}</small>
        </span>
      ))}
    </>
  )
}

/**
 * 比赛进程：一条圆头的粗进度条。已过去的部分是实心绿色，还没到的部分是斜线阴影，
 * 圆形旋钮标出此刻。未开始时整条是斜线阴影；结束后整条填成灰色，不再有旋钮。
 * 不设 viewBox，宽度与位置用百分比，圆角和旋钮不会被拉伸变形。
 */
export function GameTimeline({ start, end, now }: { start?: number; end?: number; now: number }) {
  const hatchId = `timeline-hatch-${useId().replace(/:/g, '')}`
  if (!start || !end || end <= start) return null
  const total = end - start
  const ratio = Math.min(1, Math.max(0, (now - start) / total))
  const state = now < start ? 'upcoming' : now >= end ? 'ended' : 'ongoing'
  const summary =
    state === 'upcoming' ? (
      <>
        距开始 <Duration ms={start - now} />
      </>
    ) : state === 'ended' ? (
      '已结束'
    ) : (
      <>
        剩余 <Duration ms={end - now} />
      </>
    )

  return (
    <section aria-label="比赛进程" className={styles.timeline} data-state={state}>
      <div className={styles.timelineHead}>
        <span>比赛进程</span>
        <strong>{summary}</strong>
      </div>
      <svg aria-hidden="true" className={styles.timelineBar}>
        <defs>
          <pattern height="7" id={hatchId} patternTransform="rotate(45)" patternUnits="userSpaceOnUse" width="7">
            <line className={styles.hatchLine} strokeWidth="2.2" x1="0" x2="0" y1="0" y2="7" />
          </pattern>
        </defs>
        <rect className={styles.track} height="12" rx="6" width="100%" y="7" />
        <rect fill={`url(#${hatchId})`} height="12" rx="6" width="100%" y="7" />
        {ratio > 0 ? <rect className={styles.fill} height="12" rx="6" width={`${ratio * 100}%`} y="7" /> : null}
        {state === 'ongoing' ? (
          <g>
            <circle className={styles.knob} cx={`${ratio * 100}%`} cy="13" r="9" strokeWidth="2" />
            <circle className={styles.knobDot} cx={`${ratio * 100}%`} cy="13" r="3.5" />
          </g>
        ) : null}
      </svg>
      <div className={styles.timelineEnds}>
        <span>
          <time dateTime={new Date(start).toISOString()}>{shortDate(start)}</time> 开始
        </span>
        <span>
          <time dateTime={new Date(end).toISOString()}>{shortDate(end)}</time> 结束
        </span>
      </div>
    </section>
  )
}

/** 赛制：每队人数上限画成同样数量的小人（至多 8 个），后面写参赛方式；团队赛不限人数时画一组人。 */
function FormatFact({ limit }: { limit?: number }) {
  const count = limit ? Math.min(limit, 8) : 0
  return (
    <>
      <span aria-hidden="true" className={styles.people}>
        {count ? (
          Array.from({ length: count }, (_, index) => <UserRound key={index} size={15} strokeWidth={1.8} />)
        ) : (
          <Users size={16} strokeWidth={1.8} />
        )}
      </span>
      {participationLabel(limit)}
    </>
  )
}

/**
 * 比赛事实栏：赛制（每队人数）、已报名队伍、赛区，以及只在设置了时出现的邀请码、Writeup 与赛后练习。
 * 每一项都来自比赛设置，不补写不存在的规则。
 */
export function GameFacts({ game }: { game: DetailedGameInfoModel }) {
  const divisionNames = (game.divisions ?? []).map((division) => division.name).filter(Boolean) as string[]
  const facts: Array<[string, ReactNode]> = [
    ['赛制', <FormatFact key="format" limit={game.limit} />],
    ['已报名', `${game.teamCount ?? 0} 支队伍`],
  ]
  if (divisionNames.length)
    facts.push([
      '赛区',
      <span className={styles.chips} key="divisions">
        {divisionNames.map((name) => (
          <span className={styles.chip} key={name}>
            {name}
          </span>
        ))}
      </span>,
    ])
  if (game.inviteCodeRequired) facts.push(['邀请码', '报名时需要'])
  if (game.writeupRequired) facts.push(['Writeup', '赛后需要提交'])
  if (game.practiceMode) facts.push(['赛后练习', '结束后开放'])

  return (
    <dl className={styles.facts}>
      {facts.map(([label, value]) => (
        <div key={label}>
          <dt>{label}</dt>
          <dd>{value}</dd>
        </div>
      ))}
    </dl>
  )
}
