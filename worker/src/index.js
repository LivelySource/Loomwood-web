const MAX_REQUEST_BYTES = 64_000;
const MAX_ANSWER_LENGTH = 4_000;
const EMBED_COLOR = {
  staff: 0x527a45,
  media: 0xdc9f3e
};

function corsHeaders(origin, allowedOrigins) {
  return {
    "Access-Control-Allow-Origin": allowedOrigins.includes(origin) ? origin : allowedOrigins[0],
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
    "Access-Control-Max-Age": "86400",
    "Vary": "Origin"
  };
}

function jsonResponse(body, status, headers) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...headers, "Content-Type": "application/json" }
  });
}

function sanitize(value, maxLength) {
  return String(value ?? "")
    .replace(/@/g, "@\u200b")
    .trim()
    .slice(0, maxLength);
}

function answerFields(answers) {
  const fields = [];

  for (const answer of answers) {
    const question = sanitize(answer.question, 256) || "Question";
    const value = sanitize(answer.value, MAX_ANSWER_LENGTH) || "No response";
    const chunks = value.match(/[\s\S]{1,1024}/g) || ["No response"];

    chunks.forEach((chunk, index) => {
      fields.push({
        name: index === 0 ? question : `${question} (continued)`.slice(0, 256),
        value: chunk,
        inline: false
      });
    });
  }

  return fields;
}

function buildEmbeds(type, answers, submittedAt) {
  const label = type === "staff" ? "Staff Application" : "Media Application";
  const fields = answerFields(answers);
  const embeds = [];
  let currentFields = [];
  let currentCharacters = 0;

  for (const field of fields) {
    const fieldCharacters = field.name.length + field.value.length;
    if (currentFields.length === 25 || currentCharacters + fieldCharacters > 5_200) {
      embeds.push(currentFields);
      currentFields = [];
      currentCharacters = 0;
    }
    currentFields.push(field);
    currentCharacters += fieldCharacters;
  }

  if (currentFields.length) embeds.push(currentFields);

  return embeds.slice(0, 10).map((embedFields, index) => ({
    title: embeds.length > 1 ? `${label} (${index + 1}/${embeds.length})` : label,
    color: EMBED_COLOR[type],
    fields: embedFields,
    footer: { text: "Loomwood Application Portal" },
    timestamp: submittedAt
  }));
}

export default {
  async fetch(request, env) {
    const origin = request.headers.get("Origin") || "";
    const allowedOrigins = (env.ALLOWED_ORIGINS || "")
      .split(",")
      .map((item) => item.trim())
      .filter(Boolean);
    const headers = corsHeaders(origin, allowedOrigins);

    if (request.method === "OPTIONS") {
      return new Response(null, { status: 204, headers });
    }

    if (request.method !== "POST") {
      return jsonResponse({ error: "Method not allowed." }, 405, headers);
    }

    if (!allowedOrigins.includes(origin)) {
      return jsonResponse({ error: "Origin not allowed." }, 403, headers);
    }

    const contentLength = Number(request.headers.get("Content-Length") || 0);
    if (contentLength > MAX_REQUEST_BYTES) {
      return jsonResponse({ error: "Application is too large." }, 413, headers);
    }

    let payload;
    try {
      const requestText = await request.text();
      if (requestText.length > MAX_REQUEST_BYTES) {
        return jsonResponse({ error: "Application is too large." }, 413, headers);
      }
      payload = JSON.parse(requestText);
    } catch {
      return jsonResponse({ error: "Invalid application data." }, 400, headers);
    }

    const type = payload.applicationType;
    if (!["staff", "media"].includes(type) || !Array.isArray(payload.answers)) {
      return jsonResponse({ error: "Invalid application type or answers." }, 400, headers);
    }

    if (payload.answers.length < 5 || payload.answers.length > 60) {
      return jsonResponse({ error: "Unexpected number of answers." }, 400, headers);
    }

    const webhookUrl = type === "staff"
      ? env.STAFF_WEBHOOK_URL || env.DISCORD_WEBHOOK_URL
      : env.MEDIA_WEBHOOK_URL || env.DISCORD_WEBHOOK_URL;

    if (!webhookUrl) {
      return jsonResponse({ error: "Webhook is not configured." }, 503, headers);
    }

    const submittedAt = Number.isNaN(Date.parse(payload.submittedAt))
      ? new Date().toISOString()
      : new Date(payload.submittedAt).toISOString();

    const embeds = buildEmbeds(type, payload.answers, submittedAt);
    const separator = webhookUrl.includes("?") ? "&" : "?";

    for (const embed of embeds) {
      const discordResponse = await fetch(`${webhookUrl}${separator}wait=true`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username: "Loomwood Applications",
          allowed_mentions: { parse: [] },
          embeds: [embed]
        })
      });

      if (!discordResponse.ok) {
        console.error("Discord webhook failed", discordResponse.status, await discordResponse.text());
        return jsonResponse({ error: "Discord rejected the application." }, 502, headers);
      }
    }

    return jsonResponse({ ok: true }, 200, headers);
  }
};
