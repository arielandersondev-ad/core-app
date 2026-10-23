# Plan de estandarización semántica — Core y Dentistry

Fecha: 2026-10-22. Versión: 0.3. Estado: implementación local realizada; migración aplicada por el usuario a la conexión dev y verificada mediante db:verify y migration:status. Despliegue completo y validación funcional pendientes de confirmar; sin evidencia de ensayo de recuperación. Véase el [reporte de ejecución](semantic-standardization-execution.md) para resultados y pendientes reales. Las etapas y condiciones siguientes describen el procedimiento planificado; no sustituyen ese registro de ejecución.

## 1. Objetivo y condiciones acordadas

Adaptar contrato, nombres físicos, código y clientes a la semántica del [diccionario objetivo](target-schema-dictionary.md), conservando el funcionamiento que actualmente existe en QA.

Condiciones confirmadas por el usuario:

- Core y Dentistry ya funcionan en QA; la nueva prioridad es preservar ese comportamiento.
- Hay una ventana de mantenimiento de **seis horas** para el cambio coordinado.
- Los únicos consumidores son los dos frontends y el código de este repositorio.
- Se estandarizan ambos módulos juntos: tablas/modelos PascalCase singular; columnas/propiedades camelCase.
- El plan inicial se limitó a documentación. Posteriormente el usuario autorizó proceder con dev (confirmada como referencia QA) y la conexión actual. La implementación local se registra en el reporte; eso no equivale a haber aplicado la migración ni desplegado QA.

El diccionario describe un objetivo más amplio que este refactor. Sus propuestas funcionales, campos nuevos y retiros no se convierten automáticamente en tareas de esta entrega. En caso de conflicto, para esta entrega prevalece la conservación de comportamiento definida aquí.

### Resultado observable esperado

Mismas operaciones, resultados de negocio, permisos, aislamiento, fechas, importes y datos existentes, con identificadores nuevos consistentes. Los payloads internos entre nuestros frontends y backends adoptan los nombres nuevos en la misma entrega. No se promete compatibilidad simultánea entre artefactos de versiones distintas.

No se exige mantener una API antigua indefinidamente ni crear vistas SQL, triggers, dual-write, dos contratos productivos o endpoints duplicados solo por este refactor. Una excepción necesita un consumidor o requisito demostrado.

## 2. Hechos observados y aspectos por verificar

| Evidencia del repositorio | Implicación para el plan |
|---|---|
| `packages/db/src/prisma/schema.ts` reúne 14 modelos Core y 11 Dentistry. | Un propietario del contrato coordina los cambios; no se crean schemas de backend paralelos. |
| Ambos backends importan el tipo y JSON de `@app/db/src/prisma/generated/contract.*`. | Regenerar y empaquetar una versión coherente para ambos. |
| `packages/db/scripts/copy-artifacts.mjs` copia contrato JSON y d.ts a dist. | Verificar fuente, dist, exports y copia instalada de @app/db; compilar solo el backend no basta. |
| Los Dockerfiles de ambos backends construyen `packages/db` antes del backend y copian dist al runtime. | Ensayar las imágenes/resultados empaquetados; no validar únicamente TypeScript en Windows. |
| El contrato generado/migraciones usa `character(36)` para varios ids construidos con uuidString. | UUID conceptual no autoriza convertir tipos físicos a UUID nativo en esta entrega. |
| Core usa tablas PascalCase; Dentistry usa nombres plurales snake_case. | Renombrar los objetos existentes, conservando datos y relaciones. |
| Existen nombres de constraints/índices codificados en repositorios. | Verificar traducción de errores de unicidad después de cada rename. |
| Los DTO de citas incluyen professionalMembershipId, startsAt, endsAt y CANCELLED. | Actualizar request, filtros, responses, BFF y clientes juntos. |
| Core expone configuration/active/deleted en tipos y payloads. | configuration/active se renombrarán sin cambiar contenido ni política; deleted permanece en esta fase. |
| JWT utiliza membershipId, organizationId, branchIds y permissions. | Renombrar Membership no obliga a cambiar claims, audiencias, claves ni códigos de permiso. |
| El frontend tiene un tipo ClinicalHistory que reúne todo el expediente y un almacenamiento local versionado. | No confundir ese read model con la tabla ClinicalHistory de antecedentes. |
| Las pruebas actuales usan dist y dobles de ORM. | Compilar antes de probar; los mocks no prueban FK, SQL real ni migración. |
| No se observó una carpeta .github en la raíz durante esta revisión. | No asumir que existe una pipeline de integración y despliegue ya configurada. |

Por verificar en la fase inicial: revisión exacta desplegada, versión de PostgreSQL en QA, contratos/hashes y migraciones aplicados, forma de despliegue real, procesos/jobs que escriben, mecanismo de respaldo/restauración y acceso a una copia aislada para ensayo. No se han leído secretos ni conectado a QA para redactar este plan.

## 3. Clasificación del alcance

### 3.1 Incluido: renombres que mantienen comportamiento

