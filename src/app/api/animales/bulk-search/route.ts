import { createAdminClient } from "@/lib/supabase/admin";
import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  const chips = req.nextUrl.searchParams.get("chips") ?? "";
  const lista = chips
    .split(",")
    .map((c) => c.trim().toUpperCase())
    .filter(Boolean);

  if (lista.length === 0) return NextResponse.json([]);

  const supabase = createAdminClient();
  const empresaId = process.env.EMPRESA_ID!;

  const { data, error } = await supabase
    .from("animales")
    .select("id, chip_id, numero_caravana, campo:campo_actual_id(nombre)")
    .eq("empresa_id", empresaId)
    .eq("activo", true)
    .in("chip_id", lista);

  if (error) return NextResponse.json([], { status: 500 });
  return NextResponse.json(data ?? []);
}
