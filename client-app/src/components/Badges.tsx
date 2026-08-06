import './shared.css'
import type { ReadState } from '../domain/report'

export function VersionBadge({ version }: { version: string }) {
  return <span className="badge">版本 {version}</span>
}

export function ReadStateBadge({ readState }: { readState: ReadState }) {
  const text = readState.kind === 'read' ? '已读' : readState.kind === 'unread' ? '未读' : `阅读中 ${readState.percent}%`
  return <span className="badge">{text}</span>
}

export function FreshnessBadge({ freshness }: { freshness: 'current' | 'stale' }) {
  return <span className="badge">{freshness === 'current' ? '内容已同步' : '内容可能已过期'}</span>
}