| Grupo | Cambio | Condición de paridad |
|---|---|---|
| Tablas/modelos Core | Authorization → UserCredential; Session → AuthSession; Membership → OrganizationMembership; MembershipBranch → OrganizationMembershipBranch; MembershipRole → OrganizationMembershipRole; OrganizationPlan → OrganizationPlanAssignment. | Mismas filas, ids, relaciones, accesos y operaciones. |
| Tablas Dentistry | patients → Patient; clinical_histories → PatientHealthProfile; appointments → Appointment; clinical_encounters → ClinicalEncounter; dental_services → DentalService; dental_service_supplies → DentalServiceSupply; appointment_services → AppointmentService; treatments → Treatment; payments → Payment; clinical_files → ClinicalFile; radiographs → Radiograph. | Cambiar metadata/nombres, sin drop/create de tablas pobladas. |
| Plan | configuration → entitlements; active → isActive. | Conservar el JSON completo, incluso `{}` o claves actuales; sin nueva validación de capacidades ni snapshots. Conservar efecto actual de desactivar plan. |
| DentalService | active → isActive. | Misma habilitación, filtros y selección. |
| Appointment | professionalMembershipId → practitionerMembershipId; startsAt → scheduledStartAt; endsAt → scheduledEndAt; cancelledAt → canceledAt; cancelledByMembershipId → canceledByMembershipId. | Mismos valores, horarios, restricciones y nulabilidad. |
| ClinicalEncounter | professionalMembershipId → practitionerMembershipId; diagnosis → diagnosisSummary; procedurePerformed → procedureSummary; evolution → progressNotes; recommendations → patientInstructions. | Traslado textual exacto, sin reinterpretar ni reescribir contenido clínico. |
| Treatment | responsibleMembershipId → practitionerMembershipId; diagnosis → diagnosisSummary. | Mantener opcionalidad y significado actuales. |
| Valor de estado | Appointment.CANCELLED → CANCELED. | Bijección de un único valor: SQL, dominio, DTO, filtros y clientes. No cambiar transiciones permitidas. |
| Relaciones ORM | User.authorization → credential; User.sessions → authSessions; Organization.plans → planAssignments; Plan.organizations → organizationAssignments; Membership.branches → branchAssignments; Membership.roles → roleAssignments; Patient.clinicalHistory → healthProfile. | Mismos targets, campos from/to, cardinalidades y resultados de consultas. |

Hay **17 tablas físicas, 15 columnas y un valor de estado** incluidos, además de relaciones y símbolos de código. La lista del diccionario es la referencia para los nombres; esta tabla define el alcance conductual permitido.

### 3.2 Aceptado como objetivo, diferido del refactor de QA

| Cambio del diccionario | Por qué no entra aquí | Requisito para abordarlo después |
|---|---|---|
| Retirar deleted en 11 tablas. | Puede cambiar qué filas son visibles/borradas si hay discrepancias con deletedAt. | Inventario, conciliación y pruebas del comportamiento de borrado. |
| Retirar Appointment.serviceId. | Hoy selecciona servicio principal y participa en validaciones y referencias a tratamientos. | Migración de asociaciones, definición del servicio principal y actualización funcional acordada. |
| Retirar DentalServiceSupply.inventoryItemId. | La inexistencia de tabla destino no prueba que QA no use los valores. | Verificar uso/datos, decidir conservación y migrar sin pérdida. |
| Retirar Radiograph.takenAt. | Consolidar fechas puede descartar valores diferentes o cambiar consultas. | Comparar fechas, resolver conflictos y conservar evidencia. |
| Patient.birthDate a DATE; conversiones de ids, cantidades o timestamps. | Son cambios de tipo/interpretación, no de nombre. | Migración de datos específica y casos de frontera. |
| Nuevos CHECK, FK compuestas, unicidad o catálogos cerrados. | Pueden rechazar escrituras que QA acepta hoy. | Auditar datos y aprobar reglas en una entrega propia. |
| Nuevos estados de atención/tratamiento y cierre documental. | Cambian el flujo clínico. | Implementación funcional separada. |
| Campos nuevos, rowVersion, snapshots, actorMembershipId y cambios a metadata de auditoría. | Cambian escritura, concurrencia o política de datos. | Casos de uso y pruebas específicos. |
| BranchSchedulingPolicy y capacidad compartida. | Cambia reservas y autorización. | Entrega funcional del plan base. |
| OrganizationFeatureTrial, límites y entitlements efectivos. | Cambia acceso y concesión de derechos. | Entrega de planes/prueba, después de módulos persistidos. |
| Cambiar la regla de plan inactivo. | La política y tests actuales bloquean acceso si el plan está inactivo. | Decisión P6 e implementación separada. |
| Propietario agenda al empleado; expediente compartido/restringido. | Amplía/restringe permisos respecto al comportamiento actual. | Matriz aprobada y entrega de autorización. |
| Sustituir mocks/localStorage por persistencia clínica. | Es desarrollo de funcionalidades, no rename. | Entrega propia de pacientes/historial real. |

No borrar ninguna tabla. No aprovechar el trabajo para actualizar dependencias, reorganizar features, cambiar diseño de UI, corregir bugs no relacionados o reescribir arquitectura.

## 4. Estrategia de compatibilidad y contrato

### 4.1 Una entrega coordinada, sin aliases permanentes

Con seis horas de mantenimiento y consumidores internos, preparar antes de la ventana:

1. Una versión final coherente del contrato @app/db y su migración.
2. Imágenes/artefactos de Core backend y Dentistry backend contra ese contrato.
3. Artefactos de ambos frontends que conocen los nombres nuevos de payloads/filtros.
4. Artefactos anteriores, respaldo probado, secuencia de reversión y pruebas de humo.

