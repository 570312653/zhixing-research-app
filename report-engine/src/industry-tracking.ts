import {
  CORE_FOCUS_CONFIG,
  DAILY_FOCUS_CANDIDATE_CONFIG,
  THEME_CONFIG,
} from './industry-tracking-config.js';
import { validateHtmlPolicy, validateTextCompliance } from './html-policy.js';
import type { GenerateError, ValidationResult } from './contract.js';
import type {
  CoreFocusConfig,
  DailyFocusSelection,
  DailyFocusCandidateConfig,
  IndustrySectionInput,
  IndustryTrackingReport,
  IndustryTrackingRequest,
  SourceEvidence,
  ThemeConfig,
  ThemeOutput,
} from './industry-tracking.types.js';

const dimensions = [
  'market_relative_strength',
  'trading_activity',
  'industry_fundamentals',
  'policy_technology_events',
  'representative_breadth',
  'risk_reverse_signals',
] as const;

const requiredHeadings = [
  '<h1>行业跟踪</h1>',
  '<h2>今日行业总览</h2>',
  '<h2>每日特别关注</h2>',
  '<h2>核心行业跟踪</h2>',
  '<h2>主题线索观察</h2>',
  '<h2>A 股相关标的观察</h2>',
  '<h2>深度研究更新提示</h2>',
  '<h2>下一交易日观察清单</h2>',
  '<h2>数据截至时间、公开来源与风险提示</h2>',
] as const;

function fail<T>(
  errorCode: GenerateError['errorCode'],
  message: string,
): ValidationResult<T> {
  return { ok: false, error: { kind: 'error', errorCode, message } };
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function isNonEmptyString(value: unknown): value is string {
  return typeof value === 'string' && value.trim() !== '';
}

function isStringArray(value: unknown, requireItems = false): value is string[] {
  return (
    Array.isArray(value) &&
    (!requireItems || value.length > 0) &&
    value.every(isNonEmptyString)
  );
}

function unique(values: string[]): string[] {
  return [...new Set(values)];
}

function sameOrderedValues(left: string[], right: string[]): boolean {
  return left.length === right.length && left.every((value, index) => value === right[index]);
}

function isCalendarDate(value: unknown): value is string {
  if (typeof value !== 'string') return false;
  const match = /^(\d{4})-(\d{2})-(\d{2})$/u.exec(value);
  if (!match) return false;
  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  const date = new Date(Date.UTC(year, month - 1, day));
  return (
    month >= 1 &&
    month <= 12 &&
    day >= 1 &&
    date.getUTCFullYear() === year &&
    date.getUTCMonth() === month - 1 &&
    date.getUTCDate() === day
  );
}

function isIsoDateTime(value: unknown): value is string {
  return (
    typeof value === 'string' &&
    /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}(?::\d{2}(?:\.\d{1,3})?)?(?:Z|[+-]\d{2}:\d{2})$/u.test(value) &&
    Number.isFinite(Date.parse(value))
  );
}

function isSameShanghaiDate(value: string, reportDate: string): boolean {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: 'Asia/Shanghai',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(new Date(value));
  const get = (type: Intl.DateTimeFormatPartTypes) =>
    parts.find((part) => part.type === type)?.value ?? '';
  return `${get('year')}-${get('month')}-${get('day')}` === reportDate;
}

function isHttpsUrl(value: unknown): value is string {
  if (!isNonEmptyString(value)) return false;
  try {
    const url = new URL(value);
    return url.protocol === 'https:' && url.username === '' && url.password === '';
  } catch {
    return false;
  }
}

function escapeHtml(value: string): string {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}

function validateFocusConfig(
  value: unknown,
  expected: CoreFocusConfig[] | DailyFocusCandidateConfig[],
): boolean {
  if (!Array.isArray(value) || value.length !== expected.length) return false;
  return expected.every((expectedItem, index) => {
    const item = value[index];
    return (
      isRecord(item) &&
      item.focusId === expectedItem.focusId &&
      item.displayName === expectedItem.displayName &&
      item.primaryIndustryTag === expectedItem.primaryIndustryTag &&
      isStringArray(item.industryTags, true) &&
      sameOrderedValues(item.industryTags, expectedItem.industryTags)
    );
  });
}

function validateThemeConfig(value: unknown): value is ThemeConfig[] {
  if (!Array.isArray(value) || value.length !== THEME_CONFIG.length) return false;
  return THEME_CONFIG.every((expectedItem, index) => {
    const item = value[index];
    return (
      isRecord(item) &&
      item.themeId === expectedItem.themeId &&
      item.displayName === expectedItem.displayName &&
      isStringArray(item.focusIds, true) &&
      isStringArray(item.industryTags, true) &&
      sameOrderedValues(item.focusIds, expectedItem.focusIds) &&
      sameOrderedValues(item.industryTags, expectedItem.industryTags)
    );
  });
}

