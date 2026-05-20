import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getCurrentUser } from "@/lib/auth";

export async function GET(req: NextRequest) {
  const q = req.nextUrl.searchParams.get("q") ?? "";
  if (q.length < 2) return NextResponse.json([]);

  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "No autenticado" }, { status: 401 });

  const supabase = createAdminClient();
  const empresaId = user.empresa_id;

  const { data, error } = await supabase
    .from("animales")
    .select("id, chip_id, campo:campo_actual_id(nombre)")
    .eq("empresa_id", empresaId)
    .eq("activo", true)
    .ilike("chip_id", `%${q}%`)
    .limit(10);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data ?? []);
}
