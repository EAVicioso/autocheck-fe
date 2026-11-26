import Link from "next/link";
import { AppShell, Card } from "@/components/ui/layout";
import type { ReactNode } from "react";

export default function IdentityLayout({ children }: { children: ReactNode }) {
  return <AppShell><Card className="mx-auto max-w-lg space-y-4"><Link href="/">AutoCheck</Link>{children}</Card></AppShell>;
}
