export type WatchlistStatus = 'current' | 'removed'

export interface WatchlistSnapshotEntry {
  symbol: string
  reason: string
}

export interface WatchlistSnapshot {
  id: string
  snapshotAt: string
  items: readonly WatchlistSnapshotEntry[]
}

export interface WatchlistDelta {
  added: readonly string[]
  continuing: readonly string[]
  removed: readonly string[]
  reasonChanged: readonly string[]
}

export interface WatchlistItem {
  symbol: string
  displayName: string
  status: 'current'
  reason: string
  industryIds: readonly string[]
  reportIds: readonly string[]
  firstObservedAt: string
  lastObservedAt: string
}

export interface WatchlistEvent {
  id: string
  type: 'added' | 'continued' | 'reason_changed' | 'removed'
  occurredAt: string
  reason: string
}

export interface WatchlistDetail extends Omit<WatchlistItem, 'status'> {
  status: WatchlistStatus
  riskNote: string
  events: readonly WatchlistEvent[]
}

export function deriveWatchlistDelta(
  prior: WatchlistSnapshot,
  current: WatchlistSnapshot,
): WatchlistDelta {
  const priorBySymbol = new Map(prior.items.map((item) => [item.symbol, item]))
  const currentBySymbol = new Map(current.items.map((item) => [item.symbol, item]))

  return {
    added: current.items
      .filter((item) => !priorBySymbol.has(item.symbol))
      .map((item) => item.symbol),
    continuing: current.items
      .filter((item) => priorBySymbol.has(item.symbol))
      .map((item) => item.symbol),
    removed: prior.items
      .filter((item) => !currentBySymbol.has(item.symbol))
      .map((item) => item.symbol),
    reasonChanged: current.items
      .filter((item) => {
        const priorItem = priorBySymbol.get(item.symbol)
        return priorItem !== undefined && priorItem.reason !== item.reason
      })
      .map((item) => item.symbol),
  }
}
