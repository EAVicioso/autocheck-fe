export class RequestFailure extends Error {
  constructor(
    public readonly kind: "timeout" | "aborted" | "network" | "protocol" | "configuration",
    options?: ErrorOptions,
  ) {
    super(kind, options);
    this.name = "RequestFailure";
  }
}

/** A single cancelable budget for local work, fetch, and reading the body. */
export async function withinDeadline<T>(
  timeoutMs: number,
  caller: AbortSignal | undefined,
  work: (signal: AbortSignal) => Promise<T>,
): Promise<T> {
  const controller = new AbortController();
  const started = performance.now();
  const cancel = () => controller.abort(new RequestFailure("aborted", { cause: caller?.reason }));
  if (caller?.aborted) cancel();
  controller.signal.throwIfAborted();

  const timer = setTimeout(() => controller.abort(new RequestFailure("timeout")), timeoutMs);
  caller?.addEventListener("abort", cancel, { once: true });
  let rejectOnAbort: (() => void) | undefined;

  try {
    const cancelled = new Promise<never>((_, reject) => {
      rejectOnAbort = () => reject(controller.signal.reason);
      controller.signal.addEventListener("abort", rejectOnAbort, { once: true });
    });
    const result = await Promise.race([cancelled, work(controller.signal)]);
    if (performance.now() - started >= timeoutMs) {
      controller.abort(new RequestFailure("timeout"));
      throw controller.signal.reason;
    }
    return result;
  } finally {
    clearTimeout(timer);
    caller?.removeEventListener("abort", cancel);
    if (rejectOnAbort) controller.signal.removeEventListener("abort", rejectOnAbort);
  }
}