function validateSources(
  value: unknown,
  reportDate: string,
  dataAsOf: string,
): ValidationResult<SourceEvidence[]> {
  if (!Array.isArray(value) || value.length === 0) {
    return fail('SOURCE_EVIDENCE_INSUFFICIENT', '行业跟踪必须提供可追溯的来源证据。');
  }
  const sourceIds = new Set<string>();
  for (const source of value) {
    if (
      isRecord(source) &&
      ((isNonEmptyString(source.title) && !textIsCompliant(source.title)) ||
        (isNonEmptyString(source.publisher) && !textIsCompliant(source.publisher)) ||
        (isNonEmptyString(source.context) && !textIsCompliant(source.context)))
    ) {
      return fail('COMPLIANCE_VIOLATION', '行业跟踪来源文本包含不允许的交易或收益表述。');
    }
    if (
      !isRecord(source) ||
      !isNonEmptyString(source.sourceId) ||
      sourceIds.has(source.sourceId) ||
      !isNonEmptyString(source.title) ||
      !isNonEmptyString(source.publisher) ||
      !isNonEmptyString(source.context) ||
      !isHttpsUrl(source.url) ||
      source.linkStatus !== 'valid' ||
      !isIsoDateTime(source.publishedAt) ||
      !isIsoDateTime(source.dataAsOf) ||
      Date.parse(source.publishedAt) > Date.parse(dataAsOf) ||
      Date.parse(source.dataAsOf) > Date.parse(dataAsOf)
    ) {
      return fail('SOURCE_EVIDENCE_INSUFFICIENT', '行业跟踪来源结构、时间或链接状态无效。');
    }
    sourceIds.add(source.sourceId);
  }
  return { ok: true, value: value as SourceEvidence[] };
}

function hasEvidenceIds(value: unknown, sourceIds: Set<string>): boolean {
  return (
    isStringArray(value, true) &&
    value.every((sourceId) => sourceIds.has(sourceId))
  );
}

function textIsCompliant(value: unknown): boolean {
  return isNonEmptyString(value) && validateTextCompliance(value).ok;
}

function textArrayIsCompliant(value: unknown): boolean {
  return isStringArray(value, true) && value.every(textIsCompliant);
}

function containsProhibitedText(value: unknown): boolean {
  if (typeof value === 'string') return !validateTextCompliance(value).ok;
  if (Array.isArray(value)) return value.some(containsProhibitedText);
  if (isRecord(value)) return Object.values(value).some(containsProhibitedText);
  return false;
}

function hasUnknownEvidenceReference(
  section: Record<string, unknown>,
  sourceIds: Set<string>,
): boolean {
  const containsUnknown = (value: unknown): boolean =>
    Array.isArray(value) && value.some((sourceId) => typeof sourceId === 'string' && !sourceIds.has(sourceId));
  if (Array.isArray(section.dimensions)) {
    for (const dimension of section.dimensions) {
      if (isRecord(dimension) && Array.isArray(dimension.indicatorChanges)) {
        for (const change of dimension.indicatorChanges) {
          if (isRecord(change) && containsUnknown(change.evidenceIds)) return true;
        }
      }
    }
  }
  if (Array.isArray(section.stockObservations)) {
    for (const stock of section.stockObservations) {
      if (isRecord(stock) && containsUnknown(stock.evidenceIds)) return true;
    }
  }
  if (isRecord(section.deepResearchUpdate) && containsUnknown(section.deepResearchUpdate.evidenceIds)) return true;
  if (Array.isArray(section.priorJudgementAudits)) {
    return section.priorJudgementAudits.some(
      (audit) => isRecord(audit) && containsUnknown(audit.evidenceIds),
    );
  }
  return false;
}

function validateSelections(
  value: unknown,
  reportDate: string,
  sourceIds: Set<string>,
): ValidationResult<string[]> {
  if (!Array.isArray(value) || value.length > 3) {
    return fail('INDUSTRY_TRACKING_INSUFFICIENT', '每日特别关注必须为最多三项的受控候选。');
  }
  const candidates = new Map(
    DAILY_FOCUS_CANDIDATE_CONFIG.map((item) => [item.focusId, item]),
  );
  const selected = new Set<string>();
  for (const selection of value) {
    if (!isRecord(selection) || !isNonEmptyString(selection.focusId)) {
      return fail('INDUSTRY_TRACKING_INSUFFICIENT', '每日特别关注配置无效。');
    }
    const candidate = candidates.get(selection.focusId);
    if (
      isStringArray(selection.selectionEvidenceIds, true) &&
      selection.selectionEvidenceIds.some((sourceId) => !sourceIds.has(sourceId))
    ) {
      return fail('SOURCE_EVIDENCE_INSUFFICIENT', '每日特别关注引用了不存在的来源证据。');
    }
    if (isNonEmptyString(selection.selectionReason) && !textIsCompliant(selection.selectionReason)) {
      return fail('COMPLIANCE_VIOLATION', '每日特别关注选择原因包含不允许的交易或收益表述。');
    }
    if (
      candidate === undefined ||
      selected.has(selection.focusId) ||
      selection.displayName !== candidate.displayName ||
      !isStringArray(selection.industryTags, true) ||
      !sameOrderedValues(selection.industryTags, candidate.industryTags) ||
      !isNonEmptyString(selection.selectionReason) ||
      !hasEvidenceIds(selection.selectionEvidenceIds, sourceIds) ||
      !isCalendarDate(selection.firstSelectedDate) ||
      selection.firstSelectedDate > reportDate ||
      typeof selection.consecutiveSelectionDays !== 'number' ||
      !Number.isInteger(selection.consecutiveSelectionDays) ||
      selection.consecutiveSelectionDays < 1
    ) {
      return fail('INDUSTRY_TRACKING_INSUFFICIENT', '每日特别关注必须来自固定候选池并具备可追溯依据。');
    }
    selected.add(selection.focusId);
  }
  return { ok: true, value: [...selected] };
}

