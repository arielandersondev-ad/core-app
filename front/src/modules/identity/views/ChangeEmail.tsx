'use client';

import { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Input, Button, Card, Icons } from '@/shared/components/ui';
import { getUserById } from '@/modules/organization/__mocks__/data';

export default function ChangeEmail() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const userId = params.id;
  const user = getUserById(userId);

  const [newEmail, setNewEmail] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  if (!user) {
    return (
      <div className="flex items-center justify-center h-full p-8">
        <p className="text-muted-foreground">Usuario no encontrado</p>
      </div>
    );
  }

  const handleSubmit = () => {
    if (!newEmail.includes('@')) {
      setError('Introduce un correo válido');
      return;
    }
    if (newEmail !== confirm) {
      setError('Los correos no coinciden');
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
          <h3 className="font-display text-xl font-bold text-foreground">Correo actualizado</h3>
          <p className="text-sm text-muted-foreground mt-1">
            Se envió un enlace de verificación a <strong>{newEmail}</strong>
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
        Cambia la dirección de correo electrónico de <strong className="text-foreground">{user.name}</strong>.
        Se enviará un enlace de verificación al nuevo correo.
      </p>

      <Card className="p-4 flex flex-col gap-4">
        <div className="p-4 bg-muted rounded-[var(--radius)] flex items-center gap-3">
          <span className="text-muted-foreground">{Icons.mail}</span>
          <div>
            <p className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground">Correo actual</p>
            <p className="text-sm font-semibold text-foreground mt-0.5">{user.email}</p>
          </div>
        </div>

        <Input
          label="Nuevo correo electrónico"
          type="email"
          placeholder="nuevo@empresa.com"
          value={newEmail}
          onChange={(e) => { setNewEmail(e.target.value); setError(''); }}
        />
        <Input
          label="Confirmar nuevo correo"
          type="email"
          placeholder="Repite el correo"
          value={confirm}
          onChange={(e) => { setConfirm(e.target.value); setError(''); }}
          error={error}
        />
      </Card>

      <div className="p-3 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-[var(--radius)] flex gap-2.5">
        <span className="text-amber-600 dark:text-amber-400 shrink-0 mt-0.5">{Icons.alertTriangle}</span>
        <p className="text-[11px] text-amber-700 dark:text-amber-300">
          El usuario recibirá un enlace para verificar el nuevo correo. El cambio no se aplica hasta que lo confirme.
        </p>
      </div>

      <Button onClick={handleSubmit} fullWidth size="lg">
        Enviar verificación
      </Button>
    </div>
  );
}