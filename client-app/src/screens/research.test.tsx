import { cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes } from 'react-router'
import { afterEach, describe, expect, it, vi } from 'vitest'

import App from '../App'
import { FixtureReportRepository } from '../repositories/FixtureReportRepository'
import { IndustryDetailPage } from './IndustryDetailPage'
import { IndustryListPage } from './IndustryListPage'
import { ResearchOverviewPage } from './ResearchOverviewPage'
import { WatchlistDetailPage } from './WatchlistDetailPage'
import { WatchlistPage } from './WatchlistPage'

function renderRoute(path: string) {
  window.location.hash = `#${path}`
  return render(<App />)
}

function deferred<T>() {
  let resolve!: (value: T) => void
  let reject!: (reason?: unknown) => void
  const promise = new Promise<T>((resolvePromise, rejectPromise) => {
    resolve = resolvePromise
    reject = rejectPromise
  })
  return { promise, reject, resolve }
}

describe('research pages', () => {
  afterEach(() => {
    cleanup()
    vi.restoreAllMocks()
    window.location.hash = ''
  })

  it('shows repository-backed overview changes and the three deterministic research entrances', async () => {
    renderRoute('/research')

    const main = await screen.findByRole('main', { name: '研究' })
    expect(within(main).getByRole('heading', { name: '今日研究变化' })).toBeInTheDocument()
    expect(within(main).getByText('行业升温 1')).toBeInTheDocument()
    expect(within(main).getByText('行业降温 1')).toBeInTheDocument()
    expect(within(main).getByText('标的池变化 3')).toBeInTheDocument()
    expect(within(main).getByText('轨道材料')).toBeInTheDocument()
    expect(within(main).getByText('演示标的丁')).toBeInTheDocument()
    expect(within(main).getByRole('link', { name: '总览' })).toHaveAttribute('href', '#/research')
    expect(within(main).getByRole('link', { name: '行业' })).toHaveAttribute('href', '#/research/industries')
    expect(within(main).getByRole('link', { name: '标的池' })).toHaveAttribute('href', '#/research/watchlist')
    expect(within(main).getByRole('link', { name: /知行虚构重点行业观察/ })).toHaveAttribute(
      'href',
      '#/reports/demo-industry-tracking-2099-06-18',
    )
  })

  it('filters the industry list by trend and search, then opens the matching detail', async () => {
    const user = userEvent.setup()
    renderRoute('/research/industries')

    expect(await screen.findByText('共 4 个重点关注行业')).toBeInTheDocument()
    const orderedIndustries = screen.getAllByRole('link', { name: /查看行业：/ })
    expect(orderedIndustries.slice(0, 2).map((link) => link.textContent)).toEqual([
      expect.stringContaining('清环能源'),
      expect.stringContaining('轨道材料'),
    ])
    expect(screen.getAllByText('最新专题报告')).toHaveLength(4)
    expect(screen.getByRole('group', { name: '行业趋势筛选' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: '全部' })).toHaveAttribute('aria-pressed', 'true')
    expect(screen.getByRole('link', { name: /查看行业：轨道材料/ })).toHaveTextContent('知行虚构重点行业观察｜2099-06-18')
    expect(screen.getByRole('link', { name: /查看行业：轨道材料/ })).toHaveTextContent('关联专题报告 1 篇')
    expect(screen.getByRole('link', { name: /查看行业：轨道材料/ })).toHaveTextContent('状态更新于 2099-06-18 20:10')
    await user.click(screen.getByRole('button', { name: '证据不足' }))
    expect(screen.getByRole('link', { name: /前沿物流/ })).toBeInTheDocument()
    expect(screen.queryByRole('link', { name: /轨道材料/ })).not.toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: '清除筛选' }))
    expect(screen.getByRole('link', { name: /轨道材料/ })).toBeInTheDocument()

    await user.type(screen.getByRole('searchbox', { name: '搜索关注行业' }), '深波')
    const industryLink = screen.getByRole('link', { name: /深波计算/ })
    expect(industryLink).toHaveAttribute('href', '#/research/industries/industry-deepwave-computing')
    await user.click(industryLink)
    expect(await screen.findByRole('heading', { name: '深波计算' })).toBeInTheDocument()
  })

  it('renders industry trend, counter evidence, insufficient semantics, history, related reports and watchlist links', async () => {
    const user = userEvent.setup()
    renderRoute('/research/industries/industry-cleanloop-energy')

    expect(await screen.findByRole('heading', { name: '清环能源' })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: '降温' })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: '反向证据' })).toBeInTheDocument()
    expect(screen.getByText('虚构供需观察值回落')).toBeInTheDocument()
    expect(screen.getByRole('region', { name: '趋势历史' })).toHaveTextContent('固定样例进入降温')
    expect(screen.getByRole('link', { name: '查看标的：演示标的丁' })).toHaveAttribute(
      'href',
      '#/research/watchlist/DEMO-D04',
    )
    expect(screen.getByRole('link', { name: '查看标的：演示标的丁' })).toHaveTextContent('新增关注')
    expect(screen.getByRole('link', { name: '查看标的：演示标的丁' })).toHaveTextContent('更新于 2099-06-18 20:00')
    expect(screen.getByRole('link', { name: '查看标的：演示标的丁' })).toHaveTextContent('风险：仅为虚构研究观察项。')
    const changeSection = screen.getByRole('heading', { name: '近期标的变更' }).parentElement
    expect(changeSection).not.toBeNull()
    expect(within(changeSection!).getByText('新增关注')).toBeInTheDocument()
    expect(within(changeSection!).getByText('2099-06-18 20:00')).toBeInTheDocument()

    const reportLink = screen.getByRole('link', { name: /知行虚构清环能源专题研究/ })
    await user.click(reportLink)
    await user.click(await screen.findByRole('button', { name: '返回' }))
    expect(await screen.findByRole('heading', { name: '清环能源' })).toBeInTheDocument()

    window.location.hash = '#/research/industries/industry-frontier-logistics'
    expect(await screen.findByText('本期证据不足，不形成趋势结论')).toBeInTheDocument()
    expect(screen.queryByText('升温', { exact: true })).not.toBeInTheDocument()
  })

  it('keeps the industry detail report section limited to industry reports', async () => {
    renderRoute('/research/industries/industry-orbit-materials')

    expect(await screen.findByRole('heading', { name: '轨道材料' })).toBeInTheDocument()
    const reportSection = screen.getByRole('heading', { name: '专项行业报告' }).parentElement
    expect(reportSection).not.toBeNull()
    expect(within(reportSection!).getAllByRole('link', { name: /查看报告：/ })).toHaveLength(1)
    expect(within(reportSection!).getByRole('link', { name: /知行虚构重点行业观察/ })).toBeInTheDocument()
    expect(within(reportSection!).queryByRole('link', { name: /早盘扫描|收盘复盘/ })).not.toBeInTheDocument()
  })

  it('shows five recent industry changes by default and can expand the complete repository history', async () => {
    const user = userEvent.setup()
    const repository = new FixtureReportRepository()
    const overview = await repository.getWatchlistOverview()
    vi.spyOn(repository, 'getWatchlistOverview').mockResolvedValue({
      ...overview,
      changes: Array.from({ length: 6 }, (_, index) => ({
        symbol: `DEMO-X0${index}`,
        displayName: `变更标的${index + 1}`,
        industryIds: ['industry-orbit-materials'],
        type: 'added' as const,
        occurredAt: `2099-06-${String(18 - index).padStart(2, '0')}T20:00:00+08:00`,
        reason: `固定样例变更${index + 1}`,
      })).toReversed(),
    })
    render(<MemoryRouter initialEntries={['/research/industries/industry-orbit-materials']}><Routes><Route path="/research/industries/:industryId" element={<IndustryDetailPage repository={repository} />} /></Routes></MemoryRouter>)

    const section = (await screen.findByRole('heading', { name: '近期标的变更' })).parentElement
    expect(section).not.toBeNull()
    expect(within(section!).getAllByRole('listitem')).toHaveLength(5)
    expect(within(section!).getAllByRole('listitem')[0]).toHaveTextContent('变更标的1')
    await user.click(within(section!).getByRole('button', { name: '展开全部变更' }))
    expect(within(section!).getAllByRole('listitem')).toHaveLength(6)
  })

  it('can expand all related industry reports after the latest three', async () => {
    const user = userEvent.setup()
    const repository = new FixtureReportRepository()
    const industry = await repository.getIndustry('industry-orbit-materials')
    const baseReport = (await repository.listReports({ reportTypes: ['industry_tracking'] }))[0]
    expect(industry).not.toBeNull()
    const reports = Array.from({ length: 4 }, (_, index) => ({ ...baseReport, id: `demo-extra-industry-${index}`, title: `扩展行业报告 ${index + 1}` }))
    vi.spyOn(repository, 'getIndustry').mockResolvedValue({ ...industry!, reportIds: reports.map(({ id }) => id) })
    vi.spyOn(repository, 'listReports').mockResolvedValue(reports)
    render(<MemoryRouter initialEntries={['/research/industries/industry-orbit-materials']}><Routes><Route path="/research/industries/:industryId" element={<IndustryDetailPage repository={repository} />} /></Routes></MemoryRouter>)

    const section = (await screen.findByRole('heading', { name: '专项行业报告' })).parentElement
    expect(section).not.toBeNull()
    expect(within(section!).getAllByRole('link', { name: /查看报告：/ })).toHaveLength(3)
    await user.click(within(section!).getByRole('button', { name: '查看全部专项报告' }))
    expect(within(section!).getAllByRole('link', { name: /查看报告：/ })).toHaveLength(4)
  })

  it('shows the complete snapshot projection and supports current/change, search, industry and status filters', async () => {
    const user = userEvent.setup()
    renderRoute('/research/watchlist')

    expect(await screen.findByText('快照时间：2099-06-18 20:00')).toBeInTheDocument()
    expect(screen.getByText('当前关注 3')).toBeInTheDocument()
    expect(screen.getByText('本期新增 1')).toBeInTheDocument()
    expect(screen.getByText('原因更新 1')).toBeInTheDocument()
    expect(screen.getByText('近期移出 1')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /演示标的甲/ })).toBeInTheDocument()
    expect(screen.queryByRole('link', { name: /演示标的丙/ })).not.toBeInTheDocument()
    const orderedItems = screen.getAllByRole('link', { name: /查看标的：/ })
    expect(orderedItems.slice(0, 3).map((link) => link.textContent)).toEqual([
      expect.stringContaining('演示标的丁'),
      expect.stringContaining('演示标的乙'),
      expect.stringContaining('演示标的甲'),
    ])
    expect(screen.getAllByText('主要风险：')).toHaveLength(3)
    const refreshButton = screen.getByRole('button', { name: '刷新' })
    expect(refreshButton).toBeDisabled()
    expect(refreshButton).toHaveAttribute('aria-describedby')
    const refreshReason = document.getElementById(refreshButton.getAttribute('aria-describedby')!)
    expect(refreshReason).not.toBeNull()
    expect(screen.getByText('离线固定样例未接入刷新。')).toBeInTheDocument()
    expect(screen.getByRole('navigation', { name: '研究分段导航' })).toBeInTheDocument()
    expect(screen.getByRole('group', { name: '标的池内容分段' })).toBeInTheDocument()
    expect(screen.queryByRole('tablist')).not.toBeInTheDocument()
    expect(screen.queryByRole('tab')).not.toBeInTheDocument()
    expect(screen.getByRole('button', { name: '当前关注' })).toHaveAttribute('aria-pressed', 'true')
    expect(screen.getByRole('button', { name: '变更记录' })).toHaveAttribute('aria-pressed', 'false')
    expect(screen.getByRole('group', { name: '标的池筛选' })).toBeInTheDocument()

    const currentCard = screen.getByText('虚构计算线索获得新增验证。').closest('a')
    expect(currentCard).toHaveAttribute('href', '#/research/watchlist/DEMO-B02')
    expect(screen.getByRole('link', { name: '深波计算' })).toHaveAttribute('href', '#/research/industries/industry-deepwave-computing')

    await user.type(screen.getByRole('searchbox', { name: '搜索证券代码或名称' }), 'DEMO-B02')
    expect(screen.getByRole('link', { name: /演示标的乙/ })).toBeInTheDocument()
    expect(screen.queryByRole('link', { name: /演示标的甲/ })).not.toBeInTheDocument()

    fireEvent.change(screen.getByRole('searchbox', { name: '搜索证券代码或名称' }), { target: { value: '' } })
    await user.selectOptions(screen.getByLabelText('行业筛选'), 'industry-cleanloop-energy')
    expect(screen.getByRole('link', { name: /演示标的丁/ })).toBeInTheDocument()
    expect(screen.queryByRole('link', { name: /演示标的甲/ })).not.toBeInTheDocument()

    await user.selectOptions(screen.getByLabelText('行业筛选'), '')
    await user.selectOptions(screen.getByLabelText('状态筛选'), 'added')
    expect(screen.getByRole('link', { name: /演示标的丁/ })).toBeInTheDocument()
    expect(screen.queryByRole('link', { name: /演示标的甲/ })).not.toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: '变更记录' }))
    expect(screen.getByRole('button', { name: '变更记录' })).toHaveAttribute('aria-pressed', 'true')
    expect(screen.getByText('新增关注：演示标的丁')).toBeInTheDocument()
    expect(screen.getByText('原因更新：演示标的乙')).toBeInTheDocument()
    const removed = screen.getByRole('link', { name: /已移出：演示标的丙/ })
    expect(removed).toHaveAttribute('href', '#/research/watchlist/DEMO-C03')
  })

  it('lets the disabled refresh explanation use the available inline width', async () => {
    renderRoute('/research/watchlist')

    const refreshButton = await screen.findByRole('button', { name: '刷新' })
    const refreshReason = document.getElementById(refreshButton.getAttribute('aria-describedby')!)
    expect(refreshReason).not.toBeNull()
    expect(getComputedStyle(refreshReason!).maxWidth).toBe('none')
  })

  it('keeps removed detail queryable with removal reason, evidence, risk, timeline and bidirectional links', async () => {
    const user = userEvent.setup()
    renderRoute('/research/watchlist/DEMO-C03')

    expect(await screen.findByRole('heading', { name: '演示标的丙' })).toBeInTheDocument()
    expect(screen.getByText('已移出', { selector: '.research-identity > strong' })).toBeInTheDocument()
    expect(screen.getByText('快照 demo-watchlist-current · 更新于 2099-06-18 20:00')).toBeInTheDocument()
    expect(screen.getByRole('region', { name: '本期变化' })).toHaveTextContent('已移出')
    expect(screen.getByRole('heading', { name: '移出原因' })).toBeInTheDocument()
    const removalSection = screen.getByRole('heading', { name: '移出原因' }).parentElement
    expect(removalSection).not.toBeNull()
    expect(within(removalSection!).getByText('虚构物流证据不足，移出当前观察。')).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: '主要风险' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: '刷新' })).toBeDisabled()
    expect(screen.getByRole('button', { name: '刷新' })).toHaveAttribute('aria-describedby')
    expect(screen.getByText('离线固定样例未接入刷新。')).toBeInTheDocument()
    expect(screen.getByRole('region', { name: '观察历史' })).toHaveTextContent('虚构物流证据待补充')
    expect(screen.getByRole('link', { name: '查看行业：前沿物流' })).toHaveAttribute(
      'href',
      '#/research/industries/industry-frontier-logistics',
    )
    const reportLink = screen.getByRole('link', { name: /知行虚构重点行业观察/ })
    await user.click(reportLink)
    await user.click(await screen.findByRole('button', { name: '返回' }))
    expect(await screen.findByRole('heading', { name: '演示标的丙' })).toBeInTheDocument()

    const pageText = screen.getByRole('main', { name: '研究' }).textContent ?? ''
    expect(pageText).not.toMatch(/目标价|止损|买入|卖出|仓位|收益承诺/)
  })

  it('shows the current snapshot and reason-changed status on a current watchlist detail', async () => {
    renderRoute('/research/watchlist/DEMO-B02')

    expect(await screen.findByRole('heading', { name: '演示标的乙' })).toBeInTheDocument()
    expect(screen.getByText('快照 demo-watchlist-current · 更新于 2099-06-18 20:00')).toBeInTheDocument()
    expect(screen.getByText('原因更新', { selector: '.research-identity > strong' })).toBeInTheDocument()
    expect(screen.getByRole('region', { name: '本期变化' })).toHaveTextContent('原因更新')
  })

  it('can expand all related watchlist reports after the latest three', async () => {
    const user = userEvent.setup()
    const repository = new FixtureReportRepository()
    const item = await repository.getWatchlistItem('DEMO-B02')
    const baseReport = (await repository.listReports())[0]
    expect(item).not.toBeNull()
    const reports = Array.from({ length: 4 }, (_, index) => ({ ...baseReport, id: `demo-extra-watchlist-${index}`, title: `扩展标的报告 ${index + 1}` }))
    vi.spyOn(repository, 'getWatchlistItem').mockResolvedValue({ ...item!, reportIds: reports.map(({ id }) => id) })
    vi.spyOn(repository, 'listReports').mockResolvedValue(reports)
    render(<MemoryRouter initialEntries={['/research/watchlist/DEMO-B02']}><Routes><Route path="/research/watchlist/:symbol" element={<WatchlistDetailPage repository={repository} />} /></Routes></MemoryRouter>)

    const section = (await screen.findByRole('heading', { name: '关联报告' })).parentElement
    expect(section).not.toBeNull()
    expect(within(section!).getAllByRole('link', { name: /查看报告：/ })).toHaveLength(3)
    await user.click(within(section!).getByRole('button', { name: '查看全部关联报告' }))
    expect(within(section!).getAllByRole('link', { name: /查看报告：/ })).toHaveLength(4)
  })

  it('blocks an initial detail failure with a sanitized local code and no fake retry', async () => {
    const repository = new FixtureReportRepository()
    vi.spyOn(repository, 'getIndustry').mockRejectedValue(new Error('private adapter details'))
    render(
      <MemoryRouter initialEntries={['/research/industries/industry-orbit-materials']}>
        <Routes><Route path="/research/industries/:industryId" element={<IndustryDetailPage repository={repository} />} /></Routes>
      </MemoryRouter>,
    )

    const alert = await screen.findByRole('alert')
    expect(screen.getByRole('heading', { name: '行业详情' })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: '返回行业列表' })).toHaveAttribute('href', '/research/industries')
    expect(alert).toHaveTextContent('LOCAL_FIXTURE_UNAVAILABLE')
    expect(alert).not.toHaveTextContent('private adapter details')
    expect(screen.queryByRole('button', { name: /重试/ })).not.toBeInTheDocument()
  })

  it('keeps same-industry content as stale when repository revalidation fails', async () => {
    const repositoryA = new FixtureReportRepository()
    const repositoryB = new FixtureReportRepository()
    vi.spyOn(repositoryB, 'getIndustry').mockRejectedValue(new Error('private refresh details'))
    const renderDetail = (repository: FixtureReportRepository) => <MemoryRouter initialEntries={['/research/industries/industry-orbit-materials']}><Routes><Route path="/research/industries/:industryId" element={<IndustryDetailPage repository={repository} />} /></Routes></MemoryRouter>
    const { rerender } = render(renderDetail(repositoryA))
    expect(await screen.findByRole('heading', { name: '轨道材料' })).toBeInTheDocument()

    rerender(renderDetail(repositoryB))

    const notice = await screen.findByRole('status', { name: '内容可能已过期' })
    expect(screen.getByRole('heading', { name: '轨道材料' })).toBeInTheDocument()
    expect(notice).toHaveTextContent('LOCAL_FIXTURE_UNAVAILABLE')
    expect(notice).toHaveTextContent('最后可用快照/数据时间')
    expect(notice).not.toHaveTextContent('最后成功同步')
    expect(notice).not.toHaveTextContent('private refresh details')
  })

  it('marks an industry list stale when same-resource revalidation fails', async () => {
    const repositoryA = new FixtureReportRepository()
    const repositoryB = new FixtureReportRepository()
    vi.spyOn(repositoryB, 'listIndustries').mockRejectedValue(new Error('private refresh details'))
    const renderList = (repository: FixtureReportRepository) => <MemoryRouter><IndustryListPage repository={repository} /></MemoryRouter>
    const { rerender } = render(renderList(repositoryA))
    expect(await screen.findByText('共 4 个重点关注行业')).toBeInTheDocument()

    rerender(renderList(repositoryB))

    const notice = await screen.findByRole('status', { name: '内容可能已过期' })
    expect(screen.getByText('共 4 个重点关注行业')).toBeInTheDocument()
    expect(notice).toHaveTextContent('LOCAL_FIXTURE_UNAVAILABLE')
    expect(notice).not.toHaveTextContent('private refresh details')
  })

  it('marks the watchlist stale when same-resource revalidation fails', async () => {
    const repositoryA = new FixtureReportRepository()
    const repositoryB = new FixtureReportRepository()
    vi.spyOn(repositoryB, 'getWatchlistOverview').mockRejectedValue(new Error('private refresh details'))
    const renderWatchlist = (repository: FixtureReportRepository) => <MemoryRouter><WatchlistPage repository={repository} /></MemoryRouter>
    const { rerender } = render(renderWatchlist(repositoryA))
    expect(await screen.findByText('当前关注 3')).toBeInTheDocument()

    rerender(renderWatchlist(repositoryB))

    const notice = await screen.findByRole('status', { name: '内容可能已过期' })
    expect(screen.getByText('当前关注 3')).toBeInTheDocument()
    expect(notice).toHaveTextContent('LOCAL_FIXTURE_UNAVAILABLE')
    expect(notice).not.toHaveTextContent('private refresh details')
  })

  it('keeps the latest route when an older detail request resolves late', async () => {
    const pendingA = deferred<Awaited<ReturnType<import('../repositories/ReportRepository').ReportRepository['getIndustry']>>>()
    const pendingB = deferred<Awaited<ReturnType<import('../repositories/ReportRepository').ReportRepository['getIndustry']>>>()
    const actual = new FixtureReportRepository()
    const getIndustry = FixtureReportRepository.prototype.getIndustry
    vi.spyOn(FixtureReportRepository.prototype, 'getIndustry').mockImplementation((industryId) => {
      if (industryId === 'industry-orbit-materials') return pendingA.promise
      if (industryId === 'industry-cleanloop-energy') return pendingB.promise
      return getIndustry.call(actual, industryId)
    })
    renderRoute('/research/industries/industry-orbit-materials')

    window.location.hash = '#/research/industries/industry-cleanloop-energy'
    pendingB.resolve(await getIndustry.call(actual, 'industry-cleanloop-energy'))
    expect(await screen.findByRole('heading', { name: '清环能源' })).toBeInTheDocument()
    pendingA.resolve(await getIndustry.call(actual, 'industry-orbit-materials'))
    await waitFor(() => expect(screen.queryByRole('heading', { name: '轨道材料' })).not.toBeInTheDocument())
  })

  it('preserves deterministic detail titles and return links while loading or missing', async () => {
    const industryRepository = new FixtureReportRepository()
    const pendingIndustry = deferred<never>()
    vi.spyOn(industryRepository, 'getIndustry').mockReturnValue(pendingIndustry.promise)
    const industryView = render(<MemoryRouter initialEntries={['/research/industries/industry-missing']}><Routes><Route path="/research/industries/:industryId" element={<IndustryDetailPage repository={industryRepository} />} /></Routes></MemoryRouter>)
    expect(screen.getByRole('heading', { name: '行业详情' })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: '返回行业列表' })).toHaveAttribute('href', '/research/industries')
    industryView.unmount()

    const watchlistRepository = new FixtureReportRepository()
    vi.spyOn(watchlistRepository, 'getWatchlistItem').mockResolvedValue(null)
    render(<MemoryRouter initialEntries={['/research/watchlist/DEMO-MISSING']}><Routes><Route path="/research/watchlist/:symbol" element={<WatchlistDetailPage repository={watchlistRepository} />} /></Routes></MemoryRouter>)
    expect(await screen.findByRole('heading', { name: '标的详情' })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: '返回标的池' })).toHaveAttribute('href', '/research/watchlist')
    expect(screen.getByText('标的不存在或已不可用')).toBeInTheDocument()
  })

  it('preserves the other detail title and return paths on failure or missing', async () => {
    const watchlistRepository = new FixtureReportRepository()
    vi.spyOn(watchlistRepository, 'getWatchlistItem').mockRejectedValue(new Error('private watchlist details'))
    const watchlistView = render(<MemoryRouter initialEntries={['/research/watchlist/DEMO-A01']}><Routes><Route path="/research/watchlist/:symbol" element={<WatchlistDetailPage repository={watchlistRepository} />} /></Routes></MemoryRouter>)
    expect(await screen.findByRole('alert')).toHaveTextContent('LOCAL_FIXTURE_UNAVAILABLE')
    expect(screen.getByRole('heading', { name: '标的详情' })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: '返回标的池' })).toHaveAttribute('href', '/research/watchlist')
    watchlistView.unmount()

    const industryRepository = new FixtureReportRepository()
    vi.spyOn(industryRepository, 'getIndustry').mockResolvedValue(null)
    render(<MemoryRouter initialEntries={['/research/industries/industry-missing']}><Routes><Route path="/research/industries/:industryId" element={<IndustryDetailPage repository={industryRepository} />} /></Routes></MemoryRouter>)
    expect(await screen.findByText('行业不存在或已不可用')).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: '行业详情' })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: '返回行业列表' })).toHaveAttribute('href', '/research/industries')
  })

  it('limits industry history to the latest 30 days from its repository timestamp and expands older events', async () => {
    const user = userEvent.setup()
    const repository = new FixtureReportRepository()
    const industry = await repository.getIndustry('industry-orbit-materials')
    vi.spyOn(repository, 'getIndustry').mockResolvedValue({
      ...industry!,
      timeline: [
        ...industry!.timeline,
        { id: 'older-than-window', occurredAt: '2099-05-01T20:00:00+08:00', trendState: 'continuing', note: '超过30天的固定历史' },
      ],
    })
    render(<MemoryRouter initialEntries={['/research/industries/industry-orbit-materials']}><Routes><Route path="/research/industries/:industryId" element={<IndustryDetailPage repository={repository} />} /></Routes></MemoryRouter>)

    const history = await screen.findByRole('region', { name: '趋势历史' })
    expect(within(history).queryByText('超过30天的固定历史')).not.toBeInTheDocument()
    await user.click(within(history).getByRole('button', { name: '展开全部历史' }))
    expect(within(history).getByText('超过30天的固定历史')).toBeInTheDocument()
  })

  it('limits watchlist observation history to five records and expands all records', async () => {
    const user = userEvent.setup()
    const repository = new FixtureReportRepository()
    const item = await repository.getWatchlistItem('DEMO-A01')
    vi.spyOn(repository, 'getWatchlistItem').mockResolvedValue({
      ...item!,
      events: Array.from({ length: 6 }, (_, index) => ({ id: `event-${index}`, type: 'continued' as const, occurredAt: `2099-06-${String(18 - index).padStart(2, '0')}T20:00:00+08:00`, reason: `观察历史${index + 1}` })),
    })
    render(<MemoryRouter initialEntries={['/research/watchlist/DEMO-A01']}><Routes><Route path="/research/watchlist/:symbol" element={<WatchlistDetailPage repository={repository} />} /></Routes></MemoryRouter>)

    const history = await screen.findByRole('region', { name: '观察历史' })
    expect(within(history).getAllByRole('listitem')).toHaveLength(5)
    await user.click(within(history).getByRole('button', { name: '展开全部观察历史' }))
    expect(within(history).getAllByRole('listitem')).toHaveLength(6)
  })

  it('uses contextual empty states when repository collections are empty', async () => {
    const industryRepository = new FixtureReportRepository()
    vi.spyOn(industryRepository, 'listIndustries').mockResolvedValue([])
    const industryView = render(<MemoryRouter><IndustryListPage repository={industryRepository} /></MemoryRouter>)
    expect((await screen.findByText('暂无关注行业')).closest('[role="status"]')).not.toBeNull()
    industryView.unmount()

    const watchlistRepository = new FixtureReportRepository()
    const overview = await watchlistRepository.getWatchlistOverview()
    vi.spyOn(watchlistRepository, 'getWatchlistOverview').mockResolvedValue({ ...overview, currentItems: [], changes: [], delta: { added: [], continuing: [], removed: [], reasonChanged: [] } })
    render(<MemoryRouter><WatchlistPage repository={watchlistRepository} /></MemoryRouter>)
    expect((await screen.findByText('暂无关注标的')).closest('[role="status"]')).not.toBeNull()
  })

  it('keeps the formal research grids at 390px-safe column counts', async () => {
    const overviewView = render(<MemoryRouter><ResearchOverviewPage /></MemoryRouter>)
    const overviewMetrics = await screen.findByRole('group', { name: '研究变化指标' })
    expect(getComputedStyle(overviewMetrics).gridTemplateColumns).toContain('repeat(3')
    expect(getComputedStyle(screen.getByRole('list', { name: '标的池变化' })).gridTemplateColumns).toContain('repeat(2')
    overviewView.unmount()

    render(<MemoryRouter><WatchlistPage /></MemoryRouter>)
    const watchlistMetrics = await screen.findByRole('group', { name: '标的池指标' })
    expect(getComputedStyle(watchlistMetrics).gridTemplateColumns).toContain('repeat(4')
    expect(getComputedStyle(screen.getByText('当前关注 3').closest('.research-page')!).maxWidth).toBe('100%')
    cleanup()

    render(<MemoryRouter initialEntries={['/research/industries/industry-cleanloop-energy']}><Routes><Route path="/research/industries/:industryId" element={<IndustryDetailPage />} /></Routes></MemoryRouter>)
    const evidenceGrid = (await screen.findByText('虚构供需观察值回落')).closest('.research-evidence-grid')
    expect(evidenceGrid).not.toBeNull()
    expect(getComputedStyle(evidenceGrid!).gridTemplateColumns).toContain('repeat(2')
    const reportStack = screen.getByRole('heading', { name: '专项行业报告' }).parentElement?.querySelector('.research-report-stack')
    expect(reportStack).not.toBeNull()
    expect(getComputedStyle(reportStack!).gridTemplateColumns).toBe('minmax(0,1fr)')
  })
})
