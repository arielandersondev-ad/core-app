export type Role = "super_admin" | "admin" | "manager" | "operator" | "viewer";
export type EntityStatus = "active" | "inactive";
export type UserStatus = EntityStatus | "suspended";

export interface Branch {
  id: string;
  orgId: string;
  name: string;
  address: string;
  city: string;
  phone: string;
  email: string;
  manager: string;
  status: EntityStatus;
  usersCount: number;
  createdAt: string;
}

export interface Organization {
  id: string;
  name: string;
  legalName: string;
  taxId: string;
  address: string;
  city: string;
  phone: string;
  email: string;
  status: EntityStatus;
  plan: "starter" | "professional" | "enterprise";
  branchesCount: number;
  usersCount: number;
  createdAt: string;
}

export interface User {
  id: string;
  name: string;
  email: string;
  role: Role;
  orgId: string;
  branchId: string | null;
  status: UserStatus;
  lastLogin: string;
  createdAt: string;
  permissions: Permission[];
}

export interface Permission {
  module: string;
  view: boolean;
  create: boolean;
  edit: boolean;
  delete: boolean;
}

export const MODULES = [
  "Dashboard",
  "Usuarios",
  "Organizaciones",
  "Sucursales",
  "Reportes",
  "Configuración",
  "Auditoría",
];

export const organizations: Organization[] = [
  {
    id: "org-1",
    name: "Comercial Vega",
    legalName: "Comercial Vega S.A.C.",
    taxId: "20601234567",
    address: "Av. Industrial 2450, Surquillo",
    city: "Lima",
    phone: "+51 1 615 8900",
    email: "admin@comercialvega.pe",
    status: "active",
    plan: "enterprise",
    branchesCount: 4,
    usersCount: 18,
    createdAt: "2023-03-14",
  },
  {
    id: "org-2",
    name: "Grupo Altamira",
    legalName: "Grupo Altamira Ltda.",
    taxId: "76.321.098-5",
    address: "Calle Agustinas 814, Santiago Centro",
    city: "Santiago",
    phone: "+56 2 2345 6789",
    email: "contacto@grupoaltamira.cl",
    status: "active",
    plan: "professional",
    branchesCount: 2,
    usersCount: 9,
    createdAt: "2023-07-22",
  },
  {
    id: "org-3",
    name: "Distribuciones Norte",
    legalName: "Distribuciones Norte E.I.R.L.",
    taxId: "20509876543",
    address: "Jr. Tacna 340, Chiclayo",
    city: "Chiclayo",
    phone: "+51 74 223 890",
    email: "operaciones@distnorte.pe",
    status: "inactive",
    plan: "starter",
    branchesCount: 1,
    usersCount: 3,
    createdAt: "2024-01-05",
  },
  {
    id: "org-4",
    name: "Soluciones Ábaco",
    legalName: "Soluciones Ábaco S.A.S.",
    taxId: "900.456.123-7",
    address: "Cra 15 # 93-47, Chapinero",
    city: "Bogotá",
    phone: "+57 1 756 3200",
    email: "info@solucionesabaco.co",
    status: "active",
    plan: "professional",
    branchesCount: 3,
    usersCount: 12,
    createdAt: "2023-11-18",
  },
];

