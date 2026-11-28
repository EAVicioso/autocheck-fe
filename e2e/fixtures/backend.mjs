import { createServer } from "node:http";
import { randomUUID } from "node:crypto";
import { setTimeout } from "node:timers/promises";
import { personas, sectionC } from "./section-c.mjs";

const sessions = new Map();
const refreshTokens = new Map();
const roles = {
  "ciudadano@example.invalid": "Ciudadano",
  "inspector@example.invalid": "Inspector",
  "admin@example.invalid": "Administrador",
  "lock-c@example.invalid": "Ciudadano",
  ...Object.fromEntries(Object.keys(personas).map((correo) => [correo, "Administrador"])),
};
const lockClock = { now: 0, until: 0, count: 0, password: "Fixture123" };
const centroId = "00000000-0000-4000-8000-000000000001";
const certificadoId = "00000000-0000-4000-8000-000000000002";

function issue(actor) {
  const accessToken = randomUUID();
  const refreshToken = randomUUID();
  sessions.set(accessToken, { actor, expiredToken: false });
  refreshTokens.set(refreshToken, actor);
  return { accessToken, refreshToken, expiraUtc: "2026-11-24T04:00:00Z" };
}

function json(response, status, body, media = "application/json") {
  response.writeHead(status, { "Content-Type": media, "Cache-Control": "no-store" });
  response.end(JSON.stringify(body));
}

function empty(response, status) {
  response.writeHead(status);
  response.end();
}

function problem(response, status, codigo, retryAfter, detail) {
  if (retryAfter) response.setHeader("Retry-After", String(retryAfter));
  json(response, status, { status, codigo, traceId: "fixture", detail }, "application/problem+json");
}

async function readJson(request) {
  let body = "";
  for await (const chunk of request) body += chunk;
  return JSON.parse(body);
}

