import type { SearchParams } from "@/core/search";
import { NewAppointmentPage } from "@/features/appointments/booking";

export default async function Page({ searchParams }: { searchParams: Promise<SearchParams> }) {
  return <NewAppointmentPage query={await searchParams} />;
}
