import Link from "next/link";
import { AppShell, Card, PageHeader } from "@/components/ui/layout";

export default function Home() {
  return (
    <AppShell>
      <PageHeader title="AutoCheck" />
      <Card>
        <nav aria-label="Acceso público">
          <ul className="flex flex-wrap gap-4">
            <li><Link href="/login">Iniciar sesión</Link></li>
            <li><Link href="/registro">Registrarme</Link></li>
          </ul>
        </nav>
      </Card>
    </AppShell>
  );
}
