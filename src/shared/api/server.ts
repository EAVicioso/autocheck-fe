import "server-only";
import { createApiClient } from "./client";
import { RequestFailure } from "./deadline";

export function autoCheckApi(options: Pick<Parameters<typeof createApiClient>[0], "token" | "refresh" | "onInvalidSession"> = {}) {
  const baseUrl = process.env.AUTOCHECK_API_URL;
  if (!baseUrl) throw new RequestFailure("configuration");

  return createApiClient({
    baseUrl,
    timeoutMs: process.env.AUTOCHECK_API_TIMEOUT_MS === undefined
      ? undefined : Number(process.env.AUTOCHECK_API_TIMEOUT_MS),
    ...options,
  });
}
