import fs from "node:fs";
import path from "node:path";
import { createRequire } from "node:module";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const frontend = path.resolve(__dirname, "..");
const root = path.resolve(frontend, "../..");
const localRequire = createRequire(path.join(frontend, "package.json"));
const ts = localRequire("typescript");
const sharp = localRequire("sharp");
const React = localRequire("react");
const { renderToStaticMarkup } = localRequire("react-dom/server");
const output = path.join(root, "output/crowant-full-hd");
fs.mkdirSync(output, { recursive: true });

const geometrySource = fs.readFileSync(path.join(frontend, "src/shared/components/brand/crowant-geometry.ts"), "utf8");
const geometry = JSON.parse(geometrySource.slice(geometrySource.indexOf("{"), geometrySource.lastIndexOf("}") + 1));
const source = fs.readFileSync(path.join(frontend, "src/features/landing/components/brand-motion.tsx"), "utf8");
const timelineSource = source.slice(source.indexOf("export const BRAND_MOTION"), source.indexOf("\nfunction MotionScene"));
const timelineCode = ts.transpileModule(timelineSource + "\nexports.choreography=choreography;", {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 },
}).outputText;
const timeline = {};
new Function("exports", timelineCode)(timeline);
const sceneSource = source.slice(source.indexOf("\nfunction MotionScene"), source.indexOf("\nexport function BrandMotion"));
const sceneCode = ts.transpileModule(sceneSource + "\nexports.MotionScene=MotionScene;", {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020, jsx: ts.JsxEmit.ReactJSX },
}).outputText;
const scene = {};
new Function("require", "exports", "shapes", "styles", sceneCode)(localRequire, scene, geometry, { scene: "scene" });
const svg = renderToStaticMarkup(React.createElement(scene.MotionScene, { sceneRef: { current: null } }));

