import { X } from 'lucide-react'
import { AnimatePresence, motion, MotionConfig } from 'motion/react'
import { KeyboardEvent, useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { GameNotice, NoticeType } from '@Api'
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

/**
 * 比赛公告卡片：左侧色底手绘图标，右侧至多两行正文与「类型 · 时间」。
 * 点击后卡片放大到屏幕中央显示完整公告，背景变暗；点叉、点卡片外或按 Esc 收回，焦点回到原卡片。
 */
export function GameNoticeCards({ notices, idPrefix }: { notices: GameNotice[]; idPrefix: string }) {
  const [openKey, setOpenKey] = useState<string | null>(null)
  const cardRefs = useRef(new Map<string, HTMLButtonElement>())
  const closeRef = useRef<HTMLButtonElement>(null)
  const returnKey = useRef<string | null>(null)
  const open = notices.find((notice) => noticeKey(notice) === openKey)

  useEffect(() => {
    if (open) closeRef.current?.focus()
  }, [open])

  const close = () => {
    returnKey.current = openKey
    setOpenKey(null)
  }

  // 收回动画结束后再把焦点还给原卡片，避免焦点落在正在消失的元素上
  const restoreFocus = () => {
    if (returnKey.current) cardRefs.current.get(returnKey.current)?.focus()
    returnKey.current = null
  }

  const onDialogKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (event.key === 'Escape') {
      event.stopPropagation()
      close()
    }
    // 对话框里只有关闭按钮可以获得焦点，Tab 留在它身上
    if (event.key === 'Tab') {
      event.preventDefault()
      closeRef.current?.focus()
    }
  }

  return (
    <MotionConfig reducedMotion="user" transition={{ type: 'spring', stiffness: 420, damping: 38 }}>
      <ul className={styles.cards}>
        {notices.map((notice, index) => {
          const key = noticeKey(notice)
          const kind = noticeLevel(notice.type)
          return (
            <li key={key}>
              {openKey === key ? (
                <div aria-hidden="true" className={styles.placeholder} />
              ) : (
                <motion.button
                  aria-haspopup="dialog"
                  className={styles.card}
                  layoutId={`${idPrefix}-${key}`}
                  onClick={() => setOpenKey(key)}
                  ref={(node) => {
                    if (node) cardRefs.current.set(key, node)
                    else cardRefs.current.delete(key)
                  }}
                  type="button"
                >
                  <motion.span aria-hidden="true" className={styles.tile} layoutId={`${idPrefix}-${key}-tile`}>
                    <SpotTile height={100} icon={kind.icon} palette={kind.palette} seed={index + 5} width={88} />
                  </motion.span>
                  <span className={styles.cardBody}>
                    <span className={styles.cardText}>{noticeText(notice.type, notice.values)}</span>
                    <span className={styles.cardMeta}>
                      {kind.label} · <time dateTime={new Date(notice.time).toISOString()}>{noticeTime(notice.time)}</time>
                    </span>
                  </span>
                </motion.button>
              )}
            </li>
          )
        })}
      </ul>

      {createPortal(
        <AnimatePresence onExitComplete={restoreFocus}>
          {open ? (
            <div className={styles.layer} key="notice-layer">
              <motion.div
                animate={{ opacity: 1 }}
                aria-hidden="true"
                className={styles.scrim}
                exit={{ opacity: 0 }}
                initial={{ opacity: 0 }}
                onClick={close}
                transition={{ duration: 0.2 }}
              />
              <motion.div
                aria-labelledby={`${idPrefix}-dialog-title`}
                aria-modal="true"
                className={styles.dialog}
                layoutId={`${idPrefix}-${noticeKey(open)}`}
                onKeyDown={onDialogKeyDown}
                role="dialog"
              >
                <button aria-label="关闭公告" className={styles.close} onClick={close} ref={closeRef} type="button">
                  <X size={18} />
                </button>
                <motion.span aria-hidden="true" className={styles.dialogTile} layoutId={`${idPrefix}-${noticeKey(open)}-tile`}>
                  <SpotTile
                    height={200}
                    icon={noticeLevel(open.type).icon}
                    palette={noticeLevel(open.type).palette}
                    seed={notices.indexOf(open) + 5}
                    width={560}
                  />
                </motion.span>
                <motion.div
                  animate={{ opacity: 1, y: 0 }}
                  className={styles.dialogBody}
                  exit={{ opacity: 0 }}
                  initial={{ opacity: 0, y: 8 }}
                  transition={{ delay: 0.08, duration: 0.2 }}
                >
                  <p className={styles.dialogMeta}>
                    {noticeLevel(open.type).label} ·{' '}
                    <time dateTime={new Date(open.time).toISOString()}>{noticeTime(open.time, true)}</time>
                  </p>
                  <h3 className={styles.dialogText} id={`${idPrefix}-dialog-title`}>
                    {noticeText(open.type, open.values)}
                  </h3>
                </motion.div>
              </motion.div>
            </div>
          ) : null}
        </AnimatePresence>,
        document.body
      )}
    </MotionConfig>
  )
}
