export type AppointmentStatus = "programada" | "completada" | "cancelada" | "en_curso";
export type PaymentMethod = "efectivo" | "tarjeta" | "transferencia" | "otro";
export type PaymentStatus = "pagado" | "pendiente" | "parcial";
export type InventoryStatus = "ok" | "bajo" | "critico";

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

export interface ClinicalEntry {
  id: string;
  patientId: string;
  date: string;
  professionalId: string;
  appointmentId?: string;
  title: string;
  notes: string;
  tags: string[];
}

export interface Session {
  id: string;
  patientId: string;
  serviceId: string;
  professionalId: string;
  appointmentId?: string;
  date: string;
  sessionNumber: number;
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
  notes?: string;
}

export interface InventoryItem {
  id: string;
  name: string;
  category: string;
  unit: string;
  stock: number;
  minStock: number;
  lastRefill: string;
}

// ── Profesionales ──────────────────────────────────────────────────
export const professionals: Professional[] = [
  { id: "pro-1", name: "Dra. Sofía Herrera", specialty: "Terapia física", color: "#3d7a46" },
  { id: "pro-2", name: "Dr. Martín Salcedo", specialty: "Nutrición clínica", color: "#9a744f" },
  { id: "pro-3", name: "Lic. Claudia Núñez", specialty: "Psicología", color: "#c5a46d" },
];

// ── Servicios/Tratamientos ─────────────────────────────────────────
export const services: Service[] = [
  { id: "svc-1", name: "Consulta inicial", durationMin: 60, price: 80, category: "Consultas", description: "Evaluación y diagnóstico inicial del paciente.", active: true },
  { id: "svc-2", name: "Consulta de seguimiento", durationMin: 30, price: 50, category: "Consultas", description: "Control periódico y revisión del plan de tratamiento.", active: true },
  { id: "svc-3", name: "Sesión de terapia física", durationMin: 45, price: 65, category: "Terapia física", description: "Sesión individual de rehabilitación y ejercicio terapéutico.", active: true },
  { id: "svc-4", name: "Masaje terapéutico", durationMin: 60, price: 75, category: "Terapia física", description: "Masaje de tejido profundo y relajación muscular.", active: true },
  { id: "svc-5", name: "Plan nutricional personalizado", durationMin: 90, price: 120, category: "Nutrición", description: "Diseño de plan alimentario basado en objetivos del paciente.", active: true },
  { id: "svc-6", name: "Sesión de psicología", durationMin: 50, price: 90, category: "Psicología", description: "Sesión terapéutica individual de salud mental.", active: true },
  { id: "svc-7", name: "Evaluación postural", durationMin: 45, price: 60, category: "Terapia física", description: "Análisis biomecánico y postural completo.", active: true },
  { id: "svc-8", name: "Ultrasonido terapéutico", durationMin: 30, price: 45, category: "Terapia física", description: "Aplicación de ultrasonido para inflamación y dolor.", active: false },
];

