import { render, screen, waitFor } from '@testing-library/react'
import { beforeEach, describe, expect, it } from 'vitest'
import App from './App'

describe('App shell', () => {
  beforeEach(() => {
    window.location.hash = ''
  })

  it('normalizes an empty hash to Today and shows the fixed app shell', async () => {
    render(<App />)

    await waitFor(() => {
      expect(window.location.hash).toBe('#/today')
    })

    expect(screen.getByRole('heading', { name: '知行' })).toBeInTheDocument()
    expect(screen.getByRole('main', { name: '今日' })).toBeInTheDocument()

    for (const label of ['今日', '报告库', '研究', '我的']) {
      expect(screen.getByRole('link', { name: label })).toBeInTheDocument()
    }
  })
})
