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
export type InventoryMovementType = "entrada" | "salida" | "ajuste";

/**
 * The clinic bills in bolivianos. Mirrors `Payment.currency` in the schema.
 */
export const CLINIC_CURRENCY = "BOB" as const;

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
  /** Minor units, mirroring `DentalService.basePriceMinor`. 15000 = Bs. 150.00 */
  basePriceMinor: number;
  currency: typeof CLINIC_CURRENCY;
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
  /** Minor units, mirroring `Payment.amountMinor`. 15000 = Bs. 150.00 */
  amountMinor: number;
  currency: typeof CLINIC_CURRENCY;
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
  /**
   * Denormalized: the date of the most recent `entrada` movement.
   *
   * `inventory_items` has no such column in the schema, so the API will have to
   * either (a) denormalize it here on write, or (b) compute it per row with a
   * lateral join over `inventory_movements`. See `lastRestockAt()`.
   */
  lastRefill: string;
}

export interface InventoryMovement {
  id: string;
  itemId: string;
  type: InventoryMovementType;
  quantity: number;
  date: string;
  reason: string;
  relatedTreatmentId?: string;
  professionalId?: string;
}

// ── Profesionales ──────────────────────────────────────────────────
export const professionals: Professional[] = [
  { id: "pro-1", name: "Dr. Andrés Morales", specialty: "Odontología Integral y Estética", color: "#10b981" },
  { id: "pro-2", name: "Dra. Valeria Quiroga", specialty: "Endodoncia y Cirugía Oral", color: "#6366f1" },
  { id: "pro-3", name: "Dr. Carlos Banegas", specialty: "Ortodoncia y Oclusión", color: "#f59e0b" },
];