// ── Pacientes ──────────────────────────────────────────────────────
export const patients: Patient[] = [
  {
    id: "pac-1", name: "Ana Cristina Vidal Torres", dob: "1988-03-15", phone: "+51 987 654 321",
    email: "a.vidal@gmail.com", address: "Av. Los Álamos 234, Miraflores", bloodType: "O+",
    allergies: ["Ibuprofeno", "Penicilina"], notes: "Paciente con lumbalgia crónica. Evitar ejercicios de alto impacto.",
    createdAt: "2024-02-10", lastVisit: "2026-08-18",
  },
  {
    id: "pac-2", name: "Roberto Alonso Mendoza", dob: "1975-07-22", phone: "+51 912 345 678",
    email: "r.mendoza@hotmail.com", address: "Jr. Bolognesi 890, Barranco", bloodType: "A+",
    allergies: [], notes: "Diabético tipo 2. Control de dieta estricto. Coordinado con endocrinólogo.",
    createdAt: "2024-04-05", lastVisit: "2026-08-20",
  },
  {
    id: "pac-3", name: "Valeria Stephanie Ramos", dob: "1995-11-08", phone: "+51 956 789 012",
    email: "v.ramos.s@gmail.com", address: "Calle Las Flores 45, San Isidro", bloodType: "B-",
    allergies: ["Látex"], notes: "Ansiedad generalizada. Proceso en curso con terapia cognitivo-conductual.",
    createdAt: "2024-06-20", lastVisit: "2026-08-15",
  },
  {
    id: "pac-4", name: "Carlos Eduardo Quispe", dob: "1982-04-30", phone: "+51 934 567 890",
    email: "c.quispe@empresa.pe", address: "Av. Universitaria 1200, San Martín de Porres", bloodType: "AB+",
    allergies: ["Aspirina"], notes: "Lesión de hombro derecho. Post-operatorio. Protocolo de rehabilitación activa.",
    createdAt: "2025-01-15", lastVisit: "2026-08-19",
  },
  {
    id: "pac-5", name: "Luciana Beatriz Paredes", dob: "2001-09-14", phone: "+51 978 234 567",
    email: "lu.paredes01@gmail.com", address: "Calle Tarapacá 78, Surco", bloodType: "O-",
    allergies: [], notes: "Escoliosis leve. Control trimestral. Sin restricciones de actividad.",
    createdAt: "2025-03-08", lastVisit: "2026-08-12",
  },
  {
    id: "pac-6", name: "Diego Armando Fuentes", dob: "1969-12-01", phone: "+51 901 123 456",
    email: "d.fuentes.lima@gmail.com", address: "Av. Salaverry 3400, Jesús María", bloodType: "A-",
    allergies: ["Sulfonamidas"], notes: "Sobrepeso. Objetivo: bajar 15 kg en 6 meses con plan combinado.",
    createdAt: "2025-05-22", lastVisit: "2026-08-17",
  },
  {
    id: "pac-7", name: "Mariana José Contreras", dob: "1990-06-19", phone: "+51 943 876 543",
    email: "mj.contreras@outlook.com", address: "Calle Monte Sión 112, La Molina", bloodType: "B+",
    allergies: [], notes: "Estrés laboral severo. Sesiones semanales. Progreso positivo.",
    createdAt: "2025-07-01", lastVisit: "2026-08-13",
  },
];

// ── Citas (incluyendo hoy) ─────────────────────────────────────────
const TODAY = "2026-08-25";

export const appointments: Appointment[] = [
  { id: "cit-1", patientId: "pac-1", professionalId: "pro-1", serviceId: "svc-3", date: TODAY, startTime: "08:00", endTime: "08:45", status: "completada", notes: "Ejercicios de movilidad lumbar. Buena respuesta." },
  { id: "cit-2", patientId: "pac-4", professionalId: "pro-1", serviceId: "svc-3", date: TODAY, startTime: "09:00", endTime: "09:45", status: "en_curso", notes: "Sesión 4 de rehabilitación de hombro." },
  { id: "cit-3", patientId: "pac-2", professionalId: "pro-2", serviceId: "svc-2", date: TODAY, startTime: "10:00", endTime: "10:30", status: "programada", notes: "Control mensual nutrición." },
  { id: "cit-4", patientId: "pac-3", professionalId: "pro-3", serviceId: "svc-6", date: TODAY, startTime: "11:00", endTime: "11:50", status: "programada", notes: "Sesión 8 TCC." },
  { id: "cit-5", patientId: "pac-6", professionalId: "pro-2", serviceId: "svc-5", date: TODAY, startTime: "12:00", endTime: "13:30", status: "programada", notes: "Revisión plan nutricional mes 2." },
  { id: "cit-6", patientId: "pac-5", professionalId: "pro-1", serviceId: "svc-7", date: TODAY, startTime: "15:00", endTime: "15:45", status: "programada", notes: "Evaluación postural trimestral." },
  { id: "cit-7", patientId: "pac-7", professionalId: "pro-3", serviceId: "svc-6", date: TODAY, startTime: "16:00", endTime: "16:50", status: "programada", notes: "Sesión semanal." },
  { id: "cit-8", patientId: "pac-1", professionalId: "pro-1", serviceId: "svc-4", date: TODAY, startTime: "17:00", endTime: "18:00", status: "cancelada", notes: "Canceló por motivos laborales." },
  // Yesterday
  { id: "cit-9", patientId: "pac-2", professionalId: "pro-2", serviceId: "svc-2", date: "2026-08-24", startTime: "09:00", endTime: "09:30", status: "completada", notes: "" },
  { id: "cit-10", patientId: "pac-3", professionalId: "pro-3", serviceId: "svc-6", date: "2026-08-24", startTime: "11:00", endTime: "11:50", status: "completada", notes: "" },
  // Tomorrow
  { id: "cit-11", patientId: "pac-4", professionalId: "pro-1", serviceId: "svc-3", date: "2026-08-26", startTime: "08:00", endTime: "08:45", status: "programada", notes: "" },
  { id: "cit-12", patientId: "pac-1", professionalId: "pro-1", serviceId: "svc-2", date: "2026-08-26", startTime: "10:00", endTime: "10:30", status: "programada", notes: "" },
];

