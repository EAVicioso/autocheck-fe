import { Users } from "@/features/admin/users";

export default function Page({ searchParams }: PageProps<"/admin/usuarios">) {
  return <Users search={searchParams} />;
}
