export interface DevPersona {
  id: 'owner' | 'practitioner' | 'reception';
  name: string;
  roleTitle: string;
  badgeLabel: string;
  badgeClass: string;
  avatarIcon: string;
  email: string;
  sub: string;
  membershipId: string;
  organizationId: string;
  branchIds: string[];
  permissions: string[];
  description: string;
}

// Organización y sucursales canónicas reales de la base de datos de desarrollo (Neon)
export const DEV_ORG_ID = '01a02b78-b1a4-72ac-87e0-3699e5182d3d';
export const DEV_BRANCH_ID_CENTRAL = '01a043d0-05e1-77ce-b3fe-aeccb845bbf0';
export const DEV_BRANCH_ID_SEGUNDA = '01a0441d-b517-7629-acb3-e9cd1bbca7d1';

export const DEV_PERSONAS: Record<string, DevPersona> = {
  owner: {
    id: 'owner',
    name: 'Dra. Ana Silva',
    roleTitle: 'Propietaria / Titular',
    badgeLabel: 'Acceso Total',
    badgeClass: 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border-emerald-500/30',
    avatarIcon: '👑',
    email: 'ana.silva@dentalcare.local',
    sub: '01a043d1-5ed9-73f9-a9fb-bc9cfb502c43',
    membershipId: '01a043d1-607b-75cd-a9e1-b3be724a0b38',
    organizationId: DEV_ORG_ID,
    branchIds: [DEV_BRANCH_ID_CENTRAL, DEV_BRANCH_ID_SEGUNDA],
    permissions: [
      'dentistry:appointments:read',
      'dentistry:appointments:create',
      'dentistry:appointments:update',
      'dentistry:appointments:cancel',
      'dentistry:patients:read',
      'dentistry:patients:create',
      'dentistry:patients:update',
      'dentistry:encounters:read',
      'dentistry:encounters:create',
      'dentistry:encounters:update',
      'dentistry:encounters:void',
      'dentistry:services:read',
      'dentistry:services:manage',
    ],
    description: 'Control de toda la clínica, sillones, agenda global, reportes y auditoría.',
  },
  practitioner: {
    id: 'practitioner',
    name: 'Dr. Carlos Valdivia',
    roleTitle: 'Odontólogo Asociado',
    badgeLabel: 'Clínico',
    badgeClass: 'bg-blue-500/15 text-blue-700 dark:text-blue-400 border-blue-500/30',
    avatarIcon: '🩺',
    email: 'carlos.valdivia@dentalcare.local',
    sub: '01a0e914-86db-7386-bf80-cfcf1e65da7e',
    membershipId: '01a0e914-8874-735c-86f3-3cfc0bc8c99b',
    organizationId: DEV_ORG_ID,
    branchIds: [DEV_BRANCH_ID_CENTRAL, DEV_BRANCH_ID_SEGUNDA],
    permissions: [
      'dentistry:appointments:read',
      'dentistry:appointments:create',
      'dentistry:appointments:update',
      'dentistry:patients:read',
      'dentistry:encounters:read',
      'dentistry:encounters:create',
      'dentistry:encounters:update',
    ],
    description: 'Gestión de citas propias y evolución de historias de pacientes asignados.',
  },
  reception: {
    id: 'reception',
    name: 'María Recepción',
    roleTitle: 'Front-Desk / Asistente',
    badgeLabel: 'Recepción',
    badgeClass: 'bg-amber-500/15 text-amber-700 dark:text-amber-400 border-amber-500/30',
    avatarIcon: '📋',
    email: 'recepcion@dentalcare.local',
    sub: '01a0e916-1e02-7058-aba3-e1e2eda01143',
    membershipId: '01a0e916-2075-7732-b5d1-5db292843347',
    organizationId: DEV_ORG_ID,
    branchIds: [DEV_BRANCH_ID_CENTRAL, DEV_BRANCH_ID_SEGUNDA],
    permissions: [
      'dentistry:appointments:read',
      'dentistry:appointments:create',
      'dentistry:appointments:update',
      'dentistry:appointments:cancel',
      'dentistry:patients:read',
      'dentistry:patients:create',
      'dentistry:services:read',
    ],
    description: 'Recepción presencial, llamadas, registro de prospectos y confirmación de citas.',
  },
};
