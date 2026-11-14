import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { extractGameAttachments, GameReadme, withoutLeadingHeading } from './GameReadme'

describe('extractGameAttachments', () => {
  it('picks file links and site assets, skipping images, pages and duplicates', () => {
    const markdown = [
      '## 赛事说明',
      '请先阅读 [比赛规则](/assets/abc123/rules.pdf "规则")。',
      '题目包：[](https://example.com/files/bundle.zip)',
      '再次提到 [比赛规则](/assets/abc123/rules.pdf)。',
      '站内文件 [流量样本](/api/assets/f00d/sample)',
      '![海报](/assets/poster.png)',
      '更多信息见 [官网](https://example.com/about)。',
    ].join('\n')

    expect(extractGameAttachments(markdown)).toEqual([
      { name: '比赛规则', url: '/assets/abc123/rules.pdf', extension: 'pdf' },
      { name: 'bundle.zip', url: 'https://example.com/files/bundle.zip', extension: 'zip' },
      { name: '流量样本', url: '/api/assets/f00d/sample', extension: '' },
    ])
  })
})

describe('GameReadme', () => {
  it('shows no attachment bar when the description links no files, and drops the leading heading', () => {
    render(<GameReadme source={'## 赛事说明\n\n只有文字。'} />)
    expect(screen.queryByRole('group', { name: '比赛附件' })).not.toBeInTheDocument()
    expect(screen.queryByRole('heading', { name: '赛事说明' })).not.toBeInTheDocument()
    expect(screen.getByText('只有文字。')).toBeInTheDocument()
  })

  it('keeps headings that are not at the very start', () => {
    expect(withoutLeadingHeading('前言\n\n## 规则\n内容')).toBe('前言\n\n## 规则\n内容')
    expect(withoutLeadingHeading('# 星图杯\n\n## 规则')).toBe('## 规则')
  })

  it('lists attachment links as downloads', () => {
    render(<GameReadme source={'附件：[规则](/assets/x/rules.pdf)'} />)
    const group = screen.getByRole('group', { name: '比赛附件' })
    expect(group.querySelector('a[download]')).toHaveAttribute('href', '/assets/x/rules.pdf')
  })
})
