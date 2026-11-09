export class ClinicalEncounterApiUnavailableError extends Error {
  constructor(message = "La API de atenciones clínicas todavía no está disponible.") {
    super(message);
    this.name = "ClinicalEncounterApiUnavailableError";
  }
}

export class ClinicalEncounterStateError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ClinicalEncounterStateError";
  }
}

export class ClinicalEncounterPartialCreateError extends Error {
  constructor(message: string, readonly encounterId: string, options?: { cause?: unknown }) {
    super(message, options);
    this.name = "ClinicalEncounterPartialCreateError";
  }
}
