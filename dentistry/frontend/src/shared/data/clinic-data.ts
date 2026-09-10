// ── Tipos ──────────────────────────────────────────────────────────
export type AppointmentStatus = "programada" | "completada" | "cancelada" | "en_curso";
export type PaymentMethod = "efectivo" | "tarjeta" | "transferencia" | "otro";
export type PaymentStatus = "pagado" | "pendiente" | "parcial";

export interface Patient {
  id: string;
  name: string;
  dob: string;
  phone: string;
  email: string;
  address: string;
  bloodType: string;
  allergies: string[];
  notes: string;
  createdAt: string;
  lastVisit: string;
}

export interface Service {
  id: string;
  name: string;
  durationMin: number;
  price: number;
  category: string;
  description: string;
  active: boolean;
}

export interface Professional {
  id: string;
  name: string;
  specialty: string;
  color: string;
}

export interface Appointment {
  id: string;
  patientId: string;
  professionalId: string;
  serviceId: string;
  date: string;
  startTime: string;
  endTime: string;
  status: AppointmentStatus;
  notes: string;
}

export interface Payment {
  id: string;
  patientId: string;
  serviceId?: string;
  appointmentId?: string;
  amount: number;
  date: string;
  method: PaymentMethod;
  status: PaymentStatus;
  concept: string;
}

// ── Profesionales ──────────────────────────────────────────────────
export const professionals: Professional[] = [
  { id: "pro-1", name: "Dra. Sofía Herrera", specialty: "Odontología general", color: "#3d7a46" },
  { id: "pro-2", name: "Dr. Martín Salcedo", specialty: "Ortodoncia", color: "#9a744f" },
  { id: "pro-3", name: "Lic. Claudia Núñez", specialty: "Higiene dental", color: "#c5a46d" },
];

// ── Servicios/Tratamientos ─────────────────────────────────────────
export const services: Service[] = [
  { id: "svc-1", name: "Consulta inicial", durationMin: 60, price: 80, category: "Consultas", description: "Evaluación y diagnóstico inicial del paciente.", active: true },
  { id: "svc-2", name: "Control periódico", durationMin: 30, price: 50, category: "Consultas", description: "Revisión y control de salud dental.", active: true },
  { id: "svc-3", name: "Limpieza dental", durationMin: 45, price: 65, category: "Prevención", description: "Limpieza profunda y profilaxis dental.", active: true },
  { id: "svc-4", name: "Aplicación de fluor", durationMin: 30, price: 35, category: "Prevención", description: "Aplicación tópica de fluor para prevención de caries.", active: true },
  { id: "svc-5", name: "Resolución de caries", durationMin: 60, price: 120, category: "Restauración", description: "Tratamiento y restauración de caries dental.", active: true },
  { id: "svc-6", name: "Extracción dental", durationMin: 45, price: 150, category: "Cirugía", description: "Extracción de pieza dental.", active: true },
  { id: "svc-7", name: "Blanqueamiento dental", durationMin: 90, price: 200, category: "Estética", description: "Blanqueamiento profesional para aclarar el esmalte.", active: true },
  { id: "svc-8", name: "Radiografía panorámica", durationMin: 15, price: 40, category: "Diagnóstico", description: "Radiografía panorámica para evaluación completa.", active: true },
];

// ── Pacientes ──────────────────────────────────────────────────────
export const patients: Patient[] = [
  {
    id: "pac-1", name: "Ana Cristina Vidal Torres", dob: "1988-03-15", phone: "+51 987 654 321",
    email: "a.vidal@gmail.com", address: "Av. Los Álamos 234, Miraflores", bloodType: "O+",
    allergies: ["Ibuprofeno", "Penicilina"], notes: "Paciente con sensibilidad dental crónica. Evitar procedimientos de alto impacto.",
    createdAt: "2024-02-10", lastVisit: "2026-08-18",
  },
  {
    id: "pac-2", name: "Roberto Alonso Mendoza", dob: "1975-07-22", phone: "+51 912 345 678",
    email: "r.mendoza@hotmail.com", address: "Jr. Bolognesi 890, Barranco", bloodType: "A+",
    allergies: [], notes: "Diabético tipo 2. Control de salud bucal estricto. Coordinado con endocrinólogo.",
    createdAt: "2024-04-05", lastVisit: "2026-08-20",
  },
  {
    id: "pac-3", name: "Valeria Stephanie Ramos", dob: "1995-11-08", phone: "+51 956 789 012",
    email: "v.ramos.s@gmail.com", address: "Calle Las Flores 45, San Isidro", bloodType: "B-",
    allergies: ["Látex"], notes: "Bruxismo. Tratamiento con férula de descarga nocturna.",
    createdAt: "2024-06-20", lastVisit: "2026-08-15",
  },
  {
    id: "pac-4", name: "Carlos Eduardo Quispe", dob: "1982-04-30", phone: "+51 934 567 890",
    email: "c.quispe@empresa.pe", address: "Av. Universitaria 1200, San Martín de Porres", bloodType: "AB+",
    allergies: ["Aspirina"], notes: "Ortodoncia en curso. Control mensual para ajuste de brackets.",
    createdAt: "2025-01-15", lastVisit: "2026-08-19",
  },
  {
    id: "pac-5", name: "Luciana Beatriz Paredes", dob: "2001-09-14", phone: "+51 978 234 567",
    email: "lu.paredes01@gmail.com", address: "Calle Tarapacá 78, Surco", bloodType: "O-",
    allergies: [], notes: "Control trimestral de limpieza. Sin restricciones.",
    createdAt: "2025-03-08", lastVisit: "2026-08-12",
  },
  {
    id: "pac-6", name: "Diego Armando Fuentes", dob: "1969-12-01", phone: "+51 901 123 456",
    email: "d.fuentes.lima@gmail.com", address: "Av. Salaverry 3400, Jesús María", bloodType: "A-",
    allergies: ["Sulfonamidas"], notes: "Prótesis dental. Seguimiento post-instalación.",
    createdAt: "2025-05-22", lastVisit: "2026-08-17",
  },
  {
    id: "pac-7", name: "Mariana José Contreras", dob: "1990-06-19", phone: "+51 943 876 543",
    email: "mj.contreras@outlook.com", address: "Calle Monte Sión 112, La Molina", bloodType: "B+",
    allergies: [], notes: "Blanqueamiento dental en curso. Sesión 2 de 3.",
    createdAt: "2025-07-01", lastVisit: "2026-08-13",
  },
];

