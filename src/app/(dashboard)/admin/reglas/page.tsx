import { Rules } from "@/features/admin/rules";

export default function Page({ searchParams }: PageProps<"/admin/reglas">) {
  return <Rules search={searchParams} />;
}
