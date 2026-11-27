"use client";

import { useState } from "react";
import { Checkbox, Input, LabeledControl, RadioGroup } from "@/components/ui/controls";
import { useHydrated } from "@/core/use-hydrated";
import type { Permiso, Rol } from "@/shared/api/contract.generated";
import { permissionLabels, roles } from "./validation";

type AccessFields = {
  initialRole: Rol;
  initialPermissions: Permiso[];
  active: boolean;
  center: string;
  scoped: boolean;
};

export function UserAccessFields({ initialRole, initialPermissions, active, center, scoped }: AccessFields) {
  const [role, setRole] = useState(initialRole);
  const [permissions, setPermissions] = useState(initialPermissions);
  const ready = useHydrated();
  return <>
    <RadioGroup legend="Rol" name="rol" value={role} disabled={!ready} onChange={(value) => setRole(value as Rol)}
      options={roles.map((option) => ({ value: option, label: option, disabled: scoped && option === "Administrador" }))} />
    <LabeledControl label="ID del centro"><Input name="centroId" maxLength={36} readOnly={scoped} defaultValue={center} /></LabeledControl>
    {!scoped && <fieldset disabled={role !== "Administrador"}>
      <legend className="font-semibold">Permisos de administrador</legend>
      {(Object.keys(permissionLabels) as Permiso[]).map((permission) => <Checkbox key={permission} name="permisos"
        value={permission} checked={role === "Administrador" && permissions.includes(permission)} label={permissionLabels[permission]}
        onChange={(event) => {
          const checked = event.currentTarget.checked;
          setPermissions((current) => checked ? [...current, permission] : current.filter((value) => value !== permission));
        }} />)}
    </fieldset>}
    <Checkbox name="activo" defaultChecked={active} label="Cuenta activa" />
  </>;
}