export const branches: Branch[] = [
  {
    id: "br-1",
    orgId: "org-1",
    name: "Sede Central Surquillo",
    address: "Av. Industrial 2450",
    city: "Lima",
    phone: "+51 1 615 8901",
    email: "surquillo@comercialvega.pe",
    manager: "Carmen Flores",
    status: "active",
    usersCount: 7,
    createdAt: "2023-03-14",
  },
  {
    id: "br-2",
    orgId: "org-1",
    name: "Sucursal Miraflores",
    address: "Av. Larco 1150",
    city: "Lima",
    phone: "+51 1 615 8902",
    email: "miraflores@comercialvega.pe",
    manager: "Luis Quispe",
    status: "active",
    usersCount: 5,
    createdAt: "2023-06-01",
  },
  {
    id: "br-3",
    orgId: "org-1",
    name: "Sucursal San Isidro",
    address: "Calle Los Libertadores 420",
    city: "Lima",
    phone: "+51 1 615 8903",
    email: "sanisidro@comercialvega.pe",
    manager: "Paola Rivas",
    status: "active",
    usersCount: 4,
    createdAt: "2023-09-15",
  },
  {
    id: "br-4",
    orgId: "org-1",
    name: "Sucursal Callao",
    address: "Jr. Constitución 890",
    city: "Callao",
    phone: "+51 1 615 8904",
    email: "callao@comercialvega.pe",
    manager: "Jorge Mamani",
    status: "inactive",
    usersCount: 2,
    createdAt: "2024-02-20",
  },
  {
    id: "br-5",
    orgId: "org-2",
    name: "Oficina Santiago Centro",
    address: "Calle Agustinas 814",
    city: "Santiago",
    phone: "+56 2 2345 6790",
    email: "centro@grupoaltamira.cl",
    manager: "Valentina Soto",
    status: "active",
    usersCount: 6,
    createdAt: "2023-07-22",
  },
  {
    id: "br-6",
    orgId: "org-2",
    name: "Sede Providencia",
    address: "Av. Providencia 2594",
    city: "Santiago",
    phone: "+56 2 2345 6791",
    email: "providencia@grupoaltamira.cl",
    manager: "Rodrigo Fuentes",
    status: "active",
    usersCount: 3,
    createdAt: "2023-10-10",
  },
  {
    id: "br-7",
    orgId: "org-3",
    name: "Almacén Principal",
    address: "Jr. Tacna 340",
    city: "Chiclayo",
    phone: "+51 74 223 891",
    email: "almacen@distnorte.pe",
    manager: "Pedro Llontop",
    status: "inactive",
    usersCount: 3,
    createdAt: "2024-01-05",
  },
  {
    id: "br-8",
    orgId: "org-4",
    name: "Sede Chapinero",
    address: "Cra 15 # 93-47",
    city: "Bogotá",
    phone: "+57 1 756 3201",
    email: "chapinero@solucionesabaco.co",
    manager: "Andrea Molina",
    status: "active",
    usersCount: 5,
    createdAt: "2023-11-18",
  },
  {
    id: "br-9",
    orgId: "org-4",
    name: "Sucursal Usaquén",
    address: "Calle 119 # 7-32",
    city: "Bogotá",
    phone: "+57 1 756 3202",
    email: "usaquen@solucionesabaco.co",
    manager: "Camilo Torres",
    status: "active",
    usersCount: 4,
    createdAt: "2024-03-01",
  },
  {
    id: "br-10",
    orgId: "org-4",
    name: "Punto Medellín",
    address: "Calle 10 # 43E-31, El Poblado",
    city: "Medellín",
    phone: "+57 4 321 7800",
    email: "medellin@solucionesabaco.co",
    manager: "Isabela Restrepo",
    status: "active",
    usersCount: 3,
    createdAt: "2024-04-15",
  },
];

const defaultPermissions = (): Permission[] =>
  MODULES.map((module) => ({
    module,
    view: true,
    create: false,
    edit: false,
    delete: false,
  }));

const adminPermissions = (): Permission[] =>
  MODULES.map((module) => ({
    module,
    view: true,
    create: true,
    edit: true,
    delete: module !== "Auditoría",
  }));

