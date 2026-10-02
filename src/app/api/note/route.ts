import { jsonError, jsonOk, readJson } from "@/lib/http";
import { getNote, setNote } from "@/lib/store";

export const dynamic = "force-dynamic";

const MAX_LENGTH = 5000;

export async function GET(): Promise<Response> {
  try {
    return jsonOk(await getNote());
  } catch (error) {
    console.error("[api/note GET]", error);
    return jsonError("Service indisponible", 500);
  }
}

export async function PUT(request: Request): Promise<Response> {
  try {
    const body = await readJson<{ content?: unknown }>(request);
    if (!body || typeof body.content !== "string") {
      return jsonError("Champ 'content' invalide", 400);
    }
    const content = body.content.slice(0, MAX_LENGTH);
    return jsonOk(await setNote(content));
  } catch (error) {
    console.error("[api/note PUT]", error);
    return jsonError("Service indisponible", 500);
  }
}