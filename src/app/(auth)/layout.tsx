import Link from "next/link";
import type { ReactNode } from "react";

export default function IdentityLayout({ children }: { children: ReactNode }) {
  return <main><Link href="/">AutoCheck</Link>{children}</main>;
}
