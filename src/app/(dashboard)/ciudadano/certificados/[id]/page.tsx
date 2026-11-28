import { Suspense } from "react";
import { LoadingSkeleton } from "@/components/ui/feedback";
import { CertificateDetail } from "@/features/certificates/detail";

export default function Page(props: PageProps<"/ciudadano/certificados/[id]">) {
  return <Suspense fallback={<LoadingSkeleton label="Cargando certificado." />}><CertificateDetail {...props} /></Suspense>;
}
