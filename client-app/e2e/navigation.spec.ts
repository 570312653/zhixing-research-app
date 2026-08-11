import type { Page } from '@playwright/test'
import { expect, test } from './fixtures'

const routes = [
  { path: '/#/today', heading: '今日' },
  { path: '/#/reports', heading: '报告库' },
  { path: '/#/reports/demo-morning-2099-06-18', heading: '知行虚构早盘扫描｜2099-06-18' },
  { path: '/#/research', heading: '研究' },
  { path: '/#/research/industries', heading: '研究' },
  { path: '/#/research/industries/industry-deepwave-computing', heading: '深波计算' },
  { path: '/#/research/watchlist', heading: '核心关注标的' },
  { path: '/#/research/watchlist/DEMO-B02', heading: '演示标的乙' },
  { path: '/#/me', heading: '我的' },
] as const

async function waitForRoute(page: Page, path: string, heading: string) {
  await page.goto(path)
  await expect(page).toHaveURL(new RegExp(`${path.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`))
  await expect(page.getByRole('heading', { name: heading, exact: true }).first()).toBeVisible()
}

test('九个批准页面都支持 Hash 深链且保持既定层级', async ({ page }) => {
  for (const route of routes) {
    await test.step(route.path, async () => {
      await waitForRoute(page, route.path, route.heading)
    })
  }
})

test('底部主导航顺序固定、未知 Hash 回到今日且报告详情保持沉浸式', async ({ page }) => {
  await page.goto('/#/not-an-approved-route')
  await expect(page).toHaveURL(/\/#\/today$/)

  const navigation = page.getByRole('navigation', { name: '主导航' })
  await expect(navigation.getByRole('link').allTextContents()).resolves.toEqual(['今日', '报告库', '研究', '我的'])
  await navigation.getByRole('link', { name: '报告库' }).click()
  await expect(page).toHaveURL(/\/#\/reports$/)
  await expect(navigation.getByRole('link', { name: '报告库' })).toHaveAttribute('aria-current', 'page')

  await page.goto('/#/reports/demo-morning-2099-06-18')
  await expect(page.getByRole('heading', { name: '知行虚构早盘扫描｜2099-06-18' })).toBeVisible()
  await expect(page.getByRole('navigation', { name: '主导航' })).toHaveCount(0)
})

test('390px 下九页无横向溢出，底部导航不越出安全视口', async ({ page }) => {
  for (const route of routes) {
    await test.step(route.path, async () => {
      await waitForRoute(page, route.path, route.heading)
      const width = await page.evaluate(() => ({
        bodyClient: document.body.clientWidth,
        bodyScroll: document.body.scrollWidth,
        rootClient: document.documentElement.clientWidth,
        rootScroll: document.documentElement.scrollWidth,
      }))
      expect(width.bodyScroll).toBeLessThanOrEqual(width.bodyClient)
      expect(width.rootScroll).toBeLessThanOrEqual(width.rootClient)
    })
  }

  await page.goto('/#/today')
  const geometry = await page.getByRole('navigation', { name: '主导航' }).evaluate((node) => {
    const nav = node.getBoundingClientRect()
    const content = document.querySelector('main')!.getBoundingClientRect()
    return {
      contentBottom: content.bottom,
      navBottom: nav.bottom,
      navHeight: nav.height,
      navTop: nav.top,
      viewportHeight: window.innerHeight,
    }
  })
  expect(Math.abs(geometry.navBottom - geometry.viewportHeight)).toBeLessThanOrEqual(1)
  expect(geometry.navHeight).toBeGreaterThanOrEqual(56)
  expect(geometry.contentBottom).toBeLessThanOrEqual(geometry.navTop + 1)
})

test('九页都没有分享、交易、成员、订阅或编辑入口', async ({ page }) => {
  const forbiddenEntry = /分享|交易|成员|订阅|编辑/
  for (const route of routes) {
    await test.step(route.path, async () => {
      await waitForRoute(page, route.path, route.heading)
      await expect(page.getByRole('link', { name: forbiddenEntry })).toHaveCount(0)
      await expect(page.getByRole('button', { name: forbiddenEntry })).toHaveCount(0)
    })
  }
})
