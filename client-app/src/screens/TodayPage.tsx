import { useEffect, useState } from 'react'
import { Link } from 'react-router'
import { ReportCard } from '../components/ReportCard'
import { BlockingFailureState } from '../components/states/BlockingFailureState'
import { PageSkeleton } from '../components/states/PageSkeleton'
import { StaleContentNotice } from '../components/states/StaleContentNotice'
import { formatTimestamp } from '../components/shared'
import type { ReportSummary, ReportType, TodayReportSet } from '../domain/report'
import { FixtureReportRepository } from '../repositories/FixtureReportRepository'
import type { ReportRepository } from '../repositories/ReportRepository'
import './reports.css'

const FIXED_TODAY = '2099-06-18'
const defaultRepository = new FixtureReportRepository()

const reportTypeLabels: Record<ReportType, string> = {
  morning_scan: '早盘扫描',
  midday_review: '午间复盘',
  daily_review: '每日复盘',
  industry_tracking: '行业跟踪',
  holiday_digest: '休市信息摘要',
  month_end_review: '月末复盘',
  industry_research: '产业研究',
}

function FeaturedReport({ report }: { report: ReportSummary }) {
  const progress = report.readState.kind === 'in_progress' ? report.readState.percent : null
  const action = progress === null ? '打开报告' : '继续阅读'
  return (
    <article className="today-featured">
      <p>{progress === null ? reportTypeLabels[report.type] : `${reportTypeLabels[report.type]} · 已读 ${progress}%`}</p>
      <h3>{report.title}</h3>
      <p>{report.summaryPoints[0]}</p>
      <div className="report-meta"><span>{report.version}</span><span>数据截至 {formatTimestamp(report.dataAsOf)}</span></div>
      <Link aria-label={progress === null ? action : `${action}，已读 ${progress}%`} to={`/reports/${report.id}`} state={{ returnTo: '/today' }}>{action}</Link>
    </article>
  )
}

export function TodayPage({ repository = defaultRepository }: { repository?: ReportRepository }) {
  const [content, setContent] = useState<TodayReportSet | null>(null)
  const [loading, setLoading] = useState(true)
  const [failed, setFailed] = useState(false)

  useEffect(() => {
    let active = true
    setLoading(true)
    repository.getToday(FIXED_TODAY).then((value) => {
      if (!active) return
      setContent(value)
      setFailed(false)
      setLoading(false)
    }).catch(() => {
      if (!active) return
      setFailed(true)
      setLoading(false)
    })
    return () => { active = false }
  }, [repository])

  if (!content && loading) return <PageSkeleton label="今日报告" />
  if (!content && failed) return <BlockingFailureState errorCode="LOCAL_FIXTURE_UNAVAILABLE" />
  if (!content) return null

  const featured = content.dailySlots.flatMap((slot) => slot.status === 'available' ? [slot.report] : []).find(({ id }) => id === content.featuredReportId)

  return (
    <div className="report-page" role="region" aria-label="今日报告内容">
      <header className="report-page__header">
        <div><p className="report-page__eyebrow">ZHIXING · TODAY</p><h2>今日</h2></div>
        <p>{content.date}</p>
      </header>
      {failed && <StaleContentNotice errorCode="LOCAL_FIXTURE_UNAVAILABLE" lastSuccessfulSyncAt={content.lastSyncedAt} />}
      {featured && <FeaturedReport report={featured} />}
      {content.summaryPoints.length > 0 && <section className="report-section"><div className="report-section__heading"><h3>核心摘要</h3><span>来自今日已生成报告</span></div><ol className="summary-list">{content.summaryPoints.map((point, index) => <li key={`${index}-${point}`}>{point}</li>)}</ol></section>}
      <section className="report-section">
        <div className="report-section__heading"><h3>今天的日常报告</h3><span>固定顺序</span></div>
        <ol className="daily-report-grid" aria-label="日常报告">
          {content.dailySlots.map((slot) => <li key={slot.reportType}>{slot.status === 'available' ? <ReportCard report={slot.report} to={`/reports/${slot.report.id}`} returnTo="/today" /> : <article className="report-card report-card--empty"><h4>{reportTypeLabels[slot.reportType]}</h4><p>暂无报告</p></article>}</li>)}
        </ol>
      </section>
      {content.periodicReports.length > 0 && <section className="report-section"><div className="report-section__heading"><h3>周期报告</h3><span>本日内容</span></div><div className="report-stack">{content.periodicReports.map((report) => <div key={report.id}><ReportCard report={report} to={`/reports/${report.id}`} returnTo="/today" /><p className="report-summary">{report.summaryPoints[0]}</p></div>)}</div></section>}
      <p className="report-disclaimer">仅供离线界面验证，不构成任何投资建议。</p>
    </div>
  )
}
