import { isAuthenticated } from "@/lib/auth";
import { jsonOk } from "@/lib/http";

export const dynamic = "force-dynamic";

export async function GET(): Promise<Response> {
  return jsonOk({ authenticated: await isAuthenticated() });
}