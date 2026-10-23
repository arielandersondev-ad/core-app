# Ejecución de estandarización semántica

Fecha: 2026-10-22. Rama: `dev`. Revisión base: `f961d0b`.

El usuario confirmó que dev corresponde a QA y autorizó usar la conexión actual. El trabajo local está implementado. **El usuario aplicó la migración y compartió resultados satisfactorios de db:verify y migration:status el 2026-10-22.** Las salidas corresponden a la conexión configurada a dev; no confirman el despliegue de los cuatro servicios ni su funcionamiento integrado. La verificación remota fue ejecutada por el usuario, no por el agente.

Después de estas salidas, el usuario confirmó que todo funciona correctamente. Se registra como validación funcional general reportada por el usuario; no se aportó una matriz por recorrido ni nueva evidencia del build completo o de la revisión desplegada. El siguiente trabajo propuesto es la revisión acotada de código sin uso, documentada en `../../../docs/maintenance/code-cleanup-plan.md`.

## Alcance implementado

- Los 17 renombres físicos, 15 columnas, relaciones del contrato y CANCELLED → CANCELED definidos en el plan nominal.
- Referencias ORM a Core desde ambos backends; entidades, mappers, DTO, commands, filtros, cancelación y consumidores.
- Plan.entitlements/isActive conservan JSON y comportamiento anterior, sin validación nueva ni snapshots.
- BFF y frontends: payloads, allowlist de filtros, formularios, datos de servicios y mapas de estados coherentes con los nombres nuevos.
- Tipo/archivo OrganizationPlanAssignment y controlador OrganizationPlanAssignmentController, con imports ESM actualizados.
- Artefactos JSON/d.ts regenerados con el CLI instalado y paquete @app/db reconstruido. No se editaron manualmente los artefactos generados.
- Manifiesto ejecutable de nombres en `../scripts/semantic-standardization-map.mjs` y comparación de contratos en `../scripts/semantic-standardization-contract.mjs`.

Se conservaron servicio obligatorio en citas, autoasignación actual, borrado con deleted/deletedAt, tipos físicos existentes, campos diferidos y reglas actuales de acceso a planes. La condición futura de propietario/empleado y los módulos nuevos no se implementaron en este refactor.

No se cambiaron headers Authorization, claims JWT, permisos/audiencias, cookies, claves de almacenamiento local ni el tipo ClinicalHistory que representa el expediente compuesto en el prototipo frontend.

## Contratos y migración aplicada

| Referencia | Valor |
|---|---|
| Storage hash anterior del workspace | `0ebda04f6a9e692ce82d511f100cd78a2f29836b1b82b73e3ecac8963ff6a6e2` |
| Storage hash nuevo | `826ded8772e9b65bde90c34fca480644ba91128c6488fb4760219a138a807945` |
| Execution hash nuevo | `75f0a26b5c8a4a7d7a3b6b147f40eccb9b283c9ca5ed9d52292e3399a1ace535` |
| Migración | `../migrations/app/20261022T1348_semantic_standardization/` |
| Comparación estructural | 25 tablas, 318 campos y 76 relaciones conservados mediante el mapeo nominal. |

El planificador offline tomó inicialmente la referencia local `e895710b…`, anterior al contrato actual, y produjo operaciones de creación. Ese borrador fue reemplazado antes de cualquier aplicación. La migración nueva parte explícitamente del snapshot `0ebda04f…`; no se cambiaron referencias ni migraciones históricas para fingir que QA coincide con ese estado.

La migración contiene una operación rawSql gestionada por el framework, con 117 sentencias dentro de un bloque DO atómico: renombres de tablas, columnas, constraints e índices, y una actualización del texto del estado de cancelación. No contiene DROP, CREATE, TRUNCATE, DELETE ni cambios de tipo. Se vuelve a emitir con MigrationCLI, por lo que ops.json y migration.json corresponden al código de la migración.

Evidencia compartida por el usuario tras la ejecución:

- migrate --to 826ded8772e9b65bde90c34fca480644ba91128c6488fb4760219a138a807945: una migración y una operación aplicadas.
- db:verify: marcador y estructura coinciden con el contrato; modo full, tolerant. storageHash 826ded8772e9b65bde90c34fca480644ba91128c6488fb4760219a138a807945 y profileHash 3916f444a8a17ad749191acf9e08dad97d1a327b88c2f1d45d12f240296aa8b2.
- migration:status: contrato y base en 826ded8; migración nominal marcada applied y estado Up to date.

No se aportó evidencia de respaldo previo, ensayo de recuperación ni comparación de filas antes/después. La verificación de estructura no demuestra por sí sola conservación de todo el contenido ni funcionamiento de las APIs.

La prueba de paridad verifica tipos, nulabilidad, defaults, PK, UNIQUE, FK, definición de índices, campos de dominio, targets/cardinalidades y generadores de ejecución. Esta comparación de contratos **no sustituye** comprobar objetos y filas reales en PostgreSQL.

## Línea base y resultados locales

