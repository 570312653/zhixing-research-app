import './shared.css'
import type { ReportSummary, ReportType } from '../domain/report'
import { Link } from 'react-router'
import { ReadStateBadge, VersionBadge } from './Badges'
import { formatTimestamp } from './shared'

const reportTypeLabels: Record<ReportType, string> = {
  morning_scan: '早盘扫描',
  midday_review: '午间复盘',
  daily_review: '每日复盘',
  industry_tracking: '行业跟踪',
  holiday_digest: '休市信息摘要',
  month_end_review: '月末复盘',
  industry_research: '产业研究',
}

export type ReportReturnPath =
  | '/today'
  | '/reports'
  | '/research'
  | '/research/industries'
  | `/research/industries/${string}`
  | '/research/watchlist'
  | `/research/watchlist/${string}`

type ReportCardProps =
  | { report: ReportSummary; to: string; returnTo: ReportReturnPath; onOpen?: never }
  | { report: ReportSummary; onOpen: () => void; to?: never; returnTo?: never }

export function ReportCard(props: ReportCardProps) {
  const { report } = props
  const content = <><p>{reportTypeLabels[report.type]}</p><h3>{report.title}</h3><p>报告日期：{report.reportDate}</p><VersionBadge version={report.version} /><p>数据截至：{formatTimestamp(report.dataAsOf)}</p><ReadStateBadge readState={report.readState} /></>
  const name = `查看报告：${report.title}`
  return <article className="report-card">{props.to !== undefined ? <Link to={props.to} state={{ returnTo: props.returnTo }} aria-label={name}>{content}</Link> : <button type="button" onClick={props.onOpen} aria-label={name}>{content}</button>}</article>
}
