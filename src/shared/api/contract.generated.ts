// Generado por npm run contract:generate desde API_CONTRACT.md.
// Incluye las 57 rutas de negocio. Salud, OpenAPI y Scalar quedan en el handoff.
// SHA-256 de la fuente normalizada: e5716444e12e77303244cd3acca9ae430b5c2d5dedb5dd3e7ac65033773f671f

export type UUID = string
export type Utc = string // ISO 8601 de instante
export type DiaRD = string // YYYY-MM-DD
export type Int = number // entero
export type Version = Int | bigint // >0; entero JSON Int64, bigint fuera del rango seguro de Number
export type Email = string // requerido, EmailAddress, max. 254
export type Password = string // 8–256, al menos una letra y un número Unicode
export type Hash256 = string // 64 hex minúsculas
export type Id = { id: UUID }
export type IK = { "Idempotency-Key": string }
export type Json = null | boolean | number | string | Json[] | { [key: string]: Json }
export type Problem = { type?: string; title?: string; status: number; detail?: string; instance?: string; codigo: string; traceId: string; errors?: Record<string, string[]> }
export type Pag = { pagina?: Int; tamano?: Int }
export type Offset<O extends string> = Pag & { orden?: O; direccion?: "asc" | "desc" }
export type Seek<O extends string> = Offset<O> & { cursor?: string }
export type Items<T> = { items: T[] }
export type Page<T> = Items<T> & { pagina: Int | null; siguienteCursor: string | null }
export type OffsetPage<T> = Items<T> & { pagina: Int; siguienteCursor: null }

export type Rol = "Ciudadano" | "Inspector" | "Administrador"
export type Permiso = "usuarios.gestionar" | "centros.gestionar" | "reglas.gestionar" | "auditoria.consultar"
export type Session = { accessToken: string; refreshToken: string; expiraUtc: Utc }
export type Usuario = { id: UUID; correo: string; nombre: string; celular: string; rol: Rol; permisos: Permiso[]; centroId: UUID | null; activo: boolean; version: Version; archivadoUtc: Utc | null }
export type Acceso = Omit<Usuario, "id" | "correo" | "nombre" | "celular"> & { usuarioId: UUID }
export type VehiculoInput = { matricula: string /* 1–20, ^[A-Za-z0-9-]+$ */; vin: string /* 17, ^[A-HJ-NPR-Za-hj-npr-z0-9]+$ */; anio: Int /* 1900–2100 */; modeloId: UUID /* no vacío */; colorId: UUID /* no vacío */; version?: Version | null }
export type Vehiculo = Omit<VehiculoInput, "version"> & { id: UUID; version: Version; archivadoUtc: Utc | null }
export type CatalogoTipo = "marcas" | "modelos" | "colores" | "categorias" | "defectos-categorias-v1" | "defectos-subcategorias-v1"
export type CatalogoItem = { id: UUID; nombre: string; padreId: UUID | null }

export type CentroInput = { nombre: string /* 1–120 */; direccion: string /* 1–300 */; activo?: boolean /* true */ }
export type Centro = Required<CentroInput> & { id: UUID }
export type RampaInput = { nombre: string /* 1–80 */; activa?: boolean /* true */ }
export type Rampa = Required<RampaInput> & { id: UUID; centroId: UUID }
export type Horario = { dia: Int /* domingo 0–sábado 6 */; aperturaMinutos: Int /* 0–1410, múltiplo de 30 */; cierreMinutos: Int /* 30–1440, múltiplo de 30, > apertura */ }
export type EstadoBloque = "LIBRE" | "RETENIDO" | "CONFIRMADO"
export type Bloque = { rampaId: UUID; inicioUtc: Utc; estado: EstadoBloque; expiraUtc: Utc | null }
export type EstadoCita = "CONFIRMADA" | "CANCELADA" | "EN_INSPECCION" | "COMPLETADA"
export type Cita = { id: UUID; vehiculoId: UUID; centroId: UUID; rampaId: UUID; inspectorId: UUID | null; inicioUtc: Utc; estado: EstadoCita; inspeccionAnteriorId: UUID | null }
export type Escenario = "APROBADO" | "RECHAZADO" | "ERROR"
export type EstadoPago = Escenario | "PENDIENTE" | "VENCIDO" | "ABANDONADO" | "REVERTIDO"
export type Pago = { intentoId: UUID; retencionId: UUID; estado: EstadoPago; expiraUtc: Utc; citaId: UUID | null; reversionId: UUID | null; monto: number; moneda: string; siguienteAccion: "SELECCIONAR_OTRO_HORARIO" | null }

export type EstadoInspeccion = "ABIERTA" | "CERRADA"
export type Veredicto = "Aprobado" | "Rechazado"
export type Severidad = "Leve" | "Mediano" | "Grave"
export type DefectoInput = { descripcion: string /* 1–300 */; severidad: Severidad; cantidad?: Int /* 1–100, 1 */; categoria: string; subcategoria: string } // códigos nombre del catálogo V1, par válido
export type Defecto = Omit<DefectoInput, "cantidad" | "categoria" | "subcategoria"> & { cantidad: Int; categoria: string | null; subcategoria: string | null }
export type Conteos = { m: Int; l: Int; md: Int; g: Int }
export type Inspeccion = Conteos & { id: UUID; vehiculoId: UUID; centroId: UUID; rampaId: UUID; inspectorId: UUID; inspeccionAnteriorId: UUID | null; inicioUtc: Utc; cierreUtc: Utc | null; estado: EstadoInspeccion; resultado: Veredicto | null; versionReglas: string; version: Int; defectos: Defecto[] | null }
export type Historial = Conteos & { id: UUID; cierreUtc: Utc | null; resultado: Veredicto | null; versionReglas: string; centroId: UUID; inspeccionAnteriorId: UUID | null }
export type Regla = { id: UUID; version: string; m: Int; vigenciaUtc: Utc }
export type EstadoCertificado = "PENDIENTE" | "EMITIDO"
export type Certificado = { id: UUID; estado: EstadoCertificado; emisionUtc: Utc; hashManifiesto: Hash256; hashPdf: Hash256 | null }

