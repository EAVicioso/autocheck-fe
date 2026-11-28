import { CenterDetails } from "@/features/admin/centers";

export default function Page({ params }: PageProps<"/admin/centros/[id]">) {
  return <CenterDetails params={params} />;
}
