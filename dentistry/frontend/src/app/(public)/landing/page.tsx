import Link from "next/link";
import { Icons } from "@/shared/components/ui/Icons";

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-[var(--background)] text-[var(--foreground)] flex flex-col justify-between">
      {/* Header */}
      <header className="h-16 border-b border-[var(--border)] px-6 flex items-center justify-between bg-[var(--surface)]">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 bg-emerald-600 rounded-lg flex items-center justify-center text-white text-lg">
            🦷
          </div>
          <span className="font-display font-bold text-base">
            Dental Care Clinic
          </span>
        </div>
        <Link
          href="/login"
          className="h-9 px-4 bg-[var(--primary)] text-[var(--primary-foreground)] rounded-xl text-xs font-semibold flex items-center"
        >
          Acceso Equipo
        </Link>
      </header>

      {/* Hero */}
      <main className="flex-1 flex flex-col items-center justify-center p-6 text-center max-w-2xl mx-auto">
        <span className="px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-xs font-mono font-semibold mb-4">
          Atención Odontológica Personalizada
        </span>
        <h1 className="font-display text-3xl sm:text-4xl font-bold tracking-tight mb-4">
          Tu salud bucodental en las mejores manos
        </h1>
        <p className="text-sm sm:text-base text-[var(--muted)] mb-8 leading-relaxed">
          Especialistas en odontología integral, estética, ortodoncia y
          endodoncia. Agenda tu cita fácil y rápido o comunícate directamente
          con nuestro equipo.
        </p>

        <div className="flex flex-col sm:flex-row items-center gap-3 w-full sm:w-auto">
          <Link
            href="/agenda"
            className="w-full sm:w-auto h-12 px-6 bg-[var(--primary)] text-[var(--primary-foreground)] rounded-xl font-semibold flex items-center justify-center gap-2 shadow-sm"
          >
            <span>Ver Agenda de Citas</span>
            <span>→</span>
          </Link>
          <a
            href="https://wa.me/59171234567?text=Hola%20deseo%20consultar%20sobre%20una%20cita%20odontol%C3%B3gica"
            target="_blank"
            rel="noopener noreferrer"
            className="w-full sm:w-auto h-12 px-6 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-semibold flex items-center justify-center gap-2"
          >
            <span className="w-5 h-5 flex items-center justify-center">
              {Icons.whatsapp}
            </span>
            <span>Escribir al WhatsApp</span>
          </a>
        </div>
      </main>

      {/* Footer */}
      <footer className="py-6 border-t border-[var(--border)] text-center text-xs text-[var(--muted)]">
        Dental Care Clinic · Santa Cruz, Bolivia
      </footer>
    </div>
  );
}
