'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  patients,
  services,
  professionals,
  payments,
  formatCurrency,
  paymentMethodLabels,
} from '@/modules/clinic/__mocks__/data';

type PaymentMethod = 'efectivo' | 'tarjeta' | 'transferencia' | 'otro';
type PaymentStatus = 'pagado' | 'pendiente' | 'parcial';

interface RegisterPaymentProps {
  initialPatientId?: string;
  initialAmount?: string;
}

export default function RegisterPayment({
  initialPatientId = '',
  initialAmount = '',
}: RegisterPaymentProps = {}) {
  const router = useRouter();
  const [form, setForm] = useState({
    patientId: initialPatientId,
    serviceId: '',
    professionalId: '',
    amount: initialAmount,
    date: new Date().toISOString().split('T')[0],
    method: 'efectivo' as PaymentMethod,
    status: 'pagado' as PaymentStatus,
    concept: '',
  });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const handleChange = (field: string, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    if (error) setError('');
  };

  const handleSubmit = () => {
    if (!form.patientId) {
      setError('Selecciona un paciente');
      return;
    }
    if (!form.amount || parseFloat(form.amount) <= 0) {
      setError('Ingresa un monto válido');
      return;
    }

    // Crear nuevo pago
    const newPayment = {
      id: `pag-${Date.now()}`,
      patientId: form.patientId,
      serviceId: form.serviceId || undefined,
      appointmentId: undefined,
      amount: parseFloat(form.amount),
      date: form.date,
      method: form.method,
      status: form.status,
      concept: form.concept || 'Pago registrado',
      notes: `Profesional: ${professionals.find(p => p.id === form.professionalId)?.name || 'No asignado'}`,
    };

    // Agregar al array mock (en memoria)
    payments.push(newPayment);

    setSuccess(true);
    setTimeout(() => {
      router.push('/');
      router.push('/payments');
    }, 1500);
  };

  if (success) {
    return (
      <div className="flex flex-col items-center justify-center h-full p-8 gap-4">
        <div className="w-14 h-14 rounded-sm bg-emerald-100 dark:bg-emerald-900/40 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <polyline points="20 6 9 17 4 12" />
          </svg>
        </div>
        <h3 className="font-display text-xl font-bold text-foreground">Pago registrado</h3>
        <p className="text-sm text-muted-foreground text-center">
          El pago de <strong>{formatCurrency(parseFloat(form.amount))}</strong> ha sido registrado.
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full overflow-y-auto p-4 md:p-8 max-w-2xl mx-auto w-full gap-5">
      <div>
        <h2 className="font-display text-2xl font-bold text-foreground">Registrar pago</h2>
        <p className="text-sm text-muted-foreground">Ingresa los datos del pago</p>
      </div>

      {error && (
        <div className="p-3 bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800 rounded-[var(--radius)] text-sm text-red-700 dark:text-red-300">
          {error}
        </div>
      )}

      <div className="flex flex-col gap-4">
        {/* Paciente */}
        <div>
          <label className="block text-[11px] font-mono font-medium uppercase tracking-wider text-muted-foreground mb-1.5">
            Paciente *
          </label>
          <select
            value={form.patientId}
            onChange={(e) => handleChange('patientId', e.target.value)}
            className="h-11 w-full px-3 bg-background border border-border rounded-[var(--radius)] text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-ring"
          >
            <option value="">Seleccionar paciente…</option>
            {patients.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>
        </div>

        {/* Servicio (opcional) */}
        <div>
          <label className="block text-[11px] font-mono font-medium uppercase tracking-wider text-muted-foreground mb-1.5">
            Servicio / Tratamiento (opcional)
          </label>
          <select
            value={form.serviceId}
            onChange={(e) => handleChange('serviceId', e.target.value)}
            className="h-11 w-full px-3 bg-background border border-border rounded-[var(--radius)] text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-ring"
          >
            <option value="">Sin servicio asociado</option>
            {services.filter(s => s.active).map((s) => (
              <option key={s.id} value={s.id}>
                {s.name} - {formatCurrency(s.price)}
              </option>
            ))}
          </select>
        </div>

        {/* Monto */}
        <div>
          <label className="block text-[11px] font-mono font-medium uppercase tracking-wider text-muted-foreground mb-1.5">
            Monto (S/.) *
          </label>
          <input
            type="number"
            step="0.01"
            min="0.01"
            value={form.amount}
            onChange={(e) => handleChange('amount', e.target.value)}
            placeholder="0.00"
            className="h-11 w-full px-3 bg-background border border-border rounded-[var(--radius)] text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring"
          />
        </div>

        {/* Fecha */}
        <div>
          <label className="block text-[11px] font-mono font-medium uppercase tracking-wider text-muted-foreground mb-1.5">
            Fecha *
          </label>
          <input
            type="date"
            value={form.date}
            onChange={(e) => handleChange('date', e.target.value)}
            className="h-11 w-full px-3 bg-background border border-border rounded-[var(--radius)] text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-ring"
          />
        </div>

        {/* Método de pago */}
        <div>
          <label className="block text-[11px] font-mono font-medium uppercase tracking-wider text-muted-foreground mb-1.5">
            Método de pago *
          </label>
          <select
            value={form.method}
            onChange={(e) => handleChange('method', e.target.value as PaymentMethod)}
            className="h-11 w-full px-3 bg-background border border-border rounded-[var(--radius)] text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-ring"
          >
            <option value="efectivo">Efectivo</option>
            <option value="tarjeta">Tarjeta</option>
            <option value="transferencia">Transferencia</option>
            <option value="otro">Otro</option>
          </select>
        </div>

        {/* Estado */}
        <div>
          <label className="block text-[11px] font-mono font-medium uppercase tracking-wider text-muted-foreground mb-1.5">
            Estado *
          </label>
          <select
            value={form.status}
            onChange={(e) => handleChange('status', e.target.value as PaymentStatus)}
            className="h-11 w-full px-3 bg-background border border-border rounded-[var(--radius)] text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-ring"
          >
            <option value="pagado">Pagado</option>
            <option value="pendiente">Pendiente</option>
            <option value="parcial">Parcial</option>
          </select>
        </div>

        {/* Profesional (opcional) */}
        <div>
          <label className="block text-[11px] font-mono font-medium uppercase tracking-wider text-muted-foreground mb-1.5">
            Profesional que atendió (opcional)
          </label>
          <select
            value={form.professionalId}
            onChange={(e) => handleChange('professionalId', e.target.value)}
            className="h-11 w-full px-3 bg-background border border-border rounded-[var(--radius)] text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-ring"
          >
            <option value="">No asignado</option>
            {professionals.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name} - {p.specialty}
              </option>
            ))}
          </select>
        </div>

        {/* Concepto (opcional) */}
        <div>
          <label className="block text-[11px] font-mono font-medium uppercase tracking-wider text-muted-foreground mb-1.5">
            Concepto / Descripción (opcional)
          </label>
          <input
            type="text"
            value={form.concept}
            onChange={(e) => handleChange('concept', e.target.value)}
            placeholder="Ej. Pago de consulta"
            className="h-11 w-full px-3 bg-background border border-border rounded-[var(--radius)] text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring"
          />
        </div>
      </div>

      <div className="flex flex-col md:flex-row gap-3 mt-4">
  <button
    onClick={handleSubmit}
    className="w-full md:flex-1 h-11 bg-primary text-primary-foreground rounded-[var(--radius)] font-semibold hover:opacity-90 transition-opacity"
  >
    Registrar pago
  </button>
  <button
    onClick={() => router.back()}
    className="w-full md:w-auto h-11 px-4 border border-border rounded-[var(--radius)] text-sm text-muted hover:text-foreground transition-colors"
  >
    Cancelar
  </button>
</div>
    </div>
  );
}