import { Centers } from "@/features/admin/centers";

export default function Page({ searchParams }: PageProps<"/admin/centros">) {
  return <Centers search={searchParams} />;
}
