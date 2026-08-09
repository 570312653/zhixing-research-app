import { useState } from 'react'
import { Link, useParams } from 'react-router'

import { ReportCard } from '../components/ReportCard'
import { RiskCard } from '../components/RiskCard'
import { formatTimestamp } from '../components/shared'
import type { WatchlistEvent } from '../domain/watchlist'
import type { ReportRepository } from '../repositories/ReportRepository'
import './research.css'
import { ResearchFailure, ResearchLoading, ResearchStale } from './researchShared'
import { defaultResearchRepository, trendLabels, useResearchResource } from './researchResource'

const eventLabels: Record<WatchlistEvent['type'], string> = {
  added: '新增关注',
  continued: '持续关注',
  reason_changed: '原因更新',
  removed: '已移出',
}

export function WatchlistDetailPage({ repository = defaultResearchRepository }: { repository?: ReportRepository }) {
  const { symbol = '' } = useParams()
  const [expandedReportsSymbol, setExpandedReportsSymbol] = useState<string | null>(null)
  const state = useResearchResource(`watchlist:${symbol}`, repository, async () => {
    const [item, overview, industries, reports] = await Promise.all([repository.getWatchlistItem(symbol), repository.getWatchlistOverview(), repository.listIndustries(), repository.listReports()])
    return item ? { item, overview, industries: industries.filter(({ id }) => item.industryIds.includes(id)), reports: reports.filter(({ id }) => item.reportIds.includes(id)) } : null
  })
  if (state.kind === 'loading') return <ResearchLoading label="标的详情" />
  if (state.kind === 'failure') return <ResearchFailure />
  if (state.kind === 'missing') return <section className="research-empty">标的不存在或已不可用</section>
  const { item, overview, industries, reports } = state.value
  const latestEvent = item.events.at(-1)
  const removedEvent = item.events.findLast(({ type }) => type === 'removed')
  const visibleReports = expandedReportsSymbol === item.symbol ? reports : reports.slice(0, 3)
  const returnTo = `/research/watchlist/${item.symbol}` as const

  return <article className="research-page research-detail">
    <header className="research-detail__toolbar"><Link aria-label="返回标的池" to="/research/watchlist">‹</Link><div><small>标的详情</small><h1>{item.displayName}</h1></div><button type="button" disabled title="离线固定样例未接入刷新">刷新</button></header>
    {state.kind === 'stale' && <ResearchStale lastSuccessfulSyncAt={overview.snapshotAt} />}
    <section className="research-identity"><div><h2>{item.displayName} <span>{item.symbol}</span></h2>{industries[0] && <Link to={`/research/industries/${industries[0].id}`}>{industries[0].displayName}</Link>}</div><strong>{item.status === 'removed' ? '已移出' : latestEvent ? eventLabels[latestEvent.type] : '当前关注'}</strong><p>快照 {overview.snapshotId} · 更新于 {formatTimestamp(overview.snapshotAt)}</p></section>
    <section className="research-hero"><p>{item.status === 'removed' ? '最后关注结论' : '当前关注结论'}</p><h2>{item.reason}</h2></section>
    {latestEvent && <section className="research-section" role="region" aria-label="本期变化"><h2>本期变化</h2><strong>变更类型：{eventLabels[latestEvent.type]}</strong><p>{latestEvent.reason}</p><small>{formatTimestamp(latestEvent.occurredAt)}</small></section>}
    {removedEvent && <section className="research-section"><h2>移出原因</h2><p>{removedEvent.reason}</p><small>移出于 {formatTimestamp(removedEvent.occurredAt)}</small></section>}
    <section className="research-section"><h2>关联证据</h2><p className="research-empty">当前夹具未提供独立的结构化支持或反向证据，不补写市场事实。</p></section>
    <section className="research-section"><h2>主要风险</h2><RiskCard title="风险提示" body={item.riskNote} /></section>
    <section className="research-section" role="region" aria-label="观察历史"><h2>观察历史</h2><ol className="research-timeline">{item.events.toReversed().map((event) => <li key={event.id}><time>{formatTimestamp(event.occurredAt)}</time><strong>{eventLabels[event.type]}</strong><p>{event.reason}</p></li>)}</ol></section>
    <section className="research-section"><h2>关联行业</h2><ul className="research-list">{industries.map((industry) => <li key={industry.id}><Link aria-label={`查看行业：${industry.displayName}`} to={`/research/industries/${industry.id}`}><strong>{industry.displayName}</strong><span>{trendLabels[industry.trendState]}</span><p>{industry.thesis}</p></Link></li>)}</ul></section>
    <section className="research-section"><h2>关联报告</h2><div className="research-report-stack">{visibleReports.map((report) => <ReportCard key={report.id} report={report} to={`/reports/${report.id}`} returnTo={returnTo} />)}</div>{reports.length > 3 && expandedReportsSymbol !== item.symbol && <button type="button" onClick={() => setExpandedReportsSymbol(item.symbol)}>查看全部关联报告</button>}</section>
    <p className="research-disclaimer">仅供信息参考，不构成投资建议。页面不展示实时行情、收益率或交易指令。</p>
  </article>
}
