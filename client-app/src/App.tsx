import { HashRouter, Navigate, Route, Routes, useLocation, useMatch } from 'react-router'
import { AppShell } from './layout/AppShell'
import { ReportDetailPage } from './screens/ReportDetailPage'
import { ReportLibraryPage } from './screens/ReportLibraryPage'
import { TodayPage } from './screens/TodayPage'
import { IndustryDetailPage } from './screens/IndustryDetailPage'
import { IndustryListPage } from './screens/IndustryListPage'
import { MyOperationsPage } from './screens/MyOperationsPage'
import { ResearchOverviewPage } from './screens/ResearchOverviewPage'
import { WatchlistDetailPage } from './screens/WatchlistDetailPage'
import { WatchlistPage } from './screens/WatchlistPage'
import './styles/global.css'

function AppContent() {
  const { pathname } = useLocation()
  const reportDetail = useMatch('/reports/:reportId') !== null
  const contentLabel = reportDetail ? '报告详情'
    : pathname.startsWith('/reports') ? '报告库'
    : pathname.startsWith('/research') ? '研究'
      : pathname.startsWith('/me') ? '我的'
        : '今日'

  return (
    <AppShell contentLabel={contentLabel} immersive={reportDetail}>
      <Routes>
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
