import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { GameNotice, NoticeType } from '@Api'
import { GameNoticeCards } from './GameNoticeCards'

const notices = [
  { id: 2, type: NoticeType.Normal, values: ['理论考试和排行榜现已开放。'], time: Date.UTC(2026, 10, 14, 5, 19) },
  { id: 1, type: NoticeType.NewChallenge, values: ['星图校验'], time: Date.UTC(2026, 10, 14, 4, 19) },
] as GameNotice[]

describe('GameNoticeCards', () => {
  // 测试环境没有逐帧动画，收回动画不会播完；这里断言状态：关闭后原卡片重新出现、焦点回到卡片列表
  it('opens a notice in a dialog and closes it with Escape or the close button', async () => {
    render(<GameNoticeCards idPrefix="test-notice" notices={notices} />)

    fireEvent.click(screen.getByRole('button', { name: /新题目已开放：星图校验/ }))
    const dialog = await screen.findByRole('dialog', { name: '新题目已开放：星图校验' })
    expect(dialog).toHaveAttribute('aria-modal', 'true')
    expect(screen.getByRole('button', { name: '关闭公告' })).toHaveFocus()
    expect(screen.queryByRole('button', { name: /新题目已开放：星图校验/ })).not.toBeInTheDocument()

    fireEvent.keyDown(dialog, { key: 'Escape' })
    expect(await screen.findByRole('button', { name: /新题目已开放：星图校验/ })).toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: /理论考试和排行榜现已开放/ }))
    await screen.findByRole('dialog', { name: '理论考试和排行榜现已开放。' })
    fireEvent.click(screen.getAllByRole('button', { name: '关闭公告' }).at(-1)!)
    expect(await screen.findByRole('button', { name: /理论考试和排行榜现已开放/ })).toBeInTheDocument()
  })
})
