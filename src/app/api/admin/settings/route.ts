import { isAuthenticated } from "@/lib/auth";
import { jsonError, jsonOk, readJson } from "@/lib/http";
import { getSettings, setSettings } from "@/lib/store";

export const dynamic = "force-dynamic";

const MAX_MESSAGE_LENGTH = 1000;

export async function GET(): Promise<Response> {
  if (!(await isAuthenticated())) return jsonError("Non autorisé", 401);
  try {
    return jsonOk(await getSettings());
  } catch (error) {
    console.error("[api/admin/settings]", error);
    return jsonError("Service indisponible", 500);
  }
}

export async function PUT(request: Request): Promise<Response> {
  if (!(await isAuthenticated())) return jsonError("Non autorisé", 401);
  try {
    const body = await readJson<{ popupEnabled?: unknown; popupMessage?: unknown }>(
      request
    );
    if (!body || typeof body.popupEnabled !== "boolean" || typeof body.popupMessage !== "string") {
      return jsonError("Paramètres invalides", 400);
    }
    return jsonOk(
      await setSettings({
        popupEnabled: body.popupEnabled,
        popupMessage: body.popupMessage.slice(0, MAX_MESSAGE_LENGTH),
      })
    );
  } catch (error) {
    console.error("[api/admin/settings]", error);
    return jsonError("Service indisponible", 500);
  }
}