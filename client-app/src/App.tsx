import { HashRouter, Navigate, Route, Routes, useLocation } from 'react-router'
import { AppShell } from './layout/AppShell'
import './styles/global.css'

function PlaceholderPage({ label }: { label: string }) {
  return <p className="app-shell__placeholder">{label}</p>
}

function AppContent() {
  const { pathname } = useLocation()
  const contentLabel = pathname.startsWith('/reports') ? '报告库'
    : pathname.startsWith('/research') ? '研究'
      : pathname.startsWith('/mine') ? '我的'
        : '今日'

  return (
    <AppShell contentLabel={contentLabel}>
      <Routes>
        <Route path="/today" element={<PlaceholderPage label="今日" />} />
        <Route path="/reports/*" element={<PlaceholderPage label="报告库" />} />
        <Route path="/research/*" element={<PlaceholderPage label="研究" />} />
        <Route path="/mine/*" element={<PlaceholderPage label="我的" />} />
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
