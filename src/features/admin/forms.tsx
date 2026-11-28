"use client";

import { startTransition, useActionState, type ReactNode, type SubmitEvent } from "react";
import { Button } from "@/components/ui/controls";
import { AlertBanner } from "@/components/ui/feedback";
import { useHydrated } from "@/core/use-hydrated";

export type AdminFeedback = { kind: "error" | "notice"; message: string } | null;
export type AdminFormAction = (previous: AdminFeedback, data: FormData) => Promise<AdminFeedback>;

export function AdminForm({ action, children, label }: { action: AdminFormAction; children: ReactNode; label: string }) {
  const [feedback, submit, pending] = useActionState(action, null);
  const ready = useHydrated();

  function onSubmit(event: SubmitEvent<HTMLFormElement>) {
    event.preventDefault();
    if (pending) return;
    const data = new FormData(event.currentTarget);
    startTransition(() => submit(data));
  }

  return <form method="post" onSubmit={onSubmit} className="space-y-3">
    <fieldset disabled={!ready || pending} className="space-y-3">
      {children}
      <Button type="submit" size="touch">{pending ? "Guardando…" : label}</Button>
    </fieldset>
    {pending ? <p role="status" className="sr-only">Guardando cambios…</p>
      : feedback && <AlertBanner variant={feedback.kind}>{feedback.message}</AlertBanner>}
  </form>;
}
