import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { SegmentedControl, segmentedItemClassName } from './SegmentedControl'

describe('SegmentedControl', () => {
  it('以导航或按钮组渲染选项，并标注方向与尺寸', () => {
    render(
      <>
        <SegmentedControl activeKey="b" aria-label="视图" as="nav">
          <button className={segmentedItemClassName} type="button">
            甲
          </button>
          <button aria-current="page" className={segmentedItemClassName} type="button">
            乙
          </button>
        </SegmentedControl>
        <SegmentedControl aria-label="范围" orientation="vertical" role="group" size="sm">
          <button aria-pressed className={segmentedItemClassName} type="button">
            90 天
          </button>
        </SegmentedControl>
      </>
    )

    const nav = screen.getByRole('navigation', { name: '视图' })
    expect(nav).toHaveAttribute('data-orientation', 'horizontal')
    expect(nav).toHaveAttribute('data-size', 'md')
    expect(screen.getByRole('button', { name: '乙' })).toHaveAttribute('aria-current', 'page')

    const group = screen.getByRole('group', { name: '范围' })
    expect(group).toHaveAttribute('data-orientation', 'vertical')
    expect(group).toHaveAttribute('data-size', 'sm')
  })
})
