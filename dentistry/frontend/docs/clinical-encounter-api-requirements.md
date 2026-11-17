# Solicitud de contrato HTTP: atenciones clínicas de Dentistry

**Dirigido a:** Dentistry Backend y responsable del BFF.  
**Estado:** propuesta. Falta el acuerdo y la implementación. Este documento no es una especificación implementada ni autoriza cambios en `@app/db`.  
**Última actualización:** 2026-11-11. Se re-verificó el estado del código y se añadieron la [ruta de puesta en marcha](#10-plan-de-puesta-en-marcha) y las [necesidades de la ficha y el listado de pacientes](#13-agregados-para-el-listado-y-la-ficha-del-paciente).  
**Documento relacionado:** [clinical-encounter-implementation-plan.md](clinical-encounter-implementation-plan.md).  
**Actualización Backend (2026-11-11):** E1–E5 implementadas en `dentistry/backend` (`modules/clinical-encounter` y `modules/patient`) con las decisiones de §10.1; ver su `README.md`. Frontend conectado: allow-list BFF (§7), adaptador HTTP y listado con envelope; se retiró el mock. Pendientes: alta de permisos en Core y E6. Corrección: `appointmentId` es único en BD también para atenciones anuladas, así que el 409 de §2.3 aplica a cualquier atención existente de la cita.

## Motivo

El contrato Prisma ya contiene `PatientHealthProfile`, `ClinicalEncounter`, `ClinicalEncounterProcedure`, `Treatment`, `TreatmentProcedure`, `ClinicalFile` y `Radiograph`, pero el sondeo de controladores de `dentistry/backend` no halló rutas para esos recursos. Los únicos controladores observados son pacientes, citas, personas, servicios y un health check de infraestructura; el BFF de Dentistry solo permite pacientes, citas, personas y servicios.

La feature `dentistry/frontend/src/features/clinical-encounter/` ya existe como interfaz aislada: el adaptador `services/clinical-encounter.http.ts` rechaza todas las operaciones con `ClinicalEncounterApiUnavailableError` y, en desarrollo, la UI consume `services/clinical-encounter.mock.ts`. El frontend no puede persistir atención clínica usando el prototipo `ClinicalHistory` ni mapearlo a `notes`; tampoco puede inventar rutas. Se solicita acordar los siguientes recursos, payloads y permisos antes de habilitar el adaptador HTTP.

## Estado verificado (2026-11-11)

Se comprobó sobre la rama `dev` (commit `642c640`). Nada de lo pedido en las secciones 1–7 existe todavía fuera del frontend.

| Pieza | Estado | Evidencia |
| --- | --- | --- |
| Modelos en `@app/db` | **Existen**: `PatientHealthProfile`, `ClinicalEncounter`, `ClinicalEncounterProcedure`, `Treatment`, `TreatmentProcedure`, `ClinicalFile`. | `packages/db/src/prisma/schema.ts` (líneas ~681–1016). |
| Migración clínica | **Preparada**: `20261105T1833_dentistry_clinical_procedures`. Hay que confirmar en cada entorno si ya está aplicada. | `packages/db/migrations/app/`. |
| Controladores Dentistry | **No existen.** Solo hay `appointments`, `auth`, `health`, `patients`, `persons` y `services`. | `dentistry/backend/src/modules/*/presentation/http/*.controller.ts`. |
| Permisos `dentistry:encounters:*` | **No existen en Backend.** Ningún controlador los exige. Solo los declaran las personas de desarrollo del frontend. | `features/dev-auth/types/personas.ts`. |
| Allow-list BFF | **Sin reglas clínicas.** Solo cubre `appointments`, `patients`, `persons` y `services`. | `src/infrastructure/http/dentistry-proxy.ts`. |
| Route handler BFF | Exporta solo `GET`, `POST`, `PATCH` y `DELETE`. | `src/app/api/dentistry/[...path]/route.ts`. |
| Adaptador HTTP del frontend | Los 12 métodos rechazan con `ClinicalEncounterApiUnavailableError`. | `services/clinical-encounter.http.ts`. |
| Rutas propuestas del frontend | Codificadas pero no usadas. Son anidadas bajo `/patients/:patientId`. | `api/endpoints.ts`. |
| Utilidades HTTP reutilizables | **Existen**: `requestJson`, `fetchCurrentSession` y `assertSameSessionContext`. | `src/infrastructure/http/request-json.ts`, `src/infrastructure/auth/session-context.ts`, `src/features/auth/services/current-session.client.ts`. |
| Pantallas | **Existen**: listado, alta, detalle y perfil de salud, alimentados por el mock. | `src/app/(platform)/patients/[patientId]/...`. |
| Flag de demo | `NEXT_PUBLIC_CLINICAL_ENCOUNTER_DEMO`. | `config/clinical-encounter-mode.ts`. |

> Observación al margen: las personas de desarrollo declaran `dentistry:services:manage`, pero Backend exige `dentistry:services:create|update|delete`. Esta solicitud no lo corrige; se anota para no repetir el mismo desfase con los permisos clínicos.

## Leyenda: contrato existente y propuesta

| Marca | Significado |
| --- | --- |
| **Existente** | Ya implementado y permitido por el BFF: CRUD de `/patients`, `/appointments`, `/persons` y `/services`. No se modifica en esta solicitud salvo la ampliación de filiación del paciente. |
| **Propuesta frontend** | Ruta codificada hoy en `src/features/clinical-encounter/api/endpoints.ts`, anidada bajo `/patients/:patientId`. No existe en Backend ni en el allow-list del proxy. |
| **Propuesta previa** | Ruta global `/clinical-encounters/:id/...` planteada antes de implementar la feature. Tampoco existe. |
| **Pendiente Backend** | Decisión que este documento no toma: forma de la ruta, permiso, envelope de respuesta, flujo de archivos o regla de cierre. |

Ninguna ruta de este documento debe asumirse aprobada. La decisión entre rutas anidadas y globales queda explícitamente pendiente. Salvo el CRUD de pacientes ya existente, todas las rutas de las secciones 1–7 son propuestas: las anidadas están codificadas en `api/endpoints.ts` y las globales provienen del contrato previo, pero ninguna existe en Backend ni en el BFF.

## Reglas transversales solicitadas

- Autenticar y autorizar todas las rutas en NestJS. Derivar `organizationId`, actor, `createdByMembershipId`, `updatedByMembershipId`, `completedByMembershipId` y `voidedByMembershipId` del principal; no aceptarlos como autoridad del body.
- Limitar todos los recursos a la organización, paciente, sucursal y asignaciones autorizadas. Un id existente en otra organización debe responder como no accesible, no filtrar datos.
- Validar el mismo paciente/organización entre atención, cita, tratamiento, procedimiento planificado y archivo. Respetar los constraints vigentes en `@app/db`.
- Devolver fechas civiles como `YYYY-MM-DD` y los instantes como ISO 8601. Publicar respuestas JSON tipadas y errores consistentes con los recursos existentes.
- Una vez aprobada una ruta, añadirla explícitamente a `dentistry/frontend/src/infrastructure/http/dentistry-proxy.ts`, con método, patrón y query permitidos. No abrir un proxy genérico.

### Permisos

El frontend ya declara y comprueba estos cuatro permisos en `features/dev-auth/types/personas.ts` y en las páginas de listado, alta y detalle. Los nombres siguientes son los que la UI usa hoy, no necesariamente los definitivos del backend. El backend sigue siendo la autoridad: las guardas de UI solo ocultan acciones.

| Operación | Permiso usado por el frontend | Estado |
| --- | --- | --- |
| Listar, obtener, datos de referencia | `dentistry:encounters:read` | Pendiente de confirmación Backend. |
| Crear atención | `dentistry:encounters:create` | Pendiente de confirmación Backend. |
| Completar, corregir, añadir procedimientos | `dentistry:encounters:update` | Pendiente de confirmación Backend. |
| Anular atención o procedimiento | `dentistry:encounters:void` | Pendiente de confirmación Backend. |
| Leer perfil de salud | `dentistry:encounters:read`; se propone mantenerlo o crear `dentistry:patient-health-profile:read` | Pendiente Backend. |
| Guardar perfil de salud | `dentistry:encounters:update`; se propone mantenerlo o crear `dentistry:patient-health-profile:update` | Pendiente Backend. |
| Listar/descargar archivos | Reutilizar `dentistry:encounters:read` o crear `dentistry:clinical-files:read` | Pendiente Backend. |
| Añadir/eliminar archivos | Reutilizar `dentistry:encounters:update` o crear `dentistry:clinical-files:manage` | Pendiente Backend. |

Si Backend crea permisos nuevos, deben añadirse a las personas de desarrollo para que la UI pueda probarlos. Hoy las personas solo declaran los cuatro permisos de `encounters` para el dominio clínico; Recepción no tiene ninguno de ellos, por lo que no accede al perfil de salud.

### Nombres canónicos

Los contratos usan exclusivamente los nombres del tipo implementado en `types/clinical-encounter.ts`: `practitionerMembershipId`, `clinicalEncounterId`, `completedByMembershipId`, `voidedByMembershipId`, `voidReason`, `notes`, `originalFilename`, `sizeBytes`, `targetType`, `toothNumber`, `targetDescription`, `treatmentProcedureId`, `rowVersion`. Categorías de archivo `RADIOGRAPH | PHOTO | DOCUMENT | OTHER`, estado de carga `PENDING | READY | FAILED`, lateralidad `LEFT | RIGHT | BILATERAL`. No se admiten alias como `professionalMembershipId`, `encounterId` en payloads ni `procedurePerformed`.

### Errores

Se solicita mantener el cuerpo de error de Nest (`statusCode`, `message`, `error`) y añadir un `code` estable para que la UI no dependa de comparar textos. El frontend ya distingue por estado HTTP mediante `ApiError.status`; el `message` se muestra al usuario.

| HTTP | Cuándo | Mensaje que la UI necesita |
| --- | --- | --- |
| 400 | Payload o query inválidos, UUID mal formado, fecha no ISO, motivo vacío, pieza no FDI | Mensaje de campo accionable en español; la UI lo muestra tal cual. |
| 401 | Sin sesión | Lo emite el BFF (`Sesión requerida.`); el backend no llega a responder. |
| 403 | Sin permiso o paciente fuera de las asignaciones del profesional | `No tienes permiso para ...` |
| 404 | Recurso inexistente o de otra organización | `No se encontró ... en tu organización.` |
| 409 | Conflicto de estado o duplicado | Mensajes concretos listados por operación. |
| 422 | Regla semántica, si Backend separa validación de negocio de la validación de forma | Mensaje específico; el frontend lo trata como error mostrable. |

No se deben devolver detalles internos, SQL ni ids de otras organizaciones.

## 1. Paciente y perfil de salud

### 1.1 Extensión de paciente existente

Se requiere que `GET /patients/:id`, `POST /patients` y `PATCH /patients/:id` representen, cuando aplique:

```json
{
  "maritalStatus": "string | null",
  "occupation": "string | null",
  "origin": "string | null",
  "address": "string | null"
}
```

`birthDate` y `sex` permanecen opcionales. La edad no se recibe ni persiste. Confirmar si estos campos pueden añadirse al CRUD existente y con qué permiso, manteniendo las validaciones de fecha civil actuales. La UI ya usa el contrato de `features/patient` para resolver el paciente; hoy `maritalStatus`, `occupation` y `origin` no están en `PatientDto`.

### 1.2 Perfil de salud

Un perfil único por paciente. La UI espera un objeto con los seis textos, `updatedAt` y `rowVersion`; el tipo no incluye un indicador de existencia.

| Operación | Ruta anidada propuesta | Ruta global propuesta | Permiso |
| --- | --- | --- | --- |
| Obtener | `GET /patients/:patientId/health-profile` | No aplica | Lectura de perfil (ver tabla de permisos). |
| Crear/actualizar | `PUT /patients/:patientId/health-profile` | No aplica | Escritura de perfil. |

**Request de escritura** (todos los campos aceptan `null`; cadena vacía no representa una respuesta clínica negativa):

```json
{
  "medicalHistory": "string | null",
  "allergies": "string | null",
  "currentMedications": "string | null",
  "dentalHistory": "string | null",
  "relevantConditions": "string | null",
  "observations": "string | null"
}
```

**Respuesta esperada (200):**

```json
{
  "patientId": "uuid",
  "medicalHistory": "string | null",
  "allergies": "string | null",
  "currentMedications": "string | null",
  "dentalHistory": "string | null",
  "relevantConditions": "string | null",
  "observations": "string | null",
  "updatedAt": "ISO-8601",
  "rowVersion": 1
}
```

**Errores:** 400 texto no válido o payload con claves desconocidas; 403; 404 paciente no accesible; 409 si se envía `rowVersion` obsoleto y Backend adopta concurrencia optimista; 422 si se decide una regla semántica adicional.

**Notas de estado e idempotencia:** `PUT` es idempotente para el mismo payload. El servidor deriva `patientId`, autoría y `updatedAt`. Si el perfil no existe, se recomienda responder 200 con los seis campos en `null` y `rowVersion: 0` para que la UI muestre “Sin registrar”; la alternativa 404 con código `HEALTH_PROFILE_NOT_FOUND` obliga al adaptador a sintetizar el objeto vacío. **Pendiente Backend.** Confirmar si se requiere versionado por `rowVersion` y el código que diferencia ausencia de perfil de perfil vacío.

> Restricción del BFF: `dentistry-proxy.ts` solo tipa y reenvía `GET | POST | PATCH | DELETE`, y `app/api/dentistry/[...path]/route.ts` solo exporta esos cuatro métodos. Si Backend exige `PUT`, el BFF debe ampliarse; si no, la operación debe ser `PATCH` o `POST`. **Pendiente Backend/BFF.**

### 1.3 Agregados para el listado y la ficha del paciente

Salen de la revisión de UI del 2026-11-11 (listado de pacientes, detalle del paciente, atenciones y alta). Son lecturas sobre datos ya modelados y no requieren cambios en `@app/db`.

| Necesidad de la UI | Problema actual | Solución solicitada | Prioridad |
| --- | --- | --- | --- |
| KPI “Pacientes activos” | Se cuenta solo sobre las filas ya cargadas, así que el número es falso. | **No requiere endpoint nuevo.** Se resuelve con `GET /patients?status=ACTIVE&pageSize=1` leyendo `pagination.totalItems`. Es tarea del frontend. | Alta |
| KPI “Nuevos este mes” | Mismo problema. No hay filtro por fecha de alta. | Añadir `createdFrom` / `createdTo` (fecha civil `YYYY-MM-DD`, en la zona horaria de la organización) a `GET /patients`. La alternativa es `GET /patients/summary` → `{ "total": 0, "active": 0, "inactive": 0, "createdThisMonth": 0 }`. Con el filtro basta y además sirve para futuros listados. Si se aprueba, añadir los dos parámetros al `QueryPolicy` de `^patients$`. | Media |
| Resumen clínico en la ficha: última atención y atención en curso | La ficha solo muestra datos de contacto. | Reutilizar 2.1 con `pageSize=1`: el orden `startedAt` descendente da la última atención, y `status=IN_PROGRESS` da la que está abierta. **Requiere el envelope con `pagination` (P4)** para saber si hay más. Así no hace falta un endpoint específico. | Alta |
| Alertas de salud en la ficha (alergias, condiciones relevantes) | No se muestran fuera de la página de perfil. | Reutilizar `GET /patients/:patientId/health-profile` (sección 1.2). Hace falta que un perfil inexistente responda 200 con campos `null` (recomendación de la sección 1) para no pintar error en la ficha. | Alta |
| Etiqueta de sexo | Se muestra el enum crudo (`MALE` / `FEMALE` / `OTHER`). | **Sin cambio de API.** El mapeo es del frontend. | — |
| Filtros del historial en la URL | Se pierden al volver desde el detalle. | **Sin cambio de API.** Es del frontend. Basta con que 2.1 acepte `status`, `search`, `page` y `pageSize`. | — |

## 2. Atenciones clínicas

Recurso separado de `Appointment`: una atención puede no tener cita y puede completarse sin procedimientos. El frontend ya asume `IN_PROGRESS → COMPLETED` y `IN_PROGRESS | COMPLETED → VOIDED`.

### 2.0 Representación canónica

Campos mínimos que consume la UI; no es el esquema completo de base de datos:

```json
{
  "id": "uuid",
  "patientId": "uuid",
  "branchId": "uuid",
  "branchName": "string | null",
  "practitionerMembershipId": "uuid",
  "practitionerName": "string | null",
  "startedAt": "ISO-8601",
  "endedAt": "ISO-8601 | null",
  "chiefComplaint": "string | null",
  "examinationSummary": "string | null",
  "diagnosisSummary": "string | null",
  "procedureSummary": "string | null",
  "progressNotes": "string | null",
  "patientInstructions": "string | null",
  "notes": "string | null",
  "status": "IN_PROGRESS | COMPLETED | VOIDED",
  "appointmentId": "uuid | null",
  "treatmentId": "uuid | null",
  "completedAt": "ISO-8601 | null",
  "completedByMembershipId": "uuid | null",
  "completedByName": "string | null",
  "voidedAt": "ISO-8601 | null",
  "voidedByMembershipId": "uuid | null",
  "voidReason": "string | null",
  "rowVersion": 1,
  "procedures": []
}
```

`branchName`, `practitionerName` y `completedByName` son presentación y opcionales: la fuente autorizada de nombres aún no está aprobada. Si faltan, la UI debe mostrar el id o un marcador, no inventar el nombre.

Fila de procedimiento:

```json
{
  "id": "uuid",
  "clinicalEncounterId": "uuid",
  "targetType": "TOOTH | REGION | WHOLE_MOUTH | OTHER",
  "toothNumber": "string | null",
  "targetDescription": "string | null",
  "description": "string",
  "treatmentProcedureId": "uuid | null",
  "status": "RECORDED | VOIDED",
  "voidedAt": "ISO-8601 | null",
  "voidedByMembershipId": "uuid | null",
  "voidReason": "string | null"
}
```

### 2.1 Listar atenciones del paciente

| Método | Ruta anidada (propuesta frontend) | Ruta global (propuesta previa) | Permiso |
| --- | --- | --- | --- |
| GET | `/patients/:patientId/clinical-encounters` | `/clinical-encounters?patientId=:patientId` | `dentistry:encounters:read` |

**Query:**

| Parámetro | Tipo | Reglas |
| --- | --- | --- |
| `status` | `IN_PROGRESS \| COMPLETED \| VOIDED` | Opcional. |
| `practitionerMembershipId` | UUID | Opcional; filtra por responsable. |
| `search` | texto | Opcional, longitud máxima recomendada 100. Debe cubrir los mismos campos que el mock actual: `chiefComplaint`, `examinationSummary`, `diagnosisSummary`, `procedureSummary`, `notes`, `practitionerName`, `branchName` y las descripciones de los procedimientos de la atención. |
| `page` | entero ≥ 1 | Opcional; por defecto 1. |
| `pageSize` | entero 1–100 | Opcional; por defecto 20. |

**Respuesta:** el datasource actual devuelve `ClinicalEncounter[]` y pagina en el mock, sin metadatos. Para que la UI pueda mostrar totales se propone el envelope ya usado por `/patients`:

```json
{
  "items": [ { "id": "uuid", "status": "IN_PROGRESS", "startedAt": "ISO-8601" } ],
  "pagination": { "page": 1, "pageSize": 20, "totalItems": 42, "totalPages": 3 }
}
```

Cada elemento de `items` sería la representación 2.0. Elegir envelope obliga a cambiar `ClinicalEncounterDataSource.list` y el adaptador; elegir un array mantiene el tipo actual pero impide paginación real. **Pendiente Backend/Frontend.** Orden recomendado: `startedAt` descendente, como hace el mock.

La UI actual solo envía `status` y `search` (`utils/encounter-filters.ts` omite `page` y `pageSize`), aunque el tipo admite ambos. `practitionerMembershipId` tampoco se expone en el listado todavía. El backend debe aceptar los parámetros aunque la UI no los use aún.

**Errores:** 400 filtro inválido o UUID mal formado; 403 sin permiso; 404 paciente no accesible; 200 con lista vacía (`[]` o `items: []`) cuando el paciente existe y no tiene atenciones.

**Idempotencia/estado:** lectura pura; no muta nada.

### 2.2 Obtener detalle

| Método | Ruta anidada | Ruta global | Permiso |
| --- | --- | --- | --- |
| GET | `/patients/:patientId/clinical-encounters/:encounterId` | `/clinical-encounters/:encounterId` | `dentistry:encounters:read` |

**Parámetros:** `patientId` y `encounterId` UUID; sin query. Si se elige la ruta global, `patientId` desaparece de la URL y el backend deriva el alcance del recurso.

**Respuesta 200:** representación 2.0 con `procedures` incluidas. Se recomienda incluir también las filas `VOIDED` con `voidReason` para conservar trazabilidad; la UI las distingue por `status`.

**Errores:** 400 id no UUID; 403; 404 si no existe o pertenece a otra organización/paciente.

**Idempotencia/estado:** lectura pura. No se debe devolver 404 por una atención anulada: `VOIDED` es un estado visible.

### 2.3 Crear atención

| Método | Ruta anidada | Ruta global | Permiso |
| --- | --- | --- | --- |
| POST | `/patients/:patientId/clinical-encounters` | `/clinical-encounters` | `dentistry:encounters:create` |

**Request:**

```json
{
  "patientId": "uuid (requerido; si la ruta es anidada debe coincidir con el path)",
  "branchId": "uuid (requerido)",
  "startedAt": "ISO-8601 (requerido)",
  "appointmentId": "uuid | omitido",
  "treatmentId": "uuid | omitido",
  "chiefComplaint": "string | null",
  "examinationSummary": "string | null",
  "diagnosisSummary": "string | null",
  "procedureSummary": "string | null",
  "progressNotes": "string | null",
  "patientInstructions": "string | null",
  "notes": "string | null"
}
```

**Reglas:** `patientId`, `branchId` y `startedAt` son obligatorios. Cita y tratamiento son opcionales. El profesional, `createdByMembershipId`, `organizationId` y el estado inicial `IN_PROGRESS` los deriva el servidor; el cliente no los envía. Si la ruta es anidada, el backend debe validar que `patientId` del body coincide con el path y rechazar la discrepancia con 400, o ignorar el del body.

**Respuesta 201:** representación 2.0 con `status: "IN_PROGRESS"`, `procedures: []`, `rowVersion: 1`.

**Errores:** 400 faltan campos obligatorios, `startedAt` no ISO, UUID inválido, paciente del body distinto del path; 403; 404 paciente, sucursal, cita o tratamiento no accesible; 409 `Ya existe una atención no anulada para esta cita.` cuando `appointmentId` se repite entre atenciones no anuladas; 422 si Backend valida además que la cita no esté cancelada o que la sucursal esté autorizada.

**Idempotencia/estado:** no idempotente. No se debe reintentar a ciegas: el duplicado de cita responde 409. La UI crea primero la atención y después registra procedimientos en una segunda llamada; por diseño, un fallo de procedimientos no revierte la atención y la UI conserva el detalle creado. Un header `Idempotency-Key` no es viable hoy porque el BFF no reenvía cabeceras arbitrarias.

### 2.4 Completar atención

| Método | Ruta anidada | Ruta global | Permiso |
| --- | --- | --- | --- |
| POST | `/patients/:patientId/clinical-encounters/:encounterId/complete` | `/clinical-encounters/:encounterId/complete` | `dentistry:encounters:update` |

**Request:**

```json
{
  "endedAt": "ISO-8601 (requerido)",
  "procedureSummary": "string | null (opcional; ver decisión pendiente)"
}
```

No se envían `completedAt` ni `completedByMembershipId`: los deriva el servidor. `endedAt` es el fin real de la atención; `completedAt` es la finalización documental y son instantes distintos.

**Respuesta 200:** representación 2.0 con `status: "COMPLETED"`, `endedAt`, `completedAt`, `completedByMembershipId` y `rowVersion` incrementado.

**Errores:** 400 `endedAt` ausente, no ISO o anterior a `startedAt`; 403; 404; 409 `Solo se puede completar una atención en curso.` si el estado no es `IN_PROGRESS`; 422 si se decide exigir `procedureSummary` no vacío.

**Idempotencia/estado:** la transición válida es únicamente `IN_PROGRESS → COMPLETED`. Un segundo intento responde 409; la UI no reintenta automáticamente (`retry: false`). Completar no exige procedimientos registrados.

### 2.5 Anular atención

| Método | Ruta anidada | Ruta global | Permiso |
| --- | --- | --- | --- |
| POST | `/patients/:patientId/clinical-encounters/:encounterId/void` | `/clinical-encounters/:encounterId/void` | `dentistry:encounters:void` |

La ruta `/void` está codificada en `api/endpoints.ts`; el contrato previo no la definía.

**Request:**

```json
{ "reason": "string (requerido, no vacío tras trim)" }
```

**Respuesta 200:** representación 2.0 con `status: "VOIDED"`, `voidedAt`, `voidedByMembershipId` derivado de la sesión, `voidReason` y `rowVersion` incrementado. Los procedimientos se conservan.

**Errores:** 400 motivo vacío `El motivo de anulación es obligatorio.`; 403; 404; 409 `La atención ya está anulada.`

**Idempotencia/estado:** se permite anular desde `IN_PROGRESS` o `COMPLETED`. No se borra historial ni se reabre una atención anulada. El autor siempre es la membresía de la sesión.

## 3. Procedimientos realizados

### 3.1 Añadir procedimientos

| Método | Ruta anidada | Ruta global | Permiso |
| --- | --- | --- | --- |
| POST | `/patients/:patientId/clinical-encounters/:encounterId/procedures` | `/clinical-encounters/:encounterId/procedures` | `dentistry:encounters:update` |

**Request:** el servicio del frontend entrega un array de borradores; el adaptador puede envolverlo. Se propone:

```json
{
  "procedures": [
    {
      "targetType": "TOOTH | REGION | WHOLE_MOUTH | OTHER",
      "toothNumber": "string FDI; requerido solo si targetType = TOOTH",
      "targetDescription": "string | null",
      "description": "string (requerido, no vacío)",
      "treatmentProcedureId": "uuid | omitido"
    }
  ]
}
```

Una selección de varias piezas se expande a una fila por pieza, con la misma descripción; no se admite una lista dentro de `toothNumber`. La UI valida FDI con `/^(1[1-8]|2[1-8]|3[1-8]|4[1-8]|5[1-5]|6[1-5]|7[1-5]|8[1-5])$/`; Backend debe validar FDI y puede aceptar un conjunto mayor, nunca menor sin avisar.

**Respuesta 201:** array de filas creadas con `status: "RECORDED"`, en el mismo orden enviado. Si Backend prefiere envelope `{ "items": [...] }`, el adaptador debe mapearlo.

**Errores:** 400 `toothNumber` fuera de `TOOTH`, pieza no FDI, descripción vacía, `targetType` inválido; 403; 404 atención o `treatmentProcedureId` no accesible; 409 `Solo se pueden registrar procedimientos en una atención en curso.`; 422 si el `treatmentProcedureId` pertenece a otro paciente, organización o tratamiento.

**Idempotencia/estado:** solo en `IN_PROGRESS`. El lote debe ser atómico: o se crean todas las filas o ninguna. No hay clave natural de idempotencia; la UI no reintenta automáticamente.

### 3.2 Anular o corregir procedimiento

El contrato previo proponía `POST /clinical-encounters/:id/procedures/:procedureId/void` y `PATCH .../procedures/:procedureId`. **Ninguna está codificada en `api/endpoints.ts`** y la UI no las invoca: hoy solo existe el alta por lote. Se documentan como propuesta no implementada.

- Anular: `POST .../procedures/:procedureId/void` con `{ "reason": "string" }`, permiso `dentistry:encounters:void`, respuesta 200 con la fila en `VOIDED` y su motivo. Errores 400/403/404/409 (atención anulada o fila ya anulada).
- Corregir: `PATCH .../procedures/:procedureId`, permiso `dentistry:encounters:update`, solo antes del cierre. Errores 400/403/404/409.

**Pendiente Backend:** confirmar si se exponen en esta fase. Si no, deben declararse fuera de alcance y la UI no ofrecerá esas acciones.

## 4. Tratamientos, procedimientos planificados y datos de referencia

Aunque `DentalService` tiene CRUD, no reemplaza a `Treatment` ni expone `TreatmentProcedure`. Para mostrar el plan y permitir el vínculo opcional se requiere, como mínimo, lectura autorizada del paciente:

| Operación candidata | Resultado necesario |
| --- | --- |
| `GET /patients/:patientId/treatments` | Tratamientos del paciente, con `serviceId?`, estado, profesional y resumen. |
| `GET /treatments/:id` o inclusión en la anterior | `TreatmentProcedure[]` con `id`, objetivo, pieza/región, descripción, `position` y estado. |

Confirmar filtros/paginación y si los procedimientos cancelados/completados se pueden vincular a una atención. El frontend no creará ni editará planes en esta fase salvo autorización posterior.

### Datos de referencia de la atención

La UI necesita un único recurso para poblar los selectores del alta. `api/endpoints.ts` codifica `GET /patients/:patientId/clinical-encounters/reference-data`; la alternativa global sería `GET /clinical-encounters/reference-data?patientId=:patientId`. **Pendiente Backend.**

| Método | Ruta anidada propuesta | Permiso |
| --- | --- | --- |
| GET | `/patients/:patientId/clinical-encounters/reference-data` | `dentistry:encounters:read` |

**Respuesta 200** (coincide con `EncounterReferenceData`):

```json
{
  "branches": [ { "id": "uuid", "label": "string" } ],
  "practitioners": [ { "id": "uuid", "label": "string" } ],
  "appointments": [ { "id": "uuid", "label": "string" } ],
  "treatments": [ { "id": "uuid", "label": "string" } ],
  "treatmentProcedures": [ { "id": "uuid", "label": "string", "treatmentId": "uuid" } ]
}
```

Todas las colecciones deben estar filtradas por paciente y organización; las sucursales y profesionales, además, por autorización. **Errores:** 400/403/404 paciente no accesible. **Estado:** lectura pura.

No se debe habilitar este endpoint con el actual `GET /clinic/professionals?organizationId=...`, que no aplica las guardas clínicas y no está permitido por el BFF. Ver sección 5.

## 5. Sucursal y profesional

- La atención requiere `branchId`, pero `GET /auth/me` actual no ofrece nombres de sucursal y no se observó un directorio de sucursales de Dentistry. Solicitar una fuente segura de sucursales autorizadas, por ejemplo ampliar `/auth/me` o publicar `GET /clinic/branches` derivado del principal.
- Hay `GET /clinic/professionals?organizationId=...`, pero no aplica guardas de Dentistry y el BFF lo rechaza. Debe reemplazarse o endurecerse antes de uso: sin `organizationId` controlado por cliente, con JWT/permisos, solo membresías elegibles y reglas de sucursal/asignación documentadas. Si la política dicta que el profesional es siempre quien inició sesión, basta publicar su presentación en `/auth/me` y no exponer un selector.
- El alta no envía `practitionerMembershipId`: el mock lo resuelve desde la cita o toma el primer profesional. El backend debe derivarlo de la sesión o de una política explícita. **Pendiente Backend.**

## 6. Archivos y radiografías

No hay flujo de subida disponible. Se solicita definir uno compatible con el BFF de JSON (64 KiB) y con almacenamiento privado; el binario no debe atravesar el proxy ni ir codificado en base64. La UI actual solo maneja metadatos y no implementa subida binaria.

### 6.1 Listar archivos

| Método | Ruta anidada | Ruta global | Permiso |
| --- | --- | --- | --- |
| GET | `/patients/:patientId/clinical-files` | No aplica | Lectura de archivos. |

**Query propuesta:** `clinicalEncounterId` (UUID, opcional) para filtrar los archivos de una atención. El servicio del frontend llama `listFiles(patientId, encounterId)`; el nombre del parámetro debe confirmarse (`clinicalEncounterId` es el canónico, `encounterId` es el nombre interno del método). **Pendiente Backend.**

**Respuesta 200:** array de archivos con los campos de `ClinicalFile`:

```json
{
  "id": "uuid",
  "patientId": "uuid",
  "clinicalEncounterId": "uuid | null",
  "treatmentId": "uuid | null",
  "appointmentId": "uuid | null",
  "originalFilename": "string",
  "category": "RADIOGRAPH | PHOTO | DOCUMENT | OTHER",
  "mimeType": "string",
  "sizeBytes": 1240000,
  "createdAt": "ISO-8601",
  "uploadStatus": "PENDING | READY | FAILED",
  "radiographType": "string | null",
  "toothNumber": "string | null",
  "region": "string | null",
  "laterality": "LEFT | RIGHT | BILATERAL | null",
  "capturedAt": "ISO-8601 | null",
  "notes": "string | null"
}
```

No se exponen `storageProvider`, `bucket`, `objectKey` ni checksum. **Errores:** 400/403/404.

### 6.2 Añadir archivo

| Método | Ruta anidada | Ruta global | Permiso |
| --- | --- | --- | --- |
| POST | `/patients/:patientId/clinical-files` | `POST /clinical-files/upload-intents` (flujo de subida) | Escritura de archivos. |

**Request de metadatos** (lo que la UI puede enviar hoy):

```json
{
  "clinicalEncounterId": "uuid | omitido",
  "treatmentId": "uuid | omitido",
  "appointmentId": "uuid | omitido",
  "originalFilename": "string",
  "category": "RADIOGRAPH | PHOTO | DOCUMENT | OTHER",
  "mimeType": "string",
  "sizeBytes": 1240000,
  "radiographType": "string | omitido",
  "toothNumber": "string | omitido",
  "region": "string | omitido",
  "laterality": "LEFT | RIGHT | BILATERAL | omitido",
  "capturedAt": "ISO-8601 | omitido",
  "notes": "string | omitido"
}
```

**Respuesta 201:** archivo con `uploadStatus` calculado por el servidor. El cliente nunca envía `uploadStatus`, `id`, `patientId`, autoría ni claves de almacenamiento.

**Errores:** 400 categoría o MIME no admitido, `sizeBytes` fuera de límite, `toothNumber` fuera de una categoría radiográfica; 403; 404 atención/paciente no accesible; 422 si los metadatos de radiografía son inconsistentes.

**Idempotencia/estado:** el alta de metadatos no es idempotente. Si se adopta el flujo de subida, el orden es: intención → binario directo al proveedor autorizado → confirmación → archivo `READY`; un fallo deja `PENDING` o `FAILED` y la UI debe poder reintentar. El mock marca `READY` inmediatamente, pero eso no debe trasladarse al contrato real.

### 6.3 Eliminar archivo

| Método | Ruta anidada | Ruta global | Permiso |
| --- | --- | --- | --- |
| DELETE | `/patients/:patientId/clinical-files/:fileId` | No aplica | Escritura de archivos. |

La ruta está codificada en `api/endpoints.ts`; el contrato previo hablaba de “eliminación/anulación trazable” sin fijar método.

**Respuesta:** 204 sin cuerpo (el servicio del frontend devuelve `void`). Alternativa: 200 con el archivo marcado como eliminado.

**Errores:** 403; 404; 409 si el archivo está referenciado y Backend decide no permitir el borrado.

**Idempotencia/estado:** **Pendiente Backend:** confirmar si es borrado físico o lógico con auditoría. La UI actual elimina de la lista; si el backend hace borrado lógico, debe dejar de devolverlo en el listado. No se debe romper la referencia histórica de una radiografía de una atención completada sin decisión explícita.

### 6.4 Descarga

No está codificada. Se propone `GET /patients/:patientId/clinical-files/:fileId/download-url` o incluir un `downloadUrl` de vida corta en la representación. El tipo `ClinicalFile` actual no tiene ese campo, así que elegir la segunda opción exige ampliar el tipo. **Pendiente Backend.**

## 7. Allow-list requerida en `dentistry-proxy.ts`

No se edita el archivo en esta tarea. El formato vigente usa `ProxyMethod` (`GET | POST | PATCH | DELETE`), `pattern` con la constante `UUID = "[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}"` y `QueryPolicy { parameters, maxValueLength?, errorMessage }`. Los patrones se evalúan contra el path sin el prefijo `/api/dentistry`. La tabla principal solo incluye métodos que el proxy ya admite; las propuestas que requieren ampliar el BFF se separan en 7.1.

| Método | Patrón propuesto | Query permitida | Notas |
| --- | --- | --- | --- |
| GET | `^patients/UUID/clinical-encounters$` | `status`, `practitionerMembershipId`, `search`, `page`, `pageSize` | `maxValueLength: 100` para `search`. |
| POST | `^patients/UUID/clinical-encounters$` | — | JSON obligatorio. |
| GET | `^patients/UUID/clinical-encounters/UUID$` | — | |
| PATCH | `^patients/UUID/clinical-encounters/UUID$` | — | Solo si Backend aprueba corrección. |
| POST | `^patients/UUID/clinical-encounters/UUID/complete$` | — | |
| POST | `^patients/UUID/clinical-encounters/UUID/void$` | — | |
| POST | `^patients/UUID/clinical-encounters/UUID/procedures$` | — | |
| POST | `^patients/UUID/clinical-encounters/UUID/procedures/UUID/void$` | — | Solo si se aprueba 3.2. |
| GET | `^patients/UUID/clinical-encounters/reference-data$` | — | Patrón disjunto de `.../UUID$` porque `reference-data` no es UUID. |
| GET | `^patients/UUID/health-profile$` | — | |
| PATCH | `^patients/UUID/health-profile$` | — | Alternativa si no se amplía el BFF. |
| GET | `^patients/UUID/clinical-files$` | `clinicalEncounterId` | Confirmar nombre del parámetro. |
| POST | `^patients/UUID/clinical-files$` | — | Solo metadatos; el binario no pasa por el BFF. |
| DELETE | `^patients/UUID/clinical-files/UUID$` | — | |
| POST | `^clinical-files/upload-intents$` | — | Solo si se adopta el flujo de subida. |
| POST | `^clinical-files/UUID/complete$` | — | Solo si se adopta el flujo de subida. |
| GET (existente) | `^patients$` | Añadir `createdFrom` y `createdTo` a los parámetros actuales | Solo si se aprueba 1.3 (entrega E5). |

Si se eligen rutas globales en lugar de anidadas, la tabla cambia a `^clinical-encounters$` (con `patientId` en la query), `^clinical-encounters/UUID$`, etc. **No se debe añadir ninguna regla hasta que la forma de ruta esté aprobada.**

Restricciones adicionales del proxy que condicionan el contrato:

- Solo reenvía `Authorization`, `Accept` y `Content-Type`; no cabeceras personalizadas como `Idempotency-Key` o `If-Match`.
- Exige `Content-Type: application/json` en `POST`/`PATCH` y limita el cuerpo a 64 KiB.
- Rechaza query params no listados, duplicados o con valor superior a `maxValueLength`.
- `DELETE` no transporta cuerpo: un motivo de anulación debe ir en ruta o en una operación `POST`.
- Convierte 5xx del backend en 502 y timeouts en 504.

### 7.1 Propuesta condicionada a ampliar el BFF

`PUT` no forma parte de `ProxyMethod` (`GET | POST | PATCH | DELETE`) ni está exportado por `app/api/dentistry/[...path]/route.ts`. La fila siguiente es solo una propuesta condicionada; hoy el guardado del perfil debe resolverse con `PATCH` o `POST`, que sí admite el proxy.

| Método | Patrón propuesto | Query permitida | Notas |
| --- | --- | --- | --- |
| PUT | `^patients/UUID/health-profile$` | — | Solo si se amplía `ProxyMethod` y el route handler; no usar hasta entonces. |

## 8. Decisiones pendientes de Backend

| # | Decisión | Opciones | Impacto |
| --- | --- | --- | --- |
| P1 | Forma de las rutas | Anidadas bajo `/patients/:patientId` (las que codifica `endpoints.ts`) o globales `/clinical-encounters/:id` (contrato previo) | Cambia `endpoints.ts`, el adaptador y la allow-list. No hay decisión tomada. |
| P2 | ¿Completar exige `procedureSummary`? | Ver contradicción abajo | Cambia el formulario de cierre y el código de error. |
| P3 | Método del perfil de salud | `PUT` (semántico) o `PATCH`/`POST` (compatible con el BFF actual) | `PUT` obliga a tocar `ProxyMethod` y `route.ts`. |
| P4 | Envelope del listado | `{ items, pagination }` o array plano | El datasource devuelve array; el envelope exige cambiar el tipo y el adaptador. |
| P5 | Permisos de perfil y archivos | Reutilizar `dentistry:encounters:*` o crear permisos nuevos | Los nuevos deben añadirse a las personas de desarrollo. |
| P6 | Profesional y sucursal | Profesional de sesión o selector autorizado; fuente de sucursales | Bloquea los selectores y los nombres de presentación. |
| P7 | Archivos | Flujo de subida, semántica de eliminación y descarga | Bloquea la implementación real de adjuntos. |
| P8 | Procedimientos | Anulación/corrección dentro de esta fase o fuera de alcance | La UI no debe ofrecer acciones no soportadas. |
| P9 | Nombre del filtro de archivos | `clinicalEncounterId` o `encounterId` | Debe coincidir con la allow-list. |
| P10 | `historySnapshot` | Incluirlo en el contrato de lectura o dejarlo fuera de la UI | Existe en `schema.ts` y en el diccionario, pero no en `types/clinical-encounter.ts`. |
| P11 | Catálogo de `code` de error | Añadir `code` estable o depender de `statusCode` + `message` | Sin `code`, la UI compara textos en español, lo que es frágil. |

### P2 — Contradicción documental sobre `procedureSummary`

Hay dos reglas incompatibles:

- El [plan de implementación](clinical-encounter-implementation-plan.md) (regla 7) y la sección 2 de este documento dicen que completar **no** exige `procedureSummary` y que una atención puede cerrarse con cero procedimientos.
- `packages/db/docs/target-schema-dictionary.md` §4.4 (línea 514) dice: “Completar requiere endedAt, completedAt, completedByMembershipId y procedureSummary no vacío”.
- El mismo diccionario, en la extensión del flujo de atención de 2026-11-05 (línea 991), dice lo contrario: “`procedureSummary` permanece para narrativa o compatibilidad, pero ya no es obligatorio para completar”.
- `packages/db/src/prisma/schema.ts` define `procedureSummary` como `field.text().optional()`, por lo que la base no puede imponer la obligatoriedad sin una validación de aplicación.

**Opciones:**

1. **No exigirlo (recomendada):** se alinea con el schema, con la extensión más reciente del diccionario y con la UI actual. `procedureSummary` queda opcional; completar responde 200 aunque venga vacío o ausente. Habría que corregir §4.4 del diccionario en una tarea documental aparte.
2. **Exigirlo:** el cierre debe enviar un texto no vacío; la UI añade el campo como obligatorio y Backend responde 400/422 con un mensaje específico. Esta opción contradice el schema actual y obliga a validar en aplicación.

**Decisión pendiente con Backend.** Hasta que se resuelva, la UI no exige el campo y el mock permite completar sin él.

## 9. Qué falta para pasar de mock a HTTP real

1. **Backend:** implementar controladores, DTOs, casos de uso y guardas para cada operación aprobada. Confirmar si la migración `20261105T1833_dentistry_clinical_procedures` está aplicada en el entorno destino antes de exponer endpoints; el contrato local ya contiene los campos, pero el diccionario registra que la migración estaba preparada y no aplicada.
2. **Contrato:** congelar rutas (P1), envelope (P4), permisos (P5), errores (P11) y la decisión de `procedureSummary` (P2).
3. **BFF:** añadir las reglas de la sección 7 y decidir si se amplía `ProxyMethod` para `PUT` (P3). Sin allow-list, el proxy responde 404 `Ruta o método no permitido.` aunque el backend exista.
4. **Adaptador HTTP:** implementar `services/clinical-encounter.http.ts` con `requestJson`, comprobación de contexto de sesión como en `features/patient` (`fetchCurrentSession` + `assertSameSessionContext`) y mapeo de errores a `ApiError`/mensajes. Hoy los doce métodos rechazan con `ClinicalEncounterApiUnavailableError`.
5. **Paginación:** ajustar `ClinicalEncounterDataSource.list` y la UI si se adopta el envelope; hoy el mock pagina en memoria y devuelve un array.
6. **Perfil de salud:** definir la respuesta para perfil inexistente y, si se usa `PUT`, ampliar el BFF.
7. **Archivos:** definir el flujo de subida y descarga; el adaptador no debe enviar binarios por el BFF ni aceptar claves de storage.
8. **Flag:** con el adaptador real, apagar `NEXT_PUBLIC_CLINICAL_ENCOUNTER_DEMO` (`false`) en desarrollo y pruebas. En producción ya está apagado duro. El flag es `NEXT_PUBLIC_`, por lo que se inlinea en build: cambiarlo exige reconstruir.
9. **Rutas y vistas UI:** las cuatro rutas de `src/app/(platform)/patients/[patientId]` y sus componentes `*-page` ya existen (verificado el 2026-11-11). Lo pendiente es que esas pantallas dejen de depender del mock cuando el adaptador real esté activo.
10. **Pruebas:** añadir pruebas del adaptador (mapeo request/response, errores, paginación), del proxy (método, patrón y query permitidos) y de integración en Backend. Hoy existen pruebas de mock, utilidades, formulario de alta, detalle, filtros y perfil de salud (`tests/clinical-encounter-*.test.mjs`), que no cubren HTTP.

11. **Catálogo de permisos:** Backend no exige hoy ningún `dentistry:encounters:*`. Los códigos aprobados (P5) deben darse de alta en el catálogo de permisos de Core y asignarse a roles, porque el token de Dentistry solo transporta los permisos `dentistry:*` que Core concede (`audience-permission-filter.ts`). Ese alta se hace por el procedimiento canónico, nunca con SQL directo. Luego hay que alinear `personas.ts`.

## 10. Plan de puesta en marcha

### 10.1 Decisiones recomendadas para desbloquear

Las propone el frontend para que Backend pueda empezar. Cada una sigue requiriendo confirmación explícita.

| # | Recomendación | Motivo |
| --- | --- | --- |
| P1 | **Rutas anidadas** bajo `/patients/:patientId` | Son las que ya codifica `endpoints.ts`, siguen el patrón de los recursos de paciente y facilitan la allow-list. |
| P2 | **No exigir `procedureSummary`** para completar | Coincide con el schema (`optional()`), con la extensión del diccionario del 2026-11-05 y con la UI. |
| P3 | **`PATCH`** para el perfil de salud | Funciona con el BFF actual sin tocar `ProxyMethod` ni `route.ts`. |
| P4 | **Envelope `{ items, pagination }`** | Hace falta para el resumen clínico de la ficha (1.3) y es consistente con `/patients`. |
| P5 | Reutilizar `dentistry:encounters:read|create|update|void` en la primera entrega | Evita crear permisos que hoy ninguna pantalla distingue. Los permisos de archivos se deciden con P7. |
| P6 | **El profesional es la membresía de la sesión.** Las sucursales salen de una fuente autorizada derivada del principal. | Elimina el selector de profesional y el uso de `GET /clinic/professionals`. |
| P8 | Anular o corregir procedimientos **queda fuera de la primera entrega** | La UI no lo invoca hoy. |
| P11 | Añadir `code` estable a los errores | Evita que la UI compare textos en español. |

### 10.2 Entregas incrementales

Cada entrega se puede activar por separado: Backend implementa y prueba, Frontend añade la allow-list y la conexión en el adaptador, y luego se habilita en QA.

| Entrega | Endpoints | Desbloquea | Depende de |
| --- | --- | --- | --- |
| **E1: Registrar una atención** | `GET .../clinical-encounters/reference-data` (4), `POST .../clinical-encounters` (2.3), `GET .../clinical-encounters/:id` (2.2), `POST .../:id/procedures` (3.1) | Pantalla “Nueva atención” completa y detalle de solo lectura | P1, P5, P6; migración aplicada |
| **E2: Historial** | `GET .../clinical-encounters` con envelope (2.1) | Listado de atenciones y resumen clínico de la ficha | P4 |
| **E3: Ciclo de vida** | `POST .../:id/complete` (2.4), `POST .../:id/void` (2.5) | Acciones de cerrar y anular en el detalle | P2 |
| **E4: Perfil de salud** | `GET` y `PATCH .../health-profile` (1.2) | Página de perfil y alertas en la ficha | P3 |
| **E5: Agregados de pacientes** | `createdFrom` / `createdTo` en `GET /patients` (1.3) | KPIs veraces del listado | — |
| **E6: Archivos** | Sección 6 | Adjuntos y radiografías | P7, P9 |

### 10.3 Pasos por entrega

1. **Backend:** módulo `clinical-encounter` en `dentistry/backend` (controlador, DTOs, casos de uso, repositorio sobre `@app/db`) con `DentistryJwtGuard`, `DentistryPermissionGuard` y `@RequirePermission`, igual que `patient.controller.ts`. Pruebas HTTP de autorización como `tests/patient-http-auth.test.mjs`.
2. **Permisos:** alta de los códigos en el catálogo de Core y asignación a roles (punto 11 de la sección 9).
3. **BFF:** añadir solo las reglas de la entrega en `dentistry-proxy.ts` (tabla de la sección 7), con pruebas de método, patrón y query.
4. **Adaptador:** implementar los métodos de la entrega en `clinical-encounter.http.ts` con `requestJson` y la comprobación de sesión. Los métodos que todavía no tienen endpoint siguen rechazando con `ClinicalEncounterApiUnavailableError`.
5. **Activación:** construir con `NEXT_PUBLIC_CLINICAL_ENCOUNTER_DEMO=false` en el entorno de prueba. Como el flag se inlinea en build, hay que reconstruir.
6. **Validación en QA:** flujo completo con las personas Odontólogo y Recepción, verificando los casos 403, 404 y 409 de cada operación.

> Sobre la activación parcial: el flag elige el datasource completo (mock o HTTP). Para activar E1 sin E2–E6 hay que decidir entre dos opciones. **(a)** Mantener el mock hasta completar E1+E2 y E3. **(b)** Hacer que el adaptador HTTP delegue en el mock, solo en desarrollo, los métodos no disponibles. Se recomienda **(a)**: la pantalla de detalle necesita E3 para no ofrecer acciones que fallen. **Pendiente Frontend.**

## Aceptación requerida

Antes de implementar pantallas persistentes, Backend y Frontend deben acordar para cada operación: ruta, método, permiso, request/response exacto, errores, reglas de estado, paginación, autorización y prueba de integración. Backend implementa y prueba primero; luego Frontend agrega la allow-list BFF y los tipos/hook que correspondan. Cualquier necesidad de cambio en `@app/db` se tramita como una tarea separada siguiendo el procedimiento canónico de `packages/db`.

Ninguna de las rutas de este documento está aprobada por el hecho de estar codificada en `api/endpoints.ts`: ese archivo es una propuesta del frontend y el adaptador HTTP todavía no la usa.
