import "server-only";

function requiredUrl(name: "AUTH_API_URL" | "DENTISTRY_API_URL"): URL {
  const raw = process.env[name];
  if (!raw) throw new Error(`Falta configurar ${name}.`);
  const url = new URL(raw);
  if (!['http:', 'https:'].includes(url.protocol)) {
    throw new Error(`${name} debe usar HTTP o HTTPS.`);
  }
  return url;
}

export const serverEnv = {
  get authApiUrl() { return requiredUrl("AUTH_API_URL"); },
  get dentistryApiUrl() { return requiredUrl("DENTISTRY_API_URL"); },
};
