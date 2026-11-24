import axios from "axios";
import { ApiError } from "./api-error";

export type SignedUploadRequest = {
  url: string;
  method: "PUT" | "GET";
  headers: Record<string, string>;
};

/**
 * Cliente para transferir binarios al almacenamiento con una URL firmada por
 * el backend. Es distinto de `api`: va a otro origen, no envía cookies ni
 * sesión y usa el adaptador XHR de axios para informar el progreso.
 */
const storageClient = axios.create({
  withCredentials: false,
  timeout: 5 * 60_000,
  // El cuerpo es el File tal cual: sin serializar a JSON.
  transformRequest: [(data: unknown) => data],
});

/** Sube el archivo exactamente con las cabeceras firmadas (tipo y tamaño). */
export async function uploadToSignedUrl(
  request: SignedUploadRequest,
  file: Blob,
  options: { onProgress?: (fraction: number) => void; signal?: AbortSignal } = {},
): Promise<void> {
  if (request.method !== "PUT") throw new ApiError(500, "Solicitud de subida inválida.");
  try {
    await storageClient.request({
      url: request.url,
      method: "PUT",
      data: file,
      headers: request.headers,
      signal: options.signal,
      onUploadProgress: (event) => {
        if (event.total) options.onProgress?.(Math.min(1, event.loaded / event.total));
      },
    });
    options.onProgress?.(1);
  } catch (error) {
    if (options.signal?.aborted) throw error;
    if (axios.isAxiosError(error) && error.response) {
      throw new ApiError(
        error.response.status,
        "El almacenamiento rechazó el archivo. Vuelve a intentarlo.",
      );
    }
    throw new ApiError(0, "No se pudo enviar el archivo al almacenamiento. Revisa tu conexión.");
  }
}
