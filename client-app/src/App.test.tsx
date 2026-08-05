import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

describe('App shell', () => {
  it('shows the Zhixing brand, four bottom entries, and the default Today page', async () => {
    const module = await import('./App').catch(() => null)

    expect(module).not.toBeNull()

    if (module === null) {
      return
    }

    const App = module.default
    render(<App />)

    expect(screen.getByRole('heading', { name: '知行' })).toBeInTheDocument()
    expect(screen.getByRole('main', { name: '今日' })).toBeInTheDocument()

    for (const label of ['今日', '报告库', '研究', '我的']) {
      expect(screen.getByRole('link', { name: label })).toBeInTheDocument()
    }
  })
})