function validateExits(
  value: unknown,
  selected: Set<string>,
  sourceIds: Set<string>,
): ValidationResult<undefined> {
  if (!Array.isArray(value)) {
    return fail('INDUSTRY_TRACKING_INSUFFICIENT', '每日特别关注退出记录无效。');
  }
  const candidates = new Map(
    DAILY_FOCUS_CANDIDATE_CONFIG.map((item) => [item.focusId, item]),
  );
  const exits = new Set<string>();
  for (const exit of value) {
    if (!isRecord(exit) || !isNonEmptyString(exit.focusId)) {
      return fail('INDUSTRY_TRACKING_INSUFFICIENT', '每日特别关注退出记录无效。');
    }
    const candidate = candidates.get(exit.focusId);
    if (
      isStringArray(exit.evidenceIds, true) &&
      exit.evidenceIds.some((sourceId) => !sourceIds.has(sourceId))
    ) {
      return fail('SOURCE_EVIDENCE_INSUFFICIENT', '每日特别关注退出记录引用了不存在的来源证据。');
    }
    if (
      candidate === undefined ||
      selected.has(exit.focusId) ||
      exits.has(exit.focusId) ||
      exit.displayName !== candidate.displayName ||
      (exit.exitReason !== 'signal_weakened' &&
        exit.exitReason !== 'evidence_insufficient' &&
        exit.exitReason !== 'replaced') ||
      !hasEvidenceIds(exit.evidenceIds, sourceIds)
    ) {
      return fail('INDUSTRY_TRACKING_INSUFFICIENT', '每日特别关注退出记录无效。');
    }
    exits.add(exit.focusId);
  }
  return { ok: true, value: undefined };
}

function expectedThemeIds(focusId: string, selectedThemeIds: string[]): string[] {
  return selectedThemeIds.filter((themeId) =>
    THEME_CONFIG.some(
      (theme) => theme.themeId === themeId && theme.focusIds.includes(focusId),
    ),
  );
}

function validateDimensions(value: unknown, sourceIds: Set<string>): boolean {
  if (!Array.isArray(value) || value.length !== dimensions.length) return false;
  const seen = new Set<string>();
  return value.every((assessment) => {
    if (
      !isRecord(assessment) ||
      !dimensions.includes(assessment.dimension as (typeof dimensions)[number]) ||
      seen.has(assessment.dimension as string)
    ) {
      return false;
    }
    seen.add(assessment.dimension as string);
    if (assessment.status === 'data_insufficient') {
      return textIsCompliant(assessment.missingReason) && !('conclusion' in assessment) && !('indicatorChanges' in assessment);
    }
    if (
      assessment.status !== 'available' ||
      !textIsCompliant(assessment.conclusion) ||
      !Array.isArray(assessment.indicatorChanges) ||
      assessment.indicatorChanges.length === 0
    ) {
      return false;
    }
    return assessment.indicatorChanges.every((change) => {
      if (!isRecord(change)) return false;
      return (
        isNonEmptyString(change.metricName) &&
        textIsCompliant(change.metricName) &&
        (change.currentValue === undefined || isNonEmptyString(change.currentValue)) &&
        (change.comparisonValue === undefined || isNonEmptyString(change.comparisonValue)) &&
        (change.unit === undefined || isNonEmptyString(change.unit)) &&
        (change.qualitativeObservation === undefined || textIsCompliant(change.qualitativeObservation)) &&
        ((isNonEmptyString(change.currentValue) && isNonEmptyString(change.comparisonValue)) ||
          isNonEmptyString(change.qualitativeObservation)) &&
        (change.changeDirection === 'up' ||
          change.changeDirection === 'down' ||
          change.changeDirection === 'flat' ||
          change.changeDirection === 'mixed' ||
          change.changeDirection === 'not_quantified') &&
        (change.comparisonWindow === 'previous_trading_day' ||
          change.comparisonWindow === 'trailing_5_trading_days' ||
          change.comparisonWindow === 'trailing_20_trading_days' ||
          change.comparisonWindow === 'disclosure_period') &&
        hasEvidenceIds(change.evidenceIds, sourceIds)
      );
    });
  });
}

function hasValidDimension(section: IndustrySectionInput): boolean {
  return section.dimensions.some((item) => item.status === 'available');
}

