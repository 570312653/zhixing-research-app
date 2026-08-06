import './shared.css'
import { formatTimestamp, sanitizeErrorCode } from './shared'

export function BlockingFailureState({ errorCode, occurredAt, retryAction, retryDisabled = true, retryDisabledReason, backAction }: { errorCode: string; occurredAt?: string; retryAction?: () => void; retryDisabled?: boolean; retryDisabledReason?: string; backAction?: { label: string; onClick: () => void; disabled?: boolean; disabledReason?: string } }) {
  return <section className="state-card state-card--alert" role="alert"><span aria-hidden="true">⚠</span><p>暂时无法显示此内容</p><p>错误代码：{sanitizeErrorCode(errorCode)}</p>{occurredAt && <p>发生时间：{formatTimestamp(occurredAt)}</p>}<button type="button" disabled={retryDisabled} onClick={retryAction} aria-label={`重试${retryDisabled ? '（当前不可用）' : ''}`}>重试</button>{retryDisabled && retryDisabledReason && <p>{retryDisabledReason}</p>}{backAction && <><button type="button" disabled={backAction.disabled} onClick={backAction.onClick}>{backAction.label}</button>{backAction.disabled && backAction.disabledReason && <p>{backAction.disabledReason}</p>}</>}</section>
}
