const { randomUUID, timingSafeEqual } = require("node:crypto");

const RESPONSE_SCHEMA_VERSION = "1.0";
const REQUIRED_REQUEST_FIELDS = [
  "schema_version",
  "request_id",
  "report_type",
  "report_date",
  "target_publish_at",
];
const SUCCESS_RESULT_KEYS = [
  "schema_version",
  "delivery_id",
  "delivery_type",
  "request_id",
  "report_id",
  "report_type",
  "report_date",
  "version",
  "title",
  "summary_points",
  "content_html",
  "market_scopes",
  "industry_tags",
  "theme_tags",
  "source_links",
  "data_as_of",
  "generated_at",
];
const ERROR_KEYS = [
  "schema_version",
  "request_id",
  "status",
  "error_code",
  "retryable",
];
const ALLOWED_ERROR_CODES = new Set([
  "MISSING_REQUIRED_FIELD",
  "INVALID_SCHEMA_VERSION",
  "INVALID_REPORT_TYPE",
  "INVALID_REPORT_DATE",
  "INVALID_TARGET_PUBLISH_AT",
  "DUPLICATE_REQUEST",
  "INTERNAL_ERROR",
]);

function hasExactKeys(value, expectedKeys) {
  if (!value || typeof value !== "object" || Array.isArray(value)) return false;

  const actualKeys = Object.keys(value).sort();
  const expected = [...expectedKeys].sort();
  return (
    actualKeys.length === expected.length &&
    actualKeys.every((key, index) => key === expected[index])
  );
}

function isNonEmptyString(value) {
  return typeof value === "string" && value.trim() !== "";
}

function isValidDate(value) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;

  const [year, month, day] = value.split("-").map(Number);
  const date = new Date(Date.UTC(year, month - 1, day));
  return (
    date.getUTCFullYear() === year &&
    date.getUTCMonth() === month - 1 &&
    date.getUTCDate() === day
  );
}

function isShanghaiIsoTimestamp(value) {
  if (
    typeof value !== "string" ||
    !/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\+08:00$/.test(value)
  ) {
    return false;
  }

  return Number.isFinite(Date.parse(value));
}

function normalizeBusinessRequest(payload) {
  if (!payload || typeof payload !== "object" || Array.isArray(payload)) {
    return {};
  }

  // Unknown fields are deliberately discarded and are never logged or forwarded.
  return Object.fromEntries(
    REQUIRED_REQUEST_FIELDS.filter((key) => key in payload).map((key) => [
      key,
      payload[key],
    ]),
  );
}

function expectedValidationError(request) {
  const requestId = isNonEmptyString(request.request_id)
    ? request.request_id.trim()
    : "";

  if (!isNonEmptyString(request.schema_version)) {
    return { requestId, errorCode: "MISSING_REQUIRED_FIELD" };
  }
  if (request.schema_version !== RESPONSE_SCHEMA_VERSION) {
    return { requestId, errorCode: "INVALID_SCHEMA_VERSION" };
  }
  if (!isNonEmptyString(request.request_id)) {
    // Coze's deployed Agent preserves the string field with an empty value when
    // the caller omits request_id. The adapter treats that documented POC form
    // as the only valid missing-identifier response.
    return { requestId: "", errorCode: "MISSING_REQUIRED_FIELD" };
  }
  if (!isNonEmptyString(request.report_type)) {
    return { requestId, errorCode: "MISSING_REQUIRED_FIELD" };
  }
  if (request.report_type !== "morning_scan") {
    return { requestId, errorCode: "INVALID_REPORT_TYPE" };
  }
  if (!isNonEmptyString(request.report_date)) {
    return { requestId, errorCode: "MISSING_REQUIRED_FIELD" };
  }
  if (!isValidDate(request.report_date)) {
    return { requestId, errorCode: "INVALID_REPORT_DATE" };
  }
  if (!isNonEmptyString(request.target_publish_at)) {
    return { requestId, errorCode: "MISSING_REQUIRED_FIELD" };
  }
  if (!isShanghaiIsoTimestamp(request.target_publish_at)) {
    return { requestId, errorCode: "INVALID_TARGET_PUBLISH_AT" };
  }

  return null;
}