function hasConflictingDirections(section: IndustrySectionInput): boolean {
  const directions = section.dimensions.flatMap((item) =>
    item.status === 'available'
      ? item.indicatorChanges.map((change) => change.changeDirection)
      : [],
  );
  return directions.includes('up') && directions.includes('down');
}

function validateSectionDetails(
  section: Record<string, unknown>,
  sourceIds: Set<string>,
): boolean {
  if (
    !validateDimensions(section.dimensions, sourceIds) ||
    !textArrayIsCompliant(section.keyChanges) ||
    !textArrayIsCompliant(section.catalysts) ||
    !textArrayIsCompliant(section.risks) ||
    !textArrayIsCompliant(section.nextObservations) ||
    !Array.isArray(section.stockObservations) ||
    !isRecord(section.deepResearchUpdate)
  ) {
    return false;
  }
  if (!section.stockObservations.every((stock) => {
    return (
      isRecord(stock) &&
      textIsCompliant(stock.securityCode) &&
      textIsCompliant(stock.securityName) &&
      textIsCompliant(stock.industryRelation) &&
      textIsCompliant(stock.riskNote) &&
      hasEvidenceIds(stock.evidenceIds, sourceIds)
    );
  })) return false;
  const deep = section.deepResearchUpdate;
  if (deep.kind === 'referenced_update') {
    if (!textIsCompliant(deep.reportId) || !textIsCompliant(deep.version) || !textIsCompliant(deep.updateNotice) || !hasEvidenceIds(deep.evidenceIds, sourceIds)) return false;
  } else if (deep.kind === 'structural_change_detected') {
    if (!textIsCompliant(deep.updateNotice) || !hasEvidenceIds(deep.evidenceIds, sourceIds)) return false;
  } else if (deep.kind !== 'no_new_deep_conclusion') return false;
  if (section.priorJudgementAudits !== undefined) {
    if (!Array.isArray(section.priorJudgementAudits)) return false;
    if (!section.priorJudgementAudits.every((audit) => {
      return (
        isRecord(audit) &&
        isNonEmptyString(audit.reportId) &&
        isCalendarDate(audit.reportDate) &&
        (audit.reportType === 'morning_scan' || audit.reportType === 'midday_review' || audit.reportType === 'daily_review' || audit.reportType === 'industry_tracking') &&
        textIsCompliant(audit.originalJudgement) &&
        textIsCompliant(audit.auditNote) &&
        hasEvidenceIds(audit.evidenceIds, sourceIds)
      );
    })) return false;
  }
  return true;
}

function validateSections(
  value: unknown,
  dailyFocusIds: string[],
  selectedThemeIds: string[],
  sourceIds: Set<string>,
): ValidationResult<IndustrySectionInput[]> {
  if (!Array.isArray(value)) {
    return fail('INDUSTRY_TRACKING_INSUFFICIENT', '行业跟踪必须包含完整关注单元章节。');
  }
  const expected = new Map<
    string,
    { item: CoreFocusConfig | DailyFocusCandidateConfig; role: 'core' | 'daily_focus' }
  >([
    ...CORE_FOCUS_CONFIG.map(
      (item) => [item.focusId, { item, role: 'core' as const }] as const,
    ),
    ...DAILY_FOCUS_CANDIDATE_CONFIG.map(
      (item) => [item.focusId, { item, role: 'daily_focus' as const }] as const,
    ),
  ]);
  const expectedIds = [...CORE_FOCUS_CONFIG.map((item) => item.focusId), ...dailyFocusIds];
  if (value.length !== expectedIds.length) {
    return fail('INDUSTRY_TRACKING_INSUFFICIENT', '行业跟踪缺少或重复关注单元章节。');
  }
  const seen = new Set<string>();
  for (const section of value) {
    if (!isRecord(section) || !isNonEmptyString(section.focusId)) {
      return fail('INDUSTRY_TRACKING_INSUFFICIENT', '行业章节结构无效。');
    }
    const expectedSection = expected.get(section.focusId);
    const isExpectedDaily = dailyFocusIds.includes(section.focusId);
    if (hasUnknownEvidenceReference(section, sourceIds)) {
      return fail('SOURCE_EVIDENCE_INSUFFICIENT', '行业章节引用了不存在的来源证据。');
    }
    if (containsProhibitedText(section)) {
      return fail('COMPLIANCE_VIOLATION', '行业章节包含不允许的交易或收益表述。');
    }
    if (
      expectedSection === undefined ||
      seen.has(section.focusId) ||
      !expectedIds.includes(section.focusId) ||
      section.role !== (isExpectedDaily ? 'daily_focus' : 'core') ||
      section.displayName !== expectedSection.item.displayName ||
      !isStringArray(section.industryTags, true) ||
      !sameOrderedValues(section.industryTags, expectedSection.item.industryTags) ||
      !isStringArray(section.themeIds) ||
      !sameOrderedValues(section.themeIds, expectedThemeIds(section.focusId, selectedThemeIds)) ||
      (section.highlightReason !== undefined && (!textIsCompliant(section.highlightReason) || section.role !== 'core')) ||
      !validateSectionDetails(section, sourceIds)
    ) {
      return fail('INDUSTRY_TRACKING_INSUFFICIENT', '行业章节与受控配置、主题或证据不一致。');
    }
    const typed = section as unknown as IndustrySectionInput;
    const validDimension = hasValidDimension(typed);
    if (
      !['warming', 'continuing', 'diverging', 'cooling', 'insufficient'].includes(typed.overallStatus) ||
      !['complete', 'partial', 'insufficient'].includes(typed.evidenceQuality) ||
      !['consistent', 'partially_consistent', 'diverging'].includes(typed.signalConsistency) ||
      (!validDimension && (typed.overallStatus !== 'insufficient' || typed.evidenceQuality !== 'insufficient')) ||
      (typed.signalConsistency === 'diverging' && typed.overallStatus !== 'diverging') ||
      (hasConflictingDirections(typed) && (typed.signalConsistency !== 'diverging' || typed.overallStatus !== 'diverging')) ||
      (validDimension && typed.overallStatus === 'insufficient' && typed.evidenceQuality === 'complete')
    ) {
      return fail('INDUSTRY_TRACKING_INSUFFICIENT', '行业趋势、证据质量与降级状态不一致。');
    }
    seen.add(section.focusId);
  }
  return { ok: true, value: value as IndustrySectionInput[] };
}

