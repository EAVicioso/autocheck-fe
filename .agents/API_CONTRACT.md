# AutoCheck API · contrato para `autocheck-fe`

SRS 1.1 · extracción estática del workspace · 23/11/2026. Base local `http://localhost:5004` o `https://localhost:7062` con perfil HTTPS; producción `https://<host-configurado>`. Rutas de negocio bajo `/api` sin versión en URL. `v1` identifica el documento OpenAPI.

- **Wire** JSON UTF-8 camelCase; nombres de entrada no distinguen mayúsculas. UUID como cadenas y estados como literales sensibles a mayúsculas. Las propiedades nulas de salida viajan como `null`. Instantes ISO 8601 en UTC, admitir `Z` y `+00:00`; días `YYYY-MM-DD` y horarios locales en `America/Santo_Domingo`. Longitudes de cadenas en UTF-16. Cuerpo JSON usa `Content-Type: application/json`; límite Kestrel 128 KiB. `204` sin cuerpo. Los cuerpos de las cinco rutas públicas de identidad y el alta de vehículo rechazan campos adicionales. Las rutas con `{id}`/`{rampaId}` restringen formato UUID.
- **HTTP** CORS por `AllowedOrigins` (por defecto `http://localhost:3000`), cualquier método/header, sin credenciales CORS ni headers de respuesta expuestos explícitamente. `Location`, `Retry-After` y `Content-Disposition` pueden no ser legibles desde JS de otro origen. `/api` agrega `Cache-Control: no-store` y `Pragma: no-cache`.
- **Bearer** `Authorization: Bearer <accessToken>` de una sesión registrada en login del backend. JWT Supabase `iss=<Supabase URL>/auth/v1`, `aud=authenticated`, rol de transporte `authenticated`, firma ES256/JWKS HTTPS, lifetime y tolerancia 15 s, `sub`/`session_id` UUID sin sesión anónima. Rol funcional, permisos y centro se leen en servidor. `SesionActiva` exige actor registrado. `GestionUsuarios` exige Administrador + `usuarios.gestionar`. `AuditoriaGlobal` exige Administrador + `auditoria.consultar` y centro null. Sesión expira con ≥60 min de inactividad, revocación, usuario inactivo/archivado o transición de recuperación. GET, polling y refresh no marcan actividad. Acciones interactivas marcadas y exitosas, y `/api/auth/actividad`, sí.
- **Cuotas HTTP** global de 120 mutaciones/min por `sub` autenticado (POST/PUT/PATCH/DELETE), `auth` 30/min por IP y `public` 60/min por IP. Sin cola. 429 de rate limiting incluye `Retry-After` en segundos (mín. 1, 60 si se desconoce). `CUENTA_BLOQUEADA` es 429 de negocio independiente.
- **Idempotencia** `IK` obligatoria donde se indica, 1–128 caracteres no blancos. Clave delimitada por actor, método y ruta concreta; fingerprint SHA-256 del cuerpo tipado serializado, o ID para solicitud de certificado. Repetición válida conserva estado, cuerpo y `Location`. Misma clave con otro fingerprint devuelve 409 `IDEMPOTENCIA_CONFLICTO`. Ante resultado incierto reutilizar la clave con los mismos datos. Consultar GET para estado vigente.
- **Errores** `application/problem+json` con `Problem`, salvo asistencia. 400 `SOLICITUD_INVALIDA` en validación explícita y binding capturado. `errors` usa rutas de propiedad (pueden venir en PascalCase, p. ej. `Defectos[0].Descripcion`). Challenge JWT (401, puede incluir `WWW-Authenticate`), forbid (403), 404 de routing, 429 del limitador y otros estados sin cuerpo se completan con `SOLICITUD_RECHAZADA`. 401 de sesión `SESION_INVALIDA`/`SESION_EXPIRADA`; 403 explícito `ACCESO_DENEGADO`; 404 explícito `RECURSO_NO_ENCONTRADO`. 409 códigos por slice más `VERSION_DESACTUALIZADA` en concurrencia y `REGISTRO_DUPLICADO` en unicidad. 500 `ERROR_INTERNO`, 503 `SERVICIO_NO_DISPONIBLE` para fallos de dependencia manejados. Las fichas enumeran errores de negocio adicionales o especialmente relevantes. Kestrel/proxy pueden devolver rechazos de transporte, tamaño o media type antes del handler.
- **Paginación** `pagina` 1–500000 (1), `tamano` 1–20 (20). Cursor opaco máx. 1024; conservar filtros/orden/dirección y omitir pagina o usar 1. Cursor inválido/incompatible da 400 `CURSOR_INVALIDO`. `pagina:null` al usar cursor; `siguienteCursor:null` indica fin en listas con cursor. Las listas `Items<T>` carecen de cursor y totales. En rangos inclusivos locales de inicio se rechaza `desde > hasta` o `hasta=9999-12-31`.

## Tipos TypeScript

