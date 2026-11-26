import { afterEach, expect, it, vi } from "vitest";
import { refreshRejectedHeader, sessionAction } from "./bff-client";

afterEach(() => vi.unstubAllGlobals());

it("vuelve a pedir el perfil con las cookies vigentes tras un rechazo del canje", async () => {
  const fetcher = vi.fn<typeof fetch>()
    .mockResolvedValueOnce(new Response(null, { status: 401, headers: { [refreshRejectedHeader]: "1" } }))
    .mockResolvedValueOnce(Response.json({ id: "actor" }));
  vi.stubGlobal("fetch", fetcher);

  await expect(sessionAction("perfil", undefined)).resolves.toMatchObject({ id: "actor" });
  expect(fetcher).toHaveBeenCalledTimes(2);
});

it("detiene la consulta tras un segundo rechazo del canje", async () => {
  const fetcher = vi.fn<typeof fetch>(async () =>
    new Response(null, { status: 401, headers: { [refreshRejectedHeader]: "1" } }));
  vi.stubGlobal("fetch", fetcher);

  await expect(sessionAction("perfil", undefined)).rejects.toMatchObject({ status: 401 });
  expect(fetcher).toHaveBeenCalledTimes(2);
});
