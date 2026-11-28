import { PaymentPage } from "@/features/payments/page";

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  return <PaymentPage id={(await params).id} />;
}
