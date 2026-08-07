import './shared.css'
import type { ReportFilter, ReportType } from '../domain/report'

const reportTypeLabels: Record<ReportType, string> = {
  morning_scan: '早盘扫描', midday_review: '午间复盘', daily_review: '每日复盘', industry_tracking: '行业跟踪', holiday_digest: '休市信息摘要', month_end_review: '月末复盘', industry_research: '产业研究',
}

type FilterOption = { value: string; label: string }

type FilterBarProps = {
  filter: ReportFilter
  options: {
    reportTypes: readonly ReportType[]
    industries: readonly FilterOption[]
    themes: readonly FilterOption[]
  }
  onChange: (filter: ReportFilter) => void
  onClear: () => void
}

function selectedValues(options: HTMLOptionsCollection): string[] {
  return Array.from(options).filter(({ selected }) => selected).map(({ value }) => value)
}

export function FilterBar({ filter, options, onChange, onClear }: FilterBarProps) {
  const toggleReportType = (type: ReportType) => {
    const current = filter.reportTypes ?? []
    onChange({
      ...filter,
      reportTypes: current.includes(type)
        ? current.filter((candidate) => candidate !== type)
        : [...current, type],
    })
  }

  return (
    <form className="filter-bar" onSubmit={(event) => event.preventDefault()}>
      <label htmlFor="report-search">搜索报告</label>
      <input id="report-search" value={filter.query ?? ''} onChange={(event) => onChange({ ...filter, query: event.target.value })} />
      <fieldset className="filter-bar__types">
        <legend>报告类型</legend>
        {options.reportTypes.map((type) => (
          <label key={type}>
            <input type="checkbox" checked={filter.reportTypes?.includes(type) ?? false} onChange={() => toggleReportType(type)} />
            <span>{reportTypeLabels[type]}</span>
          </label>
        ))}
      </fieldset>
      <label htmlFor="report-date-from">开始日期</label>
      <input id="report-date-from" type="date" value={filter.dateFrom ?? ''} onChange={(event) => onChange({ ...filter, dateFrom: event.target.value })} />
      <label htmlFor="report-date-to">结束日期</label>
      <input id="report-date-to" type="date" value={filter.dateTo ?? ''} onChange={(event) => onChange({ ...filter, dateTo: event.target.value })} />
      <label htmlFor="report-industry">行业</label>
      <select id="report-industry" multiple value={[...(filter.industryIds ?? [])]} onChange={(event) => onChange({ ...filter, industryIds: selectedValues(event.target.options) })}>
        {options.industries.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
      </select>
      <label htmlFor="report-theme">主题</label>
      <select id="report-theme" multiple value={[...(filter.themeIds ?? [])]} onChange={(event) => onChange({ ...filter, themeIds: selectedValues(event.target.options) })}>
        {options.themes.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
      </select>
      <button type="button" onClick={onClear}>清除筛选</button>
    </form>
  )
}
