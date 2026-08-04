import assert from 'node:assert/strict';
import test from 'node:test';
import { validateGeneratedReport } from '../dist/contract.js';
import { generateReport, renderReportDocument } from '../dist/index.js';
import { createIndustryTrackingRequest } from './fixtures/industry-tracking.fixture.mjs';

function request(overrides = {}) {
  return { ...createIndustryTrackingRequest(), ...overrides };
}

test('用完整核心八项和 robotics 特别关注生成一份行业跟踪报告', () => {
  const result = generateReport(request());

  assert.equal(result.kind, 'success');
  assert.equal(result.report.reportType, 'industry_tracking');
  assert.equal(result.report.title, '行业跟踪｜2026-07-30｜v1.0');
  assert.deepEqual(result.report.marketScopes, ['cn_a']);
  assert.equal(result.report.coreFocusIds.length, 8);
  assert.deepEqual(result.report.dailyFocusIds, ['robotics']);
  assert.equal(result.report.industries.length, 9);
  assert.deepEqual(result.report.themes, [
    {
      themeId: 'ai_infrastructure',
      displayName: 'AI 基础设施',
      focusIds: ['ai_plus', 'advanced_chips', 'computing_network'],
      industryTags: ['计算机', '电子', '传媒', '通信'],
    },
  ]);
  assert.match(result.report.contentHtml, /<h2>今日行业总览<\/h2>/);
  assert.match(result.report.contentHtml, /<h2>每日特别关注<\/h2>/);
  assert.match(result.report.contentHtml, /<h2>核心行业跟踪<\/h2>/);
  assert.match(result.report.contentHtml, /AI 基础设施/);
  assert.match(result.report.contentHtml, /仅供信息参考，不构成投资建议/);

  const rendered = renderReportDocument(result.report);
  assert.equal(rendered.kind, 'success');
  assert.match(rendered.html, /行业跟踪/);
});

test('行业跟踪允许每日特别关注为空而不补齐', () => {
  const input = request();
  input.dailyFocusSelections = [];
  input.industries = input.industries.filter((item) => item.role !== 'daily_focus');

  const result = generateReport(input);

  assert.equal(result.kind, 'success');
  assert.deepEqual(result.report.dailyFocusIds, []);
  assert.match(result.report.contentHtml, /今日无特别关注新增/);
});

test('行业跟踪缺少任一核心章节时失败关闭', () => {
  const input = request();
  input.industries = input.industries.filter((item) => item.focusId !== 'six_g');

  const result = generateReport(input);

  assert.equal(result.kind, 'error');
  assert.equal(result.errorCode, 'INDUSTRY_TRACKING_INSUFFICIENT');
});

test('行业跟踪拒绝核心与每日特别关注重叠', () => {
  const input = request();
  const core = input.coreFocusConfig[0];
  input.dailyFocusSelections = [
    {
      ...core,
      selectionReason: '不应允许核心重复进入每日特别关注。',
      selectionEvidenceIds: ['S01'],
      firstSelectedDate: '2026-07-30',
      consecutiveSelectionDays: 1,
    },
  ];

  const result = generateReport(input);

  assert.equal(result.kind, 'error');
  assert.equal(result.errorCode, 'INDUSTRY_TRACKING_INSUFFICIENT');
});

test('行业跟踪按 Asia/Shanghai 拒绝错误的数据截至日期', () => {
  const result = generateReport(
    request({ dataAsOf: '2026-07-30T23:30:00-04:00' }),
  );

  assert.equal(result.kind, 'error');
  assert.equal(result.errorCode, 'INVALID_REQUEST');
});

test('行业跟踪拒绝非法报告日期、候选池外特别关注和 draftHtml', () => {
  const invalidDate = generateReport(request({ reportDate: '2026-02-30' }));
  assert.equal(invalidDate.kind, 'error');
  assert.equal(invalidDate.errorCode, 'INVALID_REPORT_DATE');

  const outsideCandidate = request();
  outsideCandidate.dailyFocusSelections[0].focusId = 'outside_candidate';
  const outsideCandidateResult = generateReport(outsideCandidate);
  assert.equal(outsideCandidateResult.kind, 'error');
  assert.equal(outsideCandidateResult.errorCode, 'INDUSTRY_TRACKING_INSUFFICIENT');

  const draftResult = generateReport(
    request({ draftHtml: '<article><p>调用方正文</p></article>' }),
  );
  assert.equal(draftResult.kind, 'error');
  assert.equal(draftResult.errorCode, 'INVALID_REQUEST');
});

