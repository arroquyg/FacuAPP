import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getUserFromRequest } from "@/lib/auth-api";
import { isDemoUser, DEMO_MSG } from "@/lib/demo";

// POST /api/baston/sync
// Crea un Trabajo y sus registros a partir de una sesión del bastón XRS2i.
// Body: { session_name, fecha, campo, veterinario, eids: string[] }
export async function POST(req: NextRequest) {
  const user = await getUserFromRequest(req);
  if (!user) return NextResponse.json({ error: "No autenticado" }, { status: 401 });
  if (isDemoUser(user)) return NextResponse.json({ error: DEMO_MSG }, { status: 403 });

  let body: {
    session_name: string;
    fecha: string;
    campo: string;
    veterinario: string;
    eids: string[];
  };

  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Body inválido" }, { status: 400 });
  }

  const { session_name, fecha, campo, veterinario, eids } = body;

  if (!session_name || !fecha || !eids || eids.length === 0) {
    return NextResponse.json({ error: "Faltan campos requeridos: session_name, fecha, eids" }, { status: 400 });
  }

  const sb = createAdminClient();
  const empresaId = user.empresa_id;

  // 1. Crear el Trabajo con el nombre de la sesión del bastón
  const { data: trabajo, error: errTrabajo } = await sb
    .from("trabajos")
    .insert({
      empresa_id: empresaId,
      tipo: session_name,
      veterinario: veterinario ?? "",
      campo: campo ?? "",
      fecha,
      columnas: [],
      total_chips: 0,
    })
    .select("id")
    .single();

  if (errTrabajo || !trabajo) {
    return NextResponse.json({ error: errTrabajo?.message ?? "Error al crear trabajo" }, { status: 500 });
  }

  // 2. Buscar animales por chip_id (con y sin espacios)
  const eidsNorm = eids.map((e) => e.replace(/\s+/g, ""));

  const [{ data: byEid }, { data: byNorm }] = await Promise.all([
    sb.from("animales").select("id, chip_id").eq("empresa_id", empresaId).in("chip_id", eids),
    sb.from("animales").select("id, chip_id").eq("empresa_id", empresaId).in("chip_id", eidsNorm),
  ]);

  const animalMap = new Map<string, string>();
  for (const a of byEid ?? []) animalMap.set(a.chip_id, a.id);
  for (const a of byNorm ?? []) if (!animalMap.has(a.chip_id)) animalMap.set(a.chip_id, a.id);

  // 3. Armar registros
  const noEncontrados: string[] = [];
  const rows = eids.map((eid) => {
    const eidNorm = eid.replace(/\s+/g, "");
    const animalId = animalMap.get(eid) ?? animalMap.get(eidNorm) ?? null;
    if (!animalId) noEncontrados.push(eid);
    return {
      trabajo_id: trabajo.id,
      animal_id: animalId,
      eid,
      encontrado: animalId !== null,
    };
  });

  const { error: errRegistros } = await sb.from("trabajo_registros").insert(rows);
  if (errRegistros) {
    return NextResponse.json({ error: errRegistros.message }, { status: 500 });
  }

  // 4. Actualizar total_chips en el trabajo
  await sb.from("trabajos").update({ total_chips: eids.length }).eq("id", trabajo.id);

  return NextResponse.json({
    ok: true,
    trabajoId: trabajo.id,
    total: eids.length,
    encontrados: eids.length - noEncontrados.length,
    noEncontrados,
  });
}
