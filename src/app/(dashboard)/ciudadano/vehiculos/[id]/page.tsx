import { VehicleEditor } from "@/features/vehicles/pages";

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  return <VehicleEditor id={(await params).id} />;
}

