import { createAdminClient } from "@/lib/supabase/admin";
import { getCurrentUser } from "@/lib/auth";
import { NextRequest, NextResponse } from "next/server";

// POST: chips en el body para evitar límite de URL
export async function POST(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "No autenticado" }, { status: 401 });

  const body = await req.json().catch(() => ({}));
  const lista: string[] = (body.chips ?? []).map((c: string) => c.trim().toUpperCase()).filter(Boolean);

  if (lista.length === 0) return NextResponse.json([]);

  const supabase = createAdminClient();
  const LOTE = 100;
  let resultado: unknown[] = [];

  for (let i = 0; i < lista.length; i += LOTE) {
    const lote = lista.slice(i, i + LOTE);
    const { data, error } = await supabase
      .from("animales")
      .select("id, chip_id, numero_caravana, campo:campo_actual_id(nombre)")
      .eq("empresa_id", user.empresa_id)
      .eq("activo", true)
      .in("chip_id", lote);
    if (error) return NextResponse.json([], { status: 500 });
    resultado = resultado.concat(data ?? []);
  }

  return NextResponse.json(resultado);
}

// GET legacy para compatibilidad
export async function GET(req: NextRequest) {
  const chips = req.nextUrl.searchParams.get("chips") ?? "";
  const lista = chips.split(",").map((c) => c.trim().toUpperCase()).filter(Boolean);
  if (lista.length === 0) return NextResponse.json([]);

  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "No autenticado" }, { status: 401 });

  const supabase = createAdminClient();
  const LOTE = 100;
  let resultado: unknown[] = [];

  for (let i = 0; i < lista.length; i += LOTE) {
    const lote = lista.slice(i, i + LOTE);
    const { data, error } = await supabase
      .from("animales")
      .select("id, chip_id, numero_caravana, campo:campo_actual_id(nombre)")
      .eq("empresa_id", user.empresa_id)
      .eq("activo", true)
      .in("chip_id", lote);
    if (error) return NextResponse.json([], { status: 500 });
    resultado = resultado.concat(data ?? []);
  }

  return NextResponse.json(resultado);
}
