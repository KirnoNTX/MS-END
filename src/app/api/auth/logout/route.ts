import { destroySession } from "@/lib/auth";
import { jsonOk } from "@/lib/http";

export const dynamic = "force-dynamic";

export async function POST(): Promise<Response> {
  try {
    await destroySession();
    return jsonOk({ ok: true });
  } catch (error) {
    console.error("[api/auth/logout]", error);
    return jsonOk({ ok: true });
  }
}