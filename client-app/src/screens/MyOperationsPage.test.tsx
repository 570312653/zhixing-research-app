import { cleanup, render, screen, within } from '@testing-library/react'
import { afterEach, describe, expect, it } from 'vitest'

import App from '../App'

function renderRoute(path: string) {
  window.location.hash = `#${path}`
  return render(<App />)
}

describe('My operations page', () => {
  afterEach(() => {
    cleanup()
    window.location.hash = ''
  })

  it('shows the owner-only offline operations summary without sensitive diagnostics', async () => {
    renderRoute('/me')

    const main = await screen.findByRole('main', { name: '我的' })
    expect(within(main).getByRole('heading', { name: '我的' })).toBeInTheDocument()
    expect(within(main).getByText('仅限所有者本人访问')).toBeInTheDocument()
    expect(within(main).getByText('访问状态：云端认证待接入')).toBeInTheDocument()
    expect(within(main).getByText(/最后同步：/)).toBeInTheDocument()
    expect(within(main).getByRole('heading', { name: '今日任务' })).toBeInTheDocument()
    expect(within(main).getByRole('region', { name: '本机缓存' })).toBeInTheDocument()
    expect(within(main).getByRole('region', { name: '脱敏诊断' })).toHaveTextContent('诊断编号')
    expect(within(main).getByText('客户端版本 v0.1.0')).toBeInTheDocument()
    expect(within(main).queryByText(/原始响应/)).not.toBeInTheDocument()
    expect(within(main).queryByText(/设备序列号/)).not.toBeInTheDocument()
  })

  it.each([
    ['刷新内容', 'refresh-disabled-reason'],
    ['重试失败任务', 'retry-disabled-reason'],
    ['检查更新', 'update-disabled-reason'],
    ['下载未缓存 PDF', 'pdf-disabled-reason'],
  ])('keeps %s natively disabled with an always-visible accessible reason', async (actionLabel, reasonId) => {
    renderRoute('/me')

    const button = await screen.findByRole('button', { name: `${actionLabel}（当前不可用）` })
    expect(button).toBeDisabled()
    expect(button).toHaveAttribute('aria-describedby', reasonId)
    expect(document.getElementById(reasonId)).toBeVisible()
    expect(document.getElementById(reasonId)).toHaveTextContent('未来可信服务端')
  })
})
