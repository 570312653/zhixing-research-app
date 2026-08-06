import type {
  WatchlistDetail,
  WatchlistSnapshot,
} from '../domain/watchlist'

export const watchlistSnapshots: readonly [WatchlistSnapshot, WatchlistSnapshot] = [
  {
    id: 'demo-watchlist-prior',
    snapshotAt: '2099-06-17T20:00:00+08:00',
    items: [
      { symbol: 'DEMO-A01', reason: '虚构材料线索待跟踪。' },
      { symbol: 'DEMO-B02', reason: '虚构计算线索初步延续。' },
      { symbol: 'DEMO-C03', reason: '虚构物流证据待补充。' },
    ],
  },
  {
    id: 'demo-watchlist-current',
    snapshotAt: '2099-06-18T20:00:00+08:00',
    items: [
      { symbol: 'DEMO-A01', reason: '虚构材料线索待跟踪。' },
      { symbol: 'DEMO-B02', reason: '虚构计算线索获得新增验证。' },
      { symbol: 'DEMO-D04', reason: '虚构能源线索新增观察。' },
    ],
  },
]

export const watchlistDetails: readonly WatchlistDetail[] = [
  {
    symbol: 'DEMO-A01',
    displayName: '演示标的甲',
    status: 'current',
    reason: '虚构材料线索待跟踪。',
    industryIds: ['industry-orbit-materials'],
    reportIds: [
      'demo-morning-2099-06-18',
      'demo-daily-2099-06-18',
      'demo-industry-tracking-2099-06-18',
    ],
    firstObservedAt: '2099-06-17T20:00:00+08:00',
    lastObservedAt: '2099-06-18T20:00:00+08:00',
    riskNote: '仅为虚构研究观察项。',
    events: [
      {
        id: 'event-a-added',
        type: 'added',
        occurredAt: '2099-06-17T20:00:00+08:00',
        reason: '虚构材料线索待跟踪。',
      },
      {
        id: 'event-a-continued',
        type: 'continued',
        occurredAt: '2099-06-18T20:00:00+08:00',
        reason: '虚构材料线索待跟踪。',
      },
    ],
  },
  {
    symbol: 'DEMO-B02',
    displayName: '演示标的乙',
    status: 'current',
    reason: '虚构计算线索获得新增验证。',
    industryIds: ['industry-deepwave-computing'],
    reportIds: [
      'demo-midday-2099-06-18',
      'demo-daily-2099-06-18',
      'demo-industry-tracking-2099-06-18',
    ],
    firstObservedAt: '2099-06-17T20:00:00+08:00',
    lastObservedAt: '2099-06-18T20:00:00+08:00',
    riskNote: '仅为虚构研究观察项。',
    events: [
      {
        id: 'event-b-added',
        type: 'added',
        occurredAt: '2099-06-17T20:00:00+08:00',
        reason: '虚构计算线索初步延续。',
      },
      {
        id: 'event-b-reason-changed',
        type: 'reason_changed',
        occurredAt: '2099-06-18T20:00:00+08:00',
        reason: '虚构计算线索获得新增验证。',
      },
    ],
  },
  {
    symbol: 'DEMO-C03',
    displayName: '演示标的丙',
    status: 'removed',
    reason: '虚构物流证据不足，移出当前观察。',
    industryIds: ['industry-frontier-logistics'],
    reportIds: [
      'demo-industry-tracking-2099-06-18',
      'demo-month-end-2099-05-31',
    ],
    firstObservedAt: '2099-06-17T20:00:00+08:00',
    lastObservedAt: '2099-06-18T20:00:00+08:00',
    riskNote: '仅为虚构研究观察项。',
    events: [
      {
        id: 'event-c-added',
        type: 'added',
        occurredAt: '2099-06-17T20:00:00+08:00',
        reason: '虚构物流证据待补充。',
      },
      {
        id: 'event-c-removed',
        type: 'removed',
        occurredAt: '2099-06-18T20:00:00+08:00',
        reason: '虚构物流证据不足，移出当前观察。',
      },
    ],
  },
  {
    symbol: 'DEMO-D04',
    displayName: '演示标的丁',
    status: 'current',
    reason: '虚构能源线索新增观察。',
    industryIds: ['industry-cleanloop-energy'],
    reportIds: [
      'demo-industry-tracking-2099-06-18',
      'demo-industry-research-2099-06-10',
    ],
    firstObservedAt: '2099-06-18T20:00:00+08:00',
    lastObservedAt: '2099-06-18T20:00:00+08:00',
    riskNote: '仅为虚构研究观察项。',
    events: [
      {
        id: 'event-d-added',
        type: 'added',
        occurredAt: '2099-06-18T20:00:00+08:00',
        reason: '虚构能源线索新增观察。',
      },
    ],
  },
]