const server = createServer(async (request, response) => {
  try {
    const url = new URL(request.url, "http://127.0.0.1");
    const route = request.method + " " + url.pathname;
    const token = request.headers.authorization?.match(/^Bearer (.+)$/)?.[1];
    const session = sessions.get(token);
    const actor = session?.actor;
    const unusable = actor && (actor.inactiveMs >= 60 * 60 * 1000 || actor.revoked);

    if (route === "GET /health") return json(response, 200, { status: "Healthy" });
    if (route === "POST /__fixture/lock-clock") {
      const { advanceMs, reset } = await readJson(request);
      if (reset) Object.assign(lockClock, { now: 0, until: 0, count: 0, password: "Fixture123" });
      lockClock.now += advanceMs;
      return empty(response, 204);
    }
    if (route === "POST /__fixture/session") {
      if (!actor) return empty(response, 404);
      const { inactiveMs, expireJwt, profileUnavailable } = await readJson(request);
      if (typeof inactiveMs === "number") actor.inactiveMs = inactiveMs;
      if (expireJwt) session.expiredToken = true;
      if (typeof profileUnavailable === "boolean") actor.profileUnavailable = profileUnavailable;
      return json(response, 200, { refreshes: actor.refreshes, activity: actor.activity, revoked: actor.revoked });
    }
    if (route === "POST /api/auth/registro") {
      await readJson(request);
      return json(response, 201, { usuarioId: randomUUID(), estado: "PENDIENTE_CONFIRMACION" });
    }
    if (route === "POST /api/auth/recuperacion") {
      await readJson(request);
      return json(response, 202, { mensaje: "Si la cuenta existe, recibirás instrucciones de recuperación." });
    }
    if (route === "POST /api/auth/restablecimiento") {
      const reset = await readJson(request);
      if (reset.token === "lock-fixture") lockClock.password = reset.nuevaContrasena;
      return empty(response, 204);
    }
    if (route === "POST /api/auth/login") {
      const { correo, contrasena } = await readJson(request);
      if (correo === "lock-c@example.invalid") {
        if (lockClock.now < lockClock.until) {
          return problem(response, 429, "CUENTA_BLOQUEADA", Math.ceil((lockClock.until - lockClock.now) / 1000));
        }
        if (lockClock.until) Object.assign(lockClock, { until: 0, count: 0 });
        if (contrasena !== lockClock.password) {
          if (++lockClock.count === 5) lockClock.until = lockClock.now + 15 * 60_000;
          return problem(response, 401, "CREDENCIALES_INVALIDAS");
        }
        lockClock.count = 0;
      } else if (contrasena !== "Fixture123" || !Object.hasOwn(roles, correo)) {
        return problem(response, 401, "CREDENCIALES_INVALIDAS");
      }
      const rol = roles[correo];
      const user = {
        id: randomUUID(), correo, nombre: "Fixture", celular: "", rol,
        permisos: rol === "Administrador" ? ["auditoria.consultar"] : [],
        centroId: rol === "Inspector" ? centroId : null, activo: true, version: 1, archivadoUtc: null,
        ...personas[correo],
      };
      return json(response, 200, issue({ user, inactiveMs: 0, refreshes: 0, activity: 0, revoked: false }));
    }
    if (route === "POST /api/auth/refresh") {
      const { refreshToken } = await readJson(request);
      const current = refreshTokens.get(refreshToken);
      if (!current || current.revoked || current.inactiveMs >= 60 * 60 * 1000) {
        return problem(response, 401, "SESION_EXPIRADA");
      }
      refreshTokens.delete(refreshToken);
      current.refreshes++;
      await setTimeout(220);
      return json(response, 200, issue(current));
    }
    if (route === "GET /api/certificados/" + certificadoId + "/verificacion") {
      if (token) return problem(response, 400, "SOLICITUD_INVALIDA");
      if (url.searchParams.get("hash") === "b".repeat(64)) {
        return json(response, 200, { certificadoId, emisionUtc: "fecha inválida", centro: "Centro de prueba", resultado: "Aprobado" });
      }
      if (url.searchParams.get("hash") !== "a".repeat(64)) return problem(response, 409, "INTEGRIDAD_NO_VALIDA");
      return json(response, 200, {
        certificadoId, emisionUtc: "2026-11-24T04:00:00Z", centro: "Centro de prueba",
        resultado: "Aprobado", interno: "Dato interno de fixture",
      });
    }
    if (route === "GET /api/certificados/00000000-0000-4000-8000-000000000003/verificacion") {
      return problem(response, 404, "CERTIFICADO_NO_ENCONTRADO");
    }

    if (route === "POST /api/asistencia" && (!session || session.expiredToken || unusable)) {
      return json(response, 401, { respuesta: "Consulta rechazada.", categoria: "NO_DETERMINADA", codigo: "SOLICITUD_INVALIDA" });
    }
    if (!session || session.expiredToken) return problem(response, 401, "SOLICITUD_RECHAZADA");
    if (route === "POST /api/auth/logout") {
      actor.revoked = true;
      return empty(response, 204);
    }
    if (unusable) return problem(response, 401, "SESION_EXPIRADA");
    if (route === "GET /api/usuarios/me") return actor.profileUnavailable
      ? problem(response, 503, "SERVICIO_NO_DISPONIBLE") : json(response, 200, actor.user);
    if (route === "POST /api/auth/actividad") {
      actor.activity++;
      actor.inactiveMs = 0;
      return empty(response, 204);
    }
    if (route === "POST /api/asistencia") {
      const { consulta } = await readJson(request);
      if (consulta === "Timeout") {
        await setTimeout(5_000);
        if (response.destroyed) return;
      }
      if (consulta === "Error de conexión") return request.socket.destroy();
      if (consulta === "Respuesta inválida") {
        response.writeHead(200, { "Content-Type": "application/json" });
        return response.end("{");
      }
      return json(response, 200, { respuesta: "Respuesta de prueba.", categoria: "ITV", codigo: "OK" });
    }
    const section = await sectionC(request, url, actor.user, readJson);
    if (section) {
      if (section.codigo) return problem(response, section.status, section.codigo, undefined, section.detail);
      return json(response, section.status, section.body);
    }
    return problem(response, 404, "SOLICITUD_RECHAZADA");
  } catch {
    if (!response.headersSent && !response.destroyed) empty(response, 500);
  }
});

server.listen(3401, "127.0.0.1");
