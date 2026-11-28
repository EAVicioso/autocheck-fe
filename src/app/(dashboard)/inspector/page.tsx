import { Suspense } from "react";
import { LoadingSkeleton } from "@/components/ui/feedback";
import { InspectionQueue } from "@/features/inspections/queue";

export default function Page(props: PageProps<"/inspector">) {
  return <Suspense fallback={<LoadingSkeleton label="Cargando inspecciones." />}><InspectionQueue {...props} /></Suspense>;
}
