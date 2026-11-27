import { randomUUID } from "node:crypto";
import { alerts, metrics, reportIds } from "./section-c-reports.mjs";

export const personas = {
  "owner-c@example.invalid": { permisos: ["usuarios.gestionar", "centros.gestionar", "reglas.gestionar", "auditoria.consultar"], centroId: null },
  "local-c@example.invalid": { permisos: ["centros.gestionar", "auditoria.consultar"], centroId: reportIds.center },
  "limited-c@example.invalid": { permisos: [], centroId: null },
};

const centers = new Map([[reportIds.center, { centro: {
  id: reportIds.center, nombre: "Centro de aceptación", direccion: "Santo Domingo", activo: true,
}, rampas: [{ id: reportIds.rampA, centroId: reportIds.center, nombre: "Rampa con retención", activa: true }],
horarios: [{ dia: 1, aperturaMinutos: 480, cierreMinutos: 1020 }] }]]);
const target = { id: reportIds.inspector, correo: "manuela@example.invalid", nombre: "Manuela Prueba", celular: "",
  rol: "Ciudadano", permisos: [], centroId: null, activo: true, version: 1, archivadoUtc: null };
const rules = [{ id: randomUUID(), version: "inicial", m: 3, vigenciaUtc: "2026-11-25T04:00:00.000Z" }];
const events = [{
  id: randomUUID(), actorId: null, fechaUtc: "2026-11-26T04:00:00.000Z", operacion: "Consultar",
  entidad: "Inspeccion", resultado: "OK", correlacion: "corr-fixture-01", ip: "127.0.0.1",
  anterior: { valor: "fixture-only-snapshot" }, nuevo: null,
}];

function appendEvent(actor, operacion, entidad, anterior, nuevo) {
  events.unshift({ id: randomUUID(), actorId: actor.id, fechaUtc: new Date().toISOString(), operacion, entidad,
    resultado: "OK", correlacion: randomUUID(), ip: null, anterior, nuevo });
}

function response(status, body) { return { status, body }; }
const ok = (body) => response(200, body);
const problem = (status, codigo) => ({ status, codigo });

export async function sectionC(request, url, actor, readJson) {
  const route = request.method + " " + url.pathname;
  const id = url.pathname.split("/")[3];
  const query = url.searchParams;
  const admin = (permission) => actor.rol === "Administrador" && actor.permisos.includes(permission);
  const withinCenter = (center) => actor.centroId === null || actor.centroId === center;
  const denied = () => problem(403, "ACCESO_DENEGADO");
  if (route.startsWith("GET /api/reportes/")) {
    if (!admin("auditoria.consultar") || !withinCenter(query.get("centroId"))) return denied();
    return ok(route.endsWith("inspecciones") ? metrics(query) : alerts(query));
  }
  if (route === "GET /api/auditorias") {
    if (!admin("auditoria.consultar") || actor.centroId !== null) return denied();
    const items = events.filter((event) => (!query.get("operacion") || event.operacion === query.get("operacion"))
      && (!query.get("entidad") || event.entidad === query.get("entidad"))
      && (!query.get("actorId") || event.actorId === query.get("actorId"))
      && (!query.get("desdeUtc") || event.fechaUtc >= query.get("desdeUtc"))
      && (!query.get("hastaUtc") || Date.parse(event.fechaUtc) <= Date.parse(query.get("hastaUtc"))));
    return ok({ items, pagina: 1, siguienteCursor: null });
  }
  if (url.pathname.startsWith("/api/usuarios")) {
    if (!admin("usuarios.gestionar")) return denied();
    if (route === "GET /api/usuarios") return ok({
      items: [target].filter((row) => (!query.get("nombre") || row.nombre.includes(query.get("nombre")))
        && (!query.get("rol") || row.rol === query.get("rol"))), pagina: 1, siguienteCursor: null,
    });
    if (id !== target.id) return problem(404, "RECURSO_NO_ENCONTRADO");
    if (route === "GET /api/usuarios/" + id) return ok(target);
    if (route === "GET /api/usuarios/" + id + "/acceso") {
      const { rol, centroId, permisos, activo, version, archivadoUtc } = target;
      return ok({ usuarioId: id, rol, centroId, permisos, activo, version, archivadoUtc });
    }
    if (route === "PATCH /api/usuarios/" + id + "/acceso") {
      const body = await readJson(request);
      if (target.version !== body.version) return problem(409, "VERSION_DESACTUALIZADA");
      const previous = { ...target };
      Object.assign(target, body, { version: target.version + 1 });
      appendEvent(actor, "CambiarAcceso", "Usuario", previous, { ...target });
      return ok(target);
    }
  }
  if (route === "GET /api/centros") return ok({ items: [...centers.values()].map(({ centro }) => centro).filter(({ activo }) => activo) });
  if (route === "POST /api/centros") {
    if (!admin("centros.gestionar") || actor.centroId !== null) return denied();
    const center = { ...await readJson(request), id: randomUUID() };
    centers.set(center.id, { centro: center, rampas: [], horarios: [] });
    return response(201, center);
  }
  const center = centers.get(id);
  if (center && url.pathname.startsWith("/api/centros/")) {
    if (route === "GET /api/centros/" + id) return ok(center);
    if (!admin("centros.gestionar") || !withinCenter(id)) return denied();
    const body = await readJson(request);
    if (route === "PATCH /api/centros/" + id) {
      if (id === reportIds.center && !body.activo) return problem(409, "CENTRO_CON_COMPROMISOS");
      Object.assign(center.centro, body);
      return ok(center.centro);
    }
    if (route === "POST /api/centros/" + id + "/rampas") {
      const ramp = { ...body, id: randomUUID(), centroId: id };
      center.rampas.push(ramp);
      return response(201, ramp);
    }
    if (route.startsWith("PATCH /api/centros/" + id + "/rampas/")) {
      const ramp = center.rampas.find((item) => url.pathname.endsWith(item.id));
      if (!ramp) return problem(404, "RECURSO_NO_ENCONTRADO");
      if (ramp.id === reportIds.rampA && !body.activa) return problem(409, "RAMPA_CON_COMPROMISOS");
      Object.assign(ramp, body);
      return ok(ramp);
    }
    if (route === "PUT /api/centros/" + id + "/horarios") {
      if (id === reportIds.center && JSON.stringify(body.horarios) !== JSON.stringify(center.horarios)) {
        return problem(409, "HORARIO_CON_COMPROMISOS");
      }
      center.horarios = body.horarios;
      return ok(body);
    }
  }
  if (route === "GET /api/configuracion/reglas-inspeccion") return ok({ items: rules });
  if (route === "POST /api/configuracion/reglas-inspeccion") {
    if (!admin("reglas.gestionar") || actor.centroId !== null) return denied();
    const body = await readJson(request);
    if (Date.parse(body.vigenciaUtc) < Date.now()) return problem(400, "SOLICITUD_INVALIDA");
    const rule = { ...body, id: randomUUID(), version: "regla-" + rules.length };
    appendEvent(actor, "CrearVersionReglas", "Regla", rules[0], rule);
    rules.unshift(rule);
    return response(201, rule);
  }
}
