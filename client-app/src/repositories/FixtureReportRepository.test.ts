import { afterEach, describe, expect, it, vi } from 'vitest'

import {
  createInProgressReadState,
  selectFeaturedReportId,
} from '../domain/report'
import { deriveWatchlistDelta, type WatchlistSnapshot } from '../domain/watchlist'
import { watchlistDetails } from '../fixtures/watchlist'
import { FixtureReportRepository } from './FixtureReportRepository'

const SAMPLE_DATE = '2099-06-18'

describe('report read state', () => {
  it.each([0, 90, 1.5])('rejects invalid in-progress percentage %s', (percent) => {
    expect(() => createInProgressReadState(percent)).toThrow(RangeError)
  })

  it.each([1, 89])('accepts boundary in-progress percentage %s', (percent) => {
    expect(createInProgressReadState(percent)).toEqual({ kind: 'in_progress', percent })
  })
})

describe('FixtureReportRepository reports', () => {
  const repository = new FixtureReportRepository()

  it('sorts reports deterministically by date, publish time, then id', async () => {
    const reports = await repository.listReports()

    expect(reports.map(({ id }) => id)).toEqual([
      'demo-holiday-2099-06-18',
      'demo-industry-tracking-2099-06-18',
      'demo-daily-2099-06-18',
      'demo-midday-2099-06-18',
      'demo-morning-2099-06-18',
      'demo-industry-research-2099-06-10',
      'demo-month-end-2099-05-31',
    ])
  })

  it.each([
    ['query title', { query: '  午间  ' }, ['demo-midday-2099-06-18']],
    ['query industry display name', { query: '轨道材料' }, [
      'demo-industry-tracking-2099-06-18',
      'demo-daily-2099-06-18',
      'demo-morning-2099-06-18',
    ]],
    ['query theme display name case-insensitively', { query: 'ALPHA主题' }, [
      'demo-industry-tracking-2099-06-18',
      'demo-daily-2099-06-18',
      'demo-midday-2099-06-18',
      'demo-morning-2099-06-18',
    ]],
    ['report type OR values', { reportTypes: ['morning_scan', 'daily_review'] }, [
      'demo-daily-2099-06-18',
      'demo-morning-2099-06-18',
    ]],
    ['inclusive date range', { dateFrom: '2099-06-10', dateTo: '2099-06-10' }, [
      'demo-industry-research-2099-06-10',
    ]],
    ['industry OR values', { industryIds: ['industry-orbit-materials', 'industry-cleanloop-energy'] }, [
      'demo-industry-tracking-2099-06-18',
      'demo-daily-2099-06-18',
      'demo-morning-2099-06-18',
      'demo-industry-research-2099-06-10',
    ]],
    ['theme OR values', { themeIds: ['theme-beta'] }, [
      'demo-industry-tracking-2099-06-18',
      'demo-daily-2099-06-18',
      'demo-industry-research-2099-06-10',
    ]],
  ] as const)('supports the %s filter', async (_name, filter, expectedIds) => {
    const reports = await repository.listReports(filter)

    expect(reports.map(({ id }) => id)).toEqual(expectedIds)
  })

  it('combines dimensions with AND while array values remain OR', async () => {
    const reports = await repository.listReports({
      query: '观察',
      reportTypes: ['daily_review', 'industry_tracking'],
      dateFrom: SAMPLE_DATE,
      dateTo: SAMPLE_DATE,
      industryIds: ['industry-orbit-materials', 'industry-deepwave-computing'],
      themeIds: ['theme-beta'],
    })

    expect(reports.map(({ id }) => id)).toEqual(['demo-industry-tracking-2099-06-18'])
  })

  it('treats an omitted or cleared filter as the unfiltered list', async () => {
    const [unfiltered, cleared] = await Promise.all([
      repository.listReports(),
      repository.listReports({
        query: '   ',
        reportTypes: [],
        industryIds: [],
        themeIds: [],
      }),
    ])

    expect(cleared).toEqual(unfiltered)
  })

  it('returns no reports for an unmatched filter or an invalid date range', async () => {
    const [unmatched, invalidRange] = await Promise.all([
      repository.listReports({ query: '不存在的虚构主题' }),
      repository.listReports({ dateFrom: '2099-06-19', dateTo: '2099-06-18' }),
    ])

    expect(unmatched).toEqual([])
    expect(invalidRange).toEqual([])
  })

  it('does not match report body HTML when searching', async () => {
    const reports = await repository.listReports({ query: '正文专用暗号ZX-ONLY-BODY' })

    expect(reports).toEqual([])
  })

  it('returns null for an unknown report and keeps summary/detail fields in parity', async () => {
    const [missing, summaries, detail] = await Promise.all([
      repository.getReport('missing-report'),
      repository.listReports(),
      repository.getReport('demo-daily-2099-06-18'),
    ])
    const summary = summaries.find(({ id }) => id === 'demo-daily-2099-06-18')

    expect(missing).toBeNull()
    expect(detail).not.toBeNull()
    expect(detail).toMatchObject(summary!)
    expect(detail?.versions.map(({ version }) => version)).toEqual(['v1.1', 'v1.0'])
    expect(detail?.pdf).toEqual({ status: 'unavailable', reason: '离线样例未提供 PDF 文件' })
  })
})

