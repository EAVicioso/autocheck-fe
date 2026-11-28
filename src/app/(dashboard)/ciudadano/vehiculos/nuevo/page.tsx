import type { SearchParams } from "@/core/search";
import { VehicleEditor } from "@/features/vehicles/pages";

export default async function Page({ searchParams }: { searchParams: Promise<SearchParams> }) {
  return <VehicleEditor booking={(await searchParams).reserva === "1"} />;
}

