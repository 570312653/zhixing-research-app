import type { ReactNode } from 'react'
import { BottomNavigation } from './BottomNavigation'

type AppShellProps = {
  children: ReactNode
  contentLabel: string
}

export function AppShell({ children, contentLabel }: AppShellProps) {
  return (
    <div className="app-shell">
      <header className="app-shell__header">
        <h1 className="app-shell__title">知行</h1>
      </header>
      <main className="app-shell__content" aria-label={contentLabel}>
        {children}
      </main>
      <BottomNavigation />
    </div>
  )
}
