import { AcademicDisclaimerBanner, Card } from "./layout";
import { dominicanDateTime } from "@/shared/dates/dominican";

export type VerificationView =
  | { state: "missing" | "integrity" | "unavailable" }
  | { state: "verified"; certificadoId: string; emisionUtc: string; centro: string; resultado: "Aprobado" };

export function QrVerificationCard({ verification }: { verification: VerificationView }) {
  return <Card className="space-y-4">
    <AcademicDisclaimerBanner />
    {verification.state === "verified" ? <dl className="grid gap-4 wrap-break-word sm:grid-cols-2">
      <div><dt>Certificado</dt><dd>{verification.certificadoId}</dd></div>
      <div><dt>Emisión</dt><dd><time dateTime={verification.emisionUtc}>{dominicanDateTime(verification.emisionUtc)} (Santo Domingo)</time></dd></div>
      <div><dt>Centro</dt><dd>{verification.centro}</dd></div>
      <div><dt>Resultado</dt><dd>{verification.resultado}</dd></div>
    </dl> : <p role="status">{verification.state === "missing" ? "Certificado no encontrado"
      : verification.state === "integrity" ? "Integridad no válida" : "No se pudo verificar el certificado."}</p>}
  </Card>;
}
