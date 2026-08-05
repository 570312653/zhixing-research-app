import { HashRouter, Navigate, NavLink, Route, Routes } from 'react-router'

const navigationItems = [
  { label: '今日', path: '/today' },
  { label: '报告库', path: '/reports' },
  { label: '研究', path: '/research' },
  { label: '我的', path: '/mine' },
]

function PlaceholderPage({ label }: { label: string }) {
  return <main aria-label={label}>{label}</main>
}

function AppContent() {
  return (
    <>
      <header>
        <h1>知行</h1>
      </header>

      <Routes>
        <Route path="/today" element={<PlaceholderPage label="今日" />} />
        <Route path="/reports" element={<PlaceholderPage label="报告库" />} />
        <Route path="/research" element={<PlaceholderPage label="研究" />} />
        <Route path="/mine" element={<PlaceholderPage label="我的" />} />
        <Route path="*" element={<Navigate replace to="/today" />} />
      </Routes>

      <nav aria-label="主导航">
        {navigationItems.map(({ label, path }) => (
          <NavLink key={path} to={path}>
            {label}
          </NavLink>
        ))}
      </nav>
    </>
  )
}

export default function App() {
  return (
    <HashRouter>
      <AppContent />
    </HashRouter>
  )
}
