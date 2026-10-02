import { getPublicState } from "@/lib/store";

export const dynamic = "force-dynamic";

export async function GET(): Promise<Response> {
  try {
    return Response.json(await getPublicState());
  } catch (error) {
    console.error("[api/state]", error);
    return Response.json({ error: "Service indisponible" }, { status: 500 });
  }
}