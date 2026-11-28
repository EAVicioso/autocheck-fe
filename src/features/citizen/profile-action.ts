"use server";

import { redirect } from "next/navigation";
import { citizenContext } from "./server";
import { profileForm, rejected, type Feedback } from "./forms";
import { RequestFailure } from "@/shared/api/deadline";
import type { Version } from "@/shared/api/contract.generated";

export async function saveProfile(version: Version, input: unknown): Promise<Feedback> {
  const { api } = await citizenContext();
  const data = profileForm.safeParse(input);
  if (!data.success) return rejected(400, null);
  try {
    const result = await api.request("PATCH /api/usuarios/me", { body: { ...data.data, version } });
    if (!result.ok) {
      if (result.status === 401) redirect("/login?renovar=1");
      return rejected(result.status, result.error);
    }
    return { kind: "notice", message: "Perfil actualizado." };
  } catch (error) {
    if (!(error instanceof RequestFailure)) throw error;
    return rejected(503, null);
  }
}

