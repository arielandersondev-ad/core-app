import type { Meta, StoryObj } from "@storybook/react";
import { ResponsiveTable } from "./ResponsiveTable";
import { MobileCardItem } from "./MobileCardItem";
import { Badge } from "./Badge";
import { Avatar } from "./Avatar";
import { Button } from "./Button";
import { Icons } from "./Icons";

const meta: Meta<typeof ResponsiveTable> = {
  title: "UI/ResponsiveTable",
  component: ResponsiveTable,
  tags: ["autodocs"],
  parameters: {
    docs: {
      description: {
        component:
          "Componente responsivo estándar para colecciones de datos tabulares. En escritorio (>= 768px) renderiza una tabla HTML completa con cabeceras, bordes y paginación. En móvil (< 768px) transforma automáticamente los registros en tarjetas verticales limpias (MobileCardItem), evitando scrolls horizontales forzados en pantallas reducidas.",
      },
    },
  },
};

export default meta;
type Story = StoryObj<typeof ResponsiveTable>;

interface OrganizationData {
  id: string;
  name: string;
  legalName: string;
  taxId: string;
  country: string;
  status: "ACTIVE" | "INACTIVE";
}

const mockOrganizations: OrganizationData[] = [
  {
    id: "org-1",
    name: "Clínica Dental San Juan",
    legalName: "Inversiones San Juan S.A.",
    taxId: "76.123.456-7",
    country: "Chile",
    status: "ACTIVE",
  },
  {
    id: "org-2",
    name: "Centro Odontológico Las Condes",
    legalName: "Odontología Las Condes SpA",
    taxId: "77.987.654-3",
    country: "Chile",
    status: "ACTIVE",
  },
  {
    id: "org-3",
    name: "Red Dental Providencia",
    legalName: "Servicios Médicos Providencia Ltda.",
    taxId: "81.456.789-0",
    country: "Bolivia",
    status: "INACTIVE",
  },
];

interface PatientData {
  id: string;
  fullName: string;
  email: string;
  phone: string;
  document: string;
  birthDate: string;
  status: "ACTIVE" | "INACTIVE";
}

const mockPatients: PatientData[] = [
  {
    id: "pat-1",
    fullName: "Camila Silva",
    email: "camila.silva@example.com",
    phone: "+56 9 1234 5678",
    document: "RUN 18.234.567-8",
    birthDate: "1994-05-12",
    status: "ACTIVE",
  },
  {
    id: "pat-2",
    fullName: "Roberto Morales",
    email: "roberto.m@example.com",
    phone: "+56 9 8765 4321",
    document: "RUN 15.678.901-2",
    birthDate: "1988-11-23",
    status: "ACTIVE",
  },
  {
    id: "pat-3",
    fullName: "Valeria Contreras",
    email: "v.contreras@example.com",
    phone: "+56 9 4567 8901",
    document: "RUN 20.345.678-9",
    birthDate: "2001-02-14",
    status: "INACTIVE",
  },
];

/**
 * 1. Ejemplo Data-Driven para Organizaciones (Core)
 * Redimensiona el navegador o activa la vista móvil en Storybook para ver la transformación a tarjetas.
 */
