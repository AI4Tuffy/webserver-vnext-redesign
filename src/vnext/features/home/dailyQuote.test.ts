import { describe, expect, it } from 'vitest'
import { DAILY_QUOTES, quoteForDate } from './dailyQuote'

describe('daily quote', () => {
  it('stays the same through one local day', () => {
    expect(quoteForDate(new Date(2026, 10, 12, 0, 1))).toBe(quoteForDate(new Date(2026, 10, 12, 23, 59)))
  })

  it('moves to the next quote on the next day and wraps around', () => {
    const index = (date: Date) => DAILY_QUOTES.indexOf(quoteForDate(date))
    const today = index(new Date(2026, 10, 12, 12))
    expect(index(new Date(2026, 10, 13, 12))).toBe((today + 1) % DAILY_QUOTES.length)
    expect(index(new Date(2026, 10, 12 + DAILY_QUOTES.length, 12))).toBe(today)
  })

  it('always names a source', () => {
    expect(DAILY_QUOTES.every((quote) => quote.text && quote.source)).toBe(true)
  })
})
