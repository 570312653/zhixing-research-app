import { cleanup, render, screen, waitFor } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import App from '../App'

const navigationLabels = ['今日', '报告库', '研究', '我的']

describe('AppShell', () => {
  afterEach(() => {
    cleanup()
  })

  beforeEach(() => {
    window.location.hash = '#/reports'
  })

  it('injects the approved deep-sea-blue tokens into the rendered root', async () => {
    render(<App />)

    await waitFor(() => {
      const styles = window.getComputedStyle(document.documentElement)

      expect(styles.getPropertyValue('--color-brand-primary').trim()).toBe('#1E3A8A')
      expect(styles.getPropertyValue('--color-brand-ink').trim()).toBe('#102B44')
      expect(styles.getPropertyValue('--color-brand-accent').trim()).toBe('#2F6C9E')
      expect(styles.getPropertyValue('--color-surface-page').trim()).toBe('#F4F7FA')
      expect(styles.getPropertyValue('--color-signal-positive').trim()).toBe('#15803D')
      expect(styles.getPropertyValue('--color-signal-watch').trim()).toBe('#B45309')
      expect(styles.getPropertyValue('--color-signal-risk').trim()).toBe('#B91C1C')
      expect(styles.getPropertyValue('--color-signal-info').trim()).toBe('#2F6C9E')
    })
  })

  it('keeps the fixed navigation order and activates the reports entry for the library', async () => {
    render(<App />)

    const links = await screen.findAllByRole('link')
    expect(links.map((link) => link.textContent)).toEqual(navigationLabels)

    const activeLink = screen.getByRole('link', { name: '报告库', current: 'page' })
    expect(activeLink).toHaveAttribute('href', '#/reports')
    expect(activeLink.querySelector('svg')).toHaveAttribute('data-active', 'true')
  })

  it('keeps page scrolling inside a viewport-sized shell above the navigation', () => {
    render(<App />)

    const shell = document.querySelector('.app-shell')
    const content = screen.getByRole('main', { name: '报告库' })

    expect(shell).not.toBeNull()
    expect(window.getComputedStyle(shell!).height).toBe('100dvh')
    expect(window.getComputedStyle(content).overflowY).toBe('auto')
  })

  it.each(['/me', '/me/preferences'])('activates My for the %s route', (path) => {
    window.location.hash = `#${path}`
    render(<App />)

    const activeLink = screen.getByRole('link', { name: '我的', current: 'page' })
    expect(activeLink).toHaveAttribute('href', '#/me')
    expect(screen.getByRole('main', { name: '我的' })).toBeInTheDocument()
  })

  it.each(['/reports/demo-morning-2099-06-18', '/reports/demo/', '/RePoRtS/demo'])('uses the immersive detail shell for the valid detail route %s', async (path) => {
    window.location.hash = `#${path}`
    render(<App />)

    expect(await screen.findByRole('main', { name: '报告详情' })).toBeInTheDocument()
    expect(screen.queryByRole('heading', { name: '知行' })).not.toBeInTheDocument()
    expect(screen.queryByRole('navigation', { name: '主导航' })).not.toBeInTheDocument()
  })
})
