"use client";

import { ChatbotWidget } from "@/components/ui/chatbot-widget";
import { Card } from "@/components/ui/layout";
import { useSession } from "@/features/identity/session-context";

export function AssistanceSlot() {
  const session = useSession();
  return <aside aria-label="Asistencia" id="asistencia" className="mx-auto w-full max-w-7xl px-4 sm:px-6">
    {session.status === "active" && <Card>
      <ChatbotWidget key={session.profile.id} onUnauthorized={session.clear} />
    </Card>}
  </aside>;
}
