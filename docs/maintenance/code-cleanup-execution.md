# Ejecución de limpieza de código sin uso

Fecha: 2026-10-22. Rama: dev. Trabajo local; sin push ni despliegue.

## Limpieza posterior de herramientas y temporales — 23/10/2026

El usuario autorizó retirar los candidatos claros del sondeo y las cinco herramientas
históricas, conservando el resto. Antes de cualquier eliminación se creó el commit
`8dd6354`, con el schema objetivo, la migración aplicada, las adaptaciones de backends,
las pruebas y la evidencia de QA. Las copias y logs ignorados por Git eran temporales,
no parte de ese respaldo versionado.

Se eliminaron 99 archivos (1 101 592 bytes): 93 temporales ignorados por Git y seis
archivos versionados. Se retiraron cuatro carpetas de tareas de `.tmp`, los cinco
scripts de transformación/sondeo y los nueve logs sueltos aprobados. Los seis archivos
versionados retirados son el borrador no ejecutable y los cinco scripts de preparación,
auditoría, ensayo y comparación puntual de la migración. También se retiraron los tres
comandos npm que llamaban a esas herramientas y se actualizaron enlaces e instrucciones.

Se conservan las migraciones/snapshots sin cambios, los contratos generados, las pruebas,
sus helpers, los informes JSON/Markdown y el código funcional. Se preservaron los otros
temporales de historial clínico, resolución de stash y marca. No se ejecutó SQL contra
QA, se modificaron sus datos ni se desplegaron servicios durante esta limpieza.

Verificación posterior: build de `@app/db` y 29 pruebas pasan (schema, migración nominal,
migración objetivo e integración de los repositorios compilados en PostgreSQL aislado).
No hay enlaces Markdown locales rotos en la documentación de DB/mantenimiento ni
referencias activas a los scripts/comandos retirados en los directorios revisados.
`git diff --check` pasa. La revisión del diff confirma que el código funcional, los
contratos y el grafo de migraciones no cambiaron respecto de `8dd6354`.

Los apartados siguientes conservan el registro de la limpieza anterior del 22/10.

## Resultado

- La estandarización previa quedó separada en el commit 076dfb7.
- El lote de declaraciones e inyección sin uso quedó separado en 0ed70f1.
- Se retiraron 42 archivos antiguos de frontend: 13 de Core y 29 de Dentistry, con 1700 líneas eliminadas en ese lote. Commit 1b6a877.
- Se retiró bcryptjs de Dentistry mediante npm. Core conserva su dependencia para las credenciales. El lockfile solo perdió la entrada del paquete y su declaración directa; ninguna versión restante cambió ni se añadió un paquete. Commit 58f44c5.
- No se ejecutó SQL, se cambió el contrato persistente ni se alteraron rutas, payloads HTTP, claves de localStorage o datos de ejemplo usados por las pantallas actuales.

El [manifiesto](code-cleanup-manifest.json) enumera las 42 eliminaciones con referencias previas y motivos, además de 22 archivos conservados deliberadamente. El [plan](code-cleanup-plan.md) mantiene el procedimiento y los límites.

## Evidencia de las eliminaciones

Se analizó el AST con el TypeScript instalado y se resolvieron módulos mediante los tsconfig de las seis aplicaciones/paquetes. Las entradas incluyeron archivos app de Next y sus entradas especiales, main de Nest, tests/scripts, configuraciones, exports y stories de UI. Se revisaron además rutas y símbolos por texto y los scripts de package.json/Dockerfiles.

El inventario pasó de 565 a 523 archivos de código; el conjunto eliminado no tenía referencias entrantes desde archivos conservados. El análisis posterior no encontró imports locales sin resolver ni cargas dinámicas con argumento no literal en los archivos examinados. Es evidencia estática, no una garantía de ejecución ni un detector universal de todas las formas de carga.

Las eliminaciones comprenden:

- Copias locales de componentes que no tenían consumidores y cuyos barrels activos usan @app/ui. Los wrappers de Core que sí se importan directamente permanecen.
- La vista alternativa features/patient/views/patient-page.tsx de Dentistry y sus adaptadores/datos privados. La ruta activa usa modules/clinic/views/Patients y los mocks de modules/clinic/__mocks__/data.ts; estos permanecen.
- Un layout antiguo de clínica, un hook de tema sin consumidores, placeholders, utilidades, tipos y constantes sin referencias desde las entradas conservadas.

Se eliminaron los 16 diagnósticos iniciales de declaraciones/parámetros sin uso: seis de backend y diez de Dentistry frontend. En el toolbar se retiraron solo las desestructuraciones no usadas; se conserva el contrato de props y la infraestructura de visibilidad de columnas.

