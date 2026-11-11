# Plan de implementación: atenciones clínicas persistentes

**Estado (2026-11-11):** la feature está conectada al backend real mediante el BFF; el mock y su flag se eliminaron. Archivos y radiografías (E6) siguen pendientes. Este documento no autoriza cambios de esquema, migraciones ni endpoints.  
**Fecha de sondeo:** 2026-11-06. **Última actualización:** 2026-11-08.  
**Alcance:** Dentistry frontend y sus contratos HTTP ya disponibles. Quedan fuera identificación 3D y facturación/proforma.  
**Contrato HTTP solicitado:** [clinical-encounter-api-requirements.md](clinical-encounter-api-requirements.md).

## Estado actual verificado (2026-11-08)

| Aspecto | Hecho comprobado en el código |
| --- | --- |
| Ubicación | `dentistry/frontend/src/features/clinical-encounter/` con `api`, `components`, `config`, `data`, `hooks`, `services`, `types` y `utils`. No existe `views/`: las páginas de la feature viven en `components/*-page.tsx`. |
| Integración | `services/clinical-encounter.http.ts` llama al BFF para atenciones, procedimientos, perfil de salud y datos de referencia; los tres métodos de archivos rechazan con `ClinicalEncounterApiUnavailableError` y la UI muestra “Adjuntos aún no disponibles”. Las mutaciones comprueban el contexto de sesión como `features/patient`. |
| Fuente de datos | Única: HTTP. Se retiraron `config/clinical-encounter-mode.ts`, `NEXT_PUBLIC_CLINICAL_ENCOUNTER_DEMO`, `data/mock.ts` y `services/clinical-encounter.mock.ts`. |
| Permisos usados | `dentistry:encounters:read`, `dentistry:encounters:create`, `dentistry:encounters:update` y `dentistry:encounters:void`, declarados en `features/dev-auth/types/personas.ts` y comprobados en las páginas de listado, alta, detalle y `patient-health-profile-page.tsx`. El perfil de salud comprueba `dentistry:encounters:read` para lectura y `dentistry:encounters:update` para edición; Recepción no dispone de esos permisos. |
| Rutas UI | Implementadas el 2026-11-08 en `src/app/(platform)/patients/[patientId]/`; cada `page.tsx` solo pasa ids a un componente de la feature. |
| Verificación | No se ejecutaron `tsc` ni pruebas en esta tarea documental: **verificar en Ola 3**. Existen pruebas de mock, utilidades, formulario de alta, detalle, filtros y perfil de salud en `tests/clinical-encounter-*.test.mjs`, pero su resultado no se certifica aquí. |

| Ruta UI | Estado |
| --- | --- |
| `/patients/[patientId]/clinical-encounters` | Implementada; compone `ClinicalEncounterListPage`. |
| `/patients/[patientId]/clinical-encounters/new` | Implementada; compone `ClinicalEncounterCreatePage`. |
| `/patients/[patientId]/clinical-encounters/[encounterId]` | Implementada; compone `ClinicalEncounterDetailPage`. |
| `/patients/[patientId]/health-profile` | Implementada; compone `PatientHealthProfilePage`. |

Estas rutas son de interfaz, no contrato HTTP, y no están aprobadas por Backend. El contrato HTTP propuesto se detalla en el documento enlazado.

## Resultado del sondeo

### Contrato persistente ya aplicado

`@app/db` es el único dueño del contrato. El esquema ya contiene los recursos que necesita la funcionalidad:

| Recurso | Hechos relevantes para la interfaz |
| --- | --- |
| `Patient` | `firstName`, `lastName`, `birthDate?`, `sex?`, `maritalStatus?`, `occupation?`, `origin?`, `address?`. La edad se calcula en el cliente desde `birthDate`; no se persiste. |
| `PatientHealthProfile` | Un perfil por paciente, con textos opcionales: `medicalHistory`, `allergies`, `currentMedications`, `dentalHistory`, `relevantConditions`, `observations`. |
| `ClinicalEncounter` | Tiene paciente, sucursal, profesional, `startedAt`, `endedAt`, `examinationSummary`, `procedureSummary?`, notas y estados `IN_PROGRESS`, `COMPLETED`, `VOIDED`. `appointmentId` y `treatmentId` son opcionales. Completar exige cierre y trazabilidad de quien completa, pero no procedimientos. |
| `ClinicalEncounterProcedure` | Tiene una fila por acción/ámbito. `targetType` admite `TOOTH`, `REGION`, `WHOLE_MOUTH` u `OTHER`; `toothNumber` es obligatorio solo para `TOOTH`. Puede enlazar opcionalmente a `treatmentProcedureId`. |
| `Treatment` / `TreatmentProcedure` | Un tratamiento puede no tener `serviceId`; cada procedimiento pertenece a ese tratamiento y tiene objetivo, descripción, orden y estado. |
| `ClinicalFile` / `Radiograph` | Solo representan metadatos y referencias de almacenamiento. Un archivo radiográfico usa categoría `RADIOGRAPH`; `Radiograph` complementa a un único `ClinicalFile`, sin duplicar binarios. |

No se modificarán estos modelos ni se usarán aliases de dominio. En particular, no se confundirá el prototipo local llamado `ClinicalHistory` con `PatientHealthProfile` ni con el expediente persistente.

### APIs y BFF encontrados

| Recurso | Backend Dentistry | BFF `/api/dentistry` | Decisión de la feature |
| --- | --- | --- | --- |
| Pacientes | CRUD autenticado, con permisos | Permitido | Reutilizar la feature moderna `features/patient`, después de ampliar el contrato de filiación. |
| Citas | Crear, listar, detalle, estado y cancelación autenticados | Permitido | Solo permitir enlazar una cita existente; una atención no requiere cita. |
| DentalService | CRUD disponible | Permitido | Puede mostrarse como contexto de un tratamiento cuando el endpoint de tratamientos lo devuelva; no equivale a un procedimiento realizado. |
| Profesionales | `GET /clinic/professionals` existe, pero recibe `organizationId` y no tiene las guardas clínicas observadas | **No permitido** | No consumirlo hasta que Backend defina y proteja el contrato, y BFF lo autorice. |
| Treatment / TreatmentProcedure | Sin controlador ni rutas | No disponible | Bloquea el selector que vincula lo realizado con el plan. |
| PatientHealthProfile | Sin controlador ni rutas | No disponible | Bloquea la edición/lectura de antecedentes. |
| ClinicalEncounter / ClinicalEncounterProcedure | Sin controlador ni rutas | No disponible | Bloquea registro, listado, detalle, finalización y procedimientos. |
| ClinicalFile / Radiograph | Sin controlador, rutas ni flujo de subida | No disponible | Bloquea adjuntos y radiografías persistentes. |

La solicitud concreta está en [clinical-encounter-api-requirements.md](clinical-encounter-api-requirements.md). Las rutas de esa solicitud son propuestas de contrato, no endpoints que el frontend deba asumir antes de estar implementados y permitidos por el proxy.

### Arquitectura de clientes encontrada

- `core/frontend` es la referencia estructural: página fina en `app`, feature con `api`, `services`, `hooks`, `schemas`, `types`, `components` y `views`, TanStack Query para estado remoto y BFF autenticado.
- `dentistry/frontend` ya posee esa estructura para `features/patient`: `requestJson`, claves/query options, mutaciones que comprueban el contexto de sesión e invalidan caché. Es la base a extender.
- Coexiste el legado `src/modules/clinic`, que hace `fetch` directamente y contiene pantallas de agenda, tratamientos y mocks. No se ampliará para esta entrega: el código nuevo vive en `src/features/clinical-encounter` y solo integra APIs reales.
- El actual `features/clinical-history` es un prototipo de datos ficticios guardados en `localStorage`, visible en desarrollo. Sus modelos, adjuntos data-URL y componentes no se conectarán a datos clínicos reales ni se reutilizarán como contrato.
- La ruta actual de detalle `app/(platform)/patients/[patientId]/page.tsx` compone `PatientDetailPage`; será el punto de entrada para contexto del paciente y enlaces a las atenciones. Las nuevas páginas de detalle deberán ser archivos de ruta finos que importen vistas de la feature.