test('行业跟踪拒绝不合格来源和不存在的来源引用', () => {
  const badSource = request();
  badSource.sources[0].url = 'http://example.com/not-secure';
  const badReference = request();
  badReference.industries[0].dimensions[0].indicatorChanges[0].evidenceIds = ['MISSING'];

  for (const input of [badSource, badReference]) {
    const result = generateReport(input);
    assert.equal(result.kind, 'error');
    assert.equal(result.errorCode, 'SOURCE_EVIDENCE_INSUFFICIENT');
  }
});

test('行业跟踪拒绝超过三项的每日特别关注和脱离当前行业的主题', () => {
  const tooMany = request();
  tooMany.dailyFocusSelections = Array.from({ length: 4 }, () => ({
    ...tooMany.dailyFocusSelections[0],
  }));
  const detachedTheme = request();
  detachedTheme.themeConfig[0].focusIds = ['quantum_technology'];

  for (const input of [tooMany, detachedTheme]) {
    const result = generateReport(input);
    assert.equal(result.kind, 'error');
    assert.equal(result.errorCode, 'INDUSTRY_TRACKING_INSUFFICIENT');
  }
});

test('行业跟踪允许行业级全维度证据不足但拒绝整份报告无有效证据', () => {
  const degraded = request();
  const result = generateReport(degraded);
  assert.equal(result.kind, 'success');
  assert.equal(
    result.report.industries.find((item) => item.focusId === 'new_energy_equipment').overallStatus,
    'insufficient',
  );

  const noEvidence = request();
  for (const industry of noEvidence.industries) {
    industry.dimensions = industry.dimensions.map((item) => ({
      dimension: item.dimension,
      status: 'data_insufficient',
      missingReason: '固定夹具未提供有效行业证据。',
    }));
    industry.overallStatus = 'insufficient';
    industry.evidenceQuality = 'insufficient';
  }
  const noEvidenceResult = generateReport(noEvidence);
  assert.equal(noEvidenceResult.kind, 'error');
  assert.equal(noEvidenceResult.errorCode, 'INDUSTRY_TRACKING_INSUFFICIENT');
});

test('行业跟踪输出校验拒绝缺少固定栏目和危险 HTML', () => {
  const generated = generateReport(request());
  assert.equal(generated.kind, 'success');

  const missingSection = validateGeneratedReport({
    ...generated.report,
    contentHtml: generated.report.contentHtml.replace('<h2>主题线索观察</h2>', ''),
  });
  const unsafe = validateGeneratedReport({
    ...generated.report,
    contentHtml: '<article><script>alert(1)</script></article>',
  });

  assert.equal(missingSection.ok, false);
  assert.equal(missingSection.error.errorCode, 'OUTPUT_CONTRACT_VIOLATION');
  assert.equal(unsafe.ok, false);
  assert.equal(unsafe.error.errorCode, 'UNSAFE_HTML');
});

test('行业跟踪拒绝没有数值比较也没有定性观察的指标变化', () => {
  const input = request();
  const change = input.industries[0].dimensions[0].indicatorChanges[0];
  delete change.qualitativeObservation;

  const result = generateReport(input);

  assert.equal(result.kind, 'error');
  assert.equal(result.errorCode, 'INDUSTRY_TRACKING_INSUFFICIENT');
});

test('行业跟踪拒绝未知的状态、证据质量和信号一致性枚举', () => {
  for (const [field, value] of [
    ['overallStatus', 'unknown_status'],
    ['evidenceQuality', 'unknown_quality'],
    ['signalConsistency', 'unknown_consistency'],
  ]) {
    const input = request();
    input.industries[0][field] = value;

    const result = generateReport(input);
    assert.equal(result.kind, 'error');
    assert.equal(result.errorCode, 'INDUSTRY_TRACKING_INSUFFICIENT');
  }
});

test('行业跟踪拒绝结构化文本中的交易禁语', () => {
  const mutations = [
    (input) => { input.industries[0].keyChanges = ['建议买入固定标的。']; },
    (input) => { input.industries[0].catalysts = ['建议买入固定标的。']; },
    (input) => { input.industries[0].dimensions[0].conclusion = '建议买入固定标的。'; },
    (input) => { input.dailyFocusSelections[0].selectionReason = '建议买入固定标的。'; },
    (input) => { input.industries[1].priorJudgementAudits[0].auditNote = '建议买入固定标的。'; },
    (input) => { input.industries[7].stockObservations[0].riskNote = '建议买入固定标的。'; },
  ];

  for (const mutate of mutations) {
    const input = request();
    mutate(input);
    const result = generateReport(input);
    assert.equal(result.kind, 'error');
    assert.equal(result.errorCode, 'COMPLIANCE_VIOLATION');
  }
});

