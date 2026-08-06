import './shared.css'

export function ActionFeedback({ state, message, actionLabel, onAction, actionDisabled = false, actionDisabledReason }: { state: 'idle' | 'submitting' | 'success' | 'failure'; message: string; actionLabel?: string; onAction?: () => void; actionDisabled?: boolean; actionDisabledReason?: string }) {
  const role = state === 'failure' ? 'alert' : 'status'
  return <aside className={`notice notice--${state}`} role={role}><span aria-hidden="true">{state === 'failure' ? '⚠' : '●'}</span><p>{message}</p>{actionLabel && <button type="button" disabled={actionDisabled} onClick={onAction} aria-label={`${actionLabel}${actionDisabled ? '（当前不可用）' : ''}`}>{actionLabel}</button>}{actionDisabled && actionDisabledReason && <p>{actionDisabledReason}</p>}</aside>
}
