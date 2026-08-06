import {
  createInProgressReadState,
  type ReportDetail,
  type ReportType,
} from '../domain/report'

const riskNotice = '仅供离线界面验证，不构成任何投资建议。'
const pdf = {
  status: 'unavailable',
  reason: '离线样例未提供 PDF 文件',
} as const

interface FixtureInput {
  id: string
  type: ReportType
  title: string
  reportDate: string
  version: string
  publishedAt: string
  dataAsOf: string
  generatedAt: string
  readState: ReportDetail['readState']
  summaryPoints: readonly string[]
  industryIds?: readonly string[]
  themeIds?: readonly string[]
  watchlistSymbols?: readonly string[]
  contentHtml: string
  previousVersion?: ReportDetail['versions'][number]
}

function report(input: FixtureInput): ReportDetail {
  const currentVersion = {
    version: input.version,
    publishedAt: input.publishedAt,
    generatedAt: input.generatedAt,
    contentHtml: input.contentHtml,
  }

  return {
    id: input.id,
    type: input.type,
    title: input.title,
    reportDate: input.reportDate,
    version: input.version,
    publishedAt: input.publishedAt,
    dataAsOf: input.dataAsOf,
    generatedAt: input.generatedAt,
    readState: input.readState,
    summaryPoints: input.summaryPoints,
    industryIds: input.industryIds ?? [],
    themeIds: input.themeIds ?? [],
    watchlistSymbols: input.watchlistSymbols ?? [],
    contentHtml: input.contentHtml,
    riskNotice,
    pdf,
    versions: input.previousVersion
      ? [currentVersion, input.previousVersion]
      : [currentVersion],
  }
}

export const reportFixtures: readonly ReportDetail[] = [
  report({
    id: 'demo-morning-2099-06-18',
    type: 'morning_scan',
    title: '知行虚构早盘扫描｜2099-06-18',
    reportDate: '2099-06-18',
    version: 'v1.0',
    publishedAt: '2099-06-18T09:00:00+08:00',
    dataAsOf: '2099-06-18T08:30:00+08:00',
    generatedAt: '2099-06-18T08:45:00+08:00',
    readState: { kind: 'read' },
    summaryPoints: ['虚构外围线索保持平稳。'],
    industryIds: ['industry-orbit-materials'],
    themeIds: ['theme-alpha'],
    watchlistSymbols: ['DEMO-A01'],
    contentHtml: '<article><h1>虚构早盘扫描</h1><p>正文专用暗号ZX-ONLY-BODY。</p></article>',
  }),
  report({
    id: 'demo-midday-2099-06-18',
    type: 'midday_review',
    title: '知行虚构午间复盘｜2099-06-18',
    reportDate: '2099-06-18',
    version: 'v1.0',
    publishedAt: '2099-06-18T12:30:00+08:00',
    dataAsOf: '2099-06-18T11:45:00+08:00',
    generatedAt: '2099-06-18T12:10:00+08:00',
    readState: createInProgressReadState(42),
    summaryPoints: ['虚构上午观察进入验证阶段。'],
    industryIds: ['industry-deepwave-computing'],
    themeIds: ['theme-alpha'],
    watchlistSymbols: ['DEMO-B02'],
    contentHtml: '<article><h1>虚构午间复盘</h1><p>固定样例验证内容。</p></article>',
  }),
  report({
    id: 'demo-daily-2099-06-18',
    type: 'daily_review',
    title: '知行虚构收盘复盘｜2099-06-18',
    reportDate: '2099-06-18',
    version: 'v1.1',
    publishedAt: '2099-06-18T18:00:00+08:00',
    dataAsOf: '2099-06-18T15:00:00+08:00',
    generatedAt: '2099-06-18T17:30:00+08:00',
    readState: { kind: 'unread' },
    summaryPoints: ['虚构收盘结构出现分化。'],
    industryIds: ['industry-orbit-materials', 'industry-deepwave-computing'],
    themeIds: ['theme-alpha', 'theme-beta'],
    watchlistSymbols: ['DEMO-A01', 'DEMO-B02'],
    contentHtml: '<article><h1>虚构收盘复盘</h1><p>固定样例更新版本。</p></article>',
    previousVersion: {
      version: 'v1.0',
      publishedAt: '2099-06-18T17:50:00+08:00',
      generatedAt: '2099-06-18T17:25:00+08:00',
      contentHtml: '<article><h1>虚构收盘复盘</h1><p>固定样例初始版本。</p></article>',
    },
  }),
  report({
    id: 'demo-industry-tracking-2099-06-18',
    type: 'industry_tracking',
    title: '知行虚构重点行业观察｜2099-06-18',
    reportDate: '2099-06-18',
    version: 'v1.0',
    publishedAt: '2099-06-18T21:00:00+08:00',
    dataAsOf: '2099-06-18T19:30:00+08:00',
    generatedAt: '2099-06-18T19:50:00+08:00',
    readState: { kind: 'unread' },
    summaryPoints: ['虚构重点行业维持混合趋势。'],
    industryIds: [
      'industry-orbit-materials',
      'industry-deepwave-computing',
      'industry-cleanloop-energy',
      'industry-frontier-logistics',
    ],
    themeIds: ['theme-alpha', 'theme-beta'],
    watchlistSymbols: ['DEMO-A01', 'DEMO-B02', 'DEMO-C03', 'DEMO-D04'],
    contentHtml: '<article><h1>虚构重点行业观察</h1><p>固定样例行业跟踪。</p></article>',
  }),
  report({
    id: 'demo-holiday-2099-06-18',
    type: 'holiday_digest',
    title: '知行虚构休市信息摘要｜2099-06-18',
    reportDate: '2099-06-18',
    version: 'v1.0',
    publishedAt: '2099-06-18T21:00:00+08:00',
    dataAsOf: '2099-06-18T20:30:00+08:00',
    generatedAt: '2099-06-18T20:45:00+08:00',
    readState: { kind: 'unread' },
    summaryPoints: ['虚构休市信息完成汇总。'],
    contentHtml: '<article><h1>虚构休市信息摘要</h1><p>固定样例周期内容。</p></article>',
  }),
  report({
    id: 'demo-industry-research-2099-06-10',
    type: 'industry_research',
    title: '知行虚构清环能源专题研究｜2099-06-10',
    reportDate: '2099-06-10',
    version: 'v1.0',
    publishedAt: '2099-06-10T16:00:00+08:00',
    dataAsOf: '2099-06-10T15:00:00+08:00',
    generatedAt: '2099-06-10T15:40:00+08:00',
    readState: { kind: 'read' },
    summaryPoints: ['虚构行业专题完成研究。'],
    industryIds: ['industry-cleanloop-energy'],
    themeIds: ['theme-beta'],
    watchlistSymbols: ['DEMO-D04'],
    contentHtml: '<article><h1>虚构行业专题</h1><p>固定样例专题内容。</p></article>',
  }),
  report({
    id: 'demo-month-end-2099-05-31',
    type: 'month_end_review',
    title: '知行虚构月末复盘｜2099-05-31',
    reportDate: '2099-05-31',
    version: 'v1.0',
    publishedAt: '2099-05-31T21:00:00+08:00',
    dataAsOf: '2099-05-31T20:00:00+08:00',
    generatedAt: '2099-05-31T20:30:00+08:00',
    readState: { kind: 'read' },
    summaryPoints: ['虚构月度结构完成归纳。'],
    industryIds: ['industry-frontier-logistics'],
    watchlistSymbols: ['DEMO-C03'],
    contentHtml: '<article><h1>虚构月末复盘</h1><p>固定样例月度内容。</p></article>',
  }),
]
