# Plan de limpieza de código sin uso

Fecha: 2026-10-22. Rama de referencia: dev.
Estado: limpieza ejecutada por lotes; resultados y límites en [el reporte de ejecución](code-cleanup-execution.md), inventario en [el manifiesto](code-cleanup-manifest.json).

## Objetivo y límites

Retirar código cuya falta de uso pueda demostrarse y reducir duplicación de mantenimiento sin alterar comportamiento, contratos HTTP, persistencia ni apariencia. Evitar una reorganización general antes de validar el plan base con usuarios.

La migración semántica ya fue aplicada por el usuario y db:verify/migration:status resultaron satisfactorios. El usuario confirmó después que la aplicación funciona. Esta confirmación es evidencia funcional general, no una matriz de pruebas ni confirmación de un despliegue nuevo de los cuatro servicios.

La estandarización quedó guardada en el commit local 076dfb7 antes de eliminar archivos. El primer lote de limpieza está en 0ed70f1. Conservar cambios ajenos; no usar reset/clean para obtener un punto de partida. No revertir el contrato nuevo sobre la base ya migrada.

Fuera de esta entrega: eliminar tablas/columnas, editar migraciones históricas, sustituir mocks por APIs, desarrollar módulos futuros, mover todo modules a features, rediseñar UI, actualizar dependencias o consolidar estilos sin prueba de equivalencia.

## Evidencia inicial

Se ejecutó TypeScript con --noEmit --incremental false --noUnusedLocals --noUnusedParameters, sin modificar la configuración:

| Proyecto | Resultado |
|---|---|
| Core frontend | Comprobación completada sin diagnósticos. Esto no demuestra ausencia de archivos o exports sin uso. |
| Dentistry frontend | Diez diagnósticos de declaraciones/parámetros sin uso, detallados abajo. |
| Core backend | Comprobación interrumpida por falta de memoria; resultado incompleto. |
| Dentistry backend | Comprobación interrumpida por falta de memoria; resultado incompleto. |

Las cuatro comprobaciones se iniciaron en paralelo. Repetir las de backend una por una con capacidad disponible antes de concluir su inventario; no cambiar tipos o configuración para ocultar el fallo de recursos. No se ejecutaron nuevamente los builds completos ni las suites de pruebas para esta propuesta.

| Archivo en dentistry/frontend/src | Hallazgo | Tratamiento propuesto |
|---|---|---|
| modules/clinic/views/ClinicDashboard.tsx | Parámetro newPat no leído en onSuccess. | Candidato a retirar el parámetro, conservando callback y navegación. |
| modules/clinic/views/CreatePatient.tsx | Import React no leído. | Revisar si tiene efectos laterales y retirar únicamente el import innecesario. |
| modules/clinic/views/Payments.tsx | Variable router no leída. | Revisar el hook y sus referencias antes de retirar inicialización/import. |
| modules/clinic/views/ServiceFormModal.tsx | Imports Badge e Icons no leídos. | Candidatos a limpieza local. |
| shared/components/icons/icons.tsx | Import ReactNode no leído. | Candidato a limpieza local. |
| shared/components/ui/modal.tsx | Import Icons no leído. | Candidato a limpieza local. |
| shared/components/data-table/components/data-table-toolbar.tsx | columns, visibleColumns y onToggleColumn no leídos. | Hay una función comentada de visibilidad de columnas. Se puede revisar la desestructuración, pero no retirar props públicas ni contratos de consumidores como limpieza automática. Leer su AGENTS.md local antes de editar. |

Además se observaron dos candidatos a análisis de alcance, todavía no certificados como código muerto:

- dentistry/frontend/src/infrastructure/hooks/useTheme.ts: la búsqueda textual inicial encontró la definición y ninguna llamada al símbolo. Comprobar imports por ruta, alias, barrels y carga dinámica antes de proponer eliminación.
- dentistry/frontend/src/features/patient/views/patient-page.tsx: existe otra pantalla de pacientes y la ruta activa patients/page.tsx importa modules/clinic/views/Patients. Comprobar todo consumidor y subárbol propio antes de retirar esta vista alternativa.

## Elementos que deben conservarse o comprobarse especialmente

- modules/clinic/__mocks__/data.ts tiene consumidores activos y se conserva. El análisis inicial encontró un consumidor de shared/data/clinic-data.ts; el seguimiento completo demostró que era exclusivamente la vista alternativa patient-page, sin ruta ni consumidores activos. Se retiró ese subárbol privado, sin fusionar datos ni cambiar IDs. No eliminar carpetas llamadas mocks por su nombre.
- El historial clínico usa localStorage. Retirar sus lecturas/escrituras o claves cambiaría el funcionamiento actual.
- CreateAppointmentModal, CreatePatientModal y RegisterPaymentModal tienen usos en pantallas activas. La existencia de formularios con nombres parecidos no prueba redundancia.
- packages/ui tiene exports públicos y Storybook. Contabilizar ambos frontends, stories y configuraciones como consumidores.
- Los endpoints Next/Nest, layouts, middleware/proxy, controladores, providers, guards y tokens DI pueden ser entradas por convención o registro. Cero imports directos no basta.
- core/backend/prisma.studio.config.ts tiene un script studio en package.json. No declarar Prisma clásico ni su configuración innecesarios sin revisar el uso de esa herramienta y otros scripts.
- packages/db conserva snapshots, migraciones, artefactos generados, pruebas y scripts de preparación que tienen función de historial o reproducción. No eliminar vocabulario antiguo del historial ni editar generados a mano.
- Revisar CSS, assets, rutas construidas, importaciones dinámicas, exports de package.json, Dockerfiles y configuración de despliegue antes de eliminar archivos o dependencias.