export type FiltrosReporte = Pag & { desde?: DiaRD; hasta?: DiaRD; centroId?: UUID; rampaId?: UUID; inspectorId?: UUID } // desde: hoy local; hasta: desde; diferencia 0–366 días
export type Totales = { cerradas: Int; aprobadas: Int; rechazadas: Int; porcentajeRechazo: number | null }
export type FilaMetrica = Totales & { dia: DiaRD; centroId: UUID; rampaId: UUID; inspectorId: UUID }
export type Metricas = Totales & { estado: "Sin datos" | "Con datos"; ultimaActualizacionUtc: Utc | null; items: FilaMetrica[] }
export type Alerta = { id: UUID; inspectorId: UUID; centroId: UUID; inspecciones: UUID[] /* 21 */; desdeUtc: Utc; hastaUtc: Utc; aprobadas: 20 | 21; total: 21; porcentaje: number; fecha: DiaRD }
export type Auditoria = { id: UUID; actorId: UUID | null; fechaUtc: Utc; operacion: string; entidad: string; resultado: string; correlacion: string; ip: string | null; anterior: Json; nuevo: Json }
export type CategoriaAsistencia = "USO_PLATAFORMA" | "ITV" | "FUERA_DE_ALCANCE" | "NO_DETERMINADA"
export type CodigoAsistencia = "OK" | "INFORMACION_INSUFICIENTE" | "FUERA_DE_ALCANCE" | "SOLICITUD_INVALIDA" | "SERVICIO_NO_DISPONIBLE"
export type Asistencia = { respuesta: string; categoria: CategoriaAsistencia; codigo: CodigoAsistencia }

export const assistanceFallback = {"respuesta":"El servicio de asistencia no está disponible temporalmente. Intenta de nuevo.","categoria":"NO_DETERMINADA","codigo":"SERVICIO_NO_DISPONIBLE"} as const satisfies Asistencia;