// ── Servicios/Tratamientos Odontológicos ───────────────────────────
export const services: Service[] = [
  { id: "svc-1", name: "Limpieza y Profilaxis Ultrasónica", durationMin: 45, basePriceMinor: 15000, currency: CLINIC_CURRENCY, category: "Preventiva", description: "Destartraje supragingival, pulido coronario y fluoración tópica.", active: true },
  { id: "svc-2", name: "Resina Estética Fotocurable", durationMin: 45, basePriceMinor: 18000, currency: CLINIC_CURRENCY, category: "Operatoria", description: "Restauración directa con resina nanohíbrida y grabado ácido.", active: true },
  { id: "svc-3", name: "Endodoncia Unirradicular", durationMin: 60, basePriceMinor: 45000, currency: CLINIC_CURRENCY, category: "Endodoncia", description: "Tratamiento de conducto con instrumentación rotatoria y obturación 3D.", active: true },
  { id: "svc-4", name: "Extracción Dental Simple", durationMin: 35, basePriceMinor: 13000, currency: CLINIC_CURRENCY, category: "Cirugía", description: "Exodoncia con anestesia local y sutura reabsorbible si aplica.", active: true },
  { id: "svc-5", name: "Blanqueamiento Dental LED", durationMin: 60, basePriceMinor: 60000, currency: CLINIC_CURRENCY, category: "Estética", description: "Aclaramiento dental en consultorio con peróxido de hidrógeno activado por luz.", active: true },
  { id: "svc-6", name: "Control y Ajuste de Ortodoncia", durationMin: 30, basePriceMinor: 16000, currency: CLINIC_CURRENCY, category: "Ortodoncia", description: "Cambio de arcos, ligaduras elásticas y control de fuerza biomecánica.", active: true },
  { id: "svc-7", name: "Evaluación y Diagnóstico Inicial", durationMin: 30, basePriceMinor: 8000, currency: CLINIC_CURRENCY, category: "Diagnóstico", description: "Examen clínico intraoral, odontograma digital y plan de tratamiento.", active: true },
  { id: "svc-8", name: "Urgencia / Alivio de Dolor Agudo", durationMin: 30, basePriceMinor: 12000, currency: CLINIC_CURRENCY, category: "Urgencia", description: "Apertura cameral de urgencia, medicación intraconducto y analgésicos.", active: true },
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
  { id: "pag-1", patientId: "pac-1", serviceId: "svc-1", amountMinor: 15000, currency: CLINIC_CURRENCY, date: "2026-08-18", method: "efectivo", status: "pagado", concept: "Limpieza y profilaxis ultrasónica" },
  { id: "pag-2", patientId: "pac-2", serviceId: "svc-3", amountMinor: 25000, currency: CLINIC_CURRENCY, date: "2026-08-20", method: "transferencia", status: "parcial", concept: "Endodoncia pieza 2.1 — Adelanto sesión 1" },
  { id: "pag-3", patientId: "pac-3", serviceId: "svc-6", amountMinor: 16000, currency: CLINIC_CURRENCY, date: "2026-08-15", method: "tarjeta", status: "pagado", concept: "Control mensual de ortodoncia" },
  { id: "pag-4", patientId: "pac-4", serviceId: "svc-2", amountMinor: 18000, currency: CLINIC_CURRENCY, date: "2026-08-19", method: "efectivo", status: "pagado", concept: "Resina compuesta estética" },
  { id: "pag-5", patientId: "pac-5", serviceId: "svc-5", amountMinor: 30000, currency: CLINIC_CURRENCY, date: "2026-08-12", method: "transferencia", status: "parcial", concept: "Blanqueamiento LED — Cuota 1" },
  { id: "pag-6", patientId: "pac-6", serviceId: "svc-7", amountMinor: 8000, currency: CLINIC_CURRENCY, date: "2026-08-10", method: "efectivo", status: "pagado", concept: "Evaluación y diagnóstico" },
  { id: "pag-7", patientId: "pac-7", serviceId: "svc-4", amountMinor: 13000, currency: CLINIC_CURRENCY, date: "2026-08-13", method: "efectivo", status: "pagado", concept: "Extracción dental simple" },
  { id: "pag-8", patientId: "pac-2", amountMinor: 20000, currency: CLINIC_CURRENCY, date: TODAY, method: "efectivo", status: "pendiente", concept: "Endodoncia pieza 2.1 — Saldo final" },
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

// ── Movimientos de inventario ────────────────────────────────────────
// Reconcilian con `inventory[].stock`: cada item arranca en 0 y sus
// movimientos suman hasta el stock actual. La última `entrada` de cada item
// coincide con su `lastRefill` denormalizado.
export const inventoryMovements: InventoryMovement[] = [
  { id: "mov-01", itemId: "inv-1", type: "entrada", quantity: 12, date: "2026-08-10", reason: "Compra mensual — Distribuidora Andina", professionalId: "pro-1" },
  { id: "mov-02", itemId: "inv-1", type: "salida", quantity: 6, date: "2026-08-12", reason: "Profilaxis y destartraje (2 pacientes)" },

  { id: "mov-03", itemId: "inv-2", type: "entrada", quantity: 20, date: "2026-08-01", reason: "Reposición trimestral de bioseguridad", professionalId: "pro-1" },
  { id: "mov-04", itemId: "inv-2", type: "salida", quantity: 8, date: "2026-08-14", reason: "Consumo diario de consultorio" },

  { id: "mov-05", itemId: "inv-3", type: "entrada", quantity: 10, date: "2026-07-20", reason: "Compra por lote — depósito central", professionalId: "pro-1" },
  { id: "mov-06", itemId: "inv-3", type: "salida", quantity: 5, date: "2026-08-02", reason: "Restauraciones clase III" },
  { id: "mov-07", itemId: "inv-3", type: "salida", quantity: 3, date: "2026-08-16", reason: "Restauraciones clase I (2 pacientes)" },

  { id: "mov-08", itemId: "inv-4", type: "entrada", quantity: 30, date: "2026-08-10", reason: "Reposición mensual", professionalId: "pro-1" },
  { id: "mov-09", itemId: "inv-4", type: "salida", quantity: 22, date: "2026-08-25", reason: "Consumo por 22 atenciones" },

  { id: "mov-10", itemId: "inv-5", type: "entrada", quantity: 6, date: "2026-06-30", reason: "Compra por lote — Limafo", professionalId: "pro-2" },
  { id: "mov-11", itemId: "inv-5", type: "salida", quantity: 2, date: "2026-07-18", reason: "Instrumentación de 2 endodoncias" },

  { id: "mov-12", itemId: "inv-6", type: "entrada", quantity: 8, date: "2026-07-01", reason: "Compra por lote", professionalId: "pro-1" },
  { id: "mov-13", itemId: "inv-6", type: "salida", quantity: 4, date: "2026-08-09", reason: "Profilaxis en 4 pacientes" },
  { id: "mov-14", itemId: "inv-6", type: "ajuste", quantity: -1, date: "2026-08-21", reason: "Merma por tubo con vencimiento" },

  { id: "mov-15", itemId: "inv-7", type: "entrada", quantity: 15, date: "2026-08-05", reason: "Reposición mensual", professionalId: "pro-1" },
  { id: "mov-16", itemId: "inv-7", type: "salida", quantity: 10, date: "2026-08-20", reason: "Consumo por atenciones" },

  { id: "mov-17", itemId: "inv-8", type: "entrada", quantity: 6, date: "2026-08-12", reason: "Compra por lote", professionalId: "pro-1" },
  { id: "mov-18", itemId: "inv-8", type: "salida", quantity: 5, date: "2026-08-19", reason: "Grabado ácido en 5 resinas" },
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

/**
 * Converts bolivianos to minor units.
 *
 * The exponent form is deliberate: `Math.round(1.005 * 100)` is 100, because
 * 1.005 is stored as slightly below 1.005 and the product lands on
 * 100.49999999999999. Parsing the decimal through an exponent gives the
 * correctly-rounded value, so 1.005 becomes 101 and 0.145 becomes 15.
 */
export function toMinorUnits(major: number) {
  return Math.round(Number(`${major}e2`));
}

export function fromMinorUnits(minor: number) {
  return minor / 100;
}

/**
 * Formats an amount already expressed in minor units.
 */
export function formatCurrency(amountMinor: number) {
  return `Bs. ${fromMinorUnits(amountMinor).toFixed(2)}`;
}

/**
 * Parses user input typed in bolivianos ("150", "150,50") into minor units.
 */
export function parseCurrency(input: string) {
  const normalized = input.trim().replace(",", ".");
  const parsed = Number.parseFloat(normalized);

  return Number.isFinite(parsed) ? toMinorUnits(parsed) : 0;
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

/**
 * Single place where dates are formatted. Bolivia, not Peru.
 */
export function formatMovementDate(iso: string) {
  return new Date(iso).toLocaleDateString("es-BO", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

export function inventoryStatus(item: InventoryItem): InventoryStatus {
  if (item.stock === 0) return "critico";
  if (item.stock < item.minStock) return item.stock <= item.minStock * 0.3 ? "critico" : "bajo";
  return "ok";
}

export function getMovementsByItem(itemId: string) {
  return inventoryMovements
    .filter((m) => m.itemId === itemId)
    .sort((a, b) => b.date.localeCompare(a.date));
}

export function getMovementsByDate(date: string) {
  return inventoryMovements.filter((m) => m.date === date);
}

/**
 * Date of the most recent `entrada` for an item, computed from movements.
 *
 * This is the query the `inventory_items` table cannot answer on its own. To
 * keep the stock list sortable by "último reabasto" without a per-row lateral
 * join, the column has to be denormalized onto `inventory_items` and kept in
 * sync on write; `InventoryItem.lastRefill` models that denormalization.
 */
export function lastRestockAt(itemId: string) {
  const restocks = inventoryMovements.filter(
    (m) => m.itemId === itemId && m.type === "entrada"
  );

  return restocks.reduce<string | undefined>(
    (latest, m) =>
      latest === undefined || m.date > latest ? m.date : latest,
    undefined
  );
}

/**
 * Quantity with the sign implied by `type`.
 *
 * `InventoryMovement.quantity` is a plain int in the schema and the direction
 * lives in `type`, so the sign is never stored: `entrada` adds, `salida`
 * subtracts and `ajuste` carries its own sign.
 */
export function signedQuantity(movement: InventoryMovement) {
  if (movement.type === "entrada") return Math.abs(movement.quantity);
  if (movement.type === "salida") return -Math.abs(movement.quantity);
  return movement.quantity;
}

/**
 * Stock implied by the movement ledger, starting from zero. Reconciles against
 * `InventoryItem.stock`; a mismatch means a movement was recorded without
 * updating the item.
 */
export function stockFromMovements(itemId: string) {
  return inventoryMovements
    .filter((m) => m.itemId === itemId)
    .reduce((total, m) => total + signedQuantity(m), 0);
}