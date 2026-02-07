import type { NextFunction, Request, Response } from "express";

export type ApiErrorBody = {
  error: string;
  details?: unknown;
};

export function notFound(_req: Request, res: Response) {
  res.status(404).json({ error: "Not found" } satisfies ApiErrorBody);
}

function isBadJsonBodyError(err: unknown): boolean {
  if (!(err instanceof SyntaxError)) return false;
  const anyErr = err as unknown as { type?: unknown };
  return anyErr.type === "entity.parse.failed";
}

export function errorHandler(err: unknown, _req: Request, res: Response, _next: NextFunction) {
  if (isBadJsonBodyError(err)) {
    return res.status(400).json({ error: "Invalid JSON body." } satisfies ApiErrorBody);
  }

  const message = err instanceof Error ? err.message : "Unexpected error";
  return res.status(500).json({ error: message } satisfies ApiErrorBody);
}
