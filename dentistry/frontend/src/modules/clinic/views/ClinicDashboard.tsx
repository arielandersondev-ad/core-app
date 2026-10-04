'use client';

import { useRouter } from 'next/navigation';
import {
  appointments,
  patients,
  payments,
  getPatientById,
  getServiceById,
  getProfessionalById,
  statusColors,
  statusLabels,
  formatCurrency,
  inventoryStatus,
  inventory,
  TODAY_DATE,
} from '@/shared/data/clinic-data';
import { Badge } from '@/shared/components/ui';

const todayAppts = appointments
  .filter((a) => a.date === TODAY_DATE && a.status !== 'cancelada')
  .sort((a, b) => a.startTime.localeCompare(b.startTime));

const totalHoy = payments
  .filter((p) => p.date === TODAY_DATE && p.status === 'pagado')
  .reduce((s, p) => s + p.amountMinor, 0);

const pendingPayments = payments.filter((p) => p.status === 'pendiente').length;
const alertItems = inventory.filter((i) => inventoryStatus(i) !== 'ok');

const completedToday = todayAppts.filter((a) => a.status === 'completada').length;
const inCourse = todayAppts.filter((a) => a.status === 'en_curso').length;

export default function ClinicDashboard({
  onNavigate,
}: {
  onNavigate: (s: string, p?: Record<string, string>) => void;
}) {
  const router = useRouter();

  return (
    <div className="p-4 md:p-8 flex flex-col gap-4 md:gap-8">
      {/* Welcome */}
      <div>
        <p className="text-[11px] font-mono uppercase tracking-widest text-[var(--muted)] mb-1">
          Hoy ·{' '}
          {new Date(TODAY_DATE + 'T12:00:00').toLocaleDateString('es-BO', {
            weekday: 'long',
            day: 'numeric',
            month: 'long',
            year: 'numeric',
          })}
        </p>
        <h1 className="font-display text-2xl md:text-3xl font-bold text-[var(--foreground)]">Buenos días</h1>
        <p className="text-sm text-[var(--muted)] mt-1">Resumen de la jornada clínica</p>
      </div>

      {/* Quick actions */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-2 md:gap-3">
        {[
          { label: 'Nueva cita', icon: '📅', screen: 'agenda' },
          { label: 'Nuevo paciente', icon: '👤', screen: 'crear-paciente' },
          { label: 'Registrar pago', icon: '💳', screen: 'registrar-pago' },
          { label: 'Citas de hoy', icon: '📋', screen: 'agenda' },
        ].map((a) => {
          const isPayment = a.screen === 'registrar-pago';
          return (
            <button
              key={a.label}
              onClick={() => {
                if (isPayment) {
                  router.push('/register-payment');
                } else {
                  onNavigate(a.screen);
                }
              }}
              className="flex flex-col items-start gap-2 p-3 md:p-4 bg-[var(--surface)] border border-[var(--border)] rounded-[4px] hover:border-[var(--primary)]/40 hover:bg-[var(--primary-subtle)] transition-colors group text-left"
            >
              <span className="text-xl md:text-2xl">{a.icon}</span>
              <p className="text-xs md:text-sm font-display font-semibold text-[var(--foreground)]">{a.label}</p>
            </button>
          );
        })}
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-2 md:gap-4">
        {[
          {
            label: 'Citas hoy',
            value: todayAppts.length,
            sub: `${completedToday} completadas · ${inCourse} en curso`,
          },
          {
            label: 'Ingresos del día',
            value: formatCurrency(totalHoy),
            sub: `${pendingPayments} pago(s) pendiente(s)`,
          },
          { label: 'Pacientes activos', value: patients.length, sub: 'En el sistema' },
          {
            label: 'Alertas inventario',
            value: alertItems.length,
            sub: alertItems.length > 0 ? 'Requieren atención' : 'Sin alertas',
            danger: alertItems.length > 0,
          },
        ].map((s) => (
          <div
            key={s.label}
            className={`bg-[var(--surface)] border rounded-[4px] p-3 md:p-5 ${
              s.danger && s.value > 0
                ? 'border-red-300 dark:border-red-800'
                : 'border-[var(--border)]'
            }`}
          >
            <p className="text-[9px] md:text-[10px] font-mono uppercase tracking-widest text-[var(--muted)] mb-1 md:mb-2">
              {s.label}
            </p>
            <p
              className={`font-display text-xl md:text-3xl font-bold ${
                s.danger && (s.value as number) > 0
                  ? 'text-[var(--danger)]'
                  : 'text-[var(--foreground)]'
              }`}
            >
              {s.value}
            </p>
            <p className="text-[10px] md:text-[11px] text-[var(--muted)] mt-1 md:mt-1.5">{s.sub}</p>
          </div>
        ))}
      </div>

      {/* Two columns */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6">
        {/* Today's agenda */}
        <div className="md:col-span-2">
          <div className="flex items-center justify-between mb-3">
            <p className="text-[10px] font-mono uppercase tracking-widest text-[var(--muted)]">
              Agenda de hoy
            </p>
            <button
              onClick={() => onNavigate('agenda')}
              className="text-xs text-[var(--primary)] font-mono hover:underline"
            >
              Ver agenda →
            </button>
          </div>

          {/* Table (desktop) */}
          <div className="hidden md:block bg-[var(--surface)] border border-[var(--border)] rounded-[4px] overflow-hidden">
            {todayAppts.length === 0 ? (
              <div className="py-12 text-center text-sm text-[var(--muted)]">
                Sin citas para hoy
              </div>
            ) : (
              <table className="w-full">
                <thead>
                  <tr className="border-b border-[var(--border)] bg-[var(--background)]/40">
                    {['Hora', 'Paciente', 'Servicio', 'Profesional', 'Estado'].map((h) => (
                      <th
                        key={h}
                        className="text-left px-4 py-2.5 text-[10px] font-mono uppercase tracking-widest text-[var(--muted)]"
                      >
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {todayAppts.map((apt) => {
                    const patient = getPatientById(apt.patientId);
                    const svc = getServiceById(apt.serviceId);
                    const pro = getProfessionalById(apt.professionalId);
                    return (
                      <tr
                        key={apt.id}
                        onClick={() => onNavigate('cita-detalle', { citaId: apt.id })}
                        className="border-b border-[var(--border)] last:border-0 hover:bg-[var(--background)] cursor-pointer transition-colors"
                      >
                        <td className="px-4 py-3 text-xs font-mono font-medium text-[var(--foreground)] whitespace-nowrap">
                          {apt.startTime} – {apt.endTime}
                        </td>
                        <td className="px-4 py-3">
                          <p className="text-sm font-display font-semibold text-[var(--foreground)]">
                            {patient?.name.split(' ').slice(0, 2).join(' ')}
                          </p>
                        </td>
                        <td className="px-4 py-3 text-sm text-[var(--muted)]">{svc?.name}</td>
                        <td className="px-4 py-3 text-sm text-[var(--muted)]">
                          {pro?.name.replace('Dra. ', '').replace('Dr. ', '').replace('Lic. ', '')}
                        </td>
                        <td className="px-4 py-3">
                          <span
                            className={`inline-flex items-center px-1.5 py-0.5 text-[10px] font-mono font-medium rounded-[2px] ${statusColors[apt.status]}`}
                          >
                            {statusLabels[apt.status]}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>

          {/* Cards (mobile) */}
          <div className="md:hidden flex flex-col gap-3">
            {todayAppts.length === 0 ? (
              <div className="py-8 text-center text-sm text-[var(--muted)] bg-[var(--surface)] border border-[var(--border)] rounded-[4px]">
                Sin citas para hoy
              </div>
            ) : (
              todayAppts.map((apt) => {
                const patient = getPatientById(apt.patientId);
                const svc = getServiceById(apt.serviceId);
                const pro = getProfessionalById(apt.professionalId);
                return (
                  <div
                    key={apt.id}
                    onClick={() => onNavigate('cita-detalle', { citaId: apt.id })}
                    className="bg-[var(--surface)] border border-[var(--border)] rounded-[4px] p-4 cursor-pointer hover:bg-[var(--background)] transition-colors"
                  >
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <p className="text-xs font-mono font-medium text-[var(--foreground)]">
                          {apt.startTime} – {apt.endTime}
                        </p>
                        <p className="font-display font-semibold text-[var(--foreground)]">
                          {patient?.name.split(' ').slice(0, 2).join(' ')}
                        </p>
                      </div>
                      <span className={`inline-flex items-center px-1.5 py-0.5 text-[10px] font-mono font-medium rounded-[2px] ${statusColors[apt.status]}`}>
                        {statusLabels[apt.status]}
                      </span>
                    </div>
                    <div className="flex flex-wrap gap-2 text-xs text-[var(--muted)]">
                      <span>{svc?.name || 'Servicio no especificado'}</span>
                      <span>·</span>
                      <span>{pro?.name.replace('Dra. ', '').replace('Dr. ', '').replace('Lic. ', '')}</span>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Alerts + recent */}
        <div className="flex flex-col gap-4">
          {alertItems.length > 0 && (
            <div>
              <div className="flex items-center justify-between mb-2">
                <p className="text-[10px] font-mono uppercase tracking-widest text-[var(--muted)]">
                  Alertas de stock
                </p>
                <button
                  onClick={() => onNavigate('inventario')}
                  className="text-xs text-[var(--primary)] font-mono hover:underline"
                >
                  Ver →
                </button>
              </div>
              <div className="bg-[var(--surface)] border border-[var(--border)] rounded-[4px] overflow-hidden">
                {alertItems.map((item, i) => {
                  const st = inventoryStatus(item);
                  return (
                    <div
                      key={item.id}
                      className={`px-4 py-3 ${i < alertItems.length - 1 ? 'border-b border-[var(--border)]' : ''} flex items-center gap-3`}
                    >
                      <div
                        className={`w-2 h-2 rounded-full flex-shrink-0 ${
                          st === 'critico' ? 'bg-red-500' : 'bg-amber-400'
                        }`}
                      />
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-display font-semibold text-[var(--foreground)] truncate">
                          {item.name}
                        </p>
                        <p className="text-[10px] font-mono text-[var(--muted)]">
                          {item.stock} {item.unit} · mín {item.minStock}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Recent patients */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <p className="text-[10px] font-mono uppercase tracking-widest text-[var(--muted)]">
                Pacientes recientes
              </p>
              <button
                onClick={() => onNavigate('pacientes')}
                className="text-xs text-[var(--primary)] font-mono hover:underline"
              >
                Ver todos →
              </button>
            </div>
            <div className="bg-[var(--surface)] border border-[var(--border)] rounded-[4px] overflow-hidden">
              {patients.slice(0, 5).map((p, i) => (
                <button
                  key={p.id}
                  onClick={() => onNavigate('paciente-detalle', { patientId: p.id })}
                  className={`w-full flex items-center gap-3 px-4 py-3 hover:bg-[var(--background)] transition-colors text-left ${
                    i < 4 ? 'border-b border-[var(--border)]' : ''
                  }`}
                >
                  <div className="w-8 h-8 rounded-full bg-[var(--primary-subtle)] flex items-center justify-center text-[var(--primary)] text-xs font-display font-bold flex-shrink-0">
                    {p.name
                      .split(' ')
                      .map((n) => n[0])
                      .slice(0, 2)
                      .join('')}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-display font-semibold text-[var(--foreground)] truncate">
                      {p.name.split(' ').slice(0, 2).join(' ')}
                    </p>
                    <p className="text-[10px] font-mono text-[var(--muted)]">{p.phone}</p>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}