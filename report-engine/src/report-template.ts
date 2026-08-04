import {
  validateGeneratedReport,
  type GenerateError,
  type GeneratedReport,
} from './contract.js';

export type ReportDocumentResult =
  | { kind: 'success'; html: string }
  | GenerateError;

const reportTypeLabels: Record<GeneratedReport['reportType'], string> = {
  morning_scan: '早盘扫描',
  midday_review: '午间复盘',
  daily_review: '每日复盘',
  industry_tracking: '行业跟踪',
};

const reportStyles = `
:root {
  --brand-navy: #1e3a8a;
  --text-primary: #1f2937;
  --text-muted: #6b7280;
  --surface-page: #ffffff;
  --surface-subtle: #f3f4f6;
  --signal-positive: #15803d;
  --signal-watch: #b45309;
  --signal-risk: #b91c1c;
  --surface-risk: #fde8e8;
}

* {
  box-sizing: border-box;
}

body {
  margin: 0;
  color: var(--text-primary);
  background: #e9edf5;
  font-family: "Microsoft YaHei", "Noto Sans CJK SC", "PingFang SC", sans-serif;
  line-height: 1.75;
}

.report-document {
  max-width: 1120px;
  margin: 32px auto;
  background: var(--surface-page);
  border-top: 6px solid var(--brand-navy);
  box-shadow: 0 18px 50px rgb(30 58 138 / 12%);
}

.report-header,
.report-main,
.report-footer {
  padding-inline: clamp(20px, 5vw, 64px);
}

.report-header {
  padding-top: 42px;
  padding-bottom: 28px;
  border-bottom: 1px solid #dbe2ee;
}

.brand-mark {
  margin: 0 0 20px;
  color: var(--brand-navy);
  font-size: 15px;
  font-weight: 800;
  letter-spacing: 0.3em;
}

.report-title {
  margin: 0;
  color: #102451;
  font-size: clamp(28px, 4vw, 38px);
  line-height: 1.25;
}

.report-type {
  margin: 10px 0 0;
  color: var(--text-muted);
  font-size: 14px;
}

.report-meta {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 12px;
  margin: 24px 0 0;
}

.meta-item {
  padding: 12px 14px;
  background: var(--surface-subtle);
  border-left: 3px solid #8fa3ce;
}

.meta-label {
  display: block;
  color: var(--text-muted);
  font-size: 12px;
}

.meta-value {
  display: block;
  margin-top: 2px;
  font-size: 14px;
  overflow-wrap: anywhere;
}

.report-main {
  padding-top: 32px;
  padding-bottom: 40px;
}

.report-main article h1 {
  margin: 0 0 28px;
  color: #102451;
  font-size: clamp(24px, 3vw, 32px);
  line-height: 1.3;
}

.report-main article h2 {
  margin: 34px 0 14px;
  padding-bottom: 8px;
  color: var(--brand-navy);
  border-bottom: 2px solid #dbe2ee;
  font-size: 20px;
  line-height: 1.4;
}

.report-main article p,
.report-main article ul,
.report-main article ol {
  margin-block: 12px;
}

.report-main article ul,
.report-main article ol {
  padding-left: 1.4em;
}

.report-main article > p:last-child {
  margin-top: 32px;
  padding: 14px 16px;
  color: #7f1d1d;
  background: var(--surface-risk);
  border-left: 4px solid var(--signal-risk);
  font-size: 13px;
}

.report-main table {
  width: 100%;
  margin: 18px 0 28px;
  border-collapse: collapse;
  table-layout: fixed;
  font-size: 14px;
}

.report-main th,
.report-main td {
  padding: 12px 14px;
  border: 1px solid #dbe2ee;
  text-align: left;
  vertical-align: top;
  overflow-wrap: anywhere;
}

.report-main th {
  color: #ffffff;
  background: var(--brand-navy);
  font-weight: 700;
}

.report-main tbody tr:nth-child(even) {
  background: #f8fafc;
}

.report-sources {
  margin-top: 36px;
  padding-top: 24px;
  border-top: 1px solid #dbe2ee;
}

.report-sources h2 {
  margin: 0 0 12px;
  color: var(--brand-navy);
  font-size: 18px;
}

.report-sources a {
  color: var(--brand-navy);
  text-underline-offset: 3px;
}

.report-footer {
  display: flex;
  justify-content: space-between;
  gap: 16px;
  padding-top: 18px;
  padding-bottom: 18px;
  color: var(--text-muted);
  background: #f8fafc;
  border-top: 1px solid #dbe2ee;
  font-size: 12px;
}

@media (max-width: 767px) {
  body {
    background: var(--surface-page);
  }

  .report-document {
    margin: 0;
    box-shadow: none;
  }

  .report-header {
    padding-top: 30px;
  }

  .report-meta {
    grid-template-columns: 1fr;
  }

  .report-footer {
    flex-direction: column;
  }

  .report-main table,
  .report-main thead,
  .report-main tbody,
  .report-main tr,
  .report-main th,
  .report-main td {
    display: block;
    width: 100%;
  }

  .report-main thead {
    position: absolute;
    width: 1px;
    height: 1px;
    padding: 0;
    overflow: hidden;
    clip: rect(0 0 0 0);
    white-space: nowrap;
    border: 0;
  }

  .report-main tbody tr {
    margin-bottom: 16px;
    overflow: hidden;
    background: var(--surface-page);
    border: 1px solid #dbe2ee;
    border-radius: 10px;
  }

  .report-main tbody tr:nth-child(even) {
    background: var(--surface-page);
  }

  .report-main tbody td {
    display: grid;
    grid-template-columns: minmax(7rem, 38%) 1fr;
    gap: 12px;
    border: 0;
    border-bottom: 1px solid #e5e7eb;
  }

  .report-main tbody td:last-child {
    border-bottom: 0;
  }

  .report-main tbody td::before {
    content: attr(data-label);
    color: var(--text-muted);
    font-weight: 700;
  }
}

@page {
  size: A4;
  margin: 16mm 14mm 18mm;
}

@media print {
  body {
    background: #ffffff;
  }

  .report-document {
    max-width: none;
    margin: 0;
    border-top-width: 4px;
    box-shadow: none;
  }

  .report-header,
  .report-main,
  .report-footer {
    padding-inline: 0;
  }

  .report-header {
    padding-top: 0;
  }

  .report-main article h1,
  .report-main article h2,
  .meta-item,
  .report-sources,
  .report-main article > p:last-child,
  .report-main tr {
    break-inside: avoid;
  }

  .report-sources a {
    color: inherit;
    text-decoration: none;
  }
}
`.trim();

