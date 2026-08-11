import '../shared.css'

export function ActionFeedback({ state, message, actionLabel, onAction, actionDisabled = false, actionDisabledReason }: { state: 'idle' | 'submitting' | 'success' | 'failure'; message: string; actionLabel?: string; onAction?: () => void; actionDisabled?: boolean; actionDisabledReason?: string }) {
  const role = state === 'failure' ? 'alert' : 'status'
  const disabled = state === 'submitting' || actionDisabled
  const disabledReason = disabled ? actionDisabledReason ?? (state === 'submitting' ? '操作进行中，请稍候。' : '当前不可执行此操作。') : undefined
  return <aside className={`notice notice--${state}`} role={role}><span aria-hidden="true">{state === 'failure' ? '⚠' : '●'}</span><p>{message}</p>{actionLabel && onAction && <><button type="button" disabled={disabled} onClick={onAction} aria-label={`${actionLabel}${disabled ? '（当前不可用）' : ''}`}>{actionLabel}</button>{disabledReason && <p>{disabledReason}</p>}</>}</aside>
}
