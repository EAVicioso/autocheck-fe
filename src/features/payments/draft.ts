import { z } from "zod";
import { uuid } from "@/core/search";
import { startCommand, type StartCommand } from "./contract";

const draftSchema = z.strictObject({ command: startCommand, intentoId: uuid.optional() });
export type PaymentDraft = z.infer<typeof draftSchema>;

function storageKey(actor: string) { return "autocheck:booking:" + actor; }

export function readDraft(actor: string): PaymentDraft | undefined {
  try {
    const parsed = draftSchema.safeParse(JSON.parse(sessionStorage.getItem(storageKey(actor)) ?? "null"));
    if (parsed.success) return parsed.data;
  } catch {
    // A disabled or unavailable store cannot restore an attempt.
  }
}

export function storeDraft(actor: string, draft: PaymentDraft) {
  sessionStorage.setItem(storageKey(actor), JSON.stringify(draft));
}

export function clearDraft(actor: string, expected: { key: string } | { intentoId: string }) {
  try {
    const draft = readDraft(actor);
    if (draft && ("key" in expected ? draft.command.key === expected.key : draft.intentoId === expected.intentoId)) {
      sessionStorage.removeItem(storageKey(actor));
    }
  } catch {
    // A later page can still reconcile the saved attempt.
  }
}

export function newDraft(body: StartCommand["body"]): PaymentDraft {
  return { command: { action: "start", key: crypto.randomUUID(), body } };
}
