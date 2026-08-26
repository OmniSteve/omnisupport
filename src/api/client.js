// Standalone API client. No Base44 dependencies.
// Routes every call to either the in-browser mock layer or the real REST API
// at VITE_API_BASE_URL, depending on VITE_USE_MOCK.

import { handleMock } from "@/mocks/handlers";

export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "/api";
export const USE_MOCK = import.meta.env.VITE_USE_MOCK !== "false";

export class ApiError extends Error {
  constructor(message, status, details) {
    super(message);
    this.status = status;
    this.details = details;
  }
}

function getToken() {
  return localStorage.getItem("omni_token");
}

export async function request(path, options = {}) {
  const method = (options.method || "GET").toUpperCase();

  if (USE_MOCK) {
    const res = await handleMock(method, path, options.body);
    if (res.error) throw new ApiError(res.error, res.status, res.details);
    return res.data;
  }

  const headers = {
    "Content-Type": "application/json",
    ...(options.headers || {}),
  };
  const token = getToken();
  if (token) headers.Authorization = "Bearer " + token;

  const res = await fetch(API_BASE_URL + path, {
    method,
    headers,
    body: options.body ? JSON.stringify(options.body) : undefined,
    signal: options.signal,
  });

  let payload = null;
  const text = await res.text();
  if (text) {
    try {
      payload = JSON.parse(text);
    } catch {
      payload = text;
    }
  }
  if (!res.ok) {
    const message = (payload && payload.error) || res.statusText || "Request failed";
    if (res.status === 401) {
      localStorage.removeItem("omni_token");
    }
    throw new ApiError(message, res.status, payload && payload.details);
  }
  return payload;
}

// Convenience helpers for query strings
export function qs(params = {}) {
  const sp = new URLSearchParams();
  Object.entries(params).forEach(([k, v]) => {
    if (v !== undefined && v !== null && v !== "") sp.append(k, v);
  });
  const s = sp.toString();
  return s ? "?" + s : "";
}