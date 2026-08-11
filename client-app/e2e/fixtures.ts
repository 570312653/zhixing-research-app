import { expect, test as base } from '@playwright/test'

const localOrigin = 'http://127.0.0.1:4173'

export const test = base.extend({
  page: async ({ page }, runTest) => {
    await page.route('**/*', async (route) => {
      const origin = new URL(route.request().url()).origin
      if (origin === localOrigin) await route.continue()
      else await route.abort('blockedbyclient')
    })
    await runTest(page)
  },
})

export { expect }
