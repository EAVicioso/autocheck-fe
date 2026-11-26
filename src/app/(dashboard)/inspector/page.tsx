import { ProtectedPage } from "@/features/identity/guards";

export default function Page() {
  return <ProtectedPage role="Inspector" title="Área de inspección" />;
}
