const { timingSafeEqual } = require("node:crypto");

function isAuthorized(headerValue, expectedToken) {
  if (!expectedToken || typeof headerValue !== "string") return false;

  const expected = Buffer.from(`Bearer ${expectedToken}`);
  const received = Buffer.from(headerValue);

  return (
    received.length === expected.length && timingSafeEqual(received, expected)
  );
}

function readBody(body) {
  if (typeof body === "string") return JSON.parse(body);
  if (Buffer.isBuffer(body)) return JSON.parse(body.toString("utf8"));
  return body;
}

function validatePayload(payload) {
  if (!payload || typeof payload !== "object" || Array.isArray(payload)) {
    return { error_code: "invalid_payload" };
  }

  for (const field of ["delivery_id", "delivery_type", "schema_version"]) {
    if (typeof payload[field] !== "string" || payload[field].trim() === "") {
      return { error_code: "missing_or_invalid_field", field };
    }
  }

  if (
    payload.delivery_type !== "report" &&
    payload.delivery_type !== "watchlist_snapshot"
  ) {
    return { error_code: "unsupported_delivery_type", field: "delivery_type" };
  }

  return null;
}

module.exports = (request, response) => {
  response.setHeader("Cache-Control", "no-store");

  if (request.method !== "POST") {
    response.setHeader("Allow", "POST");
    return response.status(405).json({ error_code: "method_not_allowed" });
  }

  if (
    !isAuthorized(
      request.headers.authorization,
      process.env.COZE_DELIVERY_TEST_TOKEN,
    )
  ) {
    return response.status(401).json({ error_code: "unauthorized" });
  }

  let payload;
  try {
    payload = readBody(request.body);
  } catch {
    return response.status(400).json({ error_code: "invalid_json" });
  }

  const validationError = validatePayload(payload);
  if (validationError) {
    return response.status(400).json(validationError);
  }

  // Deliberately log metadata only. Full report bodies and credentials are never logged.
  console.info(
    JSON.stringify({
      event: "coze_delivery_received",
      received_at: new Date().toISOString(),
      delivery_id: payload.delivery_id ?? null,
      delivery_type: payload.delivery_type ?? null,
      report_id: payload.report_id ?? null,
      snapshot_id: payload.snapshot_id ?? null,
      schema_version: payload.schema_version ?? null,
    }),
  );

  return response.status(202).json({
    accepted: true,
    delivery_id: payload.delivery_id ?? null,
  });
};
