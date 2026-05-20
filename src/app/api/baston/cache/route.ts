import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getUserFromRequest } from "@/lib/auth-api";

// GET /api/baston/cache
// Devuelve todos los chip_id activos de la empresa para cache offline en la app móvil.
export async function GET(req: NextRequest) {
  const user = await getUserFromRequest(req);
  if (!user) return NextResponse.json({ error: "No autenticado" }, { status: 401 });

  const sb = createAdminClient();

  const { data, error } = await sb
    .from("animales")
    .select("chip_id")
    .eq("empresa_id", user.empresa_id)
    .eq("activo", true);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const chips = (data ?? []).map((a) => a.chip_id);
  return NextResponse.json({ chips, total: chips.length });
}
