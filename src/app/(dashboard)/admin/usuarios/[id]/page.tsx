import { UserAccess } from "@/features/admin/users";

export default function Page({ params }: PageProps<"/admin/usuarios/[id]">) {
  return <UserAccess params={params} />;
}
