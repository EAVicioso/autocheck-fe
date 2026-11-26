import { PageHeader } from "@/components/ui/layout";
import Link from "next/link";
import { RegistrationForm } from "@/features/identity/identity-form";

export default function RegistrationPage() {
  return <><PageHeader title="Registro" /><RegistrationForm /><Link href="/login">Iniciar sesión</Link></>;
}
