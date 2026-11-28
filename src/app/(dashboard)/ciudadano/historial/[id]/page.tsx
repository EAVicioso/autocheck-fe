import { Suspense } from "react";
import { LoadingSkeleton } from "@/components/ui/feedback";
import { VehicleHistory } from "@/features/history/screens";

export default function Page(props: PageProps<"/ciudadano/historial/[id]">) {
  return <Suspense fallback={<LoadingSkeleton label="Cargando historial." />}><VehicleHistory {...props} /></Suspense>;
}
