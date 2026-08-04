import {
  failure,
  validateGenerateRequest,
  validateGeneratedReport,
  type GenerateError,
  type GeneratedReport,
  type GenerateSuccess,
} from './contract.js';
import { validateHtmlPolicy } from './html-policy.js';
import { composeIndustryTrackingReport } from './industry-tracking.js';

export { validateHtmlPolicy } from './html-policy.js';
export { renderReportDocument } from './report-template.js';

function escapeHtmlText(value: string): string {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}

export function generateReport(
  input: unknown,
): GenerateSuccess | GenerateError {
  const requestResult = validateGenerateRequest(input);
  if (!requestResult.ok) return requestResult.error;

  const request = requestResult.value;

  if (request.reportType === 'industry_tracking') {
    const composedResult = composeIndustryTrackingReport(request);
    if (!composedResult.ok) return composedResult.error;

    const outputResult = validateGeneratedReport(composedResult.value);
    if (!outputResult.ok) return outputResult.error;

    return { kind: 'success', report: outputResult.value };
  }

  const priorAssessmentsTable =
    request.reportType === 'morning_scan'
      ? ''
      : [
          '<table><thead><tr><th>原报告日期</th><th>报告 ID</th><th>原判断</th><th>状态</th></tr></thead><tbody>',
          ...request.priorAssessments.map(
            (assessment) =>
              `<tr><td data-label="原报告日期">${escapeHtmlText(assessment.reportDate)}</td><td data-label="报告 ID">${escapeHtmlText(assessment.reportId)}</td><td data-label="原判断">${escapeHtmlText(assessment.originalJudgement)}</td><td data-label="状态">${escapeHtmlText(assessment.status)}</td></tr>`,
          ),
          '</tbody></table>',
        ].join('');

  const contentHtml =
    request.reportType === 'daily_review'
      ? [
          '<article>',
          '<h1>每日复盘</h1>',
          '<h2>一句话总览</h2><p>固定离线样例仅用于验证结构化复盘流程，不包含真实行情事实。</p>',
          '<h2>市场表现</h2><p>固定样例不描述真实市场涨跌或成交数据。</p>',
          '<h2>主线与板块</h2><p>固定样例不提供任何行业或标的结论。</p>',
          '<h2>重要事件与公告</h2><p>固定样例不引用真实事件或公告。</p>',
          '<h2>情绪与结构观察</h2><p>固定样例仅验证非个人化研究表达。</p>',
          '<h2>当日判断验证表</h2>',
          priorAssessmentsTable,
          '<h2>次日观察清单</h2><ul><li>后续接入真实数据能力前，保持失败关闭。</li></ul>',
          '<p>仅供信息参考，不构成投资建议。</p>',
          '</article>',
        ].join('')
      : request.reportType === 'midday_review'
      ? [
          '<article>',
          '<h1>午间小复盘</h1>',
          '<p>固定样例正文，仅用于本地原型验证。</p>',
          '<h2>上午观察</h2>',
          '<ul><li>基于请求内固定证据，对上午市场信息进行非个人化研究整理。</li></ul>',
          '<h2>判断验证表</h2>',
          priorAssessmentsTable,
          '<p>仅供信息参考，不构成投资建议。</p>',
          '</article>',
        ].join('')
      : (request.draftHtml ??
        '<article><h1>早盘扫描</h1><p>固定样例正文，仅用于本地原型验证。</p><p>仅供信息参考，不构成投资建议。</p></article>');

  const htmlResult = validateHtmlPolicy(contentHtml);
  if (!htmlResult.ok) return failure(htmlResult.errorCode, htmlResult.message);

  const report: GeneratedReport =
    request.reportType === 'daily_review'
      ? {
          reportType: 'daily_review',
          reportDate: request.reportDate,
          title: `每日复盘｜${request.reportDate}｜v1.0`,
          version: 'v1.0',
          dataAsOf: request.dataAsOf,
          sourceLinks: request.evidence,
          marketScopes: ['cn_a'],
          priorAssessments: request.priorAssessments,
          contentHtml: htmlResult.value,
        }
      : request.reportType === 'midday_review'
      ? {
          reportType: 'midday_review',
          reportDate: request.reportDate,
          title: `午间小复盘｜${request.reportDate}｜v1.0`,
          version: 'v1.0',
          dataAsOf: request.evidence[0]?.publishedAt ?? '',
          sourceLinks: request.evidence,
          priorAssessments: request.priorAssessments,
          contentHtml: htmlResult.value,
        }
      : {
          reportType: 'morning_scan',
          reportDate: request.reportDate,
          title: `早盘扫描｜${request.reportDate}｜v1.0`,
          version: 'v1.0',
          dataAsOf: request.evidence[0]?.publishedAt ?? '',
          sourceLinks: request.evidence,
          contentHtml: htmlResult.value,
        };
  const outputResult = validateGeneratedReport(report);
  if (!outputResult.ok) return outputResult.error;

  const outputHtmlResult = validateHtmlPolicy(outputResult.value.contentHtml);
  if (!outputHtmlResult.ok) {
    return failure(outputHtmlResult.errorCode, outputHtmlResult.message);
  }

  return {
    kind: 'success',
    report: { ...outputResult.value, contentHtml: outputHtmlResult.value },
  };
}
