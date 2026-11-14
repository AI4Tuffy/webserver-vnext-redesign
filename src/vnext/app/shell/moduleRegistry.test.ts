import { describe, expect, it } from 'vitest'
import { currentModule, isHomeSection, parentRouteFor } from './moduleRegistry'

describe('currentModule', () => {
  it.each([
    ['/admin/teamlab', 'teamlab'],
    ['/admin/teamlab/scenes/scene-a/design', 'teamlab'],
    ['/admin/users', 'admin'],
  ])('selects one most-specific module for %s', (pathname, expectedId) => {
    expect(currentModule(pathname).id).toBe(expectedId)
  })
})

describe('isHomeSection', () => {
  const own = '11111111-1111-4111-8111-111111111111'

  it.each([
    ['/', true],
    ['/settings', true],
    ['/settings/security', true],
    ['/users/me', true],
    [`/users/${own.toUpperCase()}`, true],
    ['/users/22222222-2222-4222-8222-222222222222', false],
    ['/users/me/history', false],
    ['/games', false],
    ['/settingsx', false],
  ])('treats %s as home section: %s', (pathname, expected) => {
    expect(isHomeSection(pathname, own)).toBe(expected)
  })
})

describe('parentRouteFor', () => {
  const own = '11111111-1111-4111-8111-111111111111'

  it.each([
    ['/', null],
    ['/users/me', '/'],
    [`/users/${own}`, '/'],
    ['/settings/security', '/'],
    ['/users/22222222-2222-4222-8222-222222222222', null],
    ['/games', null],
    ['/games/1', '/games'],
    ['/games/1/challenges', '/games/1'],
    ['/games/1/theory-scoreboard', '/games/1'],
    ['/posts', null],
    ['/posts/abc', '/posts'],
    ['/practice', null],
    ['/practice/browse', null],
    ['/practice/stats', '/practice'],
    ['/practice/challenge/7', '/practice'],
    ['/training', null],
    ['/training/courses/new', '/training'],
    ['/training/courses/3', '/training'],
    ['/training/courses/3/edit', '/training/courses/3'],
    ['/training/courses/3/chapters/new', '/training/courses/3?tab=chapters'],
    ['/training/courses/3/chapters/5/edit', '/training/courses/3?tab=chapters'],
    ['/training/courses/3/challenges/new', '/training/courses/3?tab=challenges'],
    ['/training/courses/3/challenges/9/edit', '/training/courses/3?tab=challenges'],
    ['/training/courses/3/chapters/5/theory-edit', '/training/courses/3?tab=homework'],
    ['/training/courses/3/chapters/5/theory', '/training/courses/3/chapters/5'],
    ['/training/courses/3/chapters/5', '/training/courses/3'],
    ['/admin/games/1/info', null],
  ])('%s → %s', (pathname, expected) => {
    expect(parentRouteFor(pathname, own)?.to ?? null).toBe(expected)
  })

  it('labels the home sub-pages', () => {
    expect(parentRouteFor('/settings/profile', own)).toEqual({ to: '/', label: '返回首页' })
  })
})
