import { ZodError } from "zod";
import type { ErrorCode } from "@shared/types/api";

export class AppError extends Error {
  constructor(
    public readonly status: number,
    public readonly code: ErrorCode,
    message: string,
    public readonly details?: unknown,
  ) {
    super(message);
    this.name = "AppError";
  }
}

export function errorResponse(error: unknown): Response {
  if (error instanceof AppError) {
    return Response.json(
      { error: { code: error.code, message: error.message, ...(error.details === undefined ? {} : { details: error.details }) } },
      { status: error.status },
    );
  }

  if (error instanceof ZodError) {
    const details = error.issues.map((issue) => ({
      field: issue.path.join("."),
      message: issue.message,
    }));
    return Response.json(
      { error: { code: "VALIDATION_ERROR", message: "Request validation failed.", details } },
      { status: 422 },
    );
  }

  console.error("Unhandled API error", error);
  return Response.json(
    { error: { code: "INTERNAL_ERROR", message: "An internal error occurred." } },
    { status: 500 },
  );
}

export async function readJsonBody(request: Request): Promise<unknown> {
  const body = await request.text();
  if (Buffer.byteLength(body, "utf8") > 8 * 1024 * 1024) {
    throw new AppError(413, "PAYLOAD_TOO_LARGE", "Request body must be no larger than 8 MB.");
  }
  try {
    return JSON.parse(body) as unknown;
  } catch {
    throw new AppError(400, "BAD_REQUEST", "Request body must contain valid JSON.");
  }
}
