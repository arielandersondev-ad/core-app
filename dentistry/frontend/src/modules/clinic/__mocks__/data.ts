export type AppointmentStatus =
  | "programada"
  | "confirmada"
  | "en_sala"
  | "en_curso"
  | "completada"
  | "no_asistio"
  | "cancelada";

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
  { id: "pro-1", name: "Dr. Andrés Morales", specialty: "Odontología Integral y Estética", color: "#10b981" },
  { id: "pro-2", name: "Dra. Valeria Quiroga", specialty: "Endodoncia y Cirugía Oral", color: "#6366f1" },
  { id: "pro-3", name: "Dr. Carlos Banegas", specialty: "Ortodoncia y Oclusión", color: "#f59e0b" },
];

// ── Servicios/Tratamientos Odontológicos ───────────────────────────
export const services: Service[] = [
  { id: "svc-1", name: "Limpieza y Profilaxis Ultrasónica", durationMin: 45, price: 150, category: "Preventiva", description: "Destartraje supragingival, pulido coronario y fluoración tópica.", active: true },
  { id: "svc-2", name: "Resina Estética Fotocurable", durationMin: 45, price: 180, category: "Operatoria", description: "Restauración directa con resina nanohíbrida y grabado ácido.", active: true },
  { id: "svc-3", name: "Endodoncia Unirradicular", durationMin: 60, price: 450, category: "Endodoncia", description: "Tratamiento de conducto con instrumentación rotatoria y obturación 3D.", active: true },
  { id: "svc-4", name: "Extracción Dental Simple", durationMin: 35, price: 130, category: "Cirugía", description: "Exodoncia con anestesia local y sutura reabsorbible si aplica.", active: true },
  { id: "svc-5", name: "Blanqueamiento Dental LED", durationMin: 60, price: 600, category: "Estética", description: "Aclaramiento dental en consultorio con peróxido de hidrógeno activado por luz.", active: true },
  { id: "svc-6", name: "Control y Ajuste de Ortodoncia", durationMin: 30, price: 160, category: "Ortodoncia", description: "Cambio de arcos, ligaduras elásticas y control de fuerza biomecánica.", active: true },
  { id: "svc-7", name: "Evaluación y Diagnóstico Inicial", durationMin: 30, price: 80, category: "Diagnóstico", description: "Examen clínico intraoral, odontograma digital y plan de tratamiento.", active: true },
  { id: "svc-8", name: "Urgencia / Alivio de Dolor Agudo", durationMin: 30, price: 120, category: "Urgencia", description: "Apertura cameral de urgencia, medicación intraconducto y analgésicos.", active: true },
];

