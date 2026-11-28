import { request as proxyRequest } from "node:http";
import { pipeline } from "node:stream";

/** @param {string} hostname @param {number} port */
export function frontendProxy(hostname, port) {
  /** @type {import("node:http").RequestListener} */
  const forward = (request, response) => {
    const upstream = proxyRequest({
      hostname,
      port,
      method: request.method,
      path: request.url,
      headers: { ...request.headers, "x-forwarded-proto": "https", "x-forwarded-host": request.headers.host },
    }, (frontend) => {
      response.writeHead(frontend.statusCode, frontend.headers);
      // On an incomplete upstream response, pipeline closes the browser connection as well.
      pipeline(frontend, response, () => {});
    });
    upstream.on("error", () => {
      if (response.headersSent) response.destroy();
      else response.writeHead(502).end();
    });
    response.on("close", () => upstream.destroy());
    request.pipe(upstream);
  };
  return forward;
}
