import test from 'node:test';
import assert from 'node:assert/strict';
import { generateReport, validateHtmlPolicy } from '../dist/index.js';
import { validateGeneratedReport } from '../dist/contract.js';
import { renderPdf } from '../dist/pdf.js';

const evidence = [
  {
    title: '测试来源',
    url: 'https://example.com/source',
    publishedAt: '2026-07-28T08:00:00+08:00',
  },
];

const middayPriorAssessments = [
  {
    reportId: 'morning-2026-07-28-v1.0',
    reportDate: '2026-07-28',
    reportType: 'morning_scan',
    originalJudgement: '外围波动需要由 A 股上午表现继续验证。',
    status: '部分验证',
    validationEvidence: evidence,
  },
  {
    reportId: 'daily-2026-07-25-v1.0',
    reportDate: '2026-07-25',
    reportType: 'daily_review',
    originalJudgement: '量能变化仍需下一交易日观察。',
    status: '未验证',
    validationEvidence: [],
  },
];

test('用完整固定证据生成一份早盘扫描', () => {
  const result = generateReport({
    reportType: 'morning_scan',
    reportDate: '2026-07-28',
    evidence,
  });

  assert.equal(result.kind, 'success');
  assert.equal(Array.isArray(result.report), false);
  assert.equal(result.report.reportType, 'morning_scan');
  assert.equal(result.report.title, '早盘扫描｜2026-07-28｜v1.0');
  assert.equal(result.report.sourceLinks.length, 1);
  assert.match(result.report.contentHtml, /^<article>/);
  assert.match(result.report.contentHtml, /仅供信息参考，不构成投资建议/);
});

test('用完整固定证据生成一份午间复盘', () => {
  const result = generateReport({
    reportType: 'midday_review',
    reportDate: '2026-07-28',
    evidence,
    priorAssessments: middayPriorAssessments,
  });

  assert.equal(result.kind, 'success');
  assert.equal(result.report.reportType, 'midday_review');
  assert.equal(result.report.title, '午间小复盘｜2026-07-28｜v1.0');
  assert.equal(result.report.priorAssessments.length, 2);
  assert.match(result.report.contentHtml, /<table>/);
  assert.match(result.report.contentHtml, /data-label="原报告日期"/);
  assert.match(result.report.contentHtml, /data-label="报告 ID"/);
  assert.match(result.report.contentHtml, /data-label="原判断"/);
  assert.match(result.report.contentHtml, /data-label="状态"/);
  assert.match(result.report.contentHtml, /morning-2026-07-28-v1\.0/);
  assert.match(result.report.contentHtml, /部分验证/);
  assert.match(result.report.contentHtml, /仅供信息参考，不构成投资建议/);
});

