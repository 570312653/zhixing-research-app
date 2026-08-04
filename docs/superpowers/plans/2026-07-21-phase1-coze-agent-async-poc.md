# Phase 1 Coze Agent Async POC Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add two protected, test-only endpoints that submit a fixed request to Coze `/async_run` and retrieve its status from `/task/{task_id}`, without changing the proven stream endpoint or any production application feature.

**Architecture:** The new submit handler reuses the existing fixed request whitelist and server-only Coze credentials, calls `/async_run`, and only returns a strictly recognized, sanitized task envelope. The status handler accepts the task identifier in a POST body, calls `/task/{task_id}`, and only returns a strictly recognized pending, success, or structured error envelope. Unknown upstream shapes fail closed as `422 coze_async_response_unrecognized`; raw Coze payloads, prompts, tokens, and report content are never logged or returned for diagnostics.

**Tech Stack:** Node.js 20 CommonJS, Vercel Serverless Functions, Node built-in `node:test`, existing `phase1-webhook-test` POC.

## Global Constraints

- Scope is limited to `D:\Codex\投顾APP\phase1-webhook-test`; do not create Cron, database, user, archive, publish, notification, or Calendar integrations.
- Do not read, print, copy, create, or store `PHASE1_ADMIN_TOKEN` or `COZE_AGENT_API_TOKEN`; Vercel Production is the only credential location.
- Both new routes require `Authorization: Bearer <PHASE1_ADMIN_TOKEN>` and only accept `POST`.
- The existing `POST /api/coze-agent-poc-run` stream route and historical `POST /api/coze-delivery-test` route must remain behaviorally unchanged.
- Unknown request fields are discarded before Coze is called. Unknown Coze response shapes are rejected rather than guessed.
- Logs may contain route event names, HTTP status, elapsed milliseconds, safe task-id presence/length, and top-level key names only. They must not contain credentials, authorization headers, prompts, report content, or raw upstream JSON.
- This is not a production integration. A potentially exposed Coze token must be replaced before any formal or real-report integration conclusion.

---

## File Structure

- Modify `D:\Codex\投顾APP\phase1-webhook-test\lib\coze-agent-poc.js`: own async request construction plus strict, pure parsing and validation for submit/status envelopes.
- Create `D:\Codex\投顾APP\phase1-webhook-test\api\coze-agent-poc-async-run.js`: own protected async submission HTTP boundary.
- Create `D:\Codex\投顾APP\phase1-webhook-test\api\coze-agent-poc-async-status.js`: own protected async status HTTP boundary.
- Modify `D:\Codex\投顾APP\phase1-webhook-test\test\coze-agent-poc.test.js`: specify all new pure helper behavior before implementation.
- Modify `D:\Codex\投顾APP\phase1-webhook-test\vercel.json`: set a short explicit maximum duration for both non-streaming POC routes.
- Modify `D:\Codex\投顾APP\phase1-webhook-test\README.md` and `D:\Codex\投顾APP\docs\phase1-coze-agent-api-poc-spec.md`: document exact test-only routes, error semantics, and manual Postman acceptance procedure.

### Task 1: Define strict async contract helpers

**Files:**
- Modify: `D:\Codex\投顾APP\phase1-webhook-test\test\coze-agent-poc.test.js`
- Modify: `D:\Codex\投顾APP\phase1-webhook-test\lib\coze-agent-poc.js`

**Interfaces:**
- Produces `buildCozeAsyncRequest(projectId, businessRequest)` returning the same fixed `content.query.prompt`, `type`, fresh `session_id`, and numeric `project_id` envelope as the stream request.
- Produces `normalizeAsyncStatusRequest(payload)` returning `{ task_id }` only when `task_id` is a trimmed 1–200 character `[A-Za-z0-9_-]` string; otherwise `{}`.
- Produces `extractAsyncSubmission(payload)` and `extractAsyncStatus(payload)` returning either `{ ok: true, value: sanitizedEnvelope }` or `{ ok: false, error_code: "coze_async_response_unrecognized" }`.

- [ ] **Step 1: Write failing tests for the intended pure interface**

Add tests that require a fresh async session, discard unexpected status-body fields, accept only an exact controlled `{ "task_id": "task_abc", "status": "queued" }` submission fixture, accept only exact controlled pending and terminal fixtures, and reject any additional/raw response fields.

- [ ] **Step 2: Run the tests to verify they fail**

Run: `npm test`

Expected: FAIL because the async helper exports do not yet exist.

- [ ] **Step 3: Implement the smallest strict helpers**

Implement only the four exported helpers. Reuse `buildCozeStreamRequest` to preserve the existing fixed request format. Do not add generic recursive parsing, fallbacks, or raw-response passthrough.

- [ ] **Step 4: Run the test suite to verify the helpers are green**

Run: `npm test`

Expected: all previous tests and the new async helper tests PASS.

### Task 2: Add protected async submission endpoint

**Files:**
- Modify: `D:\Codex\投顾APP\phase1-webhook-test\test\coze-agent-poc.test.js`
- Create: `D:\Codex\投顾APP\phase1-webhook-test\api\coze-agent-poc-async-run.js`
- Modify: `D:\Codex\投顾APP\phase1-webhook-test\vercel.json`