export interface Operations {
  /** RegistrarCiudadano · CU-01 / PA-01 / RS-09 */
  "POST /api/auth/registro": {
    input: {
    body: { correo: Email; contrasena: Password; nombre: string /* 1–120 */ }
    }
    success: { status: 201; body: { usuarioId: UUID; estado: "PENDIENTE_CONFIRMACION"|"ACTIVA" }; headers: { retryAfter: string | null; location: string | null } }
    errors: Problem
    errorCodes: { 409: "CORREO_EXISTENTE" }
  }
  /** IniciarSesion · CU-02 / PA-02 / RS-11 */
  "POST /api/auth/login": {
    input: {
    body: { correo: Email; contrasena: string /* 1–256 */ }
    }
    success: { status: 200; body: Session; headers: { retryAfter: string | null } }
    errors: Problem
    errorCodes: { 401: "CREDENCIALES_INVALIDAS" | "SESION_EXPIRADA"; 403: "ACCESO_DENEGADO"; 429: "CUENTA_BLOQUEADA" }
  }
  /** RenovarSesion · CU-02 / RS-10 */
  "POST /api/auth/refresh": {
    input: {
    body: { refreshToken: string /* 1–4096 */ }
    }
    success: { status: 200; body: Session; headers: { retryAfter: string | null } }
    errors: Problem
    errorCodes: { 401: "SESION_INVALIDA" | "SESION_EXPIRADA" }
  }
  /** SolicitarRecuperacion · IS-04 / RS-11 */
  "POST /api/auth/recuperacion": {
    input: {
    body: { correo: Email }
    }
    success: { status: 202; body: { mensaje: string }; headers: { retryAfter: string | null } }
    errors: Problem
    errorCodes: Record<never, never>
  }
  /** RestablecerContrasena · RS-09 / RS-11 */
  "POST /api/auth/restablecimiento": {
    input: {
    body: { token: string /* 1–8192, TokenHash del correo */; nuevaContrasena: Password }
    }
    success: { status: 204; body: undefined; headers: { retryAfter: string | null } }
    errors: Problem
    errorCodes: { 401: "RECUPERACION_INVALIDA"; 409: "RECUPERACION_PENDIENTE"; 503: "SERVICIO_NO_DISPONIBLE" }
  }
  /** CerrarSesion · CU-02 / RS-10 */
  "POST /api/auth/logout": {
    input: Record<string, never>
    success: { status: 204; body: undefined; headers: { retryAfter: string | null } }
    errors: Problem
    errorCodes: { 401: "SESION_INVALIDA"; 503: "SERVICIO_NO_DISPONIBLE" }
  }
  /** RegistrarActividad · RS-10 / PA-02 */
  "POST /api/auth/actividad": {
    input: Record<string, never>
    success: { status: 204; body: undefined; headers: { retryAfter: string | null } }
    errors: Problem
    errorCodes: { 401: "SESION_EXPIRADA" }
  }
  /** ObtenerPerfil · CU-11 / PA-11 */
  "GET /api/usuarios/me": {
    input: Record<string, never>
    success: { status: 200; body: Usuario; headers: { retryAfter: string | null } }
    errors: Problem
    errorCodes: { 404: "RECURSO_NO_ENCONTRADO" }
  }
  /** ActualizarPerfil · SRS §6.2.1.1 */
  "PATCH /api/usuarios/me": {
    input: {
    body: { nombre: string /* 1–120 */; celular: string /* 0–30, no null */; version?: Version | null }
    }
    success: { status: 200; body: Usuario; headers: { retryAfter: string | null } }
    errors: Problem
    errorCodes: { 404: "RECURSO_NO_ENCONTRADO"; 409: "VERSION_DESACTUALIZADA" | "RECURSO_ARCHIVADO" }
  }
  /** ListarUsuarios · CU-11 / PA-11 */
  "GET /api/usuarios": {
    input: {
    query?: Offset<"id"|"nombre"> & { rol?: Rol; activo?: boolean; incluirArchivados?: boolean; nombre?: string /* ≤120 */ }
    }
    success: { status: 200; body: OffsetPage<Usuario>; headers: { retryAfter: string | null } }
    errors: Problem
    errorCodes: Record<never, never>
  }
  /** ObtenerUsuario · CU-11 / PA-11 */
  "GET /api/usuarios/{id}": {
    input: {
    params: Id
    }
    success: { status: 200; body: Usuario; headers: { retryAfter: string | null } }
    errors: Problem
    errorCodes: { 404: "RECURSO_NO_ENCONTRADO" }
  }
  /** ArchivarUsuario · DEC-LIFECYCLE-01 / RS-03 */
  "DELETE /api/usuarios/{id}": {
    input: {
    params: Id
    query: { version: Version }
    }
    success: { status: 204; body: undefined; headers: { retryAfter: string | null } }
    errors: Problem
    errorCodes: { 404: "RECURSO_NO_ENCONTRADO"; 409: "CAMBIO_PROPIO_NO_PERMITIDO" | "ULTIMO_ADMINISTRADOR" | "OPERACIONES_PENDIENTES" | "VERSION_DESACTUALIZADA" }
  }
  /** ObtenerAcceso · CU-11 / PA-11 */
  "GET /api/usuarios/{id}/acceso": {
    input: {
    params: Id
    }
    success: { status: 200; body: Acceso; headers: { retryAfter: string | null } }
    errors: Problem
    errorCodes: { 404: "RECURSO_NO_ENCONTRADO" }
  }
  /** CambiarAcceso · CU-11 / PA-11 */
  "PATCH /api/usuarios/{id}/acceso": {
    input: {
    params: Id
    body: { rol: Rol; permisos: Permiso[] /* obligatorio, [] válido */; centroId?: UUID | null; activo: boolean; version?: Version | null }
    }
    success: { status: 200; body: Usuario; headers: { retryAfter: string | null } }
    errors: Problem
    errorCodes: { 404: "RECURSO_NO_ENCONTRADO"; 409: "CAMBIO_PROPIO_NO_PERMITIDO" | "ULTIMO_ADMINISTRADOR" | "ASIGNACIONES_PENDIENTES" | "VERSION_DESACTUALIZADA" | "RECURSO_ARCHIVADO" }
  }
  /** ListarRoles · CU-11 / PA-11 */
  "GET /api/roles": {
    input: Record<string, never>
    success: { status: 200; body: Items<{ codigo: Rol }>; headers: { retryAfter: string | null } }
    errors: Problem
    errorCodes: Record<never, never>
  }
  /** ListarPermisos · CU-11 / PA-11 */
  "GET /api/permisos": {
    input: Record<string, never>
    success: { status: 200; body: Items<{ codigo: Permiso }>; headers: { retryAfter: string | null } }
    errors: Problem
    errorCodes: Record<never, never>
  }
  /** ListarVehiculos · IU-01 / PA-10 */
  "GET /api/vehiculos": {
    input: {
    query?: Offset<"id"|"matricula"> & { matricula?: string /* ≤20 */; incluirArchivados?: boolean }
    }
    success: { status: 200; body: OffsetPage<Vehiculo>; headers: { retryAfter: string | null } }
    errors: Problem
    errorCodes: Record<never, never>
  }
  /** RegistrarVehiculo · IU-01 */
  "POST /api/vehiculos": {
    input: {
    body: VehiculoInput
    }
    success: { status: 201; body: Vehiculo; headers: { retryAfter: string | null; location: string | null } }
    errors: Problem
    errorCodes: { 400: "SOLICITUD_INVALIDA"; 409: "REGISTRO_DUPLICADO" }
  }
  /** ObtenerVehiculo · CU-10 / PA-10 */
  "GET /api/vehiculos/{id}": {
    input: {
    params: Id
    }
    success: { status: 200; body: Vehiculo; headers: { retryAfter: string | null } }
    errors: Problem
    errorCodes: { 403: "ACCESO_DENEGADO"; 404: "RECURSO_NO_ENCONTRADO" }
  }
  /** ActualizarVehiculo · IU-01 / PA-05d */
  "PATCH /api/vehiculos/{id}": {
    input: {
    params: Id
    body: VehiculoInput
    }
    success: { status: 200; body: Vehiculo; headers: { retryAfter: string | null } }
    errors: Problem
    errorCodes: { 404: "RECURSO_NO_ENCONTRADO"; 409: "VERSION_DESACTUALIZADA" | "RECURSO_ARCHIVADO" | "REGISTRO_DUPLICADO" }
  }
  /** ArchivarVehiculo · DEC-LIFECYCLE-01 / RS-03 */
  "DELETE /api/vehiculos/{id}": {
    input: {
    params: Id
    query: { version: Version }
    }
    success: { status: 204; body: undefined; headers: { retryAfter: string | null } }
    errors: Problem
    errorCodes: { 404: "RECURSO_NO_ENCONTRADO"; 409: "VERSION_DESACTUALIZADA" | "OPERACIONES_PENDIENTES" }
  }
  /** ConsultarCatalogo · IU-01 */
  "GET /api/catalogos/{tipo}": {
    input: {
    params: { tipo: CatalogoTipo }
    query?: Offset<"nombre"> & { padreId?: UUID }
    }
    success: { status: 200; body: OffsetPage<CatalogoItem>; headers: { retryAfter: string | null } }
    errors: Problem
    errorCodes: { 404: "RECURSO_NO_ENCONTRADO" }
  }
  /** ListarCentros · CU-12 / RAE-01 */
  "GET /api/centros": {
    input: {
    query?: Pag
    }
    success: { status: 200; body: Items<Centro>; headers: { retryAfter: string | null } }
    errors: Problem
    errorCodes: Record<never, never>
  }
  /** CrearCentro · CU-12 / PA-12c */
  "POST /api/centros": {
    input: {
    body: CentroInput
    }
    success: { status: 201; body: Centro; headers: { retryAfter: string | null; location: string | null } }
    errors: Problem
    errorCodes: Record<never, never>
  }
  /** ObtenerCentro · CU-12 */
  "GET /api/centros/{id}": {
    input: {
    params: Id
    }
    success: { status: 200; body: { centro: Centro; rampas: Rampa[]; horarios: Horario[] }; headers: { retryAfter: string | null } }
    errors: Problem
    errorCodes: { 404: "RECURSO_NO_ENCONTRADO" }
  }
  /** ActualizarCentro · PA-12b,c */
  "PATCH /api/centros/{id}": {
    input: {
    params: Id
    body: CentroInput
    }
    success: { status: 200; body: Centro; headers: { retryAfter: string | null } }
    errors: Problem
    errorCodes: { 404: "RECURSO_NO_ENCONTRADO"; 409: "CENTRO_CON_COMPROMISOS" }
  }
  /** CrearRampa · CU-12 / PA-12a */
  "POST /api/centros/{id}/rampas": {
    input: {
    params: Id
    body: RampaInput
    }
    success: { status: 201; body: Rampa; headers: { retryAfter: string | null; location: string | null } }
    errors: Problem
    errorCodes: { 404: "RECURSO_NO_ENCONTRADO" }
  }
  /** ActualizarRampa · PA-12b,c */
  "PATCH /api/centros/{id}/rampas/{rampaId}": {
    input: {
    params: Id & { rampaId: UUID }
    body: RampaInput
    }
    success: { status: 200; body: Rampa; headers: { retryAfter: string | null } }
    errors: Problem
    errorCodes: { 404: "RECURSO_NO_ENCONTRADO"; 409: "RAMPA_CON_COMPROMISOS" }
  }
  /** ConfigurarHorarios · RAE-01 / PA-12b,c */
  "PUT /api/centros/{id}/horarios": {
    input: {
    params: Id
    body: { horarios: Horario[] /* 0–7, sin null ni días repetidos */ }
    }
    success: { status: 200; body: { horarios: Horario[] }; headers: { retryAfter: string | null } }
    errors: Problem
    errorCodes: { 404: "RECURSO_NO_ENCONTRADO"; 409: "HORARIO_CON_COMPROMISOS" }
  }
  /** ConsultarDisponibilidad · RF-CIT-01/03 / PA-12a */
  "GET /api/centros/{id}/disponibilidad": {
    input: {
    params: Id
    query: { fecha: DiaRD }
    }
    success: { status: 200; body: { bloques: Bloque[]; zonaHoraria: string }; headers: { retryAfter: string | null } }
    errors: Problem
    errorCodes: { 400: "SOLICITUD_INVALIDA"; 404: "RECURSO_NO_ENCONTRADO" }
  }
  /** ListarCitas · CU-03 */
  "GET /api/citas": {
    input: {
    query?: Pag & { desde?: DiaRD; hasta?: DiaRD; estado?: EstadoCita }
    }
    success: { status: 200; body: Items<Cita>; headers: { retryAfter: string | null } }
    errors: Problem
    errorCodes: Record<never, never>
  }
  /** ObtenerCita · CU-03 */
  "GET /api/citas/{id}": {
    input: {
    params: Id
    }
    success: { status: 200; body: Cita; headers: { retryAfter: string | null } }
    errors: Problem
    errorCodes: { 403: "ACCESO_DENEGADO"; 404: "RECURSO_NO_ENCONTRADO" }
  }
  /** AbandonarRetencion · RF-CIT-02 / CU-03 */
  "DELETE /api/citas/retenciones/{id}": {
    input: {
    params: Id
    }
    success: { status: 204; body: undefined; headers: { retryAfter: string | null } }
    errors: Problem
    errorCodes: { 404: "RECURSO_NO_ENCONTRADO"; 409: "CITA_CONFIRMADA" }
  }
  /** CancelarCita · RF-CIT-02 / PA-03e / PA-04d */
  "POST /api/citas/{id}/cancelacion": {
    input: {
    params: Id
    headers: IK
    body: { motivo: string /* 1–300 */ }
    }
    success: { status: 200; body: { citaId: UUID; estado: "CANCELADA"; reversionId: UUID | null }; headers: { retryAfter: string | null } }
    errors: Problem
    errorCodes: { 404: "RECURSO_NO_ENCONTRADO"; 409: "CITA_NO_CANCELABLE" | "IDEMPOTENCIA_CONFLICTO" }
  }
  /** AsignarInspector · CU-05 */
  "PUT /api/citas/{id}/inspector": {
    input: {
    params: Id
    body: { inspectorId: UUID /* no vacío */ }
    }
    success: { status: 200; body: Cita; headers: { retryAfter: string | null } }
    errors: Problem
    errorCodes: { 400: "SOLICITUD_INVALIDA"; 404: "RECURSO_NO_ENCONTRADO"; 409: "CITA_INICIADA" }
  }
  /** IniciarPago · RF-CIT-01/03 / CU-04 / PA-03 */
  "POST /api/pagos/intentos": {
    input: {
    headers: IK
    body: { vehiculoId: UUID; centroId: UUID; rampaId: UUID; inicioUtc: Utc; inspeccionAnteriorId?: UUID | null; escenario?: Escenario /* APROBADO */; demoraSegundos?: Int /* 0–600, 0 */ }
    }
    success: { status: 201; body: { intentoId: UUID; retencionId: UUID; estado: "RETENIDO"; expiraUtc: Utc; monto: number; moneda: string }; headers: { retryAfter: string | null; location: string | null } }
    errors: Problem
    errorCodes: { 400: "SOLICITUD_INVALIDA"; 403: "ACCESO_DENEGADO"; 409: "BLOQUE_NO_DISPONIBLE" | "IDEMPOTENCIA_CONFLICTO"; 503: "SERVICIO_NO_DISPONIBLE" }
  }
  /** ConsultarPago · CU-04 */
  "GET /api/pagos/intentos/{id}": {
    input: {
    params: Id
    }
    success: { status: 200; body: Pago; headers: { retryAfter: string | null } }
    errors: Problem
    errorCodes: { 403: "ACCESO_DENEGADO"; 404: "RECURSO_NO_ENCONTRADO" }
  }
  /** RecibirPagoSandbox · IS-03 / PA-04 */
  "POST /api/pagos/webhook": {
    input: {
    headers: { "X-Sandbox-Signature": string /* 64 caracteres hex HMAC-SHA256 sobre bytes exactos */ }
    body: { eventoId: string /* 1–128, no blanco */; intentoId: UUID; resultado: Escenario }
    }
    success: { status: 200; body: Pago; headers: { retryAfter: string | null } }
    errors: Problem
    errorCodes: { 400: "SOLICITUD_INVALIDA"; 401: "FIRMA_INVALIDA"; 404: "RECURSO_NO_ENCONTRADO"; 409: "EVENTO_CONFLICTO"; 503: "SERVICIO_NO_DISPONIBLE" }
  }
  /** ListarInspecciones · CU-05 / CU-10 */
  "GET /api/inspecciones": {
    input: {
    query?: Pag & { desde?: DiaRD; hasta?: DiaRD; estado?: EstadoInspeccion }
    }
    success: { status: 200; body: Items<Inspeccion>; headers: { retryAfter: string | null } }
    errors: Problem
    errorCodes: Record<never, never>
  }
  /** IniciarInspeccion · RF-INS-01 / PA-05b */
  "POST /api/inspecciones": {
    input: {
    headers: IK
    body: { citaId: UUID /* no vacío */ }
    }
    success: { status: 201; body: Inspeccion; headers: { retryAfter: string | null; location: string | null } }
    errors: Problem
    errorCodes: { 404: "RECURSO_NO_ENCONTRADO"; 409: "CITA_NO_CONFIRMADA" | "IDEMPOTENCIA_CONFLICTO"; 503: "SERVICIO_NO_DISPONIBLE" }
  }
  /** ObtenerInspeccion · CU-05 / CU-10 */
  "GET /api/inspecciones/{id}": {
    input: {
    params: Id
    }
    success: { status: 200; body: Inspeccion; headers: { retryAfter: string | null } }
    errors: Problem
    errorCodes: { 403: "ACCESO_DENEGADO"; 404: "RECURSO_NO_ENCONTRADO" }
  }
  /** RegistrarDefectos · RF-INS-01 / PA-05c,d */
  "PUT /api/inspecciones/{id}/registro": {
    input: {
    params: Id
    body: { versionEsperada: Int /* ≥0 */; defectos: DefectoInput[] /* 0–100; no null, ni ítems null */ }
    }
    success: { status: 200; body: Inspeccion; headers: { retryAfter: string | null } }
    errors: Problem
    errorCodes: { 404: "RECURSO_NO_ENCONTRADO"; 409: "INSPECCION_CERRADA" | "VERSION_DESACTUALIZADA" }
  }
  /** CerrarInspeccion · RF-INS-01 / PA-05 */
  "POST /api/inspecciones/{id}/cierre": {
    input: {
    params: Id
    headers: IK
    body: { versionEsperada: Int /* ≥0 */ }
    }
    success: { status: 200; body: Inspeccion; headers: { retryAfter: string | null } }
    errors: Problem
    errorCodes: { 400: "SOLICITUD_INVALIDA"; 404: "RECURSO_NO_ENCONTRADO"; 409: "INSPECCION_CERRADA" | "VERSION_DESACTUALIZADA" | "IDEMPOTENCIA_CONFLICTO" }
  }
  /** ConsultarReinspecciones · DF-05 / CU-10 */
  "GET /api/inspecciones/{id}/reinspecciones": {
    input: {
    params: Id
    query?: Pag
    }
    success: { status: 200; body: Items<Inspeccion>; headers: { retryAfter: string | null } }
    errors: Problem
    errorCodes: { 403: "ACCESO_DENEGADO"; 404: "RECURSO_NO_ENCONTRADO" }
  }
  /** ConsultarHistorial · CU-10 / PA-10 / RS-08 */
  "GET /api/vehiculos/{id}/historial": {
    input: {
    params: Id
    query?: Seek<"cierreUtc"> & { estado?: EstadoInspeccion; resultado?: Veredicto; desde?: DiaRD; hasta?: DiaRD }
    }
    success: { status: 200; body: Page<Historial>; headers: { retryAfter: string | null } }
    errors: Problem
    errorCodes: { 400: "CURSOR_INVALIDO" | "SOLICITUD_INVALIDA"; 403: "ACCESO_DENEGADO"; 404: "RECURSO_NO_ENCONTRADO" }
  }
  /** ConsultarReglas · RAE-02 */
  "GET /api/configuracion/reglas-inspeccion": {
    input: {
    query?: Pag
    }
    success: { status: 200; body: Items<Regla>; headers: { retryAfter: string | null } }
    errors: Problem
    errorCodes: Record<never, never>
  }
  /** CrearVersionReglas · RAE-02 / PA-05b */
  "POST /api/configuracion/reglas-inspeccion": {
    input: {
    body: { m: Int /* ≥0 */; vigenciaUtc: Utc }
    }
    success: { status: 201; body: Regla; headers: { retryAfter: string | null; location: string | null } }
    errors: Problem
    errorCodes: { 400: "SOLICITUD_INVALIDA"; 409: "REGISTRO_DUPLICADO" }
  }
  /** SolicitarCertificado · CU-06 / PA-06 */
  "POST /api/inspecciones/{id}/certificado": {
    input: {
    params: Id
    headers: IK
    }
    success: { status: 202; body: Certificado & { estado: "PENDIENTE" }; headers: { retryAfter: string | null; location: string | null } }
      | { status: 200; body: Certificado & { estado: "EMITIDO" }; headers: { retryAfter: string | null; location: string | null } }
    errors: Problem
    errorCodes: { 403: "ACCESO_DENEGADO"; 404: "RECURSO_NO_ENCONTRADO"; 409: "INSPECCION_NO_APROBADA" | "IDEMPOTENCIA_CONFLICTO" }
  }
  /** ListarCertificados · CU-06 / PA-06 */
  "GET /api/certificados": {
    input: {
    query?: Seek<"emisionUtc"> & { vehiculoId?: UUID; estado?: EstadoCertificado; desdeUtc?: Utc; hastaUtc?: Utc }
    }
    success: { status: 200; body: Page<Certificado>; headers: { retryAfter: string | null } }
    errors: Problem
    errorCodes: { 400: "CURSOR_INVALIDO" | "SOLICITUD_INVALIDA" }
  }
  /** ObtenerCertificado · CU-06 */
  "GET /api/certificados/{id}": {
    input: {
    params: Id
    }
    success: { status: 200; body: Certificado; headers: { retryAfter: string | null } }
    errors: Problem
    errorCodes: { 403: "ACCESO_DENEGADO"; 404: "RECURSO_NO_ENCONTRADO" }
  }
  /** DescargarCertificado · CU-06 / PA-06/07 */
  "GET /api/certificados/{id}/pdf": {
    input: {
    params: Id
    }
    success: { status: 200; body: Blob; headers: { retryAfter: string | null; contentDisposition: string | null } }
    errors: Problem
    errorCodes: { 403: "ACCESO_DENEGADO"; 404: "RECURSO_NO_ENCONTRADO"; 409: "CERTIFICADO_PENDIENTE"; 503: "SERVICIO_NO_DISPONIBLE" }
  }
  /** VerificarCertificado · RF-CER-01 / CU-07 / PA-07 */
  "GET /api/certificados/{id}/verificacion": {
    input: {
    params: Id
    query?: { hash?: string /* debe ser 64 hex minúsculas para éxito */ }
    }
    success: { status: 200; body: { certificadoId: UUID; emisionUtc: Utc; centro: string; resultado: "Aprobado" }; headers: { retryAfter: string | null } }
    errors: Problem
    errorCodes: { 404: "CERTIFICADO_NO_ENCONTRADO"; 409: "INTEGRIDAD_NO_VALIDA"; 429: "SOLICITUD_RECHAZADA" }
  }
  /** ConsultarMetricas · RF-DAS-01/02 / PA-08 */
  "GET /api/reportes/inspecciones": {
    input: {
    query?: FiltrosReporte
    }
    success: { status: 200; body: Metricas; headers: { retryAfter: string | null } }
    errors: Problem
    errorCodes: { 400: "SOLICITUD_INVALIDA"; 403: "ACCESO_DENEGADO" }
  }
  /** ConsultarAlertas · RF-DAS-03 / PA-08 */
  "GET /api/reportes/alertas": {
    input: {
    query?: FiltrosReporte
    }
    success: { status: 200; body: { ultimaActualizacionUtc: Utc | null; items: Alerta[] }; headers: { retryAfter: string | null } }
    errors: Problem
    errorCodes: { 400: "SOLICITUD_INVALIDA"; 403: "ACCESO_DENEGADO" }
  }
  /** ConsultarAuditorias · CU-13 / PA-13 */
  "GET /api/auditorias": {
    input: {
    query?: Seek<"fechaUtc"> & { desdeUtc?: Utc; hastaUtc?: Utc; operacion?: string /* ≤128 */; entidad?: string /* ≤256 */; actorId?: UUID }
    }
    success: { status: 200; body: Page<Auditoria>; headers: { retryAfter: string | null } }
    errors: Problem
    errorCodes: { 400: "CURSOR_INVALIDO" | "SOLICITUD_INVALIDA" }
  }
  /** ObtenerAuditoria · CU-13 / PA-13 */
  "GET /api/auditorias/{id}": {
    input: {
    params: Id
    }
    success: { status: 200; body: Auditoria; headers: { retryAfter: string | null } }
    errors: Problem
    errorCodes: { 404: "RECURSO_NO_ENCONTRADO" }
  }
  /** ConsultarAsistencia · RF-CHAT-01/02 / IS-05 / PA-09 */
  "POST /api/asistencia": {
    input: {
    body: { consulta: string /* trim, 1–2000 */ }
    }
    success: { status: 200; body: Asistencia; headers: { retryAfter: string | null } }
    errors: Asistencia
    errorCodes: { 400: "SOLICITUD_INVALIDA"; 401: "SOLICITUD_INVALIDA"; 403: "SOLICITUD_INVALIDA"; 429: "SOLICITUD_INVALIDA"; 500: "SOLICITUD_INVALIDA"; 503: "SERVICIO_NO_DISPONIBLE" }
  }
}

