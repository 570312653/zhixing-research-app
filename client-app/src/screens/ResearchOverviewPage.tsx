import { Link } from 'react-router'

import { ReportCard } from '../components/ReportCard'
import { formatTimestamp } from '../components/shared'
import type { ReportSummary } from '../domain/report'
import type { IndustrySummary } from '../domain/research'
import type { WatchlistOverview } from '../domain/watchlist'
import type { ReportRepository } from '../repositories/ReportRepository'
import './research.css'
import {
  ResearchFailure,
  ResearchLoading,
  ResearchStale,
  ResearchTabs,
} from './researchShared'
import { changeLabels, defaultResearchRepository, trendLabels, useResearchResource } from './researchResource'

type OverviewData = { industries: IndustrySummary[]; watchlist: WatchlistOverview; reports: ReportSummary[] }

export function ResearchOverviewPage({ repository = defaultResearchRepository }: { repository?: ReportRepository }) {
  const state = useResearchResource<OverviewData>('research-overview', repository, async () => {
    const [industries, watchlist, reports] = await Promise.all([
      repository.listIndustries(),
      repository.getWatchlistOverview(),
      repository.listReports({ reportTypes: ['industry_tracking', 'industry_research'] }),
    ])
    return { industries, watchlist, reports }
  })

  if (state.kind === 'loading') return <ResearchLoading label="研究总览" />
  if (state.kind === 'failure') return <ResearchFailure />
  if (state.kind === 'missing') return null
  const { industries, watchlist, reports } = state.value
  const warming = industries.filter(({ trendState }) => trendState === 'warming').length
  const cooling = industries.filter(({ trendState }) => trendState === 'cooling').length

  return <section className="research-page">
    <header className="research-page__header"><div><p>固定样例</p><h1>研究</h1></div><span>快照 {formatTimestamp(watchlist.snapshotAt)}</span></header>
    <ResearchTabs />
    {state.kind === 'stale' && <ResearchStale lastSuccessfulSyncAt={watchlist.snapshotAt} />}
    <section className="research-hero"><h2>今日研究变化</h2><div className="research-metrics" role="group" aria-label="研究变化指标"><strong>行业升温 {warming}</strong><strong>行业降温 {cooling}</strong><strong>标的池变化 {watchlist.changes.length}</strong></div></section>
    <section className="research-section"><div className="research-section__heading"><h2>行业趋势变化</h2><Link to="/research/industries">查看全部行业</Link></div><ul className="research-list">{industries.filter(({ trendState }) => trendState === 'warming' || trendState === 'cooling').map((industry) => <li key={industry.id}><Link to={`/research/industries/${industry.id}`}><strong>{industry.displayName}</strong><span>{trendLabels[industry.trendState]}</span><p>{industry.thesis}</p></Link></li>)}</ul></section>
    <section className="research-section"><div className="research-section__heading"><h2>核心关注标的池变化</h2><Link to="/research/watchlist">进入标的池</Link></div><ul className="research-change-grid" aria-label="标的池变化">{watchlist.changes.map((change) => <li key={`${change.type}-${change.symbol}`}><Link to={`/research/watchlist/${change.symbol}`}><strong>{change.displayName}</strong><span>{changeLabels[change.type]}</span><p>{change.reason}</p></Link></li>)}</ul></section>
    {reports[0] && <section className="research-section"><h2>最新行业报告</h2><ReportCard report={reports[0]} to={`/reports/${reports[0].id}`} returnTo="/research" /></section>}
  </section>
}
