import type { Conteos } from "@/shared/api/contract.generated";

export function InspectionCounts({ m, l, md, g }: Conteos) {
  return <dl className="grid grid-cols-2 gap-4 sm:grid-cols-4">
    <div className="rounded-control bg-brand-tint p-4"><dt>Límite de leves (M)</dt><dd className="text-xl font-semibold">{m}</dd></div>
    <div className="rounded-control bg-brand-tint p-4"><dt>Leves</dt><dd className="text-xl font-semibold">{l}</dd></div>
    <div className="rounded-control bg-brand-tint p-4"><dt>Medianos</dt><dd className="text-xl font-semibold">{md}</dd></div>
    <div className="rounded-control bg-brand-tint p-4"><dt>Graves</dt><dd className="text-xl font-semibold">{g}</dd></div>
  </dl>;
}
