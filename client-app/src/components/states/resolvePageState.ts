export type EmptyReason =
  | 'not_due'
  | 'no_reports'
  | 'filter_no_results'
  | 'no_history'
  | 'no_watchlist'

export type ResolvedPageState =
  | { kind: 'owner_blocked'; reason: string }
  | { kind: 'blocking_failure'; errorCode: string; occurredAt?: string; retry: 'enabled' | 'disabled' }
  | { kind: 'offline_unavailable'; retry: 'disabled' }
  | { kind: 'loading'; slow: boolean }
  | { kind: 'empty'; reason: EmptyReason }
  | {
      kind: 'content'
      freshness: 'current' | 'stale'
      connectivity: 'online' | 'offline'
      lastSyncedAt: string
      stale?: { errorCode: string; lastSuccessfulSyncAt: string }
    }

export interface ResolvePageStateInput {
  ownerBlockedReason?: string
  hasContent: boolean
  connectivity: 'online' | 'offline'
  requestStatus: 'idle' | 'loading' | 'failure'
  slow?: boolean
  emptyReason?: EmptyReason
  errorCode?: string
  occurredAt?: string
  retryAvailable?: boolean
  lastSyncedAt?: string
  lastSuccessfulSyncAt?: string
}

export function resolvePageState(input: ResolvePageStateInput): ResolvedPageState {
  if (input.ownerBlockedReason) {
    return { kind: 'owner_blocked', reason: input.ownerBlockedReason }
  }

  if (!input.hasContent && input.requestStatus === 'failure') {
    return {
      kind: 'blocking_failure',
      errorCode: input.errorCode ?? 'UNAVAILABLE',
      ...(input.occurredAt ? { occurredAt: input.occurredAt } : {}),
      retry: input.retryAvailable ? 'enabled' : 'disabled',
    }
  }

  if (!input.hasContent && input.connectivity === 'offline') {
    return { kind: 'offline_unavailable', retry: 'disabled' }
  }

  if (!input.hasContent && input.requestStatus === 'loading') {
    return { kind: 'loading', slow: input.slow ?? false }
  }

  if (!input.hasContent) {
    return { kind: 'empty', reason: input.emptyReason ?? 'no_reports' }
  }

  const lastSyncedAt = input.lastSyncedAt ?? input.lastSuccessfulSyncAt ?? ''
  if (input.connectivity === 'offline' || input.requestStatus === 'failure') {
    return {
      kind: 'content',
      freshness: 'stale',
      connectivity: input.connectivity,
      lastSyncedAt,
      stale: {
        errorCode: input.errorCode ?? (input.connectivity === 'offline' ? 'OFFLINE_CACHE' : 'UNAVAILABLE'),
        lastSuccessfulSyncAt: input.lastSuccessfulSyncAt ?? lastSyncedAt,
      },
    }
  }

  return {
    kind: 'content',
    freshness: 'current',
    connectivity: input.connectivity,
    lastSyncedAt,
  }
}
