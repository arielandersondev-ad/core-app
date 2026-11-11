"use client";

import type { CSSProperties } from "react";
import { useThemePreference } from "../hooks/useThemePreference";

/**
 * Capa decorativa del tema Navideño: guirnalda de luces en el borde superior
 * y nieve ligera. Se monta una vez en el layout raíz.
 *
 * - Solo se renderiza con el tema "christmas" (en servidor nunca, sin desajuste de hidratación).
 * - `aria-hidden` y `pointer-events: none`: no interfiere con lectores ni clics.
 * - Estilos y animaciones en `styles/christmas.css` (solo transform/opacity,
 *   pausables con `.effects-paused` y anuladas por `prefers-reduced-motion`).
 */

const BULB_COUNT = 32;
const FLAKE_COUNT = 28;
const BULB_COLORS = ["red", "gold", "green", "ice"] as const;

/** Pseudoaleatorio determinista: la misma decoración en cada render. */
function seeded(index: number, salt: number): number {
  const x = Math.sin(index * 12.9898 + salt * 78.233) * 43758.5453;
  return x - Math.floor(x);
}

/**
 * Las pares recorren los 4 colores y las impares van desfasadas 2 posiciones:
 * en escritorio no se repiten colores contiguos y en móvil (solo pares, ver CSS)
 * siguen apareciendo los cuatro.
 */
function bulbColor(index: number) {
  const half = Math.floor(index / 2);
  return BULB_COLORS[(index % 2 === 0 ? half : half + 2) % BULB_COLORS.length];
}

const BULBS = Array.from({ length: BULB_COUNT }, (_, index) => ({
  color: bulbColor(index),
  style: {
    "--twinkle-duration": `${(1.8 + seeded(index, 1) * 1.6).toFixed(2)}s`,
    "--twinkle-delay": `${(-seeded(index, 2) * 3).toFixed(2)}s`,
  } as CSSProperties,
}));

const FLAKES = Array.from({ length: FLAKE_COUNT }, (_, index) => {
  const size = 2 + seeded(index, 3) * 3;
  return {
    style: {
      left: `${(seeded(index, 4) * 100).toFixed(2)}%`,
      width: `${size.toFixed(1)}px`,
      height: `${size.toFixed(1)}px`,
      opacity: (0.35 + seeded(index, 5) * 0.45).toFixed(2),
      "--fall-duration": `${(14 + seeded(index, 6) * 14).toFixed(1)}s`,
      "--fall-delay": `${(-seeded(index, 7) * 28).toFixed(1)}s`,
      "--drift": `${((seeded(index, 8) - 0.5) * 80).toFixed(0)}px`,
    } as CSSProperties,
  };
});

export function ThemeDecorations() {
  const { preference } = useThemePreference();
  if (preference !== "christmas") return null;

  return (
    <div className="xmas-layer" aria-hidden="true" data-component="theme-decorations">
      <div className="xmas-garland">
        {BULBS.map((bulb, index) => (
          <span key={index} className="xmas-segment">
            <span className={`xmas-bulb xmas-bulb--${bulb.color}`} style={bulb.style} />
          </span>
        ))}
      </div>
      <div className="xmas-snow">
        {FLAKES.map((flake, index) => (
          <span key={index} className="xmas-flake" style={flake.style} />
        ))}
      </div>
    </div>
  );
}
