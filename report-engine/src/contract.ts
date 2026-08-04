import { validateHtmlPolicy, validateTextCompliance } from './html-policy.js';
import {
  validateIndustryTrackingReport,
  validateIndustryTrackingRequest,
} from './industry-tracking.js';
import type {
  IndustryTrackingReport,
  IndustryTrackingRequest,
} from './industry-tracking.types.js';

export type EvidenceItem = {
  title: string;
  url: string;
  publishedAt: string;
};

export type SupportedReportType =
  | 'morning_scan'
  | 'midday_review'
  | 'daily_review'
  | 'industry_tracking';

export type PriorAssessmentStatus =
  | '已验证'
  | '部分验证'
  | '未验证'
  | '失效';

export type PriorAssessment = {
  reportId: string;
  reportDate: string;
  reportType: 'morning_scan' | 'midday_review' | 'daily_review';
  originalJudgement: string;
  status: PriorAssessmentStatus;
  validationEvidence: EvidenceItem[];
};

type BaseGenerateRequest = {
  reportDate: string;
  evidence: EvidenceItem[];
  draftHtml?: string;
};

export type MorningScanRequest = BaseGenerateRequest & {
  reportType: 'morning_scan';
};

export type MiddayReviewRequest = BaseGenerateRequest & {
  reportType: 'midday_review';
  priorAssessments: PriorAssessment[];
};

export type DailyReviewRequest = Omit<BaseGenerateRequest, 'draftHtml'> & {
  reportType: 'daily_review';
  dataAsOf: string;
  priorAssessments: PriorAssessment[];
};

export type GenerateRequest =
  | MorningScanRequest
  | MiddayReviewRequest
  | DailyReviewRequest
  | IndustryTrackingRequest;

export type BaseReport = {
  reportDate: string;
  title: string;
  version: 'v1.0';
  dataAsOf: string;
  sourceLinks: EvidenceItem[];
  contentHtml: string;
};

export type MorningScanReport = BaseReport & {
  reportType: 'morning_scan';
};

export type MiddayReviewReport = BaseReport & {
  reportType: 'midday_review';
  priorAssessments: PriorAssessment[];
};

export type DailyReviewReport = BaseReport & {
  reportType: 'daily_review';
  marketScopes: ['cn_a'];
  priorAssessments: PriorAssessment[];
};

export type GeneratedReport =
  | MorningScanReport
  | MiddayReviewReport
  | DailyReviewReport
  | IndustryTrackingReport;

export type GenerateSuccess = {
  kind: 'success';
  report: GeneratedReport;
};

export type GenerateError = {
  kind: 'error';
  errorCode:
    | 'INVALID_REQUEST'
    | 'UNSUPPORTED_REPORT_TYPE'
    | 'INVALID_REPORT_DATE'
    | 'SOURCE_EVIDENCE_INSUFFICIENT'
    | 'PRIOR_ASSESSMENT_INSUFFICIENT'
    | 'INDUSTRY_TRACKING_INSUFFICIENT'
    | 'COMPLIANCE_VIOLATION'
    | 'UNSAFE_HTML'
    | 'OUTPUT_CONTRACT_VIOLATION';
  message: string;
};

export type ValidationResult<T> =
  | { ok: true; value: T }
  | { ok: false; error: GenerateError };

export function failure(
  errorCode: GenerateError['errorCode'],
  message: string,
): GenerateError {
  return { kind: 'error', errorCode, message };
}

function fail<T>(
  errorCode: GenerateError['errorCode'],
  message: string,
): ValidationResult<T> {
  return { ok: false, error: failure(errorCode, message) };
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

export function isCalendarDate(value: unknown): value is string {
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
  if (typeof value !== 'string') return false;
  if (
    !/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}(?::\d{2}(?:\.\d{1,3})?)?(?:Z|[+-]\d{2}:\d{2})$/u.test(
      value,
    )
  ) {
    return false;
  }

  return Number.isFinite(Date.parse(value)) && isCalendarDate(value.slice(0, 10));
}

function isSameShanghaiDate(value: string, reportDate: string): boolean {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: 'Asia/Shanghai',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(new Date(value));
  const getPart = (type: Intl.DateTimeFormatPartTypes) =>
    parts.find((part) => part.type === type)?.value ?? '';

  return `${getPart('year')}-${getPart('month')}-${getPart('day')}` === reportDate;
}