```typescript
type UUID = string
type Utc = string // ISO 8601 de instante
type DiaRD = string // YYYY-MM-DD
type Int = number // entero
type Version = Int // >0; wire Int64, preservar precisión
type Email = string // requerido, EmailAddress, max. 254
type Password = string // 8–256, al menos una letra y un número Unicode
type Hash256 = string // 64 hex minúsculas
type Id = { id: UUID }
type IK = { "Idempotency-Key": string }
type Json = null | boolean | number | string | Json[] | { [key: string]: Json }
type Problem = { type?: string; title?: string; status: number; detail?: string; instance?: string; codigo: string; traceId: string; errors?: Record<string, string[]> }
type Pag = { pagina?: Int; tamano?: Int }
type Offset<O extends string> = Pag & { orden?: O; direccion?: "asc" | "desc" }
type Seek<O extends string> = Offset<O> & { cursor?: string }
type Items<T> = { items: T[] }
type Page<T> = Items<T> & { pagina: Int | null; siguienteCursor: string | null }
type OffsetPage<T> = Items<T> & { pagina: Int; siguienteCursor: null }

type Rol = "Ciudadano" | "Inspector" | "Administrador"
type Permiso = "usuarios.gestionar" | "centros.gestionar" | "reglas.gestionar" | "auditoria.consultar"
type Session = { accessToken: string; refreshToken: string; expiraUtc: Utc }
type Usuario = { id: UUID; correo: string; nombre: string; celular: string; rol: Rol; permisos: Permiso[]; centroId: UUID | null; activo: boolean; version: Version; archivadoUtc: Utc | null }
type Acceso = Omit<Usuario, "id" | "correo" | "nombre" | "celular"> & { usuarioId: UUID }
type VehiculoInput = { matricula: string /* 1–20, ^[A-Za-z0-9-]+$ */; vin: string /* 17, ^[A-HJ-NPR-Za-hj-npr-z0-9]+$ */; anio: Int /* 1900–2100 */; modeloId: UUID /* no vacío */; colorId: UUID /* no vacío */; version?: Version | null }
type Vehiculo = Omit<VehiculoInput, "version"> & { id: UUID; version: Version; archivadoUtc: Utc | null }
type CatalogoTipo = "marcas" | "modelos" | "colores" | "categorias" | "defectos-categorias-v1" | "defectos-subcategorias-v1"
type CatalogoItem = { id: UUID; nombre: string; padreId: UUID | null }

type CentroInput = { nombre: string /* 1–120 */; direccion: string /* 1–300 */; activo?: boolean /* true */ }
type Centro = Required<CentroInput> & { id: UUID }
type RampaInput = { nombre: string /* 1–80 */; activa?: boolean /* true */ }
type Rampa = Required<RampaInput> & { id: UUID; centroId: UUID }
type Horario = { dia: Int /* domingo 0–sábado 6 */; aperturaMinutos: Int /* 0–1410, múltiplo de 30 */; cierreMinutos: Int /* 30–1440, múltiplo de 30, > apertura */ }
type EstadoBloque = "LIBRE" | "RETENIDO" | "CONFIRMADO"
type Bloque = { rampaId: UUID; inicioUtc: Utc; estado: EstadoBloque; expiraUtc: Utc | null }
type EstadoCita = "CONFIRMADA" | "CANCELADA" | "EN_INSPECCION" | "COMPLETADA"
type Cita = { id: UUID; vehiculoId: UUID; centroId: UUID; rampaId: UUID; inspectorId: UUID | null; inicioUtc: Utc; estado: EstadoCita; inspeccionAnteriorId: UUID | null }
type Escenario = "APROBADO" | "RECHAZADO" | "ERROR"
type EstadoPago = Escenario | "PENDIENTE" | "VENCIDO" | "ABANDONADO" | "REVERTIDO"
type Pago = { intentoId: UUID; retencionId: UUID; estado: EstadoPago; expiraUtc: Utc; citaId: UUID | null; reversionId: UUID | null; monto: number; moneda: string; siguienteAccion: "SELECCIONAR_OTRO_HORARIO" | null }

type EstadoInspeccion = "ABIERTA" | "CERRADA"
type Veredicto = "Aprobado" | "Rechazado"
type Severidad = "Leve" | "Mediano" | "Grave"
type DefectoInput = { descripcion: string /* 1–300 */; severidad: Severidad; cantidad?: Int /* 1–100, 1 */; categoria: string; subcategoria: string } // códigos nombre del catálogo V1, par válido
type Defecto = Omit<DefectoInput, "cantidad" | "categoria" | "subcategoria"> & { cantidad: Int; categoria: string | null; subcategoria: string | null }
type Conteos = { m: Int; l: Int; md: Int; g: Int }
type Inspeccion = Conteos & { id: UUID; vehiculoId: UUID; centroId: UUID; rampaId: UUID; inspectorId: UUID; inspeccionAnteriorId: UUID | null; inicioUtc: Utc; cierreUtc: Utc | null; estado: EstadoInspeccion; resultado: Veredicto | null; versionReglas: string; version: Int; defectos: Defecto[] | null }
type Historial = Conteos & { id: UUID; cierreUtc: Utc | null; resultado: Veredicto | null; versionReglas: string; centroId: UUID; inspeccionAnteriorId: UUID | null }
type Regla = { id: UUID; version: string; m: Int; vigenciaUtc: Utc }
type EstadoCertificado = "PENDIENTE" | "EMITIDO"
type Certificado = { id: UUID; estado: EstadoCertificado; emisionUtc: Utc; hashManifiesto: Hash256; hashPdf: Hash256 | null }

type FiltrosReporte = Pag & { desde?: DiaRD; hasta?: DiaRD; centroId?: UUID; rampaId?: UUID; inspectorId?: UUID } // desde: hoy local; hasta: desde; diferencia 0–366 días
type Totales = { cerradas: Int; aprobadas: Int; rechazadas: Int; porcentajeRechazo: number | null }
type FilaMetrica = Totales & { dia: DiaRD; centroId: UUID; rampaId: UUID; inspectorId: UUID }
type Metricas = Totales & { estado: "Sin datos" | "Con datos"; ultimaActualizacionUtc: Utc | null; items: FilaMetrica[] }
type Alerta = { id: UUID; inspectorId: UUID; centroId: UUID; inspecciones: UUID[] /* 21 */; desdeUtc: Utc; hastaUtc: Utc; aprobadas: 20 | 21; total: 21; porcentaje: number; fecha: DiaRD }
type Auditoria = { id: UUID; actorId: UUID | null; fechaUtc: Utc; operacion: string; entidad: string; resultado: string; correlacion: string; ip: string | null; anterior: Json; nuevo: Json }
type CategoriaAsistencia = "USO_PLATAFORMA" | "ITV" | "FUERA_DE_ALCANCE" | "NO_DETERMINADA"
type CodigoAsistencia = "OK" | "INFORMACION_INSUFICIENTE" | "FUERA_DE_ALCANCE" | "SOLICITUD_INVALIDA" | "SERVICIO_NO_DISPONIBLE"
type Asistencia = { respuesta: string; categoria: CategoriaAsistencia; codigo: CodigoAsistencia }
```

## Salud, documentación e identidad

#### `[GET] /health` — HealthCheck

- **Auth** `Public`
- **Response** `200` `{ status: "Healthy"; timestamp: Utc }`
- **Errores Específicos** Aplica el contrato transversal.
- **Efectos / Reglas Críticas** Liveness sin consulta de dependencias.

#### `[GET] /health/ready` — Readiness

- **Auth** `Public`
- **Response** `200` `{ status: "Ready" }`
- **Errores Específicos** 503 SOLICITUD_RECHAZADA
- **Efectos / Reglas Críticas** Comprueba conectividad PostgreSQL y ausencia de cambios de esquema pendientes, con presupuesto de 5 s.

#### `[GET] /openapi/{documentName}.json` — OpenAPI

