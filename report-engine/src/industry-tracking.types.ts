export type IndustryRole = 'core' | 'daily_focus';
export type IndustryOverallStatus =
  | 'warming'
  | 'continuing'
  | 'diverging'
  | 'cooling'
  | 'insufficient';
export type EvidenceQuality = 'complete' | 'partial' | 'insufficient';
export type SignalConsistency = 'consistent' | 'partially_consistent' | 'diverging';
export type ComparisonWindow =
  | 'previous_trading_day'
  | 'trailing_5_trading_days'
  | 'trailing_20_trading_days'
  | 'disclosure_period';
export type IndustryDimension =
  | 'market_relative_strength'
  | 'trading_activity'
  | 'industry_fundamentals'
  | 'policy_technology_events'
  | 'representative_breadth'
  | 'risk_reverse_signals';

export type SourceEvidence = {
  sourceId: string;
  title: string;
  publisher: string;
  publishedAt: string;
  dataAsOf: string;
  url: string;
  linkStatus: 'valid' | 'expired';
  context: string;
};

export type IndicatorChange = {
  metricName: string;
  currentValue?: string;
  comparisonValue?: string;
  unit?: string;
  changeDirection: 'up' | 'down' | 'flat' | 'mixed' | 'not_quantified';
  comparisonWindow: ComparisonWindow;
  evidenceIds: string[];
  qualitativeObservation?: string;
};

export type DimensionAssessment =
  | {
      dimension: IndustryDimension;
      status: 'available';
      conclusion: string;
      indicatorChanges: IndicatorChange[];
    }
  | {
      dimension: IndustryDimension;
      status: 'data_insufficient';
      missingReason: string;
    };

export type FocusUnitRef = {
  focusId: string;
  displayName: string;
  industryTags: string[];
};

export type CoreFocusConfig = FocusUnitRef & { primaryIndustryTag: string };
export type DailyFocusCandidateConfig = FocusUnitRef & {
  primaryIndustryTag: string;
};
export type ThemeConfig = {
  themeId: string;
  displayName: string;
  focusIds: string[];
  industryTags: string[];
};
export type ThemeOutput = {
  themeId: string;
  displayName: string;
  focusIds: string[];
  industryTags: string[];
};

export type DailyFocusSelection = FocusUnitRef & {
  selectionReason: string;
  selectionEvidenceIds: string[];
  firstSelectedDate: string;
  consecutiveSelectionDays: number;
};
export type DailyFocusExitRecord = {
  focusId: string;
  displayName: string;
  exitReason: 'signal_weakened' | 'evidence_insufficient' | 'replaced';
  evidenceIds: string[];
};
export type PriorJudgementAudit = {
  reportId: string;
  reportDate: string;
  reportType: 'morning_scan' | 'midday_review' | 'daily_review' | 'industry_tracking';
  originalJudgement: string;
  auditNote: string;
  evidenceIds: string[];
};
export type IndustrySectionInput = {
  focusId: string;
  displayName: string;
  role: IndustryRole;
  industryTags: string[];
  themeIds: string[];
  highlightReason?: string;
  dimensions: DimensionAssessment[];
  overallStatus: IndustryOverallStatus;
  evidenceQuality: EvidenceQuality;
  signalConsistency: SignalConsistency;
  keyChanges: string[];
  catalysts: string[];
  risks: string[];
  nextObservations: string[];
  stockObservations: Array<{
    securityCode: string;
    securityName: string;
    industryRelation: string;
    evidenceIds: string[];
    riskNote: string;
  }>;
  deepResearchUpdate:
    | { kind: 'no_new_deep_conclusion' }
    | {
        kind: 'referenced_update';
        reportId: string;
        version: string;
        evidenceIds: string[];
        updateNotice: string;
      }
    | {
        kind: 'structural_change_detected';
        evidenceIds: string[];
        updateNotice: string;
      };
  priorJudgementAudits?: PriorJudgementAudit[];
};

export type IndustryTrackingRequest = {
  reportType: 'industry_tracking';
  reportDate: string;
  dataAsOf: string;
  coreFocusConfig: CoreFocusConfig[];
  dailyFocusCandidateConfig: DailyFocusCandidateConfig[];
  dailyFocusSelections: DailyFocusSelection[];
  exitedDailyFocus: DailyFocusExitRecord[];
  themeConfig: ThemeConfig[];
  selectedThemeIds: string[];
  industries: IndustrySectionInput[];
  sources: SourceEvidence[];
};

export type IndustryTrackingReport = {
  reportType: 'industry_tracking';
  reportDate: string;
  title: string;
  version: 'v1.0';
  dataAsOf: string;
  marketScopes: ['cn_a'];
  industryTags: string[];
  themes: ThemeOutput[];
  coreFocusIds: string[];
  dailyFocusIds: string[];
  industries: IndustrySectionInput[];
  sources: SourceEvidence[];
  contentHtml: string;
};