// ── Historial clínico ──────────────────────────────────────────────
export const clinicalEntries: ClinicalEntry[] = [
  { id: "hc-1", patientId: "pac-1", date: "2026-08-18", professionalId: "pro-1", appointmentId: "cit-1", title: "Sesión terapia física — lumbalgia", notes: "Se realizaron ejercicios de estiramiento de cadena posterior y fortalecimiento de core. Paciente tolera bien el ejercicio. Dolor EVA 3/10 al inicio, 1/10 al final.", tags: ["lumbalgia", "terapia física", "core"] },
  { id: "hc-2", patientId: "pac-1", date: "2026-07-30", professionalId: "pro-1", title: "Evaluación de progreso", notes: "Mejoría notable en rango de movimiento lumbar. Flexión anterior 70° (era 50°). Se ajusta protocolo.", tags: ["evaluación", "progreso"] },
  { id: "hc-3", patientId: "pac-2", date: "2026-08-20", professionalId: "pro-2", title: "Control nutricional mensual", notes: "Paciente reporta adherencia al plan 85%. Glicemia en ayuno 108 mg/dL (meta <110). Reducción de 2 kg desde inicio. Se mantiene plan.", tags: ["nutrición", "diabetes", "control"] },
  { id: "hc-4", patientId: "pac-3", date: "2026-08-15", professionalId: "pro-3", title: "Sesión TCC — Exposición gradual", notes: "Trabajo de exposición gradual a situaciones estresoras laborales. Paciente identifica pensamientos automáticos con mayor facilidad. Tarea: registro de pensamientos diario.", tags: ["TCC", "ansiedad", "exposición"] },
  { id: "hc-5", patientId: "pac-4", date: "2026-08-19", professionalId: "pro-1", title: "Rehabilitación hombro — Sesión 4", notes: "Arco de movimiento abducción 110° (meta 180°). Fuerza rotadores mejorada. Se agregan ejercicios de cadena cerrada. Sin dolor en reposo.", tags: ["rehabilitación", "hombro", "post-op"] },
];

// ── Sesiones realizadas ────────────────────────────────────────────
export const sessions: Session[] = [
  { id: "ses-1", patientId: "pac-1", serviceId: "svc-3", professionalId: "pro-1", appointmentId: "cit-1", date: "2026-08-18", sessionNumber: 6, notes: "Sesión 6 de 12 del plan de rehabilitación lumbar." },
  { id: "ses-2", patientId: "pac-4", serviceId: "svc-3", professionalId: "pro-1", date: "2026-08-19", sessionNumber: 4, notes: "Rehabilitación de hombro post-cirugía." },
  { id: "ses-3", patientId: "pac-3", serviceId: "svc-6", professionalId: "pro-3", date: "2026-08-15", sessionNumber: 8, notes: "Sesión 8 TCC para ansiedad generalizada." },
  { id: "ses-4", patientId: "pac-2", serviceId: "svc-2", professionalId: "pro-2", date: "2026-08-20", sessionNumber: 3, notes: "Control nutricional mensual." },
];

