import type { Meta, StoryObj } from "@storybook/react";
import {
  formatCivilDate,
  formatDateTime,
  calcAgeFromBirthDate,
  formatTimeRange,
  timeToMinutes,
  minutesToTime,
  addMinutesToIso,
  formatCurrency,
  formatMinorCurrency,
} from "./../../utils/formatters";
import { Card } from "./Card";
import { Badge } from "./Badge";

const meta: Meta = {
  title: "Utilities/Formatters (Dates, Times & Currencies)",
  parameters: {
    layout: "padded",
  },
  tags: ["autodocs"],
};

export default meta;

export const Showcase: StoryObj = {
  render: () => {
    const sampleIso = "2026-10-28T09:30:00.000Z";
    const sampleCivil = "2026-10-28";
    const sampleBirthDate = "1995-05-15";

    return (
      <div className="max-w-4xl mx-auto space-y-6 font-sans">
        <div>
          <h2 className="text-xl font-bold text-[var(--foreground)]">
            Estandarización de Fechas, Horas y Monedas
          </h2>
          <p className="text-sm text-[var(--muted)] mt-1">
            Basado en <strong>Day.js</strong> (ligero, inmutable, soporte multizona) y{" "}
            <strong>Intl.NumberFormat</strong> nativo con soporte para unidades menores (Minor Units).
          </p>
        </div>

        {/* 1. Fechas Civiles e Instantes */}
        <Card className="p-5 space-y-4">
          <div className="flex items-center justify-between border-b border-[var(--border)] pb-3">
            <h3 className="font-bold text-sm text-[var(--foreground)] flex items-center gap-2">
              <span>📅</span>
              <span>1. Fechas Civiles e Instantes (Day.js)</span>
            </h3>
            <Badge variant="success" size="sm">
              Inmutable & Seguro contra Timezones
            </Badge>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
            <div className="p-3 rounded-xl bg-[var(--surface-subtle)] border border-[var(--border)] space-y-1">
              <span className="text-[10px] font-mono text-[var(--muted)] uppercase block">
                Civil Date - Full
              </span>
              <p className="font-semibold text-[var(--foreground)]">
                {formatCivilDate(sampleCivil, "full")}
              </p>
              <code className="text-[10px] text-[var(--primary)] font-mono block">
                formatCivilDate("{sampleCivil}", "full")
              </code>
            </div>

            <div className="p-3 rounded-xl bg-[var(--surface-subtle)] border border-[var(--border)] space-y-1">
              <span className="text-[10px] font-mono text-[var(--muted)] uppercase block">
                Civil Date - Medium
              </span>
              <p className="font-semibold text-[var(--foreground)]">
                {formatCivilDate(sampleCivil, "medium")}
              </p>
              <code className="text-[10px] text-[var(--primary)] font-mono block">
                formatCivilDate("{sampleCivil}", "medium")
              </code>
            </div>

            <div className="p-3 rounded-xl bg-[var(--surface-subtle)] border border-[var(--border)] space-y-1">
              <span className="text-[10px] font-mono text-[var(--muted)] uppercase block">
                Instant Date & Time
              </span>
              <p className="font-semibold text-[var(--foreground)]">
                {formatDateTime(sampleIso)}
              </p>
              <code className="text-[10px] text-[var(--primary)] font-mono block">
                formatDateTime("{sampleIso}")
              </code>
            </div>

            <div className="p-3 rounded-xl bg-[var(--surface-subtle)] border border-[var(--border)] space-y-1">
              <span className="text-[10px] font-mono text-[var(--muted)] uppercase block">
                Cálculo de Edad desde Nacimiento
              </span>
              <p className="font-semibold text-[var(--foreground)]">
                {calcAgeFromBirthDate(sampleBirthDate)} años cumplidos
              </p>
              <code className="text-[10px] text-[var(--primary)] font-mono block">
                calcAgeFromBirthDate("{sampleBirthDate}")
              </code>
            </div>
          </div>
        </Card>

        {/* 2. Horas y Rangos */}
        <Card className="p-5 space-y-4">
          <div className="flex items-center justify-between border-b border-[var(--border)] pb-3">
            <h3 className="font-bold text-sm text-[var(--foreground)] flex items-center gap-2">
              <span>⏰</span>
              <span>2. Horas, Rangos y Duraciones de Agenda</span>
            </h3>
            <Badge variant="primary" size="sm">
              HH:mm Standard
            </Badge>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
            <div className="p-3 rounded-xl bg-[var(--surface-subtle)] border border-[var(--border)] space-y-1">
              <span className="text-[10px] font-mono text-[var(--muted)] uppercase block">
                Rango Horario Planificado
              </span>
              <p className="font-semibold text-[var(--foreground)] text-sm">
                {formatTimeRange("09:00", "09:45")}
              </p>
              <code className="text-[10px] text-[var(--primary)] font-mono block">
                formatTimeRange("09:00", "09:45")
              </code>
            </div>

            <div className="p-3 rounded-xl bg-[var(--surface-subtle)] border border-[var(--border)] space-y-1">
              <span className="text-[10px] font-mono text-[var(--muted)] uppercase block">
                Adición de Minutos a ISO
              </span>
              <p className="font-semibold text-[var(--foreground)] truncate">
                {addMinutesToIso(sampleIso, 45)}
              </p>
              <code className="text-[10px] text-[var(--primary)] font-mono block">
                addMinutesToIso(sampleIso, 45)
              </code>
            </div>

            <div className="p-3 rounded-xl bg-[var(--surface-subtle)] border border-[var(--border)] space-y-1">
              <span className="text-[10px] font-mono text-[var(--muted)] uppercase block">
                Conversión HH:mm a Minutos Acumulados
              </span>
              <p className="font-semibold text-[var(--foreground)]">
                {timeToMinutes("14:30")} minutos
              </p>
              <code className="text-[10px] text-[var(--primary)] font-mono block">
                timeToMinutes("14:30") =&gt; 870
              </code>
            </div>

            <div className="p-3 rounded-xl bg-[var(--surface-subtle)] border border-[var(--border)] space-y-1">
              <span className="text-[10px] font-mono text-[var(--muted)] uppercase block">
                Conversión Minutos a HH:mm
              </span>
              <p className="font-semibold text-[var(--foreground)]">
                {minutesToTime(870)}
              </p>
              <code className="text-[10px] text-[var(--primary)] font-mono block">
                minutesToTime(870) =&gt; "14:30"
              </code>
            </div>
          </div>
        </Card>

        {/* 3. Monedas con Intl.NumberFormat */}
        <Card className="p-5 space-y-4">
          <div className="flex items-center justify-between border-b border-[var(--border)] pb-3">
            <h3 className="font-bold text-sm text-[var(--foreground)] flex items-center gap-2">
              <span>💳</span>
              <span>3. Monedas y Unidades Menores (Intl.NumberFormat)</span>
            </h3>
            <Badge variant="warning" size="sm">
              Soporte Minor Units (Persistencia)
            </Badge>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
            <div className="p-3 rounded-xl bg-[var(--surface-subtle)] border border-[var(--border)] space-y-1">
              <span className="text-[10px] font-mono text-[var(--muted)] uppercase block">
                Bolivianos (BOB)
              </span>
              <p className="font-mono font-bold text-base text-[var(--primary)]">
                {formatCurrency(150.5)}
              </p>
              <code className="text-[10px] text-[var(--muted)] font-mono block">
                formatCurrency(150.5)
              </code>
            </div>

            <div className="p-3 rounded-xl bg-[var(--surface-subtle)] border border-[var(--border)] space-y-1">
              <span className="text-[10px] font-mono text-[var(--muted)] uppercase block">
                Dólares (USD)
              </span>
              <p className="font-mono font-bold text-base text-[var(--foreground)]">
                {formatCurrency(150.5, { currency: "USD", locale: "en-US" })}
              </p>
              <code className="text-[10px] text-[var(--muted)] font-mono block">
                currency: "USD"
              </code>
            </div>

            <div className="p-3 rounded-xl bg-[var(--surface-subtle)] border border-[var(--border)] space-y-1">
              <span className="text-[10px] font-mono text-[var(--muted)] uppercase block">
                Pesos Chilenos (CLP)
              </span>
              <p className="font-mono font-bold text-base text-[var(--foreground)]">
                {formatCurrency(45000, { currency: "CLP", locale: "es-CL", minimumFractionDigits: 0 })}
              </p>
              <code className="text-[10px] text-[var(--muted)] font-mono block">
                currency: "CLP"
              </code>
            </div>
          </div>

          <div className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/25 text-xs text-amber-800 dark:text-amber-300 space-y-1.5">
            <span className="font-bold block">
              🛡️ Alineación con la base de datos (PostgreSQL minor units):
            </span>
            <p className="leading-relaxed">
              En PostgreSQL almacenamos los importes como <code>amountMinor</code> enteros (ej: <code>26000</code> centavos) para evitar imprecisiones de coma flotante.{" "}
              <code>formatMinorCurrency(26000)</code> formatea automáticamente a <strong>{formatMinorCurrency(26000)}</strong>.
            </p>
          </div>
        </Card>
      </div>
    );
  },
};
