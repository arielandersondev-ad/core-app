'use client';

import { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Button, Card, Label, Icons } from '@/shared/components/ui';
import { getUserById } from '@/modules/organization/__mocks__/data';

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
  const user = getUserById(userId);

  const [form, setForm] = useState({ current: '', next: '', confirm: '' });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [success, setSuccess] = useState(false);

  if (!user) {
    return (
      <div className="flex items-center justify-center h-full p-8">
        <p className="text-muted-foreground">Usuario no encontrado</p>
      </div>
    );
  }

  const set = (key: string, v: string) => {
    setForm((f) => ({ ...f, [key]: v }));
    setErrors((e) => ({ ...e, [key]: '' }));
  };

  const checks = [
    { label: '8+ caracteres', ok: form.next.length >= 8 },
    { label: 'Mayúscula', ok: /[A-Z]/.test(form.next) },
    { label: 'Número', ok: /\d/.test(form.next) },
    { label: 'Símbolo', ok: /[^A-Za-z0-9]/.test(form.next) },
  ];
  const strength = checks.filter((c) => c.ok).length;
  const strengthColors = ['bg-danger', 'bg-amber-500', 'bg-amber-400', 'bg-emerald-500', 'bg-emerald-500'];
  const strengthLabels = ['Muy débil', 'Débil', 'Regular', 'Fuerte', 'Muy fuerte'];

  const handleSubmit = () => {
    const e: Record<string, string> = {};
    if (!form.current) e.current = 'Introduce tu contraseña actual';
    if (form.next.length < 8) e.next = 'Mínimo 8 caracteres';
    if (form.next !== form.confirm) e.confirm = 'Las contraseñas no coinciden';
    if (Object.keys(e).length > 0) { setErrors(e); return; }
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
          <h3 className="font-display text-xl font-bold text-foreground">Contraseña actualizada</h3>
          <p className="text-sm text-muted-foreground mt-1">
            Las credenciales de <strong>{user.name}</strong> han sido restablecidas.
          </p>
        </div>
        <Button onClick={() => router.push(`/dashboard/users/${userId}`)} fullWidth>
          Volver al perfil
        </Button>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full overflow-y-auto p-4 md:p-8 max-w-2xl mx-auto w-full gap-5">
      <p className="text-sm text-muted-foreground">
        Restablece la contraseña de <strong className="text-foreground">{user.name}</strong>.
        El usuario deberá usar la nueva contraseña en su próximo inicio de sesión.
      </p>

      <Card className="p-4 flex flex-col gap-4">
        <PasswordField
          label="Contraseña actual (admin)"
          value={form.current}
          onChange={(v) => set('current', v)}
          placeholder="Tu contraseña de administrador"
          error={errors.current}
        />
      </Card>

      <Card className="p-4 flex flex-col gap-4">
        <PasswordField
          label="Nueva contraseña"
          value={form.next}
          onChange={(v) => set('next', v)}
          placeholder="Mínimo 8 caracteres"
          error={errors.next}
        />

        {form.next.length > 0 && (
          <div className="flex flex-col gap-2">
            <div className="flex gap-1">
              {[0, 1, 2, 3].map((i) => (
                <div
                  key={i}
                  className={`h-1 flex-1 rounded-full transition-colors ${i < strength ? strengthColors[strength] : 'bg-muted'}`}
                />
              ))}
            </div>
            <p className={`text-[11px] font-mono ${strength >= 3 ? 'text-emerald-600 dark:text-emerald-400' : 'text-amber-600 dark:text-amber-400'}`}>
              {strengthLabels[strength]}
            </p>
            <div className="flex flex-wrap gap-x-3 gap-y-1">
              {checks.map((c) => (
                <span
                  key={c.label}
                  className={`text-[10px] font-mono flex items-center gap-1 ${c.ok ? 'text-emerald-600 dark:text-emerald-400' : 'text-muted-foreground'}`}
                >
                  {c.ok ? '✓' : '·'} {c.label}
                </span>
              ))}
            </div>
          </div>
        )}

        <PasswordField
          label="Confirmar nueva contraseña"
          value={form.confirm}
          onChange={(v) => set('confirm', v)}
          placeholder="Repite la contraseña"
          error={errors.confirm}
        />
      </Card>

      <Button onClick={handleSubmit} fullWidth size="lg">
        Actualizar contraseña
      </Button>
    </div>
  );
}