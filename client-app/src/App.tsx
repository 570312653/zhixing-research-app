import { HashRouter, Navigate, Route, Routes, useLocation, useMatch } from 'react-router'
import { AppShell } from './layout/AppShell'
import { ReportDetailPage } from './screens/ReportDetailPage'
import { ReportLibraryPage } from './screens/ReportLibraryPage'
import { TodayPage } from './screens/TodayPage'
import './styles/global.css'

function PlaceholderPage({ label }: { label: string }) {
  return <p className="app-shell__placeholder">{label}</p>
}

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
        <Route path="/research/*" element={<PlaceholderPage label="研究" />} />
        <Route path="/me/*" element={<PlaceholderPage label="我的" />} />
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