// ── Pagos ──────────────────────────────────────────────────────────
export const payments: Payment[] = [
  { id: "pag-1", patientId: "pac-1", serviceId: "svc-3", appointmentId: "cit-1", amount: 65, date: "2026-08-18", method: "efectivo", status: "pagado", concept: "Sesión terapia física #6" },
  { id: "pag-2", patientId: "pac-2", serviceId: "svc-2", amount: 50, date: "2026-08-20", method: "transferencia", status: "pagado", concept: "Consulta de seguimiento nutricional" },
  { id: "pag-3", patientId: "pac-3", serviceId: "svc-6", amount: 90, date: "2026-08-15", method: "tarjeta", status: "pagado", concept: "Sesión psicología #8" },
  { id: "pag-4", patientId: "pac-4", serviceId: "svc-3", amount: 65, date: "2026-08-19", method: "efectivo", status: "pagado", concept: "Rehabilitación hombro #4" },
  { id: "pag-5", patientId: "pac-5", serviceId: "svc-7", amount: 60, date: "2026-08-12", method: "tarjeta", status: "pagado", concept: "Evaluación postural" },
  { id: "pag-6", patientId: "pac-6", serviceId: "svc-5", amount: 120, date: "2026-08-10", method: "transferencia", status: "pagado", concept: "Plan nutricional mes 2" },
  { id: "pag-7", patientId: "pac-7", serviceId: "svc-6", amount: 90, date: "2026-08-13", method: "efectivo", status: "pagado", concept: "Sesión psicología semanal" },
  { id: "pag-8", patientId: "pac-1", serviceId: "svc-4", amount: 75, date: "2026-08-05", method: "tarjeta", status: "pagado", concept: "Masaje terapéutico" },
  { id: "pag-9", patientId: "pac-2", amount: 50, date: TODAY, method: "efectivo", status: "pendiente", concept: "Consulta de seguimiento — hoy" },
  { id: "pag-10", patientId: "pac-4", serviceId: "svc-3", amount: 65, date: "2026-07-29", method: "tarjeta", status: "pagado", concept: "Rehabilitación hombro #3" },
  { id: "pag-11", patientId: "pac-1", serviceId: "svc-3", amount: 65, date: "2026-07-22", method: "efectivo", status: "pagado", concept: "Sesión terapia física #5" },
  { id: "pag-12", patientId: "pac-3", serviceId: "svc-6", amount: 90, date: "2026-07-20", method: "transferencia", status: "pagado", concept: "Sesión psicología #7" },
];

// ── Inventario ─────────────────────────────────────────────────────
export const inventory: InventoryItem[] = [
  { id: "inv-1", name: "Gel de ultrasonido", category: "Insumos clínicos", unit: "unidades", stock: 4, minStock: 5, lastRefill: "2026-07-15" },
  { id: "inv-2", name: "Guantes de nitrilo (caja 100)", category: "Protección personal", unit: "cajas", stock: 12, minStock: 4, lastRefill: "2026-08-01" },
  { id: "inv-3", name: "Camilla papel (rollo)", category: "Insumos clínicos", unit: "rollos", stock: 2, minStock: 6, lastRefill: "2026-07-20" },
  { id: "inv-4", name: "Alcohol 70° (litro)", category: "Higiene", unit: "litros", stock: 8, minStock: 3, lastRefill: "2026-08-10" },
  { id: "inv-5", name: "Electrodos TENS/EMS (par)", category: "Equipamiento", unit: "pares", stock: 15, minStock: 10, lastRefill: "2026-06-30" },
  { id: "inv-6", name: "Vendas elásticas 10cm", category: "Insumos clínicos", unit: "unidades", stock: 1, minStock: 8, lastRefill: "2026-07-01" },
  { id: "inv-7", name: "Mascarillas quirúrgicas (caja)", category: "Protección personal", unit: "cajas", stock: 3, minStock: 2, lastRefill: "2026-08-05" },
  { id: "inv-8", name: "Crema de masaje (500ml)", category: "Insumos clínicos", unit: "unidades", stock: 5, minStock: 3, lastRefill: "2026-08-12" },
];

// ── Helpers ────────────────────────────────────────────────────────
export function getPatientById(id: string) { return patients.find((p) => p.id === id); }
export function getServiceById(id: string) { return services.find((s) => s.id === id); }
export function getProfessionalById(id: string) { return professionals.find((p) => p.id === id); }

export function getAppointmentsByDate(date: string) {
  return appointments
    .filter((a) => a.date === date)
    .sort((a, b) => a.startTime.localeCompare(b.startTime));
}

export function getAppointmentsByPatient(patientId: string) {
  return appointments.filter((a) => a.patientId === patientId)
    .sort((a, b) => b.date.localeCompare(a.date));
}

export function getPaymentsByPatient(patientId: string) {
  return payments.filter((p) => p.patientId === patientId)
    .sort((a, b) => b.date.localeCompare(a.date));
}

export function getClinicalByPatient(patientId: string) {
  return clinicalEntries.filter((e) => e.patientId === patientId)
    .sort((a, b) => b.date.localeCompare(a.date));
}

export function getSessionsByPatient(patientId: string) {
  return sessions.filter((s) => s.patientId === patientId)
    .sort((a, b) => b.date.localeCompare(a.date));
}

export function formatCurrency(amount: number) {
  return `S/ ${amount.toFixed(2)}`;
}

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

export function inventoryStatus(item: InventoryItem): InventoryStatus {
  if (item.stock === 0) return "critico";
  if (item.stock < item.minStock) return item.stock <= item.minStock * 0.3 ? "critico" : "bajo";
  return "ok";
}
