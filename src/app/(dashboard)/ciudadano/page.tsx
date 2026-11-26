import { ProtectedPage } from "@/features/identity/guards";

export default function Page() {
  return <ProtectedPage role="Ciudadano" title="Área ciudadana" />;
}