function isAuthorized(headerValue, expectedToken) {
  if (!isNonEmptyString(expectedToken) || typeof headerValue !== "string") {
    return false;
  }

  const expected = Buffer.from(`Bearer ${expectedToken}`);
  const received = Buffer.from(headerValue);
  return (
    received.length === expected.length && timingSafeEqual(received, expected)
  );
}

function buildCozeStreamRequest(projectId, businessRequest) {
  if (!/^\d+$/.test(String(projectId))) {
    throw new Error("invalid_coze_project_id");
  }

  return {
    content: {
      query: {
        prompt: [
          {
            type: "text",
            content: { text: JSON.stringify(businessRequest) },
          },
        ],
      },
    },
    type: "query",
    // A fresh session prevents a prior POC prompt from contaminating this run.
    session_id: `zhixing-poc-${randomUUID()}`,
    project_id: Number(projectId),
  };
}

function buildCozeAsyncRequest(projectId, businessRequest) {
  // The documented async endpoint accepts the same input envelope as the stream
  // endpoint. Reusing it prevents request-shape drift between the two POC paths.
  return buildCozeStreamRequest(projectId, businessRequest);
}

function isSafeTaskId(value) {
  return typeof value === "string" && /^[A-Za-z0-9_-]{1,200}$/.test(value);
}

function normalizeAsyncStatusRequest(payload) {
  if (!payload || typeof payload !== "object" || Array.isArray(payload)) {
    return {};
  }

  return isSafeTaskId(payload.task_id) ? { task_id: payload.task_id } : {};
}

function unrecognizedAsyncResponse() {
  return { ok: false, error_code: "coze_async_response_unrecognized" };
}

function isParseableTimestamp(value) {
  return isNonEmptyString(value) && Number.isFinite(Date.parse(value));
}

function describeAsyncEnvelopeShape(value) {
  const payload = value && typeof value === "object" && !Array.isArray(value)
    ? value
    : {};
  const nestedKeys = (nestedValue) =>
    nestedValue &&
    typeof nestedValue === "object" &&
    !Array.isArray(nestedValue)
      ? Object.keys(nestedValue).sort()
      : [];

  return {
    response_keys: Object.keys(payload).sort(),
    task_id_type: typeof payload.task_id,
    task_id_is_safe: isSafeTaskId(payload.task_id),
    status_type: typeof payload.status,
    status_is_non_empty: isNonEmptyString(payload.status),
    created_at_type: typeof payload.created_at,
    created_at_is_parseable: isParseableTimestamp(payload.created_at),
    deadline_type: typeof payload.deadline,
    deadline_is_parseable: isParseableTimestamp(payload.deadline),
    started_at_type: typeof payload.started_at,
    started_at_is_null: payload.started_at === null,
    completed_at_type: typeof payload.completed_at,
    completed_at_is_null: payload.completed_at === null,
    heartbeat_at_type: typeof payload.heartbeat_at,
    heartbeat_at_is_null: payload.heartbeat_at === null,
    claim_count_type: typeof payload.claim_count,
    error_type: typeof payload.error,
    error_keys: nestedKeys(payload.error),
    result_type: typeof payload.result,
    result_keys: nestedKeys(payload.result),
  };
}

function extractAsyncSubmission(payload) {
  if (!hasExactKeys(payload, ["created_at", "deadline", "status", "task_id"])) {
    return unrecognizedAsyncResponse();
  }

  if (
    !isSafeTaskId(payload.task_id) ||
    !isNonEmptyString(payload.status) ||
    !isParseableTimestamp(payload.created_at) ||
    !isParseableTimestamp(payload.deadline)
  ) {
    return unrecognizedAsyncResponse();
  }

  return {
    ok: true,
    value: {
      task_id: payload.task_id,
      status: payload.status,
      deadline: payload.deadline,
    },
  };
}

