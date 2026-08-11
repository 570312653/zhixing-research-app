import type { E2EFixtureState } from './e2eState'

const fixtureStates = new Set<E2EFixtureState>(['loading', 'empty', 'failure', 'offline', 'offline_no_cache', 'stale'])

declare global {
  interface Window {
    __ZHIXING_E2E_STATE__?: unknown
  }
}

export function readE2EFixtureState(): E2EFixtureState | null {
  const state = window.__ZHIXING_E2E_STATE__
  if (state === undefined) return null
  return typeof state === 'string' && fixtureStates.has(state as E2EFixtureState)
    ? state as E2EFixtureState
    : 'offline_no_cache'
}
