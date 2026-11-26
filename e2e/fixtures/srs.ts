export const actors = {
  citizen: { correo: "ciudadano1@example.test", contrasena: "Abc12345" },
  inspector: { correo: "inspector1@example.test", contrasena: "Abc12345" },
  admin: { correo: "admin1@example.test", contrasena: "Abc12345" },
};
export const ids = {
  center: "10000000-0000-4000-8000-000000000001",
  ramp: "10000000-0000-4000-8000-000000000002",
  inspector: "11000000-0000-4000-8000-000000000002",
  model: "20000000-0000-0000-0000-000000000002",
  color: "20000000-0000-0000-0000-000000000003",
};
export const limits = {
  retentionSeconds: [299, 300, 301],
  inactivitySeconds: [3599, 3600],
  loginLockSeconds: [899, 900],
  defects: [
    { l: 3, md: 1, g: 0, m: 3, verdict: "Aprobado" },
    { l: 4, md: 0, g: 0, m: 3, verdict: "Rechazado" },
    { l: 4, md: 0, g: 0, m: 4, verdict: "Aprobado" },
    { l: 0, md: 2, g: 0, m: 4, verdict: "Rechazado" },
    { l: 0, md: 0, g: 1, m: 4, verdict: "Rechazado" },
  ],
  approvals: [19, 20, 21],
} as const;