### Catálogo UI y Storybook

`@app/ui` ya exporta, entre otros: `PageContainer`, `PageHeader`, `FilterToolbar`, `Button`, `Input`, `Select`, `Combobox`, `DatePicker`, `TimePicker`, `SectionHeader`, `Badge`, `Card`, `EmptyState`, `ResponsiveModal`, `MobileFilterSheet`, `MobileCardItem` y `ResponsiveTable`.

Patrones que se usarán:

- `PageHeader` y `PageContainer` para listado, detalle y contexto del paciente.
- `FilterToolbar` más `MobileFilterSheet` para filtros secundarios de historial; `ResponsiveTable` en escritorio y `MobileCardItem` en móvil. No usar el `DynamicTable` local para esta feature porque su propio `AGENTS.md` registra problemas de hooks, key de filas y falta de modo controlado.
- `ResponsiveModal`, `SectionHeader`, `Combobox`, `DatePicker` y `TimePicker` para creación/edición de la atención. En móvil, `ResponsiveModal` entrega un `BottomSheet` accesible automáticamente. Los campos de solo lectura usan el `ReadonlyField` local de la feature (`components/clinical-encounter-readonly-field.tsx`), no un componente de `@app/ui`.
- `Combobox` para paciente, tratamiento/procedimiento y, solo después de contrato aprobado, profesional y sucursal. Su `onSearchChange` permite búsqueda remota con debounce; no cargar catálogos ilimitados en el navegador.
- Los estados de objetivo, avance y cierre se representan con `Badge`; estados sin datos con `EmptyState`.

Antes de escribir cualquier componente compartido nuevo se comprobará el catálogo en Storybook (`npm run storybook` desde `packages/ui`) y sus stories. Si aparece una necesidad reutilizable por Core y Dentistry, se propondrá en `packages/ui` con story y prueba; si es exclusiva de la atención clínica, permanece en la feature y no se infla el design system.

## Reglas que gobiernan la implementación

1. Antes de escribir código Next.js se leerá la guía pertinente de `dentistry/frontend/node_modules/next/dist/docs/`, como exige su `AGENTS.md`.
2. `app/**/page.tsx` solo compone vistas. La feature será dueña de sus endpoints, servicios, hooks, esquemas, tipos y componentes; `shared` solo recibirá piezas que tengan dos consumidores reales.
3. El navegador solo llamará al BFF del mismo origen. Se añadirá una regla explícita al allow-list de `dentistry-proxy.ts` únicamente después de que el controlador Nest, método, query y payload estén aprobados. El BFF conserva cookie HttpOnly, origen estricto para mutaciones, JSON y su límite de 64 KiB.
4. Nest sigue siendo quien deriva identidad, organización y permisos de la sesión. El cliente no envía `organizationId`, `createdByMembershipId`, `completedByMembershipId`, ni claves/buckets de almacenamiento como autoridad.
5. Las fechas civiles se mantienen como `YYYY-MM-DD`; instantes como `startedAt` y `endedAt` viajan como ISO 8601. La edad se calcula desde la fecha civil sin desplazarla por zona horaria.
6. Una acción para varias piezas se expande en el formulario a varias filas `ClinicalEncounterProcedure`, con la misma descripción y una pieza FDI por fila. No se guarda una lista dentro de `toothNumber`.
7. `procedureSummary` es un texto narrativo opcional en la UI; no se infiere ni se exige a partir de las filas. Una atención puede completarse con cero filas de procedimiento. **La obligatoriedad de `procedureSummary` al completar está en disputa documental**; hasta que Backend decida, el frontend no lo exige. Ver [clinical-encounter-api-requirements.md](clinical-encounter-api-requirements.md), sección de decisiones pendientes.
8. No se habilita edición destructiva de una acción clínica: el contrato debe usar la transición `VOIDED` y su motivo si esa capacidad se incluye. No se borra historial clínico desde la UI.
9. Los archivos no se codifican en data URLs ni se suben por el BFF JSON. El proveedor, bucket, key, checksum y estado de carga los controla el backend mediante un flujo de almacenamiento autorizado.
10. No se amplía alcance hacia odontograma/identificación 3D, cobros, proforma, migraciones, cambios de dependencias o cambios visuales ajenos.

