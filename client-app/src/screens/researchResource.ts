import { useEffect, useRef, useState } from 'react'

import { FixtureReportRepository } from '../repositories/FixtureReportRepository'

export const defaultResearchRepository = new FixtureReportRepository()

type ResourceState<T> =
  | { kind: 'loading'; key: string }
  | { kind: 'success'; key: string; value: T }
  | { kind: 'stale'; key: string; value: T }
  | { kind: 'missing'; key: string }
  | { kind: 'failure'; key: string }

export function useResearchResource<T>(
  key: string,
  source: object,
  load: () => Promise<T | null>,
): ResourceState<T> {
  const loadRef = useRef(load)
  loadRef.current = load
  const [state, setState] = useState<ResourceState<T>>({ kind: 'loading', key })

  useEffect(() => {
    let active = true
    setState((previous) => {
      if (previous.key === key && (previous.kind === 'success' || previous.kind === 'stale')) return previous
      return { kind: 'loading', key }
    })
    loadRef.current().then((value) => {
      if (!active) return
      setState(value === null ? { kind: 'missing', key } : { kind: 'success', key, value })
    }).catch(() => {
      if (!active) return
      setState((previous) => previous.key === key && (previous.kind === 'success' || previous.kind === 'stale')
        ? { kind: 'stale', key, value: previous.value }
        : { kind: 'failure', key })
    })
    return () => { active = false }
  }, [key, source])

  return state.key === key ? state : { kind: 'loading', key }
}

export const trendLabels = {
  warming: '升温',
  continuing: '趋势延续',
  diverging: '趋势分化',
  cooling: '降温',
  insufficient: '证据不足',
} as const

export const changeLabels = {
  added: '新增关注',
  reason_changed: '原因更新',
  removed: '已移出',
} as const
