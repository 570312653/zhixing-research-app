import './shared.css'
import type { ReportFilter, ReportType } from '../domain/report'

const reportTypeLabels: Record<ReportType, string> = {
  morning_scan: '早盘扫描', midday_review: '午间复盘', daily_review: '收盘复盘', industry_tracking: '行业跟踪', holiday_digest: '休市信息摘要', month_end_review: '月末复盘', industry_research: '产业研究',
}

export function FilterBar({ filter, options, onChange, onClear }: { filter: ReportFilter; options: { reportTypes: readonly ReportType[] }; onChange: (filter: ReportFilter) => void; onClear: () => void }) {
  return <form className="filter-bar" onSubmit={(event) => event.preventDefault()}><label htmlFor="report-search">搜索报告</label><input id="report-search" value={filter.query ?? ''} onChange={(event) => onChange({ ...filter, query: event.target.value })} /><label htmlFor="report-type">报告类型</label><select id="report-type" value={filter.reportTypes?.[0] ?? ''} onChange={(event) => onChange({ ...filter, reportTypes: event.target.value ? [event.target.value as ReportType] : [] })}><option value="">全部类型</option>{options.reportTypes.map((type) => <option key={type} value={type}>{reportTypeLabels[type]}</option>)}</select><button type="button" onClick={onClear}>清除筛选</button></form>
}