**Interfaces:**
- Consumes `isAuthorized`, `normalizeBusinessRequest`, `buildCozeAsyncRequest`, `extractAsyncSubmission`, and `validateCozeBaseUrl`.
- Produces `POST /api/coze-agent-poc-async-run` responses: `401 unauthorized`, `400 invalid_json`, `422 coze_async_response_unrecognized`, `502 coze_async_upstream_rejected|coze_async_timeout|coze_async_request_failed`, or `200 { accepted: true, task: { task_id, status } }`.

- [ ] **Step 1: Write failing tests for submission response validation**

Add pure-contract tests proving an upstream `task_id` is not accepted if the response has an extra key, and proving the controlled exact fixture returns only `task_id` and `status`.

- [ ] **Step 2: Run the tests to verify they fail**

Run: `npm test`

Expected: FAIL until the strict submit extractor is implemented.

- [ ] **Step 3: Implement the minimal protected handler**

Mirror the existing stream route’s method, environment, authorization, JSON parsing, timeout, and sanitized logging behavior. Call only `${COZE_AGENT_BASE_URL}/async_run` with `Accept: application/json`; never return or log the upstream body. Use `maxDuration: 15` because submission must finish quickly.

- [ ] **Step 4: Run syntax and regression checks**

Run: `node --check api/coze-agent-poc-async-run.js; npm test`

Expected: syntax check exits 0 and all tests PASS.

### Task 3: Add protected async status endpoint

**Files:**
- Modify: `D:\Codex\投顾APP\phase1-webhook-test\test\coze-agent-poc.test.js`
- Create: `D:\Codex\投顾APP\phase1-webhook-test\api\coze-agent-poc-async-status.js`
- Modify: `D:\Codex\投顾APP\phase1-webhook-test\vercel.json`

**Interfaces:**
- Consumes `isAuthorized`, `normalizeAsyncStatusRequest`, `extractAsyncStatus`, and `validateCozeBaseUrl`.
- Produces `POST /api/coze-agent-poc-async-status` responses: `401 unauthorized`, `400 invalid_json|invalid_task_id`, `422 coze_async_response_unrecognized`, `502 coze_async_upstream_rejected|coze_async_timeout|coze_async_request_failed`, or `200 { accepted: true, task: sanitizedTaskStatus }`.

- [ ] **Step 1: Write failing tests for status request and terminal classification**

Add tests for malformed task id, exact pending fixture, exact terminal success fixture, exact terminal error fixture, and rejection of an unexpected upstream key.

- [ ] **Step 2: Run the tests to verify they fail**

Run: `npm test`

Expected: FAIL because the status parser does not yet exist.

- [ ] **Step 3: Implement the smallest protected status handler**

POST receives `{ "task_id": "..." }`, validates it, and calls `GET ${COZE_AGENT_BASE_URL}/task/${encodeURIComponent(task_id)}`. It logs only status code, elapsed time, and safe task-id length. It returns only the strictly classified status envelope and never raw final report content. Use `maxDuration: 15`.

- [ ] **Step 4: Run syntax and regression checks**

Run: `node --check api/coze-agent-poc-async-status.js; npm test`

Expected: syntax checks exit 0 and all tests PASS.

### Task 4: Document, deploy, and perform bounded manual acceptance tests

**Files:**
- Modify: `D:\Codex\投顾APP\phase1-webhook-test\README.md`
- Modify: `D:\Codex\投顾APP\docs\phase1-coze-agent-api-poc-spec.md`

- [ ] **Step 1: Document the two fixed routes and their error handling**

State that the run route is a submission test, the status route is a polling test, credentials remain in Vercel only, and an unrecognized Coze response is an expected fail-closed POC finding rather than a reason to loosen parsing.

- [ ] **Step 2: Run all local verification**

Run: `npm test; node --check lib/coze-agent-poc.js; node --check api/coze-agent-poc-async-run.js; node --check api/coze-agent-poc-async-status.js`

Expected: every command exits 0.

- [ ] **Step 3: Deploy only the existing test project to Vercel Production**

Run from `D:\Codex\投顾APP\phase1-webhook-test`: `vercel.cmd --prod`

Expected: Vercel reports a Ready production deployment and keeps `https://phase1-webhook-test.vercel.app` available.

- [ ] **Step 4: Run bounded manual tests in Postman**

Use the user-held `PHASE1_ADMIN_TOKEN` in Postman, submit one fixed valid payload, then poll with the returned `task_id`. Test an unauthorized request separately. Do not send report content, high request rates, or any real report generation task.

- [ ] **Step 5: Record factual evidence and gaps**

Append only confirmed results to `D:\Codex\投顾APP\AGENTS.md`, including deployment id, status codes, response-shape finding, and whether the status endpoint reached pending or terminal state. Do not record any token.

## Self-Review

- Spec coverage: Task 1 covers strict parsing and input containment; Tasks 2 and 3 cover the independent submit/poll routes, authentication, timeouts, and safe error behavior; Task 4 covers documentation, deployment, manual acceptance, and checkpoint recording.
- Placeholder scan: no `TODO`, `TBD`, or unspecified error-handling steps remain.
- Interface consistency: both handlers use the same existing server-only environment model; `task_id` is POST body input for the status endpoint and a sanitized field in the submit response.

## Execution Note

This repository has no Git history, so no commit or worktree operation is available. The bounded POC changes and their verification evidence are recorded in the project documentation and `AGENTS.md` instead. The user has already selected inline execution by authorizing code, tests, and deployment in this task.