- **Auth** `Public`
- **Headers / Query / Route** Ruta `{ documentName: string }` (documento `v1`)
- **Response** `200` `documento OpenAPI JSON`
- **Errores Específicos** 404 SOLICITUD_RECHAZADA
- **Efectos / Reglas Críticas** Habilitado en Development, Testing o con `OpenApi:Enabled=true`.

#### `[GET] /scalar` — Scalar

- **Auth** `Public`
- **Response** `200` `HTML`
- **Errores Específicos** Aplica el contrato transversal.
- **Efectos / Reglas Críticas** Visor bajo `/scalar`, con la misma habilitación que OpenAPI. La biblioteca monta los recursos del visor bajo ese prefijo.

#### `[POST] /api/auth/registro` — RegistrarCiudadano · CU-01 / PA-01 / RS-09

- **Auth** `Public [auth]`
- **Request Body** `{ correo: Email; contrasena: Password; nombre: string /* 1–120 */ }`
- **Response** `201` `{ usuarioId: UUID; estado: "PENDIENTE_CONFIRMACION"|"ACTIVA" }`
- **Errores Específicos** 409 CORREO_EXISTENTE
- **Efectos / Reglas Críticas** Alta como Ciudadano mediante Supabase Auth. `Location: /api/usuarios/me`. Si corresponde, confirmar mediante el correo de Supabase antes del login.

#### `[POST] /api/auth/login` — IniciarSesion · CU-02 / PA-02 / RS-11

- **Auth** `Public [auth]`
- **Request Body** `{ correo: Email; contrasena: string /* 1–256 */ }`
- **Response** `200` `Session`
- **Errores Específicos** 401 CREDENCIALES_INVALIDAS / SESION_EXPIRADA; 403 ACCESO_DENEGADO; 429 CUENTA_BLOQUEADA
- **Efectos / Reglas Críticas** Normaliza el correo. Registra la sesión de Supabase en AutoCheck. El quinto fallo fija el bloqueo de 15 minutos y todavía responde 401; las solicitudes durante el bloqueo obtienen 429.

#### `[POST] /api/auth/refresh` — RenovarSesion · CU-02 / RS-10

- **Auth** `Public [auth]`
- **Request Body** `{ refreshToken: string /* 1–4096 */ }`
- **Response** `200` `Session`
- **Errores Específicos** 401 SESION_INVALIDA / SESION_EXPIRADA
- **Efectos / Reglas Críticas** Canjea el refresh token y exige sesión activa registrada. Mantiene el reloj de inactividad.

#### `[POST] /api/auth/recuperacion` — SolicitarRecuperacion · IS-04 / RS-11

- **Auth** `Public [auth]`
- **Request Body** `{ correo: Email }`
- **Response** `202` `{ mensaje: string }`
- **Errores Específicos** Aplica el contrato transversal.
- **Efectos / Reglas Críticas** Respuesta genérica «Si la cuenta existe, recibirás instrucciones de recuperación.».

#### `[POST] /api/auth/restablecimiento` — RestablecerContrasena · RS-09 / RS-11

- **Auth** `Public [auth]`
- **Request Body** `{ token: string /* 1–8192, TokenHash del correo */; nuevaContrasena: Password }`
- **Response** `204` `sin cuerpo`
- **Errores Específicos** 401 RECUPERACION_INVALIDA; 409 RECUPERACION_PENDIENTE; 503 SERVICIO_NO_DISPONIBLE
- **Efectos / Reglas Críticas** Canje de recuperación con Supabase, barrera temporal a login/refresh/sesiones y revocación local en éxito o resultado incierto. La recuperación conserva el bloqueo de login.

#### `[POST] /api/auth/logout` — CerrarSesion · CU-02 / RS-10

- **Auth** `Bearer [auth; sesión registrada]`
- **Response** `204` `sin cuerpo`
- **Errores Específicos** 401 SESION_INVALIDA; 503 SERVICIO_NO_DISPONIBLE
- **Efectos / Reglas Críticas** Acepta sesión local ya revocada o inactiva con JWT aún válido. Revoca localmente e intenta cerrar sesión en Supabase.

#### `[POST] /api/auth/actividad` — RegistrarActividad · RS-10 / PA-02

- **Auth** `Bearer [auth; SesionActiva]`
- **Response** `204` `sin cuerpo`
- **Errores Específicos** 401 SESION_EXPIRADA
- **Efectos / Reglas Críticas** Registra actividad explícita; invocar solo por interacción real.


## Usuarios y permisos

#### `[GET] /api/usuarios/me` — ObtenerPerfil · CU-11 / PA-11

- **Auth** `Bearer [SesionActiva]`
- **Response** `200` `Usuario`
- **Errores Específicos** 404 RECURSO_NO_ENCONTRADO
- **Efectos / Reglas Críticas** Perfil propio y autoridad funcional actual.

#### `[PATCH] /api/usuarios/me` — ActualizarPerfil · SRS §6.2.1.1

- **Auth** `Bearer [SesionActiva]`
- **Request Body** `{ nombre: string /* 1–120 */; celular: string /* 0–30, no null */; version?: Version | null }`
- **Response** `200` `Usuario`
- **Errores Específicos** 404 RECURSO_NO_ENCONTRADO; 409 VERSION_DESACTUALIZADA / RECURSO_ARCHIVADO
- **Efectos / Reglas Críticas** Solo perfil propio. Si se omite versión se usa la vigente en la transacción.

#### `[GET] /api/usuarios` — ListarUsuarios · CU-11 / PA-11

- **Auth** `Bearer [GestionUsuarios]`
- **Headers / Query / Route** Query `Offset<"id"|"nombre"> & { rol?: Rol; activo?: boolean; incluirArchivados?: boolean; nombre?: string /* ≤120 */ }`
- **Response** `200` `OffsetPage<Usuario>`
- **Errores Específicos** Aplica el contrato transversal.
- **Efectos / Reglas Críticas** Administrador local limitado a su centro. Archivados excluidos por defecto. Orden `id asc`.

#### `[GET] /api/usuarios/{id}` — ObtenerUsuario · CU-11 / PA-11

- **Auth** `Bearer [GestionUsuarios]`
- **Headers / Query / Route** Ruta `Id`
- **Response** `200` `Usuario`
- **Errores Específicos** 404 RECURSO_NO_ENCONTRADO
- **Efectos / Reglas Críticas** Detalle dentro del alcance; excluye archivados.

