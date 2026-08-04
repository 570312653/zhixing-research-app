import type { PriorAssessment, PriorAssessmentStatus } from './contract.js';

type Equal<Left, Right> =
  (<Value>() => Value extends Left ? 1 : 2) extends
  (<Value>() => Value extends Right ? 1 : 2)
    ? true
    : false;

type Assert<Value extends true> = Value;

type PriorAssessmentReportTypeIsNarrow = Assert<
  Equal<
    PriorAssessment['reportType'],
    'morning_scan' | 'midday_review' | 'daily_review'
  >
>;

type PriorAssessmentStatusIsNarrow = Assert<
  Equal<
    PriorAssessment['status'],
    '已验证' | '部分验证' | '未验证' | '失效'
  >
>;

type PriorAssessmentStatusIsExported = Assert<
  Equal<PriorAssessmentStatus, PriorAssessment['status']>
>;
