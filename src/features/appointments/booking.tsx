import { z } from "zod";
import { ButtonLink } from "@/components/ui/controls";
import { AlertBanner } from "@/components/ui/feedback";
import { pageSize, optionalId, type SearchParams } from "@/core/search";
import { sectionData, SectionApiError } from "@/core/section-server";
import { CitizenPage } from "@/features/citizen/server";
import { dominicanDay } from "@/shared/dates/dominican";
import type { Centro, Vehiculo } from "@/shared/api/contract.generated";
import { BookingForm } from "./booking-form";

const querySchema = z.object({ vehiculo: optionalId, inspeccionAnteriorId: optionalId });

export function NewAppointmentPage({ query }: { query: SearchParams }) {
  return <CitizenPage title="Agendar cita" render={async ({ api, profile }) => {
    const search = querySchema.safeParse(query);
    if (!search.success) return <AlertBanner variant="error">El enlace de la reserva es inválido.</AlertBanner>;
    const { vehiculo, inspeccionAnteriorId } = search.data;
    let rejection;
    if (inspeccionAnteriorId) {
      try {
        rejection = await sectionData(api, "GET /api/inspecciones/{id}", { params: { id: inspeccionAnteriorId } });
      } catch (error) {
        if (!(error instanceof SectionApiError) || ![403, 404].includes(error.status)) throw error;
      }
      if (!rejection || rejection.estado !== "CERRADA" || rejection.resultado !== "Rechazado"
        || (vehiculo && vehiculo !== rejection.vehiculoId)) {
        return <AlertBanner variant="error">La inspección indicada no está disponible para reinspección.</AlertBanner>;
      }
    }

    const vehicles: Pick<Vehiculo, "id" | "matricula">[] = [];
    const centers: Pick<Centro, "id" | "nombre">[] = [];
    await Promise.all([
      (async () => {
        for (let pagina = 1; pagina <= 500000; pagina++) {
          const { items } = await sectionData(api, "GET /api/vehiculos", { query: { pagina, tamano: pageSize } });
          vehicles.push(...items.map(({ id, matricula }) => ({ id, matricula })));
          if (items.length < pageSize) break;
        }
      })(),
      (async () => {
        for (let pagina = 1; pagina <= 500000; pagina++) {
          const { items } = await sectionData(api, "GET /api/centros", { query: { pagina, tamano: pageSize } });
          centers.push(...items.map(({ id, nombre }) => ({ id, nombre })));
          if (items.length < pageSize) break;
        }
      })(),
    ]);
    const availableVehicles = rejection ? vehicles.filter(({ id }) => id === rejection.vehiculoId) : vehicles;

    const preferredVehicle = rejection?.vehiculoId ?? vehiculo;
    return <BookingForm key={profile.id + "|" + (preferredVehicle ?? "") + "|" + (rejection?.id ?? "")}
      actor={profile.id} vehicles={availableVehicles} centers={centers}
      initialVehicle={preferredVehicle} previousInspection={rejection?.id} today={dominicanDay()}
      emptyVehicles={rejection ? <AlertBanner variant="error">El vehículo de la reinspección ya no está activo.</AlertBanner>
        : <ButtonLink href="/ciudadano/vehiculos/nuevo?reserva=1">Registrar vehículo para agendar</ButtonLink>} />;
  }} />;
}
