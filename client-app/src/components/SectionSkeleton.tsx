import './shared.css'

export function SectionSkeleton({ label = '区块', slow = false, variant = 'card' }: { label?: string; slow?: boolean; variant?: 'card' | 'list' }) {
  const name = `${label}正在加载${slow ? '，加载时间较长' : ''}`
  return <section className={`state-card skeleton skeleton--${variant}`} aria-busy="true" aria-label={name} role="status"><span aria-hidden="true">◌</span><span>{name}</span>{slow && <span>加载时间较长</span>}</section>
}
