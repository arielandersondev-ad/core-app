const UUID =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/;
const EXTENSION = /^[a-z0-9]{1,5}$/;

export type ClinicalFileObjectKeyInput = {
  organizationId: string;
  patientId: string;
  objectId: string;
  /** Extensión derivada del tipo verificado, nunca del nombre aportado. */
  extension: string;
};

/**
 * Clave privada del objeto: solo identificadores opacos. No incluye nombres,
 * documentos ni el nombre de archivo del paciente (target-schema-dictionary §5.6).
 */
export function buildClinicalFileObjectKey(input: ClinicalFileObjectKeyInput): string {
  const organizationId = input.organizationId.toLowerCase();
  const patientId = input.patientId.toLowerCase();
  const objectId = input.objectId.toLowerCase();

  if (![organizationId, patientId, objectId].every((id) => UUID.test(id))) {
    throw new RangeError('La clave del objeto requiere identificadores UUID');
  }
  if (!EXTENSION.test(input.extension)) {
    throw new RangeError('Extensión de archivo inválida');
  }
  return `dentistry/${organizationId}/${patientId}/${objectId}.${input.extension}`;
}