// ── Pacientes con Teléfonos Bolivia (+591) ─────────────────────────
export const patients: Patient[] = [
  {
    id: "pac-1", name: "Ana Cristina Vidal Torres", dob: "1988-03-15", phone: "+591 71234567",
    email: "a.vidal@gmail.com", address: "Av. Las Américas 450, Santa Cruz", bloodType: "O+",
    allergies: ["Penicilina", "Ibuprofeno"], notes: "Hipersensibilidad dentinaria en sector anterosuperior. Alérgica estricta a Penicilina.",
    createdAt: "2024-02-10", lastVisit: "2026-08-18",
  },
  {
    id: "pac-2", name: "Roberto Alonso Mendoza", dob: "1975-07-22", phone: "+591 79876543",
    email: "r.mendoza@hotmail.com", address: "Calle Murillo 890, La Paz", bloodType: "A+",
    allergies: [], notes: "Paciente diabético controlado. Requiere profilaxis antibiótica previa si hay cirugía.",
    createdAt: "2024-04-05", lastVisit: "2026-08-20",
  },
  {
    id: "pac-3", name: "Valeria Stephanie Ramos", dob: "1995-11-08", phone: "+591 60123456",
    email: "v.ramos.s@gmail.com", address: "Av. Ballivián 122, Cochabamba", bloodType: "B-",
    allergies: ["Látex"], notes: "Tratamiento de ortodoncia en curso (Brackets estéticos). Usar siempre guantes libres de látex.",
    createdAt: "2024-06-20", lastVisit: "2026-08-15",
  },
  {
    id: "pac-4", name: "Carlos Eduardo Quispe", dob: "1982-04-30", phone: "+591 77234890",
    email: "c.quispe@empresa.bo", address: "Calle Sucre 340, Santa Cruz", bloodType: "AB+",
    allergies: ["Aspirina"], notes: "Bruxismo severo nocturno. Requiere placa miorrelajante y resinas en premolares.",
    createdAt: "2025-01-15", lastVisit: "2026-08-19",
  },
  {
    id: "pac-5", name: "Luciana Beatriz Paredes", dob: "2001-09-14", phone: "+591 75612345",
    email: "lu.paredes01@gmail.com", address: "Av. Cristo Redentor 3er Anillo", bloodType: "O-",
    allergies: [], notes: "Sensibilidad post-blanqueamiento. Aplicar flúor neutro al finalizar.",
    createdAt: "2025-03-08", lastVisit: "2026-08-12",
  },
  {
    id: "pac-6", name: "Diego Armando Fuentes", dob: "1969-12-01", phone: "+591 68901234",
    email: "d.fuentes@gmail.com", address: "Calle Potosí 110, Tarija", bloodType: "A-",
    allergies: ["Sulfonamidas"], notes: "Hipertensión arterial controlada. Monitorear presión antes de anestésico con vasoconstrictor.",
    createdAt: "2025-05-22", lastVisit: "2026-08-17",
  },
  {
    id: "pac-7", name: "Mariana José Contreras", dob: "1990-06-19", phone: "+591 73456789",
    email: "mj.contreras@outlook.com", address: "Av. San Martín, Equipetrol", bloodType: "B+",
    allergies: [], notes: "Paciente regular. Plan de profilaxis periódica cada 6 meses.",
    createdAt: "2025-07-01", lastVisit: "2026-08-13",
  },
];

// ── Citas (incluyendo hoy) ─────────────────────────────────────────
const TODAY = "2026-08-25";

export const appointments: Appointment[] = [
  { id: "cit-1", patientId: "pac-1", professionalId: "pro-1", serviceId: "svc-1", date: TODAY, startTime: "08:00", endTime: "08:45", status: "completada", notes: "Profilaxis y destartraje completado sin novedades. Encías saludables." },
  { id: "cit-2", patientId: "pac-4", professionalId: "pro-1", serviceId: "svc-2", date: TODAY, startTime: "09:00", endTime: "09:45", status: "en_curso", notes: "Restauración pieza 1.6 cara oclusomesial." },
  { id: "cit-3", patientId: "pac-2", professionalId: "pro-2", serviceId: "svc-3", date: TODAY, startTime: "10:00", endTime: "11:00", status: "en_sala", notes: "Endodoncia segunda sesión pieza 2.1. Paciente ya está en sala de espera." },
  { id: "cit-4", patientId: "pac-3", professionalId: "pro-3", serviceId: "svc-6", date: TODAY, startTime: "11:15", endTime: "11:45", status: "confirmada", notes: "Control mensual de ortodoncia. Confirmó por WhatsApp." },
  { id: "cit-5", patientId: "pac-6", professionalId: "pro-1", serviceId: "svc-7", date: TODAY, startTime: "12:00", endTime: "12:30", status: "programada", notes: "Primera consulta y presupuesto integral." },
  { id: "cit-6", patientId: "pac-5", professionalId: "pro-1", serviceId: "svc-5", date: TODAY, startTime: "15:00", endTime: "16:00", status: "programada", notes: "Sesión 1 de blanqueamiento dental LED." },
  { id: "cit-7", patientId: "pac-7", professionalId: "pro-1", serviceId: "svc-4", date: TODAY, startTime: "16:30", endTime: "17:05", status: "no_asistio", notes: "No contestó WhatsApp ni llamadas de confirmación." },
  { id: "cit-8", patientId: "pac-1", professionalId: "pro-2", serviceId: "svc-8", date: TODAY, startTime: "17:30", endTime: "18:00", status: "cancelada", notes: "Canceló con anticipación por viaje." },
  // Ayer
  { id: "cit-9", patientId: "pac-2", professionalId: "pro-1", serviceId: "svc-1", date: "2026-08-24", startTime: "09:00", endTime: "09:45", status: "completada", notes: "Limpieza rutinaria" },
  { id: "cit-10", patientId: "pac-3", professionalId: "pro-3", serviceId: "svc-6", date: "2026-08-24", startTime: "11:00", endTime: "11:30", status: "completada", notes: "Ajuste de brackets" },
  // Mañana
  { id: "cit-11", patientId: "pac-4", professionalId: "pro-1", serviceId: "svc-2", date: "2026-08-26", startTime: "09:00", endTime: "09:45", status: "confirmada", notes: "Resina pieza 2.4" },
  { id: "cit-12", patientId: "pac-1", professionalId: "pro-1", serviceId: "svc-7", date: "2026-08-26", startTime: "10:30", endTime: "11:00", status: "programada", notes: "Evaluación de encías" },
];

