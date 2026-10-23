# Migración definitiva del schema objetivo

Fecha: 23/10/2026. Rama: `dev`. Base autorizada: QA `dev` en la conexión existente.
El usuario confirmó disponer de un respaldo en USB y utilizar QA como entorno de ensayo.
El agente no verificó la restauración de ese respaldo.

## Paquete y alcance

Paquete: [20261023T1300_target_schema](../migrations/app/20261023T1300_target_schema/migration.sql).
Origen: `826ded8772e9b65bde90c34fca480644ba91128c6488fb4760219a138a807945`.
Destino: `a2da18a1e42ff8ae6f0d46751f9a5a2e83a412042830e84417c6b6cec115f99b`.

Se conservan las 25 tablas y todas sus entidades. Se crean las cuatro tablas previstas,
se retiran las 14 columnas del diccionario y se realizan las 128 conversiones de tipo.
Las FK e índices secundarios se reconstruyen para admitir UUID nativos y las claves
compuestas del objetivo. No se eliminan tablas, PK, organizaciones ni pacientes.
No se reescribe ninguna migración aplicada. El borrador de placeholders nunca se ejecutó y se retiró durante la limpieza posterior.

La operación SQL es un bloque atómico con lock de las tablas, espera máxima de lock
de 10 segundos y comprobación del marcador de origen. No toca el marcador ni el ledger:
la aplicación y su registro corresponden exclusivamente al CLI canónico.
Los nuevos CHECK, UNIQUE y FK se validan antes de confirmar la operación.

## Reglas de datos aprobadas

| Datos | Conversión |
|---|---|
| UUID | Cast a UUID nativo conservando identidad; no se regeneran PK existentes. |
| Instantes sin zona | Interpretación explícita `AT TIME ZONE 'America/La_Paz'`. Los TIMESTAMPTZ existentes se conservan. |
| Cumpleaños | Se conserva el día almacenado con `birthDate::date`, incluso en los cinco valores a las 20:00. No se suma un día. |
| Servicios de citas | Insertar vínculos faltantes en `AppointmentService` antes de retirar `Appointment.serviceId`. Conservar asociaciones existentes. Los vínculos nuevos reciben UUID aleatorio nativo y fecha de migración; precio, moneda y duración históricos permanecen nulos. No se copian precios actuales del catálogo. |
| Tres atenciones de prueba | La única con `endedAt` pasa a COMPLETED, `completedAt=endedAt` y `completedByMembershipId=practitionerMembershipId`; las otras dos a IN_PROGRESS. No se crea `historySnapshot`. Es una excepción aprobada para este conjunto de prueba. |
| Plan vacío | `schemaVersion: 1`; límites de 300 pacientes, 1 sucursal y 2 miembros. Funciones habilitadas: clinicalHistory, appointments, procedureNotes. Deshabilitadas: customForms, payments, treatments, odontogram, files, patientSelfService. |
| Asignación de plan existente | Capturar esos derechos en `entitlementsSnapshot`, sin cambiar organización, plan, estado o vigencia. No conceder planes a otras organizaciones. |
| Etiquetas horarias | Normalizar `La-Paz` y `America/La_paz` a `America/La_Paz` en organizaciones/sucursales. |
| Borrado lógico | Exigir coherencia del flag con `deletedAt` antes de retirar el flag; no inventar fechas. |
| Tablas nuevas | Vacías. No deducir asignaciones clínicas/sucursales desde autores o citas; no activar trials ni configurar capacidad automáticamente. |

Se detiene la migración si cambia el conjunto de tres atenciones, el único plan vacío,
la estructura fuente, aparecen archivos/radiografías/insumos, precios de asociaciones sin
moneda histórica o contradicciones de borrado. Se requiere revisión del dato nuevo;
no hay una rutina genérica que borre o invente hechos para superar los controles.

## Verificación realizada antes de aplicar

1. Pruebas de PostgreSQL aislado: transformación efectiva del snapshot nominal al objetivo,
   preservación de una asociación preexistente, fecha civil, interpretación de instantes,
   snapshots, ausencia de concesiones, rollback y rechazo de cohortes diferentes.
2. 29 pruebas en conjunto: schema objetivo, migración nominal histórica, nueva migración
   e integración de repositorios/runtimes de ambos backends.
