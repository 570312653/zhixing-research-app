import { cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes } from 'react-router'
import { afterEach, describe, expect, it, vi } from 'vitest'
import App from '../App'
import type { ReportSummary } from '../domain/report'
import { reportFixtures } from '../fixtures/reports'
import { FixtureReportRepository } from '../repositories/FixtureReportRepository'
import { ReportDetailPage } from './ReportDetailPage'
import { ReportLibraryPage } from './ReportLibraryPage'
import { TodayPage } from './TodayPage'

const FIXED_DATE = '2099-06-18'

function deferred<T>() {
  let resolve!: (value: T) => void
  let reject!: (reason?: unknown) => void
  const promise = new Promise<T>((resolvePromise, rejectPromise) => {
    resolve = resolvePromise
    reject = rejectPromise
  })
  return { promise, reject, resolve }
}

describe('Today page', () => {
  afterEach(cleanup)

  it('reads the fixed date and keeps metadata, featured reading, summary, daily slots, and periodic reports in order', async () => {
    const repository = new FixtureReportRepository()
    const getToday = vi.spyOn(repository, 'getToday')
    render(<MemoryRouter><TodayPage repository={repository} /></MemoryRouter>)

    expect(screen.getByRole('status', { name: '今日报告正在加载' })).toBeInTheDocument()
    const featuredLink = await screen.findByRole('link', { name: /继续阅读.*42%/ })
    expect(getToday).toHaveBeenCalledWith(FIXED_DATE)
    expect(featuredLink).toHaveAttribute('href', '/reports/demo-midday-2099-06-18')

    const main = screen.getByRole('region', { name: '今日报告内容' })
    const metadata = within(main).getByText('2099-06-18')
    const summaryHeading = within(main).getByRole('heading', { name: '核心摘要' })
    const dailyHeading = within(main).getByRole('heading', { name: '今天的日常报告' })
    const periodicHeading = within(main).getByRole('heading', { name: '周期报告' })
    expect(metadata.compareDocumentPosition(featuredLink) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy()
    expect(featuredLink.compareDocumentPosition(summaryHeading) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy()
    expect(summaryHeading.compareDocumentPosition(dailyHeading) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy()
    expect(dailyHeading.compareDocumentPosition(periodicHeading) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy()

    const slots = within(screen.getByRole('list', { name: '日常报告' })).getAllByRole('listitem')
    expect(slots.map((slot, index) => within(slot).getByText([
      '早盘扫描',
      '午间复盘',
      '每日复盘',
      '行业跟踪',
    ][index], { exact: true }).textContent)).toEqual(['早盘扫描', '午间复盘', '每日复盘', '行业跟踪'])
    expect(within(main).getByText('虚构休市信息完成汇总。')).toBeInTheDocument()
  })

  it('hides optional areas and describes unavailable fixed slots only as no report', async () => {
    const repository = new FixtureReportRepository()
    vi.spyOn(repository, 'getToday').mockResolvedValue({
      date: FIXED_DATE,
      dailySlots: [
        { reportType: 'morning_scan', status: 'no_report' },
        { reportType: 'midday_review', status: 'no_report' },
        { reportType: 'daily_review', status: 'no_report' },
        { reportType: 'industry_tracking', status: 'no_report' },
      ],
      featuredReportId: null,
      summaryPoints: [],
      periodicReports: [],
      lastSyncedAt: '2099-06-18T20:30:00+08:00',
    })
    render(<MemoryRouter><TodayPage repository={repository} /></MemoryRouter>)

    const slots = await screen.findAllByText('暂无报告')
    expect(slots).toHaveLength(4)
    expect(screen.queryByRole('heading', { name: '核心摘要' })).not.toBeInTheDocument()
    expect(screen.queryByRole('heading', { name: '周期报告' })).not.toBeInTheDocument()
    expect(screen.queryByText(/未到时间|失败|延迟/)).not.toBeInTheDocument()
    expect(screen.queryByRole('link', { name: /继续阅读|打开报告/ })).not.toBeInTheDocument()
  })

  it('shows a sanitized blocking failure without a fake retry when the first read rejects', async () => {
    const repository = new FixtureReportRepository()
    vi.spyOn(repository, 'getToday').mockRejectedValue(new Error('private details must stay hidden'))
    render(<MemoryRouter><TodayPage repository={repository} /></MemoryRouter>)

    const alert = await screen.findByRole('alert')
    expect(alert).toHaveTextContent('暂时无法显示此内容')
    expect(alert).toHaveTextContent('LOCAL_FIXTURE_UNAVAILABLE')
    expect(alert).not.toHaveTextContent('private details')
    expect(screen.queryByRole('button', { name: /重试/ })).not.toBeInTheDocument()
  })
})

describe('Report library page', () => {
  afterEach(cleanup)

  it('shows the real seven-report total, repository order, and date groups', async () => {
    render(<MemoryRouter><ReportLibraryPage repository={new FixtureReportRepository()} /></MemoryRouter>)

    expect(await screen.findByText('共 7 份')).toBeInTheDocument()
    const groups = screen.getAllByRole('heading', { level: 2 })
    expect(groups.map(({ textContent }) => textContent)).toEqual([
      '2099-06-18',
      '2099-06-10',
      '2099-05-31',
    ])
    const reportLinks = screen.getAllByRole('link', { name: /查看报告/ })
    expect(reportLinks[0]).toHaveAccessibleName(/休市信息摘要/)
    expect(reportLinks[0]).toHaveAttribute('href', '/reports/demo-holiday-2099-06-18')
  })

  it('combines controlled search, multi-type, date, industry, and theme filters and really clears them', async () => {
    const user = userEvent.setup()
    render(<MemoryRouter><ReportLibraryPage repository={new FixtureReportRepository()} /></MemoryRouter>)
    await screen.findByText('共 7 份')

    await user.type(screen.getByLabelText('搜索报告'), '观察')
    await user.click(screen.getByRole('checkbox', { name: '每日复盘' }))
    await user.click(screen.getByRole('checkbox', { name: '行业跟踪' }))
    fireEvent.change(screen.getByLabelText('开始日期'), { target: { value: FIXED_DATE } })
    fireEvent.change(screen.getByLabelText('结束日期'), { target: { value: FIXED_DATE } })
    await user.selectOptions(screen.getByLabelText('行业'), ['industry-orbit-materials', 'industry-deepwave-computing'])
    await user.selectOptions(screen.getByLabelText('主题'), ['theme-beta'])

    await waitFor(() => expect(screen.getByText('共 1 份')).toBeInTheDocument())
    expect(screen.getByRole('link', { name: /知行虚构重点行业观察/ })).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: '清除筛选' }))
    await waitFor(() => expect(screen.getByText('共 7 份')).toBeInTheDocument())
    expect(screen.getByLabelText('搜索报告')).toHaveValue('')
    expect(screen.getByRole('checkbox', { name: '每日复盘' })).not.toBeChecked()
    expect(screen.getByLabelText('开始日期')).toHaveValue('')
    expect(screen.getByLabelText('结束日期')).toHaveValue('')
    expect(screen.getByLabelText('行业')).toHaveValue([])
    expect(screen.getByLabelText('主题')).toHaveValue([])
  })

  it('distinguishes filtered no-results from an empty archive and offers a working clear action only for filters', async () => {
    const user = userEvent.setup()
    const repository = new FixtureReportRepository()
    const { rerender } = render(<MemoryRouter><ReportLibraryPage repository={repository} /></MemoryRouter>)
    await screen.findByText('共 7 份')

    await user.type(screen.getByLabelText('搜索报告'), '不存在的虚构主题')
    expect(await screen.findByText('当前筛选条件下没有报告')).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: '清除筛选' }))
    expect(await screen.findByText('共 7 份')).toBeInTheDocument()

    const emptyRepository = new FixtureReportRepository()
    vi.spyOn(emptyRepository, 'listReports').mockResolvedValue([])
    rerender(<MemoryRouter><ReportLibraryPage repository={emptyRepository} /></MemoryRouter>)
    expect(await screen.findByText('暂时没有可显示的报告')).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: '清除筛选' })).toBeInTheDocument()
    expect(screen.queryAllByRole('button', { name: '清除筛选' })).toHaveLength(1)
  })

  it('ignores an older slow response and preserves loaded content as stale after a later failure', async () => {
    const first = deferred<ReportSummary[]>()
    const older = deferred<ReportSummary[]>()
    const newer = deferred<ReportSummary[]>()
    const repository = new FixtureReportRepository()
    const listReports = vi.spyOn(repository, 'listReports')
      .mockReturnValueOnce(first.promise)
      .mockReturnValueOnce(older.promise)
      .mockReturnValueOnce(newer.promise)
      .mockRejectedValueOnce(new Error('secret failure details'))
    render(<MemoryRouter><ReportLibraryPage repository={repository} /></MemoryRouter>)
    first.resolve([reportFixtures[0]])
    expect(await screen.findByRole('link', { name: /早盘扫描/ })).toBeInTheDocument()

    fireEvent.change(screen.getByLabelText('搜索报告'), { target: { value: '旧' } })
    fireEvent.change(screen.getByLabelText('搜索报告'), { target: { value: '新' } })
    newer.resolve([reportFixtures[2]])
    expect(await screen.findByRole('link', { name: /收盘复盘/ })).toBeInTheDocument()
    older.resolve([reportFixtures[1]])
    await waitFor(() => expect(screen.queryByRole('link', { name: /午间复盘/ })).not.toBeInTheDocument())

    fireEvent.change(screen.getByLabelText('搜索报告'), { target: { value: '失败' } })
    expect(await screen.findByRole('status', { name: '内容可能已过期' })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /收盘复盘/ })).toBeInTheDocument()
    expect(screen.queryByText('secret failure details')).not.toBeInTheDocument()
    expect(listReports).toHaveBeenLastCalledWith(expect.objectContaining({ query: '失败' }))
  })
})

