import { useMemo, useState } from 'react'
import { Link } from 'react-router'

import { formatTimestamp } from '../components/shared'
import { ContextualEmptyState } from '../components/states/ContextualEmptyState'
import type { WatchlistChangeRecord, WatchlistOverview, WatchlistOverviewItem } from '../domain/watchlist'
import type { ReportRepository } from '../repositories/ReportRepository'
import './research.css'
import { DisabledResearchRefresh, ResearchFailure, ResearchLoading, ResearchStale, ResearchTabs } from './researchShared'
import { changeLabels, defaultResearchRepository, useResearchResource } from './researchResource'

function changePriority(overview: WatchlistOverview, symbol: string) {
  if (overview.delta.added.includes(symbol)) return 0
  if (overview.delta.reasonChanged.includes(symbol)) return 1
  return 2
}

export function WatchlistPage({ repository = defaultResearchRepository }: { repository?: ReportRepository }) {
  const state = useResearchResource('watchlist-overview', repository, async () => {
    const [overview, industries] = await Promise.all([repository.getWatchlistOverview(), repository.listIndustries()])
    return { overview, industries }
  })
  const [tab, setTab] = useState<'current' | 'changes'>('current')
  const [query, setQuery] = useState('')
  const [industryId, setIndustryId] = useState('')
  const [status, setStatus] = useState('')
  const data = state.kind === 'success' || state.kind === 'stale' ? state.value : null
  const visible = useMemo(() => data?.overview.currentItems
    .filter((item) => `${item.symbol} ${item.displayName}`.toLocaleLowerCase().includes(query.trim().toLocaleLowerCase()))
    .filter((item) => !industryId || item.industryIds.includes(industryId))
    .filter((item) => !status || (status === 'added' ? data.overview.delta.added.includes(item.symbol) : data.overview.delta.continuing.includes(item.symbol)))
    .toSorted((left, right) => changePriority(data.overview, left.symbol) - changePriority(data.overview, right.symbol) || right.lastObservedAt.localeCompare(left.lastObservedAt) || left.symbol.localeCompare(right.symbol)) ?? [], [data, industryId, query, status])

  if (state.kind === 'loading') return <ResearchLoading label="标的池" />
  if (state.kind === 'failure') return <ResearchFailure />
  if (!data) return null
  const { overview, industries } = data

  return <section className="research-page">
    <header className="research-page__header"><div><p>研究观察清单，不构成投资建议</p><h1>核心关注标的</h1></div><span>快照时间：{formatTimestamp(overview.snapshotAt)}</span><DisabledResearchRefresh /></header>
    <ResearchTabs />
    {state.kind === 'stale' && <ResearchStale lastSuccessfulSyncAt={overview.snapshotAt} />}
    <div className="research-metrics research-metrics--watchlist" role="group" aria-label="标的池指标"><strong>当前关注 {overview.currentItems.length}</strong><strong>本期新增 {overview.delta.added.length}</strong><strong>原因更新 {overview.delta.reasonChanged.length}</strong><strong>近期移出 {overview.delta.removed.length}</strong></div>
    <div className="research-switch" role="tablist" aria-label="标的池内容分段"><button id="watchlist-current-tab" role="tab" aria-selected={tab === 'current'} aria-controls="watchlist-current-panel" className={tab === 'current' ? 'is-active' : ''} type="button" onClick={() => setTab('current')}>当前关注</button><button id="watchlist-changes-tab" role="tab" aria-selected={tab === 'changes'} aria-controls="watchlist-changes-panel" className={tab === 'changes' ? 'is-active' : ''} type="button" onClick={() => setTab('changes')}>变更记录</button></div>
    {tab === 'current' ? <div id="watchlist-current-panel" role="tabpanel" aria-labelledby="watchlist-current-tab">
      <div className="research-control-grid" role="group" aria-label="标的池筛选">
        <label>搜索证券代码或名称<input type="search" value={query} onChange={(event) => setQuery(event.target.value)} /></label>
        <label>行业筛选<select value={industryId} onChange={(event) => setIndustryId(event.target.value)}><option value="">全部行业</option>{industries.map((industry) => <option value={industry.id} key={industry.id}>{industry.displayName}</option>)}</select></label>
        <label>状态筛选<select value={status} onChange={(event) => setStatus(event.target.value)}><option value="">全部状态</option><option value="added">新增关注</option><option value="continuing">持续关注</option></select></label>
        <button type="button" onClick={() => { setQuery(''); setIndustryId(''); setStatus('') }}>清除筛选</button>
      </div>
      <p>共 {visible.length} 个当前标的 · 最近变化优先</p>
      <ul className="research-list">{visible.map((item) => <CurrentItem key={item.symbol} item={item} changeType={overview.delta.added.includes(item.symbol) ? 'added' : overview.delta.reasonChanged.includes(item.symbol) ? 'reason_changed' : 'continuing'} industryName={industries.find(({ id }) => id === item.industryIds[0])?.displayName} />)}</ul>
      {overview.currentItems.length === 0 ? <ContextualEmptyState reason="no_watchlist" /> : visible.length === 0 && <ContextualEmptyState reason="filter_no_watchlist" />}
      <p className="research-empty">移出标的不在当前列表展示，可切换“变更记录”追溯。</p>
    </div> : <div id="watchlist-changes-panel" role="tabpanel" aria-labelledby="watchlist-changes-tab">{overview.changes.length > 0 ? <ul className="research-list">{overview.changes.map((change) => <ChangeItem key={`${change.type}-${change.symbol}`} change={change} />)}</ul> : <ContextualEmptyState reason="no_history" />}</div>}
  </section>
}

function CurrentItem({ item, changeType, industryName }: { item: WatchlistOverviewItem; changeType: 'added' | 'reason_changed' | 'continuing'; industryName?: string }) {
  const statusLabel = changeType === 'added' ? '新增关注' : changeType === 'reason_changed' ? '原因更新' : '持续关注'
  return <li>
    <Link className="research-card__body-link" aria-label={`查看标的：${item.displayName}`} to={`/research/watchlist/${item.symbol}`}><div className="research-card__heading"><span><strong>{item.displayName}</strong> <span>{item.symbol}</span></span><span>{statusLabel}</span></div>
    <p><strong>关注原因：</strong>{item.reason}</p>
    <p><strong>主要风险：</strong>{item.riskNote}</p>
    <small>首次 {formatTimestamp(item.firstObservedAt)} · 最近 {formatTimestamp(item.lastObservedAt)}</small></Link>
    {industryName && <Link className="research-industry-link" to={`/research/industries/${item.industryIds[0]}`}>{industryName}</Link>}
  </li>
}

function ChangeItem({ change }: { change: WatchlistChangeRecord }) {
  return <li><Link aria-label={`${changeLabels[change.type]}：${change.displayName}`} to={`/research/watchlist/${change.symbol}`}><strong>{changeLabels[change.type]}：{change.displayName}</strong><span>{change.symbol}</span><p>{change.reason}</p><small>{formatTimestamp(change.occurredAt)}</small></Link></li>
}