// Embed the project's Latin Work Sans font so offline copies match the site.
const cssFolder = path.join(frontend, ".next/static/chunks");
let fontData;
for (const name of fs.readdirSync(cssFolder).filter(name => name.endsWith(".css"))) {
  const cssPath = path.join(cssFolder, name);
  const css = fs.readFileSync(cssPath, "utf8");
  const faces = css.match(/@font-face\s*\{[^}]+\}/g) ?? [];
  const face = faces.find(face => /font-family:\s*["']?Work Sans["']?;/.test(face) && /unicode-range:U\+\?\?/.test(face));
  if (!face) continue;
  const relative = face.match(/src:url\(([^)]+)\)/)?.[1].replace(/["']/g, "");
  if (relative) fontData = fs.readFileSync(path.resolve(cssFolder, relative)).toString("base64");
  if (fontData) break;
}
if (!fontData) throw new Error("Build the frontend first to prepare its Work Sans font.");

function html(variant) {
  const { duration, label } = timeline.BRAND_MOTION[variant];
  const frames = JSON.stringify(timeline.choreography(variant));
  return `<!doctype html>
<html lang="es"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>CrowAnt · ${label} · Full HD</title>
<style>
@font-face{font-family:CrowAntWorkSans;src:url(data:font/woff2;base64,${fontData}) format("woff2");font-weight:100 900;font-style:normal;font-display:block}
:root{--primary:#3d7a46;--hazelnut:#9a744f;--font-work-sans:CrowAntWorkSans,Arial,sans-serif}*{box-sizing:border-box}body{margin:0;min-height:100dvh;background:#f3efe6;display:grid;place-items:center}main{width:100%;max-width:1920px}.stage{display:block;width:100%;padding:0;border:0;background:transparent;color:inherit;cursor:pointer;touch-action:manipulation;-webkit-tap-highlight-color:transparent}.stage:focus-visible{outline:2px solid #3d7a46;outline-offset:-4px}svg{display:block;width:100%;height:auto;max-height:100dvh}.sr-only{position:absolute;width:1px;height:1px;padding:0;margin:-1px;overflow:hidden;clip:rect(0,0,0,0);white-space:nowrap;border:0}
</style><main><button id="animation" class="stage" type="button" aria-label="Reproducir ${label}" aria-describedby="instructions">${svg}</button><p id="instructions" class="sr-only">Haz clic, o usa Enter o la barra espaciadora, para pausar, continuar o volver a reproducir.</p></main>
<script>
const button=document.getElementById('animation');const svg=button.querySelector('svg');const duration=${duration};
const clock=svg.animate([{opacity:1},{opacity:1}],{duration,fill:'both'});
const tracks=[clock,...${frames}.map(([part,frames])=>svg.querySelector('[data-part="'+part+'"]').animate(frames,{duration,fill:'both'}))];
const preference=matchMedia('(prefers-reduced-motion: reduce)');
function state(value){button.dataset.playback=value;button.setAttribute('aria-label',(value==='playing'?'Pausar':value==='paused'?'Continuar':'Volver a reproducir')+' ${label}')}
function pause(){tracks.forEach(track=>track.pause());state('paused')}
function play(){if(Number(clock.currentTime)>=duration)tracks.forEach(track=>{track.currentTime=0});tracks.forEach(track=>track.play());state('playing')}
function still(){tracks.forEach(track=>{track.pause();track.currentTime=duration});state('ended')}
clock.onfinish=()=>state('ended');button.onclick=()=>clock.playState==='running'?pause():play();preference.addEventListener('change',()=>{if(preference.matches)still()});
still();document.fonts.ready.then(()=>{if(!preference.matches)play()});
</script></html>\n`;
}

for (const [variant, name] of [["story", "encuentro"], ["essential", "firma"]]) {
  const frames = timeline.choreography(variant);
  for (const [part, keys] of frames) {
    let previous = -1;
    for (const key of keys) {
      if (key.offset < previous || key.offset < 0 || key.offset > 1) throw new Error(`Invalid timing for ${part}`);
      previous = key.offset;
    }
  }
  fs.writeFileSync(path.join(output, `crowant-${name}-1080.html`), html(variant));
}
for (const name of ["crowant-monogram.svg", "crowant-animals.svg"]) {
  fs.copyFileSync(path.join(frontend, "public/brand", name), path.join(output, name));
}

function preview(group) {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="1920" height="1080" viewBox="0 0 1920 1080" fill-rule="evenodd" shape-rendering="geometricPrecision"><rect width="1920" height="1080" fill="#f3efe6"/>${group}</svg>`;
}
const mark = `<g transform="translate(438 225) scale(1.8)"><path fill="#3d7a46" d="${geometry.monogramC}"/><path fill="#9a744f" d="${geometry.monogramA}"/></g>`;
const animals = `<g transform="translate(480 120) scale(1.8)"><path fill="#3d7a46" d="${geometry.crow}"/><path fill="#9a744f" d="${geometry.ant}"/></g>`;
fs.writeFileSync(path.join(output, "LEEME.txt"), `CrowAnt — identidad Full HD\n\nLos SVG contienen curvas vectoriales y se pueden ampliar a cualquier tamaño.\nLas vistas previas PNG tienen 1920 × 1080 píxeles.\nLas dos animaciones HTML tienen composición 1920 × 1080, vectores y tipografía incluidos; funcionan sin conexión en un navegador.\nHaz clic sobre la animación para pausar, continuar o repetirla. También puedes usar Enter o la barra espaciadora.\n\nEl encuentro: 6,4 segundos, con la hormiga caminando al llegar y corriendo al salir.\nLa firma: 3,8 segundos, con transición suave al monograma.\n\nEn la landing pública se muestra únicamente El encuentro.\n`);

Promise.all([
  sharp(Buffer.from(preview(mark))).png().toFile(path.join(output, "crowant-monogram-1080.png")),
  sharp(Buffer.from(preview(animals))).png().toFile(path.join(output, "crowant-animals-1080.png")),
]).then(() => console.log("Exported 2 SVGs, 2 standalone Full HD animations, 2 PNG previews and instructions."))
  .catch(error => { console.error(error); process.exitCode = 1; });
