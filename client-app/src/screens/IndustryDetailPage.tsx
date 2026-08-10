import { useState } from 'react'
import { Link, useParams } from 'react-router'

import { EvidenceCard } from '../components/EvidenceCard'
import { ReportCard } from '../components/ReportCard'
import { formatTimestamp } from '../components/shared'
import type { ReportSummary } from '../domain/report'
import type { IndustryDetail } from '../domain/research'
import type { WatchlistOverview } from '../domain/watchlist'
import type { ReportRepository } from '../repositories/ReportRepository'
import './research.css'
import { ResearchDetailState, ResearchFailure, ResearchLoading, ResearchStale } from './researchShared'
import { changeLabels, defaultResearchRepository, trendLabels, useResearchResource } from './researchResource'

type IndustryPageData = { industry: IndustryDetail; reports: ReportSummary[]; watchlist: WatchlistOverview }

export function IndustryDetailPage({ repository = defaultResearchRepository }: { repository?: ReportRepository }) {
  const { industryId = '' } = useParams()
  const [expandedIndustryId, setExpandedIndustryId] = useState<string | null>(null)
  const [expandedReportsIndustryId, setExpandedReportsIndustryId] = useState<string | null>(null)
  const [historyExpandedIndustryId, setHistoryExpandedIndustryId] = useState<string | null>(null)
  const state = useResearchResource<IndustryPageData>(`industry:${industryId}`, repository, async () => {
    const [industry, reports, watchlist] = await Promise.all([repository.getIndustry(industryId), repository.listReports({ reportTypes: ['industry_tracking', 'industry_research'] }), repository.getWatchlistOverview()])
    return industry ? { industry, reports: reports.filter(({ id }) => industry.reportIds.includes(id)), watchlist } : null
  })
  if (state.kind === 'loading') return <ResearchDetailState title="行业详情" backTo="/research/industries" backLabel="返回行业列表"><ResearchLoading label="行业详情" /></ResearchDetailState>
  if (state.kind === 'failure') return <ResearchDetailState title="行业详情" backTo="/research/industries" backLabel="返回行业列表"><ResearchFailure /></ResearchDetailState>
  if (state.kind === 'missing') return <ResearchDetailState title="行业详情" backTo="/research/industries" backLabel="返回行业列表"><p className="research-empty">行业不存在或已不可用</p></ResearchDetailState>
  const { industry, reports, watchlist } = state.value
  const currentItems = watchlist.currentItems.filter((item) => item.industryIds.includes(industry.id))
  const changes = watchlist.changes
    .filter((change) => change.industryIds.includes(industry.id))
    .toSorted((left, right) => right.occurredAt.localeCompare(left.occurredAt) || left.symbol.localeCompare(right.symbol))
  const visibleChanges = expandedIndustryId === industry.id ? changes : changes.slice(0, 5)
  const visibleReports = expandedReportsIndustryId === industry.id ? reports : reports.slice(0, 3)
  const historyAnchor = Date.parse(industry.updatedAt)
  const historyWindowStart = historyAnchor - 30 * 24 * 60 * 60 * 1000
  const recentTimeline = industry.timeline.filter(({ occurredAt }) => Date.parse(occurredAt) >= historyWindowStart && Date.parse(occurredAt) <= historyAnchor)
  const visibleTimeline = historyExpandedIndustryId === industry.id ? industry.timeline : recentTimeline
  const returnTo = `/research/industries/${industry.id}` as const

  return <article className="research-page research-detail">
    <header className="research-detail__toolbar"><Link aria-label="返回行业列表" to="/research/industries">‹</Link><div><small>行业详情</small><h1>{industry.displayName}</h1></div></header>
    {state.kind === 'stale' && <ResearchStale lastSuccessfulSyncAt={industry.updatedAt} />}
    <section className="research-hero"><p>当前趋势</p><h2>{industry.trendState === 'insufficient' ? '本期证据不足，不形成趋势结论' : trendLabels[industry.trendState]}</h2><p>{industry.thesis}</p><small>数据截至 {formatTimestamp(industry.updatedAt)}</small></section>
    <section className="research-section">
      <h2>支持证据</h2>
      {industry.supportingEvidence.length > 0 ? <div className="research-evidence-grid">{industry.supportingEvidence.map((evidence) => <EvidenceCard key={evidence.id} evidence={evidence} />)}</div> : <p className="research-empty">暂无结构化支持证据</p>}
      <h2>反向证据</h2>
      {industry.counterEvidence.length > 0 ? <div className="research-evidence-grid">{industry.counterEvidence.map((evidence) => <EvidenceCard key={evidence.id} evidence={evidence} />)}</div> : <p className="research-empty">暂无结构化反向证据</p>}
    </section>
    <section className="research-section" role="region" aria-label="趋势历史"><h2>趋势历史</h2><ol className="research-timeline">{visibleTimeline.map((event) => <li key={event.id}><time>{formatTimestamp(event.occurredAt)}</time><strong>{trendLabels[event.trendState]}</strong><p>{event.note}</p></li>)}</ol>{recentTimeline.length < industry.timeline.length && historyExpandedIndustryId !== industry.id && <button type="button" onClick={() => setHistoryExpandedIndustryId(industry.id)}>展开全部历史</button>}</section>
    <section className="research-section"><h2>当前关注标的</h2><ul className="research-list">{currentItems.map((item) => {
      const change = changes.find(({ symbol }) => symbol === item.symbol)
      return <li key={item.symbol}><Link to={`/research/watchlist/${item.symbol}`} aria-label={`查看标的：${item.displayName}`}>
        <div><strong>{item.displayName}</strong><span>{item.symbol}</span></div>
        <span>{change ? changeLabels[change.type] : '持续关注'}</span>
        <p>{item.reason}</p>
        <small>更新于 {formatTimestamp(item.lastObservedAt)} · 风险：{item.riskNote}</small>
      </Link></li>
    })}</ul>{currentItems.length === 0 && <p className="research-empty">当前无关注标的</p>}</section>
    <section className="research-section"><h2>近期标的变更</h2><ul className="research-list">{visibleChanges.map((change) => <li key={`${change.type}-${change.symbol}`}><Link to={`/research/watchlist/${change.symbol}`}><strong>{change.displayName}</strong><span>{changeLabels[change.type]}</span><p>{change.reason}</p><small>{formatTimestamp(change.occurredAt)}</small></Link></li>)}</ul>{changes.length === 0 && <p className="research-empty">暂无近期变更</p>}{changes.length > 5 && expandedIndustryId !== industry.id && <button type="button" onClick={() => setExpandedIndustryId(industry.id)}>展开全部变更</button>}</section>
    <section className="research-section"><h2>专项行业报告</h2><div className="research-report-stack">{visibleReports.map((report) => <ReportCard key={report.id} report={report} to={`/reports/${report.id}`} returnTo={returnTo} />)}</div>{reports.length > 3 && expandedReportsIndustryId !== industry.id && <button type="button" onClick={() => setExpandedReportsIndustryId(industry.id)}>查看全部专项报告</button>}</section>
  </article>
}
