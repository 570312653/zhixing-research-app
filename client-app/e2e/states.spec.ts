import type { Page } from '@playwright/test'
import { expect, test } from './fixtures'

type E2EFixtureState = 'loading' | 'empty' | 'failure' | 'offline' | 'stale'

async function openFixtureState(page: Page, state: E2EFixtureState) {
  await page.addInitScript((fixtureState) => {
    Object.defineProperty(window, '__ZHIXING_E2E_STATE__', {
      configurable: true,
      value: fixtureState,
    })
  }, state)
  await page.goto('/#/today')
}

test('加载状态由固定测试夹具独立复现并保留导航', async ({ page }) => {
  await openFixtureState(page, 'loading')
  await expect(page.getByRole('status', { name: '今日正在加载' })).toBeVisible()
  await expect(page.getByRole('navigation', { name: '主导航' })).toBeVisible()
})

test('空状态由固定测试夹具独立复现', async ({ page }) => {
  await openFixtureState(page, 'empty')
  await expect(page.getByRole('status')).toContainText('暂时没有可显示的报告')
})

test('失败状态由固定测试夹具独立复现', async ({ page }) => {
  await openFixtureState(page, 'failure')
  await expect(page.getByRole('alert')).toContainText('错误代码：E2E_FIXED_FAILURE')
})

test('离线缓存状态保留可读报告并禁用在线操作', async ({ page }) => {
  await openFixtureState(page, 'offline')
  await expect(page.getByRole('status', { name: '当前离线' })).toContainText('在线操作当前不可用')
  await expect(page.getByRole('heading', { name: '今日' })).toBeVisible()
  await expect(page.getByRole('heading', { name: '知行虚构午间复盘｜2099-06-18' }).first()).toBeVisible()
})

test('过期内容状态保留可读报告并展示最后成功时间', async ({ page }) => {
  await openFixtureState(page, 'stale')
  await expect(page.getByRole('status', { name: '内容可能已过期' })).toContainText('错误代码：E2E_FIXED_STALE')
  await expect(page.getByRole('heading', { name: '知行虚构午间复盘｜2099-06-18' }).first()).toBeVisible()
})

test('状态夹具运行期间不访问开发服务器以外的地址', async ({ page }) => {
  const externalRequests: string[] = []
  page.on('request', (request) => {
    const url = new URL(request.url())
    if (url.origin !== 'http://127.0.0.1:4173') externalRequests.push(request.url())
  })

  await openFixtureState(page, 'offline')
  await expect(page.getByRole('status', { name: '当前离线' })).toBeVisible()
  expect(externalRequests).toEqual([])
})
