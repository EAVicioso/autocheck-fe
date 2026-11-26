import type { ReactNode } from "react";
import { ProtectedLayout } from "@/features/identity/guards";

export default function Layout({ children }: { children: ReactNode }) {
  return <ProtectedLayout role="Ciudadano">{children}</ProtectedLayout>;
}
