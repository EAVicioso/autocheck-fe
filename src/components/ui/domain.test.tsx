import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { expect, it, vi } from "vitest";
import { ChatbotWidget } from "./chatbot-widget";
import { PdfDownloadButton } from "./pdf-download-button";
import { QrVerificationCard } from "./qr-verification-card";

it("renderiza mensajes literales de QR, aviso y solo campos públicos", () => {
  const qr = render(<QrVerificationCard verification={{ state: "missing" }} />);
  expect(screen.getByRole("status")).toHaveTextContent(/^Certificado no encontrado$/);
  qr.rerender(<QrVerificationCard verification={{ state: "integrity" }} />);
  expect(screen.getByRole("status")).toHaveTextContent(/^Integridad no válida$/);
  const verification = { state: "verified" as const, certificadoId: "demo", resultado: "Aprobado" as const,
    emisionUtc: "2026-11-25T12:05:00Z", centro: "Centro", owner: "DATOS DEL TITULAR" };
  qr.rerender(<QrVerificationCard verification={verification} />);
  expect(screen.getByText(/sin validez legal ni oficial ante INTRANT/)).toBeVisible();
  expect(screen.queryByText(verification.owner)).toBeNull();
});

it("PDF ofrece reintento explícito ante fallo", async () => {
  const load = vi.fn().mockRejectedValue(new Error("Falló"));
  const user = userEvent.setup();
  render(<PdfDownloadButton load={load} />);
  await user.click(screen.getByRole("button", { name: "Descargar PDF" }));
  expect(await screen.findByRole("alert")).toHaveTextContent("No se pudo descargar el PDF.");
  await user.click(screen.getByRole("button", { name: "Reintentar" }));
  expect(load).toHaveBeenCalledTimes(2);
});

it("asistencia ofrece el literal de contingencia y reenvía solo por acción explícita", async () => {
  const send = vi.fn().mockResolvedValue({ source: "http", status: 503, reply: null });
  const user = userEvent.setup();
  render(<ChatbotWidget send={send} onUnauthorized={vi.fn()} />);
  await user.click(screen.getByRole("button", { name: "Enviar consulta" }));
  expect(await screen.findByText("Escribe una consulta.")).toBeVisible();
  expect(send).not.toHaveBeenCalled();
  await user.type(screen.getByRole("textbox", { name: "Consulta" }), "  Horario  ");
  await user.click(screen.getByRole("button", { name: "Enviar consulta" }));
  expect(await screen.findByRole("alert")).toHaveTextContent("El servicio de asistencia no está disponible temporalmente. Intenta de nuevo.");
  expect(send).toHaveBeenCalledTimes(1);
  await user.click(screen.getByRole("button", { name: "Reintentar consulta" }));
  expect(send).toHaveBeenNthCalledWith(2, { consulta: "Horario" }, expect.any(AbortSignal));
});