// ── Historial clínico ──────────────────────────────────────────────
export const clinicalEntries: ClinicalEntry[] = [
  { id: "hc-1", patientId: "pac-1", date: "2026-08-18", professionalId: "pro-1", appointmentId: "cit-1", title: "Profilaxis y Limpieza Completa", notes: "Destartraje supragingival con ultrasonido. Sin sangrado patológico. Se recomienda uso diario de hilo dental.", tags: ["profilaxis", "periodoncia", "higiene"] },
  { id: "hc-2", patientId: "pac-1", date: "2026-07-30", professionalId: "pro-1", title: "Evaluación de sensibilidad", notes: "Piezas 1.1 y 2.1 con sensibilidad al frío. Se aplicó barniz con flúor.", tags: ["sensibilidad", "flúor"] },
  { id: "hc-3", patientId: "pac-2", date: "2026-08-20", professionalId: "pro-2", title: "Conductometría y biomecánica pieza 2.1", notes: "Conductometría electrónica 21mm. Irrigación profusa con hipoclorito al 2.5%. Medicación con hidróxido de calcio.", tags: ["endodoncia", "conductometria"] },
  { id: "hc-4", patientId: "pac-3", date: "2026-08-15", professionalId: "pro-3", title: "Cambio de arcos Niti 0.16", notes: "Buena alineación en arco inferior. Se coloca arco NiTi 0.16 en superior y ligaduras elásticas plateadas.", tags: ["ortodoncia", "brackets"] },
  { id: "hc-5", patientId: "pac-4", date: "2026-08-19", professionalId: "pro-1", title: "Toma de impresión para placa miorelajante", notes: "Impresión con alginato de alta precisión para confección de guarda oclusal para bruxismo.", tags: ["bruxismo", "oclusion"] },
];

// ── Sesiones realizadas ────────────────────────────────────────────
export const sessions: Session[] = [
  { id: "ses-1", patientId: "pac-1", serviceId: "svc-1", professionalId: "pro-1", appointmentId: "cit-1", date: "2026-08-18", sessionNumber: 1, notes: "Profilaxis concluida" },
  { id: "ses-2", patientId: "pac-2", serviceId: "svc-3", professionalId: "pro-2", appointmentId: "cit-3", date: "2026-08-20", sessionNumber: 1, notes: "Apertura y conductometría" },
  { id: "ses-3", patientId: "pac-3", serviceId: "svc-6", professionalId: "pro-3", appointmentId: "cit-4", date: "2026-08-15", sessionNumber: 5, notes: "Control ortodoncia" },
  { id: "ses-4", patientId: "pac-4", serviceId: "svc-2", professionalId: "pro-1", appointmentId: "cit-2", date: "2026-08-19", sessionNumber: 1, notes: "Resina oclusal" },
];