test('午间复盘转义动态判断文本且不把来源 URL 拼进 HTML', () => {
  const result = generateReport({
    reportType: 'midday_review',
    reportDate: '2026-07-28',
    evidence,
    priorAssessments: [
      {
        ...middayPriorAssessments[0],
        reportId: 'morning-<&"\'',
        originalJudgement: '判断包含 <script>alert("x")</script> & 引号\'。',
      },
      middayPriorAssessments[1],
    ],
  });

  assert.equal(result.kind, 'success');
  assert.match(result.report.contentHtml, /morning-&lt;&amp;&quot;&#39;/);
  assert.match(
    result.report.contentHtml,
    /判断包含 &lt;script&gt;alert\(&quot;x&quot;\)&lt;\/script&gt; &amp; 引号&#39;。/,
  );
  assert.doesNotMatch(result.report.contentHtml, /https:\/\/example\.com\/source/);
});

for (const originalJudgement of [
  '用户持有某股并盈利 10%。',
  '我持有某股。',
  '你持有某股。',
  '您持有某股。',
  '我盈利 10%。',
  '你亏损 5%。',
  '我的持仓仍有浮动。',
  '您的盈亏信息。',
  '你 的亏损达到 5%。',
  '立即加仓某股。',
  '建议减仓某股。',
  '请清仓某股。',
]) {
  test(`拒绝午间判断中的个性化持仓或交易指令：${originalJudgement}`, () => {
    const result = generateReport({
      reportType: 'midday_review',
      reportDate: '2026-07-28',
      evidence,
      priorAssessments: [
        { ...middayPriorAssessments[0], originalJudgement },
        middayPriorAssessments[1],
      ],
    });

    assert.equal(result.kind, 'error');
    assert.equal(result.errorCode, 'COMPLIANCE_VIOLATION');
  });
}

for (const priorAssessments of [
  [],
  [middayPriorAssessments[0]],
  [middayPriorAssessments[1]],
  [{ ...middayPriorAssessments[0], reportDate: '2026-07-27' }, middayPriorAssessments[1]],
  [middayPriorAssessments[0], { ...middayPriorAssessments[1], reportDate: '2026-07-28' }],
  [{ ...middayPriorAssessments[0], status: '错误状态' }, middayPriorAssessments[1]],
  [{ ...middayPriorAssessments[0], originalJudgement: '' }, middayPriorAssessments[1]],
  [{ ...middayPriorAssessments[0], validationEvidence: [] }, middayPriorAssessments[1]],
]) {
  test('拒绝不完整或不可追溯的午间判断验证记录', () => {
    const result = generateReport({
      reportType: 'midday_review',
      reportDate: '2026-07-28',
      evidence,
      priorAssessments,
    });

    assert.equal(result.kind, 'error');
    assert.equal(result.errorCode, 'PRIOR_ASSESSMENT_INSUFFICIENT');
  });
}

test('拒绝未实现的报告类型', () => {
  const result = generateReport({
    reportType: 'industry_research',
    reportDate: '2026-07-28',
    evidence,
  });

  assert.equal(result.kind, 'error');
  assert.equal(result.errorCode, 'UNSUPPORTED_REPORT_TYPE');
});

test('拒绝空报告日期', () => {
  const result = generateReport({
    reportType: 'morning_scan',
    reportDate: '',
    evidence,
  });

  assert.equal(result.kind, 'error');
  assert.equal(result.errorCode, 'INVALID_REPORT_DATE');
});

test('拒绝不存在的公历日期', () => {
  const result = generateReport({
    reportType: 'morning_scan',
    reportDate: '2026-02-31',
    evidence,
  });

  assert.deepEqual(result, {
    kind: 'error',
    errorCode: 'INVALID_REPORT_DATE',
    message: 'reportDate 必须是实际存在的 YYYY-MM-DD 日期。',
  });
});

test('拒绝没有来源证据的请求', () => {
  const result = generateReport({
    reportType: 'morning_scan',
    reportDate: '2026-07-28',
    evidence: [],
  });

  assert.equal(result.kind, 'error');
  assert.equal(result.errorCode, 'SOURCE_EVIDENCE_INSUFFICIENT');
});

for (const invalidEvidence of [
  [{ title: '来源', url: 'http://example.com', publishedAt: '2026-07-28T08:00:00+08:00' }],
  [{ title: '', url: 'https://example.com', publishedAt: '2026-07-28T08:00:00+08:00' }],
  [{ title: '来源', url: 'not-a-url', publishedAt: '2026-07-28T08:00:00+08:00' }],
  [{ title: '来源', url: 'https://example.com', publishedAt: 'not-a-time' }],
]) {
  test('拒绝不完整或不可追溯的来源', () => {
    const result = generateReport({
      reportType: 'morning_scan',
      reportDate: '2026-07-28',
      evidence: invalidEvidence,
    });

    assert.equal(result.kind, 'error');
    assert.equal(result.errorCode, 'SOURCE_EVIDENCE_INSUFFICIENT');
  });
}

test('拒绝包含交易建议的草稿 HTML', () => {
  const result = generateReport({
    reportType: 'morning_scan',
    reportDate: '2026-07-28',
    evidence,
    draftHtml: '<article><p>建议买入测试标的。</p></article>',
  });

  assert.equal(result.kind, 'error');
  assert.equal(result.errorCode, 'COMPLIANCE_VIOLATION');
});

test('允许非个人化市场研究使用持仓盈利和加仓等术语', () => {
  const result = generateReport({
    reportType: 'morning_scan',
    reportDate: '2026-07-28',
    evidence,
    draftHtml:
      '<article><p>市场持仓结构、企业盈利变化与机构加仓行为仅用于非个人化研究。</p></article>',
  });

  assert.equal(result.kind, 'success');
});

for (const draftHtml of [
  '<article><script>alert(1)</script></article>',
  '<article><p onclick="alert(1)">正文</p></article>',
  '<article><p class="lead">正文</p></article>',
  '<article><p style="color:red">正文</p></article>',
  '<article><a href="http://example.com">来源</a></article>',
  '<article><img src="https://example.com/a.png"></article>',
  '<article><p>未闭合</article>',
]) {
  test('拒绝不安全或结构不完整的 HTML', () => {
    const result = generateReport({
      reportType: 'morning_scan',
      reportDate: '2026-07-28',
      evidence,
      draftHtml,
    });

    assert.equal(result.kind, 'error');
    assert.equal(result.errorCode, 'UNSAFE_HTML');
  });
}

test('允许限定标签和 HTTPS 来源链接', () => {
  const html =
    '<article><h1>早盘</h1><p><a href="https://example.com/source">来源</a></p></article>';
  const policyResult = validateHtmlPolicy(html);
  const reportResult = generateReport({
    reportType: 'morning_scan',
    reportDate: '2026-07-28',
    evidence,
    draftHtml: html,
  });

  assert.equal(policyResult.ok, true);
  assert.equal(reportResult.kind, 'success');
});

test('允许无属性的判断验证表格', () => {
  const result = validateHtmlPolicy(
    '<article><table><thead><tr><th>状态</th></tr></thead><tbody><tr><td>未验证</td></tr></tbody></table></article>',
  );

  assert.equal(result.ok, true);
});

test('允许 td 使用安全的 data-label 供手机卡片显示', () => {
  const result = validateHtmlPolicy(
    '<table><tbody><tr><td data-label="状态">未验证</td></tr></tbody></table>',
  );

  assert.equal(result.ok, true);
});

for (const html of [
  '<table><tbody><tr><td data-label="状态" onclick="alert(1)">未验证</td></tr></tbody></table>',
  '<table><tbody><tr><td data-label="<script>">未验证</td></tr></tbody></table>',
  '<table><tbody><tr><td data-label="&#34;">未验证</td></tr></tbody></table>',
  '<table><tbody><tr><td data-label="&quot;">未验证</td></tr></tbody></table>',
  '<table><tbody><tr><td data-label="&#x0A;">未验证</td></tr></tbody></table>',
  '<table><thead><tr><th data-label="状态">状态</th></tr></thead></table>',
]) {
  test('拒绝不受控的 data-label 或附加属性', () => {
    const result = validateHtmlPolicy(html);

    assert.equal(result.ok, false);
    assert.equal(result.errorCode, 'UNSAFE_HTML');
  });
}

test('拒绝判断验证表格上的危险属性', () => {
  const result = validateHtmlPolicy(
    '<article><table class="data"><tr><td>正文</td></tr></table></article>',
  );

  assert.equal(result.ok, false);
  assert.equal(result.errorCode, 'UNSAFE_HTML');
});

test('拒绝缺少标题的成功报告对象', () => {
  const result = validateGeneratedReport({ reportType: 'morning_scan' });

  assert.equal(result.ok, false);
  assert.equal(result.error.errorCode, 'OUTPUT_CONTRACT_VIOLATION');
});

test('拒绝正文包含危险 HTML 的成功报告对象', () => {
  const result = validateGeneratedReport({
    reportType: 'morning_scan',
    reportDate: '2026-07-28',
    title: '早盘扫描｜2026-07-28｜v1.0',
    version: 'v1.0',
    dataAsOf: '2026-07-28T08:00:00+08:00',
    sourceLinks: evidence,
    contentHtml: '<article><script>alert(1)</script></article>',
  });

  assert.equal(result.ok, false);
  assert.equal(result.error.errorCode, 'UNSAFE_HTML');
});

for (const contentHtml of [
  '<article><p>&#24314;&#35758;&#20080;&#20837;</p></article>',
  '<article><p>&#x5EFA;&#x8BAE;&#x4E70;&#x5165;</p></article>',
  '<article><p>&#24314&#35758&#20080&#20837</p></article>',
  '<article><p>&#x5EFA&#x8BAE&#x4E70&#x5165</p></article>',
  '<article><p>&#x110000;&#24314;&#35758;&#20080;&#20837;</p></article>',
]) {
  test('拒绝数值实体编码的交易指令', () => {
    const result = validateGeneratedReport({
      reportType: 'morning_scan',
      reportDate: '2026-07-28',
      title: '早盘扫描｜2026-07-28｜v1.0',
      version: 'v1.0',
      dataAsOf: '2026-07-28T08:00:00+08:00',
      sourceLinks: evidence,
      contentHtml,
    });

    assert.equal(result.ok, false);
    assert.equal(result.error.errorCode, 'COMPLIANCE_VIOLATION');
  });
}

test('不将转义后的数值实体字面量重复解码', () => {
  const result = validateHtmlPolicy(
    '<article><p>&amp;#24314;&amp;#35758;&amp;#20080;&amp;#20837;</p></article>',
  );

  assert.equal(result.ok, true);
});

test('午间复盘输出校验拒绝违规的原判断', () => {
  const result = validateGeneratedReport({
    reportType: 'midday_review',
    reportDate: '2026-07-28',
    title: '午间小复盘｜2026-07-28｜v1.0',
    version: 'v1.0',
    dataAsOf: '2026-07-28T11:30:00+08:00',
    sourceLinks: evidence,
    contentHtml: '<article><p>非个人化市场研究。</p></article>',
    priorAssessments: [
      {
        ...middayPriorAssessments[0],
        originalJudgement: '我持有某股并盈利10%',
      },
      middayPriorAssessments[1],
    ],
  });

  assert.equal(result.ok, false);
  assert.equal(result.error.errorCode, 'COMPLIANCE_VIOLATION');
});

test('午间复盘输出缺少判断验证记录时拒绝', () => {
  const result = validateGeneratedReport({
    reportType: 'midday_review',
    reportDate: '2026-07-28',
    title: '午间小复盘｜2026-07-28｜v1.0',
    version: 'v1.0',
    dataAsOf: '2026-07-28T11:30:00+08:00',
    sourceLinks: evidence,
    contentHtml: '<article><p>测试</p></article>',
  });

  assert.equal(result.ok, false);
  assert.equal(result.error.errorCode, 'PRIOR_ASSESSMENT_INSUFFICIENT');
});

const dailyEvidence = [
  {
    title: '日终固定来源',
    url: 'https://example.com/daily-source',
    publishedAt: '2026-07-28T15:30:00+08:00',
  },
];

const dailyPriorAssessments = [
  {
    reportId: 'morning-2026-07-28-v1.0',
    reportDate: '2026-07-28',
    reportType: 'morning_scan',
    originalJudgement: '早盘的固定观察需要由全天信息继续验证。',
    status: '部分验证',
    validationEvidence: evidence,
  },
  {
    reportId: 'midday-2026-07-28-v1.0',
    reportDate: '2026-07-28',
    reportType: 'midday_review',
    originalJudgement: '午间的固定观察需要在收盘后继续验证。',
    status: '未验证',
    validationEvidence: [],
  },
];

function dailyRequest(overrides = {}) {
  return {
    reportType: 'daily_review',
    reportDate: '2026-07-28',
    dataAsOf: '2026-07-28T16:00:00+08:00',
    evidence: dailyEvidence,
    priorAssessments: dailyPriorAssessments,
    ...overrides,
  };
}

test('用固定证据和同日早盘午间判断生成每日复盘', () => {
  const result = generateReport(dailyRequest());

  assert.equal(result.kind, 'success');
  assert.equal(result.report.reportType, 'daily_review');
  assert.equal(result.report.title, '每日复盘｜2026-07-28｜v1.0');
  assert.deepEqual(result.report.marketScopes, ['cn_a']);
  assert.equal(result.report.dataAsOf, '2026-07-28T16:00:00+08:00');
  assert.equal(result.report.priorAssessments.length, 2);
  assert.match(result.report.contentHtml, /一句话总览/);
  assert.match(result.report.contentHtml, /当日判断验证表/);
  assert.match(result.report.contentHtml, /data-label="原报告日期"/);
  assert.match(result.report.contentHtml, /data-label="报告 ID"/);
  assert.match(result.report.contentHtml, /data-label="原判断"/);
  assert.match(result.report.contentHtml, /data-label="状态"/);
  assert.match(result.report.contentHtml, /仅供信息参考，不构成投资建议/);
});

for (const priorAssessments of [
  [dailyPriorAssessments[0]],
  [dailyPriorAssessments[1]],
]) {
test('每日复盘缺少同日前序判断时失败关闭', () => {
    const result = generateReport(dailyRequest({ priorAssessments }));

    assert.equal(result.kind, 'error');
    assert.equal(result.errorCode, 'PRIOR_ASSESSMENT_INSUFFICIENT');
    assert.equal(
      result.message,
      '每日复盘必须包含可追溯的当日早盘和同日午间复盘判断验证记录。',
    );
  });
}

for (const priorAssessments of [
  [{ ...dailyPriorAssessments[0], reportDate: '2026-07-27' }, dailyPriorAssessments[1]],
  [{ ...dailyPriorAssessments[0], reportType: 'daily_review' }, dailyPriorAssessments[1]],
  [dailyPriorAssessments[0], { ...dailyPriorAssessments[1], reportType: 'daily_review' }],
]) {
  test('每日复盘拒绝日期或类型错误以及自引用的前序判断', () => {
    const result = generateReport(dailyRequest({ priorAssessments }));

    assert.equal(result.kind, 'error');
    assert.equal(result.errorCode, 'PRIOR_ASSESSMENT_INSUFFICIENT');
  });
}

test('每日复盘拒绝重复的前序报告 ID', () => {
  const result = generateReport(
    dailyRequest({
      priorAssessments: [
        dailyPriorAssessments[0],
        { ...dailyPriorAssessments[1], reportId: dailyPriorAssessments[0].reportId },
      ],
    }),
  );

  assert.equal(result.kind, 'error');
  assert.equal(result.errorCode, 'PRIOR_ASSESSMENT_INSUFFICIENT');
});

test('每日复盘允许早于报告日的历史每日复盘判断', () => {
  const result = generateReport(
    dailyRequest({
      priorAssessments: [
        ...dailyPriorAssessments,
        {
          reportId: 'daily-2026-07-25-v1.0',
          reportDate: '2026-07-25',
          reportType: 'daily_review',
          originalJudgement: '历史固定观察仅用于后续验证链路。',
          status: '未验证',
          validationEvidence: [],
        },
      ],
    }),
  );

  assert.equal(result.kind, 'success');
  assert.equal(result.report.priorAssessments.length, 3);
});

for (const reportDate of ['2026-07-28', '2026-07-29']) {
  test('每日复盘拒绝同日或未来的 daily_review 前序', () => {
    const result = generateReport(
      dailyRequest({
        priorAssessments: [
          ...dailyPriorAssessments,
          {
            reportId: `daily-${reportDate}-v1.0`,
            reportDate,
            reportType: 'daily_review',
            originalJudgement: '不应作为当前每日复盘的前序记录。',
            status: '未验证',
            validationEvidence: [],
          },
        ],
      }),
    );

    assert.equal(result.kind, 'error');
    assert.equal(result.errorCode, 'PRIOR_ASSESSMENT_INSUFFICIENT');
  });
}

test('午间复盘仍拒绝 midday_review 作为前序判断', () => {
  const result = generateReport({
    reportType: 'midday_review',
    reportDate: '2026-07-28',
    evidence,
    priorAssessments: [
      ...middayPriorAssessments,
      {
        reportId: 'midday-2026-07-28-v1.0',
        reportDate: '2026-07-28',
        reportType: 'midday_review',
        originalJudgement: '午间记录不能作为午间复盘的前序。',
        status: '未验证',
        validationEvidence: [],
      },
    ],
  });

  assert.equal(result.kind, 'error');
  assert.equal(result.errorCode, 'PRIOR_ASSESSMENT_INSUFFICIENT');
});

for (const request of [
  dailyRequest({ dataAsOf: '2026-07-27T16:00:00+08:00' }),
  dailyRequest({ dataAsOf: undefined }),
  dailyRequest({
    evidence: [
      { ...dailyEvidence[0], publishedAt: '2026-07-28T16:01:00+08:00' },
    ],
  }),
]) {
  test('每日复盘拒绝不匹配的数据截至时间或晚于其的证据', () => {
    const result = generateReport(request);

    assert.equal(result.kind, 'error');
    assert.ok(
      result.errorCode === 'INVALID_REQUEST' ||
        result.errorCode === 'SOURCE_EVIDENCE_INSUFFICIENT',
    );
  });
}

test('每日复盘按 Asia/Shanghai 接受同一自然日的其他时区 dataAsOf', () => {
  const result = generateReport(
    dailyRequest({
      dataAsOf: '2026-07-27T20:00:00-04:00',
      evidence: [
        { ...dailyEvidence[0], publishedAt: '2026-07-28T07:30:00+08:00' },
      ],
    }),
  );

  assert.equal(result.kind, 'success');
});

test('每日复盘按 Asia/Shanghai 拒绝跨到次日的其他时区 dataAsOf', () => {
  const result = generateReport(
    dailyRequest({ dataAsOf: '2026-07-28T23:30:00-04:00' }),
  );

  assert.equal(result.kind, 'error');
  assert.equal(result.errorCode, 'INVALID_REQUEST');
});

test('每日复盘拒绝调用方提供的 draftHtml', () => {
  const result = generateReport(
    dailyRequest({ draftHtml: '<article><p>调用方正文</p></article>' }),
  );

  assert.equal(result.kind, 'error');
  assert.equal(result.errorCode, 'INVALID_REQUEST');
});

test('每日复盘拒绝违规的前序判断', () => {
  const result = generateReport(
    dailyRequest({
      priorAssessments: [
        { ...dailyPriorAssessments[0], originalJudgement: '建议买入某股票。' },
        dailyPriorAssessments[1],
      ],
    }),
  );

  assert.equal(result.kind, 'error');
  assert.equal(result.errorCode, 'COMPLIANCE_VIOLATION');
});

test('每日复盘输出校验拒绝危险 HTML', () => {
  const result = validateGeneratedReport({
    reportType: 'daily_review',
    reportDate: '2026-07-28',
    title: '每日复盘｜2026-07-28｜v1.0',
    version: 'v1.0',
    dataAsOf: '2026-07-28T16:00:00+08:00',
    sourceLinks: dailyEvidence,
    marketScopes: ['cn_a'],
    priorAssessments: dailyPriorAssessments,
    contentHtml: '<article><script>alert(1)</script></article>',
  });

  assert.equal(result.ok, false);
  assert.equal(result.error.errorCode, 'UNSAFE_HTML');
});

test('每日复盘输出校验拒绝缺失固定市场范围或错误数据截至时间', () => {
  const result = validateGeneratedReport({
    reportType: 'daily_review',
    reportDate: '2026-07-28',
    title: '每日复盘｜2026-07-28｜v1.0',
    version: 'v1.0',
    dataAsOf: '2026-07-27T16:00:00+08:00',
    sourceLinks: dailyEvidence,
    priorAssessments: dailyPriorAssessments,
    contentHtml: '<article><p>固定离线样例正文。</p></article>',
  });

  assert.equal(result.ok, false);
  assert.equal(result.error.errorCode, 'OUTPUT_CONTRACT_VIOLATION');
});

const completeDailyOutputHtml = [
  '<article>',
  '<h1>每日复盘</h1>',
  '<h2>一句话总览</h2><p>固定离线样例。</p>',
  '<h2>市场表现</h2><p>固定离线样例。</p>',
  '<h2>主线与板块</h2><p>固定离线样例。</p>',
  '<h2>重要事件与公告</h2><p>固定离线样例。</p>',
  '<h2>情绪与结构观察</h2><p>固定离线样例。</p>',
  '<h2>当日判断验证表</h2><table><tbody><tr><td>固定记录</td></tr></tbody></table>',
  '<h2>次日观察清单</h2><ul><li>固定离线样例。</li></ul>',
  '<p>仅供信息参考，不构成投资建议。</p>',
  '</article>',
].join('');

function dailyOutput(overrides = {}) {
  return {
    reportType: 'daily_review',
    reportDate: '2026-07-28',
    title: '每日复盘｜2026-07-28｜v1.0',
    version: 'v1.0',
    dataAsOf: '2026-07-28T16:00:00+08:00',
    sourceLinks: dailyEvidence,
    marketScopes: ['cn_a'],
    priorAssessments: dailyPriorAssessments,
    contentHtml: completeDailyOutputHtml,
    ...overrides,
  };
}

test('每日复盘输出校验拒绝错误标题', () => {
  const result = validateGeneratedReport(
    dailyOutput({ title: '每日复盘｜2026-07-28｜v1.1' }),
  );

  assert.equal(result.ok, false);
  assert.equal(result.error.errorCode, 'OUTPUT_CONTRACT_VIOLATION');
});

for (const heading of [
  '<h1>每日复盘</h1>',
  '<h2>一句话总览</h2>',
  '<h2>市场表现</h2>',
  '<h2>主线与板块</h2>',
  '<h2>重要事件与公告</h2>',
  '<h2>情绪与结构观察</h2>',
  '<h2>当日判断验证表</h2>',
  '<h2>次日观察清单</h2>',
]) {
  test('每日复盘输出校验拒绝缺少确认栏目的安全 HTML', () => {
    const result = validateGeneratedReport(
      dailyOutput({ contentHtml: completeDailyOutputHtml.replace(heading, '') }),
    );

    assert.equal(result.ok, false);
    assert.equal(result.error.errorCode, 'OUTPUT_CONTRACT_VIOLATION');
  });
}

test('每日复盘输出校验拒绝没有末尾固定风险提示的安全 HTML', () => {
  const result = validateGeneratedReport(
    dailyOutput({
      contentHtml: completeDailyOutputHtml.replace(
        '<p>仅供信息参考，不构成投资建议。</p>',
        '<p>固定离线样例结束。</p>',
      ),
    }),
  );

  assert.equal(result.ok, false);
  assert.equal(result.error.errorCode, 'OUTPUT_CONTRACT_VIOLATION');
});

test('每日复盘输出校验按 Asia/Shanghai 拒绝跨到次日的 dataAsOf', () => {
  const result = validateGeneratedReport(
    dailyOutput({ dataAsOf: '2026-07-28T23:30:00-04:00' }),
  );

  assert.equal(result.ok, false);
  assert.equal(result.error.errorCode, 'OUTPUT_CONTRACT_VIOLATION');
});

test('未配置 Chromium 渲染器时明确拒绝导出 PDF', async () => {
  const result = await renderPdf('<article><p>测试报告</p></article>');

  assert.equal(result.kind, 'error');
  assert.equal(result.errorCode, 'PDF_RENDERER_UNAVAILABLE');
});
