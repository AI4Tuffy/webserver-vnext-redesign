import api from '@Api'

const swrOptions = { revalidateOnFocus: false } as const

export function usePosts() {
  return api.info.useInfoGetPosts(swrOptions)
}

/** 顶栏通知：最新公告，每 5 分钟刷新一次。 */
export function useLatestPosts() {
  return api.info.useInfoGetLatestPosts({ ...swrOptions, refreshInterval: 5 * 60 * 1000, shouldRetryOnError: false })
}

export function usePost(postId: string, enabled: boolean) {
  return api.info.useInfoGetPost(postId, swrOptions, enabled)
}