// ── Citas (incluyendo hoy) ─────────────────────────────────────────
const TODAY = "2026-08-26";

export const appointments: Appointment[] = [
  { id: "cit-1", patientId: "pac-1", professionalId: "pro-1", serviceId: "svc-3", date: TODAY, startTime: "08:00", endTime: "08:45", status: "completada", notes: "Limpieza profunda. Buena respuesta del paciente." },
  { id: "cit-2", patientId: "pac-4", professionalId: "pro-2", serviceId: "svc-2", date: TODAY, startTime: "09:00", endTime: "09:30", status: "en_curso", notes: "Ajuste de brackets. Sesión 4 de ortodoncia." },
  { id: "cit-3", patientId: "pac-2", professionalId: "pro-1", serviceId: "svc-2", date: TODAY, startTime: "10:00", endTime: "10:30", status: "programada", notes: "Control periódico diabético-odontológico." },
  { id: "cit-4", patientId: "pac-3", professionalId: "pro-3", serviceId: "svc-3", date: TODAY, startTime: "11:00", endTime: "11:45", status: "programada", notes: "Limpieza y revisión de férula de descarga." },
  { id: "cit-5", patientId: "pac-6", professionalId: "pro-1", serviceId: "svc-2", date: TODAY, startTime: "12:00", endTime: "12:30", status: "programada", notes: "Revisión de prótesis dental." },
  { id: "cit-6", patientId: "pac-5", professionalId: "pro-3", serviceId: "svc-3", date: TODAY, startTime: "15:00", endTime: "15:45", status: "programada", notes: "Control trimestral de limpieza." },
  { id: "cit-7", patientId: "pac-7", professionalId: "pro-1", serviceId: "svc-7", date: TODAY, startTime: "16:00", endTime: "17:30", status: "programada", notes: "Sesión 2 de blanqueamiento." },
  { id: "cit-8", patientId: "pac-1", professionalId: "pro-2", serviceId: "svc-8", date: TODAY, startTime: "17:30", endTime: "17:45", status: "cancelada", notes: "Canceló por motivos laborales." },
];

// ── Pagos ──────────────────────────────────────────────────────────
export const payments: Payment[] = [
  { id: "pag-1", patientId: "pac-1", serviceId: "svc-3", appointmentId: "cit-1", amount: 65, date: "2026-08-18", method: "efectivo", status: "pagado", concept: "Limpieza dental" },
  { id: "pag-2", patientId: "pac-2", serviceId: "svc-2", amount: 50, date: "2026-08-20", method: "transferencia", status: "pagado", concept: "Control periódico" },
  { id: "pag-3", patientId: "pac-3", serviceId: "svc-6", appointmentId: "cit-3", amount: 150, date: "2026-08-15", method: "tarjeta", status: "pagado", concept: "Extracción dental" },
  { id: "pag-4", patientId: "pac-4", serviceId: "svc-2", amount: 50, date: "2026-08-19", method: "efectivo", status: "pagado", concept: "Control ortodóntico" },
  { id: "pag-5", patientId: "pac-5", serviceId: "svc-3", amount: 65, date: "2026-08-12", method: "tarjeta", status: "pagado", concept: "Limpieza dental" },
  { id: "pag-6", patientId: "pac-6", serviceId: "svc-2", amount: 50, date: "2026-08-17", method: "efectivo", status: "pagado", concept: "Revisión de prótesis" },
  { id: "pag-7", patientId: "pac-7", serviceId: "svc-7", amount: 200, date: "2026-08-13", method: "tarjeta", status: "pagado", concept: "Blanqueamiento sesión 1" },
];

// ── Helper functions ──────────────────────────────────────────────
export const TODAY_DATE = TODAY;

export const statusColors: Record<AppointmentStatus, string> = {
  programada:  "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300",
  completada:  "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300",
  cancelada:   "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300",
  en_curso:    "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300",
};

export const statusLabels: Record<AppointmentStatus, string> = {
  programada: "Programada",
  completada: "Completada",
  cancelada:  "Cancelada",
  en_curso:   "En curso",
};

export const paymentMethodLabels: Record<PaymentMethod, string> = {
  efectivo:      "Efectivo",
  tarjeta:       "Tarjeta",
  transferencia: "Transferencia",
  otro:          "Otro",
};

export function calcAge(dob: string) {
  const today = new Date();
  const birth = new Date(dob);
  let age = today.getFullYear() - birth.getFullYear();
  if (today.getMonth() < birth.getMonth() || (today.getMonth() === birth.getMonth() && today.getDate() < birth.getDate())) age--;
  return age;
}

export function formatCurrency(amount: number) {
  return `S/ ${amount.toFixed(2)}`;
}

export function getPatientById(id: string) {
  return patients.find((p) => p.id === id);
}

export function getServiceById(id: string) {
  return services.find((s) => s.id === id);
}

export function getProfessionalById(id: string) {
  return professionals.find((p) => p.id === id);
}
