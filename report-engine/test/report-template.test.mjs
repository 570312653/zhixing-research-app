import test from 'node:test';
import assert from 'node:assert/strict';
import { generateReport, renderReportDocument } from '../dist/index.js';

const evidence = [
  {
    title: '固定测试来源',
    url: 'https://example.com/source',
    publishedAt: '2026-07-30T08:00:00+08:00',
  },
];

const priorAssessments = [
  {
    reportId: 'morning-2026-07-30-v1.0',
    reportDate: '2026-07-30',
    reportType: 'morning_scan',
    originalJudgement: '固定早盘判断等待后续验证。',
    status: '部分验证',
    validationEvidence: evidence,
  },
  {
    reportId: 'midday-2026-07-30-v1.0',
    reportDate: '2026-07-30',
    reportType: 'midday_review',
    originalJudgement: '固定午间判断等待收盘验证。',
    status: '未验证',
    validationEvidence: evidence,
  },
];

function getReport(reportType) {
  const result =
    reportType === 'morning_scan'
      ? generateReport({
          reportType,
          reportDate: '2026-07-30',
          evidence,
        })
      : reportType === 'midday_review'
        ? generateReport({
            reportType,
            reportDate: '2026-07-30',
            evidence,
            priorAssessments: [
              priorAssessments[0],
              {
                reportId: 'daily-2026-07-29-v1.0',
                reportDate: '2026-07-29',
                reportType: 'daily_review',
                originalJudgement: '固定历史判断等待后续验证。',
                status: '未验证',
                validationEvidence: [],
              },
            ],
          })
        : generateReport({
            reportType: 'daily_review',
            reportDate: '2026-07-30',
            dataAsOf: '2026-07-30T16:00:00+08:00',
            evidence,
            priorAssessments,
          });

  assert.equal(result.kind, 'success');
  return result.report;
}

test('把已校验报告渲染为完整的知行 HTML 文档', () => {
  const result = renderReportDocument(getReport('daily_review'));

  assert.equal(result.kind, 'success');
  assert.match(result.html, /^<!doctype html>/i);
  assert.match(result.html, /<html lang="zh-CN">/);
  assert.match(result.html, /<meta charset="utf-8">/);
  assert.match(result.html, /name="viewport"/);
  assert.match(result.html, /--brand-navy:\s*#1e3a8a/i);
  assert.match(result.html, /max-width:\s*1120px/);
  assert.match(result.html, />知行</);
  assert.match(result.html, /每日复盘｜2026-07-30｜v1\.0/);
  assert.match(result.html, /数据截至时间/);
  assert.match(result.html, /2026-07-30T16:00:00\+08:00/);
  assert.match(result.html, /固定测试来源/);
  assert.match(result.html, /href="https:\/\/example\.com\/source"/);
  assert.match(result.html, /仅供信息参考，不构成投资建议/);
});

test('完整文档包含手机表格卡片和 A4 打印样式', () => {
  const result = renderReportDocument(getReport('daily_review'));

  assert.equal(result.kind, 'success');
  assert.match(result.html, /@media\s*\(max-width:\s*767px\)/);
  assert.match(result.html, /content:\s*attr\(data-label\)/);
  assert.match(result.html, /@page\s*\{/);
  assert.match(result.html, /size:\s*A4/);
  assert.match(result.html, /break-inside:\s*avoid/);
  assert.match(result.html, /table-layout:\s*fixed/);
  assert.match(result.html, /nth-child\(even\)/);
  assert.match(result.html, /--surface-risk:\s*#fde8e8/i);
});

test('渲染器转义报告元数据而不改写已经校验的正文', () => {
  const report = getReport('morning_scan');
  const result = renderReportDocument({
    ...report,
    title: '早盘 <测试> & "标题"',
  });

  assert.equal(result.kind, 'success');
  assert.match(result.html, /早盘 &lt;测试&gt; &amp; &quot;标题&quot;/);
  assert.doesNotMatch(result.html, /<测试>/);
  assert.equal(
    result.html.split(report.contentHtml).length - 1,
    1,
    '正文必须且只能嵌入一次',
  );
});

test('渲染器拒绝未通过输出契约的对象', () => {
  const result = renderReportDocument({
    reportType: 'daily_review',
    title: '缺少其余字段',
  });

  assert.equal(result.kind, 'error');
  assert.equal(result.errorCode, 'OUTPUT_CONTRACT_VIOLATION');
});

for (const reportType of ['morning_scan', 'midday_review', 'daily_review']) {
  test(`渲染器支持现有报告类型：${reportType}`, () => {
    const result = renderReportDocument(getReport(reportType));

    assert.equal(result.kind, 'success');
    assert.match(result.html, /class="report-document"/);
  });
}
