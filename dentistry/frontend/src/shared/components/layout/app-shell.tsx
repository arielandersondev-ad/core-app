import type { ReactNode } from "react";
import { AppSidebar } from "./app-sidebar";
import { AppNavbar } from "./app-navbar";
import { BottomNav } from "./bottom-nav";
import { ModuleGate } from "./module-gate";

/**
 * Espacio que reservan las barras (heredado por todo el shell):
 * - --shell-top-bar: altura útil de la barra superior (56 px móvil, 64 px desde 768 px).
 * - --shell-top: esa altura más el área segura superior.
 * - --shell-bottom: barra inferior (64 px) + área segura + lo que sobresale la
 *   burbuja activa; 0 desde 768 px, donde la navegación pasa al riel/sidebar.
 */
const SHELL_SPACING =
  "[--shell-top-bar:3.5rem] md:[--shell-top-bar:4rem] " +
  "[--shell-top:calc(var(--shell-top-bar)_+_env(safe-area-inset-top,0px))] " +
  "[--shell-bottom:calc(4rem_+_env(safe-area-inset-bottom,0px)_+_1.75rem)] md:[--shell-bottom:0px]";

/**
 * Como la barra superior flota sobre `main`, el riel del scroll (Chromium/Safari)
 * empieza debajo de ella y termina sobre la inferior; si no, quedaría tapado.
 */
const MAIN_SCROLLBAR =
  "[&::-webkit-scrollbar]:w-2.5 " +
  "[&::-webkit-scrollbar-track]:mt-[var(--shell-top)] [&::-webkit-scrollbar-track]:mb-[var(--shell-bottom)] " +
  "[&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:border-2 [&::-webkit-scrollbar-thumb]:border-transparent " +
  "[&::-webkit-scrollbar-thumb]:bg-muted/45 [&::-webkit-scrollbar-thumb]:bg-clip-padding";

/**
 * La barra superior y la inferior flotan, translúcidas, sobre el contenido:
 * `main` reserva su espacio con --shell-top / --shell-bottom y sigue siendo el
 * único contenedor con scroll, así que las vistas con `h-full` mantienen una
 * altura definida.
 */
export function AppShell({ children }: { children: ReactNode }) {
  return (
    <div className={`flex h-dvh bg-background ${SHELL_SPACING}`}>
      {/* Riel (tablet) o sidebar (escritorio) desde 768 px */}
      <div className="hidden md:flex">
        <AppSidebar />
      </div>

      {/* Main column */}
      <div className="relative flex min-w-0 flex-1 flex-col">
        <AppNavbar />
        <main
          className={`flex-1 overflow-y-auto pt-[var(--shell-top)] pb-[var(--shell-bottom)] scroll-pt-[var(--shell-top)] scroll-pb-[var(--shell-bottom)] ${MAIN_SCROLLBAR}`}
        >
          <ModuleGate>{children}</ModuleGate>
        </main>
      </div>

      <BottomNav />
    </div>
  );
}
