import { dominicanDateTime } from "@/shared/dates/dominican";
import { Card } from "./layout";

export function UpdatedAt({ at }: { at: string | null }) {
  return <p className="text-sm text-muted">Última actualización: {at
    ? <time dateTime={at}>{dominicanDateTime(at)} (Santo Domingo)</time>
    : "Sin datos"}</p>;
}

export function StatCard({ title, closed, value, updatedAt, anomaly }: {
  title: string;
  closed: number;
  value: string | number | null;
  updatedAt: string | null;
  anomaly?: { approved: number; total: 21; from: string; to: string };
}) {
  return <Card>
    <h2 className="text-lg font-semibold">{title}</h2>
    <p className="text-2xl font-bold">{closed <= 0 || value === null || (typeof value === "number" && !Number.isFinite(value))
      ? "Sin datos" : value}</p>
    <UpdatedAt at={updatedAt} />
    {anomaly && <p className="mt-3 text-status-alert">
      Anomalía preventiva. {anomaly.approved} de {anomaly.total} inspecciones aprobadas, del {dominicanDateTime(anomaly.from)}
      {" al "}{dominicanDateTime(anomaly.to)} (Santo Domingo).
    </p>}
  </Card>;
}
