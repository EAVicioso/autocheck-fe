import { randomUUID } from "node:crypto";

const ids = {
  center: "10000000-0000-4000-8000-000000000001",
  ramp: "10000000-0000-4000-8000-000000000002",
  brand: "20000000-0000-4000-8000-000000000001",
  model: "20000000-0000-4000-8000-000000000002",
  color: "20000000-0000-4000-8000-000000000003",
};
const center = { id: ids.center, nombre: "Centro ciudadano E2E", direccion: "Santo Domingo", activo: true };
const catalogs = {
  marcas: [{ id: ids.brand, nombre: "Marca E2E", padreId: null }],
  modelos: [{ id: ids.model, nombre: "Modelo E2E", padreId: ids.brand }],
  colores: [{ id: ids.color, nombre: "Color E2E", padreId: null }],
};
const vehicles = new Map();
const attempts = new Map();
const appointments = new Map();
const keys = new Map();
let scenario = "APROBADO";

export function resetCitizen(next) {
  vehicles.clear();
  attempts.clear();
  appointments.clear();
  keys.clear();
  scenario = next ?? "APROBADO";
}

export function setCitizenOutcome(id, estado) {
  const attempt = attempts.get(id);
  if (attempt) attempt.estado = estado;
}

const ok = (body, status = 200) => ({ status, body });
const fail = (status, codigo) => ({ status, codigo });
const notFound = () => fail(404, "RECURSO_NO_ENCONTRADO");

export async function sectionA(request, url, user, readJson) {
  if (user.rol !== "Ciudadano") return undefined;
  const [, , resource, id, extra] = url.pathname.split("/");
  const method = request.method;
  const own = (entry) => entry?.actor === user.id;
  const paged = (items) => ({ items: url.searchParams.get("pagina") > 1 ? [] : items });
  if (resource === "usuarios" && id === "me" && method === "PATCH") {
    const body = await readJson(request);
    if (user.version !== body.version) return fail(409, "VERSION_DESACTUALIZADA");
    Object.assign(user, body, { version: user.version + 1 });
    return ok(user);
  }
  if (resource === "catalogos" && catalogs[id]) return ok({ ...paged(catalogs[id]), pagina: 1, siguienteCursor: null });
  if (resource === "vehiculos") {
    const items = [...vehicles.values()].filter(own);
    const item = vehicles.get(id);
    if (method === "GET" && !id) return ok({ ...paged(items.filter((v) => !v.archivadoUtc)), pagina: 1, siguienteCursor: null });
    if (method === "POST" && !id) {
      const body = await readJson(request);
      const value = { ...body, id: randomUUID(), actor: user.id, version: 1, archivadoUtc: null };
      vehicles.set(value.id, value);
      return ok(value, 201);
    }
    if (!own(item) || item.archivadoUtc) return notFound();
    if (method === "GET") return ok(item);
    if (method === "PATCH") {
      const body = await readJson(request);
      if (body.version !== item.version) return fail(409, "VERSION_DESACTUALIZADA");
      Object.assign(item, body, { version: item.version + 1 });
      return ok(item);
    }
    if (method === "DELETE") {
      item.archivadoUtc = new Date().toISOString();
      return ok(undefined, 204);
    }
  }
  if (resource === "centros") {
    if (!id) return ok(paged([center]));
    if (id !== ids.center) return notFound();
    if (!extra) return ok({ centro: center, rampas: [{ id: ids.ramp, centroId: id, nombre: "Rampa E2E", activa: true }], horarios: [] });
    if (extra === "disponibilidad") return ok({ zonaHoraria: "America/Santo_Domingo", bloques: [
      { rampaId: ids.ramp, inicioUtc: url.searchParams.get("fecha") + "T14:00:00Z", estado: "LIBRE", expiraUtc: null },
    ] });
  }
  if (resource === "pagos" && id === "intentos") {
    if (method === "POST" && !extra) {
      const key = user.id + request.headers["idempotency-key"];
      if (keys.has(key)) return ok(keys.get(key), 201);
      if (scenario === "OCUPADO") {
        scenario = "APROBADO";
        return fail(409, "BLOQUE_NO_DISPONIBLE");
      }
      const body = await readJson(request);
      if (!own(vehicles.get(body.vehiculoId))) return fail(403, "ACCESO_DENEGADO");
      const intentoId = randomUUID();
      const amount = { intentoId, retencionId: intentoId, expiraUtc: new Date(Date.now() + 300000).toISOString(), monto: 1000, moneda: "DOP" };
      const result = { ...amount, estado: "RETENIDO" };
      attempts.set(intentoId, { ...amount, actor: user.id, body, estado: scenario, citaId: null, reversionId: null, siguienteAccion: null });
      keys.set(key, result);
      return ok(result, 201);
    }
    const attempt = attempts.get(extra);
    if (!own(attempt)) return notFound();
    if (attempt.estado === "APROBADO" && !attempt.citaId) {
      attempt.citaId = randomUUID();
      appointments.set(attempt.citaId, { ...attempt.body, id: attempt.citaId, actor: user.id, estado: "CONFIRMADA", inspectorId: null });
    }
    return ok(attempt);
  }
  if (resource === "citas") {
    if (!id) return ok(paged([...appointments.values()].filter(own)));
    if (id === "retenciones" && method === "DELETE") {
      const attempt = attempts.get(extra);
      if (!own(attempt)) return notFound();
      if (attempt.estado === "APROBADO") return fail(409, "CITA_CONFIRMADA");
      attempt.estado = "ABANDONADO";
      return ok(undefined, 204);
    }
    const item = appointments.get(id);
    if (!own(item)) return notFound();
    if (method === "GET") return ok(item);
    if (extra === "cancelacion" && method === "POST") {
      item.estado = "CANCELADA";
      return ok({ citaId: id, estado: item.estado, reversionId: randomUUID() });
    }
  }
}
