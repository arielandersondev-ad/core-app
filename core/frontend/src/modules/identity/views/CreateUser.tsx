'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Input,
  Select,
  Button,
  Label,
  Card,
  SectionHeader,
  Icons,
} from '@/shared/components/ui';
import {
  organizations,
  getBranchesByOrg,
} from '@/modules/organization/__mocks__/data';

export default function CreateUser() {
  const router = useRouter();
  const [form, setForm] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    role: 'operator',
    orgId: '',
    branchId: '',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [success, setSuccess] = useState(false);

  const orgBranches = form.orgId ? getBranchesByOrg(form.orgId) : [];

  const set = (key: string, value: string) => {
    setForm((f) => ({ ...f, [key]: value }));
    setErrors((e) => ({ ...e, [key]: '' }));
  };

  const validate = () => {
    const e: Record<string, string> = {};
    if (!form.name.trim()) e.name = 'El nombre es requerido';
    if (!form.email.includes('@')) e.email = 'Correo electrónico inválido';
    if (form.password.length < 8) e.password = 'Mínimo 8 caracteres';
    if (form.password !== form.confirmPassword)
      e.confirmPassword = 'Las contraseñas no coinciden';
    if (!form.orgId) e.orgId = 'Selecciona una organización';
    return e;
  };

  const handleSubmit = () => {
    const e = validate();
    if (Object.keys(e).length > 0) {
      setErrors(e);
      return;
    }
    setSuccess(true);
  };

  if (success) {
    return (
      <div className="flex flex-col items-center justify-center h-full px-8 gap-4">
        <div className="w-14 h-14 rounded-sm bg-emerald-100 dark:bg-emerald-900/40 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <polyline points="20 6 9 17 4 12" />
          </svg>
        </div>
        <div className="text-center">
          <h3 className="font-display text-xl font-bold text-foreground">Usuario creado</h3>
          <p className="text-sm text-muted-foreground mt-1">
            Se ha enviado un correo de activación a <strong>{form.email}</strong>
          </p>
        </div>
        <Button onClick={() => router.push('/dashboard/users')} fullWidth>
          Volver a usuarios
        </Button>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full overflow-y-auto p-4 md:p-8 max-w-2xl mx-auto w-full gap-5">
      <p className="text-sm text-muted-foreground">
        Completa los datos para registrar un nuevo usuario en el sistema.
      </p>

      <SectionHeader>Datos personales</SectionHeader>
      <Card className="p-4 flex flex-col gap-4">
        <Input
          label="Nombre completo"
          placeholder="Ej. Valentina Soto"
          value={form.name}
          onChange={(e) => set('name', e.target.value)}
          error={errors.name}
        />
        <Input
          label="Correo electrónico"
          type="email"
          placeholder="correo@empresa.com"
          value={form.email}
          onChange={(e) => set('email', e.target.value)}
          error={errors.email}
        />
      </Card>

      <SectionHeader>Credenciales</SectionHeader>
      <Card className="p-4 flex flex-col gap-4">
        <div className="flex flex-col gap-1">
          <Label>Contraseña</Label>
          <div className="relative">
            <input
              type={showPassword ? 'text' : 'password'}
              value={form.password}
              onChange={(e) => set('password', e.target.value)}
              placeholder="Mínimo 8 caracteres"
              className={`h-11 w-full px-3 pr-10 bg-background border ${
                errors.password ? 'border-danger' : 'border-border'
              } rounded-(--radius) text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring`}
            />
            <button
              type="button"
              onClick={() => setShowPassword((v) => !v)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground"
            >
              {showPassword ? Icons.eyeOff : Icons.eye}
            </button>
          </div>
          {errors.password && (
            <p className="text-[11px] text-danger">{errors.password}</p>
          )}
        </div>
        <Input
          label="Confirmar contraseña"
          type="password"
          placeholder="Repite la contraseña"
          value={form.confirmPassword}
          onChange={(e) => set('confirmPassword', e.target.value)}
          error={errors.confirmPassword}
        />
      </Card>

      <SectionHeader>Rol y asignación</SectionHeader>
      <Card className="p-4 flex flex-col gap-4">
        <Select
          label="Rol del usuario"
          value={form.role}
          onChange={(e) => set('role', e.target.value)}
        >
          <option value="admin">Administrador</option>
          <option value="manager">Gerente</option>
          <option value="operator">Operador</option>
          <option value="viewer">Visualizador</option>
        </Select>
        <div>
          <Select
            label="Organización"
            value={form.orgId}
            onChange={(e) => {
              set('orgId', e.target.value);
              set('branchId', '');
            }}
          >
            <option value="">Seleccionar organización…</option>
            {organizations
              .filter((o) => o.status === 'active')
              .map((o) => (
                <option key={o.id} value={o.id}>
                  {o.name}
                </option>
              ))}
          </Select>
          {errors.orgId && (
            <p className="text-[11px] text-danger mt-1">{errors.orgId}</p>
          )}
        </div>
        {form.orgId && (
          <Select
            label="Sucursal (opcional)"
            value={form.branchId}
            onChange={(e) => set('branchId', e.target.value)}
          >
            <option value="">Sin sucursal asignada</option>
            {orgBranches.map((b) => (
              <option key={b.id} value={b.id}>
                {b.name}
              </option>
            ))}
          </Select>
        )}
      </Card>

      {form.password.length > 0 && <PasswordStrength password={form.password} />}

      <Button onClick={handleSubmit} fullWidth size="lg">
        Crear usuario
      </Button>
    </div>
  );
}

function PasswordStrength({ password }: { password: string }) {
  const checks = [
    { label: '8+ caracteres', ok: password.length >= 8 },
    { label: 'Mayúscula', ok: /[A-Z]/.test(password) },
    { label: 'Número', ok: /\d/.test(password) },
    { label: 'Símbolo', ok: /[^A-Za-z0-9]/.test(password) },
  ];
  const score = checks.filter((c) => c.ok).length;
  const colors = [
    'bg-danger',
    'bg-amber-500',
    'bg-amber-400',
    'bg-emerald-500',
    'bg-emerald-500',
  ];
  return (
    <div className="flex flex-col gap-2">
      <div className="flex gap-1">
        {[0, 1, 2, 3].map((i) => (
          <div
            key={i}
            className={`h-1 flex-1 rounded-full transition-colors ${
              i < score ? colors[score] : 'bg-muted'
            }`}
          />
        ))}
      </div>
      <div className="flex gap-3 flex-wrap">
        {checks.map((c) => (
          <span
            key={c.label}
            className={`text-[10px] font-mono flex items-center gap-1 ${
              c.ok
                ? 'text-emerald-600 dark:text-emerald-400'
                : 'text-muted-foreground'
            }`}
          >
            {c.ok ? '✓' : '·'} {c.label}
          </span>
        ))}
      </div>
    </div>
  );
}