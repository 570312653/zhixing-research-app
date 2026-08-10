import '../shared.css'
import { formatTimestamp, sanitizeErrorCode } from '../shared'

export function StaleContentNotice({ errorCode, lastSuccessfulSyncAt, timestampLabel = '最后成功同步', retryAction, retryDisabled = true, retryDisabledReason }: { errorCode: string; lastSuccessfulSyncAt: string; timestampLabel?: string; retryAction?: () => void; retryDisabled?: boolean; retryDisabledReason?: string }) {
  const disabledReason = retryDisabled ? retryDisabledReason ?? '当前不可同步。' : undefined
  return <aside className="notice notice--watch" role="status" aria-label="内容可能已过期"><span aria-hidden="true">⚠</span><p>内容可能已过期</p><p>错误代码：{sanitizeErrorCode(errorCode)}</p><p>{timestampLabel}：{formatTimestamp(lastSuccessfulSyncAt)}</p>{retryAction && <><button type="button" disabled={retryDisabled} onClick={retryAction} aria-label={`重试同步${retryDisabled ? '（当前不可用）' : ''}`}>重试同步</button>{disabledReason && <p>{disabledReason}</p>}</>}</aside>
}