| Verificación | Antes del refactor | Después |
|---|---|---|
| Build @app/db | Pasa | Pasa |
| Core backend build + tests | 11 pruebas pasan | 12 pruebas pasan |
| Dentistry backend build + tests | 4 pruebas pasan | 6 pruebas pasan |
| Pruebas de integridad nominal | No existían | 7 pruebas pasan |
| TypeScript Core frontend, sin emitir | Pasa | Pasa |
| TypeScript Dentistry frontend, sin emitir | Pasa | Pasa |
| Build completo Core frontend | Falla previamente: fuentes Google y, con red, panic de Turbopack/PostCSS al crear proceso | No se declara aprobado; el código de estilos/fuentes/bundler no se cambió. |
| Build completo Dentistry frontend | Mismo fallo previo de fuentes y panic de Turbopack/PostCSS | No se declara aprobado. |
| db:verify y migration:status | El usuario confirmó marcador anterior 0ebda04 y migración nominal pendiente | El usuario compartió verificación completa satisfactoria y estado Up to date tras migrar. |
| Ensayo SQL/recuperación y comparación de datos | No realizado por el agente | Sin evidencia aportada de ensayo ni comparación antes/después. |
| Docker local | Motor Linux de Docker Desktop no iniciado | No se pudo usar para ensayo aislado. |

Los logs de baseline y las copias temporales de fuente/contrato estuvieron en una
carpeta ignorada por Git y se retiraron durante la limpieza posterior. Los snapshots,
la migración y las pruebas nominales permanecen versionados. Durante esta etapa nominal
el agente no obtuvo un respaldo de datos de QA: su conexión no llegó a establecerse.
El respaldo confirmado y las verificaciones posteriores corresponden a la entrega
documentada en [target-schema-migration.md](target-schema-migration.md).

Pruebas adicionales relevantes:

- El controller de planes conserva exactamente el JSON recibido y respeta isActive=false/default true.
- El mapper de citas conserva valores, asociaciones, fechas y datos de cancelación con nombres nuevos.
- Los nombres nuevos no permiten reservar sin servicio ni asignar otro profesional, preservando el comportamiento actual.
- La comparación de contratos rechaza retirar deleted/serviceId/inventoryItemId/takenAt, cambiar un id nativo, ampliar nulabilidad o alterar cardinalidades/FK/defaults.
- Se comprueba que ops.json corresponde a los renombres revisados y que la migración parte del contrato anterior correcto.

## Comandos locales verificados

Desde la raíz:

```powershell
npm.cmd --prefix packages/db run build
npm.cmd --prefix packages/db run test:semantic
npm.cmd --prefix core/backend test
npm.cmd --prefix dentistry/backend run build
npm.cmd --prefix dentistry/backend test
node core/frontend/node_modules/typescript/bin/tsc --noEmit --incremental false -p core/frontend/tsconfig.json
node dentistry/frontend/node_modules/typescript/bin/tsc --noEmit --incremental false -p dentistry/frontend/tsconfig.json
```

El generador puntual usado para preparar esta migración fue retirado después de guardar
su estado en `8dd6354`. Se conservan el paquete ya aplicado, ambos snapshots y las
pruebas de paridad con su mapa de nombres. No regenerar ni reescribir este paquete
histórico usando el contrato actual; cualquier cambio posterior requiere otra migración.

## Estado por etapa

| Etapa | Estado |
|---|---|
| S00 Baseline | Local registrado; dev y marcador anterior 0ebda04 confirmados por salida del usuario. Versión PostgreSQL y datos previos sin registrar. |
| S01 Manifest | Implementado en mapa compartido y contratos nuevos. |
| S02 Caracterización | Pruebas existentes preservadas y pruebas nominales añadidas; sin caracterización SQL real/UI remota. |
| S03 Contrato/migración | Implementado y aplicado por el usuario; marcador y estructura verificados. Sin evidencia de ensayo de recuperación. |
| S04 Core backend | Implementado; build y pruebas pasan. |
| S05 Dentistry backend | Implementado; build y pruebas pasan. |
| S06 Clientes | Implementado; tipos pasan; build completo afectado por fallo previo del entorno. |
| S07 Integración/ensayo | Validación local parcial y estructura real verificada por el usuario; pendientes Docker/Linux, recuperación, comparación de datos y recorrido con BD migrada. |
| S08 QA | Migración aplicada y verificada por el usuario; funcionamiento general confirmado por él. Revisión desplegada y matriz detallada de recorridos sin registrar. |
| S09 Cierre | Registro actualizado; entrega completa pendiente de validación funcional y despliegue. |

## Acceso del agente y continuación concreta

La conexión del agente falló con ENOTFOUND bajo el sandbox. Se solicitó ejecutar la consulta con permisos de red ampliados y esa solicitud fue rechazada. El agente no ha intentado alcanzar QA por otro mecanismo ni ha aplicado SQL. Posteriormente, el usuario ejecutó la migración y compartió las verificaciones satisfactorias descritas arriba. La comprobación Docker fue únicamente contra el motor local y falló porque no está iniciado.

Tras la aplicación confirmada:

1. Reiniciar los servicios con contrato y código actualizados; confirmar que los despliegues que usan esta base también consuman la misma versión.
2. Verificar login, sesión, organización/sucursal y acceso a Dentistry; comprobar planes, servicios y creación/listado/cancelación de citas con datos de prueba.
3. Confirmar el mecanismo de respaldo disponible y probar recuperación en un entorno aislado. Si existe respaldo previo, comparar filas y contenido con él; no afirmar paridad de datos sin esa evidencia.
4. Resolver/verificar el build completo de frontend en el entorno habitual de QA, manteniendo el fallo de entorno separado del refactor.
5. Registrar resultados funcionales, revisión desplegada y cualquier error nuevo para cerrar la entrega. No repetir la migración ni forzar marcadores: el estado compartido ya está actualizado.

La base conectada ya requiere los backends actualizados: los anteriores conservan referencias a nombres que se renombraron. Revertir solo código no recupera la compatibilidad. No restaurar un respaldo anterior después de reabrir escrituras sin conciliación de los cambios posteriores.
