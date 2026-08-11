export type E2EFixtureState = 'loading' | 'empty' | 'failure' | 'offline' | 'offline_no_cache' | 'stale'

export function readE2EFixtureState(): E2EFixtureState | null {
  return null
}
