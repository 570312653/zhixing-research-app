import { useId, type ReactNode } from 'react'
import { Link, NavLink } from 'react-router'

import { BlockingFailureState } from '../components/states/BlockingFailureState'
import { PageSkeleton } from '../components/states/PageSkeleton'
import { StaleContentNotice } from '../components/states/StaleContentNotice'

export function ResearchLoading({ label }: { label: string }) {
  return <PageSkeleton label={label} />
}

export function ResearchFailure() {
  return <BlockingFailureState errorCode="LOCAL_FIXTURE_UNAVAILABLE" />
}

export function ResearchStale({ lastSuccessfulSyncAt }: { lastSuccessfulSyncAt: string }) {
  return <StaleContentNotice errorCode="LOCAL_FIXTURE_UNAVAILABLE" lastSuccessfulSyncAt={lastSuccessfulSyncAt} timestampLabel="最后可用快照/数据时间" />
}

export function ResearchDetailState({ title, backTo, backLabel, children }: { title: string; backTo: string; backLabel: string; children: ReactNode }) {
  return <article className="research-page research-detail">
    <header className="research-detail__toolbar"><Link aria-label={backLabel} to={backTo}>‹</Link><div><small>{title}</small><h1>{title}</h1></div></header>
    {children}
  </article>
}

export function DisabledResearchRefresh() {
  const reasonId = useId()
  return <div className="research-disabled-action"><button type="button" disabled aria-describedby={reasonId}>刷新</button><span id={reasonId}>离线固定样例未接入刷新。</span></div>
}

export function ResearchTabs() {
  return <nav className="research-tabs" aria-label="研究分段导航">
    <NavLink end to="/research">总览</NavLink>
    <NavLink to="/research/industries">行业</NavLink>
    <NavLink to="/research/watchlist">标的池</NavLink>
  </nav>
}
