import { Suspense } from "react";
import { LoginForm } from "@/features/identity/identity-form";

async function Login({ searchParams }: PageProps<"/login">) {
  return <LoginForm renew={(await searchParams).renovar === "1"} />;
}

export default function LoginPage(props: PageProps<"/login">) {
  return <><h1>Iniciar sesión</h1><Suspense><Login {...props} /></Suspense></>;
}
