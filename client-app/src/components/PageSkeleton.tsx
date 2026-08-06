import './shared.css'

export function PageSkeleton({ label = '内容', slow = false }: { label?: string; slow?: boolean }) {
  const name = `${label}正在加载${slow ? '，加载时间较长' : ''}`
  return <section className="state-card skeleton" aria-busy="true" aria-label={name} role="status"><span aria-hidden="true">◌</span><span>{name}</span>{slow && <span>加载时间较长</span>}</section>
}
