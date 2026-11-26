import type { ReactNode } from "react";
import { Button } from "./controls";
import { EmptyState, ErrorState, LoadingSkeleton } from "./feedback";
import { UpdatedAt } from "./statistics";

export const defaultPageSize = 20;

type TableState<T> =
  | { status: "loading" }
  | { status: "error"; message: string; retry: () => void }
  | { status: "ready"; rows: readonly T[]; hasNext: boolean };

export function DataTable<T>({ caption, columns, state, rowKey, page, onPageChange, filters, updatedAt }: {
  caption: string;
  columns: readonly { id: string; heading: string; render(row: T): ReactNode }[];
  state: TableState<T>;
  rowKey(row: T): string;
  page: number;
  onPageChange(page: number): void;
  filters?: ReactNode;
  updatedAt?: string | null;
}) {
  return <section aria-label={caption} className="space-y-3">
    {filters}
    {updatedAt !== undefined && <UpdatedAt at={updatedAt} />}
    {state.status === "loading" && <LoadingSkeleton />}
    {state.status === "error" && <ErrorState message={state.message} retry={state.retry} />}
    {state.status === "ready" && <>
      {state.rows.length === 0 ? <EmptyState /> : <div className="overflow-x-auto">
        <table className="w-full border-collapse text-left text-sm">
          <caption className="sr-only">{caption}</caption>
          <thead className="bg-surface"><tr>{columns.map((column) =>
            <th scope="col" key={column.id} className="p-3">{column.heading}</th>)}</tr></thead>
          <tbody>{state.rows.slice(0, defaultPageSize).map((row) =>
            <tr key={rowKey(row)} className="border-b border-subtle">{columns.map((column) =>
              <td key={column.id} className="p-3">{column.render(row)}</td>)}</tr>)}</tbody>
        </table>
      </div>}
      <nav aria-label="Paginación" className="flex flex-wrap items-center gap-2">
        <Button variant="secondary" size="touch" disabled={page <= 1} onClick={() => onPageChange(page - 1)}>Anterior</Button>
        <span aria-live="polite">Página {page}</span>
        <Button variant="secondary" size="touch" disabled={!state.hasNext} onClick={() => onPageChange(page + 1)}>Siguiente</Button>
      </nav>
    </>}
  </section>;
}
