import { ButtonLink } from "@/components/ui/controls";
import { Card } from "@/components/ui/layout";
import { CitizenPage } from "@/features/citizen/server";

export default function Page() {
  return <CitizenPage title="Área ciudadana" render={async () =>
    <Card className="flex flex-wrap gap-3 p-5">
      <ButtonLink href="/ciudadano/perfil">Mi perfil</ButtonLink>
      <ButtonLink href="/ciudadano/vehiculos">Mis vehículos</ButtonLink>
    </Card>} />;
}