const dailyRequiredHeadings = [
  '<h1>每日复盘</h1>',
  '<h2>一句话总览</h2>',
  '<h2>市场表现</h2>',
  '<h2>主线与板块</h2>',
  '<h2>重要事件与公告</h2>',
  '<h2>情绪与结构观察</h2>',
  '<h2>当日判断验证表</h2>',
  '<h2>次日观察清单</h2>',
] as const;

function hasCompleteDailyStructure(contentHtml: string): boolean {
  return (
    dailyRequiredHeadings.every((heading) => contentHtml.includes(heading)) &&
    contentHtml.endsWith('<p>仅供信息参考，不构成投资建议。</p></article>')
  );
}

function isHttpsUrl(value: unknown): value is string {
  if (typeof value !== 'string' || value.trim() === '') return false;

  try {
    const url = new URL(value);
    return url.protocol === 'https:' && url.username === '' && url.password === '';
  } catch {
    return false;
  }
}

function isEvidenceItem(value: unknown): value is EvidenceItem {
  return (
    isRecord(value) &&
    typeof value.title === 'string' &&
    value.title.trim() !== '' &&
    isHttpsUrl(value.url) &&
    isIsoDateTime(value.publishedAt)
  );
}

export function validatePriorAssessments(
  value: unknown,
  reportDate: string,
  reportType: 'midday_review' | 'daily_review',
): ValidationResult<PriorAssessment[]> {
  const errorMessage =
    reportType === 'daily_review'
      ? '每日复盘必须包含可追溯的当日早盘和同日午间复盘判断验证记录。'
      : '午间复盘必须包含可追溯的当日早盘和此前复盘判断验证记录。';
  const error = () =>
    fail<PriorAssessment[]>(
      'PRIOR_ASSESSMENT_INSUFFICIENT',
      errorMessage,
    );

  if (!Array.isArray(value) || value.length === 0) {
    return error();
  }

  const priorAssessments: PriorAssessment[] = [];
  let hasMorningScan = false;
  let hasRequiredReview = false;
  const reportIds = new Set<string>();

  for (const assessment of value) {
    if (
      !isRecord(assessment) ||
      typeof assessment.reportId !== 'string' ||
      assessment.reportId.trim() === '' ||
      typeof assessment.originalJudgement !== 'string' ||
      assessment.originalJudgement.trim() === '' ||
      !isCalendarDate(assessment.reportDate) ||
      (assessment.reportType !== 'morning_scan' &&
        assessment.reportType !== 'midday_review' &&
        assessment.reportType !== 'daily_review') ||
      (assessment.status !== '已验证' &&
        assessment.status !== '部分验证' &&
        assessment.status !== '未验证' &&
        assessment.status !== '失效') ||
      !Array.isArray(assessment.validationEvidence) ||
      !assessment.validationEvidence.every(isEvidenceItem)
    ) {
      return error();
    }

    if (
      (assessment.status !== '未验证' &&
        assessment.validationEvidence.length === 0) ||
      (reportType === 'midday_review' &&
        ((assessment.reportType === 'morning_scan' &&
          assessment.reportDate !== reportDate) ||
          (assessment.reportType === 'daily_review' &&
            assessment.reportDate >= reportDate) ||
          assessment.reportType === 'midday_review')) ||
      (reportType === 'daily_review' &&
        ((assessment.reportType === 'daily_review' &&
          assessment.reportDate >= reportDate) ||
          (assessment.reportType !== 'daily_review' &&
            assessment.reportDate !== reportDate) ||
          reportIds.has(assessment.reportId)))
    ) {
      return error();
    }

    if (assessment.reportType === 'morning_scan') {
      hasMorningScan = true;
    } else if (
      (reportType === 'midday_review' && assessment.reportType === 'daily_review') ||
      (reportType === 'daily_review' && assessment.reportType === 'midday_review')
    ) {
      hasRequiredReview = true;
    }

    reportIds.add(assessment.reportId);
    priorAssessments.push({
      reportId: assessment.reportId,
      reportDate: assessment.reportDate,
      reportType: assessment.reportType,
      originalJudgement: assessment.originalJudgement,
      status: assessment.status,
      validationEvidence: assessment.validationEvidence,
    });
  }

  if (!hasMorningScan || !hasRequiredReview) {
    return error();
  }

  return { ok: true, value: priorAssessments };
}

