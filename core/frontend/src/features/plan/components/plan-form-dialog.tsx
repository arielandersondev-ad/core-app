'use client';

import { useEffect } from 'react';
import { isAxiosError } from 'axios';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { Button, Input, Label, Select } from '@/shared/components/ui';
import { Modal } from '@/shared/components/ui/Modal';
import { useCreatePlan, useUpdatePlan } from '../hooks/use-plans';
import { planFormSchema, type PlanFormInput, type PlanFormValues } from '../schemas/plan.schema';
import { PLAN_MODULES } from '../data/plan-modules';
import type { Plan, PlanEntitlementLimits, PlanEntitlements } from '../types/plan';

type Props = {open: boolean; plan?: Plan | null; onClose: () => void};

type LimitKey = keyof PlanEntitlementLimits;

function readLimit(plan: Plan | null | undefined, key: LimitKey): string {
  const limits = (plan?.entitlements as PlanEntitlements | undefined)?.limits;
  const value = limits?.[key];
  return typeof value === 'number' ? String(value) : '';
}

function readModules(plan?: Plan | null): string[] {
  const allCodes = PLAN_MODULES.DENTISTRY.map((option) => option.code);
  const modules = (plan?.entitlements as PlanEntitlements | undefined)?.modules;
  // Sin lista explícita el plan no restringe módulos: se muestran todos marcados.
  return Array.isArray(modules) ? modules.filter((code) => allCodes.includes(code)) : allCodes;
}

function toLimit(value: string): number | null {
  return value === '' ? null : Number(value);
}

/** Conserva las claves existentes del plan y reemplaza solo módulos y límites. */
function toEntitlements(values: PlanFormValues, plan?: Plan | null): PlanEntitlements {
  const current = (plan?.entitlements ?? {}) as PlanEntitlements;
  return {
    ...current,
    modules: values.modules,
    limits: {
      ...(current.limits ?? {}),
      patients: toLimit(values.patientsLimit),
      users: toLimit(values.usersLimit),
      branches: toLimit(values.branchesLimit),
    },
  };
}

function defaults(plan?: Plan | null): PlanFormValues {
  return {
    code: plan?.code ?? '', name: plan?.name ?? '', description: plan?.description ?? '',
    type: plan?.type ?? 'PUBLIC', vertical: 'DENTISTRY', durationDays: plan?.durationDays ?? 30,
    price: plan?.priceMinor == null ? '' : (plan.priceMinor / 100).toFixed(2),
    currency: plan?.currency ?? 'BOB', isActive: plan?.isActive ?? true,
    modules: readModules(plan),
    patientsLimit: readLimit(plan, 'patients'), usersLimit: readLimit(plan, 'users'), branchesLimit: readLimit(plan, 'branches'),
  };
}

function mutationMessage(error: unknown) {
  return isAxiosError(error) && typeof error.response?.data?.message === 'string'
    ? error.response.data.message : 'No se pudo guardar el plan.';
}