Durante el cambio se detienen accesos/escrituras, se migra una vez desde packages/db y se ponen en servicio artefactos compatibles. Los cuatro servicios se verifican antes de reabrir QA. Los nombres viejos de payload no necesitan un segundo endpoint permanente.

Las pestañas abiertas deben recargarse al finalizar el mantenimiento. Inventariar caché HTTP, assets de Next y clientes abiertos en el ensayo. Si no se puede garantizar la recarga, añadir únicamente un adaptador temporal de entrada o un control de versión del cliente demostrado como necesario, con responsable y retiro definido. No añadirlo por anticipación.

Las rutas existentes se conservan salvo que el inventario demuestre un nombre directamente afectado y se actualicen todos sus consumidores. Cambiar un modelo no obliga a cambiar `/users`, `/roles`, `/appointments`, headers, cookies o paths de features.

### 4.2 Protocolo que no se renombra automáticamente

- Header HTTP `Authorization` y esquema `Bearer`.
- JWT: sub, membershipId, organizationId, branchIds, permissions, issuer, audience, kid, TTL y algoritmos.
- Cookies, storage keys, redirecciones, parámetros URL no afectados, variables de entorno y rutas de login/logout.
- Códigos de roles/permisos existentes, interpretación de permisos y alcance de organización/sucursal.
- Hashes de contraseña, sesiones y refresh tokens persistidos.
- Etiquetas de UI como Historia clínica, Consulta, Atención y Tratamiento cuando ya son correctas.

La estructura del JSON de entitlements conserva contenido y tipos actuales. La nueva validación schemaVersion/features/limits pertenece a otro trabajo. Tener un nuevo nombre no habilita funciones ni cambia los límites actuales.

### 4.3 Ejemplo del recorrido de un campo

```text
PostgreSQL Appointment.professionalMembershipId
  → contrato nuevo Appointment.practitionerMembershipId
  → fila ORM / repositorio / mapper
  → entidad / command / use case
  → DTO request y response / query filters
  → BFF allowlist / transporte
  → cliente / tipos / formulario / grilla
  → tests / fixtures
```

Cada rename requiere cerrar el recorrido completo y verificar el mismo valor. No basta con que compile el repositorio. Para startsAt/endsAt el reemplazo se acota a Appointment: las fechas de vigencia de planes y pruebas conservan sus nombres.

## 5. Matriz de impacto y puntos concretos de inspección

| Área | Ubicaciones del repo | Qué inspeccionar |
|---|---|---|
| Contrato | packages/db/src/prisma/schema.ts | Model keys, namespace, fields, storage table/column mappings, refs, from/to, inversas, constraints e índices. |
| Artefactos | packages/db/src/prisma/generated; src/index.ts; dist; package.json; scripts/copy-artifacts.mjs | JSON y d.ts juntos; exports, copia instalada e identidad de contrato coherentes. |
| Migraciones | packages/db/migrations/app; snapshots; refs/metadata | Start/end contract, grafo, operaciones y marker. No editar migraciones históricas aplicadas. |
| Core auth/user | core/backend/src/modules/auth; user | UserCredential, AuthSession, OrganizationMembership, queries/joins, issuer/verifier, DTO y transacciones. |
| Core organización/roles | core/backend/src/modules/organization; role | Aprovisionamiento, asociaciones, includes/selecciones, validadores de pertenencia y traducción de unicidad. |
| Core planes | core/backend/src/modules/plan | OrganizationPlanAssignment, entitlements/isActive, filtros, serialización, asignación/renovación/suspensión. |
| Servicios comunes backend | ambos src/common/infrastructure; src/prisma/db.ts | Tipos TransactionContext/Contract, ORM, SQL/rawSQL, audit resource strings y imports del paquete. |
| Dentistry auth | dentistry/backend/src/modules/auth; clinic | Referencias Core en guardas/directorio de profesionales; claims permanecen. ClinicModule no se activa si antes no estaba registrado. |
| Dentistry pacientes/servicios | dentistry/backend/src/modules/patient; service | Mappers de filas, métodos, isActive, borrado actual y DTO. No endurecer autorización durante un rename. |
| Dentistry citas | dentistry/backend/src/modules/appointment | Commands, validaciones, reglas, filtros, mapper, cancelación, solapamiento, serviceId y asociaciones existentes. |
| Modelos Dentistry sin API | contrato y consultas transversales | Renombrar persistencia sin construir módulos de atenciones, pagos o archivos ausentes. |
| BFF Core | core/frontend/src/app/api; infrastructure | Rutas, query/body, allowlists, validación de origen/sesión, error mapping y proxy. |
| BFF Dentistry | dentistry/frontend/src/infrastructure/http/dentistry-proxy.ts; app/api | professionalMembershipId como filtro permitido; paths, métodos, body y error handling. |
| Frontend Core | core/frontend/src/features/auth; user; organization; role; plan | Tipos de transporte/dominio, services, hooks/query keys, schemas de formulario, componentes, defaults y caché. |
| Frontend Dentistry | modules/clinic/api; components; views; features/clinical-history; infrastructure/auth | DTO, payloads, statusMap/backendStatusMap, filtros, formularios, detalle, agenda, datos mock y persistencia local. |
| Tests | core/backend/test; dentistry/backend/tests | Dobles de ORM con nombres nuevos y pruebas del contrato público antes/después. |
| Empaquetado | ambos Dockerfile; scripts npm y lockfiles | Mismo contrato empaquetado; imports ESM .js y rutas sensibles a mayúsculas; ninguna subida de versiones ajena. |