export function validateGenerateRequest(
  input: unknown,
): ValidationResult<GenerateRequest> {
  if (!isRecord(input)) {
    return fail('INVALID_REQUEST', '请求必须是对象。');
  }

  if (input.reportType === 'industry_tracking') {
    return validateIndustryTrackingRequest(input);
  }

  if (
    input.reportType !== 'morning_scan' &&
    input.reportType !== 'midday_review' &&
    input.reportType !== 'daily_review'
  ) {
    return fail(
      'UNSUPPORTED_REPORT_TYPE',
      '当前固定样例原型不支持该报告类型。',
    );
  }

  if (!isCalendarDate(input.reportDate)) {
    return fail(
      'INVALID_REPORT_DATE',
      'reportDate 必须是实际存在的 YYYY-MM-DD 日期。',
    );
  }

  if (
    !Array.isArray(input.evidence) ||
    input.evidence.length === 0 ||
    !input.evidence.every(isEvidenceItem)
  ) {
    return fail(
      'SOURCE_EVIDENCE_INSUFFICIENT',
      '每条来源都必须包含标题、HTTPS URL 和 ISO-8601 时间。',
    );
  }

  if (input.draftHtml !== undefined && typeof input.draftHtml !== 'string') {
    return fail('INVALID_REQUEST', 'draftHtml 必须是字符串。');
  }

  if (input.reportType === 'morning_scan') {
    return {
      ok: true,
      value: {
        reportType: input.reportType,
        reportDate: input.reportDate,
        evidence: input.evidence,
        ...(input.draftHtml === undefined ? {} : { draftHtml: input.draftHtml }),
      },
    };
  }

  if (input.reportType === 'daily_review') {
    if ('draftHtml' in input) {
      return fail('INVALID_REQUEST', 'daily_review 不接受 draftHtml。');
    }

    const dataAsOf = input.dataAsOf;
    if (
      !isIsoDateTime(dataAsOf) ||
      !isSameShanghaiDate(dataAsOf, input.reportDate)
    ) {
      return fail(
        'INVALID_REQUEST',
        'daily_review 的 dataAsOf 必须是与 reportDate 同日的 ISO-8601 时间。',
      );
    }

    if (input.evidence.some((item) => Date.parse(item.publishedAt) > Date.parse(dataAsOf))) {
      return fail(
        'SOURCE_EVIDENCE_INSUFFICIENT',
        'daily_review 的来源时间不得晚于 dataAsOf。',
      );
    }

    const priorAssessmentsResult = validatePriorAssessments(
      input.priorAssessments,
      input.reportDate,
      input.reportType,
    );
    if (!priorAssessmentsResult.ok) {
      return priorAssessmentsResult;
    }

    return {
      ok: true,
      value: {
        reportType: input.reportType,
        reportDate: input.reportDate,
        dataAsOf,
        evidence: input.evidence,
        priorAssessments: priorAssessmentsResult.value,
      },
    };
  }

  const priorAssessmentsResult = validatePriorAssessments(
    input.priorAssessments,
    input.reportDate,
    input.reportType,
  );
  if (!priorAssessmentsResult.ok) {
    return priorAssessmentsResult;
  }

  return {
    ok: true,
    value: {
      reportType: input.reportType,
      reportDate: input.reportDate,
      evidence: input.evidence,
      priorAssessments: priorAssessmentsResult.value,
      ...(input.draftHtml === undefined ? {} : { draftHtml: input.draftHtml }),
    },
  };
}

