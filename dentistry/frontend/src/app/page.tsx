'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useTheme } from '@/infrastructure/hooks/useTheme';
import ClinicLayout from '@/shared/layouts/ClinicLayout';
import ClinicDashboard from '@/modules/clinic/views/ClinicDashboard';

type ClinicTab = 'dashboard' | 'pacientes' | 'agenda' | 'tratamientos' | 'pagos' | 'inventario';

export default function Home() {
  const router = useRouter();
  const { dark, toggleDark } = useTheme();
  const [activeTab, setActiveTab] = useState<ClinicTab>('dashboard');

  const handleTabChange = (tab: ClinicTab) => {
    setActiveTab(tab);
    const routes: Record<ClinicTab, string> = {
      dashboard: '/',
      pacientes: '/patients',      
      agenda: '/agenda',      
      tratamientos: '/treatments',
      pagos: '/payments',
      inventario: '/inventory',  
    };
    router.push(routes[tab]);
  };

  return (
    <ClinicLayout
      activeTab={activeTab}
      onTabChange={handleTabChange}
      dark={dark}
      onToggleDark={toggleDark}
      onSwitchApp={() => router.push('/')}
      title="Dashboard"
      breadcrumbs={[{ label: 'Dashboard' }]}
    >
      <ClinicDashboard onNavigate={() => {}} />
    </ClinicLayout>
  );
}