### Sustituciones que requieren discriminación

- Authorization como tabla se renombra; el header Authorization no.
- Session como entidad persistente se renombra; no todos los helpers de sesión HTTP/Next necesitan otro nombre.
- ClinicalHistory en el contrato actual es antecedente vigente; el ClinicalHistory del prototipo frontend es un expediente compuesto. No convertirlo por búsqueda global en PatientHealthProfile.
- startsAt/endsAt cambia en Appointment, no en OrganizationPlanAssignment ni en cualquier interfaz con esas propiedades.
- active → isActive solo corresponde a Plan y DentalService, no a nombres de estados o variables arbitrarias.
- diagnosis → diagnosisSummary en Treatment/ClinicalEncounter persistidos; no reescribir contenido ni keys de datos locales sin contrato de compatibilidad.
- resource/action de auditoría: nuevos eventos usan la terminología objetivo; eventos históricos conservan evidencia original. Lectores que filtran por resource deben reconocer nombres históricos cuando corresponda. No renombrar códigos de acción sin inventario.
- Nombres de constraints pueden quedar históricos si contrato y verificador lo admiten. Si el motor exige nuevos nombres, mapearlos y actualizar la traducción de errores sin cambiar su definición.

## 6. Camino de ejecución y puertas de salida

### S00 — Fijar baseline y diferencias con QA

Responsable: integrador. No ejecutar migraciones.

- Registrar revisión Git, cambios locales previos, versiones de cuatro servicios, Node/npm/PostgreSQL y contrato/hashes empaquetados.
- Verificar que la revisión del workspace representa el código desplegado. Si difiere, construir la matriz a partir de QA; no usar el diccionario como prueba de igualdad.
- Identificar BD/esquema y datos a preservar, sin imprimir DATABASE_URL, claves, tokens ni datos personales en reportes.
- Revisar migraciones aplicadas, integridad del grafo/marker y dependencias externas. El usuario confirmó que no hay consumidores externos; verificar scripts/jobs del repo.
- Capturar resultados actuales de pruebas, endpoints y operaciones de UI disponibles. Un flujo mock no se documenta como persistencia real.
- Preparar respaldo y restauración ensayada en entorno aislado. No usar db:init/reset/update/sign para corregir diferencias en QA.

Entregable: manifest de baseline, matriz de comportamiento y plan de ensayo. Salida: se sabe exactamente qué comportamiento conservar y qué artefactos representan QA. Fallos previos se registran separados, sin convertirlos en trabajo incidental.

### S01 — Mapa de renombres y contratos de integración

Responsable: integrador con revisión de responsables de backend/clientes.

- Crear un manifest revisable por símbolo: namespace, tabla/modelo/columna actual, destino, tipo/nulabilidad/default actuales, referencias, relaciones, consumidor, prueba y lote.
- Desglosar los 17 renombres físicos, 15 columnas, relaciones y el valor CANCELLED. Listar explícitamente los 14 retiros diferidos.
- Inventariar imports, rutas de archivo, tokens de inyección Nest, exports, selects/proyecciones, SQL, DTO, filtros, forms, tipos, cache/query keys, fixtures y constraints codificadas.
- Acordar shape único objetivo de request/response para cada endpoint afectado. Conservar métodos, paths y códigos de resultado salvo diferencia nominal aprobada.
- Congelar el vocabulario antes de repartir trabajo. Las preguntas clínicas/planes pendientes no bloquean este rename porque esas funciones están fuera de alcance.

Entregable: manifest de mapeo y contratos de payload para agentes. Salida: cada referencia tiene propietario y cada nombre nuevo tiene un destino inequívoco.

### S02 — Caracterización y casos de regresión necesarios

Responsable: integrador/QA. Primero sobre la versión anterior, después se reutiliza con proyección nominal.

- Reutilizar pruebas existentes y añadir solo brechas del refactor: payloads, ORM real, relaciones, restricciones y contratos compartidos.
- Capturar para solicitudes representativas el status HTTP, claves, valores y errores relevantes; comparar después con un mapeo explícito de nombres.
- Incluir ambos sentidos del contrato de citas: creación/filtros/respuestas/cancelación, y el mapeo CANCELLED ↔ CANCELED esperado por cada versión de fixture.
- Capturar comportamiento de plan inactivo, organización suspendida, membresía inválida, borrado lógico y asignación a otro profesional.
- Preparar datos sintéticos que recorran todas las FK actuales, incluidos módulos sin pantalla. No depender de datos personales de QA para pruebas versionadas.

Entregable: suite de caracterización y fixtures de migración. Salida: pasan en baseline o tienen fallo previo documentado; no se cambian expectativas de negocio para lograr verde en la versión nueva.

### S03 — Contrato y migración nominal en copia aislada

Responsable único: contrato/migraciones, coordinado por integrador.

