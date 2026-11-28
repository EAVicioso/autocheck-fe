import Link from "next/link";
import { ProtectedPage } from "@/features/identity/guards";

export default function Page() {
  return <>
    <ProtectedPage role="Ciudadano" title="Área ciudadana" />
    <Link className="inline-flex min-h-11 items-center underline" href="/ciudadano/historial">Historial vehicular</Link>
  </>;
}
