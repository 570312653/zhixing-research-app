import './shared.css'
import { formatTimestamp, sanitizeErrorCode } from './shared'

export function InlineFailureNotice({ errorCode, occurredAt, context, recoveryAction, recoveryDisabled = true, recoveryDisabledReason }: { errorCode: string; occurredAt: string; context: string; recoveryAction?: () => void; recoveryDisabled?: boolean; recoveryDisabledReason?: string }) {
  return <aside className="notice notice--alert" role="alert"><span aria-hidden="true">⚠</span><p>{context}</p><p>错误代码：{sanitizeErrorCode(errorCode)}</p><p>发生时间：{formatTimestamp(occurredAt)}</p>{recoveryAction && <button type="button" disabled={recoveryDisabled} onClick={recoveryAction} aria-label={`恢复${recoveryDisabled ? '（当前不可用）' : ''}`}>恢复</button>}{recoveryDisabled && recoveryDisabledReason && <p>{recoveryDisabledReason}</p>}</aside>
}
