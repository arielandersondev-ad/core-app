'use client';

import { useState } from 'react';
import { isAxiosError } from 'axios';
import { Badge, Button } from '@/shared/components/ui';
import { Modal } from '@/shared/components/ui/Modal';
import { PlanFormDialog } from '../components/plan-form-dialog';
import { AssignPlanDialog } from '../components/assign-plan-dialog';
import { useDeletePlan, usePlanAssignments, usePlans, useUpdateAssignmentStatus } from '../hooks/use-plans';
import type { AssignmentStatus, Plan, PlanAssignment } from '../types/plan';

const dateFormat = new Intl.DateTimeFormat('es-BO', { dateStyle: 'medium' });
const moneyFormat = (currency: string) => new Intl.NumberFormat('es-BO', { style: 'currency', currency });
const statusLabel: Record<AssignmentStatus, string> = { ACTIVE: 'Activo', TRIALING: 'Prueba', SUSPENDED: 'Suspendido', CANCELED: 'Cancelado' };

function errorMessage(error: unknown, fallback: string) {
  return isAxiosError(error) && typeof error.response?.data?.message === 'string' ? error.response.data.message : fallback;
}

export default function PlansPage() {
  const plansQuery = usePlans();
  const assignmentsQuery = usePlanAssignments();
  const remove = useDeletePlan();
  const statusMutation = useUpdateAssignmentStatus();
  const [editing, setEditing] = useState<Plan | null | undefined>(undefined);
  const [assigning, setAssigning] = useState<PlanAssignment | null | undefined>(undefined);
  const [deleting, setDeleting] = useState<Plan | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const plans = plansQuery.data ?? [];
  const assignments = assignmentsQuery.data ?? [];

  async function confirmDelete() {
    if (!deleting) return;
    try { setActionError(null); await remove.mutateAsync(deleting.id); setDeleting(null); }
    catch (error) { setActionError(errorMessage(error, 'No se pudo eliminar el plan.')); }
  }

  async function changeStatus(assignment: PlanAssignment, status: 'ACTIVE' | 'SUSPENDED' | 'CANCELED') {
    let reason: string | undefined;
    if (status === 'SUSPENDED') {
      reason = window.prompt('Motivo de la suspensión:')?.trim();
      if (!reason) return;
    }
    if (status === 'CANCELED' && !window.confirm(`¿Cancelar el plan de ${assignment.organizationName}? Esta acción revoca su acceso.`)) return;
    try { setActionError(null); await statusMutation.mutateAsync({ organizationId: assignment.organizationId, vertical: assignment.vertical, payload: { status, reason } }); }
    catch (error) { setActionError(errorMessage(error, 'No se pudo cambiar el estado de la asignación.')); }
  }

  return (
    <section className="mx-auto w-full max-w-[1440px] p-4 md:p-8">
      <header className="flex flex-col gap-5 border-b border-border pb-6 sm:flex-row sm:items-end sm:justify-between">
        <div><p className="mb-2 font-mono text-[10px] font-medium uppercase tracking-[0.18em] text-primary">Administración comercial</p><h1 className="font-display text-2xl font-bold sm:text-3xl">Planes de suscripción</h1><p className="mt-2 max-w-2xl text-sm text-muted">Gestiona el catálogo y el acceso de cada organización a las verticales.</p></div>
        <div className="flex flex-wrap gap-2"><Button variant="outline" onClick={() => setAssigning(null)}>Asignar plan</Button><Button onClick={() => setEditing(null)}>Crear plan</Button></div>
      </header>

      {actionError && <div role="alert" className="mt-5 rounded-md border border-danger/30 bg-danger-subtle p-4 text-sm text-danger">{actionError}</div>}

      <div className="mt-8 flex items-center justify-between"><div><h2 className="font-display text-lg font-semibold">Catálogo</h2><p className="text-sm text-muted">{plans.length} planes registrados</p></div></div>
      {plansQuery.isPending ? <div role="status" className="mt-4 grid gap-4 md:grid-cols-2 xl:grid-cols-3"><div className="h-56 animate-pulse rounded-xl bg-surface" /><div className="h-56 animate-pulse rounded-xl bg-surface" /></div>
      : plansQuery.isError ? <ErrorState message={errorMessage(plansQuery.error, 'No se pudo cargar el catálogo.')} retry={() => void plansQuery.refetch()} />
      : plans.length === 0 ? <EmptyState title="Aún no hay planes" body="Crea el primer plan para comenzar a asignar acceso a Dentistry." />
      : <div className="mt-4 grid gap-4 md:grid-cols-2 xl:grid-cols-3">{plans.map((plan) => (
        <article key={plan.id} className="flex flex-col rounded-xl border border-border bg-surface p-5 shadow-sm">
          <div className="flex items-start justify-between gap-3"><div><p className="font-mono text-[10px] tracking-wider text-primary">{plan.code}</p><h3 className="mt-1 text-lg font-semibold">{plan.name}</h3></div><Badge variant={plan.active ? 'success' : 'neutral'} dot>{plan.active ? 'Activo' : 'Inactivo'}</Badge></div>
          <p className="mt-3 min-h-10 text-sm text-muted">{plan.description || 'Sin descripción.'}</p>
          <dl className="mt-5 grid grid-cols-2 gap-3 border-y border-border py-4 text-sm"><div><dt className="text-xs text-muted">Precio</dt><dd className="mt-1 font-semibold">{plan.priceMinor == null || !plan.currency ? 'Sin precio' : moneyFormat(plan.currency).format(plan.priceMinor / 100)}</dd></div><div><dt className="text-xs text-muted">Duración</dt><dd className="mt-1 font-semibold">{plan.durationDays} días</dd></div><div><dt className="text-xs text-muted">Vertical</dt><dd className="mt-1">Dentistry</dd></div><div><dt className="text-xs text-muted">Tipo</dt><dd className="mt-1">{plan.type === 'PUBLIC' ? 'Público' : 'Personalizado'}</dd></div></dl>
          <div className="mt-4 flex justify-end gap-2"><Button size="sm" variant="ghost" onClick={() => setEditing(plan)}>Editar</Button><Button size="sm" variant="danger" onClick={() => { setActionError(null); setDeleting(plan); }}>Eliminar</Button></div>
        </article>
      ))}</div>}

      <div className="mt-12"><h2 className="font-display text-lg font-semibold">Asignaciones por organización</h2><p className="text-sm text-muted">Una asignación vigente habilita el acceso de la organización a Dentistry.</p></div>
      {assignmentsQuery.isPending ? <div className="mt-4 h-56 animate-pulse rounded-xl bg-surface" />
      : assignmentsQuery.isError ? <ErrorState message={errorMessage(assignmentsQuery.error, 'No se pudieron cargar las asignaciones.')} retry={() => void assignmentsQuery.refetch()} />
      : assignments.length === 0 ? <EmptyState title="Sin asignaciones" body="Asigna un plan a una organización para habilitar su acceso." />
      : <div className="mt-4 overflow-x-auto rounded-xl border border-border bg-surface"><table className="w-full min-w-[850px] text-left text-sm"><thead className="border-b border-border bg-background/60 text-xs uppercase tracking-wide text-muted"><tr><th className="px-4 py-3">Organización</th><th className="px-4 py-3">Plan</th><th className="px-4 py-3">Estado</th><th className="px-4 py-3">Vigencia</th><th className="px-4 py-3 text-right">Acciones</th></tr></thead><tbody>{assignments.map((assignment) => <tr key={assignment.id} className="border-b border-border last:border-0"><td className="px-4 py-4 font-medium">{assignment.organizationName}</td><td className="px-4 py-4"><span className="font-medium">{assignment.planName}</span><span className="block font-mono text-[10px] text-muted">{assignment.planCode}</span></td><td className="px-4 py-4"><Badge variant={assignment.status === 'ACTIVE' ? 'success' : assignment.status === 'SUSPENDED' ? 'warning' : assignment.status === 'CANCELED' ? 'danger' : 'primary'}>{statusLabel[assignment.status]}</Badge></td><td className="px-4 py-4 text-muted">{dateFormat.format(new Date(assignment.startsAt))} – {dateFormat.format(new Date(assignment.endsAt))}</td><td className="px-4 py-4"><div className="flex justify-end gap-2"><Button size="sm" variant="ghost" onClick={() => setAssigning(assignment)}>Reemplazar</Button>{assignment.status === 'SUSPENDED' ? <Button size="sm" variant="outline" onClick={() => void changeStatus(assignment, 'ACTIVE')}>Activar</Button> : assignment.status !== 'CANCELED' && <Button size="sm" variant="outline" onClick={() => void changeStatus(assignment, 'SUSPENDED')}>Suspender</Button>}{assignment.status !== 'CANCELED' && <Button size="sm" variant="danger" onClick={() => void changeStatus(assignment, 'CANCELED')}>Cancelar</Button>}</div></td></tr>)}</tbody></table></div>}

      {editing !== undefined && <PlanFormDialog open plan={editing} onClose={() => setEditing(undefined)} />}
      {assigning !== undefined && <AssignPlanDialog open plans={plans} assignment={assigning} onClose={() => setAssigning(undefined)} />}
      <Modal open={Boolean(deleting)} onClose={() => setDeleting(null)} eyebrow="Acción irreversible" title="Eliminar plan" description="El plan se desactivará y quedará eliminado lógicamente; no se borrará información histórica."><div className="space-y-5 p-6"><p className="text-sm">¿Confirmas que deseas eliminar <strong>{deleting?.name}</strong>? Si tiene asignaciones no canceladas, el backend rechazará la operación.</p>{actionError && <p className="rounded-md bg-danger-subtle p-3 text-sm text-danger">{actionError}</p>}<div className="flex justify-end gap-2"><Button variant="ghost" onClick={() => setDeleting(null)}>Volver</Button><Button variant="danger" onClick={() => void confirmDelete()} disabled={remove.isPending}>{remove.isPending ? 'Eliminando…' : 'Eliminar plan'}</Button></div></div></Modal>
    </section>
  );
}

function EmptyState({ title, body }: {title: string; body: string}) { return <div className="mt-4 rounded-xl border border-dashed border-border bg-surface px-6 py-14 text-center"><h3 className="font-semibold">{title}</h3><p className="mt-1 text-sm text-muted">{body}</p></div>; }
function ErrorState({ message, retry }: {message: string; retry: () => void}) { return <div role="alert" className="mt-4 rounded-md border border-danger/30 bg-danger-subtle p-4 text-sm text-danger">{message}<button type="button" onClick={retry} className="ml-2 underline">Reintentar</button></div>; }
