"use client";

import { ChatbotWidget } from "@/components/ui/chatbot-widget";
import { Card } from "@/components/ui/layout";
import { useSession } from "@/features/identity/session-context";
import { sessionAction, SessionActionError } from "@/features/identity/bff-client";

export function AssistanceSlot() {
  const session = useSession();
  async function recoverSession(signal: AbortSignal) {
    // The assistance DTO intentionally collapses both upstream 401 variants.
    // The profile endpoint classifies the rejection and commits cookie changes.
    try {
      const profile = await sessionAction("perfil", undefined, signal);
      if (signal.aborted) return "unavailable" as const;
      if (profile.id !== session.profile?.id) {
        session.clear();
        return "invalid" as const;
      }
      return "renewed" as const;
    } catch (error) {
      if (!signal.aborted && error instanceof SessionActionError && [401, 403, 404].includes(error.status)) {
        session.clear();
        return "invalid" as const;
      }
      return "unavailable" as const;
    }
  }
  return <aside aria-label="Asistencia" id="asistencia" className="mx-auto w-full max-w-7xl px-4 sm:px-6">
    {session.status === "active" && <Card>
      <ChatbotWidget key={session.profile.id} onUnauthorized={recoverSession} />
    </Card>}
  </aside>;
}