export function PlanFormDialog({ open, plan, onClose }: Props) {
  const create = useCreatePlan();
  const update = useUpdatePlan();
  const mutation = plan ? update : create;
  const form = useForm<PlanFormInput, unknown, PlanFormValues>({ resolver: zodResolver(planFormSchema), defaultValues: defaults(plan) });

  useEffect(() => { if (open) form.reset(defaults(plan)); }, [form, open, plan]);

  function close() { mutation.reset(); form.reset(defaults(plan)); onClose(); }

  async function submit(values: PlanFormValues) {
    const common = {
      name: values.name, description: values.description || undefined, type: values.type,
      durationDays: values.durationDays, priceMinor: values.price === '' ? undefined : Math.round(Number(values.price) * 100),
      currency: values.currency.toUpperCase(),
      entitlements: toEntitlements(values, plan),
    };
    if (plan) await update.mutateAsync({ id: plan.id, payload: { ...common, isActive: values.isActive } });
    else await create.mutateAsync({ ...common, code: values.code.toUpperCase(), vertical: values.vertical });
    close();
  }

  return (
    <Modal open={open} onClose={close} eyebrow="Catálogo de planes" title={plan ? 'Editar plan' : 'Crear plan'}
      description={plan ? 'El código y la vertical permanecen inmutables.' : 'Define la oferta que luego podrás asignar a una organización.'}>
      <form onSubmit={form.handleSubmit(submit)} className="flex min-h-0 flex-1 flex-col">
        <div className="grid flex-1 gap-5 overflow-y-auto p-5 sm:grid-cols-2 sm:p-6">
          <Input id="plan-code" label="Código" placeholder="DENTISTRY_STANDARD" disabled={Boolean(plan)} error={form.formState.errors.code?.message} {...form.register('code')} />
          <Select id="plan-vertical" label="Vertical" disabled {...form.register('vertical')}><option value="DENTISTRY">Dentistry</option></Select>
          <div className="sm:col-span-2"><Input id="plan-name" label="Nombre" placeholder="Dentistry estándar" error={form.formState.errors.name?.message} {...form.register('name')} /></div>
          <div className="sm:col-span-2 flex flex-col gap-1">
            <Label htmlFor="plan-description">Descripción</Label>
            <textarea id="plan-description" rows={3} className="w-full resize-none rounded-md border border-border bg-background px-3 py-3 text-sm outline-none focus:ring-2 focus:ring-primary/20" {...form.register('description')} />
            {form.formState.errors.description && <p className="text-[11px] text-danger">{form.formState.errors.description.message}</p>}
          </div>
          <Select id="plan-type" label="Tipo" {...form.register('type')}><option value="PUBLIC">Público</option><option value="CUSTOM">Personalizado</option></Select>
          <Input id="plan-duration" type="number" label="Duración (días)" error={form.formState.errors.durationDays?.message} {...form.register('durationDays')} />
          <Input id="plan-price" inputMode="decimal" label="Precio" placeholder="0.00" error={form.formState.errors.price?.message} {...form.register('price')} />
          <Input id="plan-currency" label="Moneda" maxLength={3} error={form.formState.errors.currency?.message} {...form.register('currency')} />
          <fieldset className="sm:col-span-2 flex flex-col gap-3 rounded-md border border-border p-4">
            <legend className="px-1 text-sm font-medium">Módulos incluidos</legend>
            <div className="grid gap-2 sm:grid-cols-3">
              {PLAN_MODULES.DENTISTRY.map((option) => (
                <label key={option.code} className="flex items-center gap-2 text-sm">
                  <input type="checkbox" value={option.code} className="size-4 accent-primary" {...form.register('modules')} />
                  {option.label}
                </label>
              ))}
            </div>
            {form.formState.errors.modules && <p className="text-[11px] text-danger">{form.formState.errors.modules.message}</p>}
          </fieldset>
          <div className="sm:col-span-2 grid gap-5 sm:grid-cols-3">
            <Input id="plan-limit-patients" inputMode="numeric" label="Máx. pacientes" placeholder="Ilimitado" error={form.formState.errors.patientsLimit?.message} {...form.register('patientsLimit')} />
            <Input id="plan-limit-users" inputMode="numeric" label="Máx. usuarios" placeholder="Ilimitado" error={form.formState.errors.usersLimit?.message} {...form.register('usersLimit')} />
            <Input id="plan-limit-branches" inputMode="numeric" label="Máx. sucursales" placeholder="Ilimitado" error={form.formState.errors.branchesLimit?.message} {...form.register('branchesLimit')} />
          </div>
          {plan && <p className="sm:col-span-2 text-xs text-muted-foreground">Los cambios de módulos y límites aplican a nuevas asignaciones; las vigentes conservan su configuración hasta reasignarse.</p>}
          {plan && <label className="sm:col-span-2 flex items-center gap-3 rounded-md border border-border p-4 text-sm"><input type="checkbox" className="size-4 accent-primary" {...form.register('isActive')} /> Disponible para nuevas asignaciones</label>}
          {mutation.isError && <p role="alert" className="sm:col-span-2 rounded-md border border-danger/30 bg-danger-subtle p-3 text-sm text-danger">{mutationMessage(mutation.error)}</p>}
        </div>
        <footer className="flex flex-col-reverse gap-2 border-t border-border p-4 sm:flex-row sm:justify-end sm:px-6">
          <Button variant="ghost" onClick={close} disabled={mutation.isPending}>Cancelar</Button>
          <Button type="submit" disabled={mutation.isPending}>{mutation.isPending ? 'Guardando…' : 'Guardar plan'}</Button>
        </footer>
      </form>
    </Modal>
  );
}
