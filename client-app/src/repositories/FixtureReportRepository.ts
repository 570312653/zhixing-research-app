import {
  DAILY_REPORT_TYPES,
  PERIODIC_REPORT_TYPES,
  selectFeaturedReportId,
  type ReportDetail,
  type ReportFilter,
  type ReportSummary,
  type TodayDailySlot,
  type TodayDailySlots,
  type TodayReportSet,
} from '../domain/report'
import type { IndustryDetail, IndustrySummary } from '../domain/research'
import {
  deriveWatchlistDelta,
  type WatchlistChangeRecord,
  type WatchlistDetail,
  type WatchlistItem,
  type WatchlistOverview,
  type WatchlistOverviewItem,
} from '../domain/watchlist'
import {
  industryFixtures,
  researchThemes,
} from '../fixtures/industries'
import { reportFixtures } from '../fixtures/reports'
import {
  watchlistDetails,
  watchlistSnapshots,
} from '../fixtures/watchlist'
import type { ReportRepository } from './ReportRepository'

const FIXED_LAST_SYNCED_AT = '2099-06-18T20:30:00+08:00'

function clone<T>(value: T): T {
  return structuredClone(value)
}

function toSummary(report: ReportDetail): ReportSummary {
  const {
    contentHtml: _contentHtml,
    riskNotice: _riskNotice,
    pdf: _pdf,
    versions: _versions,
    ...summary
  } = report
  return summary
}

function toIndustrySummary(industry: IndustryDetail): IndustrySummary {
  const {
    supportingEvidence: _supportingEvidence,
    counterEvidence: _counterEvidence,
    timeline: _timeline,
    ...summary
  } = industry
  return summary
}

function sortReports(left: ReportDetail, right: ReportDetail): number {
  return (
    right.reportDate.localeCompare(left.reportDate) ||
    right.publishedAt.localeCompare(left.publishedAt) ||
    left.id.localeCompare(right.id)
  )
}

function intersects(values: readonly string[], filterValues?: readonly string[]) {
  return (
    filterValues === undefined ||
    filterValues.length === 0 ||
    filterValues.some((value) => values.includes(value))
  )
}

function matchesQuery(report: ReportDetail, rawQuery?: string) {
  const query = rawQuery?.trim().toLocaleLowerCase()
  if (!query) return true

  const industryNames = industryFixtures
    .filter(({ id }) => report.industryIds.includes(id))
    .map(({ displayName }) => displayName)
  const themeNames = researchThemes
    .filter(({ id }) => report.themeIds.includes(id))
    .map(({ displayName }) => displayName)

  return [report.title, ...industryNames, ...themeNames]
    .join(' ')
    .toLocaleLowerCase()
    .includes(query)
}

function currentWatchlistItems(): WatchlistItem[] {
  const currentSnapshot = watchlistSnapshots[1]
  return currentSnapshot.items.map(({ symbol }) => {
    const detail = watchlistDetails.find((item) => item.symbol === symbol)
    if (!detail || detail.status !== 'current') throw new Error('INVALID_WATCHLIST_FIXTURE')
    const { status: _status, riskNote: _riskNote, events: _events, ...item } = detail
    return { ...item, status: 'current' as const }
  })
}

function currentWatchlistOverviewItems(): WatchlistOverviewItem[] {
  const currentSnapshot = watchlistSnapshots[1]
  return currentSnapshot.items.map(({ symbol }) => {
    const detail = watchlistDetails.find((item) => item.symbol === symbol)
    if (!detail || detail.status !== 'current') throw new Error('INVALID_WATCHLIST_FIXTURE')
    const { status: _status, events: _events, ...item } = detail
    return { ...item, status: 'current' as const }
  })
}

function watchlistChange(symbol: string, type: WatchlistChangeRecord['type']): WatchlistChangeRecord {
  const detail = watchlistDetails.find((item) => item.symbol === symbol)
  const event = detail?.events.findLast((candidate) => candidate.type === type)
  if (!detail || !event) throw new Error('INVALID_WATCHLIST_FIXTURE')
  return {
    symbol,
    displayName: detail.displayName,
    industryIds: detail.industryIds,
    type,
    occurredAt: event.occurredAt,
    reason: event.reason,
  }
}

