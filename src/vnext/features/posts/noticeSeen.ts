import type { PostInfoModel } from '@Api'

/** 本浏览器已看过的最新公告时间；只用于未读提示，读写失败时视为全部未读。 */
const NOTICE_SEEN_KEY = 'yinyu-vnext-notices-seen-at'

export function readNoticeSeenAt() {
  try {
    const value = Number(window.localStorage.getItem(NOTICE_SEEN_KEY))
    return Number.isFinite(value) ? value : 0
  } catch {
    return 0
  }
}

export function writeNoticeSeenAt(time: number) {
  try {
    window.localStorage.setItem(NOTICE_SEEN_KEY, String(time))
  } catch {
    // 存储不可用时只影响未读提示。
  }
}

export function latestNoticeTime(posts: PostInfoModel[] = []) {
  return posts.reduce((latest, post) => Math.max(latest, post.time ?? 0), 0)
}

export function unreadNoticeCount(posts: PostInfoModel[] = [], seenAt: number) {
  return posts.filter((post) => (post.time ?? 0) > seenAt).length
}