#### `[DELETE] /api/usuarios/{id}` — ArchivarUsuario · DEC-LIFECYCLE-01 / RS-03

- **Auth** `Bearer [GestionUsuarios]`
- **Headers / Query / Route** Ruta `Id`; query `{ version: Version }`
- **Response** `204` `sin cuerpo`
- **Errores Específicos** 404 RECURSO_NO_ENCONTRADO; 409 CAMBIO_PROPIO_NO_PERMITIDO / ULTIMO_ADMINISTRADOR / OPERACIONES_PENDIENTES / VERSION_DESACTUALIZADA
- **Efectos / Reglas Críticas** Archivado lógico y revocación de sesiones. Repetición autorizada sobre un archivado devuelve 204 con query enlazable. Conserva el último administrador global activo con gestión de usuarios.

#### `[GET] /api/usuarios/{id}/acceso` — ObtenerAcceso · CU-11 / PA-11

- **Auth** `Bearer [GestionUsuarios]`
- **Headers / Query / Route** Ruta `Id`
- **Response** `200` `Acceso`
- **Errores Específicos** 404 RECURSO_NO_ENCONTRADO
- **Efectos / Reglas Críticas** Lectura dentro del alcance; excluye archivados.

#### `[PATCH] /api/usuarios/{id}/acceso` — CambiarAcceso · CU-11 / PA-11

- **Auth** `Bearer [GestionUsuarios]`
- **Headers / Query / Route** Ruta `Id`
- **Request Body** `{ rol: Rol; permisos: Permiso[] /* obligatorio, [] válido */; centroId?: UUID | null; activo: boolean; version?: Version | null }`
- **Response** `200` `Usuario`
- **Errores Específicos** 404 RECURSO_NO_ENCONTRADO; 409 CAMBIO_PROPIO_NO_PERMITIDO / ULTIMO_ADMINISTRADOR / ASIGNACIONES_PENDIENTES / VERSION_DESACTUALIZADA / RECURSO_ARCHIVADO
- **Efectos / Reglas Críticas** Inspector exige centro válido; permisos solo para Administrador. Admin local limita usuario y centro destino al propio, sin asignar Administrador ni permisos. No permite cambios propios ni dejar asignaciones pendientes. Devuelve perfil actualizado, con `id` en lugar de `usuarioId`.

#### `[GET] /api/roles` — ListarRoles · CU-11 / PA-11

- **Auth** `Bearer [GestionUsuarios]`
- **Response** `200` `Items<{ codigo: Rol }>`
- **Errores Específicos** Aplica el contrato transversal.
- **Efectos / Reglas Críticas** Catálogo fijo.

#### `[GET] /api/permisos` — ListarPermisos · CU-11 / PA-11

- **Auth** `Bearer [GestionUsuarios]`
- **Response** `200` `Items<{ codigo: Permiso }>`
- **Errores Específicos** Aplica el contrato transversal.
- **Efectos / Reglas Críticas** Catálogo fijo.


## Vehículos y catálogos

#### `[GET] /api/vehiculos` — ListarVehiculos · IU-01 / PA-10

- **Auth** `Bearer [sesión registrada; propios]`
- **Headers / Query / Route** Query `Offset<"id"|"matricula"> & { matricula?: string /* ≤20 */; incluirArchivados?: boolean }`
- **Response** `200` `OffsetPage<Vehiculo>`
- **Errores Específicos** Aplica el contrato transversal.
- **Efectos / Reglas Críticas** Orden `id asc` y archivados excluidos por defecto.

#### `[POST] /api/vehiculos` — RegistrarVehiculo · IU-01

- **Auth** `Bearer [Ciudadano]`
- **Request Body** `VehiculoInput`
- **Response** `201` `Vehiculo`
- **Errores Específicos** 400 SOLICITUD_INVALIDA (modelo/color inválido); 409 REGISTRO_DUPLICADO
- **Efectos / Reglas Críticas** Alta para el titular. Normaliza matrícula y VIN a mayúsculas. `version` es aceptada como entero Int64 opcional y se ignora. `Location: /api/vehiculos/{id}`. Rechaza propiedades adicionales.

#### `[GET] /api/vehiculos/{id}` — ObtenerVehiculo · CU-10 / PA-10

- **Auth** `Bearer [SesionActiva; propietario, inspector asignado a cita del vehículo en su centro o admin con cita del vehículo en su alcance]`
- **Headers / Query / Route** Ruta `Id`
- **Response** `200` `Vehiculo`
- **Errores Específicos** 403 ACCESO_DENEGADO; 404 RECURSO_NO_ENCONTRADO
- **Efectos / Reglas Críticas** Excluye archivados.

#### `[PATCH] /api/vehiculos/{id}` — ActualizarVehiculo · IU-01 / PA-05d

- **Auth** `Bearer [SesionActiva; propietario activo]`
- **Headers / Query / Route** Ruta `Id`
- **Request Body** `VehiculoInput`
- **Response** `200` `Vehiculo`
- **Errores Específicos** 404 RECURSO_NO_ENCONTRADO; 409 VERSION_DESACTUALIZADA / RECURSO_ARCHIVADO / REGISTRO_DUPLICADO
- **Efectos / Reglas Críticas** Sustituye campos. Normaliza matrícula y VIN a mayúsculas, valida modelo/color y conserva snapshots históricos. Si se omite versión usa la actual.

#### `[DELETE] /api/vehiculos/{id}` — ArchivarVehiculo · DEC-LIFECYCLE-01 / RS-03

- **Auth** `Bearer [Ciudadano propietario]`
- **Headers / Query / Route** Ruta `Id`; query `{ version: Version }`
- **Response** `204` `sin cuerpo`
- **Errores Específicos** 404 RECURSO_NO_ENCONTRADO; 409 VERSION_DESACTUALIZADA / OPERACIONES_PENDIENTES
- **Efectos / Reglas Críticas** Archivado lógico. Repetición autorizada sobre un archivado devuelve 204 con query enlazable.

#### `[GET] /api/catalogos/{tipo}` — ConsultarCatalogo · IU-01

- **Auth** `Bearer [SesionActiva]`
- **Headers / Query / Route** Ruta `{ tipo: CatalogoTipo }`; query `Offset<"nombre"> & { padreId?: UUID }`
- **Response** `200` `OffsetPage<CatalogoItem>`
- **Errores Específicos** 404 RECURSO_NO_ENCONTRADO (tipo fuera del catálogo)
- **Efectos / Reglas Críticas** Orden `nombre asc`.


