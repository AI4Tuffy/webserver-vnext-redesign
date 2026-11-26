import { useState } from 'react'
import { GameNotice, NoticeType } from '@Api'
import { HairlineItem, HairlineList } from '../../shared/DataView'
import { VNextDialog } from '../../shared/Interaction'
import { SpotIconName, SpotPalette, SpotTile } from '../../shared/art/spot'
import styles from './GameNoticeCards.module.css'

/**
 * 公告分三级，各有一枚手绘图标与一种色调：通知（喇叭）、赛题更新（铃铛）、战况（奖章）。
 * 后端只有公告类型，没有等级字段，所以按类型归级：管理员发布的普通公告为「通知」，
 * 新题目与新提示为「赛题更新」，一二三血为「战况」。
 */
const NOTICE_LEVELS = {
  notice: { label: '通知', icon: 'megaphone', palette: 'sky' },
  update: { label: '赛题更新', icon: 'bell', palette: 'peach' },
  result: { label: '战况', icon: 'medal', palette: 'sage' },
} satisfies Record<string, { label: string; icon: SpotIconName; palette: SpotPalette }>

function noticeLevel(type: NoticeType) {
  if (type === NoticeType.NewChallenge || type === NoticeType.NewHint) return NOTICE_LEVELS.update
  if (type === NoticeType.FirstBlood || type === NoticeType.SecondBlood || type === NoticeType.ThirdBlood)
    return NOTICE_LEVELS.result
  return NOTICE_LEVELS.notice
}

export function noticeText(type: NoticeType, values: string[]) {
  const last = values.at(-1) || '比赛状态已更新'
  if (type === NoticeType.NewChallenge) return `新题目已开放：${last}`
  if (type === NoticeType.NewHint) return `新提示已发布：${last}`
  if (type === NoticeType.FirstBlood) return `一血产生：${values.join(' · ')}`
  if (type === NoticeType.SecondBlood) return `二血产生：${values.join(' · ')}`
  if (type === NoticeType.ThirdBlood) return `三血产生：${values.join(' · ')}`
  return last
}

function noticeTime(value: number, withYear = false) {
  return new Intl.DateTimeFormat('zh-CN', {
    year: withYear ? 'numeric' : undefined,
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).format(value)
}

function noticeKey(notice: GameNotice) {
  return `${notice.id}:${notice.time}`
}

export function GameNoticeCards({ notices }: { notices: GameNotice[] }) {
  const [openKey, setOpenKey] = useState<string | null>(null)
  const activeIndex = notices.findIndex((notice) => noticeKey(notice) === openKey)
  const active = notices[activeIndex]
  const level = active && noticeLevel(active.type)

  return (
    <>
      <HairlineList aria-label="比赛公告">
        {notices.map((notice, index) => {
          const key = noticeKey(notice)
          const kind = noticeLevel(notice.type)
          return (
            <HairlineItem key={key} onClick={() => setOpenKey(key)}>
              <span className={styles.row}>
                <span className={styles.tile}>
                  <SpotTile height={88} icon={kind.icon} palette={kind.palette} seed={index + 5} width={88} />
                </span>
                <span className={styles.copy}>
                  <span className={styles.text}>{noticeText(notice.type, notice.values)}</span>
                  <span className={styles.meta}>
                    {kind.label} ·{' '}
                    <time className={styles.time} dateTime={new Date(notice.time).toISOString()}>
                      {noticeTime(notice.time)}
                    </time>
                  </span>
                </span>
              </span>
            </HairlineItem>
          )
        })}
      </HairlineList>
      <VNextDialog
        description={active && `${level.label} · ${noticeTime(active.time, true)}`}
        onClose={() => setOpenKey(null)}
        open={Boolean(active)}
        title="比赛公告"
      >
        {active && (
          <>
            <div className={styles.dialogTile}>
              <SpotTile height={200} icon={level.icon} palette={level.palette} seed={activeIndex + 5} width={560} />
            </div>
            <p className={styles.fullText}>{noticeText(active.type, active.values)}</p>
          </>
        )}
      </VNextDialog>
    </>
  )
}
