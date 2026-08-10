import { HashRouter, Navigate, Route, Routes, useLocation, useMatch } from 'react-router'
import { AppShell } from './layout/AppShell'
import { BlockingFailureState } from './components/states/BlockingFailureState'
import { ContextualEmptyState } from './components/states/ContextualEmptyState'
import { OfflineBanner } from './components/states/OfflineBanner'
import { PageSkeleton } from './components/states/PageSkeleton'
import { StaleContentNotice } from './components/states/StaleContentNotice'
import { ReportDetailPage } from './screens/ReportDetailPage'
import { ReportLibraryPage } from './screens/ReportLibraryPage'
import { TodayPage } from './screens/TodayPage'
import { IndustryDetailPage } from './screens/IndustryDetailPage'
import { IndustryListPage } from './screens/IndustryListPage'
import { MyOperationsPage } from './screens/MyOperationsPage'
import { ResearchOverviewPage } from './screens/ResearchOverviewPage'
import { WatchlistDetailPage } from './screens/WatchlistDetailPage'
import { WatchlistPage } from './screens/WatchlistPage'
import { readE2EFixtureState, type E2EFixtureState } from './test-fixtures/e2eState'
import './styles/global.css'

const E2E_LAST_SYNCED_AT = '2099-06-18T20:30:00+08:00'

function AppRoutes() {
  return <Routes>
    <Route path="/today" element={<TodayPage />} />
    <Route path="/reports" element={<ReportLibraryPage />} />
    <Route path="/reports/:reportId" element={<ReportDetailPage />} />
    <Route path="/research" element={<ResearchOverviewPage />} />
    <Route path="/research/industries" element={<IndustryListPage />} />
    <Route path="/research/industries/:industryId" element={<IndustryDetailPage />} />
    <Route path="/research/watchlist" element={<WatchlistPage />} />
    <Route path="/research/watchlist/:symbol" element={<WatchlistDetailPage />} />
    <Route path="/me/*" element={<MyOperationsPage />} />
    <Route path="*" element={<Navigate replace to="/today" />} />
  </Routes>
}

function ContentWithE2EFixture({ contentLabel, fixtureState }: { contentLabel: string; fixtureState: E2EFixtureState | null }) {
  if (!__ZHIXING_E2E__) return <AppRoutes />

  if (fixtureState === 'loading') return <PageSkeleton label={contentLabel} />
  if (fixtureState === 'empty') return <ContextualEmptyState reason="no_reports" />
  if (fixtureState === 'failure') return <BlockingFailureState errorCode="E2E_FIXED_FAILURE" />
  if (fixtureState === 'offline_no_cache') return <section className="state-card state-card--alert" role="alert">
    <span aria-hidden="true">⚠</span>
    <p>离线且没有可用缓存</p>
    <p>连接恢复后再试。</p>
  </section>
  return <>
    {fixtureState === 'offline' && <OfflineBanner lastSyncedAt={E2E_LAST_SYNCED_AT} />}
    {fixtureState === 'stale' && <StaleContentNotice errorCode="E2E_FIXED_STALE" lastSuccessfulSyncAt={E2E_LAST_SYNCED_AT} />}
    <AppRoutes />
  </>
}

function AppContent() {
  const { pathname } = useLocation()
  const reportDetail = useMatch('/reports/:reportId') !== null
  const fixtureState = __ZHIXING_E2E__ ? readE2EFixtureState() : null
  const fixtureReplacesRoute = __ZHIXING_E2E__
    && fixtureState !== null
    && fixtureState !== 'offline'
    && fixtureState !== 'stale'
  const contentLabel = reportDetail ? '报告详情'
    : pathname.startsWith('/reports') ? '报告库'
    : pathname.startsWith('/research') ? '研究'
      : pathname.startsWith('/me') ? '我的'
        : '今日'

  return (
    <AppShell contentLabel={contentLabel} immersive={reportDetail && !fixtureReplacesRoute}>
      <ContentWithE2EFixture contentLabel={contentLabel} fixtureState={fixtureState} />
    </AppShell>
  )
}

export default function App() {
  return (
    <HashRouter>
      <AppContent />
    </HashRouter>
  )
}