function extractAsyncStatus(payload) {
  if (
    !hasExactKeys(payload, [
      "claim_count",
      "completed_at",
      "created_at",
      "deadline",
      "error",
      "heartbeat_at",
      "result",
      "started_at",
      "status",
      "task_id",
    ])
  ) {
    return unrecognizedAsyncResponse();
  }

  const isPlainObject = (value) =>
    Boolean(value) && typeof value === "object" && !Array.isArray(value);
  const isOptionalTimestamp = (value) => value === null || isParseableTimestamp(value);
  const hasSafeErrorEnvelope =
    payload.error === null ||
    (isPlainObject(payload.error) && hasExactKeys(payload.error, ["code", "message"]));
  const hasSafeResultEnvelope = payload.result === null || isPlainObject(payload.result);

  if (
    !isSafeTaskId(payload.task_id) ||
    !isNonEmptyString(payload.status) ||
    !isParseableTimestamp(payload.created_at) ||
    !isParseableTimestamp(payload.deadline) ||
    !isOptionalTimestamp(payload.started_at) ||
    !isOptionalTimestamp(payload.completed_at) ||
    !isOptionalTimestamp(payload.heartbeat_at) ||
    !Number.isInteger(payload.claim_count) ||
    payload.claim_count < 0 ||
    !hasSafeErrorEnvelope ||
    !hasSafeResultEnvelope
  ) {
    return unrecognizedAsyncResponse();
  }

  const safeErrorCode =
    payload.error !== null &&
    typeof payload.error.code === "string" &&
    /^[A-Za-z][A-Za-z0-9_.:-]{1,127}$/.test(payload.error.code)
      ? payload.error.code
      : "COZE_TASK_FAILED";

  return {
    ok: true,
    value: {
      task_id: payload.task_id,
      status: payload.status,
      deadline: payload.deadline,
      started_at: payload.started_at,
      completed_at: payload.completed_at,
      has_error: payload.error !== null,
      has_result: isPlainObject(payload.result) && Object.keys(payload.result).length > 0,
      ...(payload.error !== null ? { error_code: safeErrorCode } : {}),
    },
  };
}

function parseSseDataRecords(sseBody) {
  if (typeof sseBody !== "string") return [];

  return sseBody
    .replace(/\r\n/g, "\n")
    .split("\n\n")
    .map((frame) =>
      frame
        .split("\n")
        .filter((line) => line.startsWith("data:"))
        .map((line) => line.slice(5).trimStart())
        .join("\n"),
    )
    .filter((data) => data && data !== "[DONE]");
}

function collectJsonValues(value, candidates) {
  if (typeof value === "string") {
    try {
      candidates.add(JSON.parse(value));
    } catch {
      // Text that is not a complete JSON value is deliberately ignored.
    }
    return;
  }

  if (!value || typeof value !== "object") return;
  candidates.add(value);

  for (const [key, child] of Object.entries(value)) {
    // Only traverse content-bearing fields. This prevents unrelated event metadata
    // from accidentally being interpreted as a business result.
    if (["content", "text", "answer", "output", "message", "data"].includes(key)) {
      collectJsonValues(child, candidates);
    }
  }
}

function collectQualifiedToolResponse(event, candidates) {
  // Coze's deployed Agent stream carries a tool's structured return value at this
  // exact path. It is deliberately not a recursive search: only this documented,
  // observed envelope is eligible, and the normal strict contract validation still
  // decides whether it may be accepted.
  const toolResult = event?.content?.tool_response?.result;
  if (typeof toolResult === "string") {
    try {
      candidates.add(JSON.parse(toolResult));
    } catch {
      // A non-JSON tool result is never interpreted as a valid business response.
    }
    return;
  }

  if (toolResult && typeof toolResult === "object" && !Array.isArray(toolResult)) {
    candidates.add(toolResult);
  }
}

function collectSseCandidates(sseBody) {
  const candidates = new Map();

  for (const dataRecord of parseSseDataRecords(sseBody)) {
    try {
      const event = JSON.parse(dataRecord);
      const nestedCandidates = new Set();
      collectJsonValues(event, nestedCandidates);
      collectQualifiedToolResponse(event, nestedCandidates);
      for (const candidate of nestedCandidates) {
        if (candidate && typeof candidate === "object" && !Array.isArray(candidate)) {
          candidates.set(JSON.stringify(candidate), candidate);
        }
      }
    } catch {
      // A malformed SSE frame is not a valid result and must not be recovered from.
    }
  }

  return candidates;
}

