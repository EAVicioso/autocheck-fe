"use client";

import { createContext, useCallback, useContext, useEffect, useRef, useState, type ReactNode } from "react";
import type { Operations } from "@/shared/api/contract.generated";
import { sessionAction, SessionActionError } from "./bff-client";
import type { SessionProfile } from "./profile";

type SessionState = { status: "loading" | "anonymous" | "unavailable"; profile: null }
  | { status: "active"; profile: SessionProfile };
type Login = Operations["POST /api/auth/login"]["input"]["body"];
type SessionContextValue = SessionState & {
  login(body: Login): Promise<SessionProfile>;
  logout(): Promise<void>;
  revalidate(): Promise<SessionProfile | null>;
  recordActivity(): Promise<void>;
  clear(): void;
};

const SessionContext = createContext<SessionContextValue | null>(null);

export function SessionProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<SessionState>({ status: "loading", profile: null });
  const pending = useRef<Promise<SessionProfile | null> | null>(null);
  const transitioning = useRef(false);
  const generation = useRef(0);

  const clear = useCallback(() => {
    generation.current++;
    setSession({ status: "anonymous", profile: null });
  }, []);

  const revalidate = useCallback((): Promise<SessionProfile | null> => {
    if (transitioning.current) return Promise.resolve(null);
    const revision = generation.current;
    pending.current ??= sessionAction("perfil", undefined).then((profile) => {
      if (revision !== generation.current) return null;
      setSession({ status: "active", profile });
      return profile;
    }).catch((error: unknown) => {
      if (revision !== generation.current) return null;
      if (error instanceof SessionActionError && [401, 403, 404].includes(error.status)) clear();
      else setSession({ status: "unavailable", profile: null });
      return null;
    }).finally(() => { pending.current = null; });
    return pending.current;
  }, [clear]);

  useEffect(() => {
    void revalidate();
    const timer = setInterval(() => {
      if (document.visibilityState === "visible") void revalidate();
    }, 60_000);
    const onVisible = () => {
      if (document.visibilityState === "visible") void revalidate();
    };
    document.addEventListener("visibilitychange", onVisible);
    return () => {
      clearInterval(timer);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, [revalidate]);

  async function login(body: Login) {
    transitioning.current = true;
    try {
      await pending.current;
      const profile = await sessionAction("login", body);
      setSession({ status: "active", profile });
      return profile;
    } finally {
      transitioning.current = false;
    }
  }

  async function logout() {
    transitioning.current = true;
    clear();
    try {
      await pending.current;
      await sessionAction("logout", undefined);
    } finally {
      transitioning.current = false;
    }
  }

  async function recordActivity() {
    if (session.status !== "active") return;
    try {
      await sessionAction("actividad", undefined);
    } catch (error) {
      if (error instanceof SessionActionError && error.status === 401) await revalidate();
      throw error;
    }
  }

  return <SessionContext value={{ ...session, login, logout, recordActivity, revalidate, clear }}>{children}</SessionContext>;
}

export function useSession() {
  const session = useContext(SessionContext);
  if (!session) throw new Error("Falta SessionProvider.");
  return session;
}
