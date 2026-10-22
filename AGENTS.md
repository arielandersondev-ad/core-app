# Reglas del repositorio

## Fuentes de referencia

- Arquitectura y convenciones: `README.md`.
- Contrato y migraciones: `packages/db/README.md`.
- Nombres y significado objetivo: `packages/db/docs/target-schema-dictionary.md`.
- Refactor compatible con QA: `packages/db/docs/semantic-standardization-plan.md`.
- Revisar también los AGENTS.md del subdirectorio antes de editarlo; en frontend se mantienen las instrucciones locales de Next.js.

## Nombres de persistencia y dominio

- Schemas PostgreSQL en minúsculas: `core`, `dentistry`.
- Modelos y tablas físicas en inglés, singular y PascalCase: `Patient`, `OrganizationMembership`.
- Columnas físicas y propiedades en camelCase: `patientId`, `createdAt`, `scheduledStartAt`.
- Relaciones singulares/plurales según cardinalidad y contenido real; una colección de asociaciones no se presenta como si contuviera entidades destino directamente.
- Instantes con sufijo At; fechas civiles con Date; unidades explícitas como Minor, Minutes y Bytes.
- Mantener los nombres de dominio definidos en el diccionario; no inventar sinónimos por módulo.
- No confundir identidad global User, pertenencia OrganizationMembership, asignación comercial OrganizationPlanAssignment, cita Appointment y atención ClinicalEncounter.
- Los nombres existentes pendientes de migración no se corrigen incidentalmente en otra tarea.

## Contrato compartido y QA

- `packages/db` es el único dueño del contrato y sus migraciones. Ambos backends consumen @app/db; no crear schemas paralelos.
- No editar a mano JSON/d.ts generados para arreglar tipos. Regenerarlos con la herramienta del paquete cuando corresponda al alcance autorizado.
- No reescribir migraciones/snapshots históricos ya aplicados para borrar vocabulario antiguo. Añadir la migración correspondiente.
- Conservar la regla actual de referencias Core↔Dentistry por id sin FK físicas cruzadas, salvo cambio arquitectónico explícito.
- Un rename incluye referencias/imports/exports/DI, queries, mappers, DTO, BFF, clientes, pruebas y constraints codificadas.
- No reemplazar globalmente términos como Authorization, Session, ClinicalHistory, startsAt o active: pueden tener significados/protocolos diferentes.
- En la estandarización de QA, no mezclar retiros de columnas, tipos nuevos, reglas de acceso, módulos futuros, actualizaciones de dependencias o cambios visuales.
- La existencia del diccionario o del plan no es una orden para ejecutar migraciones, reset o despliegues. Trabajar dentro de la tarea autorizada y comprobar el entorno antes de cualquier ejecución.
- No ejecutar db:update/db sign contra QA/base compartida ni forzar markers para ocultar diferencias.
- Mantener coherentes ambos backends, el paquete @app/db y los dos frontends al cambiar contratos. Revertir solo el código no recupera una BD ya renombrada.

## Verificación y entregas

- Registrar baseline y distinguir fallos previos de regresiones introducidas.
- Ejecutar verificaciones apropiadas a los cambios; no afirmar que QA/tests pasan si no se comprobaron.
- Los tests de Dentistry consumen dist: compilar su backend antes de ejecutarlos. Los tests de Core ya incluyen build en su script.
- Los scripts lint de backend usan --fix; no tratarlos como verificaciones de solo lectura.
- En renombres de archivos verificar mayúsculas/minúsculas e imports ESM .js para el entorno Linux/Docker.
- Preservar cambios ajenos del workspace y separar tareas por propiedad de archivos. El plan contiene paquetes de agentes, no una orden de delegación automática.
