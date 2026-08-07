import type { ReactNode } from 'react'
import { BottomNavigation } from './BottomNavigation'

type AppShellProps = {
  children: ReactNode
  contentLabel: string
  immersive?: boolean
}

export function AppShell({ children, contentLabel, immersive = false }: AppShellProps) {
  return (
    <div className={`app-shell${immersive ? ' app-shell--immersive' : ''}`}>
      {!immersive && <header className="app-shell__header">
        <h1 className="app-shell__title">知行</h1>
      </header>}
      <main className="app-shell__content" aria-label={contentLabel}>
        {children}
      </main>
      {!immersive && <BottomNavigation />}
    </div>
  )
}
