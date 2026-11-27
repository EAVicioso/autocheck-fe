import { expect, it } from "vitest";
import { dominicanLocalToUtc, inclusiveEndUtc } from "./dominican-range";

it("cubre el día dominicano hasta el último tick UTC sin incluir la medianoche siguiente", () => {
  expect(dominicanLocalToUtc("2026-11-26T00:00")).toBe("2026-11-26T04:00:00.000Z");
  expect(inclusiveEndUtc("2026-11-26")).toBe("2026-11-27T03:59:59.9999999Z");
});
