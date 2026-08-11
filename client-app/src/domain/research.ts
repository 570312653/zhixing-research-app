export type IndustryTrendState =
  | 'warming'
  | 'continuing'
  | 'diverging'
  | 'cooling'
  | 'insufficient'

export interface ResearchTheme {
  id: string
  displayName: string
}

export interface ResearchEvidence {
  id: string
  title: string
  observedAt: string
  direction: 'supporting' | 'counter'
}

export interface IndustrySummary {
  id: string
  displayName: string
  industryTags: readonly string[]
  trendState: IndustryTrendState
  themeIds: readonly string[]
  reportIds: readonly string[]
  watchlistSymbols: readonly string[]
  updatedAt: string
  thesis: string
}

export interface IndustryTimelineEvent {
  id: string
  occurredAt: string
  trendState: IndustryTrendState
  note: string
}

export interface IndustryDetail extends IndustrySummary {
  supportingEvidence: readonly ResearchEvidence[]
  counterEvidence: readonly ResearchEvidence[]
  timeline: readonly IndustryTimelineEvent[]
}
