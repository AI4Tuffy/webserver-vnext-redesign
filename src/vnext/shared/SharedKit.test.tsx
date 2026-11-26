import { fireEvent, render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router'
import { describe, expect, it, vi } from 'vitest'
import {
  DataTable,
  EditorialPlate,
  HairlineItem,
  HairlineList,
  PageHeader,
  SearchInput,
  SpecItem,
  SpecStrip,
} from './index'

describe('unified shared UI kit', () => {
  it('renders PageHeader with optional eyebrow', () => {
    const { rerender } = render(<PageHeader description="平台说明" title="平台公告" />)
    expect(screen.getByRole('heading', { name: '平台公告' })).toBeVisible()
    expect(screen.queryByText('NOTICE ARCHIVE')).toBeNull()

    rerender(<PageHeader eyebrow="ARCHIVE" title="平台公告" />)
    expect(screen.getByText('ARCHIVE')).toBeVisible()
  })

  it('supports controlled SearchInput and clear action', () => {
    const onValueChange = vi.fn()
    render(<SearchInput label="搜索题目" onValueChange={onValueChange} value="heap" />)

    const input = screen.getByRole('searchbox', { name: '搜索题目' })
    expect(input).toHaveValue('heap')
    fireEvent.click(screen.getByRole('button', { name: '清空搜索题目' }))
    expect(onValueChange).toHaveBeenCalledWith('')
  })

  it('renders SpecStrip metrics and HairlineList sibling-dimming metadata', () => {
    render(
      <MemoryRouter>
        <SpecStrip density="comfortable">
          <SpecItem label="赛制" tone="accent" value="团队赛" />
          <SpecItem detail="活跃队伍" label="已报名" value={42} />
        </SpecStrip>
        <HairlineList aria-label="公告目录" dimSiblings>
          <HairlineItem meta="2026-11-27" summary="发布摘要" title="比赛开启公告" to="/posts/1" />
        </HairlineList>
      </MemoryRouter>
    )

    expect(screen.getByText('团队赛')).toBeVisible()
    expect(screen.getByText('42')).toBeVisible()
    const list = screen.getByRole('list', { name: '公告目录' })
    expect(list).toHaveAttribute('data-dim-siblings', 'true')
    expect(screen.getByRole('link', { name: /比赛开启公告/ })).toHaveAttribute('href', '/posts/1')
  })

  it('renders DataTable and EditorialPlate slot with static override', () => {
    render(
      <>
        <DataTable
          caption="节点表"
          columns={[{ id: 'name', header: '名称', render: (row: { id: number; name: string }) => row.name }]}
          rowKey={(row) => row.id}
          rows={[{ id: 1, name: 'node-alpha' }]}
        />
        <EditorialPlate alt="训练配图" slot="module-training" staticSrc="/cover.webp" />
      </>
    )

    expect(screen.getByRole('cell', { name: 'node-alpha' })).toBeVisible()
    expect(screen.getByRole('img', { name: '训练配图' })).toHaveAttribute('src', '/cover.webp')
  })
})
