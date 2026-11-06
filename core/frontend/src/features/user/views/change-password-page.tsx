'use client';

import { useMemo, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Button, Card, Label, Icons } from '@/shared/components/ui';
import { useUsers } from '@/features/user/hooks/use-users';

function PasswordField({
  label,
  value,
  onChange,
  placeholder,
  error,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  error?: string;
}) {
  const [show, setShow] = useState(false);
  return (
    <div className="flex flex-col gap-1">
      <Label>{label}</Label>
      <div className="relative">
        <input
          type={show ? 'text' : 'password'}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className={`h-11 w-full px-3 pr-10 bg-background border ${error ? 'border-danger' : 'border-border'} rounded-(--radius) text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring`}
        />
        <button
          type="button"
          onClick={() => setShow((v) => !v)}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground"
        >
          {show ? Icons.eyeOff : Icons.eye}
        </button>
      </div>
      {error && <p className="text-[11px] text-danger">{error}</p>}
    </div>
  );
}

export default function ChangePassword() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const userId = params.id;

  const { data: users = [], isLoading } = useUsers();
  const rawUser = useMemo(() => users.find((u) => u.id === userId), [users, userId]);

  const user = useMemo(() => {
    if (!rawUser) return null;
    return {
      id: rawUser.id,
      name: `${rawUser.firstName || ''} ${rawUser.lastName || ''}`.trim() || rawUser.email,
      email: rawUser.email,
    };
  }, [rawUser]);

  const [form, setForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [success, setSuccess] = useState(false);

  const set = (key: string, v: string) => {
    setForm((f) => ({ ...f, [key]: v }));
    setErrors((e) => ({ ...e, [key]: '' }));
  };

  const validate = () => {
    const e: Record<string, string> = {};
    if (!form.currentPassword) e.currentPassword = 'La contraseña actual es requerida';
    if (form.newPassword.length < 8) e.newPassword = 'Mínimo 8 caracteres';
    if (form.newPassword === form.currentPassword)
      e.newPassword = 'La nueva contraseña debe ser diferente a la actual';
    if (form.newPassword !== form.confirmPassword)
      e.confirmPassword = 'Las contraseñas no coinciden';
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

  const rules = [
    { label: 'Mínimo 8 caracteres', ok: form.newPassword.length >= 8 },
    { label: 'Al menos una mayúscula', ok: /[A-Z]/.test(form.newPassword) },
    { label: 'Al menos un número', ok: /[0-9]/.test(form.newPassword) },
    {
      label: 'Al menos un carácter especial (!@#$%...)',
      ok: /[^A-Za-z0-9]/.test(form.newPassword),
    },
  ];

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full p-8">
        <p className="text-sm font-mono text-muted-foreground">Cargando usuario...</p>
      </div>
    );
  }

  if (success) {
    return (
      <div className="flex flex-col items-center justify-center h-full px-8 gap-4">
        <div className="w-14 h-14 rounded-sm bg-emerald-100 dark:bg-emerald-900/40 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <polyline points="20 6 9 17 4 12" />
          </svg>
        </div>
        <div className="text-center">
          <h3 className="font-display text-xl font-bold text-foreground">Contraseña actualizada</h3>
          <p className="text-sm text-muted-foreground mt-1">
            La contraseña de <strong>{user?.name}</strong> fue modificada correctamente.
          </p>
        </div>
        <Button onClick={() => router.push(`/users/${userId}`)} fullWidth>
          Volver al perfil
        </Button>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex items-center justify-center h-full p-8">
        <p className="text-muted-foreground">Usuario no encontrado</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full overflow-y-auto p-4 md:p-8 max-w-2xl mx-auto w-full gap-5">
      <p className="text-sm text-muted-foreground">
        Actualiza la contraseña de acceso de <strong className="text-foreground">{user.name}</strong>.
      </p>

      <Card className="p-4 flex flex-col gap-4">
        <PasswordField
          label="Contraseña actual"
          value={form.currentPassword}
          onChange={(v) => set('currentPassword', v)}
          placeholder="Tu contraseña actual"
          error={errors.currentPassword}
        />
        <PasswordField
          label="Nueva contraseña"
          value={form.newPassword}
          onChange={(v) => set('newPassword', v)}
          placeholder="Mínimo 8 caracteres"
          error={errors.newPassword}
        />
        <PasswordField
          label="Confirmar nueva contraseña"
          value={form.confirmPassword}
          onChange={(v) => set('confirmPassword', v)}
          placeholder="Repite la nueva contraseña"
          error={errors.confirmPassword}
        />
      </Card>

      {/* Reglas de complejidad */}
      <Card className="p-4">
        <p className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground mb-3">
          Requisitos de la contraseña
        </p>
        <div className="flex flex-col gap-2">
          {rules.map((r) => (
            <div key={r.label} className="flex items-center gap-2">
              <span
                className={`w-4 h-4 rounded-full flex items-center justify-center text-[10px] ${
                  r.ok
                    ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-400'
                    : 'bg-muted text-muted-foreground'
                }`}
              >
                {r.ok ? '✓' : '·'}
              </span>
              <span
                className={`text-xs ${r.ok ? 'text-foreground' : 'text-muted-foreground'}`}
              >
                {r.label}
              </span>
            </div>
          ))}
        </div>
      </Card>

      <Button onClick={handleSubmit} fullWidth size="lg">
        Actualizar contraseña
      </Button>
    </div>
  );
}
