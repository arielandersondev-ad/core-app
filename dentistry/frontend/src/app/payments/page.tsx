'use client';

import { useRouter } from 'next/navigation';
import { useTheme } from '@/infrastructure/hooks/useTheme';
import ClinicLayout from '@/shared/layouts/ClinicLayout';
import Payments from '@/modules/clinic/views/Payments';

export default function PaymentsPage() {
  const router = useRouter();
  const { dark, toggleDark } = useTheme();

  const handleTabChange = (tab: string) => {
    const routes: Record<string, string> = {
      dashboard: '/',
      pagos: '/payments',
    };
    router.push(routes[tab] || '/');
  };

  return (
    <ClinicLayout
      activeTab="pagos"
      onTabChange={handleTabChange}
      dark={dark}
      onToggleDark={toggleDark}
      onSwitchApp={() => router.push('/')}
      title="Pagos"
      breadcrumbs={[{ label: 'Pagos' }]}
    >
      <Payments onNavigate={() => {}} />
    </ClinicLayout>
  );
}