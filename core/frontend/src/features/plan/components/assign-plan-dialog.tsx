'use client';

import { useMemo, useState } from 'react';
import { isAxiosError } from 'axios';
import { Button, Input, Select } from '@/shared/components/ui';
import { Modal } from '@/shared/components/ui/Modal';
import { useOrganizations } from '@/features/organization/hooks/use-organizations';
import { useAssignPlan } from '../hooks/use-plans';
import type { Plan, PlanAssignment } from '../types/plan';

type Props = {open: boolean; plans: readonly Plan[]; assignment?: PlanAssignment | null; onClose: () => void};

export function AssignPlanDialog({ open, plans, assignment, onClose }: Props) {
  const organizations = useOrganizations();
  const mutation = useAssignPlan();
  const available = useMemo(() => plans.filter((plan) => plan.active && !plan.deleted), [plans]);
  const [organizationId, setOrganizationId] = useState(assignment?.organizationId ?? '');
  const [planId, setPlanId] = useState(assignment?.planId ?? available[0]?.id ?? '');
  const [status, setStatus] = useState<'ACTIVE' | 'TRIALING'>(assignment?.status === 'TRIALING' ? 'TRIALING' : 'ACTIVE');
  const [startsAt, setStartsAt] = useState(assignment ? assignment.startsAt.slice(0, 16) : new Date().toISOString().slice(0, 16));

  const error = mutation.isError && isAxiosError(mutation.error) && typeof mutation.error.response?.data?.message === 'string'
    ? mutation.error.response.data.message : mutation.isError ? 'No se pudo asignar el plan.' : null;

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    if (!organizationId || !planId || !startsAt) return;
    await mutation.mutateAsync({ organizationId, vertical: 'DENTISTRY', payload: { planId, status, startsAt: new Date(startsAt).toISOString() } });
    onClose();
  }

  return (
    <Modal open={open} onClose={onClose} eyebrow="Suscripciones" title={assignment ? 'Reemplazar plan asignado' : 'Asignar plan'} description="La vigencia final se calcula en el backend usando la duración del plan.">
      <form onSubmit={submit} className="flex min-h-0 flex-1 flex-col">
        <div className="space-y-5 overflow-y-auto p-5 sm:p-6">
          <Select label="Organización" value={organizationId} disabled={Boolean(assignment)} required onChange={(event) => setOrganizationId(event.target.value)}>
            <option value="">Selecciona una organización</option>
            {(organizations.data ?? []).map((organization) => <option key={organization.id} value={organization.id}>{organization.name}</option>)}
          </Select>
          <Select label="Plan" value={planId} required onChange={(event) => setPlanId(event.target.value)}>
            <option value="">Selecciona un plan</option>
            {available.map((plan) => <option key={plan.id} value={plan.id}>{plan.name} · {plan.durationDays} días</option>)}
          </Select>
          <Select label="Estado inicial" value={status} onChange={(event) => setStatus(event.target.value as 'ACTIVE' | 'TRIALING')}><option value="ACTIVE">Activo</option><option value="TRIALING">Prueba</option></Select>
          <Input id="assignment-start" type="datetime-local" label="Inicio de vigencia" value={startsAt} required onChange={(event) => setStartsAt(event.target.value)} />
          {error && <p role="alert" className="rounded-md border border-danger/30 bg-danger-subtle p-3 text-sm text-danger">{error}</p>}
        </div>
        <footer className="flex flex-col-reverse gap-2 border-t border-border p-4 sm:flex-row sm:justify-end sm:px-6">
          <Button variant="ghost" onClick={onClose} disabled={mutation.isPending}>Cancelar</Button>
          <Button type="submit" disabled={mutation.isPending || !organizationId || !planId}>{mutation.isPending ? 'Asignando…' : assignment ? 'Reemplazar plan' : 'Asignar plan'}</Button>
        </footer>
      </form>
    </Modal>
  );
}