## Camino de ejecución

### L0. Fijar el punto de partida

1. Revisar el diff de estandarización, incluir nuevos archivos y registrar un commit candidato separado cuando se autorice su creación. No mezclarlo con eliminaciones.
2. Registrar la revisión, contrato nuevo, confirmación del usuario y fallos de build conocidos. Los builds completos de frontend siguen sin evidencia de aprobación en este entorno.
3. Mantener una lista breve de recorridos: login/sesión, organización/sucursal, acceso a Dentistry, planes, servicios, agenda, creación/cancelación de cita, pacientes e historial actualmente visible.

Salida: checkpoint de la entrega funcional y línea base reproducible.

### L1. Completar el inventario

1. Repetir el análisis de declaraciones no usadas de backend secuencialmente.
2. Trazar entradas y consumidores en cada aplicación y paquete: rutas, módulos Nest/DI, scripts/tests, Storybook y despliegue.
3. Inventariar archivos/exports/dependencias sospechosos, incluidos consumidores fuera del propio paquete. Una herramienta estática solo produce candidatos.
4. Para cada candidato registrar: ruta/símbolo, referencias encontradas, entradas verificadas, posible efecto lateral, decisión, riesgo y validación requerida.
5. Clasificar en retirar, conservar o investigar. Los elementos sin evidencia suficiente quedan en investigar.

Salida: manifiesto revisable; ningún archivo se elimina solo por una búsqueda sin coincidencias.

### L2. Limpieza local de bajo impacto

Retirar imports, variables y parámetros confirmados sin uso en lotes pequeños. Preservar llamadas con efectos laterales, callbacks, contratos públicos y comportamiento de hooks. Empezar por los siete hallazgos locales fuera del toolbar; revisar el toolbar por separado.

Salida: cambios pequeños y tipos/build aplicables aprobados, sin diferencias funcionales observadas.

### L3. Archivos y subárboles sin consumidores

Revisar primero useTheme.ts y patient-page.tsx. Si se demuestra que no son alcanzables, retirar cada subárbol con sus exports/imports privados y recursos exclusivos. Comprobar que ningún archivo compartido o ruta por convención forme parte de la eliminación.

No unificar las dos fuentes de datos de ejemplo ni los dos enfoques de pacientes en este lote si implica cambiar IDs, relaciones, estado en memoria o almacenamiento del navegador. Registrar ese trabajo como refactor funcional independiente.

Salida: por cada eliminación, evidencia de falta de consumidores y comprobaciones del área.

### L4. Dependencias y herramientas

Revisar paquetes únicamente después de cerrar el mapa de scripts, tests, DI, compilación y desarrollo. Retirar dependencias directas confirmadas sin uso mediante npm y actualizar el lockfile del paquete afectado. No editar node_modules ni retirar dependencias transitivas a mano. No actualizar versiones aprovechando la limpieza.

Validar instalación reproducible y los comandos que dependían de ese paquete. Una utilidad usada solo en desarrollo sigue teniendo un consumidor legítimo.

Salida: dependencias retiradas con motivo y reproducción comprobable, o conservadas con su uso documentado.

### L5. Cierre

1. Revisar cada eliminación contra el manifiesto y comprobar mayúsculas/minúsculas e imports ESM .js.
2. Ejecutar verificaciones correspondientes al lote y recorrer pantallas afectadas. No repetir toda la matriz por cada import.
3. Registrar commit, archivos/dependencias retirados, elementos conservados y asuntos pendientes. Separar commits por lote para facilitar recuperación del código.
4. Mantener la base en el contrato ya migrado; la limpieza no incluye SQL.

Salida: comportamiento preservado, resultados documentados y ninguna duda de uso resuelta mediante borrado automático.

## Verificación proporcional

| Cambio | Verificación |
|---|---|
| Import/variable local frontend | TypeScript sin emitir del frontend afectado; build cuando se retire un archivo o haya dudas de integración. |
| Vista/hook/recurso frontend | Tipos, build y recorrido de las rutas afectadas; comprobar estados, formularios y navegación. |
| Código backend | Build y pruebas del backend afectado; revisión de módulos/DI y endpoints relacionados. Dentistry requiere build antes de tests. |
| Paquete UI | Consumidores Core y Dentistry y catálogo Storybook. |
| Dependencia/script | Lockfile coherente, instalación reproducible y comandos afectados. |

No usar los scripts lint de backend como diagnóstico de solo lectura: incluyen --fix. No añadir pruebas que reflejen únicamente la eliminación de un import. Mantener registrados los fallos de entorno y distinguirlos de regresiones.

## Prioridad posterior

Acotar esta limpieza a los candidatos demostrados. Después, avanzar en la persistencia real de pacientes e historial fijo del plan base, tomando como referencia el diccionario y verificando qué ya está implementado. Sustituir mocks por APIs es una entrega funcional distinta y requiere su propio alcance y validación.
