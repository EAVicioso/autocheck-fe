"use client";

import { useEffect, useState, useSyncExternalStore } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm, type DefaultValues, type FieldValues, type Path, type Resolver } from "react-hook-form";
import type { z } from "zod";
import { Button, Input } from "@/components/ui/controls";
import { Stepper } from "@/components/ui/stepper";
import { FormField } from "@/components/ui/form-field";
import { AlertBanner } from "@/components/ui/feedback";
import { formErrorPath } from "@/shared/forms/problem-path";
import { sessionAction, SessionActionError } from "./bff-client";
import { roleHome } from "./profile";
import { loginSchema, recoverySchema, registrationSchema, resetSchema } from "./schemas";
import { useSession } from "./session-context";

type Field<T extends FieldValues> = {
  name: Path<T>;
  label: string;
  type?: "text" | "email" | "password" | "hidden";
  autoComplete?: string;
};

const subscribeHydration = () => () => {};
const isHydrated = () => true;
const beforeHydration = () => false;

function IdentityForm<T extends FieldValues>({ resolver, defaults, fields, label, steps, submit }: {
  resolver: Resolver<T>;
  defaults: DefaultValues<T>;
  fields: Field<T>[];
  label: string;
  steps?: readonly string[];
  submit(values: T): Promise<string | void>;
}) {
  const { formState, register, control, handleSubmit, setError } = useForm<T>({
    resolver, defaultValues: defaults,
  });
  const [message, setMessage] = useState("");
  const [done, setDone] = useState(false);
  const ready = useSyncExternalStore(subscribeHydration, isHydrated, beforeHydration);

  const onSubmit = handleSubmit(async (values) => {
    setMessage("");
    try {
      const feedback = await submit(values);
      setMessage(feedback ?? "");
      setDone(true);
    } catch (error) {
      const problem = error instanceof SessionActionError ? error.problem : null;
      for (const [path, messages] of Object.entries(problem?.errors ?? {})) {
        const field = fields.find(({ name, type }) => type !== "hidden" && name === formErrorPath(path));
        if (field && Array.isArray(messages) && typeof messages[0] === "string") {
          setError(field.name, { type: "server", message: messages[0] });
        }
      }
      const retryAfter = error instanceof SessionActionError ? Number(error.retryAfter) : 0;
      const fallback = retryAfter > 0 ? "Vuelve a intentar en " + retryAfter + " s." : "La solicitud no pudo completarse.";
      setMessage(problem?.detail ?? problem?.title ?? fallback);
    }
  });

  return (
    <form className="space-y-4" method="post" noValidate onSubmit={onSubmit}>
      {steps && <Stepper steps={steps} current={done ? steps.length : 0} label="Progreso del formulario" />}
      <fieldset disabled={!ready} className="space-y-4">
      {fields.map(({ name, label, type = "text", autoComplete }) => type === "hidden"
        ? <Input key={name} type="hidden" {...register(name)} />
        : <FormField key={name} control={control} name={name} label={label}>
          {(field) => <Input {...field} type={type} autoComplete={autoComplete} />}
        </FormField>)}
      <Button type="submit" disabled={done || formState.isSubmitting}>{label}</Button>
      </fieldset>
      {message && <AlertBanner variant={done ? "notice" : "error"}>{message}</AlertBanner>}
    </form>
  );
}

const email = { name: "correo", label: "Correo electrónico", type: "email", autoComplete: "email" } as const;
const password = { name: "contrasena", label: "Contraseña", type: "password" } as const;

export function LoginForm({ renew }: { renew: boolean }) {
  const { login, revalidate } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (!renew) return;
    let active = true;
    void revalidate().then((profile) => {
      if (!active || !profile) return;
      router.replace(roleHome[profile.rol]);
      router.refresh();
    });
    return () => { active = false; };
  }, [renew, revalidate, router]);

  return (
    <>
      <IdentityForm<z.infer<typeof loginSchema>> resolver={zodResolver(loginSchema)}
        defaults={{ correo: "", contrasena: "" }}
        fields={[email, { ...password, autoComplete: "current-password" }]}
        label="Iniciar sesión" steps={["Credenciales", "Acceso"]}
        submit={async (body) => {
          const profile = await login(body);
          router.replace(roleHome[profile.rol]);
          router.refresh();
        }} />
      <Link href="/recuperacion">Recuperar contraseña</Link>
    </>
  );
}

export function RegistrationForm() {
  return <IdentityForm<z.infer<typeof registrationSchema>> resolver={zodResolver(registrationSchema)}
    defaults={{ nombre: "", correo: "", contrasena: "" }}
    fields={[{ name: "nombre", label: "Nombre", autoComplete: "name" }, email, { ...password, autoComplete: "new-password" }]}
    label="Registrarme" steps={["Datos de cuenta", "Solicitud recibida"]}
    submit={async (body) => {
      const result = await sessionAction("registro", body);
      return result.estado === "PENDIENTE_CONFIRMACION"
        ? "Confirma tu correo para iniciar sesión." : "Cuenta activa. Ya puedes iniciar sesión.";
    }} />;
}

export function RecoveryForm() {
  return <IdentityForm<z.infer<typeof recoverySchema>> resolver={zodResolver(recoverySchema)}
    defaults={{ correo: "" }} fields={[email]} label="Solicitar recuperación"
    submit={async (body) => (await sessionAction("recuperacion", body)).mensaje} />;
}

export function ResetForm({ token }: { token: string }) {
  const { clear } = useSession();

  return <IdentityForm<z.infer<typeof resetSchema>> resolver={zodResolver(resetSchema)}
    defaults={{ token, nuevaContrasena: "" }}
    fields={[
      { name: "token", label: "Código de recuperación", type: token ? "hidden" : "text", autoComplete: "off" },
      { name: "nuevaContrasena", label: "Nueva contraseña", type: "password", autoComplete: "new-password" },
    ]}
    label="Restablecer contraseña"
    submit={async (body) => {
      await sessionAction("restablecimiento", body);
      clear();
      window.history.replaceState(null, "", "/restablecimiento");
      return "Contraseña restablecida. Inicia sesión de nuevo.";
    }} />;
}
