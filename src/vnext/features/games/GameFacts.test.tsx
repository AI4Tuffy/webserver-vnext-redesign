import { describe, expect, it } from 'vitest'
import { durationParts } from './GameFacts'

describe('durationParts', () => {
  it('splits remaining time into days, hours and minutes, dropping leading empty units', () => {
    expect(durationParts(0)).toEqual([[0, '分钟']])
    expect(durationParts(42 * 60_000)).toEqual([[42, '分钟']])
    expect(durationParts((5 * 60 + 42) * 60_000)).toEqual([[5, '小时'], [42, '分钟']])
    expect(durationParts((13 * 1440 + 22 * 60 + 36) * 60_000)).toEqual([[13, '天'], [22, '小时'], [36, '分钟']])
    expect(durationParts((2 * 1440 + 15) * 60_000)).toEqual([[2, '天'], [0, '小时'], [15, '分钟']])
    expect(durationParts(-1)).toEqual([[0, '分钟']])
  })
})