## Centros, rampas y citas

#### `[GET] /api/centros` — ListarCentros · CU-12 / RAE-01

- **Auth** `Bearer [sesión registrada]`
- **Headers / Query / Route** Query `Pag`
- **Response** `200` `Items<Centro>`
- **Errores Específicos** Aplica el contrato transversal.
- **Efectos / Reglas Críticas** Centros activos, orden por ID.

#### `[POST] /api/centros` — CrearCentro · CU-12 / PA-12c

- **Auth** `Bearer [Administrador global + centros.gestionar]`
- **Request Body** `CentroInput`
- **Response** `201` `Centro`
- **Errores Específicos** Aplica el contrato transversal.
- **Efectos / Reglas Críticas** `Location: /api/centros/{id}`.

#### `[GET] /api/centros/{id}` — ObtenerCentro · CU-12

- **Auth** `Bearer [sesión registrada]`
- **Headers / Query / Route** Ruta `Id`
- **Response** `200` `{ centro: Centro; rampas: Rampa[]; horarios: Horario[] }`
- **Errores Específicos** 404 RECURSO_NO_ENCONTRADO
- **Efectos / Reglas Críticas** Incluye centro/rampas inactivos y horarios ordenados por día.

#### `[PATCH] /api/centros/{id}` — ActualizarCentro · PA-12b,c

- **Auth** `Bearer [Administrador + centros.gestionar; centro en alcance]`
- **Headers / Query / Route** Ruta `Id`
- **Request Body** `CentroInput`
- **Response** `200` `Centro`
- **Errores Específicos** 404 RECURSO_NO_ENCONTRADO; 409 CENTRO_CON_COMPROMISOS
- **Efectos / Reglas Críticas** Desactivación sujeta a citas y retenciones vigentes.

#### `[POST] /api/centros/{id}/rampas` — CrearRampa · CU-12 / PA-12a

- **Auth** `Bearer [Administrador + centros.gestionar; centro en alcance]`
- **Headers / Query / Route** Ruta `Id`
- **Request Body** `RampaInput`
- **Response** `201` `Rampa`
- **Errores Específicos** 404 RECURSO_NO_ENCONTRADO
- **Efectos / Reglas Críticas** `Location: /api/centros/{id}`. Invalida disponibilidad.

#### `[PATCH] /api/centros/{id}/rampas/{rampaId}` — ActualizarRampa · PA-12b,c

- **Auth** `Bearer [Administrador + centros.gestionar; centro en alcance]`
- **Headers / Query / Route** Ruta `Id & { rampaId: UUID }`
- **Request Body** `RampaInput`
- **Response** `200` `Rampa`
- **Errores Específicos** 404 RECURSO_NO_ENCONTRADO; 409 RAMPA_CON_COMPROMISOS
- **Efectos / Reglas Críticas** Desactivación sujeta a compromisos de la rampa. Invalida disponibilidad.

#### `[PUT] /api/centros/{id}/horarios` — ConfigurarHorarios · RAE-01 / PA-12b,c

- **Auth** `Bearer [Administrador + centros.gestionar; centro en alcance]`
- **Headers / Query / Route** Ruta `Id`
- **Request Body** `{ horarios: Horario[] /* 0–7, sin null ni días repetidos */ }`
- **Response** `200` `{ horarios: Horario[] }`
- **Errores Específicos** 404 RECURSO_NO_ENCONTRADO; 409 HORARIO_CON_COMPROMISOS
- **Efectos / Reglas Críticas** Reemplazo completo; eco del cuerpo. Cambios sujetos a compromisos; igualdad por día permite no-op. Invalida si cambia.

#### `[GET] /api/centros/{id}/disponibilidad` — ConsultarDisponibilidad · RF-CIT-01/03 / PA-12a

- **Auth** `Bearer [sesión registrada]`
- **Headers / Query / Route** Ruta `Id`; query `{ fecha: DiaRD }`
- **Response** `200` `{ bloques: Bloque[]; zonaHoraria: string }`
- **Errores Específicos** 400 SOLICITUD_INVALIDA (fecha máxima); 404 RECURSO_NO_ENCONTRADO
- **Efectos / Reglas Críticas** Centro y rampas activos. Bloques futuros de 30 min del día local; sin horario devuelve lista vacía. Retención vencida aparece LIBRE aunque falte limpieza física.

#### `[GET] /api/citas` — ListarCitas · CU-03

- **Auth** `Bearer [propietario, Inspector asignado en su centro o Administrador en alcance]`
- **Headers / Query / Route** Query `Pag & { desde?: DiaRD; hasta?: DiaRD; estado?: EstadoCita }`
- **Response** `200` `Items<Cita>`
- **Errores Específicos** Aplica el contrato transversal.
- **Efectos / Reglas Críticas** Rango inclusivo por inicio local. Inicio desc, ID asc.

#### `[GET] /api/citas/{id}` — ObtenerCita · CU-03

- **Auth** `Bearer [propietario, Inspector asignado en su centro o Administrador en alcance]`
- **Headers / Query / Route** Ruta `Id`
- **Response** `200` `Cita`
- **Errores Específicos** 403 ACCESO_DENEGADO; 404 RECURSO_NO_ENCONTRADO
- **Efectos / Reglas Críticas** Consulta del estado vigente.

#### `[DELETE] /api/citas/retenciones/{id}` — AbandonarRetencion · RF-CIT-02 / CU-03

- **Auth** `Bearer [titular del intento]`
- **Headers / Query / Route** Ruta `Id` (ID de retención igual al de intento)
- **Response** `204` `sin cuerpo`
- **Errores Específicos** 404 RECURSO_NO_ENCONTRADO; 409 CITA_CONFIRMADA
- **Efectos / Reglas Críticas** Libera el bloque si aún pertenece al intento. PENDIENTE pasa a ABANDONADO; cita aprobada requiere cancelación.

#### `[POST] /api/citas/{id}/cancelacion` — CancelarCita · RF-CIT-02 / PA-03e / PA-04d

