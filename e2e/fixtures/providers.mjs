import { createHmac, randomUUID } from "node:crypto";
import { readFileSync } from "node:fs";
import { request as proxyRequest } from "node:http";
import { createServer } from "node:https";
import tls from "node:tls";

const keys = { key: readFileSync("/tls/key.pem"), cert: readFileSync("/tls/cert.pem") };
const users = new Map(["ciudadano", "inspector", "admin"].map((role, index) => [
  role + "1@example.test", { id: "12000000-0000-4000-8000-00000000000" + (index + 1), password: "Abc12345" },
]));
const sessions = new Map();
const recovery = new Map();
const encode = (value) => Buffer.from(JSON.stringify(value)).toString("base64url");

function issue(user, sessionId = randomUUID(), refreshable = true) {
  const claims = {
    iss: "https://providers/auth/v1", aud: "authenticated", role: "authenticated",
    sub: user.id, session_id: sessionId, exp: Math.floor(Date.now() / 1000) + 3600,
  };
  const payload = encode({ alg: "HS256", typ: "JWT" }) + "." + encode(claims);
  const signature = createHmac("sha256", "autocheck-e2e-fixture-signing-key-only-32bytes").update(payload).digest("base64url");
  const access_token = payload + "." + signature;
  const refresh_token = randomUUID();
  if (refreshable) sessions.set(refresh_token, { user, sessionId, access_token });
  return { access_token, refresh_token, expires_in: 3600 };
}

function json(response, status, body) {
  response.writeHead(status, { "Content-Type": "application/json" });
  response.end(JSON.stringify(body));
}

async function parseBody(request) {
  let body = "";
  for await (const chunk of request) body += chunk;
  return body ? JSON.parse(body) : {};
}

createServer(keys, async (request, response) => {
  try {
    const url = new URL(request.url, "https://providers");
    const { pathname } = url;
    const input = await parseBody(request);
    if (pathname === "/auth/v1/signup") {
      const previous = users.get(input.email);
      if (previous) return json(response, 200, { user: { id: previous.id, identities: [] } });
      const user = { id: randomUUID(), password: input.password };
      users.set(input.email, user);
      return json(response, 200, { ...issue(user), user: { id: user.id, identities: [{ id: user.id }] } });
    }
    if (pathname === "/auth/v1/token") {
      if (url.searchParams.get("grant_type") === "refresh_token") {
        const session = sessions.get(input.refresh_token);
        if (!session) return json(response, 400, {});
        sessions.delete(input.refresh_token);
        return json(response, 200, issue(session.user, session.sessionId));
      }
      const user = users.get(input.email);
      return user?.password === input.password ? json(response, 200, issue(user)) : json(response, 400, {});
    }
    if (pathname === "/auth/v1/logout") {
      for (const [key, session] of sessions) {
        if (request.headers.authorization === "Bearer " + session.access_token) sessions.delete(key);
      }
      response.writeHead(204).end();
      return;
    }
    if (pathname === "/auth/v1/recover") return json(response, 200, {});
    if (pathname === "/auth/v1/verify") {
      const prefix = "e2e-reset:";
      const user = input.token_hash?.startsWith(prefix) ? users.get(input.token_hash.slice(prefix.length)) : undefined;
      if (!user || [...recovery.values()].includes(user)) return json(response, 400, {});
      const { access_token } = issue(user, undefined, false);
      recovery.set(access_token, user);
      return json(response, 200, { access_token, user: { id: user.id } });
    }
    if (pathname === "/auth/v1/user" && request.method === "PUT") {
      const token = request.headers.authorization?.slice(7);
      const user = recovery.get(token);
      if (!user) return json(response, 401, {});
      recovery.delete(token);
      user.password = input.password;
      return json(response, 200, { id: user.id });
    }
    if (pathname === "/realtime/v1/api/broadcast") return json(response, 200, {});
    if (pathname.startsWith("/v1beta/models/") && pathname.endsWith(":generateContent")) {
      const question = input.contents?.[0]?.parts?.[0]?.text;
      // Exercise the upstream failure path. Other requests return typed Gemini content.
      if (question === "Consulta E2E de contingencia") return json(response, 503, {});
      const text = JSON.stringify({ respuesta: "Respuesta académica de prueba.", categoria: "ITV", codigo: "OK" });
      return json(response, 200, { candidates: [{ content: { parts: [{ text }] } }] });
    }
    return json(response, 404, {});
  } catch {
    return json(response, 400, {});
  }
}).listen(443, "0.0.0.0");

// The Compose browser suite runs production cookies on HTTPS, including WebKit.
createServer(keys, (request, response) => {
  const upstream = proxyRequest({
    hostname: "frontend",
    port: 3400,
    method: request.method,
    path: request.url,
    headers: { ...request.headers, "x-forwarded-proto": "https", "x-forwarded-host": request.headers.host },
  }, (frontend) => {
    response.writeHead(frontend.statusCode, frontend.headers);
    frontend.pipe(response);
  });
  upstream.on("error", () => {
    if (response.headersSent) response.destroy();
    else response.writeHead(502).end();
  });
  response.on("close", () => upstream.destroy());
  request.pipe(upstream);
}).listen(3400, "0.0.0.0");

tls.createServer(keys, (socket) => {
  socket.setEncoding("utf8");
  socket.write("220 providers ESMTP\r\n");
  let buffer = "";
  let readingMessage = false;
  socket.on("data", (part) => {
    buffer += part;
    let newline;
    while ((newline = buffer.indexOf("\r\n")) >= 0) {
      const line = buffer.slice(0, newline);
      buffer = buffer.slice(newline + 2);
      if (readingMessage) {
        if (line !== ".") continue;
        readingMessage = false;
        socket.write("250 Accepted\r\n");
      } else if (line.startsWith("EHLO ")) socket.write("250-providers\r\n250 AUTH PLAIN\r\n");
      else if (line.startsWith("AUTH PLAIN ")) socket.write("235 Authenticated\r\n");
      else if (line === "AUTH PLAIN") socket.write("334 \r\n");
      else if (line === "DATA") { readingMessage = true; socket.write("354 Enter message\r\n"); }
      else if (line === "QUIT") socket.end("221 Bye\r\n");
      else socket.write("250 OK\r\n");
    }
  });
  socket.on("error", () => socket.destroy());
}).listen(2465, "0.0.0.0");
