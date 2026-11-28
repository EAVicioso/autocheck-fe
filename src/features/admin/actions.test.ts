import { expect, it, vi } from "vitest";
import { requireAdminAccess, sectionData } from "@/core/section-server";
import { RequestFailure } from "@/shared/api/deadline";
import { saveCenter, saveRamp, saveRule, saveSchedule, saveUserAccess } from "./actions";
import { adminMutation } from "./mutation";

vi.mock("@/core/section-server", () => ({ requireAdminAccess: vi.fn(), sectionData: vi.fn() }));
vi.mock("./mutation", () => ({
  adminMutation: vi.fn(),
  invalid: (message: string) => ({ kind: "error", message }),
}));

const id = "00000000-0000-4000-8000-000000000001";

it("devuelve un aviso de reintento en cada formulario si falla la lectura de acceso", async () => {
  vi.mocked(requireAdminAccess).mockRejectedValue(new RequestFailure("network"));
  const data = new FormData();
  const feedback = { kind: "error", message: "No se pudo validar el acceso. Vuelve a intentar." };
  await expect(saveUserAccess(id, "1", null, data)).resolves.toEqual(feedback);
  await expect(saveCenter(id, null, data)).resolves.toEqual(feedback);
  await expect(saveRamp(id, null, null, data)).resolves.toEqual(feedback);
  await expect(saveSchedule(id, null, data)).resolves.toEqual(feedback);
  await expect(saveRule(null, data)).resolves.toEqual(feedback);
  expect(adminMutation).not.toHaveBeenCalled();
  expect(sectionData).not.toHaveBeenCalled();
});

it("mantiene la señal de navegación de la guarda", async () => {
  const navigation = new Error("NEXT_REDIRECT");
  vi.mocked(requireAdminAccess).mockRejectedValueOnce(navigation);
  await expect(saveRule(null, new FormData())).rejects.toBe(navigation);
});
