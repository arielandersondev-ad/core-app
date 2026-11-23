import assert from "node:assert/strict";
import { createServer } from "node:http";
import test from "node:test";
import { createSourceLoader } from "./support/load-source.mjs";

const PATIENT = "bf262a8d-7bd3-49c1-b7a6-8d9bc27fe362";
const ENCOUNTER = "0b9a5c1e-2f6d-4c3b-9a8e-1d2c3b4a5f60";
const FILE_ID = "0190f3a2-0000-7000-8000-000000000003";

const fileDto = (overrides = {}) => ({
  id: FILE_ID,
  patientId: PATIENT,
  clinicalEncounterId: null,
  category: "DOCUMENT",
  originalFilename: "consentimiento.pdf",
  mimeType: "application/pdf",
  sizeBytes: 4,
  capturedAt: null,
  description: null,
  uploadStatus: "PENDING",
  uploadedAt: null,
  uploadedByMembershipId: "membership-1",
  createdAt: "2026-11-23T12:00:00.000Z",
  updatedAt: "2026-11-23T12:00:00.000Z",
  ...overrides,
});

test("utilidades: valida el archivo antes de pedir la subida", () => {
  const load = createSourceLoader();
  const { validateSelectedFile, suggestedCategory, describeUsage, isImage } = load(
    "src/features/clinical-encounter/utils/clinical-files.ts",
  );
  assert.equal(validateSelectedFile({ type: "application/pdf", size: 1024 }), null);
  assert.match(validateSelectedFile({ type: "image/svg+xml", size: 10 }), /JPG o PNG/);
  assert.match(validateSelectedFile({ type: "image/png", size: 0 }), /vacío/);
  assert.match(validateSelectedFile({ type: "image/png", size: 10 * 1024 * 1024 + 1 }), /10\.0 MB/);
  assert.match(
    validateSelectedFile({ type: "image/png", size: 2048 }, { allowedMimeTypes: ["image/png"], maxFileBytes: 1024 }),
    /1\.0 KB/,
  );
  assert.equal(suggestedCategory("application/pdf"), "DOCUMENT");
  assert.equal(suggestedCategory("image/jpeg"), "PHOTO");
  assert.equal(isImage("image/png"), true);
  assert.equal(isImage("application/pdf"), false);
  assert.equal(describeUsage({ usedBytes: 1024 * 1024, limitBytes: null }), null);
  assert.equal(describeUsage({ usedBytes: 1024 * 1024, limitBytes: 2 * 1024 * 1024 }), "1.0 MB de 2.0 MB usados");
});

test("utilidades: traduce los códigos estables del backend", () => {
  const load = createSourceLoader();
  const { clinicalFileErrorMessage } = load("src/features/clinical-encounter/utils/clinical-files.ts");
  const { ApiError } = load("src/infrastructure/http/api-error.ts");
  const limit = "El plan actual permite hasta 20 archivos por paciente. Mejora tu plan para subir más.";
  assert.equal(clinicalFileErrorMessage(new ApiError(403, limit, [limit], "PLAN_LIMIT_REACHED")), limit);
  assert.match(clinicalFileErrorMessage(new ApiError(403, "x", ["x"], "MODULE_NOT_IN_PLAN")), /no incluye/);
  assert.match(clinicalFileErrorMessage(new ApiError(422, "x", ["x"], "CLINICAL_FILE_UPLOAD_REJECTED")), /no coincide/);
  assert.match(clinicalFileErrorMessage(new ApiError(409, "x", ["x"], "CLINICAL_FILE_CONFLICT")), /Otra persona/);
  assert.match(clinicalFileErrorMessage(new ApiError(502, "Error del servicio clínico.")), /no está disponible/);
  assert.match(clinicalFileErrorMessage(new ApiError(403, "Forbidden")), /permiso/);
});

function loadFileSource(t, respond) {
  const calls = [];
  const uploads = [];
  t.mock.method(globalThis, "fetch", async (url, init) => {
    calls.push({ url: String(url), method: init.method, body: init.body ? JSON.parse(init.body) : undefined });
    return respond(String(url), init);
  });
  const load = createSourceLoader({
    "@/infrastructure/http/signed-upload": {
      uploadToSignedUrl: async (request, file, options) => {
        uploads.push({ request, file });
        options.onProgress?.(1);
      },
    },
  });
  const { createClinicalEncounterHttpDataSource } = load(
    "src/features/clinical-encounter/services/clinical-encounter.http.ts",
  );
  return { source: createClinicalEncounterHttpDataSource(), calls, uploads };
}

test("HTTP adapter: reserva, sube directo al bucket y confirma", async (t) => {
  const upload = {
    url: "https://bucket.test/obj?sig=1",
    method: "PUT",
    headers: { "Content-Type": "application/pdf" },
    expiresAt: "2026-11-23T12:05:00.000Z",
  };
  const { source, calls, uploads } = loadFileSource(t, (url) =>
    url.endsWith("/uploads")
      ? Response.json({ file: fileDto({ clinicalEncounterId: ENCOUNTER }), upload }, { status: 201 })
      : Response.json(fileDto({ uploadStatus: "READY", uploadedAt: "2026-11-23T12:01:00.000Z", clinicalEncounterId: ENCOUNTER })),
  );
  const file = new File([new Uint8Array([0x25, 0x50, 0x44, 0x46])], "consentimiento.pdf", { type: "application/pdf" });
  const progress = [];
  const result = await source.addFile(PATIENT, {
    file,
    category: "DOCUMENT",
    clinicalEncounterId: ENCOUNTER,
    description: "  Firmado  ",
    onProgress: (value) => progress.push(value),
  });

  const base = `/api/dentistry/patients/${PATIENT}/clinical-files`;
  assert.deepEqual(calls.map(({ method, url }) => [method, url]), [
    ["POST", `${base}/uploads`],
    ["POST", `${base}/${FILE_ID}/complete`],
  ]);
  assert.deepEqual(calls[0].body, {
    category: "DOCUMENT",
    originalFilename: "consentimiento.pdf",
    mimeType: "application/pdf",
    sizeBytes: 4,
    clinicalEncounterId: ENCOUNTER,
    description: "Firmado",
  });
  assert.equal(uploads.length, 1);
  assert.deepEqual(uploads[0].request, upload);
  assert.equal(uploads[0].file, file);
  assert.deepEqual(progress, [1]);
  assert.equal(result.uploadStatus, "READY");
  assert.equal("capturedAt" in result, false);
});

