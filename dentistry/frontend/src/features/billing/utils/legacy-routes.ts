const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * Las antiguas pantallas globales de tratamientos y pagos eran un prototipo con
 * datos de ejemplo. El backend de cobros es por paciente, así que esas rutas
 * ahora llevan a la cuenta del paciente (o a la lista de pacientes).
 */
export function legacyBillingDestination(patientId: string | string[] | undefined): string {
  const id = Array.isArray(patientId) ? patientId[0] : patientId;
  return id && UUID.test(id) ? `/patients/${encodeURIComponent(id)}/account` : "/patients";
}
