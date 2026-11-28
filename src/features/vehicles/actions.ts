"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { citizenContext } from "@/features/citizen/server";
import { rejected, type Feedback } from "@/features/citizen/forms";
import { RequestFailure } from "@/shared/api/deadline";
import type { Version } from "@/shared/api/contract.generated";
import { vehicleForm } from "./validation";

type Edit = { id: string; version: Version };

export async function saveVehicle(edit: Edit | null, booking: boolean, input: unknown): Promise<Feedback> {
  const { api } = await citizenContext();
  const data = vehicleForm.safeParse(input);
  if (!data.success) return rejected(400, null);
  const body = { ...data.data, anio: Number(data.data.anio) };
  try {
    const result = edit
      ? await api.request("PATCH /api/vehiculos/{id}", { params: { id: edit.id }, body: { ...body, version: edit.version } })
      : await api.request("POST /api/vehiculos", { body });
    if (!result.ok) {
      if (result.status === 401) redirect("/login?renovar=1");
      return rejected(result.status, result.error);
    }
    revalidatePath("/ciudadano/vehiculos");
    redirect(booking ? "/ciudadano/citas/nueva?vehiculo=" + encodeURIComponent(result.body.id) : "/ciudadano/vehiculos");
  } catch (error) {
    if (!(error instanceof RequestFailure)) throw error;
    return rejected(503, null);
  }
}

export async function archiveVehicle({ id, version }: Edit): Promise<Feedback> {
  const { api } = await citizenContext();
  try {
    const result = await api.request("DELETE /api/vehiculos/{id}", { params: { id }, query: { version } });
    if (!result.ok) {
      if (result.status === 401) redirect("/login?renovar=1");
      return rejected(result.status, result.error);
    }
    revalidatePath("/ciudadano/vehiculos");
    redirect("/ciudadano/vehiculos");
  } catch (error) {
    if (!(error instanceof RequestFailure)) throw error;
    return rejected(503, null);
  }
}

