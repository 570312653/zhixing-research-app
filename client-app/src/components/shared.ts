export function formatTimestamp(value: string): string {
  return value.replace('T', ' ').slice(0, 16)
}

export function sanitizeErrorCode(errorCode: string): string {
  return /^[A-Z][A-Z0-9_]{2,63}$/.test(errorCode) ? errorCode : 'UNAVAILABLE'
}

export type DisabledActionProps = {
  actionLabel?: string
  onAction?: () => void
  actionDisabled?: boolean
  actionDisabledReason?: string
}