- Actualizar modelos, campos, relaciones y nombres físicos conforme al manifest, manteniendo tipos, defaults, nulabilidad, delete actions y cardinalidades.
- Verificar API real del contract-builder instalado para mapping de tabla/columna. No usar ejemplos de schema.prisma ni @map/@@map de otra herramienta sin soporte local.
- Emitir JSON y d.ts con el CLI del paquete. Una modificación solo lógica puede cambiar el hash/marker del contrato; no asumir que es una actualización de código sin migración.
- Generar/revisar plan de migración. Si propone drop/create para un rename, sustituir por operaciones de renombre soportadas o rawSql bajo el flujo del CLI, con precondiciones/postcondiciones y metadata coherente. Ensayar ese procedimiento; no forzar marcadores a mano.
- Renombrar objetos existentes. Verificar todas las FK entrantes/salientes; el cambio de nombre no debe cambiar targets, columnas o acciones de borrado.
- Cambiar el único valor CANCELLED a CANCELED donde corresponda y registrar conteo exacto; no cambiar el estado administrativo CANCELED de asignaciones que ya es correcto.
- Preservar nombres de índices/constraints cuando sea posible. Si cambian, enumerar correspondencias y actualizar manejadores de error en S04/S05.
- Aplicar a copia aislada y comparar identidades, filas, contenido, FK, índices y constraints normalizando exclusivamente nombres aprobados y el valor de cancelación.
- Ejecutar db:verify y ensayar la migración inversa/recuperación con contrato coherente. No asumir que existe un comando migrate:down.

Entregable: contrato congelado, migración revisada, reporte de equivalencia de datos/esquema y recuperación. Salida: no hay pérdidas, drops funcionales, casts o nuevas reglas; ambas generaciones de artefactos están identificadas.

### S04 — Adaptar Core backend

Responsable: agente Core, con contrato S03 congelado.

- Actualizar referencias de ORM: UserCredential, AuthSession, OrganizationMembership, OrganizationMembershipBranch, OrganizationMembershipRole, OrganizationPlanAssignment.
- Ajustar relaciones, entities/types, repositories, queries, mappers, commands y DTO de entitlements/isActive sin validar ni reinterpretar su contenido.
- Renombrar archivos/clases solo cuando nombran la entidad realmente afectada. Actualizar imports/exports y tokens de DI asociados; rutas HTTP y códigos de permisos no cambian por estética.
- Mantener algoritmos/TTL de autenticación, filtros por audiencia, selección de membresía y acceso de planes con la lógica anterior.
- Mantener reglas de borrado, transacciones, contadores de renovación y efectos de plan inactivo. Conservar columnas deleted y serviceId aunque el objetivo futuro las retire.
- Actualizar dobles de ORM sin debilitar asserts; cubrir nombres reales de constraints que llegan de PostgreSQL.

Entregable: Core compila y sus pruebas/caracterización conservan comportamiento. Salida: login de ambas audiencias y operaciones actuales de usuarios/organización/roles/planes verificadas.

### S05 — Adaptar Dentistry backend

Responsable: agente Dentistry, con contrato S03 congelado. Puede desarrollarse junto con S04 en archivos propios.

- Actualizar queries que leen Core y las tablas/modelos propios renombrados.
- Ajustar citas de extremo a extremo: DTO, parámetros, filtros, commands, entidad, repositorio, mapper y cancelación. Mapear nombres nuevos sin variar validaciones.
- Mantener servicio obligatorio, autoasignación actual, validación de organización/sucursal y algoritmo actual de solapamiento. Mejoras ya planificadas se harán después.
- Mantener funcionalidad de pacientes/servicios y registro de módulos actual. No activar módulos no importados ni crear nuevos endpoints clínicos.
- Actualizar referencias a tablas sin API, transacciones y SQL si existen, sin suponer que su falta de pantalla permite borrar filas.
- Actualizar fixtures y pruebas de audiencias/tenant. No cambiar el protocolo JWT ni sus claims por cambiar el modelo Membership.

Entregable: Dentistry compila y preserva operaciones existentes. Salida: pruebas de autenticación/aislamiento y CRUD/citas actuales con datos reales de ensayo.

### S06 — Adaptar ambos frontends y BFF

Responsable: agente clientes. Contratos de S01/S03/S04/S05 estables.

- Leer AGENTS local y documentación local de Next antes de escribir código frontend.
- Core: tipos de Plan, formularios de creación/edición, schemas, servicios, asignaciones, consultas y rendering usan entitlements/isActive coherentes con backend.
- Dentistry: tipos de citas, creación, filtros, mapas de estados, grilla, detalle, cancelación, mocks vinculados y formularios adoptan nombres nuevos sin cambiar navegación ni reglas de UI.
- Actualizar allowlist de parámetros del BFF, sanitización, serializers, error handling y adapters. No relajar controles de sesión/origen ni permitir rutas adicionales.
- Mantener storage keys, payloads locales v1 e identidad de ClinicalHistory como expediente compuesto donde ese es el significado real. No migrar datos de navegador por coincidencia de nombre.
- Mantener layout, textos, estilos y organización de carpetas existentes salvo archivos cuyo nombre semántico sí cambie. No sustituir módulos legacy por features nuevas en este refactor.
- Asegurar que la nueva build reconoce los payloads nuevos y que la ventana contempla recarga de pestañas/asset cache. No añadir compatibilidad de generaciones si el despliegue coordinado ya la resuelve.

Entregable: ambos frontends construidos y recorrido manual comparable. Salida: ningún caller envía la forma vieja a los nuevos endpoints; los datos locales anteriores siguen legibles.

