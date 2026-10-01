import axios from "axios";
import { config } from "../config/env.js";

const BODYLESS_METHODS = new Set(["GET", "HEAD"]);

function readPath(context, path) {
  return path.split(".").reduce((value, key) => {
    if (value === undefined || value === null) {
      return "";
    }

    return value[key];
  }, context);
}

function renderTemplate(value, context) {
  if (typeof value !== "string") {
    return value;
  }

  return value.replace(/\{\{\s*([\w.]+)\s*\}\}/g, (_match, key) => {
    const resolved = readPath(context, key);
    return resolved === undefined || resolved === null ? "" : String(resolved);
  });
}

function renderHeaders(headers, context) {
  return Object.fromEntries(
    Object.entries(headers || {}).map(([key, value]) => [key, renderTemplate(value, context)])
  );
}

function parseBody(body) {
  if (body === undefined || body === null || body === "") {
    return undefined;
  }

  if (typeof body !== "string") {
    return body;
  }

  try {
    return JSON.parse(body);
  } catch {
    return body;
  }
}

function assertAllowedTarget(rawUrl) {
  const target = new URL(rawUrl);

  if (!["http:", "https:"].includes(target.protocol)) {
    throw new Error("Sono supportati solo target HTTP o HTTPS.");
  }

  if (
    config.allowedTargetHosts.length > 0 &&
    !config.allowedTargetHosts.includes(target.hostname)
  ) {
    throw new Error(`Host non consentito dal backend: ${target.hostname}`);
  }

  return target;
}

function preview(data) {
  if (data === undefined || data === null) {
    return null;
  }

  const text = typeof data === "string" ? data : JSON.stringify(data);
  return text.length > 1000 ? `${text.slice(0, 1000)}...` : text;
}

export async function dispatchHttpAction(action, context = {}) {
  const renderedUrl = renderTemplate(action.url, context);
  assertAllowedTarget(renderedUrl);

  const method = String(action.method || "POST").toUpperCase();
  const request = {
    method,
    url: renderedUrl,
    headers: renderHeaders(action.headers, context),
    timeout: config.requestTimeoutMs,
    validateStatus: () => true
  };

  if (!BODYLESS_METHODS.has(method)) {
    request.data = parseBody(renderTemplate(action.body, context));
  }

  const response = await axios(request);

  return {
    ok: response.status >= 200 && response.status < 300,
    targetUrl: renderedUrl,
    status: response.status,
    statusText: response.statusText,
    responsePreview: preview(response.data)
  };
}

