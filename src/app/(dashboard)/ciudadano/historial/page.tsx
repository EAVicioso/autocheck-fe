import { Suspense } from "react";
import { LoadingSkeleton } from "@/components/ui/feedback";
import { VehicleHistoryIndex } from "@/features/history/screens";

export default function Page(props: PageProps<"/ciudadano/historial">) {
  return <Suspense fallback={<LoadingSkeleton label="Cargando vehículos." />}><VehicleHistoryIndex {...props} /></Suspense>;
}
