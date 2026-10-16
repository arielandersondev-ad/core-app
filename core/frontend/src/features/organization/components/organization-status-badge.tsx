import { Badge } from '@/shared/components/ui';

export function OrganizationStatusBadge({ status }: { status: string }) {
  const normalizedStatus = status.toUpperCase();

  if (normalizedStatus === 'ACTIVE') {
    return <Badge variant="success" dot>Activo</Badge>;
  }

  if (normalizedStatus === 'INACTIVE') {
    return <Badge variant="warning" dot>Inactivo</Badge>;
  }

  return <Badge variant="neutral">{status}</Badge>;
}
