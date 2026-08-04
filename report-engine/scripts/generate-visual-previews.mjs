import { mkdir, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';
import { generateReport, renderReportDocument } from '../dist/index.js';
import { createIndustryTrackingRequest } from '../test/fixtures/industry-tracking.fixture.mjs';

const scriptDirectory = dirname(fileURLToPath(import.meta.url));
const outputDirectory = resolve(scriptDirectory, '../artifacts/visual');

const evidence = [
  {
    title: '固定离线测试来源',
    url: 'https://example.com/source',
    publishedAt: '2026-07-30T08:00:00+08:00',
  },
];

const morningAssessment = {
  reportId: 'morning-2026-07-30-v1.0',
  reportDate: '2026-07-30',
  reportType: 'morning_scan',
  originalJudgement: '固定早盘判断等待后续验证。',
  status: '部分验证',
  validationEvidence: evidence,
};

const middayAssessment = {
  reportId: 'midday-2026-07-30-v1.0',
  reportDate: '2026-07-30',
  reportType: 'midday_review',
  originalJudgement: '固定午间判断等待收盘验证。',
  status: '未验证',
  validationEvidence: evidence,
};

const historicalAssessment = {
  reportId: 'daily-2026-07-29-v1.0',
  reportDate: '2026-07-29',
  reportType: 'daily_review',
  originalJudgement: '固定历史判断等待后续验证。',
  status: '未验证',
  validationEvidence: [],
};

const previews = [
  {
    filename: 'morning-scan.html',
    request: {
      reportType: 'morning_scan',
      reportDate: '2026-07-30',
      evidence,
    },
  },
  {
    filename: 'midday-review.html',
    request: {
      reportType: 'midday_review',
      reportDate: '2026-07-30',
      evidence,
      priorAssessments: [morningAssessment, historicalAssessment],
    },
  },
  {
    filename: 'daily-review.html',
    request: {
      reportType: 'daily_review',
      reportDate: '2026-07-30',
      dataAsOf: '2026-07-30T16:00:00+08:00',
      evidence,
      priorAssessments: [morningAssessment, middayAssessment],
    },
  },
  {
    filename: 'industry-tracking.html',
    request: createIndustryTrackingRequest(),
  },
];

await mkdir(outputDirectory, { recursive: true });

for (const preview of previews) {
  const generationResult = generateReport(preview.request);
  if (generationResult.kind !== 'success') {
    throw new Error(
      `${preview.filename} 生成失败：${generationResult.errorCode}`,
    );
  }

  const documentResult = renderReportDocument(generationResult.report);
  if (documentResult.kind !== 'success') {
    throw new Error(
      `${preview.filename} 渲染失败：${documentResult.errorCode}`,
    );
  }

  const outputPath = resolve(outputDirectory, preview.filename);
  await writeFile(outputPath, documentResult.html, 'utf8');
  process.stdout.write(`已生成 ${outputPath}\n`);
}
