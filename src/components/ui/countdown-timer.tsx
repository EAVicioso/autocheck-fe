"use client";

import { useEffect, useState } from "react";

function secondsRemaining(expiresAtUtc: string, now: number) {
  const expires = Date.parse(expiresAtUtc);
  return Number.isFinite(expires) ? Math.max(0, Math.ceil((expires - now) / 1000)) : 0;
}

export function CountdownTimer({ expiresAtUtc }: { expiresAtUtc: string }) {
  const [now, setNow] = useState<number | null>(null);

  useEffect(() => {
    let timer: ReturnType<typeof setTimeout>;
    function tick() {
      const current = Date.now();
      setNow(current);
      if (secondsRemaining(expiresAtUtc, current) > 0) timer = setTimeout(tick, 250);
    }
    timer = setTimeout(tick, 0);
    return () => clearTimeout(timer);
  }, [expiresAtUtc]);

  if (now === null) return <span>Calculando tiempo restante…</span>;
  const seconds = secondsRemaining(expiresAtUtc, now);
  if (seconds === 0) return <span role="status">Retención vencida</span>;
  const duration = Math.floor(seconds / 60) + ":" + String(seconds % 60).padStart(2, "0");
  return <span role="timer" aria-label="Tiempo restante de retención" className="tabular-nums">{duration}</span>;
}
