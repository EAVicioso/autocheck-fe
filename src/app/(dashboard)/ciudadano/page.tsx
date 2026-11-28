import { ButtonLink } from "@/components/ui/controls";
import { Card } from "@/components/ui/layout";
import { CitizenPage } from "@/features/citizen/server";

export default function Page() {
  return <CitizenPage title="Área ciudadana" render={async () =>
    <Card className="flex flex-wrap gap-3 p-5">
      <ButtonLink href="/ciudadano/perfil">Mi perfil</ButtonLink>
      <ButtonLink href="/ciudadano/vehiculos">Mis vehículos</ButtonLink>
      <ButtonLink href="/ciudadano/citas">Mis citas</ButtonLink>
      <ButtonLink href="/ciudadano/citas/nueva">Agendar cita</ButtonLink>
    </Card>} />;
}

