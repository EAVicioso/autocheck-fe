/** @vitest-environment node */
import { readFileSync } from "node:fs";
import { expect, it } from "vitest";

const css = readFileSync(new URL("../../app/globals.css", import.meta.url), "utf8");

function luminance(token: string) {
  const value = css.match(new RegExp("--color-" + token + ": #([a-fA-F0-9]{6});"))?.[1];
  if (!value) throw new Error("Token ausente: " + token);
  const [r, g, b] = [0, 2, 4].map((index) => {
    const channel = Number.parseInt(value.slice(index, index + 2), 16) / 255;
    return channel <= 0.04045 ? channel / 12.92 : ((channel + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

it("los pares semánticos mantienen el contraste RS-02", () => {
  for (const surface of ["surface", "surface-elevated", "brand-tint"]) {
    for (const ink of ["primary", "muted", "brand-primary", "status-approved", "status-rejected", "status-pending", "status-alert", "subtle"]) {
      const lights = [luminance(surface), luminance(ink)].sort((a, b) => a - b);
      expect((lights[1] + 0.05) / (lights[0] + 0.05), ink + " sobre " + surface).toBeGreaterThanOrEqual(ink === "subtle" ? 3 : 4.5);
    }
  }
});

it("mantiene contraste en los nodos de progreso", () => {
  const white = luminance("on-brand");
  expect((white + 0.05) / (luminance("brand-primary") + 0.05)).toBeGreaterThanOrEqual(4.5);
  expect((white + 0.05) / (luminance("brand-accent") + 0.05)).toBeGreaterThanOrEqual(3);
});
