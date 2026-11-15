import { useMemo } from 'react'
import { useSearchParams } from 'react-router'
import { useCatalogPagination } from '../../shared/useCatalogPagination'
import { useCurrentAccount } from '../account/useCurrentAccount'
import { useExercisePage } from './api/practiceApi'

export const practiceDifficultyLevels = [
  { label: '不限', values: [] as string[] },
  { label: '入门', values: ['Baby', 'Trivial'] },
  { label: '进阶', values: ['Easy', 'Normal'] },
  { label: '挑战', values: ['Medium', 'Hard'] },
  { label: '专家', values: ['Expert', 'Insane'] },
]

const difficultyByStar = ['', 'Baby', 'Trivial', 'Easy', 'Normal', 'Medium', 'Medium', 'Hard', 'Hard', 'Expert', 'Insane']

export function usePracticeCatalog() {
  const [params, setParams] = useSearchParams()
  const { isTeacher } = useCurrentAccount()
  const query = params.get('q') ?? ''
  const view = params.get('view') === 'list' ? 'list' : 'grid'
  const category = params.get('category')
  const hasPriorFilters = params.has('tag') || params.has('status') || (isTeacher && params.has('source'))
  const pagination = useCatalogPagination()

  const difficulties = useMemo(() => {
    const stars = Math.max(0, Math.min(10, Number.parseInt(params.get('difficultyStars') ?? '', 10) || 0))
    return stars ? [difficultyByStar[stars]] : params.getAll('difficulty')
  }, [params])
  const exactLevel = practiceDifficultyLevels.findIndex(({ values }) =>
    values.length === difficulties.length && values.every((value) => difficulties.includes(value))
  )
  const filter = useMemo(() => {
    const request = new URLSearchParams()
    if (query.trim()) request.set('Search', query.trim())
    if (category) request.set('Categories', category)
    difficulties.forEach((value) => request.append('Difficulties', value))
    params.getAll('tag').forEach((value) => request.append('Tags', value))
    const status = params.get('status')
    if (status === 'solved' || status === 'unsolved') request.set('Solved', String(status === 'solved'))
    if (isTeacher) params.getAll('source').forEach((value) => request.append('Sources', value))
    return request.toString()
  }, [params, query, category, difficulties, isTeacher])

  const { data, error, isValidating } = useExercisePage(filter, pagination.page, pagination.pageSize)
  useCatalogPagination(data?.page)

  const updateFilters = (update: (next: URLSearchParams) => void) => {
    const next = new URLSearchParams(params)
    update(next)
    next.delete('page')
    setParams(next, { replace: true })
  }

  const updateSelection = (key: string, values: string[]) => updateFilters((next) => {
    next.delete(key)
    values.forEach((value) => next.append(key, value))
  })

  return {
    query, view, category, difficultyLevel: Math.max(0, exactLevel), hasPriorFilters, data, error, isValidating, pagination,
    hasExactDifficultyLevel: exactLevel >= 0,
    search: (value: string) => updateSelection('q', value.trim() ? [value] : []),
    setCategory: (value: string | null) => updateSelection('category', value ? [value] : []),
    clearPriorFilters: () => updateFilters((next) => {
      next.delete('tag')
      next.delete('status')
      next.delete('source')
    }),
    setDifficulty: (level: number) => updateFilters((next) => {
      next.delete('difficultyStars')
      next.delete('difficulty')
      practiceDifficultyLevels[level].values.forEach((value) => next.append('difficulty', value))
    }),
    setView: (mode: 'grid' | 'list') => {
      const next = new URLSearchParams(params)
      if (mode === 'grid') next.delete('view')
      else next.set('view', mode)
      setParams(next, { replace: true })
    },
  }
}
