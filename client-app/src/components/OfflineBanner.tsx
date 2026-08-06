import './shared.css'
import { formatTimestamp } from './shared'

export function OfflineBanner({ lastSyncedAt }: { lastSyncedAt: string }) {
  return <aside className="notice notice--info" role="status" aria-label="当前离线"><span aria-hidden="true">◌</span><p>当前离线</p><p>最后同步：{formatTimestamp(lastSyncedAt)}</p><p>在线操作当前不可用</p></aside>
}
