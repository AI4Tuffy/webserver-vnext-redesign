import { describe, expect, it } from 'vitest'
import type { UserActivityPoint } from '../profile/api/userProfileApi'
import { buildFootprint, footprintRange, footprintWeeksFor, FOOTPRINT_MAX_WEEKS, FOOTPRINT_MIN_WEEKS } from './footprint'

// 2026-11-12 是周四。
const today = new Date(2026, 10, 12, 15, 30)

function point(date: string, total: number): UserActivityPoint {
  return { date, total, ctf: total, training: 0, theory: 0, awdp: 0, penetration: 0 }
}

describe('learning footprint calendar', () => {
  it('fits as many GitHub-sized weeks as the width allows', () => {
    expect(footprintWeeksFor(454)).toBe(31)
    expect(footprintWeeksFor(120)).toBe(FOOTPRINT_MIN_WEEKS)
    expect(footprintWeeksFor(5000)).toBe(FOOTPRINT_MAX_WEEKS)
  })

  it('requests the last 52 Monday-first weeks up to today', () => {
    expect(footprintRange(today)).toEqual({ from: '2025-11-17', to: '2026-11-12' })
  })

  it('lays out the requested weeks ending with the current week', () => {
    const { cells } = buildFootprint([], 16, today)
    expect(cells).toHaveLength(16 * 7)
    expect(cells[0].key).toBe('2026-07-27')
    expect(cells.at(-7)?.key).toBe('2026-11-09')
    expect(cells.filter((cell) => cell.future).map((cell) => cell.key)).toEqual(['2026-11-13', '2026-11-14', '2026-11-15'])
  })

  it('labels the first week of each month and counts only past active days', () => {
    const { monthLabels, activeDays } = buildFootprint(
      [point('2026-11-12', 3), point('2026-11-10', 1), point('2026-11-14', 9)],
      16,
      today
    )
    expect(monthLabels.filter(Boolean)).toEqual(['8月', '9月', '10月', '11月'])
    expect(monthLabels[0]).toBe('')
    expect(activeDays).toBe(2)
  })
})
