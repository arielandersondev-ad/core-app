'use client';

import { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import {
  Input,
  Select,
  Button,
  Card,
  SectionHeader,
} from '@/shared/components/ui';
import {
  getOrgById,
  getUsersByOrg,
} from '@/modules/organization/__mocks__/data';

export default function CreateBranch() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const orgId = params.id;

  const org = getOrgById(orgId);
  const orgUsers = org ? getUsersByOrg(orgId) : [];

  const [form, setForm] = useState({
    name: '',
    address: '',
    city: '',
    phone: '',
    email: '',
    managerId: '',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [success, setSuccess] = useState(false);

  const set = (key: string, v: string) => {
    setForm((f) => ({ ...f, [key]: v }));
    setErrors((e) => ({ ...e, [key]: '' }));
  };

  const validate = () => {
    const e: Record<string, string> = {};
    if (!form.name.trim()) e.name = 'El nombre es requerido';
    if (!form.address.trim()) e.address = 'La dirección es requerida';
    if (!form.city.trim()) e.city = 'La ciudad es requerida';
    if (form.email && !form.email.includes('@')) e.email = 'Correo inválido';
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
        <div className="w-14 h-14 rounded-sm bg-emerald-100 dark:bg-emerald-900/40 flex items-center justify-center text-emerald-600">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <polyline points="20 6 9 17 4 12" />
          </svg>
        </div>
        <div className="text-center">
          <h3 className="font-display text-xl font-bold text-foreground">Sucursal creada</h3>
          <p className="text-sm text-muted-foreground mt-1">
            <strong>{form.name}</strong> ha sido registrada en {org?.name}.
          </p>
        </div>
        <Button onClick={() => router.push(`/dashboard/organizations/${orgId}`)} fullWidth>
          Volver a la organización
        </Button>
      </div>
    );
  }

  if (!org) {
    return (
      <div className="flex items-center justify-center h-full p-8">
        <p className="text-muted-foreground">Organización no encontrada</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full overflow-y-auto p-4 md:p-8 max-w-2xl mx-auto w-full gap-5">
      <div>
        <p className="text-sm text-muted-foreground">
          Nueva sucursal para <strong className="text-foreground">{org.name}</strong>.
        </p>
      </div>

      <SectionHeader>Identificación</SectionHeader>
      <Card className="p-4">
        <Input
          label="Nombre de la sucursal"
          placeholder="Ej. Sede Miraflores"
          value={form.name}
          onChange={(e) => set('name', e.target.value)}
          error={errors.name}
        />
      </Card>

      <SectionHeader>Ubicación física</SectionHeader>
      <Card className="p-4 flex flex-col gap-4">
        <Input
          label="Dirección"
          placeholder="Av. Larco 1150"
          value={form.address}
          onChange={(e) => set('address', e.target.value)}
          error={errors.address}
        />
        <Input
          label="Ciudad"
          placeholder="Lima"
          value={form.city}
          onChange={(e) => set('city', e.target.value)}
          error={errors.city}
        />
      </Card>

      <SectionHeader>Contacto</SectionHeader>
      <Card className="p-4 flex flex-col gap-4">
        <Input
          label="Teléfono (opcional)"
          type="tel"
          placeholder="+51 1 615 8902"
          value={form.phone}
          onChange={(e) => set('phone', e.target.value)}
        />
        <Input
          label="Correo (opcional)"
          type="email"
          placeholder="sucursal@empresa.com"
          value={form.email}
          onChange={(e) => set('email', e.target.value)}
          error={errors.email}
        />
      </Card>

      <SectionHeader>Encargado</SectionHeader>
      <Card className="p-4">
        <Select
          label="Asignar encargado (opcional)"
          value={form.managerId}
          onChange={(e) => set('managerId', e.target.value)}
        >
          <option value="">Sin encargado asignado</option>
          {orgUsers.map((u) => (
            <option key={u.id} value={u.id}>
              {u.name}
            </option>
          ))}
        </Select>
      </Card>

      <Button onClick={handleSubmit} fullWidth size="lg">
        Crear sucursal
      </Button>
    </div>
  );
}