import Link from "next/link";
import { RegistrationForm } from "@/features/identity/identity-form";

export default function RegistrationPage() {
  return <><h1>Registro</h1><RegistrationForm /><Link href="/login">Iniciar sesión</Link></>;
}
