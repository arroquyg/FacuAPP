import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getUserFromRequest } from "@/lib/auth-api";

// POST /api/baston/animales-nuevos
// Crea animales nuevos a partir de EIDs no encontrados en el bastón.
// Body: { animales: Array<{ chip_id, campo?, fecha_ingreso? }> }
export async function POST(req: NextRequest) {
  const user = await getUserFromRequest(req);
  if (!user) return NextResponse.json({ error: "No autenticado" }, { status: 401 });

  let body: {
    animales: Array<{
      chip_id: string;
      campo?: string;
      fecha_ingreso?: string;
    }>;
  };

  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Body inválido" }, { status: 400 });
  }

  if (!body.animales || body.animales.length === 0) {
    return NextResponse.json({ error: "No se enviaron animales" }, { status: 400 });
  }

  const sb = createAdminClient();

  const rows = body.animales.map((a) => ({
    empresa_id: user.empresa_id,
    chip_id: a.chip_id,
    genetica_empresa: a.campo ?? null,
    fecha_nacimiento: a.fecha_ingreso ?? null,
    activo: true,
  }));

  const { data, error } = await sb
    .from("animales")
    .insert(rows)
    .select("id, chip_id");

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({
    ok: true,
    creados: data?.length ?? 0,
    animales: data ?? [],
  });
}
