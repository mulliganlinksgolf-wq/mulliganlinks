import { act, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, expect, it, vi } from 'vitest'
import { KbSearch } from '@/components/course/KbSearch'
import { searchKbArticles, type KbSearchResult } from '@/app/actions/knowledgeBase'
vi.mock('@/app/actions/knowledgeBase', () => ({ searchKbArticles: vi.fn() }))
afterEach(() => { vi.useRealTimers(); vi.clearAllMocks() })
it('does not reopen old results after the search is cleared', async () => {
  vi.useFakeTimers()
  let complete!: (rows: KbSearchResult[]) => void
  vi.mocked(searchKbArticles).mockReturnValueOnce(new Promise(resolve => { complete = resolve }))
  render(<KbSearch courseSlug="test-course" />)
  fireEvent.change(screen.getByRole('searchbox'), { target: { value: 'refund' } })
  await act(async () => { vi.advanceTimersByTime(300) })
  fireEvent.change(screen.getByRole('searchbox'), { target: { value: '' } })
  await act(async () => { complete([{ id: 'old', title: 'Old refund result', slug: 'old', kb_categories: null } as KbSearchResult]) })
  expect(screen.queryByText('Old refund result')).not.toBeInTheDocument()
  expect(screen.queryByRole('list')).not.toBeInTheDocument()
})
