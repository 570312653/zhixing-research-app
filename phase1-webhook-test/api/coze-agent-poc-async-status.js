const {
  extractAsyncStatus,
  describeAsyncEnvelopeShape,
  isAuthorized,
  normalizeAsyncStatusRequest,
  validateCozeBaseUrl,
} = require("../lib/coze-agent-poc");

const MAX_UPSTREAM_WAIT_MS = 12_000;

function readBody(body) {
  if (typeof body === "string") return JSON.parse(body);
  if (Buffer.isBuffer(body)) return JSON.parse(body.toString("utf8"));
  return body;
}

function configuredEnvironment() {
  const environment = {
    adminToken: process.env.PHASE1_ADMIN_TOKEN,
    cozeToken: process.env.COZE_AGENT_API_TOKEN,
    cozeBaseUrl: process.env.COZE_AGENT_BASE_URL,
  };

  if (
    !environment.adminToken ||
    !environment.cozeToken ||
    !validateCozeBaseUrl(environment.cozeBaseUrl)
  ) {
    return null;
  }

  return environment;
}

module.exports = async (request, response) => {
  response.setHeader("Cache-Control", "no-store");

  if (request.method !== "POST") {
    response.setHeader("Allow", "POST");
    return response.status(405).json({ error_code: "method_not_allowed" });
  }

  const environment = configuredEnvironment();
  if (!environment) {
    return response.status(503).json({ error_code: "poc_not_configured" });
  }

  if (!isAuthorized(request.headers.authorization, environment.adminToken)) {
    return response.status(401).json({ error_code: "unauthorized" });
  }

  let taskRequest;
  try {
    taskRequest = normalizeAsyncStatusRequest(readBody(request.body));
  } catch {
    return response.status(400).json({ error_code: "invalid_json" });
  }

  if (!taskRequest.task_id) {
    return response.status(400).json({ error_code: "invalid_task_id" });
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), MAX_UPSTREAM_WAIT_MS);
  const startedAt = Date.now();

  try {
    const upstream = await fetch(
      `${environment.cozeBaseUrl}/task/${encodeURIComponent(taskRequest.task_id)}`,
      {
        method: "GET",
        headers: {
          Authorization: `Bearer ${environment.cozeToken}`,
          Accept: "application/json",
        },
        signal: controller.signal,
      },
    );

    if (!upstream.ok) {
      console.info(
        JSON.stringify({
          event: "coze_agent_async_status_upstream_rejected",
          status: upstream.status,
          elapsed_ms: Date.now() - startedAt,
          task_id_length: taskRequest.task_id.length,
        }),
      );
      return response.status(502).json({
        error_code: "coze_async_upstream_rejected",
        upstream_status: upstream.status,
      });
    }

    let upstreamPayload;
    try {
      upstreamPayload = await upstream.json();
    } catch {
      console.info(
        JSON.stringify({
          event: "coze_agent_async_status_contract_rejected",
          error_code: "coze_async_response_unrecognized",
          elapsed_ms: Date.now() - startedAt,
          task_id_length: taskRequest.task_id.length,
          response_shape: describeAsyncEnvelopeShape(null),
        }),
      );
      return response.status(422).json({
        error_code: "coze_async_response_unrecognized",
      });
    }

    const validated = extractAsyncStatus(upstreamPayload);
    if (!validated.ok) {
      console.info(
        JSON.stringify({
          event: "coze_agent_async_status_contract_rejected",
          error_code: validated.error_code,
          elapsed_ms: Date.now() - startedAt,
          task_id_length: taskRequest.task_id.length,
          response_shape: describeAsyncEnvelopeShape(upstreamPayload),
        }),
      );
      return response.status(422).json({ error_code: validated.error_code });
    }

    console.info(
      JSON.stringify({
        event: "coze_agent_async_status_accepted",
        elapsed_ms: Date.now() - startedAt,
        task_id_length: taskRequest.task_id.length,
        status: validated.value.status,
      }),
    );

    return response.status(200).json({ accepted: true, task: validated.value });
  } catch (error) {
    const errorCode =
      error?.name === "AbortError"
        ? "coze_async_timeout"
        : "coze_async_request_failed";
    console.info(
      JSON.stringify({
        event: "coze_agent_async_status_request_failed",
        error_code: errorCode,
        elapsed_ms: Date.now() - startedAt,
        task_id_length: taskRequest.task_id.length,
      }),
    );
    return response.status(502).json({ error_code: errorCode });
  } finally {
    clearTimeout(timeout);
  }
};
