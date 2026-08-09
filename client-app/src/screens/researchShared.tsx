import { NavLink } from 'react-router'

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
  return <StaleContentNotice errorCode="LOCAL_FIXTURE_UNAVAILABLE" lastSuccessfulSyncAt={lastSuccessfulSyncAt} />
}

export function ResearchTabs() {
  return <nav className="research-tabs" aria-label="研究分段导航">
    <NavLink end to="/research">总览</NavLink>
    <NavLink to="/research/industries">行业</NavLink>
    <NavLink to="/research/watchlist">标的池</NavLink>
  </nav>
}
