import { Dashboard } from "@/features/dashboards/dashboard";

export default function Page({ searchParams }: PageProps<"/admin/reportes">) {
  return <Dashboard search={searchParams} />;
}
