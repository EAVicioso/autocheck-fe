type JsonWithRaw = typeof JSON & { rawJSON(source: string): object };
type ReviverContext = { source?: string };

// The handoff marks the JSON number named version as Int64. Other fields
// named version can be strings (rule version) or small integers.
export function parseWireJson(source: string): unknown {
  return JSON.parse(source, (key: string, value: unknown, context?: ReviverContext) => {
    if (key === "version" && typeof value === "number" && !Number.isSafeInteger(value)) {
      if (!context?.source || !/^-?\d+$/.test(context.source)) {
        throw new SyntaxError("Versión Int64 inválida o sin representación exacta.");
      }
      return BigInt(context.source);
    }
    return value;
  });
}

export function serializeWireJson(value: unknown): string {
  return JSON.stringify(value, (key, item: unknown) => {
    if (key !== "version") return item;
    if (typeof item === "bigint") return (JSON as JsonWithRaw).rawJSON(item.toString());
    if (typeof item === "number" && !Number.isSafeInteger(item)) {
      throw new TypeError("Usa bigint para representar una versión Int64 fuera del rango seguro.");
    }
    return item;
  });
}
