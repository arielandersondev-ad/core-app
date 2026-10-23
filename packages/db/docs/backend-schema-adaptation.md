# Adaptación de los backends al schema objetivo

**Actualización 23/10/2026:** la preparación posterior de la migración y el ensayo real
de QA están documentados en [target-schema-migration.md](target-schema-migration.md).
Las afirmaciones siguientes de migración pendiente corresponden al cierre original
de esta adaptación; consultar el nuevo documento para su estado vigente.

Fecha: 2026-10-22. Rama: `dev`. Contrato objetivo: `a2da18a1e42ff8ae6f0d46751f9a5a2e83a412042830e84417c6b6cec115f99b`.

## Alcance confirmado

El usuario confirmó adaptar y probar los endpoints existentes. Los endpoints nuevos de asignaciones, capacidad de agenda y pruebas de planes corresponden a la siguiente entrega. No se aplicó una migración, no se conectó a QA, no se cambió el grafo histórico ni se desplegó código.

Esta entrega consume el contrato objetivo ya generado en `@app/db`. No añade tablas ni columnas ni modifica sus artefactos generados. QA continúa en el contrato nominal anterior según el último reporte del usuario; no se verificó nuevamente su estado remoto.

## Cambios implementados

| Área | Adaptación |
|---|---|
| Identificadores | Se eliminan los casts y helpers `Char<36>`/`toUuid36`; los UUID nativos del ORM se representan como strings. Los servicios de citas admiten UUIDv7 y validan que `serviceIds` sea una lista. |
| Borrado lógico | Consultas, autenticación y escrituras usan `deletedAt`; ninguna operación ORM intenta leer/escribir `deleted`. El flag HTTP existente de Core se deriva de la fecha para conservar sus consumidores. Patient mantiene un getter derivado, sin un segundo estado interno. |
| Planes | Creación/edición normalizan `entitlements` como objeto con `schemaVersion`. Un payload antiguo sin versión recibe `1` conservando sus claves; una versión explícita inválida se rechaza. Esto no concede funciones o cupos inexistentes. |
| Asignación comercial | Asignar/reemplazar captura una copia independiente de los derechos en `entitlementsSnapshot`. Cambiar el estado administrativo conserva esa copia. La vigencia controla el acceso; retirar el catálogo comercial no revoca una concesión vigente. Los permisos de usuario y organización siguen sus verificaciones existentes. |
| Pacientes | `birthDate` se acepta y responde como `YYYY-MM-DD`; el codec PostgreSQL usa Date a medianoche UTC. PATCH distingue omisión de `null`. Documentos requieren tipo/número juntos y el sexo usa los valores admitidos por el contrato. Un documento duplicado produce 409. |
| Citas | Cero o varios servicios, almacenados exclusivamente en `AppointmentService`. Se deduplican los ids y se valida cada servicio, además de paciente/tratamiento. Una creación fallida revierte cita y asociaciones. |
| Actualización de citas | Se conserva `rowVersion`, se realiza UPDATE condicionado a la versión leída y se incrementa. Se guarda `updatedByMembershipId` desde el principal en los endpoints existentes. Una versión obsoleta produce 409. |
| Servicios/insumos | Se retira `inventoryItemId` de dominio, DTO, mapper, persistencia y tipos del cliente. Alta/edición/borrado con insumos se ejecutan en transacción. Un servicio referenciado devuelve 409 al intentar borrarlo y conserva sus insumos. |
| Auditoría | Ambos writers aceptan `actorMembershipId`. Dentistry persiste también `metadata`, antes descartada. Los nuevos consumidores deben proporcionar el actor autenticado; no se fabrica uno desde el recurso afectado. |
| Constraints | Los traductores de errores de membresía y rol reconocen los nombres físicos del contrato objetivo. |

Se retiene temporalmente `serviceId` en el contrato HTTP de citas como proyección del primer servicio asociado, ordenado por creación/id. No hay columna ni doble escritura: `serviceIds`/`services` reflejan las asociaciones reales. Sin servicios, el campo de compatibilidad vale `""`, como espera el cliente existente. Su retiro de API se coordinará con el frontend.

En Dentistry frontend solo cambian tipos de transporte: se retira el campo de inventario y se documentan moneda, versión y autor de actualización de citas. No se activan pantallas, BFF o módulos nuevos.

## Baseline y verificaciones

