import type { SearchParams } from "@/core/search";
import { AppointmentsPage } from "@/features/appointments/pages";

export default async function Page({ searchParams }: { searchParams: Promise<SearchParams> }) {
  return <AppointmentsPage query={await searchParams} />;
}