### S07 — Integración, empaquetado y ensayo completo

Responsable: integrador; revisión independiente de QA si se asigna ese agente.

- Integrar cambios contra un único contrato; reconstruir packages/db una vez y luego consumidores. Revisar que copias instaladas de @app/db no estén obsoletas.
- Ejecutar comandos de la sección 8. Resolver solo regresiones introducidas por esta entrega; documentar baseline de fallos previos.
- Validar imports con case sensitivity, extensión .js ESM, barrels y rutas de archivos. Windows puede ocultar diferencias que fallan en Docker/Linux; ensayar empaquetado de ambos backends.
- Ejecutar migración en clon de datos representativos, pruebas de paridad, lectura desde los dos backends, recorrido UI y reinicio de servicios.
- Buscar nombres viejos con clasificación de excepciones, no con objetivo ciego de cero coincidencias.
- Ensayar corte y recuperación, medir tiempos y definir límite de aborto antes de QA. Preparar artefactos y respaldo; no compilar/instalar dependencias por primera vez dentro de la ventana.

Entregable: release candidato, matriz verde o fallos previos diferenciados, evidencias de datos y runbook cronometrado. Salida: ensayo completo reproducible y reversión viable dentro de seis horas.

### S08 — Ejecutar ventana QA, cuando se autorice la ejecución

Responsable: integrador/operador de despliegue. Esta planificación no ejecuta la ventana.

Usar el runbook de la sección 9 con artefactos ya preparados. QA queda cerrado a escrituras hasta terminar la comprobación de los cuatro servicios. No ejecutar nuevas tareas de diseño durante el corte.

Salida: servicios en misma versión de contrato, sin errores de FK/imports/SQL, datos reconciliados y flujos de baseline disponibles; o recuperación completa a la versión anterior.

### S09 — Cerrar estandarización y preparar entrega funcional separada

- Registrar qué nombres se migraron, excepciones nominales que permanecen y qué retiros siguen pendientes.
- Documentar las nuevas referencias estables y la versión del contrato desplegada.
- Actualizar el estado de las tareas, sin marcar como terminadas capacidades de plan base aún mock o módulos futuros.
- Crear lista independiente para retiro de columnas/reglas nuevas; no ejecutarla como limpieza automática posterior.

## 7. Paquetes de trabajo para agentes

Este documento no ha creado ni enviado tareas a agentes. Los paquetes guían una ejecución posterior. Repartir por límites de archivos y un contrato congelado, no por búsqueda global de palabras.

| Paquete | Propiedad exclusiva | Dependencias | Entrega obligatoria |
|---|---|---|---|
| W0 Integración/contrato | packages/db, manifest, migración, artefactos compartidos y release | Baseline y S01 | Contrato congelado, SQL/evidencias, comandos y runbook. |
| W1 Core | core/backend/src y test | W0; API objetivo acordada | Imports/DI/ORM/DTO coherentes; tests y comportamiento actual. |
| W2 Dentistry | dentistry/backend/src y tests | W0; API objetivo acordada | Nombres de citas/servicios/referencias Core, validación y tests. |
| W3 Clientes | core/frontend y dentistry/frontend | Payloads congelados; puede avanzar en paralelo tras S01 | BFF/forms/services/types/grilla, build y recorrido UI. |
| Revisión QA | Pruebas de integración/evidencia, sin cambiar el contrato unilateralmente | W0-W3 integrados | Dictamen de paridad, defectos introducidos y recuperación ensayada. |

Como máximo cuatro frentes simultáneos incluidos integrador; revisión QA puede ser una etapa posterior. No delegar por la mera existencia de estos paquetes: el ejecutor decide la asignación conforme a las instrucciones activas del entorno.

Reglas de coordinación:

1. Solo W0 modifica schema.ts, generated, migraciones/snapshots/refs y empaquetado compartido. W1/W2/W3 solicitan cambios de contrato mediante el manifest.
2. No regenerar @app/db en paralelo mientras otros consumen archivos a medio escribir. Congelar artefactos por checkpoint y notificar versión/hash.
3. Las tareas incluyen archivos permitidos, nombres antes/después, exclusiones de comportamiento y payload de ejemplo. No autorizan despliegue ni cambio de entorno por implicación.
4. Evitar que dos agentes renombren el mismo archivo/barrel. Si cambia un path compartido, el propietario avisa y actualiza consumidores coordinadamente.
5. Cada agente reporta archivos, mapeos cerrados, comandos y resultados reales, fallos previos/nuevos, referencias pendientes y dependencias de integración. No reportar pruebas como aprobadas si no se ejecutaron.
6. Una necesidad de cambio funcional descubierta se registra aparte. No se camufla como rename ni se cambian tests de negocio para justificarla.

Plantilla de encargo:

```text
Objetivo: aplicar el paquete Wn del plan semántico manteniendo paridad con baseline <revisión>.
Contrato congelado: <versión/hash>; manifest: <ruta/checkpoint>.
Archivos propios: <rutas>; archivos compartidos: solo lectura.
Renombres: <lista exacta>; API objetivo: <request/response/filtros>.
Preservar: <reglas, estados, acceso, datos, nulabilidad y errores>.
Excluir: retiros de columnas, módulos nuevos, tipos nuevos, cambios de permisos/dependencias.
Validar: <comandos y casos pertinentes>; dejar evidencia verificable.
Entrega: diff acotado, resultados, excepciones y pendientes de integración.
```

