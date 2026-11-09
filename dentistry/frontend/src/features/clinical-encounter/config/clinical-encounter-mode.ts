const explicit = process.env.NEXT_PUBLIC_CLINICAL_ENCOUNTER_DEMO;

/**
 * El mock se usa en desarrollo salvo opt-out explícito. En producción queda
 * apagado duro hasta que existan endpoints reales.
 */
export const CLINICAL_ENCOUNTER_DEMO_ENABLED =
  process.env.NODE_ENV !== "production" && explicit !== "false";
