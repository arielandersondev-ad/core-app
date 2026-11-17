export const HEALTH_PROFILE_FIELDS = [
  'medicalHistory',
  'allergies',
  'currentMedications',
  'dentalHistory',
  'relevantConditions',
  'observations',
] as const;
export type HealthProfileField = (typeof HEALTH_PROFILE_FIELDS)[number];
export type HealthProfileTexts = Record<HealthProfileField, string | null>;

export type PatientHealthProfile = HealthProfileTexts & {
  patientId: string;
  /** null y `rowVersion: 0` representan un perfil todavía no registrado. */
  updatedAt: Date | null;
  rowVersion: number;
};
