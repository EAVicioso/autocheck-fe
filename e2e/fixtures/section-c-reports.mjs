const dateTime = new Intl.DateTimeFormat("en-CA", {
  timeZone: "America/Santo_Domingo", year: "numeric", month: "2-digit", day: "2-digit",
});
const day = (utc) => {
  const fields = Object.fromEntries(dateTime.formatToParts(new Date(utc)).map(({ type, value }) => [type, value]));
  return fields.year + "-" + fields.month + "-" + fields.day;
};
const compare = (left, right) => left < right ? -1 : left > right ? 1 : 0;
const cutoff = "2026-11-26T04:00:00.000Z";
const id = (value) => "00000000-0000-4000-8000-" + String(value).padStart(12, "0");
export const reportIds = { center: id(1), rampA: id(11), rampB: id(12), inspector: id(21), low: id(22), all: id(23) };

function inspections(inspectorId, count, rejected, startId) {
  return Array.from({ length: count }, (_, index) => ({
    id: id(startId + index), centroId: reportIds.center, inspectorId,
    rampaId: index === 0 ? reportIds.rampA : reportIds.rampB,
    cierreUtc: index >= 20 ? cutoff : new Date(Date.parse(cutoff) - (20 - index) * 1000).toISOString(),
    resultado: rejected.includes(index) ? "Rechazado" : "Aprobado", estado: "CERRADA",
  }));
}

const sample = [
  ...inspections(reportIds.inspector, 22, [0, 21], 101),
  ...inspections(reportIds.low, 21, [0, 1], 201),
  ...inspections(reportIds.all, 21, [], 301),
];
const inputs = [...sample, sample[0], { ...sample[0], id: id(999), estado: "ABIERTA" }].reverse();
const closed = [...new Map(inputs.filter((row) => row.estado === "CERRADA").map((row) => [row.id, row])).values()];

function sameFilter(filters, key, value) {
  return !filters.has(key) || filters.get(key) === value;
}

function inDates(filters, date) {
  return date >= filters.get("desde") && date <= filters.get("hasta");
}

function paginate(filters, rows) {
  const size = Number(filters.get("tamano") ?? 20);
  const start = (Number(filters.get("pagina") ?? 1) - 1) * size;
  return rows.slice(start, start + size);
}

function counts(rows) {
  const cerradas = rows.length;
  const aprobadas = rows.filter(({ resultado }) => resultado === "Aprobado").length;
  const rechazadas = cerradas - aprobadas;
  return { cerradas, aprobadas, rechazadas, porcentajeRechazo: cerradas ? 100 * rechazadas / cerradas : null };
}

export function metrics(filters) {
  const rows = closed.filter((row) => inDates(filters, day(row.cierreUtc)) && sameFilter(filters, "centroId", row.centroId)
    && sameFilter(filters, "rampaId", row.rampaId) && sameFilter(filters, "inspectorId", row.inspectorId));
  const groups = Map.groupBy(rows, (row) => [day(row.cierreUtc), row.centroId, row.rampaId, row.inspectorId].join(":"));
  const items = [...groups].sort(([left], [right]) => compare(left, right)).map(([key, records]) => {
    const [dia, centroId, rampaId, inspectorId] = key.split(":");
    return { dia, centroId, rampaId, inspectorId, ...counts(records) };
  });
  return { ...counts(rows), estado: rows.length ? "Con datos" : "Sin datos",
    ultimaActualizacionUtc: cutoff, items: paginate(filters, items) };
}

export function alerts(filters) {
  const groups = Map.groupBy(closed, (row) => row.inspectorId + ":" + row.centroId);
  const items = [];
  for (const rows of groups.values()) {
    rows.sort((left, right) => compare(left.cierreUtc, right.cierreUtc) || compare(left.id, right.id));
    for (let end = 20; end < rows.length; end++) {
      const window = rows.slice(end - 20, end + 1);
      const { id, inspectorId, centroId, cierreUtc } = rows[end];
      const fecha = day(cierreUtc);
      const { aprobadas } = counts(window);
      const porcentaje = 100 * aprobadas / 21;
      if (porcentaje <= 95 || !inDates(filters, fecha) || !sameFilter(filters, "centroId", centroId)
        || !sameFilter(filters, "inspectorId", inspectorId) || !window.some((row) => sameFilter(filters, "rampaId", row.rampaId))) continue;
      items.push({ id, inspectorId, centroId, fecha, inspecciones: window.map((row) => row.id),
        desdeUtc: window[0].cierreUtc, hastaUtc: cierreUtc, aprobadas, total: 21, porcentaje });
    }
  }
  return { ultimaActualizacionUtc: cutoff, items: paginate(filters, items) };
}
