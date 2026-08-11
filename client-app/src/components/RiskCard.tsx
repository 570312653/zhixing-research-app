import './shared.css'

export function RiskCard({ title, body }: { title: string; body: string }) {
  return <aside className="content-card content-card--risk"><h2>{title}</h2><p>{body}</p></aside>
}
