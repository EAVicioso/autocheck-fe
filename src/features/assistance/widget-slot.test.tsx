import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, expect, it, vi } from "vitest";
import { SessionProvider } from "@/features/identity/session-context";
import { AssistanceSlot } from "./widget-slot";

afterEach(() => vi.unstubAllGlobals());

it("mantiene el contenedor global con envío desactivado sin sesión", async () => {
  vi.stubGlobal("fetch", vi.fn(async () => new Response(null, { status: 401 })));
  render(<SessionProvider><AssistanceSlot /></SessionProvider>);
  expect(screen.getByRole("complementary", { name: "Asistencia" })).toBeInTheDocument();
  expect(screen.queryByRole("button", { name: "Enviar consulta" })).not.toBeInTheDocument();
});

it("envía una consulta validada desde el formulario solo con perfil activo", async () => {
  const fetcher = vi.fn<typeof fetch>()
    .mockResolvedValueOnce(Response.json({ id: "fixture", rol: "Ciudadano", permisos: [], centroId: null }))
    .mockResolvedValueOnce(Response.json({ respuesta: "Respuesta de prueba.", categoria: "ITV", codigo: "OK" }));
  vi.stubGlobal("fetch", fetcher);
  const user = userEvent.setup();
  render(<SessionProvider><AssistanceSlot /></SessionProvider>);
  const field = await screen.findByRole("textbox", { name: "Consulta" });
  await user.type(field, "  Horario  ");
  await user.tab();
  expect(screen.getByRole("button", { name: "Enviar consulta" })).toHaveFocus();
  await user.keyboard("{Enter}");
  expect(await screen.findByRole("status")).toHaveTextContent("Respuesta de prueba.");
  expect(fetcher.mock.calls[1][1]?.body).toBe('{"consulta":"Horario"}');
});
