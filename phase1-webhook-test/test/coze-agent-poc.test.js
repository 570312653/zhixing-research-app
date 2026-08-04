const test = require("node:test");
const assert = require("node:assert/strict");

const {
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
} = require("../lib/coze-agent-poc");

const request = {
  schema_version: "1.0",
  request_id: "poc-morning-20260720-001",
  report_type: "morning_scan",
  report_date: "2026-07-20",
  target_publish_at: "2026-07-20T09:00:00+08:00",
};

function successResponse() {
  return {
    response_schema_version: "1.0",
    result: {
      schema_version: "1.0",
      delivery_id: "poc-delivery-001",
      delivery_type: "report",
      request_id: request.request_id,
      report_id: "poc-morning-2026-07-20",
      report_type: "morning_scan",
      report_date: "2026-07-20",
      version: "v1.0",
      title: "知行测试｜早盘扫描｜2026-07-20｜v1.0",
      summary_points: ["这是 API 契约验证用的固定测试内容。"],
      content_html: "<p>这是 API 契约验证用的固定测试内容，不构成投资建议。</p>",
      market_scopes: ["us_equities", "global_futures"],
      industry_tags: [],
      theme_tags: [],
      source_links: [],
      data_as_of: "2026-07-20T08:45:00+08:00",
      generated_at: "2026-07-20T08:46:00+08:00",
    },
    run_id: "coze-platform-run-id",
  };
}

function sseFor(value) {
  return `event: message\ndata: ${JSON.stringify({ content: { text: JSON.stringify(value) } })}\n\n`;
}

function toolResponseSseFor(value) {
  return `event: message\ndata: ${JSON.stringify({
    content: { tool_response: { result: JSON.stringify(value) } },
  })}\n\n`;
}

test("discards unknown input fields before forwarding upstream", () => {
  assert.deepEqual(normalizeBusinessRequest({ ...request, ignored: "never-forward" }), request);
});

test("creates a fresh stream session and serializes the business request as prompt text", () => {
  const payload = buildCozeStreamRequest("7664606700401541129", request);
  assert.equal(payload.project_id, 7664606700401541129);
  assert.match(payload.session_id, /^zhixing-poc-/);
  assert.deepEqual(
    JSON.parse(payload.content.query.prompt[0].content.text),
    request,
  );
});

test("creates a fresh async session using the same fixed business request envelope", () => {
  const payload = buildCozeAsyncRequest("7664606700401541129", request);
  assert.equal(payload.project_id, 7664606700401541129);
  assert.match(payload.session_id, /^zhixing-poc-/);
  assert.deepEqual(
    JSON.parse(payload.content.query.prompt[0].content.text),
    request,
  );
});

test("only retains a safe task_id when checking async task status", () => {
  assert.deepEqual(
    normalizeAsyncStatusRequest({ task_id: "task_abc-123", ignored: "never-forward" }),
    { task_id: "task_abc-123" },
  );
  assert.deepEqual(normalizeAsyncStatusRequest({ task_id: "bad task id" }), {});
});

test("accepts only Coze's observed strict async submission envelope", () => {
  assert.deepEqual(
    extractAsyncSubmission({
      task_id: "task_abc",
      status: "pending",
      created_at: "2026-07-21T09:00:00+08:00",
      deadline: "2026-07-22T09:00:00+08:00",
    }),
    {
      ok: true,
      value: {
        task_id: "task_abc",
        status: "pending",
        deadline: "2026-07-22T09:00:00+08:00",
      },
    },
  );
  assert.deepEqual(
    extractAsyncSubmission({
      task_id: "task_abc",
      status: "pending",
      created_at: "2026-07-21T09:00:00+08:00",
      deadline: "2026-07-22T09:00:00+08:00",
      raw: "must-not-leak",
    }),
    { ok: false, error_code: "coze_async_response_unrecognized" },
  );
});

test("describes an async envelope without preserving any upstream values", () => {
  assert.deepEqual(
    describeAsyncEnvelopeShape({
      task_id: "task_abc",
      status: "queued",
      created_at: "2026-07-21T09:00:00+08:00",
      deadline: "2026-07-22T09:00:00+08:00",
    }),
    {
      response_keys: ["created_at", "deadline", "status", "task_id"],
      task_id_type: "string",
      task_id_is_safe: true,
      status_type: "string",
      status_is_non_empty: true,
      created_at_type: "string",
      created_at_is_parseable: true,
      deadline_type: "string",
      deadline_is_parseable: true,
      started_at_type: "undefined",
      started_at_is_null: false,
      completed_at_type: "undefined",
      completed_at_is_null: false,
      heartbeat_at_type: "undefined",
      heartbeat_at_is_null: false,
      claim_count_type: "undefined",
      error_type: "undefined",
      error_keys: [],
      result_type: "undefined",
      result_keys: [],
    },
  );
});

test("describes nested async status fields by type and key name only", () => {
  const shape = describeAsyncEnvelopeShape({
    task_id: "task_abc",
    status: "completed",
    created_at: "2026-07-21T09:00:00+08:00",
    deadline: "2026-07-22T09:00:00+08:00",
    started_at: "2026-07-21T09:01:00+08:00",
    completed_at: null,
    heartbeat_at: null,
    claim_count: 1,
    error: { code: "must-not-log-value" },
    result: { report: "must-not-log-value" },
  });

  assert.deepEqual(shape.error_keys, ["code"]);
  assert.deepEqual(shape.result_keys, ["report"]);
  assert.equal(shape.completed_at_is_null, true);
  assert.equal(shape.heartbeat_at_is_null, true);
  assert.equal(shape.claim_count_type, "number");
});

