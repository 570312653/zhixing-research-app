const sourceTime = '2026-07-30T18:00:00+08:00';

const sources = [
  {
    sourceId: 'S01',
    title: '固定离线行业观察来源一',
    publisher: '离线测试发布方',
    publishedAt: '2026-07-30T15:00:00+08:00',
    dataAsOf: sourceTime,
    url: 'https://example.com/industry/S01',
    linkStatus: 'valid',
    context: '仅用于固定夹具的行业维度核对。',
  },
  {
    sourceId: 'S02',
    title: '固定离线行业观察来源二',
    publisher: '离线测试发布方',
    publishedAt: '2026-07-30T16:00:00+08:00',
    dataAsOf: sourceTime,
    url: 'https://example.com/industry/S02',
    linkStatus: 'valid',
    context: '仅用于固定夹具的趋势一致性核对。',
  },
  {
    sourceId: 'S03',
    title: '固定离线行业观察来源三',
    publisher: '离线测试发布方',
    publishedAt: '2026-07-30T17:00:00+08:00',
    dataAsOf: sourceTime,
    url: 'https://example.com/industry/S03',
    linkStatus: 'valid',
    context: '仅用于固定夹具的特别关注与标的观察核对。',
  },
];

const coreFocusConfig = [
  ['ai_plus', '人工智能+', '计算机', ['计算机', '电子', '传媒']],
  ['advanced_chips', '高端芯片', '电子', ['电子', '计算机']],
  ['computing_network', '算力网', '计算机', ['计算机', '通信', '电子']],
  ['data_elements', '数据要素', '计算机', ['计算机', '传媒']],
  ['six_g', '6G 通信', '通信', ['通信', '电子']],
  ['intelligent_connected_nev', '智能网联新能源车', '汽车', ['汽车', '电子', '计算机']],
  ['new_energy_equipment', '新能源装备', '电力设备', ['电力设备', '机械设备']],
  ['embodied_intelligence', '具身智能', '机械设备', ['机械设备', '计算机', '电子']],
].map(([focusId, displayName, primaryIndustryTag, industryTags]) => ({
  focusId,
  displayName,
  primaryIndustryTag,
  industryTags,
}));

const dailyFocusCandidateConfig = [
  ['quantum_technology', '量子科技', '计算机', ['计算机', '电子', '通信']],
  ['biomanufacturing', '生物制造', '基础化工', ['基础化工', '医药生物']],
  ['brain_computer_interface', '脑机接口', '计算机', ['计算机', '电子', '医药生物']],
  ['hydrogen_fusion', '氢能核聚变', '电力设备', ['电力设备', '机械设备', '基础化工']],
  ['new_materials', '新材料', '基础化工', ['基础化工', '电子']],
  ['robotics', '机器人', '机械设备', ['机械设备', '计算机', '电子']],
  ['five_g_advanced', '5G-A', '通信', ['通信', '电子']],
  ['satellite_internet', '卫星互联网', '通信', ['通信', '电子', '国防军工']],
].map(([focusId, displayName, primaryIndustryTag, industryTags]) => ({
  focusId,
  displayName,
  primaryIndustryTag,
  industryTags,
}));

const themeConfig = [
  {
    themeId: 'ai_infrastructure',
    displayName: 'AI 基础设施',
    focusIds: ['ai_plus', 'advanced_chips', 'computing_network'],
    industryTags: ['计算机', '电子', '传媒', '通信'],
  },
  {
    themeId: 'intelligent_hardware_robotics',
    displayName: '智能硬件与机器人',
    focusIds: ['advanced_chips', 'embodied_intelligence', 'robotics', 'brain_computer_interface'],
    industryTags: ['电子', '计算机', '机械设备', '医药生物'],
  },
  {
    themeId: 'digital_infrastructure',
    displayName: '数字基础设施',
    focusIds: ['computing_network', 'data_elements', 'six_g', 'five_g_advanced', 'satellite_internet'],
    industryTags: ['计算机', '通信', '电子', '传媒', '国防军工'],
  },
  {
    themeId: 'green_mobility_new_energy_equipment',
    displayName: '绿色出行与新能源装备',
    focusIds: ['intelligent_connected_nev', 'new_energy_equipment', 'hydrogen_fusion'],
    industryTags: ['汽车', '电子', '计算机', '电力设备', '机械设备', '基础化工'],
  },
];

const dimensions = [
  'market_relative_strength',
  'trading_activity',
  'industry_fundamentals',
  'policy_technology_events',
  'representative_breadth',
  'risk_reverse_signals',
];

function availableDimensions(directions = ['up']) {
  return dimensions.map((dimension, index) => ({
    dimension,
    status: 'available',
    conclusion: '固定离线夹具仅记录显式提供的观察，不推断真实趋势。',
    indicatorChanges: [
      {
        metricName: `固定观察维度 ${index + 1}`,
        changeDirection: directions[index % directions.length],
        comparisonWindow: index % 2 === 0 ? 'previous_trading_day' : 'trailing_5_trading_days',
        evidenceIds: [index % 2 === 0 ? 'S01' : 'S02'],
        qualitativeObservation: '仅用于离线夹具的结构核对。',
      },
    ],
  }));
}

