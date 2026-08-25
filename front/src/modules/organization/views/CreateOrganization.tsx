'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Input,
  Select,
  Button,
  Card,
  SectionHeader,
  Icons,
} from '@/shared/components/ui';

export default function CreateOrganization() {
  const router = useRouter();
  const [form, setForm] = useState({
    name: '',
    legalName: '',
    taxId: '',
    address: '',
    city: '',
    country: 'PE',
    phone: '',
    email: '',
    plan: 'professional',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [success, setSuccess] = useState(false);

  const set = (key: string, v: string) => {
    setForm((f) => ({ ...f, [key]: v }));
    setErrors((e) => ({ ...e, [key]: '' }));
  };

  const validate = () => {
    const e: Record<string, string> = {};
    if (!form.name.trim()) e.name = 'El nombre comercial es requerido';
    if (!form.legalName.trim()) e.legalName = 'La razón social es requerida';
    if (!form.taxId.trim()) e.taxId = 'El RUC/NIT es requerido';
    if (!form.email.includes('@')) e.email = 'Correo inválido';
    if (!form.address.trim()) e.address = 'La dirección es requerida';
    return e;
  };

  const handleSubmit = () => {
    const e = validate();
    if (Object.keys(e).length > 0) {
      setErrors(e);
      return;
    }
    // Simular éxito (más adelante se conectará con API)
    setSuccess(true);
  };

  if (success) {
    return (
      <div className="flex flex-col items-center justify-center h-full px-8 gap-4">
        <div className="w-14 h-14 rounded-sm bg-emerald-100 dark:bg-emerald-900/40 flex items-center justify-center text-emerald-600">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <polyline points="20 6 9 17 4 12" />
          </svg>
        </div>
        <div className="text-center">
          <h3 className="font-display text-xl font-bold text-foreground">Organización registrada</h3>
          <p className="text-sm text-muted-foreground mt-1">
            <strong>{form.name}</strong> ha sido creada. Ahora puedes agregar sucursales y usuarios.
          </p>
        </div>
        <Button onClick={() => router.push('/dashboard/organizations')} fullWidth>
          Ir a organizaciones
        </Button>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full overflow-y-auto">
      <div className="px-4 py-3 md:px-8 md:pt-6">
        <p className="text-sm text-muted-foreground">
          Registra un nuevo cliente en la plataforma.
        </p>
      </div>

      <div className="px-4 md:px-8 pb-8 max-w-2xl mx-auto w-full flex flex-col gap-5">
        {/* Identidad comercial */}
        <SectionHeader>Identidad comercial</SectionHeader>
        <Card className="p-4 flex flex-col gap-4">
          <Input
            label="Nombre comercial"
            placeholder="Ej. Comercial Vega"
            value={form.name}
            onChange={(e) => set('name', e.target.value)}
            error={errors.name}
          />
          <Input
            label="Razón social"
            placeholder="Ej. Comercial Vega S.A.C."
            value={form.legalName}
            onChange={(e) => set('legalName', e.target.value)}
            error={errors.legalName}
          />
          <Input
            label="RUC / NIT / Tax ID"
            placeholder="20601234567"
            value={form.taxId}
            onChange={(e) => set('taxId', e.target.value)}
            error={errors.taxId}
          />
        </Card>

        {/* Ubicación */}
        <SectionHeader>Ubicación</SectionHeader>
        <Card className="p-4 flex flex-col gap-4">
          <Input
            label="Dirección principal"
            placeholder="Av. Industrial 2450, Surquillo"
            value={form.address}
            onChange={(e) => set('address', e.target.value)}
            error={errors.address}
          />
          <Input
            label="Ciudad"
            placeholder="Lima"
            value={form.city}
            onChange={(e) => set('city', e.target.value)}
          />
          <Select
            label="País"
            value={form.country}
            onChange={(e) => set('country', e.target.value)}
          >
            <option value="PE">Perú</option>
            <option value="CL">Chile</option>
            <option value="CO">Colombia</option>
            <option value="MX">México</option>
            <option value="AR">Argentina</option>
            <option value="EC">Ecuador</option>
          </Select>
        </Card>

        {/* Contacto */}
        <SectionHeader>Contacto</SectionHeader>
        <Card className="p-4 flex flex-col gap-4">
          <Input
            label="Correo corporativo"
            type="email"
            placeholder="admin@empresa.com"
            value={form.email}
            onChange={(e) => set('email', e.target.value)}
            error={errors.email}
          />
          <Input
            label="Teléfono"
            type="tel"
            placeholder="+51 1 615 8900"
            value={form.phone}
            onChange={(e) => set('phone', e.target.value)}
          />
        </Card>

        {/* Plan */}
        <SectionHeader>Plan</SectionHeader>
        <div className="flex flex-col gap-2">
          {[
            {
              value: 'starter',
              label: 'Starter',
              desc: 'Hasta 3 usuarios · 1 sucursal',
            },
            {
              value: 'professional',
              label: 'Professional',
              desc: 'Hasta 15 usuarios · 5 sucursales',
            },
            {
              value: 'enterprise',
              label: 'Enterprise',
              desc: 'Usuarios ilimitados · sucursales ilimitadas',
            },
          ].map((plan) => (
            <button
              key={plan.value}
              onClick={() => set('plan', plan.value)}
              className={`flex items-center gap-3 px-4 py-3.5 border rounded-[var(--radius)] text-left transition-colors ${
                form.plan === plan.value
                  ? 'border-primary bg-primary/5'
                  : 'border-border bg-card'
              }`}
            >
              <div
                className={`w-4 h-4 rounded-full border-2 flex items-center justify-center shrink-0 ${
                  form.plan === plan.value ? 'border-primary' : 'border-border'
                }`}
              >
                {form.plan === plan.value && (
                  <div className="w-2 h-2 rounded-full bg-primary" />
                )}
              </div>
              <div>
                <p
                  className={`text-sm font-display font-semibold ${
                    form.plan === plan.value ? 'text-primary' : 'text-foreground'
                  }`}
                >
                  {plan.label}
                </p>
                <p className="text-[11px] font-mono text-muted-foreground">
                  {plan.desc}
                </p>
              </div>
            </button>
          ))}
        </div>

        <Button onClick={handleSubmit} fullWidth size="lg">
          Registrar organización
        </Button>
      </div>
    </div>
  );
}