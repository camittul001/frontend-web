"use client";

import { fetchAuthSession } from "aws-amplify/auth";

export class ApiError extends Error {
  constructor(
    public status: number,
    public body: string,
  ) {
    super(`ApiError(${status}): ${body}`);
    this.name = "ApiError";
  }
}

function baseUrl(): string {
  const u = process.env.NEXT_PUBLIC_API_BASE_URL;
  if (!u) throw new Error("NEXT_PUBLIC_API_BASE_URL is not set");
  return u.replace(/\/+$/, "");
}

// Fetch the Cognito ID token. Mirrors frontend_mobile/lib/data/api/api_client.dart
// where every request injects `Authorization: <idToken>` (no Bearer prefix —
// the API Gateway authorizer expects the raw token).
async function authHeaders(): Promise<Record<string, string>> {
  const session = await fetchAuthSession();
  const idToken = session.tokens?.idToken?.toString();
  if (!idToken) throw new Error("Not authenticated");
  return {
    "Content-Type": "application/json",
    Authorization: idToken,
  };
}

async function decode<T>(res: Response): Promise<T> {
  if (res.status >= 400) {
    const body = await res.text();
    throw new ApiError(res.status, body);
  }
  if (res.status === 204) return undefined as T;
  const text = await res.text();
  if (!text) return undefined as T;
  return JSON.parse(text) as T;
}

async function request<T>(
  method: "GET" | "POST" | "PATCH" | "DELETE",
  path: string,
  body?: unknown,
): Promise<T> {
  const res = await fetch(`${baseUrl()}${path}`, {
    method,
    headers: await authHeaders(),
    body: body === undefined ? undefined : JSON.stringify(body),
    cache: "no-store",
  });
  return decode<T>(res);
}

export const api = {
  get: <T>(path: string) => request<T>("GET", path),
  post: <T>(path: string, body?: unknown) => request<T>("POST", path, body),
  patch: <T>(path: string, body?: unknown) => request<T>("PATCH", path, body),
  delete: <T>(path: string) => request<T>("DELETE", path),
};