function observedAsyncTask(overrides = {}) {
  return {
    task_id: "task_abc",
    status: "failed",
    created_at: "2026-07-21T09:00:00+08:00",
    deadline: "2026-07-22T09:00:00+08:00",
    started_at: "2026-07-21T09:01:00+08:00",
    completed_at: "2026-07-21T09:02:00+08:00",
    heartbeat_at: null,
    claim_count: 1,
    error: { code: "agent-execution-failed", message: "must-not-return" },
    result: {},
    ...overrides,
  };
}

test("accepts Coze's observed terminal task envelope without returning result or error", () => {
  assert.deepEqual(
    extractAsyncStatus(observedAsyncTask()),
    {
      ok: true,
      value: {
        task_id: "task_abc",
        status: "failed",
        deadline: "2026-07-22T09:00:00+08:00",
        started_at: "2026-07-21T09:01:00+08:00",
        completed_at: "2026-07-21T09:02:00+08:00",
        has_error: true,
        has_result: false,
        error_code: "agent-execution-failed",
      },
    },
  );
});

test("accepts a completed task with a result without returning its content", () => {
  assert.deepEqual(
    extractAsyncStatus(
      observedAsyncTask({
        status: "succeeded",
        error: null,
        result: { report: "must-not-return" },
      }),
    ),
    {
      ok: true,
      value: {
        task_id: "task_abc",
        status: "succeeded",
        deadline: "2026-07-22T09:00:00+08:00",
        started_at: "2026-07-21T09:01:00+08:00",
        completed_at: "2026-07-21T09:02:00+08:00",
        has_error: false,
        has_result: true,
      },
    },
  );
});

test("rejects an async status envelope with unexpected fields", () => {
  assert.deepEqual(
    extractAsyncStatus(observedAsyncTask({ raw: "must-not-leak" })),
    { ok: false, error_code: "coze_async_response_unrecognized" },
  );
});

test("requires exact Bearer authorization", () => {
  assert.equal(isAuthorized("Bearer administrator-key", "administrator-key"), true);
  assert.equal(isAuthorized("Bearer wrong-key", "administrator-key"), false);
  assert.equal(isAuthorized(undefined, "administrator-key"), false);
});

test("accepts one strict success JSON result carried by SSE", () => {
  const result = extractAndValidateSseResult(sseFor(successResponse()), request);
  assert.equal(result.ok, true);
  assert.equal(result.kind, "success");
});

test("accepts a strict result carried by Coze's tool_response.result SSE path", () => {
  const result = extractAndValidateSseResult(
    toolResponseSseFor(successResponse()),
    request,
  );
  assert.equal(result.ok, true);
  assert.equal(result.kind, "success");
});

test("rejects prose wrapped around an otherwise valid JSON object", () => {
  const wrapped = `说明如下：${JSON.stringify(successResponse())}`;
  const result = extractAndValidateSseResult(
    `data: ${JSON.stringify({ content: { text: wrapped } })}\n\n`,
    request,
  );
  assert.deepEqual(result, { ok: false, error_code: "coze_result_not_strict_json" });
});

test("accepts the expected error contract for an invalid report type", () => {
  const invalidRequest = { ...request, report_type: "weekly" };
  const errorResponse = {
    schema_version: "1.0",
    request_id: request.request_id,
    status: "validation_error",
    error_code: "INVALID_REPORT_TYPE",
    retryable: false,
  };
  assert.deepEqual(expectedValidationError(invalidRequest), {
    requestId: request.request_id,
    errorCode: "INVALID_REPORT_TYPE",
  });
  assert.equal(
    extractAndValidateSseResult(sseFor(errorResponse), invalidRequest).ok,
    true,
  );
});

test("accepts the strict duplicate-request error for an otherwise valid request", () => {
  const errorResponse = {
    schema_version: "1.0",
    request_id: request.request_id,
    status: "validation_error",
    error_code: "DUPLICATE_REQUEST",
    retryable: false,
  };

  const result = extractAndValidateSseResult(sseFor(errorResponse), request);
  assert.equal(result.ok, true);
  assert.equal(result.kind, "validation_error");
});

test("accepts the missing request_id error contract with an empty identifier", () => {
  const missingRequestId = { ...request };
  delete missingRequestId.request_id;
  const errorResponse = {
    schema_version: "1.0",
    request_id: "",
    status: "validation_error",
    error_code: "MISSING_REQUIRED_FIELD",
    retryable: false,
  };

  assert.deepEqual(expectedValidationError(missingRequestId), {
    requestId: "",
    errorCode: "MISSING_REQUIRED_FIELD",
  });
  assert.equal(
    extractAndValidateSseResult(sseFor(errorResponse), missingRequestId).ok,
    true,
  );
});

test("only permits an HTTPS Coze deployment domain", () => {
  assert.equal(validateCozeBaseUrl("https://fbgyk4m8c3.coze.site"), true);
  assert.equal(validateCozeBaseUrl("http://fbgyk4m8c3.coze.site"), false);
  assert.equal(validateCozeBaseUrl("https://example.invalid"), false);
});
