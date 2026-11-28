import { AuditLog } from "@/features/audit/audit-log";

export default function Page({ searchParams }: PageProps<"/admin/auditoria">) {
  return <AuditLog search={searchParams} />;
}