function deriveThemes(selectedThemeIds: string[], industries: IndustrySectionInput[]): ThemeOutput[] {
  return selectedThemeIds.map((themeId) => {
    const theme = THEME_CONFIG.find((item) => item.themeId === themeId);
    if (!theme) throw new Error('未经校验的主题配置。');
    const focusIds = theme.focusIds.filter((focusId) => industries.some((item) => item.focusId === focusId));
    const industryTags = unique(
      focusIds.flatMap(
        (focusId) => industries.find((item) => item.focusId === focusId)?.industryTags ?? [],
      ),
    );
    return { themeId, displayName: theme.displayName, focusIds, industryTags };
  });
}

export function validateIndustryTrackingRequest(
  value: unknown,
): ValidationResult<IndustryTrackingRequest> {
  if (!isRecord(value) || value.reportType !== 'industry_tracking') {
    return fail('INVALID_REQUEST', '行业跟踪请求必须是结构化对象。');
  }
  if ('draftHtml' in value) {
    return fail('INVALID_REQUEST', 'industry_tracking 不接收 draftHtml。');
  }
  if (!isCalendarDate(value.reportDate)) {
    return fail('INVALID_REPORT_DATE', '行业跟踪 reportDate 必须是实际存在的公历日期。');
  }
  if (!isIsoDateTime(value.dataAsOf) || !isSameShanghaiDate(value.dataAsOf, value.reportDate)) {
    return fail('INVALID_REQUEST', '行业跟踪 dataAsOf 必须与 reportDate 为同一上海自然日。');
  }
  if (!validateFocusConfig(value.coreFocusConfig, CORE_FOCUS_CONFIG) || !validateFocusConfig(value.dailyFocusCandidateConfig, DAILY_FOCUS_CANDIDATE_CONFIG) || !validateThemeConfig(value.themeConfig)) {
    return fail('INDUSTRY_TRACKING_INSUFFICIENT', '行业跟踪必须使用完整且受控的核心、候选与主题配置。');
  }
  const sourcesResult = validateSources(value.sources, value.reportDate, value.dataAsOf);
  if (!sourcesResult.ok) return sourcesResult;
  const sourceIds = new Set(sourcesResult.value.map((source) => source.sourceId));
  const selectedResult = validateSelections(value.dailyFocusSelections, value.reportDate, sourceIds);
  if (!selectedResult.ok) return selectedResult;
  const selected = new Set(selectedResult.value);
  const exitsResult = validateExits(value.exitedDailyFocus, selected, sourceIds);
  if (!exitsResult.ok) return exitsResult;
  if (!isStringArray(value.selectedThemeIds) || unique(value.selectedThemeIds).length !== value.selectedThemeIds.length || !value.selectedThemeIds.every((themeId) => THEME_CONFIG.some((theme) => theme.themeId === themeId))) {
    return fail('INDUSTRY_TRACKING_INSUFFICIENT', '行业跟踪主题选择无效。');
  }
  const sectionsResult = validateSections(value.industries, selectedResult.value, value.selectedThemeIds, sourceIds);
  if (!sectionsResult.ok) return sectionsResult;
  if (!sectionsResult.value.some(hasValidDimension)) {
    return fail('INDUSTRY_TRACKING_INSUFFICIENT', '行业跟踪没有任何可用的行业级证据。');
  }
  const themes = deriveThemes(value.selectedThemeIds, sectionsResult.value);
  if (themes.some((theme) => theme.focusIds.length === 0)) {
    return fail('INDUSTRY_TRACKING_INSUFFICIENT', '所选主题必须关联当前报告中的关注单元。');
  }
  return { ok: true, value: value as unknown as IndustryTrackingRequest };
}

