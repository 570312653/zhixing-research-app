import './shared.css'
import type { ResearchEvidence } from '../domain/research'
import { formatTimestamp } from './shared'

export function EvidenceCard({ evidence }: { evidence: ResearchEvidence }) {
  const direction = evidence.direction === 'supporting' ? '支持方向' : '反向方向'
  return <article className="content-card"><p>{direction}</p><h3>{evidence.title}</h3><p>观察时间：{formatTimestamp(evidence.observedAt)}</p></article>
}