export const users: User[] = [
  {
    id: "usr-1",
    name: "Sofía Herrera",
    email: "s.herrera@comercialvega.pe",
    role: "admin",
    orgId: "org-1",
    branchId: "br-1",
    status: "active",
    lastLogin: "2026-08-20T09:14:00Z",
    createdAt: "2023-03-14",
    permissions: adminPermissions(),
  },
  {
    id: "usr-2",
    name: "Martín Salcedo",
    email: "m.salcedo@comercialvega.pe",
    role: "manager",
    orgId: "org-1",
    branchId: "br-2",
    status: "active",
    lastLogin: "2026-08-19T15:32:00Z",
    createdAt: "2023-06-01",
    permissions: defaultPermissions(),
  },
  {
    id: "usr-3",
    name: "Claudia Núñez",
    email: "c.nunez@comercialvega.pe",
    role: "operator",
    orgId: "org-1",
    branchId: "br-3",
    status: "active",
    lastLogin: "2026-08-18T11:05:00Z",
    createdAt: "2023-09-15",
    permissions: defaultPermissions(),
  },
  {
    id: "usr-4",
    name: "Diego Paredes",
    email: "d.paredes@comercialvega.pe",
    role: "viewer",
    orgId: "org-1",
    branchId: null,
    status: "suspended",
    lastLogin: "2026-07-30T08:20:00Z",
    createdAt: "2024-02-20",
    permissions: defaultPermissions(),
  },
  {
    id: "usr-5",
    name: "Valentina Soto",
    email: "v.soto@grupoaltamira.cl",
    role: "admin",
    orgId: "org-2",
    branchId: "br-5",
    status: "active",
    lastLogin: "2026-08-20T08:55:00Z",
    createdAt: "2023-07-22",
    permissions: adminPermissions(),
  },
  {
    id: "usr-6",
    name: "Rodrigo Fuentes",
    email: "r.fuentes@grupoaltamira.cl",
    role: "manager",
    orgId: "org-2",
    branchId: "br-6",
    status: "active",
    lastLogin: "2026-08-19T17:00:00Z",
    createdAt: "2023-10-10",
    permissions: defaultPermissions(),
  },
  {
    id: "usr-7",
    name: "Pedro Llontop",
    email: "p.llontop@distnorte.pe",
    role: "admin",
    orgId: "org-3",
    branchId: "br-7",
    status: "inactive",
    lastLogin: "2026-06-14T10:00:00Z",
    createdAt: "2024-01-05",
    permissions: adminPermissions(),
  },
  {
    id: "usr-8",
    name: "Andrea Molina",
    email: "a.molina@solucionesabaco.co",
    role: "admin",
    orgId: "org-4",
    branchId: "br-8",
    status: "active",
    lastLogin: "2026-08-20T07:40:00Z",
    createdAt: "2023-11-18",
    permissions: adminPermissions(),
  },
  {
    id: "usr-9",
    name: "Camilo Torres",
    email: "c.torres@solucionesabaco.co",
    role: "operator",
    orgId: "org-4",
    branchId: "br-9",
    status: "active",
    lastLogin: "2026-08-19T13:45:00Z",
    createdAt: "2024-03-01",
    permissions: defaultPermissions(),
  },
];

export function getOrgById(id: string) {
  return organizations.find((o) => o.id === id);
}

export function getBranchById(id: string) {
  return branches.find((b) => b.id === id);
}

export function getBranchesByOrg(orgId: string) {
  return branches.filter((b) => b.orgId === orgId);
}

export function getUsersByOrg(orgId: string) {
  return users.filter((u) => u.orgId === orgId);
}

export function getUsersByBranch(branchId: string) {
  return users.filter((u) => u.branchId === branchId);
}

export function getUserById(id: string) {
  return users.find((u) => u.id === id);
}

export const roleLabels: Record<Role, string> = {
  super_admin: "Super Admin",
  admin: "Administrador",
  manager: "Gerente",
  operator: "Operador",
  viewer: "Visualizador",
};

export const planLabels: Record<string, string> = {
  starter: "Starter",
  professional: "Professional",
  enterprise: "Enterprise",
};

export function formatDate(iso: string) {
  const d = new Date(iso);
  return d.toLocaleDateString("es-PE", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

export function timeAgo(iso: string) {
  const diff = Date.now() - new Date(iso).getTime();
  const hours = Math.floor(diff / 3600000);
  if (hours < 1) return "hace menos de 1h";
  if (hours < 24) return `hace ${hours}h`;
  const days = Math.floor(hours / 24);
  return `hace ${days}d`;
}

export function getInitials(name: string) {
  return name
    .split(" ")
    .slice(0, 2)
    .map((n) => n[0])
    .join("")
    .toUpperCase();
}
