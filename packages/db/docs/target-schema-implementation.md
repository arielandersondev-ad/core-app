# Implementación del schema objetivo completo

**Actualización 23/10/2026:** las decisiones de datos ya fueron aprobadas y la migración
definitiva se ensayó con rollback en QA. Consultar [target-schema-migration.md](target-schema-migration.md)
para el paquete ejecutable, comandos y estado real. Las advertencias siguientes sobre
ausencia de paquete seguro describen la entrega inicial del 22/10; el borrador sigue sin ejecutarse.

Fecha: 2026-10-22. Rama: dev. Alcance confirmado por usuario: solo schema completo, incluidos retiros de columnas y cambios de tipos; adaptación de backends posterior. No se ejecutaron migraciones ni consultas contra QA durante esta tarea.

Actualización posterior: los endpoints existentes de ambos backends ya fueron adaptados y comprobados localmente. Véase [backend-schema-adaptation.md](backend-schema-adaptation.md). Los párrafos de esta entrega original que indican backends sin adaptar describen su baseline; la migración de datos definitiva y los flujos nuevos siguen pendientes. No cambió la condición de no aplicar el borrador a QA.

## Resultado local

- Un único contrato en src/prisma/schema.ts: 29 tablas, 362 columnas y 43 FK físicas, todas dentro de su schema.
- Se reutilizan las 25 tablas existentes y se añaden exactamente OrganizationFeatureTrial, PatientPractitionerAssignment, PatientBranchAssignment y BranchSchedulingPolicy. No se crean tablas paralelas de paciente, agenda, historia, procedimiento o tratamiento.
- Se retiran exactamente las 14 columnas documentadas: deleted en 11 tablas, Appointment.serviceId, DentalServiceSupply.inventoryItemId y Radiograph.takenAt. AppointmentService conserva la relación con servicios; ClinicalFile.capturedAt conserva la fecha de captura.
- UUID nativo con generador UUIDv7, instantes TIMESTAMPTZ y Patient.birthDate DATE. Estos tipos y los campos retirados son incompatibles con el código anterior.
- Campos clínicos de examen, cierre, anulación, versiones e historySnapshot; snapshot comercial, contexto del actor en auditoría, moneda del servicio previsto y estado de subida de archivos.
- FK compuestas de Dentistry protegen organización y, en referencias a citas/atenciones/tratamientos, también paciente. UNIQUE e índices parciales evitan asociaciones activas duplicadas. Ninguna FK usa cascade-delete.
- Las reglas de roles, cupos, solapamientos, visibilidad, transiciones y administración de asignaciones requieren validación transaccional en el backend. No se consideran implementadas por crear columnas o CHECKs. Los catálogos administrativos pendientes P7 permanecen como texto sin cerrar sus valores por anticipación.

| Referencia | Valor |
|---|---|
| Contrato de partida confirmado por usuario en QA | 826ded8772e9b65bde90c34fca480644ba91128c6488fb4760219a138a807945 |
| Storage hash objetivo | a2da18a1e42ff8ae6f0d46751f9a5a2e83a412042830e84417c6b6cec115f99b |
| Execution hash objetivo | 69e26e7776c261184c82e5c79232cc89685ab665e0a047f8a53894adbc6c5303 |
| Profile hash | 3916f444a8a17ad749191acf9e08dad97d1a327b88c2f1d45d12f240296aa8b2 |

Los artefactos JSON/d.ts se regeneraron mediante el CLI instalado; no se editaron a mano. La compilación de @app/db copia el mismo contrato a dist. No se cambiaron dependencias, migraciones aplicadas, refs ni marcadores de base.

## Verificaciones

- contract:emit y build de @app/db completados.
- Ocho pruebas de target-schema pasan: inventario exacto, correspondencia de todas las columnas con el diccionario, retiros precisos, tipos, FK y sus claves únicas, unicidad de asignaciones, ausencia de defaults clínicos inventados y de índices duplicados.
- Siete pruebas de la migración nominal pasan. Esa suite ahora lee su snapshot final histórico 826ded8, porque comprueba una migración ya aplicada y no debe compararla contra ampliaciones posteriores.
- Ocho escenarios adicionales se ejecutaron en PostgreSQL aislado en memoria con PGlite, ya instalado como herramienta transitiva: creación del schema completo, perfil único y aislamiento de organización, asignaciones múltiples/revocadas, pacientes en varias sucursales, capacidad, cita sin servicio y coherencia de atención, prueba de 336 horas y hechos de carga de archivos. El motor se cerró al terminar y no usó DATABASE_URL.
- El ensayo aislado construye una base vacía a partir del contrato. No equivale a ensayar una migración con datos de QA ni a validar permisos de la API.
- No se compilaron ni corrigieron los backends contra este contrato incompatible, conforme al alcance solicitado. No se declara que sus pruebas o los flujos UI funcionen con esta ampliación.

