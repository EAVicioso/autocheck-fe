import { readFileSync, writeFileSync } from "node:fs";
import { createHash } from "node:crypto";

const source = readFileSync(new URL("../.agents/API_CONTRACT.md", import.meta.url), "utf8").replaceAll("\r\n", "\n");
const target = new URL("../src/shared/api/contract.generated.ts", import.meta.url);
const types = source.match(/^```typescript\n([\s\S]+?)\n```$/m)?.[1];
if (!types) throw new Error("Falta el bloque TypeScript del contrato.");

const exported = types.replace(/^type /gm, "export type ").replace(
  "Version = Int // >0; wire Int64, preservar precisión",
  "Version = Int | bigint // >0; entero JSON Int64, bigint fuera del rango seguro de Number",
);
if (!exported.includes("Version = Int | bigint")) throw new Error("Revisar la proyección de Version.");

const contingency = source.match(/^```json\n([^\n]+)\n```$/m)?.[1];
if (!contingency) throw new Error("Falta la contingencia JSON del contrato.");
const assistanceFallback = JSON.stringify(JSON.parse(contingency));

const headings = [...source.matchAll(/^#### `\[(\w+)\] (\/api\/[^`]+)` — ([^\n]+)\n([\s\S]*?)(?=^#{2,4} |\s*$\n## |$(?![\s\S]))/gm)];
if (headings.length !== 57) throw new Error("Se esperaban 57 operaciones de negocio; revisar el inventario.");

function field(block, name) {
  return block.split("\n").find((line) => line.startsWith("- **" + name + "** "))?.slice(name.length + 7) ?? "";
}

function parseOperation([, method, path, name, block]) {
  const key = method + " " + path;
  const auth = field(block, "Auth").slice(1, -1);
  const response = field(block, "Response");
  const bindings = field(block, "Headers / Query / Route");
  const body = field(block, "Request Body");
  const errors = field(block, "Errores Específicos");
  const rules = field(block, "Efectos / Reglas Críticas");
  if (!auth || !response || !errors || !rules || (body && !/^`[^`]+`$/.test(body))) throw new Error("Ficha incompleta: " + key);

  const inputs = {};
  const bindingSegments = bindings.matchAll(/(?:^|;\s+)(Ruta|Query|Header)\s+`([^`]+)`(?: \([^)]+\))?/gi);
  let parsedLength = 0;
  for (const segment of bindingSegments) {
    const [, label, type] = segment;
    parsedLength += segment[0].length;
    const prop = { ruta: "params", query: "query", header: "headers" }[label.toLowerCase()];
    inputs[prop] = type;
  }
  if (parsedLength !== bindings.length || path.includes("{") !== Boolean(inputs.params)) {
    throw new Error("Bindings sin interpretar: " + key);
  }
  if (body) inputs.body = body.slice(1, -1);

  const assistance = key === "POST /api/asistencia";
  const codeByStatus = {};
  if (errors !== "Aplica el contrato transversal.") {
    for (const clause of errors.replace(/\([^)]*\)/g, "").split(/;\s*/)) {
      const statuses = clause.match(/^[\d, y]+(?= \p{L})/u)?.[0].match(/\d{3}/g);
      const codes = [...clause.matchAll(/\b[A-Z]+(?:_[A-Z]+)+\b/g)].map(([code]) => code);
      if (!statuses?.length || !codes.length) throw new Error("Errores sin interpretar: " + key + " " + clause);
      for (const status of statuses) codeByStatus[status] = codes;
    }
  }

  const successes = [...response.matchAll(/`(2\d{2})` `([^`]+)`(?: (pendiente|emitido))?/g)].map(([, status, type, variant]) => {
    const format = type === "sin cuerpo" ? "empty" : type === "binario application/pdf" ? "pdf" : "json";
    if (variant && type !== "Certificado") throw new Error("Variante desconocida: " + key);
    const shape = format === "empty" ? "undefined" : format === "pdf" ? "Blob" : variant
      ? 'Certificado & { estado: "' + (variant === "pendiente" ? "PENDIENTE" : "EMITIDO") + '" }' : type;
    return { status: Number(status), format, shape };
  });
  if (!successes.length || (successes.length === 1 && !/^`2\d{2}` `[^`]+`$/.test(response))) throw new Error("Respuesta sin interpretar: " + key);
  const authMode = auth.includes("HMAC") ? "webhook" : auth.startsWith("Bearer") ? "bearer" : auth.startsWith("Public") ? "public" : null;
  if (!authMode) throw new Error("Auth sin interpretar: " + key);

  return { key, name, inputs, successes, codeByStatus, assistance, auth: authMode, method, path,
    idempotent: inputs.headers === "IK", location: rules.match(/`Location: ([^`]+)`/)?.[1] ?? null,
  };
}

const operations = headings.map(parseOperation);
if (new Set(operations.map(({ key }) => key)).size !== 57) throw new Error("Operaciones duplicadas.");

function renderOperation(entry) {
  const success = entry.successes.map(({ status, shape, format }) => {
    const headers = ["retryAfter: string | null"];
    if (entry.location) headers.push("location: string | null");
    if (format === "pdf") headers.push("contentDisposition: string | null");
    return "{ status: " + status + "; body: " + shape.replaceAll("\n", " ") + "; headers: { " + headers.join("; ") + " } }";
  });
  const input = Object.entries(entry.inputs).map(([name, type]) => {
    const optional = name === "query" && !/\b(?:version|fecha):/.test(type);
    return "    " + name + (optional ? "?" : "") + ": " + type;
  }).join("\n");
  const codes = Object.entries(entry.codeByStatus).map(([status, values]) =>
    status + ": " + values.map((code) => JSON.stringify(code)).join(" | "));
  return [
    "  /** " + entry.name + " */",
    "  " + JSON.stringify(entry.key) + ": {",
    "    input: " + (input ? "{\n" + input + "\n    }" : "Record<string, never>"),
    "    success: " + success.join("\n      | "),
    "    errors: " + (entry.assistance ? "Asistencia" : "Problem"),
    "    errorCodes: " + (codes.length ? "{ " + codes.join("; ") + " }" : "Record<never, never>"),
    "  }",
  ].join("\n");
}

const metadata = operations.map(({ key, method, path, auth, idempotent, assistance, successes }) =>
  "  " + JSON.stringify(key) + ": " + JSON.stringify({
    method, path, auth, idempotent, assistance,
    success: Object.fromEntries(successes.map(({ status, format }) => [status, format])),
  }) + ",");
const output = [
  "// Generado por npm run contract:generate desde API_CONTRACT.md.",
  "// Incluye las 57 rutas de negocio. Salud, OpenAPI y Scalar quedan en el handoff.",
  "// SHA-256 de la fuente normalizada: " + createHash("sha256").update(source).digest("hex"),
  "",
  exported,
  "",
  "export const assistanceFallback = " + assistanceFallback + " as const satisfies Asistencia;",
  "",
  "export interface Operations {",
  ...operations.map(renderOperation),
  "}",
  "",
  "export type Operation = keyof Operations;",
  "",
  "export const operations = {",
  ...metadata,
  "} as const;",
  "",
].join("\n");

if (process.argv.includes("--check")) {
  if (readFileSync(target, "utf8").replaceAll("\r\n", "\n") !== output) {
    throw new Error("El contrato generado diverge. Ejecuta npm run contract:generate.");
  }
} else {
  writeFileSync(target, output);
}
