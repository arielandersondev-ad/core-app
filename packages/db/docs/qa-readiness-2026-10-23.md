# Inventario de QA previo a la migración de datos

**Actualización posterior:** el usuario confirmó el respaldo USB y aprobó las reglas
de conciliación. La migración definitiva y su ensayo con rollback se describen en
[target-schema-migration.md](target-schema-migration.md). Este inventario conserva los
hallazgos previos; no representa el estado posterior a una aplicación.

Inspección completada el 23/10/2026 a las 08:47:46, America/La_Paz (12:47:46 UTC). Rama local: `dev`.

## Resultado

El paso 1 está completado: se confirmó el estado de QA y se identificaron los datos que requieren reglas de conciliación. La base conserva el contrato nominal anterior; todavía no está preparada para aplicar directamente el borrador del schema objetivo. No se modificaron tablas, filas, permisos, marcadores ni migraciones.

Se ejecutaron 230 SELECT en una transacción `REPEATABLE READ READ ONLY`, con timeout de sentencia de 15 segundos y de espera de locks de 2 segundos. Se verificó `transaction_read_only=on`. El resultado se conserva en [qa-readiness-2026-10-23.json](qa-readiness-2026-10-23.json). El reporte contiene metadatos y conteos; no contiene nombres/documentos de pacientes, fechas de nacimiento completas, textos clínicos, contraseñas, tokens o claves de objetos almacenados.

## Versión y estructura observadas

| Comprobación | Resultado |
|---|---|
| Plataforma / base | Neon PostgreSQL 18.6 / `dev` |
| Configuración | `packages/db`, Core backend y Dentistry backend apuntan a la misma conexión |
| Marcador real `app` | `826ded8772e9b65bde90c34fca480644ba91128c6488fb4760219a138a807945` |
| Última migración en el ledger | `20261022T1348_semantic_standardization`, aplicada el 22/10/2026 a las 11:47:08 Bolivia |
| Contrato local objetivo | `a2da18a1e42ff8ae6f0d46751f9a5a2e83a412042830e84417c6b6cec115f99b` |
| Inventario real | 25 tablas, 318 columnas y 131 filas de aplicación |
| Comparación con el snapshot nominal | Sin tablas/columnas inesperadas ni diferencias de tipo, nulabilidad o longitud comprobadas |
| Diferencia hacia el objetivo | 4 tablas nuevas, 20 columnas nuevas en tablas existentes, 14 retiros y 128 conversiones de tipo |
| RLS en estas tablas | No está habilitado; los conteos no están filtrados por políticas RLS |

La comparación de columnas anterior no certifica equivalencia completa de defaults, índices, triggers y funciones con un contrato. Sus definiciones observadas se conservan en el JSON para la preparación de la migración. No se forzó ningún marcador ni se ejecutó `db:update`, `db sign`, `migrate` o `migration:plan`.

La referencia local `migrations/app/refs/db.json` sigue en `e895710bb8af14d332edc7b921da8bccdf0a24bec3aee590d47ff063fc4d2598`; no es el estado real de QA. Antes de planificar la migración definitiva hay que utilizar el punto de partida real de forma explícita. No se corrigió ni se reescribió esa referencia durante el inventario.

## Datos existentes

| Schema | Tabla | Filas |
|---|---|---:|
| core | AuditLog | 16 |
| core | AuthSession | 0 |
| core | Branch | 4 |
| core | Organization | 3 |
| core | OrganizationMembership | 5 |
| core | OrganizationMembershipBranch | 5 |
| core | OrganizationMembershipRole | 5 |
| core | OrganizationPlanAssignment | 1 |
| core | Permission | 19 |
| core | Plan | 1 |
| core | Role | 5 |
| core | RolePermission | 19 |
| core | User | 5 |
| core | UserCredential | 5 |
| dentistry | Patient | 10 |
| dentistry | PatientHealthProfile | 1 |
| dentistry | Appointment | 6 |
| dentistry | AppointmentService | 0 |
| dentistry | ClinicalEncounter | 3 |
| dentistry | DentalService | 12 |
| dentistry | DentalServiceSupply | 0 |
| dentistry | Treatment | 3 |
| dentistry | Payment | 3 |
| dentistry | ClinicalFile | 0 |
| dentistry | Radiograph | 0 |

## Hallazgos que afectan a la migración

