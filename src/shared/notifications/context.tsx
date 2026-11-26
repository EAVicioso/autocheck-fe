"use client";

import { createContext, useContext, useState, type ReactNode } from "react";
import { Toast } from "@/components/ui/feedback";

type Notice = { message: string; kind: "status" | "error" };
const Notifications = createContext<{
  notice: Notice | null;
  notify: (notice: Notice | null) => void;
} | null>(null);

export function NotificationsProvider({ children }: { children: ReactNode }) {
  const [notice, notify] = useState<Notice | null>(null);
  return (
    <Notifications value={{ notice, notify }}>
      {children}
      {notice && <Toast message={notice.message} variant={notice.kind === "error" ? "error" : "notice"} onDismiss={() => notify(null)} />}
    </Notifications>
  );
}

export function useNotifications() {
  const notifications = useContext(Notifications);
  if (!notifications) throw new Error("Falta NotificationsProvider.");
  return notifications;
}