test('行业跟踪对全部展示结构化字段拒绝明确交易和价格指令', () => {
  const mutations = [
    (input) => { input.industries[0].keyChanges = ['立即买入某股。']; },
    (input) => { input.industries[0].catalysts = ['建议立即买入并加仓。']; },
    (input) => { input.industries[0].risks = ['目标价 100 元。']; },
    (input) => { input.industries[0].nextObservations = ['止损价 10 元。']; },
    (input) => { input.industries[0].dimensions[0].conclusion = '立即买入某股。'; },
    (input) => { input.industries[0].dimensions[0].indicatorChanges[0].qualitativeObservation = '目标价 100 元。'; },
    (input) => { input.dailyFocusSelections[0].selectionReason = '建议立即买入并加仓。'; },
    (input) => { input.industries[1].priorJudgementAudits[0].originalJudgement = '止损价 10 元。'; },
    (input) => { input.industries[1].priorJudgementAudits[0].auditNote = '立即买入某股。'; },
    (input) => { input.industries[7].stockObservations[0].industryRelation = '建议立即买入并加仓。'; },
    (input) => { input.industries[7].stockObservations[0].riskNote = '目标价 100 元。'; },
    (input) => { input.sources[0].context = '止损价 10 元。'; },
  ];

  for (const mutate of mutations) {
    const input = request();
    mutate(input);
    const result = generateReport(input);
    assert.equal(result.kind, 'error');
    assert.equal(result.errorCode, 'COMPLIANCE_VIOLATION');
  }
});

test('行业跟踪输出校验拒绝结构化内容与既有 HTML 不一致', () => {
  const generated = generateReport(request());
  assert.equal(generated.kind, 'success');
  const tampered = structuredClone(generated.report);
  tampered.industries[0].keyChanges = ['另一条未出现在既有 HTML 中的固定观察。'];

  const result = validateGeneratedReport(tampered);

  assert.equal(result.ok, false);
  assert.equal(result.error.errorCode, 'OUTPUT_CONTRACT_VIOLATION');
});

test('行业跟踪将每日特别关注和退出记录的悬空来源归为来源不足', () => {
  const selectionInput = request();
  selectionInput.dailyFocusSelections[0].selectionEvidenceIds = ['MISSING'];
  const exitInput = request();
  exitInput.exitedDailyFocus = [{
    focusId: 'quantum_technology',
    displayName: '量子科技',
    exitReason: 'replaced',
    evidenceIds: ['MISSING'],
  }];

  for (const input of [selectionInput, exitInput]) {
    const result = generateReport(input);
    assert.equal(result.kind, 'error');
    assert.equal(result.errorCode, 'SOURCE_EVIDENCE_INSUFFICIENT');
  }
});

test('行业跟踪在来源表中每个 sourceId 仅列出一次', () => {
  const generated = generateReport(request());
  assert.equal(generated.kind, 'success');
  const sourceSection = generated.report.contentHtml.slice(
    generated.report.contentHtml.indexOf('<h2>数据截至时间、公开来源与风险提示</h2>'),
  );

  assert.equal((sourceSection.match(/<li>/gu) ?? []).length, generated.report.sources.length);
  for (const source of generated.report.sources) {
    assert.equal(sourceSection.split(`${source.sourceId}：`).length - 1, 1);
  }
});

test('行业跟踪按 selectedThemeIds 的输入顺序派生章节主题和输出主题', () => {
  const input = request();
  input.selectedThemeIds = ['digital_infrastructure', 'ai_infrastructure'];
  const themeIdsByFocus = {
    ai_plus: ['ai_infrastructure'],
    advanced_chips: ['ai_infrastructure'],
    computing_network: ['digital_infrastructure', 'ai_infrastructure'],
    data_elements: ['digital_infrastructure'],
    six_g: ['digital_infrastructure'],
    intelligent_connected_nev: [],
    new_energy_equipment: [],
    embodied_intelligence: [],
    robotics: [],
  };
  for (const industry of input.industries) {
    industry.themeIds = themeIdsByFocus[industry.focusId];
  }

  const result = generateReport(input);

  assert.equal(result.kind, 'success');
  assert.deepEqual(result.report.industries.find((item) => item.focusId === 'computing_network').themeIds, [
    'digital_infrastructure',
    'ai_infrastructure',
  ]);
  assert.deepEqual(result.report.themes.map((theme) => theme.themeId), [
    'digital_infrastructure',
    'ai_infrastructure',
  ]);
});

