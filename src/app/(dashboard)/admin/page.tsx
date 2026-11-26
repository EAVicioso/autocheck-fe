import { ProtectedPage } from "@/features/identity/guards";

export default function Page() {
  return <ProtectedPage role="Administrador" title="Área administrativa" />;
}
