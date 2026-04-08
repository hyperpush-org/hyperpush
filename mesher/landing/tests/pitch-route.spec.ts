import { test, expect } from '@playwright/test'

test.describe('Pitch Deck', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/pitch')
    await page.waitForSelector('[data-testid="pitch-deck"]')
  })

  test('renders the deck shell', async ({ page }) => {
    const deck = page.getByTestId('pitch-deck')
    await expect(deck).toBeVisible()
  })

  test('shows the first slide (title)', async ({ page }) => {
    // Title slide has the eyebrow chip
    await expect(page.locator('text=hyperpush')).toBeVisible()
    await expect(page.locator('text=The incident workflow')).toBeVisible()
  })

  test('navigates forward with arrow key', async ({ page }) => {
    // Initially on slide 1
    const counter = page.locator('text=01 / 10')
    await expect(counter).toBeVisible()

    // Press right arrow
    await page.keyboard.press('ArrowRight')
    await page.waitForTimeout(500) // transition

    const counter2 = page.locator('text=02 / 10')
    await expect(counter2).toBeVisible()
  })

  test('navigates backward with arrow key', async ({ page }) => {
    // Go to slide 2 first
    await page.keyboard.press('ArrowRight')
    await page.waitForTimeout(500)

    // Then back
    await page.keyboard.press('ArrowLeft')
    await page.waitForTimeout(500)

    const counter = page.locator('text=01 / 10')
    await expect(counter).toBeVisible()
  })

  test('clicking progress dot navigates to that slide', async ({ page }) => {
    // Click the 5th dot (technology moat)
    const dots = page.locator('[aria-label^="Go to slide"]')
    await dots.nth(4).click()
    await page.waitForTimeout(500)

    const counter = page.locator('text=05 / 10')
    await expect(counter).toBeVisible()
  })

  test('next/prev buttons work', async ({ page }) => {
    const nextBtn = page.locator('[aria-label="Next slide"]')
    await nextBtn.click()
    await page.waitForTimeout(500)

    await expect(page.locator('text=02 / 10')).toBeVisible()

    const prevBtn = page.locator('[aria-label="Previous slide"]')
    await prevBtn.click()
    await page.waitForTimeout(500)

    await expect(page.locator('text=01 / 10')).toBeVisible()
  })

  test('prev button is disabled on first slide', async ({ page }) => {
    const prevBtn = page.locator('[aria-label="Previous slide"]')
    await expect(prevBtn).toBeDisabled()
  })

  test('next button is disabled on last slide', async ({ page }) => {
    // Jump to last slide
    const dots = page.locator('[aria-label^="Go to slide"]')
    await dots.nth(9).click()
    await page.waitForTimeout(500)

    const nextBtn = page.locator('[aria-label="Next slide"]')
    await expect(nextBtn).toBeDisabled()
  })

  test('all 10 slides are navigable', async ({ page }) => {
    for (let i = 0; i < 9; i++) {
      await page.keyboard.press('ArrowRight')
      await page.waitForTimeout(400)
    }

    await expect(page.locator('text=10 / 10')).toBeVisible()
    // Should be on the ask/CTA slide
    await expect(page.locator('text=The ask')).toBeVisible()
  })

  test('space bar advances to next slide', async ({ page }) => {
    await page.keyboard.press('Space')
    await page.waitForTimeout(500)

    await expect(page.locator('text=02 / 10')).toBeVisible()
  })

  test('fullscreen toggle button exists', async ({ page }) => {
    const fsBtn = page.locator('[aria-label="Enter fullscreen"]')
    await expect(fsBtn).toBeVisible()
  })

  test('download PDF button exists', async ({ page }) => {
    const dlBtn = page.locator('[aria-label="Download PDF"]')
    await expect(dlBtn).toBeVisible()
  })
})