Hubo fallos de memoria dentro del sandbox. Se completaron emisión y ensayo PostgreSQL fuera de él con autorización. Los resultados anteriores corresponden a las ejecuciones completadas, no a los intentos fallidos.

## Borrador de migración: no ejecutable

El CLI se ejecutó offline con --from explícito al contrato 826ded8 para evitar que la referencia db local antigua generara tablas duplicadas. Tras conservar las acciones de FK de Core que ya impedían cascadas, pudo producir un borrador: cuatro CREATE TABLE, cero DROP TABLE y 14 DROP COLUMN.

El resultado tiene 501 operaciones propuestas y 262 llamadas placeholder para conversiones/relleno. Es un esquema de trabajo, no una migración lista. Sus primeras operaciones de retiro tampoco incorporan la reconciliación requerida de los datos anteriores.

Se conserva en [migration-drafts/target-schema.draft.ts](migration-drafts/target-schema.draft.ts), con bloqueo explícito de ejecución, fuera de migrations/app. No se dejó un paquete ejecutable con ops.json vacío que pudiera adelantar el marcador sin cambiar la estructura. El snapshot objetivo se conserva en migrations/snapshots para preparar la migración definitiva.

No volver a ejecutar migration:plan por defecto ni aplicar el borrador como si fuese el refactor nominal. El planificador requiere siempre el --from correcto y revisión; en este caso no resuelve automáticamente la conversión de tipos y los datos clínicos.

## Comandos que se pueden ejecutar ahora

Desde la raíz del repositorio, sin modificar PostgreSQL:

```powershell
npm.cmd --prefix packages/db run contract:emit
npm.cmd --prefix packages/db run build
npm.cmd --prefix packages/db run test:schema
npm.cmd --prefix packages/db run test:semantic
```

Estos comandos regeneran y comprueban el contrato local. No iniciar los backends anteriores con los nuevos artefactos de @app/db. Un db:verify contra QA compararía el contrato nuevo con el marcador anterior y reportaría diferencia; no resolverla con db sign/update.

## Antes de disponer de un comando de aplicación

La siguiente entrega necesita adaptar ambos backends y sus consumidores, además de construir y ensayar una migración de datos personalizada. Debe:

1. Respaldar e inventariar el estado real de QA y verificar el punto de partida. No asumir que el hash de un reporte anterior sustituye esa comprobación.
2. Validar y convertir UUID sin modificar su valor lógico; ordenar retiro/recreación de FK e índices antes/después de los casts. No cambiar tipos mientras FK incompatibles sigan activas.
3. Interpretar timestamps actuales con la zona original correcta y birthDate como fecha civil; no asumir UTC ni truncar sin revisar datos.
4. Reconciliar deleted/deletedAt antes de retirar deleted, con evidencia para registros eliminados que carezcan de fecha y para valores contradictorios.
5. Trasladar los vínculos de Appointment.serviceId que falten a AppointmentService sin duplicar asociaciones. Resolver su moneda/precio histórico y posibles asociaciones ya repetidas antes de UNIQUE.
6. Conservar evidencia de inventoryItemId antes de su retiro si contiene datos. Consolidar Radiograph.takenAt y ClinicalFile.capturedAt sin sobrescribir diferencias silenciosamente.
7. Completar entitlementsSnapshot y sus versiones desde derechos verificados. Definir mapeos de estado clínico y de archivos con evidencia: endedAt por sí solo no demuestra finalización documental ni existencia de un objeto verificado. No usar defaults ficticios para lograr NOT NULL.
8. Revisar documentos, roles, membresías, planes y asociaciones antes de nuevas restricciones de unicidad/CHECK. No eliminar duplicados clínicos automáticamente.
9. Aprovisionar asignaciones de sucursales y odontólogos con reglas aprobadas, sin inferir acceso clínico de un autor/cita. Las tablas nuevas no conceden acceso por sí solas.
10. Sustituir los placeholders, reordenar operaciones de preservación, self-emit de la migración definitiva y ensayar contenido por PK, integridad, recuperación y código adaptado en una copia aislada.

Solo después se publicará un comando migrate --to del paquete definitivo y se ejecutará db:verify. En esta entrega de schema no existe todavía ese paquete seguro para aplicar a QA.
