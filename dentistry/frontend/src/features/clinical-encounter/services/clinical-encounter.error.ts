export class ClinicalEncounterApiUnavailableError extends Error {
  constructor(message = "Esta función clínica todavía no está disponible.") {
    super(message);
    this.name = "ClinicalEncounterApiUnavailableError";
  }
}

export class ClinicalEncounterPartialCreateError extends Error {
  constructor(message: string, readonly encounterId: string, options?: { cause?: unknown }) {
    super(message, options);
    this.name = "ClinicalEncounterPartialCreateError";
  }
}
