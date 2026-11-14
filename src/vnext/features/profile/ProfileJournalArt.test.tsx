import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { ProfileJournalArt } from './ProfileJournalArt'

describe('ProfileJournalArt', () => {
  it('renders the era collage as one labelled 16:10 image with unique pattern ids', () => {
    const { container } = render(
      <>
        <ProfileJournalArt />
        <ProfileJournalArt />
      </>
    )

    const [art] = screen.getAllByRole('img', { name: /年代拼贴插图/ })
    expect(art).toHaveAttribute('viewBox', '0 0 640 400')
    const ids = [...container.querySelectorAll('pattern')].map((pattern) => pattern.id)
    expect(new Set(ids).size).toBe(ids.length)
  })
})