export type Operation = keyof Operations;

export const operations = {
  "POST /api/auth/registro": {"method":"POST","path":"/api/auth/registro","auth":"public","idempotent":false,"assistance":false,"success":{"201":"json"}},
  "POST /api/auth/login": {"method":"POST","path":"/api/auth/login","auth":"public","idempotent":false,"assistance":false,"success":{"200":"json"}},
  "POST /api/auth/refresh": {"method":"POST","path":"/api/auth/refresh","auth":"public","idempotent":false,"assistance":false,"success":{"200":"json"}},
  "POST /api/auth/recuperacion": {"method":"POST","path":"/api/auth/recuperacion","auth":"public","idempotent":false,"assistance":false,"success":{"202":"json"}},
  "POST /api/auth/restablecimiento": {"method":"POST","path":"/api/auth/restablecimiento","auth":"public","idempotent":false,"assistance":false,"success":{"204":"empty"}},
  "POST /api/auth/logout": {"method":"POST","path":"/api/auth/logout","auth":"bearer","idempotent":false,"assistance":false,"success":{"204":"empty"}},
  "POST /api/auth/actividad": {"method":"POST","path":"/api/auth/actividad","auth":"bearer","idempotent":false,"assistance":false,"success":{"204":"empty"}},
  "GET /api/usuarios/me": {"method":"GET","path":"/api/usuarios/me","auth":"bearer","idempotent":false,"assistance":false,"success":{"200":"json"}},
  "PATCH /api/usuarios/me": {"method":"PATCH","path":"/api/usuarios/me","auth":"bearer","idempotent":false,"assistance":false,"success":{"200":"json"}},
  "GET /api/usuarios": {"method":"GET","path":"/api/usuarios","auth":"bearer","idempotent":false,"assistance":false,"success":{"200":"json"}},
  "GET /api/usuarios/{id}": {"method":"GET","path":"/api/usuarios/{id}","auth":"bearer","idempotent":false,"assistance":false,"success":{"200":"json"}},
  "DELETE /api/usuarios/{id}": {"method":"DELETE","path":"/api/usuarios/{id}","auth":"bearer","idempotent":false,"assistance":false,"success":{"204":"empty"}},
  "GET /api/usuarios/{id}/acceso": {"method":"GET","path":"/api/usuarios/{id}/acceso","auth":"bearer","idempotent":false,"assistance":false,"success":{"200":"json"}},
  "PATCH /api/usuarios/{id}/acceso": {"method":"PATCH","path":"/api/usuarios/{id}/acceso","auth":"bearer","idempotent":false,"assistance":false,"success":{"200":"json"}},
  "GET /api/roles": {"method":"GET","path":"/api/roles","auth":"bearer","idempotent":false,"assistance":false,"success":{"200":"json"}},
  "GET /api/permisos": {"method":"GET","path":"/api/permisos","auth":"bearer","idempotent":false,"assistance":false,"success":{"200":"json"}},
  "GET /api/vehiculos": {"method":"GET","path":"/api/vehiculos","auth":"bearer","idempotent":false,"assistance":false,"success":{"200":"json"}},
  "POST /api/vehiculos": {"method":"POST","path":"/api/vehiculos","auth":"bearer","idempotent":false,"assistance":false,"success":{"201":"json"}},
  "GET /api/vehiculos/{id}": {"method":"GET","path":"/api/vehiculos/{id}","auth":"bearer","idempotent":false,"assistance":false,"success":{"200":"json"}},
  "PATCH /api/vehiculos/{id}": {"method":"PATCH","path":"/api/vehiculos/{id}","auth":"bearer","idempotent":false,"assistance":false,"success":{"200":"json"}},
  "DELETE /api/vehiculos/{id}": {"method":"DELETE","path":"/api/vehiculos/{id}","auth":"bearer","idempotent":false,"assistance":false,"success":{"204":"empty"}},
  "GET /api/catalogos/{tipo}": {"method":"GET","path":"/api/catalogos/{tipo}","auth":"bearer","idempotent":false,"assistance":false,"success":{"200":"json"}},
  "GET /api/centros": {"method":"GET","path":"/api/centros","auth":"bearer","idempotent":false,"assistance":false,"success":{"200":"json"}},
  "POST /api/centros": {"method":"POST","path":"/api/centros","auth":"bearer","idempotent":false,"assistance":false,"success":{"201":"json"}},
  "GET /api/centros/{id}": {"method":"GET","path":"/api/centros/{id}","auth":"bearer","idempotent":false,"assistance":false,"success":{"200":"json"}},
  "PATCH /api/centros/{id}": {"method":"PATCH","path":"/api/centros/{id}","auth":"bearer","idempotent":false,"assistance":false,"success":{"200":"json"}},
  "POST /api/centros/{id}/rampas": {"method":"POST","path":"/api/centros/{id}/rampas","auth":"bearer","idempotent":false,"assistance":false,"success":{"201":"json"}},
  "PATCH /api/centros/{id}/rampas/{rampaId}": {"method":"PATCH","path":"/api/centros/{id}/rampas/{rampaId}","auth":"bearer","idempotent":false,"assistance":false,"success":{"200":"json"}},
  "PUT /api/centros/{id}/horarios": {"method":"PUT","path":"/api/centros/{id}/horarios","auth":"bearer","idempotent":false,"assistance":false,"success":{"200":"json"}},
  "GET /api/centros/{id}/disponibilidad": {"method":"GET","path":"/api/centros/{id}/disponibilidad","auth":"bearer","idempotent":false,"assistance":false,"success":{"200":"json"}},
  "GET /api/citas": {"method":"GET","path":"/api/citas","auth":"bearer","idempotent":false,"assistance":false,"success":{"200":"json"}},
  "GET /api/citas/{id}": {"method":"GET","path":"/api/citas/{id}","auth":"bearer","idempotent":false,"assistance":false,"success":{"200":"json"}},
  "DELETE /api/citas/retenciones/{id}": {"method":"DELETE","path":"/api/citas/retenciones/{id}","auth":"bearer","idempotent":false,"assistance":false,"success":{"204":"empty"}},
  "POST /api/citas/{id}/cancelacion": {"method":"POST","path":"/api/citas/{id}/cancelacion","auth":"bearer","idempotent":true,"assistance":false,"success":{"200":"json"}},
  "PUT /api/citas/{id}/inspector": {"method":"PUT","path":"/api/citas/{id}/inspector","auth":"bearer","idempotent":false,"assistance":false,"success":{"200":"json"}},
  "POST /api/pagos/intentos": {"method":"POST","path":"/api/pagos/intentos","auth":"bearer","idempotent":true,"assistance":false,"success":{"201":"json"}},
  "GET /api/pagos/intentos/{id}": {"method":"GET","path":"/api/pagos/intentos/{id}","auth":"bearer","idempotent":false,"assistance":false,"success":{"200":"json"}},
  "POST /api/pagos/webhook": {"method":"POST","path":"/api/pagos/webhook","auth":"webhook","idempotent":false,"assistance":false,"success":{"200":"json"}},
  "GET /api/inspecciones": {"method":"GET","path":"/api/inspecciones","auth":"bearer","idempotent":false,"assistance":false,"success":{"200":"json"}},
  "POST /api/inspecciones": {"method":"POST","path":"/api/inspecciones","auth":"bearer","idempotent":true,"assistance":false,"success":{"201":"json"}},
  "GET /api/inspecciones/{id}": {"method":"GET","path":"/api/inspecciones/{id}","auth":"bearer","idempotent":false,"assistance":false,"success":{"200":"json"}},
  "PUT /api/inspecciones/{id}/registro": {"method":"PUT","path":"/api/inspecciones/{id}/registro","auth":"bearer","idempotent":false,"assistance":false,"success":{"200":"json"}},
  "POST /api/inspecciones/{id}/cierre": {"method":"POST","path":"/api/inspecciones/{id}/cierre","auth":"bearer","idempotent":true,"assistance":false,"success":{"200":"json"}},
  "GET /api/inspecciones/{id}/reinspecciones": {"method":"GET","path":"/api/inspecciones/{id}/reinspecciones","auth":"bearer","idempotent":false,"assistance":false,"success":{"200":"json"}},
  "GET /api/vehiculos/{id}/historial": {"method":"GET","path":"/api/vehiculos/{id}/historial","auth":"bearer","idempotent":false,"assistance":false,"success":{"200":"json"}},
  "GET /api/configuracion/reglas-inspeccion": {"method":"GET","path":"/api/configuracion/reglas-inspeccion","auth":"bearer","idempotent":false,"assistance":false,"success":{"200":"json"}},
  "POST /api/configuracion/reglas-inspeccion": {"method":"POST","path":"/api/configuracion/reglas-inspeccion","auth":"bearer","idempotent":false,"assistance":false,"success":{"201":"json"}},
  "POST /api/inspecciones/{id}/certificado": {"method":"POST","path":"/api/inspecciones/{id}/certificado","auth":"bearer","idempotent":true,"assistance":false,"success":{"200":"json","202":"json"}},
  "GET /api/certificados": {"method":"GET","path":"/api/certificados","auth":"bearer","idempotent":false,"assistance":false,"success":{"200":"json"}},
  "GET /api/certificados/{id}": {"method":"GET","path":"/api/certificados/{id}","auth":"bearer","idempotent":false,"assistance":false,"success":{"200":"json"}},
  "GET /api/certificados/{id}/pdf": {"method":"GET","path":"/api/certificados/{id}/pdf","auth":"bearer","idempotent":false,"assistance":false,"success":{"200":"pdf"}},
  "GET /api/certificados/{id}/verificacion": {"method":"GET","path":"/api/certificados/{id}/verificacion","auth":"public","idempotent":false,"assistance":false,"success":{"200":"json"}},
  "GET /api/reportes/inspecciones": {"method":"GET","path":"/api/reportes/inspecciones","auth":"bearer","idempotent":false,"assistance":false,"success":{"200":"json"}},
  "GET /api/reportes/alertas": {"method":"GET","path":"/api/reportes/alertas","auth":"bearer","idempotent":false,"assistance":false,"success":{"200":"json"}},
  "GET /api/auditorias": {"method":"GET","path":"/api/auditorias","auth":"bearer","idempotent":false,"assistance":false,"success":{"200":"json"}},
  "GET /api/auditorias/{id}": {"method":"GET","path":"/api/auditorias/{id}","auth":"bearer","idempotent":false,"assistance":false,"success":{"200":"json"}},
  "POST /api/asistencia": {"method":"POST","path":"/api/asistencia","auth":"bearer","idempotent":false,"assistance":true,"success":{"200":"json"}},
} as const;
