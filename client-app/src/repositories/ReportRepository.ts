import type {
  ReportDetail,
  ReportFilter,
  ReportSummary,
  TodayReportSet,
} from '../domain/report'
import type { IndustryDetail, IndustrySummary } from '../domain/research'
import type { WatchlistDetail, WatchlistItem, WatchlistOverview } from '../domain/watchlist'

export interface ReportRepository {
  listReports(filter?: ReportFilter): Promise<ReportSummary[]>
  getReport(reportId: string): Promise<ReportDetail | null>
  getToday(date: string): Promise<TodayReportSet>
  listIndustries(): Promise<IndustrySummary[]>
  getIndustry(industryId: string): Promise<IndustryDetail | null>
  listWatchlist(): Promise<WatchlistItem[]>
  getWatchlistOverview(): Promise<WatchlistOverview>
  getWatchlistItem(symbol: string): Promise<WatchlistDetail | null>
}
