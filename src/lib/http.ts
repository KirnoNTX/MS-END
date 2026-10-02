import "server-only";

export function jsonError(message: string, status: number): Response {
  return Response.json({ error: message }, { status });
}

export function jsonOk<T>(data: T, status = 200): Response {
  return Response.json(data, { status });
}

/** Parse a JSON body safely. Returns null when the payload is invalid. */
export async function readJson<T = unknown>(request: Request): Promise<T | null> {
  try {
    return (await request.json()) as T;
  } catch {
    return null;
  }
}