describe('FixtureReportRepository today set', () => {
  const repository = new FixtureReportRepository()

  it('keeps the four daily slots fixed and only shows periodic reports with same-day content', async () => {
    const today = await repository.getToday(SAMPLE_DATE)

    expect(today.dailySlots.map(({ reportType }) => reportType)).toEqual([
      'morning_scan',
      'midday_review',
      'daily_review',
      'industry_tracking',
    ])
    expect(today.dailySlots.map(({ status }) => status)).toEqual([
      'available',
      'available',
      'available',
      'available',
    ])
    expect(today.periodicReports.map(({ type }) => type)).toEqual(['holiday_digest'])
    expect(today.featuredReportId).toBe('demo-midday-2099-06-18')
    expect(today.summaryPoints).toEqual([
      '虚构外围线索保持平稳。',
      '虚构上午观察进入验证阶段。',
      '虚构收盘结构出现分化。',
      '虚构重点行业维持混合趋势。',
    ])
    expect(today.lastSyncedAt).toBe('2099-06-18T20:30:00+08:00')
  })

  it('falls back to the latest available daily report when none is in progress', async () => {
    const summaries = (await repository.listReports({ dateFrom: SAMPLE_DATE, dateTo: SAMPLE_DATE }))
      .filter(({ type }) => ['morning_scan', 'midday_review', 'daily_review', 'industry_tracking'].includes(type))
      .map((report) => ({ ...report, readState: { kind: 'read' as const } }))

    expect(selectFeaturedReportId(summaries)).toBe('demo-industry-tracking-2099-06-18')
  })

  it('returns empty fixed slots and excludes unavailable content from aggregates for an unknown date', async () => {
    const today = await repository.getToday('2099-06-19')

    expect(today.dailySlots.map(({ reportType }) => reportType)).toEqual([
      'morning_scan',
      'midday_review',
      'daily_review',
      'industry_tracking',
    ])
    expect(today.dailySlots.every(({ status }) => status === 'no_report')).toBe(true)
    expect(today.periodicReports).toEqual([])
    expect(today.summaryPoints).toEqual([])
    expect(today.featuredReportId).toBeNull()
  })
})