test("HTTP adapter: lista, retira y pide enlaces firmados y el cupo", async (t) => {
  const { source, calls } = loadFileSource(t, (url, init) => {
    if (url.includes("/access-url")) {
      return Response.json({ url: "https://bucket.test/obj?sig=2", method: "GET", headers: {}, expiresAt: "x" });
    }
    if (url.endsWith("/quota")) {
      return Response.json({
        usedBytes: 0, limitBytes: 10, filesPerPatient: 5, maxFileBytes: 10, allowedMimeTypes: [], storageAvailable: true,
      });
    }
    if (init.method === "DELETE") return Response.json(fileDto({ uploadStatus: "READY" }));
    if (init.method === "PATCH") {
      return Response.json(fileDto({ uploadStatus: "READY", category: "RADIOGRAPH", updatedAt: "2026-11-23T12:05:00.000Z" }));
    }
    return Response.json({
      items: [fileDto({ uploadStatus: "READY" })],
      pagination: { page: 1, pageSize: 100, totalItems: 1, totalPages: 1 },
    });
  });
  const files = await source.listFiles(PATIENT, ENCOUNTER);
  assert.equal(files.length, 1);
  assert.equal("clinicalEncounterId" in files[0], false);
  const edited = await source.updateFile(PATIENT, FILE_ID, {
    expectedUpdatedAt: "2026-11-23T12:00:00.000Z", category: "RADIOGRAPH", description: null,
  });
  assert.equal(edited.category, "RADIOGRAPH");
  assert.equal(edited.updatedAt, "2026-11-23T12:05:00.000Z");
  await source.removeFile(PATIENT, FILE_ID);
  const signed = await source.getFileAccessUrl(PATIENT, FILE_ID, "attachment");
  assert.equal(signed.url, "https://bucket.test/obj?sig=2");
  const quota = await source.getFileQuota();
  assert.equal(quota.filesPerPatient, 5);
  assert.deepEqual(calls.find(({ method }) => method === "PATCH").body, {
    expectedUpdatedAt: "2026-11-23T12:00:00.000Z", category: "RADIOGRAPH", description: null,
  });

  const base = `/api/dentistry/patients/${PATIENT}/clinical-files`;
  assert.deepEqual(calls.map(({ method, url }) => [method, url]), [
    ["GET", `${base}?pageSize=100&clinicalEncounterId=${ENCOUNTER}`],
    ["PATCH", `${base}/${FILE_ID}`],
    ["DELETE", `${base}/${FILE_ID}`],
    ["GET", `${base}/${FILE_ID}/access-url?disposition=attachment`],
    ["GET", "/api/dentistry/clinical-files/quota"],
  ]);
});

test("subida firmada: PUT con las cabeceras firmadas, sin credenciales, y error controlado", async (t) => {
  const received = [];
  let status = 200;
  const server = createServer((request, response) => {
    const chunks = [];
    request.on("data", (chunk) => chunks.push(chunk));
    request.on("end", () => {
      received.push({ method: request.method, url: request.url, headers: request.headers, body: Buffer.concat(chunks) });
      response.writeHead(status).end();
    });
  });
  await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
  t.after(() => new Promise((resolve) => server.close(resolve)));
  const url = `http://127.0.0.1:${server.address().port}/dentistry/obj.pdf?X-Amz-Signature=abc`;

  const load = createSourceLoader();
  const { uploadToSignedUrl } = load("src/infrastructure/http/signed-upload.ts");
  const { ApiError } = load("src/infrastructure/http/api-error.ts");
  const body = new Blob([new Uint8Array([0x25, 0x50, 0x44, 0x46])], { type: "application/pdf" });
  const progress = [];
  await uploadToSignedUrl({ url, method: "PUT", headers: { "Content-Type": "application/pdf" } }, body, {
    onProgress: (value) => progress.push(value),
  });
  assert.equal(received[0].method, "PUT");
  assert.equal(received[0].url, "/dentistry/obj.pdf?X-Amz-Signature=abc");
  assert.equal(received[0].headers["content-type"], "application/pdf");
  assert.equal(received[0].headers["content-length"], "4");
  assert.equal(received[0].headers.cookie, undefined);
  assert.equal(received[0].headers.authorization, undefined);
  assert.deepEqual([...received[0].body], [0x25, 0x50, 0x44, 0x46]);
  assert.equal(progress.at(-1), 1);

  status = 403;
  await assert.rejects(
    uploadToSignedUrl({ url, method: "PUT", headers: { "Content-Type": "application/pdf" } }, body),
    (error) => error instanceof ApiError && error.status === 403 && /rechazó/.test(error.message),
  );
  await assert.rejects(
    uploadToSignedUrl({ url, method: "GET", headers: {} }, body),
    (error) => error instanceof ApiError,
  );
});
