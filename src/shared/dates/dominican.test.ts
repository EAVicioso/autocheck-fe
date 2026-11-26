import { expect, it } from "vitest";
import { dominicanDay, utcInstant } from "./dominican";

it("conserva UTC y calcula el día dominicano alrededor de medianoche", () => {
  expect(dominicanDay("2026-11-24T03:59:59+00:00")).toBe("2026-11-23");
  expect(dominicanDay("2026-11-24T04:00:00Z")).toBe("2026-11-24");
  expect(utcInstant(new Date("2026-11-23T00:00:00-04:00"))).toBe("2026-11-23T04:00:00.000Z");
});