describe('FixtureReportRepository research links', () => {
  const repository = new FixtureReportRepository()

  it('returns null for an unknown industry or symbol', async () => {
    const [industry, watchlist] = await Promise.all([
      repository.getIndustry('missing-industry'),
      repository.getWatchlistItem('DEMO-MISSING'),
    ])

    expect(industry).toBeNull()
    expect(watchlist).toBeNull()
  })

  it('keeps every report, industry and watchlist link bidirectional with no duplicates or dangling ids', async () => {
    const reports = await repository.listReports()
    const industries = await repository.listIndustries()
    const watchlist = await Promise.all(
      ['DEMO-A01', 'DEMO-B02', 'DEMO-C03', 'DEMO-D04'].map((symbol) =>
        repository.getWatchlistItem(symbol),
      ),
    )

    for (const report of reports) {
      expect(new Set(report.industryIds).size).toBe(report.industryIds.length)
      expect(new Set(report.watchlistSymbols).size).toBe(report.watchlistSymbols.length)
      for (const industryId of report.industryIds) {
        const industry = industries.find(({ id }) => id === industryId)
        expect(industry, `${report.id} -> ${industryId}`).toBeDefined()
        expect(industry?.reportIds).toContain(report.id)
      }
      for (const symbol of report.watchlistSymbols) {
        const item = watchlist.find((candidate) => candidate?.symbol === symbol)
        expect(item, `${report.id} -> ${symbol}`).toBeTruthy()
        expect(item?.reportIds).toContain(report.id)
      }
    }

    for (const industry of industries) {
      expect(new Set(industry.reportIds).size).toBe(industry.reportIds.length)
      expect(new Set(industry.watchlistSymbols).size).toBe(industry.watchlistSymbols.length)
      for (const reportId of industry.reportIds) {
        expect(reports.find(({ id }) => id === reportId)?.industryIds).toContain(industry.id)
      }
      for (const symbol of industry.watchlistSymbols) {
        const item = watchlist.find((candidate) => candidate?.symbol === symbol)
        expect(item?.industryIds).toContain(industry.id)
      }
    }

    for (const item of watchlist) {
      expect(item).not.toBeNull()
      expect(new Set(item!.industryIds).size).toBe(item!.industryIds.length)
      expect(new Set(item!.reportIds).size).toBe(item!.reportIds.length)
      for (const industryId of item!.industryIds) {
        expect(industries.find(({ id }) => id === industryId)?.watchlistSymbols).toContain(item!.symbol)
      }
      for (const reportId of item!.reportIds) {
        expect(reports.find(({ id }) => id === reportId)?.watchlistSymbols).toContain(item!.symbol)
      }
    }
  })

  it('uses four non-diverging initial trend states', async () => {
    const industries = await repository.listIndustries()

    expect(industries.map(({ trendState }) => trendState)).toEqual([
      'warming',
      'continuing',
      'cooling',
      'insufficient',
    ])
  })
})

describe('FixtureReportRepository watchlist snapshots', () => {
  const repository = new FixtureReportRepository()

  it('returns the complete current snapshot, deterministic cross-item changes and defensive copies', async () => {
    const first = await repository.getWatchlistOverview()

    expect(first).toEqual({
      snapshotId: 'demo-watchlist-current',
      snapshotAt: '2099-06-18T20:00:00+08:00',
      currentItems: expect.arrayContaining([
        expect.objectContaining({ symbol: 'DEMO-A01', status: 'current', riskNote: '仅为虚构研究观察项。' }),
        expect.objectContaining({ symbol: 'DEMO-B02', status: 'current', riskNote: '仅为虚构研究观察项。' }),
        expect.objectContaining({ symbol: 'DEMO-D04', status: 'current', riskNote: '仅为虚构研究观察项。' }),
      ]),
      delta: {
        added: ['DEMO-D04'],
        continuing: ['DEMO-A01', 'DEMO-B02'],
        removed: ['DEMO-C03'],
        reasonChanged: ['DEMO-B02'],
      },
      changes: [
        {
          symbol: 'DEMO-D04',
          displayName: '演示标的丁',
          industryIds: ['industry-cleanloop-energy'],
          type: 'added',
          occurredAt: '2099-06-18T20:00:00+08:00',
          reason: '虚构能源线索新增观察。',
        },
        {
          symbol: 'DEMO-B02',
          displayName: '演示标的乙',
          industryIds: ['industry-deepwave-computing'],
          type: 'reason_changed',
          occurredAt: '2099-06-18T20:00:00+08:00',
          reason: '虚构计算线索获得新增验证。',
        },
        {
          symbol: 'DEMO-C03',
          displayName: '演示标的丙',
          industryIds: ['industry-frontier-logistics'],
          type: 'removed',
          occurredAt: '2099-06-18T20:00:00+08:00',
          reason: '虚构物流证据不足，移出当前观察。',
        },
      ],
    })
    expect(first.currentItems.map(({ symbol }) => symbol)).toEqual(['DEMO-A01', 'DEMO-B02', 'DEMO-D04'])

    ;(first.currentItems[0] as { reason: string }).reason = '污染原因'
    ;(first.changes[0] as { reason: string }).reason = '污染变更'
    const second = await repository.getWatchlistOverview()

    expect(second.currentItems[0].reason).toBe('虚构材料线索待跟踪。')
    expect(second.changes[0].reason).toBe('虚构能源线索新增观察。')
  })

  it('excludes removed items from the current list while keeping removed detail queryable', async () => {
    const [current, removed] = await Promise.all([
      repository.listWatchlist(),
      repository.getWatchlistItem('DEMO-C03'),
    ])

    expect(current.map(({ symbol }) => symbol)).toEqual(['DEMO-A01', 'DEMO-B02', 'DEMO-D04'])
    expect(removed).toMatchObject({ symbol: 'DEMO-C03', status: 'removed' })
    expect(removed?.events.at(-1)).toMatchObject({ type: 'removed' })
  })

  it('derives added, removed, continuing and reason-changed items from complete snapshots only', () => {
    const prior: WatchlistSnapshot = {
      id: 'snapshot-prior',
      snapshotAt: '2099-06-17T20:00:00+08:00',
      items: [
        { symbol: 'DEMO-A01', reason: '原因甲' },
        { symbol: 'DEMO-B02', reason: '原因乙' },
        { symbol: 'DEMO-C03', reason: '原因丙' },
      ],
    }
    const current: WatchlistSnapshot = {
      id: 'snapshot-current',
      snapshotAt: '2099-06-18T20:00:00+08:00',
      items: [
        { symbol: 'DEMO-A01', reason: '原因甲' },
        { symbol: 'DEMO-B02', reason: '原因乙已变化' },
        { symbol: 'DEMO-D04', reason: '原因丁' },
      ],
    }

    expect(deriveWatchlistDelta(prior, current)).toEqual({
      added: ['DEMO-D04'],
      continuing: ['DEMO-A01', 'DEMO-B02'],
      removed: ['DEMO-C03'],
      reasonChanged: ['DEMO-B02'],
    })
  })

  it('fails closed when a current detail reason contradicts the authoritative snapshot', async () => {
    const detail = watchlistDetails.find(({ symbol }) => symbol === 'DEMO-B02')!
    const originalReason = detail.reason
    ;(detail as { reason: string }).reason = '与快照矛盾的详情原因'

    try {
      await expect(repository.getWatchlistOverview()).rejects.toThrow('INVALID_WATCHLIST_FIXTURE')
    } finally {
      ;(detail as { reason: string }).reason = originalReason
    }
  })

  it('fails closed when a removed event contradicts the removed detail', async () => {
    const detail = watchlistDetails.find(({ symbol }) => symbol === 'DEMO-C03')!
    const removedEvent = detail.events.find(({ type }) => type === 'removed')!
    const originalReason = removedEvent.reason
    ;(removedEvent as { reason: string }).reason = '与移出详情矛盾的事件原因'

    try {
      await expect(repository.getWatchlistOverview()).rejects.toThrow('INVALID_WATCHLIST_FIXTURE')
    } finally {
      ;(removedEvent as { reason: string }).reason = originalReason
    }
  })
})

