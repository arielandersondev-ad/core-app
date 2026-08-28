import MainLayout from '@/shared/layouts/MainLayout';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return <MainLayout title="Dashboard">{children}</MainLayout>;
}