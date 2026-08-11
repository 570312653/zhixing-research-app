import { useEffect, useRef, useState } from 'react'
import { FilterBar } from '../components/FilterBar'
import { ReportCard } from '../components/ReportCard'
import { BlockingFailureState } from '../components/states/BlockingFailureState'
import { ContextualEmptyState } from '../components/states/ContextualEmptyState'
import { PageSkeleton } from '../components/states/PageSkeleton'
import { StaleContentNotice } from '../components/states/StaleContentNotice'
import type { ReportFilter, ReportSummary, ReportType } from '../domain/report'
import { industryFixtures, researchThemes } from '../fixtures/industries'
import { FixtureReportRepository } from '../repositories/FixtureReportRepository'
import type { ReportRepository } from '../repositories/ReportRepository'
import './reports.css'

const defaultRepository = new FixtureReportRepository()
const FIXED_LAST_SYNCED_AT = '2099-06-18T20:30:00+08:00'
const reportTypes: readonly ReportType[] = ['morning_scan', 'midday_review', 'daily_review', 'industry_tracking', 'holiday_digest', 'month_end_review', 'industry_research']

function hasActiveFilter(filter: ReportFilter) {
  return Boolean(
    filter.query?.trim() || filter.dateFrom || filter.dateTo ||
    filter.reportTypes?.length || filter.industryIds?.length || filter.themeIds?.length,
  )
}

function groupByDate(reports: readonly ReportSummary[]) {
  const groups = new Map<string, ReportSummary[]>()
  for (const report of reports) {
    const group = groups.get(report.reportDate) ?? []
    group.push(report)
    groups.set(report.reportDate, group)
  }
  return groups
}

export function ReportLibraryPage({ repository = defaultRepository }: { repository?: ReportRepository }) {
  const [filter, setFilter] = useState<ReportFilter>({})
  const [reports, setReports] = useState<ReportSummary[] | null>(null)
  const [loading, setLoading] = useState(true)
  const [failed, setFailed] = useState(false)
  const requestSequence = useRef(0)

  useEffect(() => {
    const requestId = ++requestSequence.current
    setLoading(true)
    repository.listReports(filter).then((value) => {
      if (requestId !== requestSequence.current) return
      setReports(value)
      setFailed(false)
      setLoading(false)
    }).catch(() => {
      if (requestId !== requestSequence.current) return
      setFailed(true)
      setLoading(false)
    })
  }, [filter, repository])

  if (!reports && loading) return <PageSkeleton label="报告库" />
  if (!reports && failed) return <BlockingFailureState errorCode="LOCAL_FIXTURE_UNAVAILABLE" />
  if (!reports) return null

  const filtered = hasActiveFilter(filter)
  const groups = groupByDate(reports)
  return (
    <div className="report-page report-library">
      <header className="report-page__header"><div><p className="report-page__eyebrow">ZHIXING · LIBRARY</p><h1>报告库</h1></div><p>共 {reports.length} 份</p></header>
      <FilterBar
        filter={filter}
        options={{
          reportTypes,
          industries: industryFixtures.map(({ id, displayName }) => ({ value: id, label: displayName })),
          themes: researchThemes.map(({ id, displayName }) => ({ value: id, label: displayName })),
        }}
        onChange={setFilter}
        onClear={() => setFilter({})}
      />
      {failed && <StaleContentNotice errorCode="LOCAL_FIXTURE_UNAVAILABLE" lastSuccessfulSyncAt={FIXED_LAST_SYNCED_AT} />}
      {reports.length === 0 ? <ContextualEmptyState reason={filtered ? 'filter_no_results' : 'no_reports'} /> : <div className="report-groups">{Array.from(groups, ([date, dateReports]) => <section className="report-group" key={date}><div className="report-section__heading"><h2>{date}</h2><span>{dateReports.length} 份报告</span></div><div className="report-stack">{dateReports.map((report) => <ReportCard key={report.id} report={report} to={`/reports/${report.id}`} returnTo="/reports" />)}</div></section>)}</div>}
    </div>
  )
}
