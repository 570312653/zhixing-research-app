# Clean Coze Skill Build Brief

Build one private skill named **Zhixing Secure Delivery Clean**.

## Purpose and trigger

The Skill is called by the Zhixing report Calendar Agent only after that Agent has already produced a structured delivery JSON payload. The Skill must deliver the unchanged payload to the fixed Zhixing test receiver. It does not generate reports, edit reports, store reports, schedule tasks, access user data, send notifications, or install itself into an Agent.

## Fixed destination

- POST only: `https://phase1-webhook-test.vercel.app/api/coze-delivery-test`
- The URL is a code constant. No command argument, normal variable, prompt instruction, file, redirect, or caller input may replace it.
- Do not follow redirects.

## Credential model

- Create an API Key type **developer credential variable** named `ZHIXING_DELIVERY_TOKEN`.
- Its sole allowed domain is `phase1-webhook-test.vercel.app`.
- The actual value is never entered during development or test packaging.
- The Skill must never create or use `SECRET.md`, `.env`, ordinary environment variables, prompt text, source code, logs, examples, or packaged files for a token.
- At runtime only, use the platform-injected credential to send `Authorization: Bearer <token>`.

## Required input and validation

Input is a JSON object. Require non-empty strings:

- `delivery_id`
- `delivery_type`, exactly `report` or `watchlist_snapshot`
- `schema_version`

Reject invalid payloads before any HTTP call. Never generate defaults for these fields.

## HTTP behavior

- POST `application/json`.
- On 2xx return only a safe status and `delivery_id`.
- Do not return or log report bodies, source links, request headers, credential values, or upstream response bodies.
- Do not retry 400, 401, 403, or any other 4xx except 429.
- Retry 429, 5xx, and network timeouts after 1 minute, 5 minutes, and 15 minutes; at most three attempts.

## Testing and packaging

- Add mocked unit tests for valid input, missing fields, unsupported type, 401, 429, 5xx, and timeout.
- Tests must not perform a real HTTP request and must not use a token.
- Run syntax checks and tests, then package the Skill.
- Do not publish, upload, install, deploy, or configure a token.