- **Auth** `Bearer [titular de la cita]`
- **Headers / Query / Route** Ruta `Id`; header `IK`
- **Request Body** `{ motivo: string /* 1–300 */ }`
- **Response** `200` `{ citaId: UUID; estado: "CANCELADA"; reversionId: UUID | null }`
- **Errores Específicos** 404 RECURSO_NO_ENCONTRADO; 409 CITA_NO_CANCELABLE / IDEMPOTENCIA_CONFLICTO
- **Efectos / Reglas Críticas** Solo confirmada y antes de inicio, sin inspección; ya cancelada devuelve estado y reversión existentes. Libera bloque, revierte pago e inicia notificación e invalidación.

#### `[PUT] /api/citas/{id}/inspector` — AsignarInspector · CU-05

- **Auth** `Bearer [Administrador + centros.gestionar; centro en alcance]`
- **Headers / Query / Route** Ruta `Id`
- **Request Body** `{ inspectorId: UUID /* no vacío */ }`
- **Response** `200` `Cita`
- **Errores Específicos** 400 SOLICITUD_INVALIDA (inspector no disponible); 404 RECURSO_NO_ENCONTRADO; 409 CITA_INICIADA
- **Efectos / Reglas Críticas** Inspector activo del mismo centro; cita confirmada y sin inspección iniciada.


## Pagos sandbox

#### `[POST] /api/pagos/intentos` — IniciarPago · RF-CIT-01/03 / CU-04 / PA-03

- **Auth** `Bearer [Ciudadano propietario del vehículo]`
- **Headers / Query / Route** Header `IK`
- **Request Body** `{ vehiculoId: UUID; centroId: UUID; rampaId: UUID; inicioUtc: Utc; inspeccionAnteriorId?: UUID | null; escenario?: Escenario /* APROBADO */; demoraSegundos?: Int /* 0–600, 0 */ }`
- **Response** `201` `{ intentoId: UUID; retencionId: UUID; estado: "RETENIDO"; expiraUtc: Utc; monto: number; moneda: string }`
- **Errores Específicos** 400 SOLICITUD_INVALIDA (bloque fuera de horario, no futuro o no alineado; centro/rampa inactivos; rechazo previo inválido); 403 ACCESO_DENEGADO; 409 BLOQUE_NO_DISPONIBLE / IDEMPOTENCIA_CONFLICTO; 503 SERVICIO_NO_DISPONIBLE
- **Efectos / Reglas Críticas** IDs requeridos no vacíos. Reserva exclusiva de 300 s. Monto del servidor (1000 por defecto), moneda DOP; el worker ejecuta la simulación. `Location: /api/pagos/intentos/{intentoId}`.

#### `[GET] /api/pagos/intentos/{id}` — ConsultarPago · CU-04

- **Auth** `Bearer [titular del intento]`
- **Headers / Query / Route** Ruta `Id`
- **Response** `200` `Pago`
- **Errores Específicos** 403 ACCESO_DENEGADO; 404 RECURSO_NO_ENCONTRADO
- **Efectos / Reglas Críticas** Consultar mientras pendiente; APROBADO con citaId confirma que se creó la cita. El estado de la cita se consulta en su recurso.

#### `[POST] /api/pagos/webhook` — RecibirPagoSandbox · IS-03 / PA-04

- **Auth** `Public [auth; HMAC servicio-a-servicio]`
- **Headers / Query / Route** Header `{ "X-Sandbox-Signature": string /* 64 caracteres hex HMAC-SHA256 sobre bytes exactos */ }`
- **Request Body** `{ eventoId: string /* 1–128, no blanco */; intentoId: UUID; resultado: Escenario }`
- **Response** `200` `Pago`
- **Errores Específicos** 400 SOLICITUD_INVALIDA; 401 FIRMA_INVALIDA; 404 RECURSO_NO_ENCONTRADO; 409 EVENTO_CONFLICTO; 503 SERVICIO_NO_DISPONIBLE
- **Efectos / Reglas Críticas** Solo integración. Deduplicación por eventoId e intento/resultado; conserva la primera respuesta. Aprobación a los 300 s o después revierte sin desplazar otra reserva.


## Inspecciones, defectos, historial y reglas

#### `[GET] /api/inspecciones` — ListarInspecciones · CU-05 / CU-10

- **Auth** `Bearer [propietario, Inspector asignado en su centro o Administrador + auditoria.consultar en alcance]`
- **Headers / Query / Route** Query `Pag & { desde?: DiaRD; hasta?: DiaRD; estado?: EstadoInspeccion }`
- **Response** `200` `Items<Inspeccion>`
- **Errores Específicos** Aplica el contrato transversal.
- **Efectos / Reglas Críticas** Rango inclusivo por inicio local. Inicio desc, ID asc.

#### `[POST] /api/inspecciones` — IniciarInspeccion · RF-INS-01 / PA-05b

- **Auth** `Bearer [Inspector asignado en su centro]`
- **Headers / Query / Route** Header `IK`
- **Request Body** `{ citaId: UUID /* no vacío */ }`
- **Response** `201` `Inspeccion`
- **Errores Específicos** 404 RECURSO_NO_ENCONTRADO; 409 CITA_NO_CONFIRMADA / IDEMPOTENCIA_CONFLICTO; 503 SERVICIO_NO_DISPONIBLE
- **Efectos / Reglas Críticas** Cita confirmada y pago aprobado. Congela regla vigente, M y snapshots. `Location: /api/inspecciones/{id}`.

#### `[GET] /api/inspecciones/{id}` — ObtenerInspeccion · CU-05 / CU-10

- **Auth** `Bearer [propietario, Inspector asignado en su centro o Administrador + auditoria.consultar en alcance]`
- **Headers / Query / Route** Ruta `Id`
- **Response** `200` `Inspeccion`
- **Errores Específicos** 403 ACCESO_DENEGADO; 404 RECURSO_NO_ENCONTRADO
- **Efectos / Reglas Críticas** Detalle autorizado.

#### `[PUT] /api/inspecciones/{id}/registro` — RegistrarDefectos · RF-INS-01 / PA-05c,d

- **Auth** `Bearer [Inspector asignado en su centro]`
- **Headers / Query / Route** Ruta `Id`
- **Request Body** `{ versionEsperada: Int /* ≥0 */; defectos: DefectoInput[] /* 0–100; no null, ni ítems null */ }`
- **Response** `200` `Inspeccion`
- **Errores Específicos** 404 RECURSO_NO_ENCONTRADO; 409 INSPECCION_CERRADA / VERSION_DESACTUALIZADA
- **Efectos / Reglas Críticas** Reemplaza registro y avanza versión; lista vacía significa cero defectos y permite cierre.

