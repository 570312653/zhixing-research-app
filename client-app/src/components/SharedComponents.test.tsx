import { cleanup, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { useState } from 'react'
import { afterEach, describe, expect, it } from 'vitest'
import { FreshnessBadge, ReadStateBadge, VersionBadge } from './Badges'
import { EvidenceCard } from './EvidenceCard'
import { FilterBar } from './FilterBar'
import { ReportCard } from './ReportCard'
import { RiskCard } from './RiskCard'
import { Timeline } from './Timeline'
import type { ReportFilter } from '../domain/report'
import { reportFixtures } from '../fixtures/reports'

describe('shared state components', () => {
  afterEach(cleanup)
  const syncedAt = '2099-06-18T20:30:00+08:00'

  it('renders report summary fields and each readable state with a named semantic link', () => {
    render(<><ReportCard report={reportFixtures[0]} href="#/reports/demo-morning-2099-06-18" /><ReportCard report={reportFixtures[1]} href="#/reports/demo-midday-2099-06-18" /><ReportCard report={reportFixtures[2]} href="#/reports/demo-daily-2099-06-18" /></>)

    expect(screen.getByRole('link', { name: /查看报告：知行虚构早盘扫描/ })).toBeInTheDocument()
    expect(screen.getByText('早盘扫描')).toBeInTheDocument()
    expect(screen.getAllByText('版本 v1.0')).toHaveLength(2)
    expect(screen.getByText('数据截至：2099-06-18 08:30')).toBeInTheDocument()
    expect(screen.getByText('已读')).toBeInTheDocument()
    expect(screen.getByText('阅读中 42%')).toBeInTheDocument()
    expect(screen.getByText('未读')).toBeInTheDocument()
  })

  it('keeps FilterBar controlled through parent state for search, type, and clearing', async () => {
    const user = userEvent.setup()
    function ControlledFilterBar() {
      const [filter, setFilter] = useState<ReportFilter>({ query: '', reportTypes: [] })
      return <FilterBar filter={filter} options={{ reportTypes: ['morning_scan', 'daily_review'] }} onChange={setFilter} onClear={() => setFilter({ query: '', reportTypes: [] })} />
    }
    render(<ControlledFilterBar />)

    await user.type(screen.getByLabelText('搜索报告'), '虚构')
    expect(screen.getByLabelText('搜索报告')).toHaveValue('虚构')
    await user.selectOptions(screen.getByLabelText('报告类型'), 'daily_review')
    expect(screen.getByLabelText('报告类型')).toHaveValue('daily_review')
    await user.click(screen.getByRole('button', { name: '清除筛选' }))

    expect(screen.getByLabelText('搜索报告')).toHaveValue('')
    expect(screen.getByLabelText('报告类型')).toHaveValue('')
  })

  it('renders evidence, risk, and timeline inputs without deriving new conclusions or ordering', () => {
    render(<><EvidenceCard evidence={{ id: 'evidence-1', title: '固定样例支持证据', direction: 'supporting', observedAt: syncedAt }} /><RiskCard title="风险提示" body="固定样例风险说明。" /><Timeline events={[{ id: 'later', occurredAt: '2099-06-19T09:00:00+08:00', trendState: 'warming', note: '后出现的条目' }, { id: 'earlier', occurredAt: '2099-06-18T09:00:00+08:00', trendState: 'cooling', note: '先出现的条目' }]} /> </>)

    expect(screen.getByText('支持方向')).toBeInTheDocument()
    expect(screen.getByText('观察时间：2099-06-18 20:30')).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: '风险提示' })).toBeInTheDocument()
    expect(screen.getByText('固定样例风险说明。')).toBeInTheDocument()
    expect(screen.getAllByRole('listitem').map((item) => item.textContent)).toEqual([
      expect.stringContaining('后出现的条目'),
      expect.stringContaining('先出现的条目'),
    ])
  })

  it('exports text-bearing badges for version, reading state, and freshness', () => {
    render(<><VersionBadge version="v1.2" /><ReadStateBadge readState={{ kind: 'unread' }} /><FreshnessBadge freshness="stale" /></>)

    expect(screen.getByText('版本 v1.2')).toBeInTheDocument()
    expect(screen.getByText('未读')).toBeInTheDocument()
    expect(screen.getByText('内容可能已过期')).toBeInTheDocument()
  })
})
