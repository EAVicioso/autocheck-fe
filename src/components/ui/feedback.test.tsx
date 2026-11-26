import { act, fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, expect, it, vi } from "vitest";
import { Badge } from "./badge";
import { CountdownTimer } from "./countdown-timer";
import { DataTable } from "./data-table";
import { Drawer, Modal } from "./dialog";
import { Toast } from "./feedback";
import { StatCard } from "./statistics";

afterEach(() => { vi.useRealTimers(); vi.restoreAllMocks(); });

it("muestra carga, reintento, vacío y paginación acotada", async () => {
  const retry = vi.fn(), pageChange = vi.fn(), user = userEvent.setup();
  const common = { caption: "Citas", columns: [{ id: "id", heading: "ID", render: String }],
    rowKey: String, page: 1, onPageChange: pageChange, filters: <label>Filtro <input /></label>, updatedAt: null };
  const table = render(<DataTable<number> {...common} state={{ status: "loading" }} />);
  expect(screen.getByText("Cargando…")).toBeVisible();
  table.rerender(<DataTable<number> {...common} state={{ status: "error", message: "Error de prueba", retry }} />);
  await user.click(screen.getByRole("button", { name: "Reintentar" }));
  expect(retry).toHaveBeenCalledOnce();
  table.rerender(<DataTable<number> {...common} state={{ status: "ready", rows: [], hasNext: false }} />);
  expect(screen.getByText("Sin datos", { exact: true })).toBeVisible();
  table.rerender(<DataTable<number> {...common} state={{ status: "ready", rows: Array.from({ length: 21 }, (_, i) => i), hasNext: true }} />);
  expect(screen.getAllByRole("row")).toHaveLength(21);
  expect(screen.getByRole("textbox", { name: "Filtro" })).toBeVisible();
  await user.click(screen.getByRole("button", { name: "Siguiente" }));
  expect(pageChange).toHaveBeenCalledWith(2);
});

it("muestra estadísticas sin NaN y una anomalía preventiva explícita", () => {
  const at = "2026-11-25T02:30:00Z";
  const card = render(<StatCard title="Aprobación" value={NaN} closed={0} updatedAt={null} />);
  expect(screen.queryByText(/NaN/)).toBeNull();
  expect(screen.getByText("Sin datos", { exact: true })).toBeVisible();
  card.rerender(<StatCard title="Aprobación" value="95.2%" closed={21} updatedAt={at}
    anomaly={{ approved: 20, total: 21, from: at, to: at }} />);
  expect(screen.getByText(/Última actualización/)).toHaveTextContent("Santo Domingo");
  expect(screen.getByText(/Anomalía preventiva/)).toHaveTextContent("20 de 21 inspecciones aprobadas");
});

it("expone estados por texto y permite descartar notificaciones", async () => {
  const dismiss = vi.fn();
  render(<><Badge status="LIBRE" /><Badge status="RETENIDO" /><Badge status="CONFIRMADO" />
    <Badge status="Aprobado" /><Badge status="Rechazado" /><Toast message="Cambios guardados" onDismiss={dismiss} /></>);
  for (const value of ["LIBRE", "RETENIDO", "CONFIRMADO", "Aprobado", "Rechazado"]) expect(screen.getByText(value)).toBeVisible();
  await userEvent.click(screen.getByRole("button", { name: "Descartar notificación" }));
  expect(dismiss).toHaveBeenCalledOnce();
});

it.each([Modal, Drawer])("etiqueta el diálogo y delega Escape y cierre", (Dialog) => {
  const prototype = HTMLDialogElement.prototype;
  const names = ["showModal", "close"] as const;
  const original = names.map((name) => Object.getOwnPropertyDescriptor(prototype, name));
  for (const name of names) Object.defineProperty(prototype, name, {
    configurable: true, value(this: HTMLDialogElement) { this.open = name === "showModal"; },
  });
  try {
    const close = vi.fn();
    const view = render(<Dialog open title="Detalle" onClose={close}>Datos</Dialog>);
    const dialog = screen.getByRole("dialog", { name: "Detalle" });
    fireEvent(dialog, new Event("cancel", { cancelable: true, bubbles: true }));
    fireEvent.click(screen.getByRole("button", { name: "Cerrar" }));
    expect(close).toHaveBeenCalledTimes(2);
    view.unmount();
    expect(dialog).not.toHaveAttribute("open");
  } finally {
    names.forEach((name, index) => {
      const descriptor = original[index];
      if (descriptor) Object.defineProperty(prototype, name, descriptor);
      else Reflect.deleteProperty(prototype, name);
    });
  }
});

it("usa el vencimiento de servidor entre 299 s, 300 s y 301 s", async () => {
  vi.useFakeTimers();
  vi.setSystemTime(new Date("2026-11-25T12:04:59Z"));
  render(<CountdownTimer expiresAtUtc="2026-11-25T12:05:00Z" />);
  await act(() => vi.advanceTimersByTimeAsync(0));
  expect(screen.getByRole("timer")).toHaveTextContent("0:01");
  await act(() => vi.advanceTimersByTimeAsync(1000));
  expect(screen.getByRole("status")).toHaveTextContent("Retención vencida");
  await act(() => vi.advanceTimersByTimeAsync(1000));
  expect(screen.getByRole("status")).toHaveTextContent("Retención vencida");
});
