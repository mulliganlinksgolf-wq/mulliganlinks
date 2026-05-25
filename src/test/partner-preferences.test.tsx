import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'

vi.mock('@/app/app/partners/actions', () => ({
  upsertPartnerPreferences: vi.fn().mockResolvedValue({}),
}))

import { PreferencesForm } from '@/app/app/partners/preferences/PreferencesForm'

const defaultPrefs = {
  id: 'pref-1',
  profile_id: 'user-1',
  handicap_index: null,
  pace_preference: null,
  prefers_walking: false,
  drinks_ok: true,
  smoking_ok: false,
  preferred_holes: 'either' as const,
  skill_level: 'any' as const,
  bio: null,
  is_visible: true,
  updated_at: new Date().toISOString(),
  play_style: 'moderate' as const,
  gender: 'prefer_not_to_say' as const,
  open_to: 'anyone' as const,
}

describe('PreferencesForm', () => {
  it('renders all fields', () => {
    render(<PreferencesForm existing={defaultPrefs} avatarUrl={null} />)
    expect(screen.getByLabelText(/handicap/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/bio/i)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /save/i })).toBeInTheDocument()
  })

  it('character counter updates on bio input', () => {
    render(<PreferencesForm existing={defaultPrefs} avatarUrl={null} />)
    const bio = screen.getByLabelText(/bio/i)
    fireEvent.change(bio, { target: { value: 'hello' } })
    expect(screen.getByText(/5 \/ 280/)).toBeInTheDocument()
  })

  it('is_visible checkbox defaults to true', () => {
    render(<PreferencesForm existing={defaultPrefs} avatarUrl={null} />)
    const toggle = screen.getByRole('checkbox', { name: /visible/i })
    expect(toggle).toBeChecked()
  })

  it('shows 0 / 280 counter when bio is empty', () => {
    render(<PreferencesForm existing={defaultPrefs} avatarUrl={null} />)
    expect(screen.getByText('0 / 280')).toBeInTheDocument()
  })
})
