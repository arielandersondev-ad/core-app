'use client';

import { useParams, useRouter } from 'next/navigation';
import {
  Badge,
  Separator,
  Avatar,
  Icons,
} from '@/shared/components/ui';
import {
  getBranchById,
  getOrgById,
  getUsersByBranch,
  formatDate,
  roleLabels,
} from '@/modules/organization/__mocks__/data';

function InfoRow({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="flex items-center gap-3 px-4 py-3.5">
      <span className="text-muted-foreground shrink-0">{icon}</span>
      <div className="flex-1 min-w-0">
        <p className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground">{label}</p>
        <p className="text-sm text-foreground mt-0.5 truncate">{value}</p>
      </div>
    </div>
  );
}

export default function BranchDetail() {
  const params = useParams<{ id: string; branchId: string }>();
  const router = useRouter();
  const branchId = params.branchId;

  const branch = getBranchById(branchId);
  if (!branch) {
    return (
      <div className="flex items-center justify-center h-full p-8">
        <p className="text-muted-foreground">Sucursal no encontrada</p>
      </div>
    );
  }

  const org = getOrgById(branch.orgId);
  const users = getUsersByBranch(branchId);

  return (
    <div className="flex flex-col h-full overflow-y-auto p-4 md:p-8 gap-6">
      {/* ── Header ── */}
      <div className="flex flex-col md:flex-row md:items-start gap-4">
        <div className="w-12 h-12 md:w-14 md:h-14 rounded-sm bg-primary/10 flex items-center justify-center text-primary shrink-0">
          {Icons.mapPin}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-center gap-2 md:gap-3 mb-1">
            <h2 className="font-display text-xl md:text-2xl font-bold text-foreground">{branch.name}</h2>
            <Badge variant={branch.status === 'active' ? 'active' : 'inactive'}>
              {branch.status === 'active' ? 'Activa' : 'Inactiva'}
            </Badge>
          </div>
          <p className="text-sm text-muted font-mono">{org?.name} · {branch.city}</p>
        </div>
        <div className="flex gap-2 self-start md:self-center">
          <button
            onClick={() => router.push(`/dashboard/users/create?branchId=${branchId}`)}
            className="h-9 px-4 bg-primary text-primary-foreground rounded-sm text-sm font-semibold flex items-center gap-1.5 hover:opacity-90"
          >
            {Icons.plus} Agregar usuario
          </button>
          <button className="h-9 px-4 border border-border text-muted rounded-sm text-sm font-semibold hover:border-danger hover:text-danger transition-colors">
            {branch.status === 'active' ? 'Desactivar' : 'Reactivar'}
          </button>
        </div>
      </div>

      {/* ── Contenido: 2 columnas en desktop ── */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Columna izquierda (2/3): Usuarios */}
        <div className="md:col-span-2">
          <p className="text-[10px] font-mono uppercase tracking-widest text-muted mb-2">
            Usuarios asignados ({users.length})
          </p>

          {users.length === 0 ? (
            <div className="bg-surface border border-dashed border-border rounded-md py-16 flex flex-col items-center justify-center text-muted">
              <p className="text-sm">Sin usuarios asignados a esta sucursal</p>
              <button
                onClick={() => router.push(`/dashboard/users/create?branchId=${branchId}`)}
                className="mt-3 text-xs text-primary font-mono hover:underline"
              >
                + Crear usuario
              </button>
            </div>
          ) : (
            <div className="bg-surface border border-border rounded-md overflow-hidden">
              {/* Tabla desktop */}
              <div className="hidden md:block overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-border bg-background/50">
                      {['Usuario', 'Rol', 'Estado', 'Último acceso', ''].map((h) => (
                        <th key={h} className="text-left px-4 py-2.5 text-[10px] font-mono uppercase tracking-widest text-muted">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {users.map((user) => (
                      <tr
                        key={user.id}
                        onClick={() => router.push(`/dashboard/users/${user.id}`)}
                        className="border-b border-border last:border-0 hover:bg-background cursor-pointer transition-colors group"
                      >
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2.5">
                            <Avatar name={user.name} size="sm" />
                            <div>
                              <p className="text-sm font-display font-semibold text-foreground">{user.name}</p>
                              <p className="text-[11px] font-mono text-muted">{user.email}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-[11px] font-mono text-muted">{roleLabels[user.role]}</td>
                        <td className="px-4 py-3">
                          <Badge variant={user.status === 'active' ? 'active' : user.status === 'suspended' ? 'suspended' : 'inactive'}>
                            {user.status === 'active' ? 'Activo' : user.status === 'suspended' ? 'Suspendido' : 'Inactivo'}
                          </Badge>
                        </td>
                        <td className="px-4 py-3 text-[11px] font-mono text-muted">
                          {new Date(user.lastLogin).toLocaleDateString('es-PE')}
                        </td>
                        <td className="px-4 py-3 text-muted opacity-0 group-hover:opacity-100 transition-opacity">
                          {Icons.chevronRight}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Tarjetas mobile */}
              <div className="md:hidden divide-y divide-border">
                {users.map((user) => (
                  <button
                    key={user.id}
                    onClick={() => router.push(`/dashboard/users/${user.id}`)}
                    className="w-full flex items-center gap-3 px-4 py-3 hover:bg-background transition-colors text-left"
                  >
                    <Avatar name={user.name} size="sm" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-display font-semibold text-foreground truncate">{user.name}</p>
                      <p className="text-[11px] font-mono text-muted truncate">{user.email}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <Badge variant={user.status === 'active' ? 'active' : user.status === 'suspended' ? 'suspended' : 'inactive'}>
                          {user.status === 'active' ? 'Activo' : user.status === 'suspended' ? 'Susp.' : 'Inac.'}
                        </Badge>
                        <span className="text-[10px] font-mono text-muted">{roleLabels[user.role]}</span>
                      </div>
                    </div>
                    <span className="text-muted">{Icons.chevronRight}</span>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Columna derecha (1/3): Datos de la sucursal */}
        <div className="flex flex-col gap-4">
          <div className="bg-surface border border-border rounded-md p-5">
            <p className="text-[10px] font-mono uppercase tracking-widest text-muted mb-4">
              Datos de la sucursal
            </p>
            <div className="flex flex-col gap-3">
              <InfoRow icon={Icons.mapPin} label="Dirección" value={`${branch.address}, ${branch.city}`} />
              <Separator />
              <InfoRow icon={Icons.phone} label="Teléfono" value={branch.phone} />
              <Separator />
              <InfoRow icon={Icons.mail} label="Correo" value={branch.email} />
              <Separator />
              <InfoRow icon={Icons.user} label="Encargado" value={branch.manager} />
              <Separator />
              <InfoRow icon={Icons.clock} label="Registrada" value={formatDate(branch.createdAt)} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}