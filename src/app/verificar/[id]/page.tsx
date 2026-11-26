import { Suspense } from "react";
import { verifyCertificate } from "@/features/certificates/public-verification";

async function Verification({ params, searchParams }: PageProps<"/verificar/[id]">) {
  const [{ id }, { hash }] = await Promise.all([params, searchParams]);
  const result = await verifyCertificate(id, Array.isArray(hash) ? hash[0] : hash);
  switch (result.state) {
    case "verified": return (
      <dl className="wrap-break-word">
        <dt>Certificado</dt><dd>{result.certificadoId}</dd>
        <dt>Emisión</dt><dd><time dateTime={result.emisionUtc}>{result.emisionUtc}</time></dd>
        <dt>Centro</dt><dd>{result.centro}</dd>
        <dt>Resultado</dt><dd>{result.resultado}</dd>
      </dl>
    );
    case "missing": return <p>Certificado no encontrado.</p>;
    case "integrity": return <p>Integridad del certificado no válida.</p>;
    case "unavailable": return <p role="alert">No se pudo verificar el certificado.</p>;
  }
}

export default function VerificationPage(props: PageProps<"/verificar/[id]">) {
  return (
    <main>
      <h1>Verificar certificado</h1>
      <Suspense fallback={<p role="status">Verificando…</p>}><Verification {...props} /></Suspense>
    </main>
  );
}
