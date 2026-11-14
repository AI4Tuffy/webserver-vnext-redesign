import { describe, expect, it } from 'vitest'
import { greetingFor } from './homeGreeting'

describe('home greeting', () => {
  it('follows the local hour', () => {
    expect([4, 5, 10, 11, 12, 13, 17, 18, 22, 23, 0].map(greetingFor)).toEqual([
      '夜深了',
      '早上好',
      '早上好',
      '中午好',
      '中午好',
      '下午好',
      '下午好',
      '晚上好',
      '晚上好',
      '夜深了',
      '夜深了',
    ])
  })
})
