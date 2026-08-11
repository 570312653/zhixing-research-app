import { expect, test } from './fixtures'

test('研究总览、行业、标的与关联报告形成可回溯的交叉导航', async ({ page }) => {
  await page.goto('/#/research')
  await page.getByRole('link', { name: '查看全部行业' }).click()
  await expect(page).toHaveURL(/\/#\/research\/industries$/)

  await page.getByRole('link', { name: '查看行业：深波计算' }).click()
  await expect(page).toHaveURL(/\/#\/research\/industries\/industry-deepwave-computing$/)
  await expect(page.getByRole('heading', { name: '深波计算', exact: true })).toBeVisible()

  await page.getByRole('link', { name: '查看标的：演示标的乙' }).click()
  await expect(page).toHaveURL(/\/#\/research\/watchlist\/DEMO-B02$/)
  await expect(page.getByRole('heading', { name: '演示标的乙', exact: true }).first()).toBeVisible()

  await page.getByRole('link', { name: '深波计算', exact: true }).click()
  await expect(page).toHaveURL(/\/#\/research\/industries\/industry-deepwave-computing$/)
  await expect(page.getByRole('heading', { name: '深波计算', exact: true })).toBeVisible()

  await page.getByRole('link', { name: '查看报告：知行虚构重点行业观察｜2099-06-18', exact: true }).click()
  await expect(page).toHaveURL(/\/#\/reports\/demo-industry-tracking-2099-06-18$/)
  await page.getByRole('button', { name: '返回' }).click()
  await expect(page).toHaveURL(/\/#\/research\/industries\/industry-deepwave-computing$/)
})

test('行业和标的池的搜索筛选路径可见且可清除', async ({ page }) => {
  await page.goto('/#/research/industries')
  await page.getByLabel('搜索关注行业').fill('清环')
  await expect(page.getByRole('link', { name: '查看行业：清环能源' })).toBeVisible()
  await expect(page.getByRole('link', { name: '查看行业：深波计算' })).toHaveCount(0)
  await page.getByRole('button', { name: '清除筛选' }).click()
  await expect(page.getByRole('link', { name: '查看行业：深波计算' })).toBeVisible()

  await page.goto('/#/research/watchlist')
  await page.getByLabel('搜索证券代码或名称').fill('DEMO-D04')
  await expect(page.getByRole('link', { name: '查看标的：演示标的丁' })).toBeVisible()
  await expect(page.getByRole('link', { name: '查看标的：演示标的甲' })).toHaveCount(0)
  await page.getByRole('button', { name: '清除筛选' }).click()
  await expect(page.getByRole('link', { name: '查看标的：演示标的甲' })).toBeVisible()
})
