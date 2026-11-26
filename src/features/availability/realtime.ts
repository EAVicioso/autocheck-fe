import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { sessionAction } from "@/features/identity/bff-client";
import type { DiaRD, Operations, UUID } from "@/shared/api/contract.generated";

type Snapshot = Operations["GET /api/centros/{id}/disponibilidad"]["success"]["body"];
type Invalidate = () => void;

export function subscribeAvailability(
  client: Pick<SupabaseClient, "channel" | "removeChannel">,
  centroId: UUID,
  isPrivate: boolean,
  invalidate: Invalidate,
) {
  const channel = client.channel("disponibilidad:" + centroId, { config: { private: isPrivate } })
    .on("broadcast", { event: "actualizada" }, ({ payload }) => {
      if (payload?.centroId === centroId) invalidate();
    })
    .subscribe((status) => {
      if (status === "SUBSCRIBED") invalidate();
    });

  return () => { void client.removeChannel(channel); };
}

export function connectAvailability(centroId: UUID, invalidate: Invalidate) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const publicKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  if (!url || !publicKey) return () => {};
  const isPrivate = process.env.NEXT_PUBLIC_SUPABASE_REALTIME_PRIVATE === "true";
  const controller = new AbortController();
  let credential: Promise<string | null> | null = null;

  // The SDK obtains current credentials through the AutoCheck session boundary.
  // Passing accessToken disables its independent Supabase Auth client.
  const client = createClient(url, publicKey, {
    accessToken: () => {
      if (!isPrivate || controller.signal.aborted) return Promise.resolve(null);
      credential ??= sessionAction("realtime", undefined, controller.signal)
        .then(({ accessToken }) => accessToken).catch(() => null).finally(() => { credential = null; });
      return credential;
    },
  });
  const unsubscribe = subscribeAvailability(client, centroId, isPrivate, invalidate);
  return () => {
    controller.abort();
    unsubscribe();
  };
}

export async function readAvailability(centroId: UUID, fecha: DiaRD, signal: AbortSignal): Promise<Snapshot> {
  const path = "/api/availability/" + encodeURIComponent(centroId);
  const response = await fetch(path + "?" + new URLSearchParams({ fecha }), {
    method: "POST", credentials: "same-origin", cache: "no-store", signal,
  });
  if (!response.ok) throw new Error("No se pudo consultar la disponibilidad.");
  return response.json();
}

export function watchAvailability({
  centroId, fecha, onSnapshot, onError,
  read = readAvailability, connect = connectAvailability,
}: {
  centroId: UUID;
  fecha: DiaRD;
  onSnapshot(snapshot: Snapshot): void;
  onError(error: unknown): void;
  read?: typeof readAvailability;
  connect?: typeof connectAvailability;
}) {
  const controller = new AbortController();
  let pending = false;
  let dirty = false;
  let expiration: ReturnType<typeof setTimeout> | undefined;
  const pollMs = 30_000;

  function scheduleExpiration(snapshot: Snapshot) {
    clearTimeout(expiration);
    const now = Date.now();
    const next = snapshot.bloques.reduce((earliest, block) => {
      const at = block.estado === "RETENIDO" && block.expiraUtc ? Date.parse(block.expiraUtc) : NaN;
      return at > now ? Math.min(earliest, at) : earliest;
    }, Infinity);
    if (next - now <= 2_147_483_647) expiration = setTimeout(invalidate, next - now);
  }

  async function readUntilCurrent() {
    pending = true;
    try {
      while (dirty && !controller.signal.aborted) {
        dirty = false;
        try {
          const snapshot = await read(centroId, fecha, controller.signal);
          if (!controller.signal.aborted && !dirty) {
            scheduleExpiration(snapshot);
            onSnapshot(snapshot);
          }
        } catch (error) {
          if (!controller.signal.aborted) onError(error);
        }
      }
    } finally {
      pending = false;
    }
  }

  function invalidate() {
    if (controller.signal.aborted) return;
    dirty = true;
    if (!pending) void readUntilCurrent();
  }

  let disconnect: (() => void) | undefined;
  try {
    disconnect = connect(centroId, invalidate);
  } catch (error) {
    onError(error);
  }
  invalidate();
  const polling = setInterval(invalidate, pollMs);
  return () => {
    controller.abort();
    clearInterval(polling);
    clearTimeout(expiration);
    disconnect?.();
  };
}
