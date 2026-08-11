import './shared.css'
import type { IndustryTimelineEvent } from '../domain/research'
import { formatTimestamp } from './shared'

export function Timeline({ events, visibleCount, expandAction, expandDisabled = false, expandDisabledReason }: { events: readonly IndustryTimelineEvent[]; visibleCount?: number; expandAction?: () => void; expandDisabled?: boolean; expandDisabledReason?: string }) {
  const visibleEvents = visibleCount === undefined ? events : events.slice(0, visibleCount)
  return <section className="timeline" aria-label="历史记录"><ol>{visibleEvents.map((event) => <li key={event.id}><p>{formatTimestamp(event.occurredAt)}</p><p>{event.note}</p></li>)}</ol>{expandAction && <button type="button" disabled={expandDisabled} onClick={expandAction} aria-label={`展开历史${expandDisabled ? '（当前不可用）' : ''}`}>展开历史</button>}{expandDisabled && expandDisabledReason && <p>{expandDisabledReason}</p>}</section>
}
