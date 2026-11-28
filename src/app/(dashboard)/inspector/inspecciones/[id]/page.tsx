import { Suspense } from "react";
import { LoadingSkeleton } from "@/components/ui/feedback";
import { InspectionDetail } from "@/features/inspections/detail";

export default function Page(props: PageProps<"/inspector/inspecciones/[id]">) {
  return <Suspense fallback={<LoadingSkeleton label="Cargando inspección." />}><InspectionDetail {...props} /></Suspense>;
}