#### `[POST] /api/inspecciones/{id}/cierre` — CerrarInspeccion · RF-INS-01 / PA-05

- **Auth** `Bearer [Inspector asignado en su centro]`
- **Headers / Query / Route** Ruta `Id`; header `IK`
- **Request Body** `{ versionEsperada: Int /* ≥0 */ }`
- **Response** `200` `Inspeccion`
- **Errores Específicos** 400 SOLICITUD_INVALIDA (registro ausente o defectos heredados incompletos); 404 RECURSO_NO_ENCONTRADO; 409 INSPECCION_CERRADA / VERSION_DESACTUALIZADA / IDEMPOTENCIA_CONFLICTO
- **Efectos / Reglas Críticas** Cierre indivisible e inmutable. Suma cantidades por severidad; rechaza si G ≥ 1 o Md ≥ 2 o L > M. Reserva certificado en aprobadas y completa la cita. La proyección MongoDB y la firma ocurren en segundo plano.

#### `[GET] /api/inspecciones/{id}/reinspecciones` — ConsultarReinspecciones · DF-05 / CU-10

- **Auth** `Bearer [propietario, Inspector asignado en su centro o Administrador + auditoria.consultar en alcance]`
- **Headers / Query / Route** Ruta `Id`; query `Pag`
- **Response** `200` `Items<Inspeccion>`
- **Errores Específicos** 403 ACCESO_DENEGADO; 404 RECURSO_NO_ENCONTRADO
- **Efectos / Reglas Críticas** Reinspecciones vinculadas directamente al ID anterior, filtradas por alcance; inicio asc, ID asc.

#### `[GET] /api/vehiculos/{id}/historial` — ConsultarHistorial · CU-10 / PA-10 / RS-08

- **Auth** `Bearer [SesionActiva; propietario, Inspector asignado en su centro o Administrador + auditoria.consultar en alcance]`
- **Headers / Query / Route** Ruta `Id`; query `Seek<"cierreUtc"> & { estado?: EstadoInspeccion; resultado?: Veredicto; desde?: DiaRD; hasta?: DiaRD }`
- **Response** `200` `Page<Historial>`
- **Errores Específicos** 400 CURSOR_INVALIDO / SOLICITUD_INVALIDA; 403 ACCESO_DENEGADO; 404 RECURSO_NO_ENCONTRADO
- **Efectos / Reglas Críticas** Incluye historial autorizado de vehículos archivados. Solo cierres, incluso si se envía ABIERTA (sin resultados). Rango por inicio local; orden cierreUtc desc por defecto con ID asc como desempate.

#### `[GET] /api/configuracion/reglas-inspeccion` — ConsultarReglas · RAE-02

- **Auth** `Bearer [sesión registrada]`
- **Headers / Query / Route** Query `Pag`
- **Response** `200` `Items<Regla>`
- **Errores Específicos** Aplica el contrato transversal.
- **Efectos / Reglas Críticas** Orden de vigencia descendente.

#### `[POST] /api/configuracion/reglas-inspeccion` — CrearVersionReglas · RAE-02 / PA-05b

- **Auth** `Bearer [Administrador global + reglas.gestionar]`
- **Request Body** `{ m: Int /* ≥0 */; vigenciaUtc: Utc }`
- **Response** `201` `Regla`
- **Errores Específicos** 400 SOLICITUD_INVALIDA (vigencia retroactiva); 409 REGISTRO_DUPLICADO
- **Efectos / Reglas Críticas** `Location: /api/configuracion/reglas-inspeccion`. Versión nueva; conserva versiones congeladas.


## Certificados PDF y QR

#### `[POST] /api/inspecciones/{id}/certificado` — SolicitarCertificado · CU-06 / PA-06

- **Auth** `Bearer [propietario de la inspección]`
- **Headers / Query / Route** Ruta `Id`; header `IK`
- **Response** `202` `Certificado` pendiente; `200` `Certificado` emitido
- **Errores Específicos** 403 ACCESO_DENEGADO; 404 RECURSO_NO_ENCONTRADO; 409 INSPECCION_NO_APROBADA / IDEMPOTENCIA_CONFLICTO
- **Efectos / Reglas Críticas** `Location: /api/certificados/{id}` en ambos resultados. Inspección cerrada y aprobada; reutiliza ID y encola o acelera emisión. Polling por GET, porque un replay puede seguir devolviendo el 202 original.

#### `[GET] /api/certificados` — ListarCertificados · CU-06 / PA-06

- **Auth** `Bearer [titular; propios]`
- **Headers / Query / Route** Query `Seek<"emisionUtc"> & { vehiculoId?: UUID; estado?: EstadoCertificado; desdeUtc?: Utc; hastaUtc?: Utc }`
- **Response** `200` `Page<Certificado>`
- **Errores Específicos** 400 CURSOR_INVALIDO / SOLICITUD_INVALIDA
- **Efectos / Reglas Críticas** Rango inclusivo. Orden `emisionUtc desc` por defecto, ID en la misma dirección.

#### `[GET] /api/certificados/{id}` — ObtenerCertificado · CU-06

- **Auth** `Bearer [SesionActiva; propietario]`
- **Headers / Query / Route** Ruta `Id`
- **Response** `200` `Certificado`
- **Errores Específicos** 403 ACCESO_DENEGADO; 404 RECURSO_NO_ENCONTRADO
- **Efectos / Reglas Críticas** Estado vigente y hashes; hashPdf null mientras no esté emitido.

#### `[GET] /api/certificados/{id}/pdf` — DescargarCertificado · CU-06 / PA-06/07

- **Auth** `Bearer [SesionActiva; propietario]`
- **Headers / Query / Route** Ruta `Id`
- **Response** `200` `binario application/pdf`
- **Errores Específicos** 403 ACCESO_DENEGADO; 404 RECURSO_NO_ENCONTRADO; 409 CERTIFICADO_PENDIENTE; 503 SERVICIO_NO_DISPONIBLE
- **Efectos / Reglas Críticas** Content-Disposition attachment, nombre AutoCheck-{id}.pdf; Cache-Control no-store efectivo; sin procesamiento de Range. Bytes finales firmados e inmutables.

#### `[GET] /api/certificados/{id}/verificacion` — VerificarCertificado · RF-CER-01 / CU-07 / PA-07

