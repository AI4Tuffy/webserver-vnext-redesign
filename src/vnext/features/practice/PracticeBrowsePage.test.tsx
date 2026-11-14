import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { PracticeBrowsePage } from './PracticeBrowsePage'

const mocks = vi.hoisted(() => ({ page: vi.fn() }))
vi.mock('./api/practiceApi', () => ({ useExercisePage: mocks.page }))
vi.mock('../account/useCurrentAccount', () => ({ useCurrentAccount: () => ({ isTeacher: true }) }))
vi.mock('../../shared/useVNextPageTitle', () => ({ useVNextPageTitle: vi.fn() }))

beforeEach(() => {
  vi.clearAllMocks()
  mocks.page.mockImplementation((_filter: string, page: number, pageSize: number) => ({ data: {
    items: [{ id: page, title: `page ${page}`, category: 'Web', difficulty: 'Baby', tags: [], solved: true }],
    total: 75, page, pageSize, tags: ['tag on another page'],
  }, isValidating: false }))
})

describe('practice catalog pagination', () => {
  it('sends all filters before paging, uses total count and requests only the next page', async () => {
    render(<MemoryRouter initialEntries={['/practice?page=2&q=search&tag=test&status=solved&category=Web&source=Game']}><PracticeBrowsePage /></MemoryRouter>)
    expect(mocks.page).toHaveBeenLastCalledWith('Search=search&Categories=Web&Tags=test&Solved=true&Sources=Game', 2, 20)
    expect(screen.getByText('2 / 4')).toBeVisible()
    expect(screen.queryByRole('combobox', { name: '每页题目数' })).not.toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: '下一页' }))
    await waitFor(() => expect(mocks.page).toHaveBeenLastCalledWith(expect.any(String), 3, 20))
    expect(screen.queryByText('page 2')).not.toBeInTheDocument()
    expect(screen.getByText('page 3')).toBeVisible()
  })

  it('sends both backend difficulties for the selected level and resets pagination', async () => {
    render(<MemoryRouter initialEntries={['/practice?page=2&pageSize=50']}><PracticeBrowsePage /></MemoryRouter>)
    fireEvent.change(screen.getByRole('slider', { name: '题目难度', hidden: true }), { target: { value: '3' } })
    await waitFor(() => expect(mocks.page).toHaveBeenLastCalledWith('Difficulties=Medium&Difficulties=Hard', 1, 50))
  })

  it('omits pagination for a single page of results', () => {
    const original = mocks.page.getMockImplementation()!
    mocks.page.mockImplementation((...args) => {
      const result = original(...args)
      return { ...result, data: { ...result.data, total: 8 } }
    })
    render(<MemoryRouter><PracticeBrowsePage /></MemoryRouter>)
    expect(screen.queryByRole('navigation', { name: '题库分页' })).not.toBeInTheDocument()
  })

  it('keeps exact difficulty deep links, categories and page when changing view', () => {
    render(<MemoryRouter initialEntries={['/practice?page=2&category=Web&category=IR&difficultyStars=7']}><PracticeBrowsePage /></MemoryRouter>)
    expect(screen.getByRole('button', { name: '难度 自定义' })).toBeVisible()
    expect(screen.getByRole('button', { name: 'Web', pressed: true })).toBeVisible()
    expect(screen.getByRole('button', { name: 'IR', pressed: false })).toBeVisible()
    expect(screen.getByRole('list')).toHaveAttribute('data-view', 'grid')
    fireEvent.click(screen.getByRole('button', { name: '列表' }))
    expect(screen.getByRole('list')).toHaveAttribute('data-view', 'list')
    expect(mocks.page).toHaveBeenLastCalledWith('Categories=Web&Difficulties=Hard', 2, 20)
    fireEvent.click(screen.getByRole('button', { name: 'IR' }))
    expect(screen.getByRole('button', { name: 'IR', pressed: true })).toBeVisible()
    expect(screen.getByRole('button', { name: 'Web', pressed: false })).toBeVisible()
    expect(mocks.page).toHaveBeenLastCalledWith('Categories=IR&Difficulties=Hard', 1, 20)
  })
})