function renderSectionList(industries: IndustrySectionInput[]): string {
  return industries.map((industry) => {
    const evidence = unique(industry.dimensions.flatMap((dimension) =>
      dimension.status === 'available'
        ? dimension.indicatorChanges.flatMap((change) => change.evidenceIds)
        : [],
    ));
    const dimensionsText = industry.dimensions.map((dimension) =>
      dimension.status === 'available'
        ? `${dimension.conclusion}；${dimension.indicatorChanges.map((change) => `${change.metricName} ${change.comparisonWindow} ${change.currentValue ?? ''} ${change.comparisonValue ?? ''} ${change.qualitativeObservation ?? ''} ${change.evidenceIds.join('、')}`).join('；')}`
        : dimension.missingReason,
    ).join('；');
    return `<li><strong>${escapeHtml(industry.displayName)}</strong>：状态 ${escapeHtml(industry.overallStatus)}；证据质量 ${escapeHtml(industry.evidenceQuality)}；信号一致性 ${escapeHtml(industry.signalConsistency)}；关键变化 ${escapeHtml(industry.keyChanges.join('；'))}；催化 ${escapeHtml(industry.catalysts.join('；'))}；维度观察 ${escapeHtml(dimensionsText)}；关键证据 ${escapeHtml(evidence.join('、') || '证据不足')}；风险 ${escapeHtml(industry.risks.join('；'))}；下一观察 ${escapeHtml(industry.nextObservations.join('；'))}</li>`;
  }).join('');
}

function renderContent(
  report: Omit<IndustryTrackingReport, 'contentHtml'>,
  dailySelections: DailyFocusSelection[] = [],
): string {
  const dailyIndustries = report.industries.filter((item) => item.role === 'daily_focus');
  const coreIndustries = report.industries.filter((item) => item.role === 'core');
  const stocks = report.industries.flatMap((industry) => industry.stockObservations.map((stock) => ({ industry, stock })));
  const audits = report.industries.flatMap((industry) => industry.priorJudgementAudits ?? []);
  const statusGroups = ['warming', 'continuing', 'diverging', 'cooling', 'insufficient']
    .map((status) => `${status}：${coreIndustries.filter((industry) => industry.overallStatus === status).map((industry) => industry.displayName).join('、') || '无'}`)
    .join('；');
  const dailyText = dailyIndustries.map((industry) => {
    const selection = dailySelections.find((item) => item.focusId === industry.focusId);
    const changes = industry.dimensions.flatMap((dimension) =>
      dimension.status === 'available'
        ? dimension.indicatorChanges.map((change) => `${dimension.conclusion}；${change.comparisonWindow}：${change.metricName} ${change.currentValue ?? ''} ${change.comparisonValue ?? ''} ${change.qualitativeObservation ?? ''}（${change.evidenceIds.join('、')}）`)
        : [],
    );
    return `<li><strong>${escapeHtml(industry.displayName)}</strong>：状态 ${escapeHtml(industry.overallStatus)}；证据质量 ${escapeHtml(industry.evidenceQuality)}；信号一致性 ${escapeHtml(industry.signalConsistency)}；${selection ? `选择原因 ${escapeHtml(selection.selectionReason)}；选择来源 ${escapeHtml(selection.selectionEvidenceIds.join('、'))}；首次入选 ${escapeHtml(selection.firstSelectedDate)}；连续 ${selection.consecutiveSelectionDays} 天；` : ''}多窗口变化 ${escapeHtml(changes.join('；') || '证据不足')}；关键变化 ${escapeHtml(industry.keyChanges.join('；'))}；催化 ${escapeHtml(industry.catalysts.join('；'))}；风险 ${escapeHtml(industry.risks.join('；'))}；下一观察 ${escapeHtml(industry.nextObservations.join('；'))}</li>`;
  }).join('');
  return [
    '<article>',
    '<h1>行业跟踪</h1>',
    '<h2>今日行业总览</h2>',
    `<p>固定离线夹具汇总 ${coreIndustries.length} 个核心关注单元与 ${dailyIndustries.length} 个每日特别关注单元；状态分组：${escapeHtml(statusGroups)}；跨行业共性：仅核对显式提供的固定证据；主要风险：证据不足时不形成趋势结论；不陈述真实市场事实。</p>`,
    '<h2>每日特别关注</h2>',
    dailyIndustries.length === 0
      ? '<p>今日无特别关注新增。</p>'
      : `<ul>${dailyText}</ul>`,
    '<h2>核心行业跟踪</h2>',
    `<ul>${renderSectionList(coreIndustries)}</ul>`,
    '<h2>主题线索观察</h2>',
    report.themes.length === 0
      ? '<p>今日无主题线索展示。</p>'
      : `<ul>${report.themes.map((theme) => `<li>${escapeHtml(theme.displayName)}：关联申万行业 ${escapeHtml(theme.industryTags.join('、'))}</li>`).join('')}</ul>`,
    '<h2>A 股相关标的观察</h2>',
    stocks.length === 0
      ? '<p>固定离线夹具未提供标的观察。</p>'
      : `<ul>${stocks.map(({ stock }) => `<li>${escapeHtml(stock.securityCode)} ${escapeHtml(stock.securityName)}：${escapeHtml(stock.industryRelation)}；证据：${escapeHtml(stock.evidenceIds.join('、'))}；风险：${escapeHtml(stock.riskNote)}</li>`).join('')}</ul>`,
    '<h2>深度研究更新提示</h2>',
    `<p>${report.industries.map((industry) => {
      const update = industry.deepResearchUpdate;
      return `${escapeHtml(industry.displayName)}：${update.kind === 'no_new_deep_conclusion' ? '无新增深度结论' : update.kind === 'referenced_update' ? `${escapeHtml(update.reportId)} ${escapeHtml(update.version)} ${escapeHtml(update.updateNotice)} ${escapeHtml(update.evidenceIds.join('、'))}` : `${escapeHtml(update.updateNotice)} ${escapeHtml(update.evidenceIds.join('、'))}`}`;
    }).join('；')}</p>`,
    audits.length === 0 ? '' : `<p>前期判断审计记录仅供复核，不参与趋势结论：${escapeHtml(audits.map((audit) => `${audit.reportId} ${audit.originalJudgement} ${audit.auditNote}`).join('；'))}</p>`,
    '<h2>下一交易日观察清单</h2>',
    `<ul>${report.industries.flatMap((industry) => industry.nextObservations).map((item) => `<li>${escapeHtml(item)}</li>`).join('')}</ul>`,
    '<h2>数据截至时间、公开来源与风险提示</h2>',
    `<p>数据截至：${escapeHtml(report.dataAsOf)}</p>`,
    `<ul>${report.sources.map((source) => `<li>${escapeHtml(source.sourceId)}：标题 ${escapeHtml(source.title)}；发布方 ${escapeHtml(source.publisher)}；发布时间 ${escapeHtml(source.publishedAt)}；数据截至 ${escapeHtml(source.dataAsOf)}；URL <a href="${escapeHtml(source.url)}">${escapeHtml(source.url)}</a>；${escapeHtml(source.context)}</li>`).join('')}</ul>`,
    '<p>仅供信息参考，不构成投资建议</p>',
    '</article>',
  ].join('');
}

