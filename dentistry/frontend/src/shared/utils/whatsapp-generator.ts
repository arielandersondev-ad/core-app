/**
 * Generador de enlaces y plantillas para WhatsApp en el contexto de odontología retail.
 * Diseñado para cero fricción (enlaces wa.me) y compatible con teléfonos de Bolivia (+591)
 * y formato internacional estándar.
 */

export interface DentalWhatsAppContext {
  patientName: string;
  patientPhone: string;
  serviceName: string;
  dateStr: string; // ej. "Viernes 28 de Agosto"
  timeStr: string; // ej. "10:30"
  clinicName?: string;
  professionalName?: string;
}

export type WhatsAppTemplateKey =
  | "confirmacion"
  | "turno_listo"
  | "no_show"
  | "post_tratamiento"
  | "libre";

export interface WhatsAppTemplate {
  key: WhatsAppTemplateKey;
  title: string;
  description: string;
  badge: string;
  generateText: (ctx: DentalWhatsAppContext) => string;
}

export const DENTAL_WHATSAPP_TEMPLATES: WhatsAppTemplate[] = [
  {
    key: "confirmacion",
    title: "Confirmación de Cita",
    description: "Solicitar confirmación al paciente con hora y procedimiento",
    badge: "Recomendado",
    generateText: (ctx) => {
      const clinic = ctx.clinicName || "la Clínica Dental";
      const first = ctx.patientName.trim().split(" ")[0];
      return `Hola ${first} 👋, te saludamos de ${clinic}.\n\nTe recordamos tu cita para *${ctx.serviceName}* programada para el *${ctx.dateStr}* a las *${ctx.timeStr}*.\n\n¿Nos confirmas tu asistencia respondiendo a este mensaje? ¡Te esperamos! 🦷`;
    },
  },
  {
    key: "turno_listo",
    title: "Aviso: Turno Listo",
    description:
      "Avisar que el odontólogo ya puede recibir al paciente en el sillón",
    badge: "En sala",
    generateText: (ctx) => {
      const first = ctx.patientName.trim().split(" ")[0];
      const pro = ctx.professionalName
        ? `El ${ctx.professionalName}`
        : "El doctor";
      return `Hola ${first} 👋, ${pro} ya se encuentra listo para atenderte en el consultorio. ¡Puedes pasar! 🦷`;
    },
  },
  {
    key: "no_show",
    title: "Inasistencia / Reagendar",
    description: "Recuperar amablemente al paciente que no asistió a su cita",
    badge: "Recuperación",
    generateText: (ctx) => {
      const first = ctx.patientName.trim().split(" ")[0];
      return `Hola ${first} 👋, notamos que no pudiste llegar a tu cita de hoy para *${ctx.serviceName}*. Esperamos que todo se encuentre bien.\n\n¿Deseas que coordinemos una nueva fecha y hora que te quede más cómoda? 🗓️`;
    },
  },
  {
    key: "post_tratamiento",
    title: "Cuidados Post-Atención",
    description: "Indicaciones y seguimiento tras finalizar el procedimiento",
    badge: "Fidelización",
    generateText: (ctx) => {
      const first = ctx.patientName.trim().split(" ")[0];
      return `Hola ${first} 👋, esperamos que te sientas muy bien tras tu atención de hoy (*${ctx.serviceName}*).\n\nRecuerda seguir las indicaciones médicas dadas en consulta y evitar comidas muy duras o calientes durante las próximas horas. Ante cualquier duda o molestia, escríbenos directamente por aquí. ¡Que tengas un excelente día! 🦷✨`;
    },
  },
  {
    key: "libre",
    title: "Mensaje Personalizado",
    description: "Saludo básico para escribir texto libre",
    badge: "Libre",
    generateText: (ctx) => {
      const first = ctx.patientName.trim().split(" ")[0];
      const clinic = ctx.clinicName || "la Clínica Dental";
      return `Hola ${first} 👋, te escribimos de ${clinic}...`;
    },
  },
];

/**
 * Limpia y normaliza el número de teléfono con código de país.
 * Por defecto en caso de números de 8 dígitos locales (Bolivia), añade 591.
 */
export function normalizePhoneNumber(
  rawPhone: string,
  defaultCountryCode = "591",
): string {
  // Quitar espacios, guiones, paréntesis y símbolos excepto números
  let cleaned = rawPhone.replace(/\D/g, "");

  if (!cleaned) return "";

  // Si tiene 8 dígitos (formato celular estándar Bolivia: 6XXXXXXX o 7XXXXXXX)
  if (cleaned.length === 8) {
    return `${defaultCountryCode}${cleaned}`;
  }

  // Si empieza por 0, quitarlo
  if (cleaned.startsWith("0")) {
    cleaned = cleaned.substring(1);
    if (cleaned.length === 8) {
      return `${defaultCountryCode}${cleaned}`;
    }
  }

  return cleaned;
}

/**
 * Construye la URL universal de WhatsApp (wa.me)
 */
export function buildWhatsAppUrl(rawPhone: string, message: string): string {
  const phone = normalizePhoneNumber(rawPhone);
  const encoded = encodeURIComponent(message);
  return `https://wa.me/${phone}?text=${encoded}`;
}
