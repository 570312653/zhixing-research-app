import type {
  IndustryDetail,
  ResearchTheme,
} from '../domain/research'

export const researchThemes: readonly ResearchTheme[] = [
  { id: 'theme-alpha', displayName: 'Alpha主题' },
  { id: 'theme-beta', displayName: 'Beta主题' },
]

export const industryFixtures: readonly IndustryDetail[] = [
  {
    id: 'industry-orbit-materials',
    displayName: '轨道材料',
    industryTags: ['虚构材料'],
    trendState: 'warming',
    themeIds: ['theme-alpha'],
    reportIds: [
      'demo-morning-2099-06-18',
      'demo-daily-2099-06-18',
      'demo-industry-tracking-2099-06-18',
    ],
    watchlistSymbols: ['DEMO-A01'],
    updatedAt: '2099-06-18T20:10:00+08:00',
    thesis: '虚构的材料需求线索正在升温，仍需后续固定样例验证。',
    supportingEvidence: [
      {
        id: 'evidence-orbit-support',
        title: '虚构需求观察值改善',
        observedAt: '2099-06-18T19:30:00+08:00',
        direction: 'supporting',
      },
    ],
    counterEvidence: [],
    timeline: [
      {
        id: 'timeline-orbit-warming',
        occurredAt: '2099-06-18T20:10:00+08:00',
        trendState: 'warming',
        note: '固定样例由继续转为升温。',
      },
    ],
  },
  {
    id: 'industry-deepwave-computing',
    displayName: '深波计算',
    industryTags: ['虚构计算'],
    trendState: 'continuing',
    themeIds: ['theme-alpha', 'theme-beta'],
    reportIds: [
      'demo-midday-2099-06-18',
      'demo-daily-2099-06-18',
      'demo-industry-tracking-2099-06-18',
    ],
    watchlistSymbols: ['DEMO-B02'],
    updatedAt: '2099-06-18T20:11:00+08:00',
    thesis: '虚构的计算景气线索保持延续。',
    supportingEvidence: [
      {
        id: 'evidence-deepwave-support',
        title: '虚构订单观察值保持',
        observedAt: '2099-06-18T19:31:00+08:00',
        direction: 'supporting',
      },
    ],
    counterEvidence: [],
    timeline: [
      {
        id: 'timeline-deepwave-continuing',
        occurredAt: '2099-06-18T20:11:00+08:00',
        trendState: 'continuing',
        note: '固定样例维持延续。',
      },
    ],
  },
  {
    id: 'industry-cleanloop-energy',
    displayName: '清环能源',
    industryTags: ['虚构能源'],
    trendState: 'cooling',
    themeIds: ['theme-beta'],
    reportIds: [
      'demo-industry-tracking-2099-06-18',
      'demo-industry-research-2099-06-10',
    ],
    watchlistSymbols: ['DEMO-D04'],
    updatedAt: '2099-06-18T20:12:00+08:00',
    thesis: '虚构的能源观察值有所降温。',
    supportingEvidence: [],
    counterEvidence: [
      {
        id: 'evidence-cleanloop-counter',
        title: '虚构供需观察值回落',
        observedAt: '2099-06-18T19:32:00+08:00',
        direction: 'counter',
      },
    ],
    timeline: [
      {
        id: 'timeline-cleanloop-cooling',
        occurredAt: '2099-06-18T20:12:00+08:00',
        trendState: 'cooling',
        note: '固定样例进入降温。',
      },
    ],
  },
  {
    id: 'industry-frontier-logistics',
    displayName: '前沿物流',
    industryTags: ['虚构物流'],
    trendState: 'insufficient',
    themeIds: [],
    reportIds: [
      'demo-industry-tracking-2099-06-18',
      'demo-month-end-2099-05-31',
    ],
    watchlistSymbols: ['DEMO-C03'],
    updatedAt: '2099-06-18T20:13:00+08:00',
    thesis: '虚构证据不足，暂不形成趋势结论。',
    supportingEvidence: [],
    counterEvidence: [],
    timeline: [
      {
        id: 'timeline-frontier-insufficient',
        occurredAt: '2099-06-18T20:13:00+08:00',
        trendState: 'insufficient',
        note: '固定样例保持证据不足。',
      },
    ],
  },
]
