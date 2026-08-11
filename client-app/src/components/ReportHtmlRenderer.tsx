import { applyReportHtmlPolicy } from '../security/reportHtmlPolicy'

export function ReportHtmlRenderer({ html }: { html: string }) {
  const result = applyReportHtmlPolicy(html)

  if (result.kind === 'blocked') {
    return <section className="report-html report-html--blocked" role="alert">报告正文因安全校验未通过，暂时无法显示</section>
  }

  return <div className="report-html" dangerouslySetInnerHTML={{ __html: result.html }} />
}
