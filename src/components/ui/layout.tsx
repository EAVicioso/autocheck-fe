import Link from "next/link";
import { LayoutDashboard } from "lucide-react";
import type { ComponentProps, ReactNode } from "react";
import { cn } from "./classes";

export function AcademicDisclaimerBanner() {
  return <p className="rounded-control border border-subtle bg-brand-tint px-4 py-3 text-sm text-primary">
    AutoCheck es un prototipo académico sin validez legal ni oficial ante INTRANT.
  </p>;
}

export function AppShell({ sidebar, topbar, children, academicNotice = true }: {
  sidebar?: ReactNode; topbar?: ReactNode; children: ReactNode; academicNotice?: boolean;
}) {
  return <div className="mx-auto max-w-7xl space-y-4 p-6">
    <a href="#contenido" className="sr-only focus:not-sr-only">Ir al contenido principal</a>
    {topbar}
    {academicNotice && <AcademicDisclaimerBanner />}
    <div className="flex flex-col gap-4 lg:flex-row">
      {sidebar}
      <main id="contenido" tabIndex={-1} className="min-w-0 flex-1 space-y-4 wrap-break-word">{children}</main>
    </div>
  </div>;
}

type NavigationItem = { href: string; label: string; current?: boolean };

export function PortalNavigation({ label, items, horizontal = false }: {
  label: string; items: readonly NavigationItem[]; horizontal?: boolean;
}) {
  return <nav aria-label={label} className={horizontal ? undefined : "shrink-0 rounded-panel border border-subtle bg-surface-elevated p-2 lg:w-60"}>
    <ul className={horizontal ? "flex flex-wrap gap-4" : "space-y-1"}>{items.map(({ href, label, current }) => <li key={href}>
      <Link href={href} aria-current={current ? "page" : undefined} className={cn(
        "flex min-h-11 items-center gap-2 rounded-control border-s-4 border-transparent px-4 py-2.5 text-primary transition-colors hover:bg-brand-tint/70",
        current && "border-brand-primary bg-brand-tint font-semibold text-brand-primary",
      )}>{!horizontal && <LayoutDashboard aria-hidden="true" className="size-4 shrink-0" />}{label}</Link>
    </li>)}</ul>
  </nav>;
}

export function RoleSidebar({ label, items }: { label: string; items: readonly NavigationItem[] }) {
  return <PortalNavigation label={label} items={items} />;
}

export function Topbar({ children, actions }: { children: ReactNode; actions?: ReactNode }) {
  return <header className="flex flex-wrap items-center justify-between gap-4 border-b border-subtle pb-4">
    <div className="font-semibold">{children}</div>{actions}
  </header>;
}

export function PageHeader({ title, description, actions }: { title: string; description?: string; actions?: ReactNode }) {
  return <header className="flex flex-wrap items-start justify-between gap-4">
    <div><h1 className="text-page-title font-bold">{title}</h1>{description && <p className="text-muted">{description}</p>}</div>
    {actions}
  </header>;
}

export function Card({ className, ...props }: ComponentProps<"div">) {
  return <div {...props} className={cn("rounded-panel border border-subtle bg-surface-elevated p-6 shadow-panel", className)} />;
}

export function Breadcrumb({ items }: { items: readonly NavigationItem[] }) {
  return <nav aria-label="Ruta de navegación">
    <ol className="flex flex-wrap gap-2 text-sm">{items.map(({ href, label }, index) => <li key={href} className="flex gap-2">
      {index > 0 && <span aria-hidden="true">/</span>}
      {index === items.length - 1 ? <span aria-current="page">{label}</span> : <Link href={href}>{label}</Link>}
    </li>)}</ol>
  </nav>;
}