## Plan por fases

### Fase 0 — Cerrar contratos y baseline

**Dependencia:** Backend implementa y publica los endpoints solicitados, sus permisos y respuestas; frontend actualiza el allow-list BFF para esos endpoints exactos.

1. Congelar ejemplos JSON, códigos de error y permisos con Dentistry Backend.
2. Acordar si el profesional siempre es la membresía de sesión o quién puede elegir otro profesional; también cómo se obtienen nombres de sucursales autorizadas.
3. Acordar el flujo de subida y el formato de URL firmada/confirmación; nunca exponer credenciales de storage.
4. Comprobar la base y contrato ya aplicado solo en modo de lectura; no ejecutar `db:update`, SQL directo ni migraciones.
5. Registrar el baseline de `git status`, `tsc --noEmit` y las pruebas pertinentes antes de modificar código. Los cambios de terceros ya detectados en `dentistry/frontend` y `packages/ui` no se tocarán.

### Fase 1 — Contratos frontend y filiación

**Propiedad de archivos:** `dentistry/frontend/src/features/patient/**` y la nueva feature; no `packages/db`.

1. Extender los tipos, schema Zod, formulario, servicio y vista de paciente para `maritalStatus`, `occupation` y `origin` solo cuando `GET/PATCH /patients/:id` los acepte y devuelva. Mantener `address`; no reutilizar `notes` para esos campos.
2. Añadir el recurso `health-profile` en `features/clinical-encounter` (o extraer una feature de perfil solo si hay otro consumidor real), con query/mutación y validación de los seis textos opcionales.
3. Mostrar filiación, edad derivada y alertas de alergias desde el perfil persistente. Vacío significa “sin registrar”, no “sin antecedentes/alergias”.
4. Agregar al detalle de paciente enlaces a `Atenciones clínicas`, perfil de salud y nueva atención según permisos reales, sin sustituir la pantalla de paciente existente.

### Fase 2 — Feature de atenciones clínicas

**Estructura real implementada:**

```text
dentistry/frontend/src/features/clinical-encounter/
├── api/
│   ├── endpoints.ts          # rutas anidadas bajo /patients/:id (propuesta)
│   └── query-options.ts
├── components/               # paneles, campos, badges, toast-stack,
│                             # patient-context-boundary, páginas *-page y
│                             # modales (procedure, complete, void)
├── hooks/                    # use-clinical-encounter-data, mutations, toasts
├── services/                 # service (datasource HTTP), http, error
├── types/clinical-encounter.ts
└── utils/                    # age, dates, format, procedures, y helpers de
                              # formulario, filtros y detalle
```

Rutas implementadas, sujetas al contrato HTTP: `/patients/[patientId]/clinical-encounters`, `/patients/[patientId]/clinical-encounters/new`, `/patients/[patientId]/clinical-encounters/[encounterId]` y `/patients/[patientId]/health-profile`. Cada página de `app` se limita a pasar ids a un componente `*-page` de la feature; `PatientContextBoundary` resuelve el paciente real con el contrato existente de `features/patient`.

1. Implementar queries con claves que incluyan paciente, filtros y paginación; invalidar listado, detalle de atención y detalle de paciente después de mutaciones exitosas.
2. El formulario de alta permite crear sin `appointmentId`, con paciente y sucursal, profesional de la política aprobada, inicio, exploración (`examinationSummary`), observaciones clínicas y resumen de procedimientos opcional. El cierre se muestra separado de la creación inicial.
3. La vista de detalle enseña cronología, campos clínicos, cita enlazada si existe, tratamiento enlazado si existe, acciones registradas y adjuntos. No presenta asociaciones como si fueran entidades destino: una colección de procedimientos sigue siendo `ClinicalEncounterProcedure`.
4. La finalización solicita `endedAt` y llama a la operación explícita de completar. El estado completado bloquea acciones no permitidas por backend y permite cero procedimientos.

