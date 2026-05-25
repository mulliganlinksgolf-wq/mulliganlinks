import { test, expect } from '@playwright/test'

// Note: this spec assumes the Playwright harness from Sprint 1 (split-tee) is in place.
// Until this branch is rebased against main, the file is correct but not runnable.
//
// Required fixtures / seed data:
// - course "fox-creek" exists with allow_self_grouping = true
// - a tee_time tomorrow at noon ET (America/Detroit) with an existing 1-player booking
//   so it shows as a "partial" slot
// - test golfer accounts:
//   * test-solo@teeahead.com  / password "testpass"
//   * test-host@teeahead.com  / password "testpass" (host who already booked the slot)

test.describe('Self-grouping flow', () => {
  test('solo golfer sees "Join existing group" toggle on a course page', async ({ page }) => {
    await page.goto('/login')
    await page.fill('input[name="email"]', 'test-solo@teeahead.com')
    await page.fill('input[name="password"]', 'testpass')
    await page.click('button[type="submit"]')
    await page.waitForURL('**/app/**')

    await page.goto('/app/courses/fox-creek')

    // Toggle should be visible (course allows self-grouping, no per-day override)
    await expect(page.getByRole('button', { name: /Join an existing group/i })).toBeVisible()
  })

  test('toggling join mode filters slot list to partial slots and shows spots-open badge', async ({ page }) => {
    await page.goto('/login')
    await page.fill('input[name="email"]', 'test-solo@teeahead.com')
    await page.fill('input[name="password"]', 'testpass')
    await page.click('button[type="submit"]')
    await page.waitForURL('**/app/**')

    await page.goto('/app/courses/fox-creek')

    await page.getByRole('button', { name: /Join an existing group/i }).click()

    // After toggle, expect at least one "X spots open" indicator
    await expect(page.getByText(/spot[s]? open/i).first()).toBeVisible()
  })

  test('clicking a partial slot in join mode lands on confirmation with ?join=1 + explainer', async ({ page }) => {
    await page.goto('/login')
    await page.fill('input[name="email"]', 'test-solo@teeahead.com')
    await page.fill('input[name="password"]', 'testpass')
    await page.click('button[type="submit"]')
    await page.waitForURL('**/app/**')

    await page.goto('/app/courses/fox-creek')
    await page.getByRole('button', { name: /Join an existing group/i }).click()

    // Click the first slot
    const slot = page.getByRole('link', { name: /spot/i }).first()
    await slot.click()

    // URL should include ?join=1
    await expect(page).toHaveURL(/\?join=1/)

    // Explainer banner should be visible
    await expect(page.getByText(/joining an existing group/i)).toBeVisible()
    await expect(page.getByText(/email everyone the day before/i)).toBeVisible()
  })

  test('test-trigger API route fires pairing notifications', async ({ request }) => {
    const res = await request.post('/api/test/trigger-pairing', {
      headers: { 'x-test-key': process.env.TEST_API_KEY ?? '' },
    })
    expect(res.status()).toBe(200)
    const body = await res.json()
    // Body shape: { sent, errors, skipped }
    expect(body).toHaveProperty('sent')
    expect(body).toHaveProperty('errors')
    expect(body).toHaveProperty('skipped')
  })

  // Skipped: requires test-only seeding to fill a slot to capacity, then attempt to join
  test.skip('capacity overflow returns slot_filled error', async () => {})

  // Skipped: requires admin-side flow to write a course_tee_sheet_overrides row
  test.skip('per-day disable hides the join toggle', async () => {})
})