export function validateGeneratedReport(
  value: unknown,
): ValidationResult<GeneratedReport> {
  if (!isRecord(value)) {
    return fail('OUTPUT_CONTRACT_VIOLATION', '报告输出必须是对象。');
  }

  if (value.reportType === 'industry_tracking') {
    return validateIndustryTrackingReport(value);
  }

  if (
    value.reportType !== 'morning_scan' &&
    value.reportType !== 'midday_review' &&
    value.reportType !== 'daily_review'
  ) {
    return fail('OUTPUT_CONTRACT_VIOLATION', '报告输出类型无效。');
  }

  if (!isCalendarDate(value.reportDate)) {
    return fail('OUTPUT_CONTRACT_VIOLATION', '报告输出日期无效。');
  }

  if (typeof value.title !== 'string' || value.title.trim() === '') {
    return fail('OUTPUT_CONTRACT_VIOLATION', '报告输出缺少标题。');
  }

  if (value.version !== 'v1.0') {
    return fail('OUTPUT_CONTRACT_VIOLATION', '报告输出版本无效。');
  }

  if (!isIsoDateTime(value.dataAsOf)) {
    return fail('OUTPUT_CONTRACT_VIOLATION', '报告输出数据截至时间无效。');
  }
  const dataAsOf = value.dataAsOf;

  if (
    !Array.isArray(value.sourceLinks) ||
    value.sourceLinks.length === 0 ||
    !value.sourceLinks.every(isEvidenceItem)
  ) {
    return fail('OUTPUT_CONTRACT_VIOLATION', '报告输出来源无效。');
  }

  if (typeof value.contentHtml !== 'string' || value.contentHtml.trim() === '') {
    return fail('OUTPUT_CONTRACT_VIOLATION', '报告输出正文无效。');
  }

  const htmlResult = validateHtmlPolicy(value.contentHtml);
  if (!htmlResult.ok) {
    return fail(htmlResult.errorCode, htmlResult.message);
  }

  if (value.reportType === 'midday_review') {
    const priorAssessmentsResult = validatePriorAssessments(
      value.priorAssessments,
      value.reportDate,
      'midday_review',
    );
    if (!priorAssessmentsResult.ok) {
      return priorAssessmentsResult;
    }

    for (const assessment of priorAssessmentsResult.value) {
      const complianceResult = validateTextCompliance(
        assessment.originalJudgement,
      );
      if (!complianceResult.ok) {
        return fail(complianceResult.errorCode, complianceResult.message);
      }
    }

    return {
      ok: true,
      value: {
        reportType: 'midday_review',
        reportDate: value.reportDate,
        title: value.title,
        version: value.version,
        dataAsOf,
        sourceLinks: value.sourceLinks,
        priorAssessments: priorAssessmentsResult.value,
        contentHtml: htmlResult.value,
      },
    };
  }

  if (value.reportType === 'daily_review') {
    if (
      value.title !== `每日复盘｜${value.reportDate}｜v1.0` ||
      !isSameShanghaiDate(dataAsOf, value.reportDate) ||
      value.sourceLinks.some(
        (item) => Date.parse(item.publishedAt) > Date.parse(dataAsOf),
      ) ||
        !Array.isArray(value.marketScopes) ||
        value.marketScopes.length !== 1 ||
        value.marketScopes[0] !== 'cn_a' ||
        !hasCompleteDailyStructure(htmlResult.value)
    ) {
      return fail('OUTPUT_CONTRACT_VIOLATION', '每日复盘输出契约无效。');
    }

    const priorAssessmentsResult = validatePriorAssessments(
      value.priorAssessments,
      value.reportDate,
      'daily_review',
    );
    if (!priorAssessmentsResult.ok) {
      return priorAssessmentsResult;
    }

    for (const assessment of priorAssessmentsResult.value) {
      const complianceResult = validateTextCompliance(
        assessment.originalJudgement,
      );
      if (!complianceResult.ok) {
        return fail(complianceResult.errorCode, complianceResult.message);
      }
    }

    return {
      ok: true,
      value: {
        reportType: 'daily_review',
        reportDate: value.reportDate,
        title: value.title,
        version: value.version,
        dataAsOf,
        sourceLinks: value.sourceLinks,
        marketScopes: ['cn_a'],
        priorAssessments: priorAssessmentsResult.value,
        contentHtml: htmlResult.value,
      },
    };
  }

  return {
    ok: true,
    value: {
      reportType: value.reportType,
      reportDate: value.reportDate,
      title: value.title,
      version: value.version,
      dataAsOf,
      sourceLinks: value.sourceLinks,
      contentHtml: htmlResult.value,
    },
  };
}