| Hallazgo | Evidencia | Tratamiento requerido antes de aplicar |
|---|---|---|
| Fecha civil mezclada con horas | Los 10 pacientes tienen `birthDate`: 5 a `00:00:00` y 5 a `20:00:00`. No hay fechas futuras. | Confirmar la fecha civil originalmente introducida. No usar una truncación global ni sumar un día sin evidencia del origen de cada grupo. |
| Servicios de citas todavía en la columna retirada | Las 6 citas tienen un servicio sin vínculo equivalente; `AppointmentService` tiene 0 filas. | Conservar los 6 vínculos mediante la asociación canónica antes de retirar `Appointment.serviceId`, sin duplicados ni precios históricos inventados. |
| Estados y cierre clínico faltantes | Hay 3 atenciones sin la futura columna `status`. Las 3 tienen `procedureSummary`; solo 1 tiene `endedAt`. Ninguna tiene `updatedByMembershipId` y no se encontraron eventos con los nombres de recursos clínicos consultados en `AuditLog`. | Definir el estado con evidencia. `endedAt` no demuestra cierre documental ni identifica al profesional que lo finalizó. No inventar `completedAt` o `completedByMembershipId` desde el autor de alta. |
| Derechos comerciales sin contenido | El único `Plan.entitlements` es `{}`: no tiene versión, límites ni funcionalidades. Existe 1 asignación que necesitará `entitlementsSnapshot`. | Determinar los derechos concedidos y versionarlos. Añadir solo `schemaVersion` no resuelve la ausencia de derechos. |
| Plan registrado en otra organización que los pacientes | La organización con asignación Dentistry tiene 1 sucursal activa, 1 membresía ACTIVE/INVITED y 0 pacientes. Los 10 pacientes están fuera de esa organización. | Confirmar qué organizaciones deben tener acceso comercial. No mover pacientes ni asignar planes/accesos automáticamente para hacer coincidir los datos. |
| Zonas horarias sin normalizar | 1 organización usa `La-Paz`, no reconocida por Node Intl. 2 sucursales usan `America/La_paz`: Intl la acepta y la normaliza como `America/La_Paz`. Las demás etiquetas ya son canónicas. | Validar la intención de la organización y normalizar las etiquetas. El candidato coherente con las otras configuraciones es `America/La_Paz`; no se aplicó. |
| TIMESTAMP sin zona con datos | Hay 29 valores no nulos en campos que pasarán a TIMESTAMPTZ, además de los 10 cumpleaños que pasarán a DATE. La sesión de la base usa GMT. | Acordar la zona de interpretación de los timestamps de origen por flujo/columna. La zona actual del servidor no demuestra cómo se guardaron históricamente. No reinterpretar `createdAt`/`updatedAt`, que ya son TIMESTAMPTZ. |

El patrón de cumpleaños a las 20:00 es compatible con haber convertido medianoche UTC a hora boliviana antes de almacenar un TIMESTAMP. Es una inferencia técnica, no una confirmación del día que corresponde a cada paciente. No se exportaron cumpleaños completos para probarla.

La correspondencia comercial se comprobó por ids y conteos de organización, sin exportar nombres de personas. La asignación registrada no excede los cupos base propuestos de sucursales/membresías/pacientes, pero eso no habilita automáticamente los datos clínicos de otras organizaciones.

## Comprobaciones sin anomalías detectadas

- Los 374 valores UUID no nulos comprobados admiten conversión a UUID nativo; no se encontraron colisiones en las claves normalizadas comprobadas.
- Las 54 verificaciones de PK/UNIQUE aplicables a tablas existentes no encontraron duplicados. Las columnas obligatorias ya existentes no contienen nulos incompatibles.
- Las 37 FK objetivo evaluables y las 32 comprobaciones de referencias Dentistry→Core no encontraron huérfanos ni incoherencias de organización/paciente en las relaciones comprobadas. También se verificó la coherencia de organización entre membresía/sucursal, membresía/rol y sucursal de auditoría.
- No hay contradicciones entre `deleted` y `deletedAt` en las 11 tablas donde se retirará el flag.
- De los 46 CHECK objetivo evaluables con las columnas actuales, el único incumplimiento es el JSON de derechos del plan sin versión. No se declara que hayan pasado los 65 CHECK futuros: algunos dependen de columnas o tablas que aún no existen.
- No hay insumos con `inventoryItemId` que preservar, porque no existen filas de insumos. Tampoco existen archivos ni radiografías con fechas que conciliar o estados de subida que rellenar.
- Los estados existentes de tratamientos (`IN_PROGRESS`, `COMPLETED`) y pagos (`COMPLETED`) son compatibles con los catálogos objetivo comprobados.

## Pendientes funcionales separados

Las cuatro tablas nuevas siguen ausentes en QA: `OrganizationFeatureTrial`, `PatientPractitionerAssignment`, `PatientBranchAssignment` y `BranchSchedulingPolicy`. Esta ausencia corresponde al contrato anterior, no a una corrupción del schema.

Crear las tablas no concede derechos. Los 10 pacientes necesitarán asignaciones clínicas explícitas cuando se implemente ese flujo; no se deben deducir de `createdByMembershipId`, citas o sucursales. No se crearon pruebas de planes ni se fabricaron relaciones.

## Repetición y siguiente paso

Script: [audit-target-readiness.mjs](../scripts/audit-target-readiness.mjs).

```powershell
npm.cmd --prefix packages/db run audit:qa
# Otra evidencia local, sin sobrescribir el archivo por fecha:
npm.cmd --prefix packages/db run audit:qa -- --output packages/db/docs/qa-readiness-recheck.json
```

El script exige una base llamada `dev`, abre una transacción de solo lectura y valida ese modo antes de consultar. La salida por defecto reemplaza el reporte de la misma fecha. Cada ejecución representa una instantánea consistente propia; los conteos pueden cambiar si se sigue usando QA. No es un respaldo ni un ensayo de migración.

El siguiente paso autorizado por separado será preparar el respaldo y comprobar la recuperación. Antes de generar SQL definitivo también deben cerrarse las decisiones sobre cumpleaños, timestamps, cierre de las 3 atenciones y derechos/organizaciones comerciales. El borrador actual continúa bloqueado y fuera del grafo ejecutable.
