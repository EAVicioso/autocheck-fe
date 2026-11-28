import type { SearchParams } from "@/core/search";
import { VehiclesPage } from "@/features/vehicles/pages";

export default async function Page({ searchParams }: { searchParams: Promise<SearchParams> }) {
  return <VehiclesPage page={(await searchParams).pagina} />;
}

