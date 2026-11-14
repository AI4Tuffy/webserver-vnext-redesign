import { afterEach, describe, expect, it, vi } from 'vitest'
import type { PostInfoModel } from '@Api'
import { latestNoticeTime, readNoticeSeenAt, unreadNoticeCount, writeNoticeSeenAt } from './noticeSeen'

const posts = [
  { id: 'a', title: 'A', summary: 'a', isPinned: false, time: 300 },
  { id: 'b', title: 'B', summary: 'b', isPinned: true, time: 100 },
] as PostInfoModel[]

describe('notice unread state', () => {
  afterEach(() => {
    window.localStorage.clear()
    vi.restoreAllMocks()
  })

  it('counts announcements newer than the last seen time', () => {
    expect(unreadNoticeCount(posts, 0)).toBe(2)
    expect(unreadNoticeCount(posts, 100)).toBe(1)
    expect(unreadNoticeCount(posts, latestNoticeTime(posts))).toBe(0)
  })

  it('remembers the seen time and tolerates unavailable storage', () => {
    writeNoticeSeenAt(300)
    expect(readNoticeSeenAt()).toBe(300)

    vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
      throw new Error('blocked')
    })
    expect(readNoticeSeenAt()).toBe(0)
  })
})
