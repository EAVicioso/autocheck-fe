"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import type { Rol } from "@/shared/api/contract.generated";
import { useNotifications } from "@/shared/notifications/context";
import { useSession } from "./session-context";

export function SessionControls({ role }: { role: Rol }) {
  const session = useSession();
  const router = useRouter();
  const { notify } = useNotifications();
  const [closing, setClosing] = useState(false);

  useEffect(() => {
    if (closing) return;
    if (session.status === "anonymous") router.replace("/login");
    if (session.status === "active" && session.profile.rol !== role) router.refresh();
  }, [closing, role, router, session.status, session.profile]);

  async function logout() {
    setClosing(true);
    try {
      await session.logout();
    } catch {
      notify({ kind: "error", message: "No se pudo confirmar el cierre de sesión con AutoCheck." });
    } finally {
      router.replace("/login");
      router.refresh();
    }
  }

  return <button type="button" disabled={closing} onClick={() => void logout()}>Cerrar sesión</button>;
}
