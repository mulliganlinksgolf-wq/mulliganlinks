// Sprint 6 dynamic pricing engine E2E coverage.
//
// Run with `npm run test:e2e`. Requires TEST_MANAGER_EMAIL, TEST_MANAGER_PASSWORD
// env vars and a seeded test course (slug `fox-creek` by default). The manager
// account must have manage_course_settings permission.
//
// What's covered:
// - Manager can open /course/<slug>/settings/pricing
// - Hot-deal label is rejected at save time (label validator)
// - Golfer-facing /book/<slug> never renders the words "Hot Deal" / "Flash Sale"

import { test, expect } from '@playwright/test'

const COURSE_SLUG = process.env.TEST_COURSE_SLUG ?? 'fox-creek'

async function loginAsManager(page: import('@playwright/test').Page) {
  await page.goto(`/course/${COURSE_SLUG}/login`)
  await page.fill('[name=email]', process.env.TEST_MANAGER_EMAIL ?? 'manager@foxcreek.test')
  await page.fill('[name=password]', process.env.TEST_MANAGER_PASSWORD ?? 'changeme')
  await page.click('button[type=submit]')
  await page.waitForURL((url) => !url.pathname.endsWith('/login'))
}

test.describe('Dynamic pricing engine', () => {
  test('manager can open the pricing rules page', async ({ page }) => {
    await loginAsManager(page)
    await page.goto(`/course/${COURSE_SLUG}/settings/pricing`)
    await expect(page.getByRole('heading', { name: /pricing rules/i })).toBeVisible()
    // Either we see the "No rules yet" empty state OR an existing rule card.
    const empty = page.getByText(/no rules yet/i)
    const addBtn = page.getByRole('button', { name: /\+ add rule/i })
    await expect(addBtn).toBeVisible()
    // Empty-state text is optional depending on existing rules
    await empty.first().or(addBtn).waitFor()
  })

  test('hot-deal display label is rejected at save', async ({ page }) => {
    await loginAsManager(page)
    await page.goto(`/course/${COURSE_SLUG}/settings/pricing`)

    // Open a fresh card
    await page.getByRole('button', { name: /\+ add rule/i }).click()

    // The last card on the page is the new one. Scope all selectors to it.
    const cards = page.locator('div.bg-white.rounded-xl.ring-1.ring-black\\/5.p-5')
    const lastCard = cards.last()

    await lastCard.locator('input[placeholder="Weekend Morning Peak"]').fill('Bad-Label Test')
    await lastCard.locator('input[placeholder="Weekend Morning"]').fill('Hot Deal Friday')
    await lastCard.getByRole('button', { name: /create rule/i }).click()

    await expect(page.getByText(/cannot contain "hot deal"/i)).toBeVisible({ timeout: 10_000 })
  })

  test('public booking page never shows "Hot Deal" or "Flash Sale" wording', async ({ page }) => {
    await page.goto(`/book/${COURSE_SLUG}`)
    const body = page.locator('body')
    await expect(body).not.toContainText(/hot deal/i)
    await expect(body).not.toContainText(/flash sale/i)
    await expect(body).not.toContainText(/blowout/i)
  })
})