Los backends anteriores fallaban al compilar contra el contrato objetivo: Core referenciaba `deleted` y no proporcionaba el snapshot obligatorio; Dentistry tenía nueve errores de compilación por campos retirados. Además había casts `as unknown as` en repositorios que ocultaban incompatibilidades de lectura. Se retiraron esos casts en los repositorios afectados.

Verificaciones ejecutadas durante esta adaptación:

- Core: build y 14 pruebas de autenticación, permisos, planes y snapshots.
- Dentistry: build y 11 pruebas de audiencia/tenant, citas, UUIDv7, fecha civil, PATCH y validación de pacientes.
- Integración aislada: nueve escenarios y su prueba contenedora pasan usando los repositorios compilados de ambos backends y sus runtimes reales de Prisma contra PostgreSQL en memoria con PGlite. Se comprueban login/credenciales, conflictos de rol, snapshots, DATE en `America/La_Paz`, insumos, citas/asociaciones, versiones, rollback y auditoría.
- TypeScript sin emisión pasa en los frontends Core y Dentistry. No se ejecutó un build completo de Next.js ni navegación HTTP contra QA.
- Contrato compartido: ocho pruebas de schema objetivo y siete de la migración nominal histórica pasan. `git diff --check` no reporta errores de whitespace.

La integración genera una base vacía desde el contrato; sustituye únicamente el transporte node-postgres por PGlite y utiliza sus constraints reales. No prueba la migración de datos de QA, el protocolo de red de Neon, navegación HTTP completa ni concurrencia de capacidad. Usa la dependencia transitiva PGlite ya presente en el lockfile, sin instalar paquetes. El fixture genera claves RSA temporales y fuerza una configuración local inaccesible para impedir el uso accidental de la conexión versionada. La comprobación de marker se omite únicamente dentro de esa base efímera sin grafo; los backends normales conservan su configuración.

## Repetir las verificaciones

Desde la raíz, después de instalar las dependencias existentes:

```powershell
npm.cmd --prefix packages/db run build
npm.cmd --prefix core/backend test
npm.cmd --prefix dentistry/backend run build
npm.cmd --prefix dentistry/backend test
npm.cmd --prefix packages/db run test:backends
npm.cmd --prefix packages/db run test:schema
npm.cmd --prefix packages/db run test:semantic
node dentistry/frontend/node_modules/typescript/bin/tsc --noEmit --incremental false -p dentistry/frontend/tsconfig.json
node core/frontend/node_modules/typescript/bin/tsc --noEmit --incremental false -p core/frontend/tsconfig.json
```

`test:backends` consume `dist` de ambos backends; debe ejecutarse después de compilarlos. Estos comandos no migran PostgreSQL. No se necesita volver a emitir el contrato por esta adaptación.

## Pendientes separados y condición de uso

1. Construir y ensayar la migración de datos definitiva según [target-schema-implementation.md](target-schema-implementation.md). El borrador sigue fuera del grafo y bloqueado. No hay todavía un comando seguro de aplicación a QA.
2. Implementar autorización y endpoints de `PatientPractitionerAssignment` y `PatientBranchAssignment`. Las rutas actuales de pacientes no implementan aún el nuevo alcance clínico por asignación; no se declara resuelto por adaptar los tipos. Las altas existentes no fabrican permisos a partir de `createdByMembershipId`.
3. Implementar propietario/empleado en agenda, proyección de ocupación sin datos ajenos, validación vigente de referencias Core↔Dentistry y capacidad transaccional. La restricción previa de autoasignación al crear una cita se conserva; aún no se habilita al propietario a agendar para empleados. La comprobación actual de solapamiento sigue separada del INSERT y no garantiza capacidad bajo peticiones simultáneas.
4. Completar cupos y contrato de capacidades, trial de 14 días y permisos de lectura/escritura después de implementar las funciones correspondientes. No se crean concesiones trial ni se habilitan funciones futuras mediante esta entrega.
5. Añadir persistencia/endpoints de perfil y atención clínica y conectar el frontend base. No se implementan por anticipación CRUD de tratamientos, archivos, pagos u odontograma.
6. Extender el protocolo UI de edición para enviar la versión que el usuario leyó. El compare-and-set actual protege el intervalo entre lectura interna y UPDATE del backend, pero no detecta por sí solo un formulario antiguo que no envía versión.

No iniciar estos backends contra QA con el schema anterior ni interpretar estas pruebas como autorización de despliegue. La migración y los nuevos controles del plan base deben completarse antes de ofrecer los nuevos flujos al usuario final.
