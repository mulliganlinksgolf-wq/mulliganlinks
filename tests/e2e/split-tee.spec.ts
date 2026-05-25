// Sprint 1 split-tee + back-9 E2E coverage.
//
// Playwright is not yet installed in this repo (no playwright.config.ts, no
// @playwright/test in package.json). This spec is ready to run as soon as the
// E2E harness is set up — install @playwright/test, add playwright.config.ts,
// seed a test course `fox-creek` with a manager user, and add scripts.
//
// Until then this file documents the contract that the UI must satisfy.

import { test, expect } from '@playwright/test'

test.describe('Split tee operation', () => {
  test('manager can enable split tee for a future day', async ({ page }) => {
    await page.goto('/course/fox-creek/login')
    await page.fill('[name=email]', process.env.TEST_MANAGER_EMAIL ?? 'manager@foxcreek.test')
    await page.fill('[name=password]', process.env.TEST_MANAGER_PASSWORD ?? 'changeme')
    await page.click('button[type=submit]')

    await page.goto('/course/fox-creek?date=2026-07-04')
    await page.getByText('Split tee day').click()

    await expect(page.locator('[data-testid=front-nine-column]')).toBeVisible()
    await expect(page.locator('[data-testid=back-nine-column]')).toBeVisible()
  })

  test('golfer sees back-nine option when course allows it', async ({ page }) => {
    await page.goto(`/login`)
    await page.fill('[name=email]', process.env.TEST_GOLFER_EMAIL ?? 'golfer@test.test')
    await page.fill('[name=password]', process.env.TEST_GOLFER_PASSWORD ?? 'changeme')
    await page.click('button[type=submit]')

    await page.goto('/app/courses/fox-creek?date=2026-07-04')
    await expect(page.getByRole('group', { name: 'Round length' })).toBeVisible()
    await expect(page.getByText('9 holes (back)')).toBeVisible()

    await page.getByText('9 holes (back)').click()
    await expect(page).toHaveURL(/holes=9/)
  })
})

test.describe('Operations settings', () => {
  test('manager can save lat/long and preview sun times', async ({ page }) => {
    await page.goto('/course/fox-creek/login')
    await page.fill('[name=email]', process.env.TEST_MANAGER_EMAIL ?? 'manager@foxcreek.test')
    await page.fill('[name=password]', process.env.TEST_MANAGER_PASSWORD ?? 'changeme')
    await page.click('button[type=submit]')

    await page.goto('/course/fox-creek/settings/operations')
    await page.fill('#latitude', '42.4267')
    await page.fill('#longitude', '-83.3838')
    await page.click('text=Preview next 7 days')

    await expect(page.locator('table')).toBeVisible()
  })
})
