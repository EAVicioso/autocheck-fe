BEGIN;
INSERT INTO autocheck."Center" ("Id", "Name", "Address", "Active")
VALUES ('10000000-0000-4000-8000-000000000001', 'Centro E2E', 'Santo Domingo', true);
INSERT INTO autocheck."Ramp" ("Id", "CenterId", "Name", "Active")
VALUES ('10000000-0000-4000-8000-000000000002', '10000000-0000-4000-8000-000000000001', 'Rampa E2E', true);
INSERT INTO autocheck."CenterSchedule" ("CenterId", "Day", "Opens", "Closes")
SELECT '10000000-0000-4000-8000-000000000001', day, 0, 1440 FROM generate_series(0, 6) AS day;

INSERT INTO autocheck."UserAccount" ("Id", "AuthId", "Email", "Name", "Phone", "Role", "Permissions", "CenterId", "Active", "Version", "SessionVersion", "PasswordResetPending")
VALUES
('11000000-0000-4000-8000-000000000001', '12000000-0000-4000-8000-000000000001', 'ciudadano1@example.test', 'Ciudadano E2E', '', 'Ciudadano', '{}', NULL, true, 1, 0, false),
('11000000-0000-4000-8000-000000000002', '12000000-0000-4000-8000-000000000002', 'inspector1@example.test', 'Inspector E2E', '', 'Inspector', '{}', '10000000-0000-4000-8000-000000000001', true, 1, 0, false),
('11000000-0000-4000-8000-000000000003', '12000000-0000-4000-8000-000000000003', 'admin1@example.test', 'Administrador E2E', '', 'Administrador', '{usuarios.gestionar,centros.gestionar,reglas.gestionar,auditoria.consultar}', NULL, true, 1, 0, false);
COMMIT;
