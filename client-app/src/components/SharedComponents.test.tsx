import { cleanup, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { ActionFeedback } from './ActionFeedback'
import { FreshnessBadge, ReadStateBadge, VersionBadge } from './Badges'
import { BlockingFailureState } from './BlockingFailureState'
import { ContextualEmptyState } from './ContextualEmptyState'
import { EvidenceCard } from './EvidenceCard'
import { FilterBar } from './FilterBar'
import { InlineFailureNotice } from './InlineFailureNotice'
import { OfflineBanner } from './OfflineBanner'
import { PageSkeleton } from './PageSkeleton'
import { ReportCard } from './ReportCard'
import { RiskCard } from './RiskCard'
import { SectionSkeleton } from './SectionSkeleton'
import { StaleContentNotice } from './StaleContentNotice'
import { Timeline } from './Timeline'
import { reportFixtures } from '../fixtures/reports'

describe('shared state components', () => {
  afterEach(cleanup)
  const syncedAt = '2099-06-18T20:30:00+08:00'

  it('renders skeletons as readable busy states without owning timers', () => {
    render(<><PageSkeleton label="今日报告" slow /><SectionSkeleton label="产业研究" slow variant="list" /></>)

    expect(screen.getByRole('status', { name: '今日报告正在加载，加载时间较长' })).toBeInTheDocument()
    expect(screen.getByRole('status', { name: '产业研究正在加载，加载时间较长' })).toBeInTheDocument()
    expect(screen.getAllByText('加载时间较长')).toHaveLength(2)
  })

  it('explains contextual emptiness without offering a fabricated refresh', () => {
    render(<ContextualEmptyState reason="filter_no_results" />)

    expect(screen.getByRole('status')).toHaveTextContent('当前筛选条件下没有报告')
    expect(screen.queryByRole('button', { name: /刷新|生成/ })).not.toBeInTheDocument()
  })

  it('sanitizes blocking error codes and disables unavailable retry actions', () => {
    render(<BlockingFailureState errorCode="Bearer secret-value" occurredAt={syncedAt} retryDisabled retryDisabledReason="离线样例不支持重试" />)

    expect(screen.getByRole('alert')).toHaveTextContent('暂时无法显示此内容')
    expect(screen.queryByText('Bearer secret-value')).not.toBeInTheDocument()
    expect(screen.getByText('错误代码：UNAVAILABLE')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: '重试（当前不可用）' })).toBeDisabled()
    expect(screen.getByText('离线样例不支持重试')).toBeInTheDocument()
  })

  it('keeps surrounding content available when an inline failure occurs', () => {
    render(<><p>已归档报告正文</p><InlineFailureNotice errorCode="SYNC_UNAVAILABLE" occurredAt={syncedAt} context="同步状态" /></>)

    expect(screen.getByText('已归档报告正文')).toBeInTheDocument()
    expect(screen.getByRole('alert')).toHaveTextContent('同步状态')
    expect(screen.getByText('错误代码：SYNC_UNAVAILABLE')).toBeInTheDocument()
  })

  it('uses readable offline and stale notices without pretending cached content is current', () => {
    render(<><OfflineBanner lastSyncedAt={syncedAt} /><StaleContentNotice errorCode="SYNC_UNAVAILABLE" lastSuccessfulSyncAt={syncedAt} retryDisabled /></>)

    expect(screen.getByRole('status', { name: '当前离线' })).toHaveTextContent('在线操作当前不可用')
    expect(screen.getByRole('status', { name: '内容可能已过期' })).toHaveTextContent('错误代码：SYNC_UNAVAILABLE')
    expect(screen.getByRole('button', { name: '重试同步（当前不可用）' })).toBeDisabled()
  })

  it('announces action feedback without performing an action itself', () => {
    render(<ActionFeedback state="failure" message="保存未完成，请稍后处理。" actionLabel="再次保存" actionDisabled actionDisabledReason="当前离线" />)

    expect(screen.getByRole('alert')).toHaveTextContent('保存未完成，请稍后处理。')
    expect(screen.getByRole('button', { name: '再次保存（当前不可用）' })).toBeDisabled()
    expect(screen.getByText('当前离线')).toBeInTheDocument()
  })

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

  it('keeps FilterBar controlled and exposes explicit labels', async () => {
    const user = userEvent.setup()
    const onChange = vi.fn()
    const onClear = vi.fn()
    render(<FilterBar filter={{ query: '' }} options={{ reportTypes: ['morning_scan', 'daily_review'] }} onChange={onChange} onClear={onClear} />)

    await user.type(screen.getByLabelText('搜索报告'), '虚构')
    await user.click(screen.getByRole('button', { name: '清除筛选' }))

    expect(onChange).toHaveBeenCalledWith({ query: '虚' })
    expect(onClear).toHaveBeenCalledOnce()
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