PrismaRoleWriter sigue registrado, exportado y consumido por la creación de organizaciones. Solo se retiró la inyección que PrismaRoleRepository no utilizaba; se adaptó el constructor del fixture existente y se ejecutaron sus pruebas.

## Código conservado y decisiones pendientes

| Grupo | Decisión |
|---|---|
| Data-table: 15 archivos | Conservar biblioteca reutilizable, export interno y roadmap local. La limpieza no elimina su API ni desarrolla las mejoras de su AGENTS.md. |
| Clientes de pacientes, servicios y profesionales: 3 archivos | Conservar código preparado para la integración real. No tienen consumidores actuales; su activación requiere una entrega funcional. |
| Cliente current-session: 1 archivo | Conservar como pieza pendiente de integración; no se cambian los flujos de sesión. |
| ClinicModule/ClinicController: 2 archivos | No están registrados en AppModule. No activar el endpoint ni retirarlo incidentalmente; registrar decisión funcional sobre profesionales. |
| Escritor de auditoría Dentistry: 1 archivo | Conservar hasta definir su integración. No se elimina la política de auditoría como limpieza. |
| Mocks activos e historial con localStorage | Conservar; sustituirlos por APIs requiere otro alcance. |
| Dependencias de plataforma, validación y herramientas | Mantener las necesarias para Nest, Next, peer dependencies, configuración y desarrollo. Prisma clásico en Core tiene un script studio. No hacer una poda automática por falta de imports directos. |

## Verificación realizada

| Verificación | Resultado |
|---|---|
| TypeScript Core backend con noUnusedLocals/noUnusedParameters | Pasa después del primer lote. |
| TypeScript Dentistry backend con noUnusedLocals/noUnusedParameters | Pasa después del primer lote. |
| TypeScript Core frontend con noUnusedLocals/noUnusedParameters | Pasa después de las eliminaciones. |
| TypeScript Dentistry frontend con noUnusedLocals/noUnusedParameters | Pasa después de las eliminaciones. |
| Core backend build y tests | Pasa; 12 pruebas, incluidas las de permisos de rol. |
| Dentistry backend build y tests | Pasa; seis pruebas. Se repitió tras retirar bcryptjs. |
| Pruebas nominales del contrato | Siete pruebas pasan al fijar el checkpoint de estandarización. El paquete DB no se modificó durante la limpieza. |
| Simulación npm ci en Dentistry backend | Pasa con --dry-run --ignore-scripts. Comprueba resolución y coherencia del lockfile; no sustituye una instalación limpia con scripts en Linux/Docker. |
| Análisis de imports después | Ningún import local sin resolver. |
| git diff --check | Pasa. |
| Build habitual de Core frontend | Falla en Turbopack/PostCSS al crear proceso para brand-motion.module.css, también fuera del sandbox. Fallo ya registrado antes de la limpieza. |
| Build habitual de Dentistry frontend | Mismo fallo de Turbopack/PostCSS en history.module.css, reproducido antes y después de las eliminaciones. |
| Build alternativo Dentistry con Webpack | Con NODE_USE_SYSTEM_CA=1 pasa compilación y TypeScript, pero falla al recoger datos de páginas con 15 workers por falta de memoria. No se declara build completo aprobado. Primer intento detenido por confianza TLS al descargar fuentes; se usó el almacén de confianza de Windows manteniendo validación TLS. |
| Recorridos autenticados/UI tras limpiar | No realizados por el agente; no se afirma validación visual ni funcional nueva. |

El primer intento de npm uninstall offline no pudo resolver metadatos ausentes de caché. Se reintentó con acceso autorizado al registro y terminó correctamente. Los avisos de peers de la herramienta de Prisma no produjeron cambios de versiones en el lockfile.

No se añadieron pruebas que únicamente comprueben que desapareció un import o archivo. Tampoco se cambiaron fuentes, estilos, configuración del bundler, reglas de TypeScript ni dependencias para ocultar fallos de verificación. El uso puntual de Webpack y del almacén de certificados de Windows fue únicamente una comprobación de esta sesión; no se alteraron los scripts del proyecto.

## Cierre y continuación

Los cambios se mantienen en commits separados por lote y no se publican automáticamente. Antes de promoverlos, comprobar las pantallas de login/sesión, organización/sucursal, pacientes e historial, servicios y agenda en el entorno habitual del proyecto. Resolver el build predeterminado de Turbopack como tarea independiente si allí también falla.

El siguiente trabajo funcional es definir y conectar la persistencia de pacientes e historial fijo del plan base. Este reporte identifica qué clientes y módulos están preparados pero aún no integrados; no los presenta como funciones ya disponibles.
