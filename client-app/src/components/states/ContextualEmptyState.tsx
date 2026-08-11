import '../shared.css'
import type { EmptyReason } from './resolvePageState'

const messages: Record<EmptyReason, string> = {
  not_due: '报告尚未到发布时间',
  no_reports: '暂时没有可显示的报告',
  filter_no_results: '当前筛选条件下没有报告',
  no_history: '暂无历史记录',
  no_watchlist: '暂无关注标的',
  no_industries: '暂无关注行业',
  filter_no_industries: '当前筛选条件下没有行业',
  filter_no_watchlist: '当前筛选条件下没有标的',
}

export function ContextualEmptyState({ reason, action }: { reason: EmptyReason; action?: { label: string; onClick: () => void } }) {
  return <section className="state-card" role="status"><span aria-hidden="true">○</span><p>{messages[reason]}</p>{action && <button type="button" onClick={action.onClick}>{action.label}</button>}</section>
}
