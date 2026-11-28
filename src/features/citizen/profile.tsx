import { Card } from "@/components/ui/layout";
import { sectionData } from "@/core/section-server";
import { CitizenPage } from "./server";
import { ProfileForm } from "./profile-form";
import { saveProfile } from "./profile-action";

export function ProfilePage() {
  return <CitizenPage title="Mi perfil" render={async ({ api }) => {
    const { correo, nombre, celular, version } = await sectionData(api, "GET /api/usuarios/me", {});
    return <Card className="max-w-xl space-y-4 p-5">
      <p>Correo electrónico: {correo}</p>
      <ProfileForm key={String(version)} values={{ nombre, celular }} save={saveProfile.bind(null, version)} />
    </Card>;
  }} />;
}

