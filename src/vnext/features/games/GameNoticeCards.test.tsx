import { fireEvent, render, screen, within } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { GameNotice, NoticeType } from '@Api'
import { GameNoticeCards } from './GameNoticeCards'

const notices = [
  { id: 2, type: NoticeType.Normal, values: ['理论考试和排行榜现已开放。'], time: Date.UTC(2026, 10, 14, 5, 19) },
  { id: 1, type: NoticeType.NewChallenge, values: ['星图校验'], time: Date.UTC(2026, 10, 14, 4, 19) },
] as GameNotice[]

describe('GameNoticeCards', () => {
  it('opens a notice in the shared dialog and closes it through native cancel or the close button', () => {
    render(<GameNoticeCards notices={notices} />)

    fireEvent.click(screen.getByRole('button', { name: /新题目已开放：星图校验/ }))
    const dialog = screen.getByRole('dialog', { name: '比赛公告' })
    expect(within(dialog).getByText('新题目已开放：星图校验')).toBeVisible()
    expect(within(dialog).getByText(/赛题更新/)).toBeVisible()
    fireEvent(dialog, new Event('cancel', { cancelable: true }))
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: /理论考试和排行榜现已开放/ }))
    const nextDialog = screen.getByRole('dialog', { name: '比赛公告' })
    expect(within(nextDialog).getByText('理论考试和排行榜现已开放。')).toBeVisible()
    fireEvent.click(within(nextDialog).getByRole('button', { name: '关闭' }))
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  })
})
