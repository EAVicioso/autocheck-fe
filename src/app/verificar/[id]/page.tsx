import { Suspense } from "react";
import { QrVerificationCard } from "@/components/ui/qr-verification-card";
import { AppShell, PageHeader } from "@/components/ui/layout";
import { LoadingSkeleton } from "@/components/ui/feedback";
import { verifyCertificate } from "@/features/certificates/public-verification";

async function Verification({ params, searchParams }: PageProps<"/verificar/[id]">) {
  const [{ id }, { hash }] = await Promise.all([params, searchParams]);
  const result = await verifyCertificate(id, Array.isArray(hash) ? hash[0] : hash);
  return <QrVerificationCard verification={result} />;
}

export default function VerificationPage(props: PageProps<"/verificar/[id]">) {
  return (
    <AppShell academicNotice={false}>
      <PageHeader title="Verificar certificado" />
      <Suspense fallback={<LoadingSkeleton label="Verificando…" />}><Verification {...props} /></Suspense>
    </AppShell>
  );
}
