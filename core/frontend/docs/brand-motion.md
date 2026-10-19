# Identidad CrowAnt

El monograma sigue las iniciales de la imagen 5. Los personajes siguen el cuervo y la hormiga de la imagen 4 seleccionados en la exploración de marca. Los contornos son vectores con transparencia real, sin el fondo ni las texturas de las imágenes de referencia.

## Recursos

- `public/brand/crowant-monogram.svg`: monograma CA con los colores originales.
- `public/brand/crowant-animals.svg`: personajes con los colores originales.
- `src/app/icon.svg`: ícono de la aplicación, con contraste adaptado a modo oscuro.
- `src/shared/components/brand/CrowAntBrand.tsx`: firma compartida del menú, acceso, navegación y landing de CrowAnt Core.
- `src/shared/components/brand/crowant-geometry.ts`: contornos compartidos por los componentes y las animaciones.

Los componentes usan `--primary` y `--hazelnut` para respetar el tema activo. En claro equivalen a `#3d7a46` y `#9a744f`; en oscuro a `#62a84f` y `#a88762`. Los contornos principales del monograma están dibujados con curvas Bézier amplias; los animales tienen curvas continuas suavizadas. Los SVG no dependen de una resolución de pantalla.

## Intros

La landing abre con **El encuentro** como sección principal. Un clic sobre la propia animación pausa, continúa o reinicia la reproducción según su estado. La misma superficie funciona con Enter y la barra espaciadora, con foco visible al usar el teclado. No hay botones ni iconos de reproducción superpuestos. Después aparece el enlace para continuar a la presentación de la empresa. La presentación, la vista ilustrativa del producto, el carrusel y las demás secciones aparecen debajo.

La antigua ruta de comparación `/marca` redirige al inicio. No hay selector de versiones ni descargas de recursos de marca en el sitio público.

### El encuentro — 6,4 segundos

1. 0–1,35: la hormiga camina de izquierda a derecha, con movimiento alternado de las patas.
2. 1,25–2,65: el cuervo desciende desde arriba a la derecha y repliega el ala al llegar.
3. 2,65–2,95: aparece el nombre CrowAnt.
4. 2,95–4,45: el nombre permanece visible durante 1,5 segundos.
5. 4,45–5,15: la hormiga corre con pasos rápidos y el cuervo vuelve a batir el ala. Ambos aceleran hacia la derecha, pasando delante del nombre mientras este se oculta en la misma dirección. El cuerpo permanece íntegro; las patas se mueven desde sus articulaciones y se superponen al torso en la unión.
6. 5,00–6,40: aparece el monograma y queda como firma final.

### La firma — 3,8 segundos

Llegada más breve, nombre visible antes y transición por disolución al monograma. Se conserva como copia descargable entregada en el chat, fuera del sitio público.

La landing usa **El encuentro**, la secuencia elegida. Comienza al entrar en pantalla, se reproduce una vez al abrir la página y permite navegar durante la reproducción.

Se usa Web Animations API sobre SVG, sin dependencias de animación ni video. La preferencia `prefers-reduced-motion` muestra el monograma estático; el visitante puede reproducir la intro explícitamente. El cambio de esta preferencia durante la reproducción detiene la secuencia.

## Copias independientes

La entrega vigente está en `output/crowant-full-hd/`, desde la raíz del repositorio. Incluye:

- Los dos SVG con los contornos refinados.
- `crowant-encuentro-1080.html` y `crowant-firma-1080.html`, con composición de 1920 × 1080, gráficos vectoriales, tipografía Work Sans incluida y control con clic o teclado. Funcionan sin conexión ni aplicación.
- Dos vistas previas PNG de 1920 × 1080 y un archivo de instrucciones.

`output/crowant-full-hd.zip` agrupa la entrega. Estas copias no se sirven desde `public/`. Las entregas anteriores se conservan en `output/crowant-animaciones/`.

Para regenerar los archivos tras editar los contornos o la animación, ejecutar `node tools/export-brand-hd.mjs` desde el frontend después de compilarlo. El exportador reutiliza la escena, los tiempos y la tipografía del proyecto.

## Oferta pública

El carrusel contiene únicamente Dentistry, Oftalmología y Pharma. La vista ilustrativa muestra la agenda de Dentistry. Core permanece como herramienta interna para administrar organizaciones y centralizar la autenticación.