function outputReflectsStructuredContent(
  html: string,
  industries: IndustrySectionInput[],
  themes: ThemeOutput[],
  sources: SourceEvidence[],
): boolean {
  const has = (value: string) => html.includes(escapeHtml(value));
  return (
    industries.every((industry) => {
      const sectionText = [
        industry.displayName,
        industry.overallStatus,
        industry.evidenceQuality,
        industry.signalConsistency,
        ...industry.keyChanges,
        ...industry.catalysts,
        ...industry.risks,
        ...industry.nextObservations,
        ...industry.dimensions.flatMap((dimension) =>
          dimension.status === 'available'
            ? [
                dimension.conclusion,
                ...dimension.indicatorChanges.flatMap((change) => [
                  change.metricName,
                  ...(change.currentValue === undefined ? [] : [change.currentValue]),
                  ...(change.comparisonValue === undefined ? [] : [change.comparisonValue]),
                  ...(change.unit === undefined ? [] : [change.unit]),
                  ...(change.qualitativeObservation === undefined ? [] : [change.qualitativeObservation]),
                  ...change.evidenceIds,
                ]),
              ]
            : [dimension.missingReason],
        ),
        ...industry.stockObservations.flatMap((stock) => [
          stock.securityCode,
          stock.securityName,
          stock.industryRelation,
          stock.riskNote,
          ...stock.evidenceIds,
        ]),
        ...(industry.deepResearchUpdate.kind === 'no_new_deep_conclusion'
          ? []
          : industry.deepResearchUpdate.kind === 'referenced_update'
            ? [
                industry.deepResearchUpdate.reportId,
                industry.deepResearchUpdate.version,
                industry.deepResearchUpdate.updateNotice,
                ...industry.deepResearchUpdate.evidenceIds,
              ]
            : [
                industry.deepResearchUpdate.updateNotice,
                ...industry.deepResearchUpdate.evidenceIds,
              ]),
        ...(industry.priorJudgementAudits ?? []).flatMap((audit) => [
          audit.reportId,
          audit.originalJudgement,
          audit.auditNote,
          ...audit.evidenceIds,
        ]),
      ];
      return sectionText.every(has);
    }) &&
    themes.every((theme) => has(theme.displayName) && theme.industryTags.every(has)) &&
    sources.every((source) =>
      [source.sourceId, source.title, source.publisher, source.context].every(has),
    )
  );
}

