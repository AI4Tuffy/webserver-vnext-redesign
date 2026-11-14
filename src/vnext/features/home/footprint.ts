import { localDateKey } from '../../shared/dates'
import type { UserActivityPoint } from '../profile/api/userProfileApi'
import { activityLevel, type HeatmapCell } from '../profile/profileDomain'

/** 与 GitHub 贡献图相近的方格：边长 11px、间距 3px；左侧星期标签连同间距约占 22px。 */
export const FOOTPRINT_CELL = 11
export const FOOTPRINT_GAP = 3
export const FOOTPRINT_LABEL_WIDTH = 22
export const FOOTPRINT_MIN_WEEKS = 8
/** 一次请求最近 52 周（不超过 364 天），按卡片宽度显示其中最近的若干周。 */
export const FOOTPRINT_MAX_WEEKS = 52

/** 行顺序为周一到周日，只在周一、周三、周五标注。 */
export const FOOTPRINT_WEEKDAYS = ['一', '', '三', '', '五', '', '']

export interface FootprintCell {
  key: string
  level: HeatmapCell['level']
  future: boolean
}

/** 按可用宽度计算能放下的周数。 */
export function footprintWeeksFor(width: number) {
  const weeks = Math.floor((width - FOOTPRINT_LABEL_WIDTH + FOOTPRINT_GAP) / (FOOTPRINT_CELL + FOOTPRINT_GAP))
  return Math.min(FOOTPRINT_MAX_WEEKS, Math.max(FOOTPRINT_MIN_WEEKS, weeks))
}

function weekSpan(today: Date, weeks: number) {
  const end = new Date(today)
  end.setHours(0, 0, 0, 0)
  const start = new Date(end)
  start.setDate(end.getDate() - ((end.getDay() + 6) % 7) - (weeks - 1) * 7)
  return { start, end }
}

/** 请求范围：最近 52 周的第一个周一到今天。 */
export function footprintRange(today = new Date()) {
  const { start, end } = weekSpan(today, FOOTPRINT_MAX_WEEKS)
  return { from: localDateKey(start), to: localDateKey(end) }
}

/**
 * 按周排列的 weeks × 7 方格：最后一列是本周（周一开始），本周尚未到来的日期标记为 future。
 * 月份标签放在该月第一个周一所在的列；第一列只在后两列仍是同月时标注，避免与下一标签重叠。
 */
export function buildFootprint(points: UserActivityPoint[], weeks: number, today = new Date()) {
  const totals = new Map(points.map((point) => [point.date, point.total]))
  const { start, end } = weekSpan(today, weeks)

  const cells: FootprintCell[] = Array.from({ length: weeks * 7 }, (_, index) => {
    const date = new Date(start)
    date.setDate(start.getDate() + index)
    const key = localDateKey(date)
    const future = date > end
    return { key, future, level: future ? 0 : activityLevel(totals.get(key) ?? 0) }
  })

  const weekMonths = Array.from({ length: weeks }, (_, week) => {
    const monday = new Date(start)
    monday.setDate(start.getDate() + week * 7)
    return monday.getMonth()
  })
  const monthLabels = weekMonths.map((month, week) => {
    if (week === 0) return weekMonths[1] === month && weekMonths[2] === month ? `${month + 1}月` : ''
    return month === weekMonths[week - 1] ? '' : `${month + 1}月`
  })

  return {
    cells,
    monthLabels,
    activeDays: cells.filter((cell) => !cell.future && cell.level > 0).length,
  }
}