function validateSuccessResponse(output, request) {
  if (!hasExactKeys(output, ["response_schema_version", "result", "run_id"])) {
    return null;
  }
  if (
    output.response_schema_version !== RESPONSE_SCHEMA_VERSION ||
    !isNonEmptyString(output.run_id) ||
    !hasExactKeys(output.result, SUCCESS_RESULT_KEYS)
  ) {
    return null;
  }

  const result = output.result;
  const expectedTitle = `知行测试｜早盘扫描｜${request.report_date}｜v1.0`;
  const generatedAtIsValid = isShanghaiIsoTimestamp(result.generated_at);
  const matches =
    result.schema_version === RESPONSE_SCHEMA_VERSION &&
    result.delivery_id === "poc-delivery-001" &&
    result.delivery_type === "report" &&
    result.request_id === request.request_id &&
    result.report_id === `poc-morning-${request.report_date}` &&
    result.report_type === "morning_scan" &&
    result.report_date === request.report_date &&
    result.version === "v1.0" &&
    result.title === expectedTitle &&
    Array.isArray(result.summary_points) &&
    result.summary_points.length === 1 &&
    result.summary_points[0] === "这是 API 契约验证用的固定测试内容。" &&
    result.content_html ===
      "<p>这是 API 契约验证用的固定测试内容，不构成投资建议。</p>" &&
    JSON.stringify(result.market_scopes) ===
      JSON.stringify(["us_equities", "global_futures"]) &&
    Array.isArray(result.industry_tags) &&
    result.industry_tags.length === 0 &&
    Array.isArray(result.theme_tags) &&
    result.theme_tags.length === 0 &&
    Array.isArray(result.source_links) &&
    result.source_links.length === 0 &&
    result.data_as_of === `${request.report_date}T08:45:00+08:00` &&
    generatedAtIsValid;

  return matches ? { kind: "success", output } : null;
}

function validateErrorResponse(output, expectedError) {
  if (!expectedError || !hasExactKeys(output, ERROR_KEYS)) return null;

  const matches =
    output.schema_version === RESPONSE_SCHEMA_VERSION &&
    output.request_id === expectedError.requestId &&
    output.status === "validation_error" &&
    output.error_code === expectedError.errorCode &&
    ALLOWED_ERROR_CODES.has(output.error_code) &&
    output.retryable === false;

  return matches ? { kind: "validation_error", output } : null;
}

function validateDuplicateResponse(output, request) {
  if (!hasExactKeys(output, ERROR_KEYS)) return null;

  const matches =
    output.schema_version === RESPONSE_SCHEMA_VERSION &&
    output.request_id === request.request_id &&
    output.status === "validation_error" &&
    output.error_code === "DUPLICATE_REQUEST" &&
    output.retryable === false;

  return matches ? { kind: "validation_error", output } : null;
}

function extractAndValidateSseResult(sseBody, businessRequest) {
  const candidates = collectSseCandidates(sseBody);

  const expectedError = expectedValidationError(businessRequest);
  const validResults = [];
  for (const candidate of candidates.values()) {
    const validated = expectedError
      ? validateErrorResponse(candidate, expectedError)
      : validateSuccessResponse(candidate, businessRequest) ||
        validateDuplicateResponse(candidate, businessRequest);
    if (validated) validResults.push(validated);
  }

  if (validResults.length === 0) {
    return { ok: false, error_code: "coze_result_not_strict_json" };
  }
  if (validResults.length > 1) {
    return { ok: false, error_code: "ambiguous_stream_result" };
  }

  return { ok: true, ...validResults[0] };
}

function validateCozeBaseUrl(value) {
  try {
    const url = new URL(value);
    return url.protocol === "https:" && url.hostname.endsWith(".coze.site");
  } catch {
    return false;
  }
}

module.exports = {
  buildCozeAsyncRequest,
  buildCozeStreamRequest,
  describeAsyncEnvelopeShape,
  expectedValidationError,
  extractAsyncStatus,
  extractAsyncSubmission,
  extractAndValidateSseResult,
  isAuthorized,
  normalizeAsyncStatusRequest,
  normalizeBusinessRequest,
  validateCozeBaseUrl,
};