// ── Pagos ──────────────────────────────────────────────────────────
export const payments: Payment[] = [
  { id: "pag-1", patientId: "pac-1", serviceId: "svc-1", amount: 150, date: "2026-08-18", method: "efectivo", status: "pagado", concept: "Limpieza y profilaxis ultrasónica" },
  { id: "pag-2", patientId: "pac-2", serviceId: "svc-3", amount: 250, date: "2026-08-20", method: "transferencia", status: "parcial", concept: "Endodoncia pieza 2.1 — Adelanto sesión 1" },
  { id: "pag-3", patientId: "pac-3", serviceId: "svc-6", amount: 160, date: "2026-08-15", method: "tarjeta", status: "pagado", concept: "Control mensual de ortodoncia" },
  { id: "pag-4", patientId: "pac-4", serviceId: "svc-2", amount: 180, date: "2026-08-19", method: "efectivo", status: "pagado", concept: "Resina compuesta estética" },
  { id: "pag-5", patientId: "pac-5", serviceId: "svc-5", amount: 300, date: "2026-08-12", method: "transferencia", status: "parcial", concept: "Blanqueamiento LED — Cuota 1" },
  { id: "pag-6", patientId: "pac-6", serviceId: "svc-7", amount: 80, date: "2026-08-10", method: "efectivo", status: "pagado", concept: "Evaluación y diagnóstico" },
  { id: "pag-7", patientId: "pac-7", serviceId: "svc-4", amount: 130, date: "2026-08-13", method: "efectivo", status: "pagado", concept: "Extracción dental simple" },
  { id: "pag-8", patientId: "pac-2", amount: 200, date: TODAY, method: "efectivo", status: "pendiente", concept: "Endodoncia pieza 2.1 — Saldo final" },
];

// ── Inventario Odontológico ─────────────────────────────────────────
export const inventory: InventoryItem[] = [
  { id: "inv-1", name: "Anestesia Lidocaína 2% con Epinefrina (caja)", category: "Anestésicos", unit: "cajas", stock: 6, minStock: 3, lastRefill: "2026-08-10" },
  { id: "inv-2", name: "Guantes de nitrilo (caja 100)", category: "Bioseguridad", unit: "cajas", stock: 12, minStock: 4, lastRefill: "2026-08-01" },
  { id: "inv-3", name: "Resina Nanohíbrida A2 (jeringa)", category: "Restauración", unit: "jeringas", stock: 2, minStock: 4, lastRefill: "2026-07-20" },
  { id: "inv-4", name: "Baberos odontológicos desechables", category: "Bioseguridad", unit: "paquetes", stock: 8, minStock: 3, lastRefill: "2026-08-10" },
  { id: "inv-5", name: "Limas rotatorias Protaper Gold (set)", category: "Endodoncia", unit: "sets", stock: 4, minStock: 3, lastRefill: "2026-06-30" },
  { id: "inv-6", name: "Pasta profiláctica con flúor", category: "Preventiva", unit: "tubos", stock: 3, minStock: 2, lastRefill: "2026-07-01" },
  { id: "inv-7", name: "Eyectores de saliva desechables", category: "Insumos", unit: "paquetes", stock: 5, minStock: 3, lastRefill: "2026-08-05" },
  { id: "inv-8", name: "Gel grabador ácido fosfórico 37%", category: "Restauración", unit: "jeringas", stock: 1, minStock: 2, lastRefill: "2026-08-12" },
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
  return `Bs. ${amount.toFixed(2)}`;
}

export const TODAY_DATE = TODAY;

export const statusColors: Record<AppointmentStatus, string> = {
  programada: "bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300 border-blue-200 dark:border-blue-800",
  confirmada: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800",
  en_sala:    "bg-purple-100 text-purple-800 dark:bg-purple-900/40 dark:text-purple-300 border-purple-200 dark:border-purple-800",
  en_curso:   "bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300 border-amber-200 dark:border-amber-800",
  completada: "bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300 border-zinc-200 dark:border-zinc-700",
  no_asistio: "bg-orange-100 text-orange-800 dark:bg-orange-900/40 dark:text-orange-300 border-orange-200 dark:border-orange-800",
  cancelada:  "bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300 border-red-200 dark:border-red-800",
};

export const statusLabels: Record<AppointmentStatus, string> = {
  programada: "Programada",
  confirmada: "Confirmada",
  en_sala:    "En sala de espera",
  en_curso:   "En sillón",
  completada: "Completada",
  no_asistio: "No asistió",
  cancelada:  "Cancelada",
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
