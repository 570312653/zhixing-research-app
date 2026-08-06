export type FixtureViewState =
  | { kind: 'normal'; lastSyncedAt: string }
  | { kind: 'loading'; startedAt: string }
  | { kind: 'empty'; reason: 'not_due' | 'no_reports' | 'filter_no_results' }
  | { kind: 'failure'; errorCode: string; hasContent: false }
  | { kind: 'offline'; hasCache: boolean; lastSyncedAt: string | null }
  | { kind: 'stale'; errorCode: string; lastSuccessfulSyncAt: string }
  | { kind: 'owner_blocked'; reason: string }

export const fixtureStates = {
  normal: { kind: 'normal', lastSyncedAt: '2099-06-18T20:30:00+08:00' },
  loading: { kind: 'loading', startedAt: '2099-06-18T20:31:00+08:00' },
  notDue: { kind: 'empty', reason: 'not_due' },
  noReports: { kind: 'empty', reason: 'no_reports' },
  filterEmpty: { kind: 'empty', reason: 'filter_no_results' },
  failureWithoutContent: {
    kind: 'failure',
    errorCode: 'LOCAL_FIXTURE_UNAVAILABLE',
    hasContent: false,
  },
  offlineWithCache: {
    kind: 'offline',
    hasCache: true,
    lastSyncedAt: '2099-06-18T20:30:00+08:00',
  },
  offlineWithoutCache: { kind: 'offline', hasCache: false, lastSyncedAt: null },
  staleAfterSyncFailure: {
    kind: 'stale',
    errorCode: 'SYNC_TEMPORARILY_UNAVAILABLE',
    lastSuccessfulSyncAt: '2099-06-18T20:30:00+08:00',
  },
  ownerBlocked: { kind: 'owner_blocked', reason: '所有者访问尚未验证' },
} as const satisfies Record<string, FixtureViewState>