test('行业跟踪固定八栏目输出实质内容而非仅标题', () => {
  const result = generateReport(request());
  assert.equal(result.kind, 'success');
  const html = result.report.contentHtml;

  for (const expectedText of [
    'warming',
    'diverging',
    '跨行业共性',
    '主要风险',
    '固定离线夹具的特别关注示例。',
    '2026-07-29',
    '连续 2 天',
    'previous_trading_day',
    'S03',
    '固定离线夹具不陈述真实市场事实。',
    'AI 基础设施',
    '计算机、电子、传媒、通信',
    '今日无重要新增',
  ]) {
    assert.match(html, new RegExp(expectedText, 'u'));
  }
  assert.doesNotMatch(html, /ai_plus/u);
});

test('行业跟踪拒绝重复未知主题和章节主题反向注入', () => {
  const duplicateTheme = request({ selectedThemeIds: ['ai_infrastructure', 'ai_infrastructure'] });
  const unknownTheme = request({ selectedThemeIds: ['unknown_theme'] });
  const injectedTheme = request();
  injectedTheme.industries.find((item) => item.focusId === 'data_elements').themeIds = [
    'ai_infrastructure',
  ];

  for (const input of [duplicateTheme, unknownTheme, injectedTheme]) {
    const result = generateReport(input);
    assert.equal(result.kind, 'error');
    assert.equal(result.errorCode, 'INDUSTRY_TRACKING_INSUFFICIENT');
  }
});

test('行业跟踪输出校验拒绝被篡改的 themes', () => {
  const generated = generateReport(request());
  assert.equal(generated.kind, 'success');
  const tampered = structuredClone(generated.report);
  tampered.themes[0].displayName = '被篡改的主题文案';

  const result = validateGeneratedReport(tampered);

  assert.equal(result.ok, false);
  assert.equal(result.error.errorCode, 'OUTPUT_CONTRACT_VIOLATION');
});

test('行业跟踪拒绝缺失每日特别关注的原因、证据或连续天数', () => {
  const missingReason = request();
  delete missingReason.dailyFocusSelections[0].selectionReason;
  const missingEvidence = request();
  missingEvidence.dailyFocusSelections[0].selectionEvidenceIds = [];
  const invalidDays = request();
  invalidDays.dailyFocusSelections[0].consecutiveSelectionDays = 0;

  for (const input of [missingReason, missingEvidence, invalidDays]) {
    const result = generateReport(input);
    assert.equal(result.kind, 'error');
    assert.equal(result.errorCode, 'INDUSTRY_TRACKING_INSUFFICIENT');
  }
});

test('行业跟踪拒绝重复、过期或带凭证的来源', () => {
  const duplicate = request();
  duplicate.sources.push({ ...duplicate.sources[0] });
  const expired = request();
  expired.sources[0].linkStatus = 'expired';
  const credentialed = request();
  credentialed.sources[0].url = 'https://user:password@example.com/source';

  for (const input of [duplicate, expired, credentialed]) {
    const result = generateReport(input);
    assert.equal(result.kind, 'error');
    assert.equal(result.errorCode, 'SOURCE_EVIDENCE_INSUFFICIENT');
  }
});

test('行业跟踪允许来源发布时间晚于来源数据截至时间但两者不晚于报告数据截至', () => {
  const input = request();
  input.sources[0].dataAsOf = '2026-07-29T16:00:00+08:00';
  input.sources[0].publishedAt = '2026-07-30T17:00:00+08:00';

  const result = generateReport(input);

  assert.equal(result.kind, 'success');
});

test('行业跟踪正文单独完整展示来源并标注标的证据引用', () => {
  const generated = generateReport(request());
  assert.equal(generated.kind, 'success');
  const source = generated.report.sources[0];
  const body = generated.report.contentHtml;
  const rendered = renderReportDocument(generated.report);
  assert.equal(rendered.kind, 'success');

  assert.match(body, /固定观察标的：.*证据：S03/u);
  for (const expected of [
    source.sourceId,
    source.title,
    source.publisher,
    source.publishedAt,
    source.dataAsOf,
    source.url,
  ]) {
    assert.ok(body.includes(expected));
  }
  const sourceBody = body.slice(body.indexOf('<h2>数据截至时间、公开来源与风险提示</h2>'));
  assert.equal((sourceBody.match(/<li>/gu) ?? []).length, generated.report.sources.length);
  assert.doesNotMatch(rendered.html, /class="report-sources"/u);
});