## 8. Verificaciones y comandos del repositorio

### 8.1 Comandos identificados, no ejecutados por este documento

Desde la raíz, en el entorno local/de ensayo preparado:

```powershell
npm.cmd --prefix packages/db run build
npm.cmd --prefix core/backend test
npm.cmd --prefix dentistry/backend run build
npm.cmd --prefix dentistry/backend test
npm.cmd --prefix core/frontend run build
npm.cmd --prefix dentistry/frontend run build
```

Core test ya compila su backend. Dentistry test consume dist y no compila: el build anterior es obligatorio. No existe un script frontend test en los package.json revisados; no inventarlo como check disponible. Ambos backends tienen lint con --fix: no usarlo como comprobación inocua de solo lectura durante un refactor acotado.

Comandos del contrato, desde packages/db y con conexión verificada al entorno de ensayo:

```powershell
npm.cmd run contract:emit
npm.cmd run migration:plan -- --name semantic_standardization
npm.cmd run migration:show
npm.cmd run migration:status
npm.cmd run db:verify
```

La sintaxis concreta de flags se confirma con el CLI instalado antes de usarla. `migration:plan` no implica aplicar. `migrate` solo corresponde al ensayo/ejecución autorizados y entorno confirmado. No ejecutar `db:update` ni `db sign` contra QA o base compartida aunque haya scripts con esos nombres.

El plan no requiere nuevas dependencias ni actualizaciones de Prisma/Next/TypeScript. Si un build necesita red u otro permiso, se maneja como una necesidad explícita del comando, no cambiando de herramienta para evitar controles.

### 8.2 Matriz de regresión

| Caso | Antes/después debe coincidir salvo nombres aprobados |
|---|---|
| Login Core, login Dentistry, /auth/me, refresh/logout disponibles | Audiencias, permisos, claims, cookies y efectos de sesión. |
| Usuario/organización/membresía/sucursal inválida | Rechazo actual; no ampliar acceso. |
| Alta de usuario con membresía y roles | Mismas asociaciones/transacción y errores de duplicado. |
| Organización con sucursales/roles | Mismos ids, asignaciones y listado. |
| Roles/permisos | Reemplazo idempotente y rechazo de ids ajenos/inexistentes. |
| Plan crear/editar/listar/activar/desactivar | Mismo contenido JSON y efecto de activo; payload con nombres nuevos. |
| Asignar, renovar, suspender/cancelar plan | Mismas fechas/contadores/restricciones y acceso resultante. |
| Pacientes CRUD actualmente disponible | Mismos datos/filtros y comportamiento de borrado. |
| Servicios CRUD/selección/asociación a citas | Mismos datos y reglas de habilitación. |
| Citas crear/listar/filtrar/detalle/cambiar estado/cancelar | Mismos horarios, validaciones, permisos y efectos; cancelación normalizada. |
| Solapamiento e intento de asignar otro profesional | Misma aceptación/rechazo de QA actual; la regla futura no se introduce aquí. |
| FK y unicidad real | Mismos targets, cardinalidades y error HTTP de negocio tras SQL real. |
| Datos clínicos futuros ya existentes | Mismos ids y contenido textual/fechas después de rename, aunque aún no haya pantalla. |
| Historial mock/local y navegación | Mismos datos locales legibles, rutas y funcionalidades de demo; no declararlas persistencia nueva. |
| Artefacto Docker/Linux | Ambos backends inician y leen BD migrada con contrato empaquetado correcto. |

### 8.3 Búsqueda residual y exclusiones legítimas

Usar rg primero, excluyendo node_modules, dist, .next y storybook-static. Revisar schema/runtime/tests y clasificar resultados; no reemplazar globalmente.

| Coincidencia antigua | Tratamiento |
|---|---|
| Modelo/propiedad en código activo cubierto por manifest | Pendiente de corregir o justificar. |
| Migración histórica/snapshot aplicado | Conservar; es evidencia y parte del grafo. |
| Header Authorization | Conservar; protocolo HTTP. |
| JWT membershipId, variables de sesión/cookies | Conservar si pertenecen al protocolo congelado. |
| ClinicalHistory del read model compuesto | Conservar si su significado sigue siendo expediente completo. |
| deleted, serviceId singular, inventoryItemId, takenAt | Conservar porque su retiro está diferido y debe seguir funcionando. |
| Mapeo de nombre viejo/nuevo en migración, fixture de baseline o prueba de conversión | Conservar con propósito explícito. |
| Eventos de auditoría históricos | Conservar; los lectores contemplan la historia. |
| Campo legacy sin consumidor activo demostrado | Registrar; no borrar ni mantener un alias indefinido automáticamente. |

### 8.4 Equivalencia de datos y objetos

- Comparar conteo e identidades de las 25 tablas, antes/después por mapeo. Solo contar filas no detecta pérdida/cambio de contenido.
- Comparar por PK todos los valores preservados mediante proyección de nombres; normalizar únicamente CANCELLED → CANCELED. No aceptar cambios incidentales en updatedAt por un rename.
- Comparar tipos, defaults, nullability, PK/UNIQUE/FK, referencias, onDelete/onUpdate e índices con mapeo de nombres. No añadir restricciones del diccionario en este lote.
- Verificar objetos externos del schema (views, triggers, funciones, consultas raw) antes de afirmar que un rename es completo.
- Registrar contrato inicial/final y marker coherente para cada artefacto; no revelar secretos ni copiar registros clínicos a documentación versionada.