function insufficientDimensions() {
  return dimensions.map((dimension) => ({
    dimension,
    status: 'data_insufficient',
    missingReason: '固定离线夹具未提供该维度的可用证据。',
  }));
}

function section(config, options = {}) {
  return {
    focusId: config.focusId,
    displayName: config.displayName,
    role: options.role ?? 'core',
    industryTags: config.industryTags,
    themeIds: options.themeIds ?? [],
    ...(options.highlightReason ? { highlightReason: options.highlightReason } : {}),
    dimensions: options.dimensions ?? insufficientDimensions(),
    overallStatus: options.overallStatus ?? 'insufficient',
    evidenceQuality: options.evidenceQuality ?? 'insufficient',
    signalConsistency: options.signalConsistency ?? 'consistent',
    keyChanges: options.keyChanges ?? ['固定离线夹具不陈述真实市场事实。'],
    catalysts: options.catalysts ?? ['后续仅核对调用方显式提供的公开证据。'],
    risks: options.risks ?? ['证据不足时不形成趋势结论。'],
    nextObservations: options.nextObservations ?? ['下一交易日继续核对公开证据是否完整。'],
    stockObservations: options.stockObservations ?? [],
    deepResearchUpdate: options.deepResearchUpdate ?? { kind: 'no_new_deep_conclusion' },
    ...(options.priorJudgementAudits ? { priorJudgementAudits: options.priorJudgementAudits } : {}),
  };
}

export function createIndustryTrackingRequest() {
  const byId = new Map(coreFocusConfig.map((item) => [item.focusId, item]));
  const robotics = dailyFocusCandidateConfig.find((item) => item.focusId === 'robotics');

  return structuredClone({
    reportType: 'industry_tracking',
    reportDate: '2026-07-30',
    dataAsOf: sourceTime,
    coreFocusConfig,
    dailyFocusCandidateConfig,
    dailyFocusSelections: [
      {
        ...robotics,
        selectionReason: '固定离线夹具的特别关注示例。',
        selectionEvidenceIds: ['S03'],
        firstSelectedDate: '2026-07-29',
        consecutiveSelectionDays: 2,
      },
    ],
    exitedDailyFocus: [],
    themeConfig,
    selectedThemeIds: ['ai_infrastructure'],
    industries: [
      section(byId.get('ai_plus'), {
        themeIds: ['ai_infrastructure'],
        highlightReason: '固定夹具中的核心单元高亮示例。',
        dimensions: availableDimensions(['up']),
        overallStatus: 'warming',
        evidenceQuality: 'complete',
        signalConsistency: 'consistent',
        deepResearchUpdate: {
          kind: 'referenced_update',
          reportId: 'industry-research-ai-v1.0',
          version: 'v1.0',
          evidenceIds: ['S02'],
          updateNotice: '仅提示已存在的离线研究编号。',
        },
      }),
      section(byId.get('advanced_chips'), {
        themeIds: ['ai_infrastructure'],
        dimensions: availableDimensions(['up', 'down']),
        overallStatus: 'diverging',
        evidenceQuality: 'complete',
        signalConsistency: 'diverging',
        priorJudgementAudits: [
          {
            reportId: 'morning-2026-07-30-v1.0',
            reportDate: '2026-07-30',
            reportType: 'morning_scan',
            originalJudgement: '固定离线判断仅供后续审计复核。',
            auditNote: '该记录不参与行业趋势计算。',
            evidenceIds: ['S01'],
          },
        ],
      }),
      section(byId.get('computing_network'), {
        themeIds: ['ai_infrastructure'],
      }),
      section(byId.get('data_elements')),
      section(byId.get('six_g')),
      section(byId.get('intelligent_connected_nev')),
      section(byId.get('new_energy_equipment')),
      section(byId.get('embodied_intelligence'), {
        dimensions: availableDimensions(['flat']),
        overallStatus: 'continuing',
        evidenceQuality: 'complete',
        signalConsistency: 'consistent',
        stockObservations: [
          {
            securityCode: 'TEST001',
            securityName: '固定观察标的',
            industryRelation: '仅说明与具身智能产业链的离线示例关联。',
            evidenceIds: ['S03'],
            riskNote: '不构成交易、仓位或收益判断。',
          },
        ],
      }),
      section(robotics, {
        role: 'daily_focus',
        keyChanges: ['今日无重要新增，继续保留固定离线观察。'],
        dimensions: availableDimensions(['flat']),
        overallStatus: 'continuing',
        evidenceQuality: 'complete',
        signalConsistency: 'consistent',
      }),
    ],
    sources,
  });
}