- **Auth** `Public [public]`
- **Headers / Query / Route** Ruta `Id`; query `{ hash?: string /* debe ser 64 hex minúsculas para éxito */ }`
- **Response** `200` `{ certificadoId: UUID; emisionUtc: Utc; centro: string; resultado: "Aprobado" }`
- **Errores Específicos** 404 CERTIFICADO_NO_ENCONTRADO; 409 INTEGRIDAD_NO_VALIDA; 429 SOLICITUD_RECHAZADA
- **Efectos / Reglas Críticas** Solo emitidos. Primero busca ID, luego compara hash recibido, almacenado y recalculado. Respuesta de cuatro campos públicos.


## Reportes, auditoría y asistencia

#### `[GET] /api/reportes/inspecciones` — ConsultarMetricas · RF-DAS-01/02 / PA-08

- **Auth** `Bearer [Administrador + auditoria.consultar; centro en alcance]`
- **Headers / Query / Route** Query `FiltrosReporte`
- **Response** `200` `Metricas`
- **Errores Específicos** 400 SOLICITUD_INVALIDA; 403 ACCESO_DENEGADO
- **Efectos / Reglas Críticas** Totales del filtro completo, filas paginadas por día, centro, rampa e inspector. Porcentaje 0–100. Actualización eventual con checkpoint.

#### `[GET] /api/reportes/alertas` — ConsultarAlertas · RF-DAS-03 / PA-08

- **Auth** `Bearer [Administrador + auditoria.consultar; centro en alcance]`
- **Headers / Query / Route** Query `FiltrosReporte`
- **Response** `200` `{ ultimaActualizacionUtc: Utc | null; items: Alerta[] }`
- **Errores Específicos** 400 SOLICITUD_INVALIDA; 403 ACCESO_DENEGADO
- **Efectos / Reglas Críticas** Ventanas de 21 cierres por inspector/centro; dispara con 20 o 21 aprobadas (>95%). El filtro rampa conserva la ventana completa. La fecha es el día local del último cierre.

#### `[GET] /api/auditorias` — ConsultarAuditorias · CU-13 / PA-13

- **Auth** `Bearer [AuditoriaGlobal]`
- **Headers / Query / Route** Query `Seek<"fechaUtc"> & { desdeUtc?: Utc; hastaUtc?: Utc; operacion?: string /* ≤128 */; entidad?: string /* ≤256 */; actorId?: UUID }`
- **Response** `200` `Page<Auditoria>`
- **Errores Específicos** 400 CURSOR_INVALIDO / SOLICITUD_INVALIDA
- **Efectos / Reglas Críticas** Rango inclusivo; orden `fechaUtc desc` por defecto, ID en la misma dirección. Filtros operacion/entidad exactos. Snapshots sanitizados; tratar como datos sensibles.

#### `[GET] /api/auditorias/{id}` — ObtenerAuditoria · CU-13 / PA-13

- **Auth** `Bearer [AuditoriaGlobal]`
- **Headers / Query / Route** Ruta `Id`
- **Response** `200` `Auditoria`
- **Errores Específicos** 404 RECURSO_NO_ENCONTRADO
- **Efectos / Reglas Críticas** Auditoría inmutable.

#### `[POST] /api/asistencia` — ConsultarAsistencia · RF-CHAT-01/02 / IS-05 / PA-09

- **Auth** `Bearer [sesión registrada; public]`
- **Request Body** `{ consulta: string /* trim, 1–2000 */ }`
- **Response** `200` `Asistencia`
- **Errores Específicos** 400, 401, 403, 429 y 500 usan Asistencia con SOLICITUD_INVALIDA; 503 Asistencia con SERVICIO_NO_DISPONIBLE
- **Efectos / Reglas Críticas** FAQ aprobadas por coincidencia completa o Gemini informativo. Proveedor ≤2 s y presupuesto global 2,5 s más escritura de contingencia de hasta 250 ms. Sin reintento síncrono ni acciones transaccionales.

La contingencia exacta de asistencia (HTTP 503) es:

```json
{"respuesta":"El servicio de asistencia no está disponible temporalmente. Intenta de nuevo.","categoria":"NO_DETERMINADA","codigo":"SERVICIO_NO_DISPONIBLE"}
```

En 200, `codigo` puede ser `OK`, `INFORMACION_INSUFICIENTE` o `FUERA_DE_ALCANCE`. En errores, `categoria` es `NO_DETERMINADA`. Para errores sin cuerpo previo, la respuesta dice «No se pudo procesar la solicitud.». Una excepción manejada puede traer otro mensaje.

## Realtime, webhook y alcance

- **Supabase Broadcast** `disponibilidad:<centroId>`, evento `actualizada`, payload `{centroId: UUID}`. Se encola con mutaciones de disponibilidad y limpieza de expiraciones. Invalidación eventual, con posibles duplicados/retrasos. Consultar REST al recibir, al reconectar y al vencer el plazo mostrado. Polling acotado como respaldo. No publica filas, estados individuales, pagos ni identidades. El productor está implementado; la configuración del proyecto desplegado queda sin verificar. La clave privada de publicación permanece en servidor.
- El webhook Sandbox es la única entrada HTTP de eventos de negocio. Correo, firma y proyección de inspección operan en segundo plano y carecen de contrato push al cliente.
- Los PDF nuevos apuntan a `<frontend>/verificar/{id}?hash=…` cuando se configura `Certificates__FrontendBaseUrl` en el API. Si la variable está ausente, usan `Certificates__PublicBaseUrl` para abrir directamente `/api/certificados/{id}/verificacion?hash=…`. La vista pública conserva el ID y el hash al consultar ese endpoint sin sesión. Los PDF ya emitidos conservan sus bytes y su QR original. La activación no requiere migraciones.
- `[PENDIENTE_EN_BACKEND]` No se encontró bandeja HTTP para notificaciones, exportación de reportes, pasarela real, edición libre de catálogos RBAC ni operaciones separadas para crear/confirmar cita o reagendar. Las fichas reflejan las alternativas académicas implementadas. El PDF SRS del equipo no está en el workspace; el alcance pendiente se infiere de los flujos documentados.
- Fuentes locales `AutoCheck.Api/Program.cs`, `AutoCheck.Api/Features/**`, `AutoCheck.Api/Infrastructure/{Http,Security,Time,Integrations}`, `docs/endpoints.md` y `docs/implementation.md`. Inventario comprobado: 57 operaciones de negocio, dos rutas de salud y los dos montajes condicionales de documentación. Los proveedores y el despliegue requieren validación por separado.