3. Ensayo real en QA dentro de una transacción con rollback obligatorio:
   [target-schema-rehearsal-2026-10-23.json](target-schema-rehearsal-2026-10-23.json).
   Compara huellas de **todos los valores conservados por PK**, proyectando únicamente
   las conversiones aprobadas. No exporta identidades, textos clínicos ni credenciales.
   Valida 29 tablas, 362 columnas, 43 FK, 65 CHECK, snapshots y mapeo de estados.
   Confirma después del rollback las 318 columnas y el marcador de origen.

El ensayo conserva las 131 filas originales y agrega seis asociaciones dentro de la
transacción, que también se revierten. No equivale a restaurar el respaldo USB ni a
probar la navegación HTTP de los frontends.

## Comprobaciones actuales y aplicación del paquete

Desde la raíz del repositorio:

```powershell
npm.cmd --prefix packages/db run test:migration
npm.cmd --prefix packages/db run migrate -- --to a2da18a1e42ff8ae6f0d46751f9a5a2e83a412042830e84417c6b6cec115f99b --advance-ref db
npm.cmd --prefix packages/db run db:verify -- --strict
npm.cmd --prefix packages/db run migration:status
```

`migrate --to` aplica el paquete ya emitido cuando corresponde al estado de la base;
en esta QA ya está aplicado. No hace falta generar otra migración ni emitir de nuevo
los tipos. No ejecutar `db:update`, `db sign` ni reset para alterar ese estado.

Para autoría se usó un generador de una sola ejecución y luego el self-emit del
`migration.ts` con el CLI instalado. El generador y los scripts puntuales de ensayo
y comparación de QA fueron retirados después de guardar el estado en `8dd6354`.
Sus informes JSON se conservan como evidencia histórica. Las pruebas siguen comparando
SQL legible, operación emitida y ambos snapshots mediante los helpers conservados.

## Compatibilidad y recuperación

Los dos backends deben utilizar la adaptación del contrato objetivo y reiniciarse
coordinadamente. El código anterior depende de campos/tipos retirados. Revertir solo
el código después del cambio de BD no restaura compatibilidad. Antes del commit, un
fallo de SQL revierte el bloque; después del commit la recuperación completa requiere
el respaldo o una migración correctiva revisada. No se publica un down automático que
elimine los nuevos hechos o revierta fechas de forma ambigua.

Los flujos de asignaciones clínicas, agenda por propietario/empleado, cupos y trial
siguen pendientes. Esta migración no implementa esas reglas de autorización ni despliega
servicios. Deben validarse los endpoints existentes y después continuar con esos flujos.

## Estado de aplicación

**Aplicada y verificada en QA el 23/10/2026.** El CLI aplicó una migración/una operación
el 23/10 a las 09:25:35 America/La_Paz (13:25:35 UTC). Hash de la migración:
`cfe342a9f2df3452ef9d1c9dbfddb85fc175f50522ced12d8a8fba0007812941`.
El marcador final es el destino documentado; `--advance-ref db` actualizó la referencia
local por el mecanismo del CLI, sin editar markers ni forzar firmas.

- `db:verify --strict`: esquema y marcador coinciden con el contrato; sin advertencias
  ni objetos no reclamados. La verificación del CLI indica codecCoverageSkipped;
  se comprobó adicionalmente el runtime real en las lecturas indicadas debajo.
- `migration:status`: `Up to date`; nueva migración `applied`.
- Verificación posterior de datos en transacción de solo lectura: todas las huellas
  de valores conservados coinciden con el ensayo y se mantienen las 131 filas originales.
  Hay 137 filas finales por las seis asociaciones recuperadas, sin duplicados.
  Las cuatro tablas nuevas permanecen vacías y los estados clínicos son 1 COMPLETED
  y 2 IN_PROGRESS. No se concedieron planes ni accesos adicionales.
- El runtime real de Prisma consultó correctamente la forma completa de los 29 modelos
  usando la conexión de QA y su marcador. El reporte solo guarda éxito y existencia
  de filas, nunca sus contenidos.

Evidencia posterior: [target-schema-applied-2026-10-23.json](target-schema-applied-2026-10-23.json).
La comparación posterior contrastó una instantánea con el ensayo; los conteos/huellas
pueden cambiar legítimamente con el uso de QA. Su script y comando npm se retiraron
en la limpieza posterior: no eran un test funcional permanente.

No hace falta generar/aplicar otra migración ni regenerar los tipos por este paso.
Falta reiniciar/probar ambos backends y realizar el recorrido HTTP de login, pacientes,
servicios y citas con sus frontends. No se inició ni desplegó ningún servicio en esta tarea.
Después se pueden implementar los flujos nuevos del plan base, empezando por las
asignaciones y el alcance clínico de propietario/empleado.