describe('Report detail page and routes', () => {
  afterEach(cleanup)

  it('shows the known report contract, safe body, disabled PDF reason, versions, and immersive shell', async () => {
    window.location.hash = '#/reports/demo-daily-2099-06-18'
    render(<App />)

    const main = await screen.findByRole('main', { name: '报告详情' })
    expect(within(main).getAllByText('每日复盘')).toHaveLength(2)
    expect(within(main).getByRole('heading', { name: '知行虚构收盘复盘｜2099-06-18' })).toBeInTheDocument()
    expect(within(main).getByText('报告日期：2099-06-18')).toBeInTheDocument()
    expect(within(main).getByText('当前版本：v1.1')).toBeInTheDocument()
    expect(within(main).getByText('数据截至：2099-06-18 15:00')).toBeInTheDocument()
    expect(within(main).getByText('生成时间：2099-06-18 17:30')).toBeInTheDocument()
    expect(within(main).getByText('固定样例更新版本。')).toBeInTheDocument()
    expect(within(main).getByText('仅供离线界面验证，不构成任何投资建议。')).toBeInTheDocument()
    expect(within(main).getByText('v1.0')).toBeInTheDocument()
    expect(within(main).getByRole('button', { name: '下载 PDF' })).toBeDisabled()
    expect(within(main).getByText('离线样例未提供 PDF 文件')).toBeInTheDocument()
    expect(screen.queryByRole('heading', { name: '知行' })).not.toBeInTheDocument()
    expect(screen.queryByRole('navigation', { name: '主导航' })).not.toBeInTheDocument()
  })

  it.each([
    [undefined, '/reports'],
    [{ returnTo: '/malicious' }, '/reports'],
    [{ returnTo: '/today' }, '/today'],
    [{ returnTo: '/reports' }, '/reports'],
  ] as const)('uses a controlled deterministic back target for state %j', async (state, expectedPath) => {
    const user = userEvent.setup()
    render(
      <MemoryRouter initialEntries={[{ pathname: '/reports/demo-morning-2099-06-18', state }]}>
        <Routes>
          <Route path="/reports/:reportId" element={<ReportDetailPage repository={new FixtureReportRepository()} />} />
          <Route path="/reports" element={<p>报告库落点</p>} />
          <Route path="/today" element={<p>今日落点</p>} />
        </Routes>
      </MemoryRouter>,
    )
    await user.click(await screen.findByRole('button', { name: '返回' }))

    expect(screen.getByText(expectedPath === '/today' ? '今日落点' : '报告库落点')).toBeInTheDocument()
  })

  it('treats an unknown id as unavailable content rather than a network failure', async () => {
    render(
      <MemoryRouter initialEntries={['/reports/missing-report']}>
        <Routes><Route path="/reports/:reportId" element={<ReportDetailPage repository={new FixtureReportRepository()} />} /></Routes>
      </MemoryRouter>,
    )

    expect(await screen.findByText('报告不存在或已不可用')).toBeInTheDocument()
    expect(screen.queryByText(/网络|重试/)).not.toBeInTheDocument()
  })
})
