import { isAxiosError } from 'axios'
import useSWR from 'swr'
import api, { ParticipationStatus } from '@Api'
import { userProfileApi } from '../profile/api/userProfileApi'

const swrOptions = { revalidateOnFocus: false } as const

const PARTICIPATION_BATCH = 4

async function isParticipating(gameId: number) {
  try {
    const { data } = await api.game.gameGame(gameId)
    return data.status === ParticipationStatus.Accepted
  } catch (error) {
    if (isAxiosError(error) && error.response?.status === 404) return false
    throw error
  }
}

/**
 * 按传入顺序检查报名状态，返回前 limit 个报名通过的赛事 id。
 * 每批并发 4 个请求，凑够 limit 个即停止。
 */
export function useParticipatedGames(accountId: string | undefined, gameIds: number[], limit: number) {
  return useSWR(
    accountId && gameIds.length ? ['vnext:home-participated-games', accountId, gameIds, limit] as const : null,
    async ([, , ids, max]) => {
      const accepted: number[] = []
      for (let index = 0; index < ids.length && accepted.length < max; index += PARTICIPATION_BATCH) {
        const batch = ids.slice(index, index + PARTICIPATION_BATCH)
        const results = await Promise.all(batch.map(isParticipating))
        batch.forEach((id, position) => {
          if (results[position] && accepted.length < max) accepted.push(id)
        })
      }
      return accepted
    },
    { ...swrOptions, dedupingInterval: 0, refreshInterval: 5 * 60 * 1000, shouldRetryOnError: false }
  )
}

export function useHomeCourses(enabled: boolean) {
  return api.trainingCourse.useTrainingCourseCourses({
    ...swrOptions,
    refreshInterval: 5 * 60 * 1000,
    shouldRetryOnError: false,
  }, enabled)
}

/** 账户摘要中的 continueItems 由后端给出“继续进行”的入口，首页取第一项作为“从上次的地方开始”。 */
export function useHomeAccountSummary(enabled: boolean) {
  return api.account.useAccountSummary({ ...swrOptions, shouldRetryOnError: false }, enabled)
}

/** 学习足迹：个人活动接口支持任意日期范围，按最近 52 周请求一次。 */
export function useHomeActivity(userId: string | undefined, from: string, to: string) {
  return useSWR(
    userId ? ['vnext:home-activity', userId, from, to] : null,
    () => userProfileApi.activity(userId as string, from, to),
    { ...swrOptions, refreshInterval: 5 * 60 * 1000, shouldRetryOnError: false }
  )
}