export const OrganizationsTable: Story = {
  render: () => (
    <div className="p-4 max-w-5xl mx-auto">
      <ResponsiveTable<OrganizationData>
        items={mockOrganizations}
        caption="Listado de organizaciones registradas"
        columns={[
          {
            header: "Organización",
            accessor: (org) => (
              <div className="flex items-center gap-3">
                <Avatar name={org.name} size="sm" />
                <div>
                  <p className="font-semibold text-[var(--foreground)]">{org.name}</p>
                  <p className="text-xs text-[var(--muted)]">{org.legalName}</p>
                </div>
              </div>
            ),
          },
          {
            header: "NIT / Tax ID",
            accessor: "taxId",
            className: "font-mono text-xs",
          },
          {
            header: "País",
            accessor: "country",
          },
          {
            header: "Estado",
            accessor: (org) => (
              <Badge
                variant={org.status === "ACTIVE" ? "success" : "neutral"}
                size="sm"
              >
                {org.status === "ACTIVE" ? "Activa" : "Inactiva"}
              </Badge>
            ),
          },
        ]}
        renderCard={(org) => (
          <MobileCardItem
            avatar={<Avatar name={org.name} size="sm" />}
            title={org.name}
            subtitle={org.legalName}
            badge={
              <Badge
                variant={org.status === "ACTIVE" ? "success" : "neutral"}
                size="sm"
              >
                {org.status === "ACTIVE" ? "Activa" : "Inactiva"}
              </Badge>
            }
            fields={[
              { label: "NIT", value: org.taxId, mono: true },
              { label: "País", value: org.country },
            ]}
            actions={
              <Button size="sm" variant="ghost">
                Ver detalle →
              </Button>
            }
          />
        )}
        footer={`Mostrando ${mockOrganizations.length} organizaciones`}
      />
    </div>
  ),
};

/**
 * 2. Ejemplo Data-Driven para Pacientes (Dentistry)
 */
export const PatientsTable: Story = {
  render: () => (
    <div className="p-4 max-w-5xl mx-auto">
      <ResponsiveTable<PatientData>
        items={mockPatients}
        caption="Listado de pacientes clínicos"
        columns={[
          {
            header: "Paciente",
            accessor: (pat) => (
              <div className="flex items-center gap-3">
                <Avatar name={pat.fullName} size="sm" />
                <div>
                  <p className="font-semibold text-[var(--primary)] hover:underline cursor-pointer">
                    {pat.fullName}
                  </p>
                  <p className="text-xs text-[var(--muted)] font-mono">{pat.email}</p>
                </div>
              </div>
            ),
          },
          {
            header: "Teléfono",
            accessor: "phone",
            className: "font-mono text-xs",
          },
          {
            header: "Documento",
            accessor: "document",
            className: "text-xs",
          },
          {
            header: "Estado",
            accessor: (pat) => (
              <Badge
                variant={pat.status === "ACTIVE" ? "success" : "neutral"}
                size="sm"
              >
                {pat.status === "ACTIVE" ? "Activo" : "Inactivo"}
              </Badge>
            ),
          },
        ]}
        renderCard={(pat) => (
          <MobileCardItem
            avatar={<Avatar name={pat.fullName} size="sm" />}
            title={pat.fullName}
            subtitle={pat.email}
            badge={
              <Badge
                variant={pat.status === "ACTIVE" ? "success" : "neutral"}
                size="sm"
              >
                {pat.status === "ACTIVE" ? "Activo" : "Inactivo"}
              </Badge>
            }
            fields={[
              { label: "Teléfono", value: pat.phone, mono: true },
              { label: "Documento", value: pat.document },
              { label: "Nacimiento", value: pat.birthDate, mono: true },
            ]}
          />
        )}
        footer={`Total: ${mockPatients.length} pacientes`}
      />
    </div>
  ),
};

/**
 * 3. Composición por Slots personalizados (desktop / mobile)
 */
export const CustomSlotsTable: Story = {
  render: () => (
    <div className="p-4 max-w-5xl mx-auto">
      <ResponsiveTable
        desktop={
          <div className="rounded-xl border border-[var(--border)] p-6 bg-[var(--surface)]">
            <h4 className="font-display font-semibold mb-2">Tabla de Escritorio Personalizada</h4>
            <p className="text-sm text-[var(--muted)]">
              Visible en pantallas amplias (&gt;= 768px). Se puede renderizar cualquier JSX estructurado.
            </p>
          </div>
        }
        mobile={
          <div className="grid gap-2">
            <MobileCardItem
              title="Tarjeta personalizada móvil 1"
              subtitle="Visible únicamente en vista móvil (< 768px)"
              badge={<Badge variant="primary">Móvil</Badge>}
            />
            <MobileCardItem
              title="Tarjeta personalizada móvil 2"
              subtitle="Evita desbordes horizontales"
              badge={<Badge variant="primary">Móvil</Badge>}
            />
          </div>
        }
      />
    </div>
  ),
};
