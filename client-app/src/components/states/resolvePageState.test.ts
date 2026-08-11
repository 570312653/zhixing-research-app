import { describe, expect, it } from 'vitest'
import { resolvePageState } from './resolvePageState'

describe('resolvePageState', () => {
  const syncedAt = '2099-06-18T20:30:00+08:00'

  it('prioritizes an owner block over every other state', () => {
    expect(resolvePageState({
      ownerBlockedReason: '所有者访问尚未验证',
      hasContent: false,
      connectivity: 'offline',
      requestStatus: 'failure',
      errorCode: 'SYNC_UNAVAILABLE',
      emptyReason: 'no_reports',
    })).toEqual({ kind: 'owner_blocked', reason: '所有者访问尚未验证' })
  })

  it('returns a blocking failure when content is unavailable after a request failure', () => {
    expect(resolvePageState({
      hasContent: false,
      connectivity: 'online',
      requestStatus: 'failure',
      errorCode: 'FIXTURE_UNAVAILABLE',
      occurredAt: '2099-06-18T20:31:00+08:00',
      retryAvailable: true,
    })).toEqual({
      kind: 'blocking_failure',
      errorCode: 'FIXTURE_UNAVAILABLE',
      occurredAt: '2099-06-18T20:31:00+08:00',
      retry: 'enabled',
    })
  })

  it('returns offline unavailable before loading when there is no cached content', () => {
    expect(resolvePageState({
      hasContent: false,
      connectivity: 'offline',
      requestStatus: 'loading',
      slow: true,
    })).toEqual({ kind: 'offline_unavailable', retry: 'disabled' })
  })

  it('returns caller-derived slow loading while content is not available', () => {
    expect(resolvePageState({
      hasContent: false,
      connectivity: 'online',
      requestStatus: 'loading',
      slow: true,
    })).toEqual({ kind: 'loading', slow: true })
  })

  it('returns the supplied empty reason after higher-priority states are absent', () => {
    expect(resolvePageState({
      hasContent: false,
      connectivity: 'online',
      requestStatus: 'idle',
      emptyReason: 'no_history',
    })).toEqual({ kind: 'empty', reason: 'no_history' })
  })

  it('marks cached content stale while offline instead of claiming it is current', () => {
    expect(resolvePageState({
      hasContent: true,
      connectivity: 'offline',
      requestStatus: 'idle',
      lastSyncedAt: syncedAt,
    })).toEqual({
      kind: 'content',
      freshness: 'stale',
      connectivity: 'offline',
      lastSyncedAt: syncedAt,
      stale: {
        errorCode: 'OFFLINE_CACHE',
        lastSuccessfulSyncAt: syncedAt,
      },
    })
  })

  it('marks retained content stale after a synchronization failure', () => {
    expect(resolvePageState({
      hasContent: true,
      connectivity: 'online',
      requestStatus: 'failure',
      lastSyncedAt: syncedAt,
      errorCode: 'SYNC_UNAVAILABLE',
      lastSuccessfulSyncAt: syncedAt,
    })).toEqual({
      kind: 'content',
      freshness: 'stale',
      connectivity: 'online',
      lastSyncedAt: syncedAt,
      stale: {
        errorCode: 'SYNC_UNAVAILABLE',
        lastSuccessfulSyncAt: syncedAt,
      },
    })
  })

  it('keeps offline stale content marked as both offline and stale', () => {
    expect(resolvePageState({
      hasContent: true,
      connectivity: 'offline',
      requestStatus: 'failure',
      lastSyncedAt: syncedAt,
      errorCode: 'SYNC_UNAVAILABLE',
      lastSuccessfulSyncAt: syncedAt,
    })).toEqual({
      kind: 'content',
      freshness: 'stale',
      connectivity: 'offline',
      lastSyncedAt: syncedAt,
      stale: {
        errorCode: 'SYNC_UNAVAILABLE',
        lastSuccessfulSyncAt: syncedAt,
      },
    })
  })
})
