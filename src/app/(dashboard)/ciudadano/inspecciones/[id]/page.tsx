import { Suspense } from "react";
import { LoadingSkeleton } from "@/components/ui/feedback";
import { CitizenInspection } from "@/features/history/screens";

export default function Page(props: PageProps<"/ciudadano/inspecciones/[id]">) {
  return <Suspense fallback={<LoadingSkeleton label="Cargando resultado." />}><CitizenInspection {...props} /></Suspense>;
}
