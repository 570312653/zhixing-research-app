import { useState } from 'react'
import { Link } from 'react-router'

import { formatTimestamp } from '../components/shared'
import type { ReportSummary } from '../domain/report'
import type { IndustrySummary, IndustryTrendState } from '../domain/research'
import type { ReportRepository } from '../repositories/ReportRepository'
import './research.css'
import { ResearchFailure, ResearchLoading, ResearchStale, ResearchTabs } from './researchShared'
import { defaultResearchRepository, trendLabels, useResearchResource } from './researchResource'

const filters: readonly (IndustryTrendState | 'all')[] = ['all', 'warming', 'continuing', 'cooling', 'insufficient']

type IndustryListData = { industries: IndustrySummary[]; reports: ReportSummary[] }

function changePriority(industry: IndustrySummary) {
  return industry.trendState === 'warming' || industry.trendState === 'cooling' ? 0 : 1
}

export function IndustryListPage({ repository = defaultResearchRepository }: { repository?: ReportRepository }) {
  const state = useResearchResource<IndustryListData>('industry-list', repository, async () => {
    const [industries, reports] = await Promise.all([
      repository.listIndustries(),
      repository.listReports({ reportTypes: ['industry_tracking', 'industry_research'] }),
    ])
    return { industries, reports }
  })
  const [query, setQuery] = useState('')
  const [trend, setTrend] = useState<IndustryTrendState | 'all'>('all')
  const data = state.kind === 'success' || state.kind === 'stale' ? state.value : null

  if (state.kind === 'loading') return <ResearchLoading label="行业列表" />
  if (state.kind === 'failure') return <ResearchFailure />
  if (!data) return null

  const visible = data.industries
    .filter((industry) => trend === 'all' || industry.trendState === trend)
    .filter((industry) => industry.displayName.toLocaleLowerCase().includes(query.trim().toLocaleLowerCase()))
    .toSorted((left, right) => changePriority(left) - changePriority(right) || right.updatedAt.localeCompare(left.updatedAt) || left.id.localeCompare(right.id))
  const lastSuccessfulSyncAt = data.industries.reduce((latest, industry) => industry.updatedAt > latest ? industry.updatedAt : latest, '')

  return <section className="research-page">
    <header className="research-page__header"><div><p>申万一级行业视角</p><h1>研究</h1></div></header>
    <ResearchTabs />
    {state.kind === 'stale' && lastSuccessfulSyncAt && <ResearchStale lastSuccessfulSyncAt={lastSuccessfulSyncAt} />}
    <div className="research-filters">
      <label>搜索关注行业<input type="search" value={query} onChange={(event) => setQuery(event.target.value)} /></label>
      <div>{filters.map((filter) => <button className={trend === filter ? 'is-active' : ''} type="button" key={filter} onClick={() => setTrend(filter)}>{filter === 'all' ? '全部' : trendLabels[filter]}</button>)}</div>
      <button type="button" onClick={() => { setQuery(''); setTrend('all') }}>清除筛选</button>
    </div>
    <p><span>共 {data.industries.length} 个重点关注行业</span> · 变化优先排序</p>
    <ul className="research-list">{visible.map((industry) => {
      const latestReport = data.reports.find(({ id }) => industry.reportIds.includes(id))
      const relatedReportCount = data.reports.filter(({ id }) => industry.reportIds.includes(id)).length
      return <li key={industry.id}><Link aria-label={`查看行业：${industry.displayName}`} to={`/research/industries/${industry.id}`}>
        <div><strong>{industry.displayName}</strong><span className={`research-status research-status--${industry.trendState}`}>{trendLabels[industry.trendState]}</span></div>
        <p>{industry.industryTags.join(' · ')}</p>
        <p>{industry.thesis}</p>
        <small>最新专题报告</small>
        <strong>{latestReport?.title ?? '暂无关联专题报告'}</strong>
        <small>关联专题报告 {relatedReportCount} 篇 · 状态更新于 {formatTimestamp(industry.updatedAt)}</small>
      </Link></li>
    })}</ul>
    {visible.length === 0 && <p className="research-empty">当前筛选条件下没有行业</p>}
  </section>
}
