import { notFound } from "next/navigation";
import { uuid } from "@/core/search";
import { sectionData } from "@/core/section-server";
import { CitizenPage } from "@/features/citizen/server";
import { PaymentStatus } from "./status";

export function PaymentPage({ id }: { id: string }) {
  if (!uuid.safeParse(id).success) notFound();
  return <CitizenPage title="Pago simulado" render={async ({ api, profile }) => {
    const payment = await sectionData(api, "GET /api/pagos/intentos/{id}", { params: { id } });
    return <PaymentStatus actor={profile.id} initial={payment} />;
  }} />;
}
