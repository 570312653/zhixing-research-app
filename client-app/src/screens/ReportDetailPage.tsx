import { useEffect, useState } from 'react'
import { useLocation, useNavigate, useParams } from 'react-router'
import { ReportHtmlRenderer } from '../components/ReportHtmlRenderer'
import { BlockingFailureState } from '../components/states/BlockingFailureState'
import { PageSkeleton } from '../components/states/PageSkeleton'
import { formatTimestamp } from '../components/shared'
import type { ReportDetail, ReportType } from '../domain/report'
import { FixtureReportRepository } from '../repositories/FixtureReportRepository'
import type { ReportRepository } from '../repositories/ReportRepository'
import './reports.css'

const defaultRepository = new FixtureReportRepository()
const labels: Record<ReportType, string> = {
  morning_scan: '早盘扫描', midday_review: '午间复盘', daily_review: '每日复盘', industry_tracking: '行业跟踪', holiday_digest: '休市信息摘要', month_end_review: '月末复盘', industry_research: '产业研究',
}

function controlledReturnTo(state: unknown): '/today' | '/reports' {
  if (typeof state !== 'object' || state === null || !('returnTo' in state)) return '/reports'
  const returnTo = (state as { returnTo?: unknown }).returnTo
  return returnTo === '/today' || returnTo === '/reports' ? returnTo : '/reports'
}

export function ReportDetailPage({ repository = defaultRepository }: { repository?: ReportRepository }) {
  const { reportId = '' } = useParams()
  const location = useLocation()
  const navigate = useNavigate()
  const [loadState, setLoadState] = useState<
    | { kind: 'loading'; reportId: string }
    | { kind: 'success'; reportId: string; report: ReportDetail }
    | { kind: 'missing'; reportId: string }
    | { kind: 'failure'; reportId: string }
  >(() => ({ kind: 'loading', reportId }))

  useEffect(() => {
    let active = true
    setLoadState({ kind: 'loading', reportId })
    repository.getReport(reportId).then((value) => {
      if (!active) return
      setLoadState(value
        ? { kind: 'success', reportId, report: value }
        : { kind: 'missing', reportId })
    }).catch(() => {
      if (!active) return
      setLoadState({ kind: 'failure', reportId })
    })
    return () => { active = false }
  }, [reportId, repository])

  const returnTo = controlledReturnTo(location.state)
  const currentState = loadState.reportId === reportId
    ? loadState
    : { kind: 'loading' as const, reportId }
  if (currentState.kind === 'loading') return <PageSkeleton label="报告详情" />
  if (currentState.kind === 'failure') return <><DetailToolbar onBack={() => navigate(returnTo)} /><BlockingFailureState errorCode="LOCAL_FIXTURE_UNAVAILABLE" /></>
  if (currentState.kind === 'missing') return <><DetailToolbar onBack={() => navigate(returnTo)} /><section className="state-card" role="status"><p>报告不存在或已不可用</p></section></>

  const report = currentState.report

  return (
    <div className="report-detail">
      <DetailToolbar title={labels[report.type]} subtitle={report.title} onBack={() => navigate(returnTo)} />
      <article className="report-detail__article">
        <p className="report-detail__eyebrow">{labels[report.type]}</p>
        <h1>{report.title}</h1>
        <div className="report-detail__metadata">
          <span>报告日期：{report.reportDate}</span>
          <span>当前版本：{report.version}</span>
          <span>数据截至：{formatTimestamp(report.dataAsOf)}</span>
          <span>生成时间：{formatTimestamp(report.generatedAt)}</span>
        </div>
        <aside className="report-detail__risk">{report.riskNotice}</aside>
        {report.summaryPoints.length > 0 && <section className="report-detail__summary"><h2>核心摘要</h2><ul>{report.summaryPoints.map((point) => <li key={point}>{point}</li>)}</ul></section>}
        <ReportHtmlRenderer html={report.contentHtml} />
        <section className="report-detail__tools" aria-labelledby="report-tools-title"><h2 id="report-tools-title">报告工具</h2><button type="button" disabled>下载 PDF</button><p>{report.pdf.reason}</p></section>
        <section className="report-detail__versions" aria-labelledby="report-versions-title"><h2 id="report-versions-title">版本历史</h2><ol>{report.versions.map((version) => <li key={`${version.version}-${version.publishedAt}`}><strong>{version.version}</strong><span>发布于 {formatTimestamp(version.publishedAt)}</span><span>生成于 {formatTimestamp(version.generatedAt)}</span></li>)}</ol></section>
      </article>
    </div>
  )
}

function DetailToolbar({ title = '报告详情', subtitle, onBack }: { title?: string; subtitle?: string; onBack: () => void }) {
  return <header className="report-detail__toolbar"><button type="button" aria-label="返回" onClick={onBack}>‹</button><div><strong>{title}</strong>{subtitle && <span>{subtitle}</span>}</div></header>
}