describe('FixtureReportRepository safety and immutability', () => {
  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('returns defensive copies so consumer mutation cannot pollute later reads', async () => {
    const first = await repositoryForMutation().getReport('demo-daily-2099-06-18')
    expect(first).not.toBeNull()
    ;(first!.summaryPoints as string[]).push('污染值')
    ;(first!.versions[0] as { version: string }).version = 'polluted'

    const second = await repositoryForMutation().getReport('demo-daily-2099-06-18')

    expect(second?.summaryPoints).not.toContain('污染值')
    expect(second?.versions.map(({ version }) => version)).toEqual(['v1.1', 'v1.0'])
  })

  it('returns deterministic fictional data without network or system-time dependencies', async () => {
    vi.stubGlobal('fetch', () => {
      throw new Error('fetch must not be called')
    })
    vi.stubGlobal(
      'Date',
      class ForbiddenDate {
        constructor() {
          throw new Error('system time must not be read')
        }
        static now() {
          throw new Error('system time must not be read')
        }
      },
    )
    const repository = new FixtureReportRepository()
    const [reports, today, industries, watchlist] = await Promise.all([
      repository.listReports(),
      repository.getToday(SAMPLE_DATE),
      repository.listIndustries(),
      repository.listWatchlist(),
    ])
    const serialized = JSON.stringify({ reports, today, industries, watchlist })

    expect(serialized).toContain('DEMO-A01')
    expect(serialized).not.toMatch(/https?:\/\//i)
    expect(serialized).not.toMatch(/\b\d{6}\b/)
    expect(serialized).not.toMatch(/(?:api[_-]?key|bearer|token|secret|process\.env)/i)
  })
})

function repositoryForMutation() {
  return new FixtureReportRepository()
}
