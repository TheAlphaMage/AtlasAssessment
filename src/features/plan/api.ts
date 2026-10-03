import type { ApiError } from "@/lib/domain/types";

/** Thrown when the server cannot be reached at all (network down, server stopped). */
export class RequestFailed extends Error {}

export interface JsonResponse<Body> {
  status: number;
  body: Body | ApiError | null;
}

/** POSTs to one of our API routes and returns the HTTP status with the parsed JSON body (or null). */
export async function postJson<Body>(url: string): Promise<JsonResponse<Body>> {
  let response: Response;
  try {
    response = await fetch(url, { method: "POST" });
  } catch {
    throw new RequestFailed("The server could not be reached. Check that the app is running, then retry.");
  }
  const body = (await response.json().catch(() => null)) as Body | ApiError | null;
  return { status: response.status, body };
}

/** Builds a readable error sentence from a failed response. */
export function describeFailure(status: number, body: unknown): string {
  const message = (body as ApiError | null)?.message;
  if (message) return `${message} (HTTP ${status})`;
  return `The server returned an unexpected response (HTTP ${status}).`;
}
