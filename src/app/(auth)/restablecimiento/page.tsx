import { Suspense } from "react";
import Link from "next/link";
import { ResetForm } from "@/features/identity/identity-form";

export const metadata = { referrer: "no-referrer" as const };

async function Reset({ searchParams }: PageProps<"/restablecimiento">) {
  const { token, TokenHash } = await searchParams;
  const value = token ?? TokenHash;
  return <ResetForm token={typeof value === "string" ? value : ""} />;
}

export default function ResetPage(props: PageProps<"/restablecimiento">) {
  return <><h1>Restablecer contraseña</h1><Suspense><Reset {...props} /></Suspense><Link href="/login">Iniciar sesión</Link></>;
}
