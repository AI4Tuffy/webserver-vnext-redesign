import { render } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { ChallengeCategory } from '@Api'
import { ModulePageArt } from '../../shared/art/ModulePageArt'
import { ChallengeArt } from '../games/challenges/ChallengeArt'
import { ScoreboardArt } from '../games/scoreboard/ScoreboardArt'
import { CourseCardArt, GameCardArt, UpcomingCardArt } from './HomeCardArt'
import { HomeHeroArt } from './HomeHeroArt'

const CJK = /[一-鿿]/

function visibleText(container: HTMLElement) {
  return Array.from(container.querySelectorAll('text'))
    .map((node) => node.textContent ?? '')
    .join('\n')
}

describe('hand-drawn illustrations', () => {
  it('keep visible illustration text free of Chinese characters', () => {
    const { container } = render(
      <div>
        <HomeHeroArt />
        <GameCardArt />
        <CourseCardArt />
        <UpcomingCardArt day="16" month="NOV" />
        {(['games', 'practice', 'training', 'teams', 'teamlab'] as const).map((kind) => (
          <ModulePageArt key={kind} kind={kind} />
        ))}
        {Object.values(ChallengeCategory).map((category) => (
          <ChallengeArt category={category} key={category} />
        ))}
      </div>
    )

    expect(visibleText(container)).not.toMatch(CJK)
  })

  it('gives every illustration instance its own pattern ids', () => {
    const { container } = render(
      <div>
        <GameCardArt />
        <GameCardArt />
      </div>
    )
    const ids = Array.from(container.querySelectorAll('pattern')).map((node) => node.id)
    expect(new Set(ids).size).toBe(ids.length)
  })

  it('draws the scoreboard collage from live standings', () => {
    const { container } = render(
      <ScoreboardArt
        bloodCount={4}
        flagCount={7}
        gapToNext={{ rank: 2, points: 30 }}
        leaderBloods={4}
        podium={[
          { rank: 1, score: 785, mine: false },
          { rank: 2, score: 345, mine: false },
          { rank: 3, score: 315, mine: true },
        ]}
        receipt={[
          { rank: 1, score: 785, mine: false },
          { rank: 2, score: 345, mine: false },
          { rank: 3, score: 315, mine: true },
        ]}
        teamCount={3}
      />
    )
    const text = visibleText(container)

    expect(text).toContain('FIRST BLOOD ×4')
    expect(text).toContain('us!')
    expect(text).toContain('30 pts to #2')
    expect(text).toContain('FLAGS 7   BLOODS 4')
    expect(text).not.toMatch(CJK)
  })
})