export function composeIndustryTrackingReport(
  request: IndustryTrackingRequest,
): ValidationResult<IndustryTrackingReport> {
  const reportWithoutHtml: Omit<IndustryTrackingReport, 'contentHtml'> = {
    reportType: 'industry_tracking',
    reportDate: request.reportDate,
    title: `行业跟踪｜${request.reportDate}｜v1.0`,
    version: 'v1.0',
    dataAsOf: request.dataAsOf,
    marketScopes: ['cn_a'],
    industryTags: unique(request.industries.flatMap((industry) => industry.industryTags)),
    themes: deriveThemes(request.selectedThemeIds, request.industries),
    coreFocusIds: CORE_FOCUS_CONFIG.map((item) => item.focusId),
    dailyFocusIds: request.dailyFocusSelections.map((item) => item.focusId),
    industries: request.industries,
    sources: request.sources,
  };
  const contentHtml = renderContent(reportWithoutHtml, request.dailyFocusSelections);
  const htmlResult = validateHtmlPolicy(contentHtml);
  if (!htmlResult.ok) return fail(htmlResult.errorCode, htmlResult.message);
  return { ok: true, value: { ...reportWithoutHtml, contentHtml: htmlResult.value } };
}

export function validateIndustryTrackingReport(
  value: unknown,
): ValidationResult<IndustryTrackingReport> {
  if (!isRecord(value) || value.reportType !== 'industry_tracking') {
    return fail('OUTPUT_CONTRACT_VIOLATION', '行业跟踪输出类型无效。');
  }
  if (!isCalendarDate(value.reportDate) || !isIsoDateTime(value.dataAsOf) || !isSameShanghaiDate(value.dataAsOf, value.reportDate) || value.title !== `行业跟踪｜${value.reportDate}｜v1.0` || value.version !== 'v1.0' || !Array.isArray(value.marketScopes) || value.marketScopes.length !== 1 || value.marketScopes[0] !== 'cn_a') {
    return fail('OUTPUT_CONTRACT_VIOLATION', '行业跟踪输出基础契约无效。');
  }
  const sourcesResult = validateSources(value.sources, value.reportDate, value.dataAsOf);
  if (!sourcesResult.ok) return fail('OUTPUT_CONTRACT_VIOLATION', '行业跟踪输出来源无效。');
  const sourceIds = new Set(sourcesResult.value.map((source) => source.sourceId));
  if (!isStringArray(value.coreFocusIds) || !sameOrderedValues(value.coreFocusIds, CORE_FOCUS_CONFIG.map((item) => item.focusId)) || !isStringArray(value.dailyFocusIds) || unique(value.dailyFocusIds).length !== value.dailyFocusIds.length || value.dailyFocusIds.length > 3 || value.dailyFocusIds.some((focusId) => !DAILY_FOCUS_CANDIDATE_CONFIG.some((item) => item.focusId === focusId))) {
    return fail('OUTPUT_CONTRACT_VIOLATION', '行业跟踪输出关注单元无效。');
  }
  const themeIds = Array.isArray(value.themes) && value.themes.every(isRecord)
    ? value.themes.map((theme) => theme.themeId)
    : [];
  if (!isStringArray(themeIds) || unique(themeIds).length !== themeIds.length || themeIds.some((themeId) => !THEME_CONFIG.some((theme) => theme.themeId === themeId))) {
    return fail('OUTPUT_CONTRACT_VIOLATION', '行业跟踪输出主题无效。');
  }
  const sectionsResult = validateSections(value.industries, value.dailyFocusIds, themeIds, sourceIds);
  if (!sectionsResult.ok || !sectionsResult.value.some(hasValidDimension)) {
    return fail('OUTPUT_CONTRACT_VIOLATION', '行业跟踪输出章节无效。');
  }
  const expectedTags = unique(sectionsResult.value.flatMap((item) => item.industryTags));
  const expectedThemes = deriveThemes(themeIds, sectionsResult.value);
  if (!isStringArray(value.industryTags, true) || !sameOrderedValues(value.industryTags, expectedTags) || JSON.stringify(value.themes) !== JSON.stringify(expectedThemes) || !isNonEmptyString(value.contentHtml)) {
    return fail('OUTPUT_CONTRACT_VIOLATION', '行业跟踪输出结构化字段无效。');
  }
  const htmlResult = validateHtmlPolicy(value.contentHtml);
  if (!htmlResult.ok) return fail(htmlResult.errorCode, htmlResult.message);
  if (
    !requiredHeadings.every((heading) => htmlResult.value.includes(heading)) ||
    !htmlResult.value.endsWith('<p>仅供信息参考，不构成投资建议</p></article>') ||
    !outputReflectsStructuredContent(
      htmlResult.value,
      sectionsResult.value,
      expectedThemes,
      sourcesResult.value,
    )
  ) {
    return fail('OUTPUT_CONTRACT_VIOLATION', '行业跟踪输出 HTML 未完整反映结构化内容。');
  }
  return {
    ok: true,
    value: {
      reportType: 'industry_tracking',
      reportDate: value.reportDate,
      title: value.title,
      version: 'v1.0',
      dataAsOf: value.dataAsOf,
      marketScopes: ['cn_a'],
      industryTags: value.industryTags,
      themes: expectedThemes,
      coreFocusIds: value.coreFocusIds,
      dailyFocusIds: value.dailyFocusIds,
      industries: sectionsResult.value,
      sources: sourcesResult.value,
      contentHtml: htmlResult.value,
    },
  };
}
