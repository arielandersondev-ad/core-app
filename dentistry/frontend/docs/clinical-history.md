# Propuesta de historial clínico odontológico

## Flujo propuesto

`Pacientes → Detalle del paciente → Historial clínico → Consultar / editar sección`

El expediente pertenece al paciente. Una consulta es un evento fechado dentro de ese expediente. Una cita representa tiempo reservado en la agenda y puede originar una consulta, pero no sustituye el registro clínico.

El listado conserva la búsqueda y permite abrir un paciente con ratón o teclado. El detalle tiene una URL propia (`/patients/pac-1`) para permitir recarga, acceso directo y navegación atrás. El historial se integra en la pestaña existente del perfil; las citas, sesiones y pagos mantienen sus espacios actuales.

La pantalla del historial presenta las secciones plegadas, un resumen del odontograma, las medidas registradas y el plan actual. Cada sección se despliega para consultar y tiene una acción explícita para editar. No hace falta recorrer un asistente para encontrar un dato registrado.

Los formularios se abren en un modal con Guardar y Cancelar. El odontograma tiene un modal amplio porque requiere seleccionar piezas, superficies y múltiples hallazgos. Nueva consulta utiliza tres pasos: motivo y responsable; evaluación; diagnóstico y plan. Al guardar, se añade una evolución fechada con una copia del odontograma de ese momento. Las consultas anteriores no se sobrescriben.

## Correspondencia con el documento fuente

Fuente de requisitos: `quirofano OFICIAL-1.pdf`, 12 páginas. Se tomó su estructura como referencia. Las indicaciones clínicas del caso son contenido del documento, no instrucciones para el desarrollo ni reglas para atender a otros pacientes. No se copiaron la identidad ni las fotografías de la paciente al prototipo.

| Sección de la interfaz | Contenido del PDF | Páginas |
| --- | --- | --- |
| Anamnesis y filiación | Nombre, nacimiento, género, estado civil, ocupación, procedencia, residencia, fecha, fuente, motivo, enfermedad actual y automedicación | 1 |
| Antecedentes médicos | Personales no patológicos, preguntas de antecedentes, enfermedades y tratamiento actual, ginecológicos, familiares | 2–4 |
| Antecedentes odontológicos | Último tratamiento y fecha, frecuencia de consulta, anestesia, cirugías previas, higiene, cepillado, hilo y enjuague | 4 |
| Examen físico | Estado general, nutrición, biotipo, orientación, memoria, colaboración, piel, signos vitales, medidas y examen segmentario | 4–6 |
| Examen estomatológico | Labios, frenillos, mucosa yugal, lengua, piso, paladar, amígdalas, dientes, encías; ATM y oclusión | 5–7 |
| Odontograma | Denticiones permanente y temporal, hallazgos por pieza y superficie, estado y notas periapicales | 7–9 |
| Diagnóstico y estudios | Diagnóstico presuntivo, laboratorio, imagenología y diagnóstico definitivo | 9 |
| Tratamiento y seguimiento | Plan, preparación, consentimiento, equipo, anestesia, procedimiento, incidencias, indicaciones, medicación, controles y complicaciones | 9–10 |
| Documentos y fotografías | Fotos extraorales e intraorales; adjuntos de estudios y consentimientos | 11–12; documentos relacionados en 9–10 |

Nombre, nacimiento, dirección y grupo sanguíneo se leen de la ficha de paciente existente; se muestran en filiación. Los nuevos formularios añaden los campos clínicos que faltaban. La ficha base mantiene su propio flujo de registro.

Las respuestas de antecedentes distinguen **Sí**, **No**, **No aplica** y **Sin registrar**, con detalle libre. No se interpreta un campo vacío como una respuesta negativa. Una pieza sin hallazgos tampoco se considera sana de forma automática.

La talla se captura en centímetros y el peso en kilogramos; el IMC se calcula con ambos. El documento contiene una unidad de talla y un IMC que no concuerdan con las medidas escritas. Esos valores no se trasladaron como datos válidos ni como valores predeterminados. El plan y la medicación se registran como texto del profesional; no se propone un protocolo quirúrgico a partir del ejemplo.

## Prototipo implementado