## 9. Runbook de QA para ventana de seis horas

La distribución siguiente es un presupuesto de tiempo propuesto, no una estimación medida. Se ajusta con S07; si el ensayo no deja margen suficiente para recuperación, no se inicia el corte.

| Tiempo relativo | Acción | Salida verificable |
|---|---|---|
| Antes de T0 | Artefactos nuevos/anteriores preparados, ensayo concluido, respaldo/restauración probados, checklist y operador asignados. | Sin instalaciones/builds inéditos pendientes. |
| T0–T+30 min | Cerrar acceso de frontends/API; detener escrituras de ambos backends y jobs; comprobar revisión/contrato/estado real. | Sin clientes escribiendo ni versiones desconocidas. |
| T+30–T+60 min | Respaldo final y captura de evidencias con escrituras detenidas. | Punto recuperable consistente, evidencia accesible al operador. |
| T+60–T+120 min | Ejecutar migración nominal revisada y verificar contrato/datos/relaciones. | Contrato final coherente y equivalencia preservada. |
| T+120–T+180 min | Iniciar ambos backends y ambos frontends en versión nueva, mantener acceso restringido, smoke de integración/UI. | Funciones baseline verificadas con cuentas de prueba. |
| T+180 min | Decisión de continuar o recuperar según checklist y presupuesto medido. | Ninguna regresión crítica abierta ni duda sobre datos/contrato. |
| T+180–T+300 min | Si falla, recuperación ensayada; si pasa, validaciones finales y observación restringida. | Versión coherente nueva o anterior operativa. |
| T+300–T+360 min | Margen final, recarga de clientes y reapertura controlada; registrar resultado. | QA disponible dentro de la ventana acordada. |

El límite T+180 solo es válido si la recuperación ensayada cabe en el tiempo restante. Si dura más, mover el límite antes. No consumir margen de recuperación desarrollando fixes improvisados durante QA.

Bloquear/revertir ante pérdida de datos, diferencias de acceso, contrato/marker incompatible, FK erróneas, sesiones rotas, errores de import/case o un flujo baseline crítico que deja de funcionar. Un fallo previo conocido no se atribuye al refactor sin comparación.

### Recuperación

1. Mantener escrituras cerradas y detener artefactos nuevos.
2. Aplicar la recuperación ensayada: reversión nominal gestionada con contrato/marker coherente o restauración del respaldo final completo. El mecanismo se elige y prueba en S03/S07; no se inventa un comando down.
3. Reponer ambos backends y ambos frontends anteriores con su versión anterior de @app/db. Revertir solo código sobre BD renombrada no es recuperación válida.
4. Repetir db:verify y smoke de autenticación/planes/citas antes de reabrir.
5. Registrar escrituras de prueba hechas durante smoke; si se restaura respaldo final, solo esas pruebas controladas se descartan.

Después de reabrir a escrituras reales, no restaurar un respaldo antiguo sin plan de conciliación: perdería cambios posteriores. Preferir corrección hacia delante o abrir una nueva ventana con captura de deltas/recuperación definida.

## 10. Entregables y definición de terminado

| Entregable | Responsable | Comprobación |
|---|---|---|
| Baseline y matriz de paridad | Integrador | Revisión QA identificada y casos antes/después. |
| Manifest de nombres y referencias | W0 con responsables | 17 tablas, 15 columnas, relaciones/estado y exclusiones cubiertos. |
| Contrato/migración | W0 | Grafo/marker coherentes; no drop funcional ni cambio de tipos/reglas. |
| Código Core/Dentistry | W1/W2 | Compilación, pruebas y requests/responses coherentes. |
| Clientes/BFF | W3 | Builds, filtros/payloads actualizados, recorrido UI y datos locales conservados. |
| Paquetes de despliegue | Integrador | Contrato correcto incluido en ambos runtimes; case/imports verificados. |
| Evidencia de datos y recuperación | Integrador/QA | Comparación por PK/contenido y reversión/restauración ensayada. |
| Cierre | Integrador | Regresiones resueltas, excepciones justificadas, funcionalidad futura separada. |

No declarar terminado porque no aparezcan palabras antiguas en rg ni porque un build pase. Deben funcionar las relaciones reales, llamadas de clientes y flujos baseline de QA.

## 11. Pendientes concretos antes de ejecutar

1. Identificar revisión y entorno reales de QA, forma de desplegar cuatro servicios y acceso a clon/restauración.
2. Medir backup/migración/recuperación y ajustar el presupuesto de seis horas.
3. Confirmar sintaxis/soporte del CLI instalado para renombres, mapping e identidad del contrato; mantener versiones existentes.
4. Congelar manifest/payloads y responsables de archivos. No dejar cada agente decidir traducciones distintas.
5. Definir tratamiento de pestañas/caché al finalizar ventana; preferir recarga coordinada.
6. Registrar estado previo de los tests y funcionamiento de cada pantalla. Las decisiones clínicas y de planes pendientes del diccionario permanecen para otra entrega.

Este plan permite ejecutar un refactor nominal acotado, verificarlo y recuperarlo. No autoriza implementar todo el schema objetivo como una única migración.
