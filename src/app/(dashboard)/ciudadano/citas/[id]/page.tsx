import { AppointmentPage } from "@/features/appointments/pages";

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  return <AppointmentPage id={(await params).id} />;
}
