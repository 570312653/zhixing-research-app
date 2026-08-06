export type ReportType =
  | 'morning_scan'
  | 'midday_review'
  | 'daily_review'
  | 'industry_tracking'
  | 'holiday_digest'
  | 'month_end_review'
  | 'industry_research'

export const DAILY_REPORT_TYPES = [
  'morning_scan',
  'midday_review',
  'daily_review',
  'industry_tracking',
] as const satisfies readonly ReportType[]

export const PERIODIC_REPORT_TYPES = [
  'holiday_digest',
  'month_end_review',
] as const satisfies readonly ReportType[]

export type DailyReportType = (typeof DAILY_REPORT_TYPES)[number]
export type PeriodicReportType = (typeof PERIODIC_REPORT_TYPES)[number]

declare const readProgressPercentBrand: unique symbol

export type ReadProgressPercent = number & {
  readonly [readProgressPercentBrand]: true
}

export type ReadState =
  | { kind: 'unread' }
  | { kind: 'in_progress'; percent: ReadProgressPercent }
  | { kind: 'read' }

export function createInProgressReadState(percent: number): ReadState {
  if (!Number.isInteger(percent) || percent < 1 || percent > 89) {
    throw new RangeError('Read progress must be an integer from 1 to 89')
  }

  return { kind: 'in_progress', percent: percent as ReadProgressPercent }
}

export interface ReportFilter {
  query?: string
  reportTypes?: readonly ReportType[]
  dateFrom?: string
  dateTo?: string
  industryIds?: readonly string[]
  themeIds?: readonly string[]
}

export interface ReportSummary {
  id: string
  type: ReportType
  title: string
  reportDate: string
  version: string
  publishedAt: string
  dataAsOf: string
  generatedAt: string
  readState: ReadState
  summaryPoints: readonly string[]
  industryIds: readonly string[]
  themeIds: readonly string[]
  watchlistSymbols: readonly string[]
}

export interface ReportVersion {
  version: string
  publishedAt: string
  generatedAt: string
  contentHtml: string
}

export interface ReportDetail extends ReportSummary {
  contentHtml: string
  riskNotice: string
  pdf: {
    status: 'unavailable'
    reason: string
  }
  versions: readonly ReportVersion[]
}

export type TodayDailySlot =
  | {
      reportType: DailyReportType
      status: 'available'
      report: ReportSummary
    }
  | {
      reportType: DailyReportType
      status: 'no_report'
    }

export type TodayDailySlots = readonly [
  TodayDailySlot,
  TodayDailySlot,
  TodayDailySlot,
  TodayDailySlot,
]

export interface TodayReportSet {
  date: string
  dailySlots: TodayDailySlots
  featuredReportId: string | null
  summaryPoints: readonly string[]
  periodicReports: readonly ReportSummary[]
  lastSyncedAt: string
}

export function selectFeaturedReportId(
  reports: readonly ReportSummary[],
): string | null {
  const byLatest = (left: ReportSummary, right: ReportSummary) =>
    right.publishedAt.localeCompare(left.publishedAt) || left.id.localeCompare(right.id)
  const inProgress = reports
    .filter(({ readState }) => readState.kind === 'in_progress')
    .toSorted(byLatest)[0]

  return inProgress?.id ?? reports.toSorted(byLatest)[0]?.id ?? null
}
