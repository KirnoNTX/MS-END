import { isAuthenticated } from "@/lib/auth";
import { jsonError, jsonOk, readJson } from "@/lib/http";
import { isValidISODate } from "@/lib/dates";
import {
  clearWorkingDays,
  getWorkingDays,
  toggleWorkingDay,
} from "@/lib/store";

export const dynamic = "force-dynamic";

export async function GET(): Promise<Response> {
  if (!(await isAuthenticated())) return jsonError("Non autorisé", 401);
  try {
    return jsonOk({ workingDays: await getWorkingDays() });
  } catch (error) {
    console.error("[api/admin/working-days GET]", error);
    return jsonError("Service indisponible", 500);
  }
}

/** Toggle one specific day (no ranges): click = select / unselect. */
export async function POST(request: Request): Promise<Response> {
  if (!(await isAuthenticated())) return jsonError("Non autorisé", 401);
  try {
    const body = await readJson<{ date?: unknown }>(request);
    if (!body || typeof body.date !== "string" || !isValidISODate(body.date)) {
      return jsonError("Date invalide (attendu: YYYY-MM-DD)", 400);
    }
    const result = await toggleWorkingDay(body.date);
    return jsonOk({ ...result, workingDays: await getWorkingDays() });
  } catch (error) {
    console.error("[api/admin/working-days POST]", error);
    return jsonError("Service indisponible", 500);
  }
}

/** Wipe every selection. */
export async function DELETE(): Promise<Response> {
  if (!(await isAuthenticated())) return jsonError("Non autorisé", 401);
  try {
    await clearWorkingDays();
    return jsonOk({ ok: true, workingDays: [] as string[] });
  } catch (error) {
    console.error("[api/admin/working-days DELETE]", error);
    return jsonError("Service indisponible", 500);
  }
}