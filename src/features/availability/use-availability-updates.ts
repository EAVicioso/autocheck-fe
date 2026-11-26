"use client";

import { useEffect, useEffectEvent } from "react";
import { useSession } from "@/features/identity/session-context";
import { watchAvailability } from "./realtime";

type WatchOptions = Parameters<typeof watchAvailability>[0];

export function useAvailabilityUpdates({ centroId, fecha, onSnapshot, onError }: Pick<
  WatchOptions, "centroId" | "fecha" | "onSnapshot" | "onError"
>) {
  const session = useSession();
  const actorId = session.profile?.id;
  const publish = useEffectEvent(onSnapshot);
  const fail = useEffectEvent(onError);

  useEffect(() => {
    if (!actorId || !centroId) return;
    return watchAvailability({
      centroId, fecha, onSnapshot: (snapshot) => publish(snapshot), onError: (error) => fail(error),
    });
  }, [actorId, centroId, fecha]);
}