export class FixtureReportRepository implements ReportRepository {
  async listReports(filter: ReportFilter = {}): Promise<ReportSummary[]> {
    if (filter.dateFrom && filter.dateTo && filter.dateFrom > filter.dateTo) {
      return []
    }

    const reports = reportFixtures
      .filter((report) => matchesQuery(report, filter.query))
      .filter(
        (report) =>
          filter.reportTypes === undefined ||
          filter.reportTypes.length === 0 ||
          filter.reportTypes.includes(report.type),
      )
      .filter((report) => !filter.dateFrom || report.reportDate >= filter.dateFrom)
      .filter((report) => !filter.dateTo || report.reportDate <= filter.dateTo)
      .filter((report) => intersects(report.industryIds, filter.industryIds))
      .filter((report) => intersects(report.themeIds, filter.themeIds))
      .toSorted(sortReports)
      .map(toSummary)

    return clone(reports)
  }

  async getReport(reportId: string): Promise<ReportDetail | null> {
    const report = reportFixtures.find(({ id }) => id === reportId)
    return report ? clone(report) : null
  }

  async getToday(date: string): Promise<TodayReportSet> {
    const reports = reportFixtures
      .filter((report) => report.reportDate === date)
      .toSorted(sortReports)
    const buildDailySlot = (reportType: (typeof DAILY_REPORT_TYPES)[number]): TodayDailySlot => {
      const report = reports.find(({ type }) => type === reportType)
      return report
        ? { reportType, status: 'available', report: toSummary(report) }
        : { reportType, status: 'no_report' }
    }
    const dailySlots: TodayDailySlots = [
      buildDailySlot(DAILY_REPORT_TYPES[0]),
      buildDailySlot(DAILY_REPORT_TYPES[1]),
      buildDailySlot(DAILY_REPORT_TYPES[2]),
      buildDailySlot(DAILY_REPORT_TYPES[3]),
    ]
    const availableReports = dailySlots.flatMap((slot) =>
      slot.status === 'available' ? [slot.report] : [],
    )
    const periodicReports = reports
      .filter((report) =>
        PERIODIC_REPORT_TYPES.some((reportType) => reportType === report.type),
      )
      .map(toSummary)

    return clone({
      date,
      dailySlots,
      featuredReportId: selectFeaturedReportId(availableReports),
      summaryPoints: availableReports.flatMap(({ summaryPoints }) => summaryPoints),
      periodicReports,
      lastSyncedAt: FIXED_LAST_SYNCED_AT,
    })
  }

  async listIndustries(): Promise<IndustrySummary[]> {
    return clone(industryFixtures.map(toIndustrySummary))
  }

  async getIndustry(industryId: string): Promise<IndustryDetail | null> {
    const industry = industryFixtures.find(({ id }) => id === industryId)
    return industry ? clone(industry) : null
  }

  async listWatchlist(): Promise<WatchlistItem[]> {
    return clone(currentWatchlistItems())
  }

  async getWatchlistOverview(): Promise<WatchlistOverview> {
    const [prior, current] = watchlistSnapshots
    const delta = deriveWatchlistDelta(prior, current)
    return clone({
      snapshotId: current.id,
      snapshotAt: current.snapshotAt,
      currentItems: currentWatchlistOverviewItems(),
      delta,
      changes: [
        ...delta.added.map((symbol) => watchlistChange(symbol, 'added')),
        ...delta.reasonChanged.map((symbol) => watchlistChange(symbol, 'reason_changed')),
        ...delta.removed.map((symbol) => watchlistChange(symbol, 'removed')),
      ],
    })
  }

  async getWatchlistItem(symbol: string): Promise<WatchlistDetail | null> {
    const detail = watchlistDetails.find((item) => item.symbol === symbol)
    return detail ? clone(detail) : null
  }
}