- Secciones desplegables y edición mediante formularios derivados de un esquema común.
- Guardado explícito por sección, cancelación sin cambios y mensajes de fallo de almacenamiento.
- Odontograma con 32 piezas permanentes, 20 temporales y vista mixta de 52. Numeración FDI y orientación desde el paciente. Varios hallazgos por pieza: superficie, condición, estado y descripción.
- Condiciones: sano, caries, obturación, sellante, ausente, indicación a extracción, erupción, atrición, hipoplasia, corona, prótesis, ortodoncia y fractura. La lista de hallazgos conserva toda la información; el esquema coloreado es una representación simplificada, no la simbología clínica completa del PDF.
- Consultas fechadas con profesional, motivo, evaluación, diagnóstico, plan y copia del odontograma. Ordenadas de la más reciente a la más antigua.
- Adjuntos JPG, PNG y PDF de hasta 2 MB, con categoría, vista previa, descarga y eliminación.
- Tema claro y oscuro usando las variables de `src/app/globals.css`: fondo crema, superficies cálidas, verde primario y acentos avellana. Formularios y vista móvil adaptables.
- Datos ficticios y guardado por paciente en `localStorage` bajo `dentistry:clinical-mock:v1:<patientId>`. Los registros locales se validan antes de cargarse.

## Cómo abrirlo

Desde `dentistry/frontend`:

```powershell
npm run dev -- --port 3105
```

Vista previa sin sesión, solo en desarrollo:

- `http://127.0.0.1:3105/clinical-history-demo` — listado.
- `http://127.0.0.1:3105/clinical-history-demo?patientId=pac-1` — historial con muestra.
- `http://127.0.0.1:3105/clinical-history-demo?patientId=pac-2` — paciente con historial inicial mínimo.

Dentro de la aplicación autenticada: `Pacientes → paciente → Historial clínico`, con ruta `/patients/<patientId>`. La vista previa devuelve 404 fuera de desarrollo. El proxy y el layout autenticado conservan su control de acceso.

Las capturas del prototipo están en `output/clinical-history/` en la raíz del repositorio. Son imágenes JPG del frontend real: listado, historial, formulario de anamnesis, odontograma, nueva consulta, móvil y tema oscuro.

## Límites y siguiente etapa

Es una propuesta de frontend funcional. Los formularios no llaman al backend ni proporcionan almacenamiento clínico persistente entre dispositivos. Los adjuntos usan el espacio limitado del navegador. El consentimiento es un campo y un adjunto; todavía no hay firma electrónica. El profesional de una consulta se captura manualmente en esta demo.

En la siguiente etapa, el backend debería separar `Patient`, antecedentes versionados, `Encounter`, `OdontogramRevision`, `ToothFinding` y `ClinicalAttachment`. Cada consulta debe tener fecha, autor y estado; una cita puede enlazarse mediante un identificador opcional. La autoría debe provenir de la sesión. Añadir estados de borrador/finalizado y correcciones con trazabilidad antes de habilitar expedientes reales. El plan de tratamiento puede tener sus propias etapas y relacionarse con consultas posteriores.

La ficha Resumen conserva los registros mock previos del módulo; la nueva pestaña Historial clínico contiene el expediente estructurado. Al integrar el backend, ambos resúmenes y las alertas de paciente deben consultar una misma fuente para evitar divergencias.

## Verificación realizada

TypeScript (`tsc --noEmit`) y ESLint sobre los archivos modificados pasaron. Se regeneraron dos archivos temporales de tipos de Next que contenían fragmentos duplicados. La prueba en Edge verificó guardar y recargar, cancelar, aislamiento por paciente, denticiones temporal y mixta, varios hallazgos, copia del odontograma en consultas, adjuntar/ver/eliminar imágenes, recuperación de almacenamiento inválido y ausencia de desbordamiento horizontal en móvil. No se detectaron errores de JavaScript durante esos flujos. Se revisaron las siete capturas visualmente.

La compilación de producción no se ejecutó: se rechazó el permiso para el comando `npm run build`.

Referencia de flujo: la documentación oficial de [Open Dental: Chart Module](https://www.opendental.com/manual/chart.html) organiza el trabajo clínico alrededor del paciente, odontograma y notas de evolución; [Medical](https://www.opendental.com/manual/medical.html) separa antecedentes, problemas, medicamentos y alergias. La adaptación a secciones desplegables y modales es una decisión de UX para Dentistry.
