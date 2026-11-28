import { expect, it } from "vitest";
import { idleRemaining } from "./session-time";

it("expira justo al alcanzar 60 minutos de inactividad", () => {
  expect(idleRemaining(12_000, 12_000 + 3_599_000)).toBe(1000);
  expect(idleRemaining(12_000, 12_000 + 3_600_000)).toBe(0);
});
