import { cleanup, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { ActionFeedback } from './ActionFeedback'
import { BlockingFailureState } from './BlockingFailureState'
import { ContextualEmptyState } from './ContextualEmptyState'
import { InlineFailureNotice } from './InlineFailureNotice'
import { OfflineBanner } from './OfflineBanner'
import { PageSkeleton } from './PageSkeleton'
import { SectionSkeleton } from './SectionSkeleton'
import { StaleContentNotice } from './StaleContentNotice'

describe('shared state components', () => {
  const syncedAt = '2099-06-18T20:30:00+08:00'

  afterEach(cleanup)

  it('renders skeletons as readable busy states without owning timers', () => {
    render(<><PageSkeleton label="今日报告" slow /><SectionSkeleton label="产业研究" slow variant="list" /></>)

    expect(screen.getByRole('status', { name: '今日报告正在加载，加载时间较长' })).toBeInTheDocument()
    expect(screen.getByRole('status', { name: '产业研究正在加载，加载时间较长' })).toBeInTheDocument()
  })

  it('explains contextual emptiness without offering a fabricated refresh', () => {
    render(<ContextualEmptyState reason="filter_no_results" />)

    expect(screen.getByRole('status')).toHaveTextContent('当前筛选条件下没有报告')
    expect(screen.queryByRole('button', { name: /刷新|生成/ })).not.toBeInTheDocument()
  })

  it('sanitizes blocking errors and omits retry when no handler is supplied', () => {
    render(<BlockingFailureState errorCode="Bearer secret-value" occurredAt={syncedAt} />)

    expect(screen.getByRole('alert')).toHaveTextContent('暂时无法显示此内容')
    expect(screen.queryByText('Bearer secret-value')).not.toBeInTheDocument()
    expect(screen.getByText('错误代码：UNAVAILABLE')).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /重试/ })).not.toBeInTheDocument()
  })

  it('only exposes disabled retry controls when a handler and reason are supplied', () => {
    render(<><BlockingFailureState errorCode="SYNC_UNAVAILABLE" retryAction={() => undefined} retryDisabled retryDisabledReason="离线样例不支持重试" /><StaleContentNotice errorCode="SYNC_UNAVAILABLE" lastSuccessfulSyncAt={syncedAt} retryAction={() => undefined} retryDisabled retryDisabledReason="离线样例不支持同步" /></>)

    expect(screen.getByRole('button', { name: '重试（当前不可用）' })).toBeDisabled()
    expect(screen.getByText('离线样例不支持重试')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: '重试同步（当前不可用）' })).toBeDisabled()
    expect(screen.getByText('离线样例不支持同步')).toBeInTheDocument()
  })

  it('keeps surrounding content available when an inline failure occurs', () => {
    render(<><p>已归档报告正文</p><InlineFailureNotice errorCode="SYNC_UNAVAILABLE" occurredAt={syncedAt} context="同步状态" /></>)

    expect(screen.getByText('已归档报告正文')).toBeInTheDocument()
    expect(screen.getByRole('alert')).toHaveTextContent('同步状态')
    expect(screen.getByText('错误代码：SYNC_UNAVAILABLE')).toBeInTheDocument()
  })

  it('uses readable offline and stale notices without pretending cached content is current', () => {
    render(<><OfflineBanner lastSyncedAt={syncedAt} /><StaleContentNotice errorCode="SYNC_UNAVAILABLE" lastSuccessfulSyncAt={syncedAt} /></>)

    expect(screen.getByRole('status', { name: '当前离线' })).toHaveTextContent('在线操作当前不可用')
    expect(screen.getByRole('status', { name: '内容可能已过期' })).toHaveTextContent('错误代码：SYNC_UNAVAILABLE')
    expect(screen.queryByRole('button', { name: /重试同步/ })).not.toBeInTheDocument()
  })

  it('prevents duplicate action feedback submission with a native disabled control and reason', async () => {
    const user = userEvent.setup()
    const onAction = vi.fn()
    render(<ActionFeedback state="submitting" message="正在保存。" actionLabel="再次保存" onAction={onAction} />)

    const action = screen.getByRole('button', { name: '再次保存（当前不可用）' })
    expect(action).toBeDisabled()
    expect(screen.getByText('操作进行中，请稍候。')).toBeInTheDocument()
    await user.click(action)
    expect(onAction).not.toHaveBeenCalled()
  })
})
