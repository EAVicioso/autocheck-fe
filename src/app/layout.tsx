import type { Metadata } from "next";
import { AssistanceSlot } from "@/features/assistance/widget-slot";
import { SessionProvider } from "@/features/identity/session-context";
import { NotificationsProvider } from "@/shared/notifications/context";
import "./globals.css";

export const metadata: Metadata = {
  title: "AutoCheck",
  description: "Portal de inspección técnica vehicular.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="es-DO">
      <body>
        <SessionProvider>
          <NotificationsProvider>
            {children}
            <AssistanceSlot />
          </NotificationsProvider>
        </SessionProvider>
      </body>
    </html>
  );
}