function escapeHtmlText(value: string): string {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}

function renderSources(report: GeneratedReport): string {
  const sources = report.reportType === 'industry_tracking'
    ? report.sources
    : report.sourceLinks;
  const items = sources
    .map(
      (source) =>
        `<li><a href="${escapeHtmlText(source.url)}">${escapeHtmlText(source.title)}</a><span> · ${escapeHtmlText(source.publishedAt)}</span></li>`,
    )
    .join('');

  return `<section class="report-sources" aria-labelledby="source-heading"><h2 id="source-heading">公开来源</h2><ol>${items}</ol></section>`;
}

export function renderReportDocument(value: unknown): ReportDocumentResult {
  const validationResult = validateGeneratedReport(value);
  if (!validationResult.ok) return validationResult.error;

  const report = validationResult.value;
  const title = escapeHtmlText(report.title);
  const reportTypeLabel = reportTypeLabels[report.reportType];
  const sourcesHtml =
    report.reportType === 'industry_tracking' ? '' : renderSources(report);

  const html = [
    '<!doctype html>',
    '<html lang="zh-CN">',
    '<head>',
    '<meta charset="utf-8">',
    '<meta name="viewport" content="width=device-width, initial-scale=1">',
    `<title>${title}｜知行</title>`,
    `<style>${reportStyles}</style>`,
    '</head>',
    '<body>',
    '<div class="report-document">',
    '<header class="report-header">',
    '<p class="brand-mark">知行</p>',
    `<p class="report-title">${title}</p>`,
    `<p class="report-type">${escapeHtmlText(reportTypeLabel)} · 非个人化市场研究</p>`,
    '<div class="report-meta">',
    `<div class="meta-item"><span class="meta-label">报告日期</span><span class="meta-value">${escapeHtmlText(report.reportDate)}</span></div>`,
    `<div class="meta-item"><span class="meta-label">版本</span><span class="meta-value">${escapeHtmlText(report.version)}</span></div>`,
    `<div class="meta-item"><span class="meta-label">数据截至时间</span><span class="meta-value">${escapeHtmlText(report.dataAsOf)}</span></div>`,
    '</div>',
    '</header>',
    '<main class="report-main">',
    report.contentHtml,
    sourcesHtml,
    '</main>',
    '<footer class="report-footer">',
    '<span>知行 · 仅供信息参考，不构成投资建议</span>',
    `<span>${escapeHtmlText(report.reportDate)} · ${escapeHtmlText(report.version)}</span>`,
    '</footer>',
    '</div>',
    '</body>',
    '</html>',
  ].join('');

  return { kind: 'success', html };
}