### Fase 3 — Procedimientos realizados y planes

1. Cargar tratamientos del paciente y sus `TreatmentProcedure` desde endpoints reales; un `DentalService` es contexto opcional de plan, no sustituto de `Treatment`.
2. El editor tiene objetivo `TOOTH`, `REGION`, `WHOLE_MOUTH` u `OTHER`; exige pieza FDI solo en `TOOTH`, limpia `toothNumber` al cambiar de tipo y muestra `targetDescription` cuando aporta contexto.
3. La selección múltiple de piezas crea un payload por pieza. El backend valida que todo `treatmentProcedureId` pertenece al mismo paciente, organización y tratamiento visible; el frontend no lo presupone.
4. Implementar sólo las transiciones de edición/anulación que el endpoint soporte. Una fila anulada conserva su evidencia y motivo; no se elimina del historial.

### Fase 4 — Adjuntos y radiografías

1. Conectar el flujo existente que Backend publique: crear intención, enviar binario directamente al almacenamiento autorizado, confirmar, consultar metadatos y, si procede, anular/eliminar con trazabilidad.
2. Permitir asociar archivo a paciente y opcionalmente a atención/tratamiento/cita según el contrato. Para radiografías, usar `category: RADIOGRAPH` y solicitar los metadatos `Radiograph` permitidos (`radiographType`, pieza/región/lateralidad/notas).
3. No guardar binarios, URLs firmadas persistentes ni datos sensibles en `localStorage`; las URLs de descarga se solicitan al backend y expiran.

### Fase 5 — Storybook, accesibilidad y verificación

1. Revisar en Storybook las combinaciones de componentes de formulario existentes antes de añadir CSS propio. Crear stories únicamente para composición que pueda ser compartida; mantener los datos clínicos ficticios y sin identificadores reales.
2. Probar teclado, foco, escape/backdrop, mensajes de error, lectura de labels, estado de carga y layout en escritorio/móvil. Los campos de solo lectura usan el `ReadonlyField` local de la feature, no inputs deshabilitados.
3. Validar alta sin cita, alta y cierre sin procedimientos, una fila por cada pieza de lote, objetivo no dental, enlace válido/inválido a `TreatmentProcedure`, filiación parcial, perfil vacío y radiografía.
4. Ejecutar las verificaciones proporcionadas y reportar resultados reales: `tsc --noEmit` con cero errores, pruebas frontend relevantes y `npm run build` de Dentistry. Para modificaciones de UI compartida, además pruebas y build de Storybook. Si cambia backend, compilar Dentistry backend antes de sus tests.
5. Hacer un commit atómico solo cuando exista ticket y pase el quality gate: `<type>(<scope>): <id-ticket> - <descripción>`. No mezclar los cambios de terceros ya presentes.

## Criterios de salida

- La interfaz no contiene mocks ni `localStorage` para datos clínicos persistentes, y la fuente mock queda desactivada en producción.
- Toda llamada tiene controlador Nest autenticado/autorizado y regla BFF equivalente.
- El adaptador HTTP cubre las doce operaciones del datasource y traduce los errores del backend a mensajes accionables.
- Se puede crear y completar una atención sin cita ni procedimientos.
- Cada procedimiento realizado conserva descripción, objetivo válido, pieza solo cuando corresponde y vínculo opcional verificable a `TreatmentProcedure`.
- Filiación y perfil de salud usan los campos del contrato, y edad se muestra derivada.
- Radiografías y archivos usan metadatos persistentes y el flujo de storage aprobado.
- Storybook y el design system se reutilizan sin duplicar primitives ni incorporar un componente compartido sin segundo consumidor.
