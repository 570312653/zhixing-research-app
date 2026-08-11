import { expect, test } from './fixtures'

test.beforeEach(async ({ page }) => {
  await page.goto('/#/reports')
  await expect(page.getByRole('heading', { name: '报告库' })).toBeVisible()
  await expect(page.getByText('共 7 份')).toBeVisible()
})

test('搜索、类型与行业筛选会更新真实夹具结果，清除后恢复全部报告', async ({ page }) => {
  await page.getByLabel('搜索报告').fill('收盘复盘')
  await expect(page.getByText('共 1 份')).toBeVisible()
  await expect(page.getByRole('heading', { name: '知行虚构收盘复盘｜2099-06-18' })).toBeVisible()
  await expect(page.getByRole('heading', { name: '知行虚构早盘扫描｜2099-06-18' })).toHaveCount(0)

  await page.getByRole('button', { name: '清除筛选' }).click()
  await page.getByRole('checkbox', { name: '产业研究' }).check()
  await expect(page.getByText('共 1 份')).toBeVisible()
  await expect(page.getByRole('heading', { name: '知行虚构清环能源专题研究｜2099-06-10' })).toBeVisible()

  await page.getByRole('button', { name: '清除筛选' }).click()
  await page.getByLabel('行业', { exact: true }).selectOption('industry-cleanloop-energy')
  await expect(page.getByText('共 2 份')).toBeVisible()
  await expect(page.getByRole('heading', { name: '知行虚构重点行业观察｜2099-06-18' })).toBeVisible()
  await expect(page.getByRole('heading', { name: '知行虚构清环能源专题研究｜2099-06-10' })).toBeVisible()

  await page.getByRole('button', { name: '清除筛选' }).click()
  await expect(page.getByText('共 7 份')).toBeVisible()
})

test('无结果是明确空状态，不提供生成或伪刷新入口', async ({ page }) => {
  await page.getByLabel('搜索报告').fill('绝不存在的报告')
  await expect(page.getByRole('status')).toContainText('当前筛选条件下没有报告')
  await expect(page.getByRole('button', { name: /生成|刷新/ })).toHaveCount(0)
})
