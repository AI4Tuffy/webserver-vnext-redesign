import { render } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { posterIcon, posterSeed } from '../../shared/art/spot'
import { GamePosterArt } from './GamePosterArt'

describe('GamePosterArt', () => {
  it('draws hand-drawn icon tiles tinted by game status, with unique ids', () => {
    const { container } = render(
      <>
        <GamePosterArt seed={0} status="ongoing" />
        <GamePosterArt seed={1} status="upcoming" />
        <GamePosterArt seed={2} status="ended" />
      </>
    )

    const tiles = [...container.querySelectorAll('svg')]
    expect(tiles.map((tile) => tile.getAttribute('data-palette'))).toEqual(['peach', 'lavender', 'sand'])
    tiles.forEach((tile) => expect(tile).toHaveAttribute('aria-hidden', 'true'))
    const ids = [...container.querySelectorAll('[id]')].map((node) => node.id)
    expect(new Set(ids).size).toBe(ids.length)
  })

  it('never repeats the icon for neighbouring seeds and derives stable seeds from text', () => {
    for (let seed = 0; seed < 10; seed += 1) {
      expect(posterIcon('game', seed)).not.toBe(posterIcon('game', seed + 1))
      expect(posterIcon('course', seed)).not.toBe(posterIcon('course', seed + 1))
    }
    expect(posterSeed('HTTP 与 Web 基础')).toBe(posterSeed('HTTP 与 Web 基础'))
    expect(posterSeed('a')).not.toBe(posterSeed('b'))
  })
})
