import Link from "next/link";
import { notFound } from "next/navigation";
import { AlertBanner } from "@/components/ui/feedback";
import { Card, PageHeader } from "@/components/ui/layout";
import { requireRole } from "@/features/identity/guards";
import { portalError, portalRequest } from "@/features/inspections/backend";
import { inspectionIdSchema } from "@/features/inspections/defects";
import { dominicanDateTime } from "@/shared/dates/dominican";
import { DownloadCertificate, PendingCertificate } from "./status-controls";

export async function CertificateDetail({ params }: Pick<PageProps<"/ciudadano/certificados/[id]">, "params">) {
  const { id } = await params;
  if (!inspectionIdSchema.safeParse(id).success) notFound();
  if (!await requireRole("Ciudadano")) return <AlertBanner variant="error">No se pudo validar la sesión.</AlertBanner>;
  const response = await portalRequest("GET /api/certificados/{id}", { params: { id } });
  if (!response?.ok) return <AlertBanner variant="error">{portalError(response)}</AlertBanner>;
  const certificate = response.body;
  return <>
    <Link className="inline-flex min-h-11 items-center underline" href="/ciudadano/historial">Volver al historial</Link>
    <PageHeader title="Certificado de inspección" />
    <Card className="space-y-3">
      {certificate.estado === "PENDIENTE" ? <>
        <AlertBanner>Emisión en proceso. Puedes consultar el estado.</AlertBanner>
        <PendingCertificate />
      </> : <>
        <p>Emitido el {dominicanDateTime(certificate.emisionUtc)}</p>
        <DownloadCertificate id={id} />
        <Link className="inline-flex min-h-11 items-center underline" href={{
          pathname: "/verificar/" + id, query: { hash: certificate.hashManifiesto },
        }}>Abrir verificación pública</Link>
      </>}
    </Card>
  </>;
}
