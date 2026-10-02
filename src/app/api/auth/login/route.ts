import { createSession, verifyPassword } from "@/lib/auth";
import { jsonError, jsonOk, readJson } from "@/lib/http";

export const dynamic = "force-dynamic";

export async function POST(request: Request): Promise<Response> {
  try {
    const body = await readJson<{ password?: unknown }>(request);
    if (!body || typeof body.password !== "string") {
      return jsonError("Mot de passe manquant", 400);
    }
    if (!verifyPassword(body.password)) {
      return jsonError("Mot de passe incorrect", 401);
    }
    await createSession();
    return jsonOk({ ok: true });
  } catch (error) {
    console.error("[api/auth/login]", error);
    return jsonError("Service indisponible", 500);
  }
}