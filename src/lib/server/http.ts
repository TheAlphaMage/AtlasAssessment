import { NextResponse } from "next/server";
import type { ApiError } from "../domain/types";

export function jsonError(status: number, error: string, message: string): NextResponse<ApiError> {
  return NextResponse.json({ error, message }, { status });
}

/** Wraps a route handler so unexpected failures return a typed JSON 500, never an HTML error page. */
export function handle(fn: (request: Request) => Response | Promise<Response>) {
  return async (request: Request): Promise<Response> => {
    try {
      return await fn(request);
    } catch (error) {
      console.error(error);
      return jsonError(500, "SERVER_ERROR", `Unexpected server error: ${(error as Error).message}`);
    }
  };
}
