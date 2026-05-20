"use server";

import { createAdminClient } from "@/lib/supabase/admin";
import { getCurrentUser } from "@/lib/auth";
import { revalidatePath } from "next/cache";

export async function importarAnimalesSanitario(
  sanitarioTrabajoId: string,
  eids: string[]
): Promise<{
  ok: boolean;
  total: number;
  encontrados: number;
  noEncontrados: string[];
  error?: string;
}> {
  if (eids.length === 0)
    return { ok: false, total: 0, encontrados: 0, noEncontrados: [], error: "El archivo no tiene caravanas." };

  const user = await getCurrentUser();
  if (!user) return { ok: false, total: 0, encontrados: 0, noEncontrados: [], error: "No autenticado." };

  const sb = createAdminClient();
  const empresaId = user.empresa_id;

  // Fetch the sanitario_trabajo to get event details
  const { data: trabajo, error: trabajoError } = await sb
    .from("sanitario_trabajos")
    .select("*")
    .eq("id", sanitarioTrabajoId)
    .eq("empresa_id", empresaId)
    .single();

  if (trabajoError || !trabajo)
    return { ok: false, total: 0, encontrados: 0, noEncontrados: [], error: "Evento no encontrado." };

  // Normalize EIDs (remove whitespace)
  const eidsNorm = eids.map((e) => e.replace(/\s+/g, ""));

  const [{ data: byEid }, { data: byNorm }] = await Promise.all([
    sb.from("animales").select("id, chip_id").eq("empresa_id", empresaId).in("chip_id", eids),
    sb.from("animales").select("id, chip_id").eq("empresa_id", empresaId).in("chip_id", eidsNorm),
  ]);

  const animalMap = new Map<string, string>();
  for (const a of byEid ?? []) animalMap.set(a.chip_id, a.id);
  for (const a of byNorm ?? []) if (!animalMap.has(a.chip_id)) animalMap.set(a.chip_id, a.id);

  const noEncontrados: string[] = [];
  const rows = eids
    .map((eid) => {
      const eidNorm = eid.replace(/\s+/g, "");
      const animalId = animalMap.get(eid) ?? animalMap.get(eidNorm) ?? null;
      if (!animalId) { noEncontrados.push(eid); return null; }
      return {
        empresa_id: empresaId,
        animal_id: animalId,
        sanitario_trabajo_id: sanitarioTrabajoId,
        tipo_evento: trabajo.tipo_evento,
        fecha_evento: trabajo.fecha,
        producto: trabajo.producto,
        dosis: trabajo.dosis,
        precio_unitario: trabajo.precio_unitario,
        unidad: trabajo.unidad,
        veterinario: trabajo.veterinario,
        descripcion: trabajo.descripcion,
      };
    })
    .filter(Boolean) as object[];

  if (rows.length > 0) {
    const { error: errInsert } = await sb.from("eventos_sanitarios").insert(rows);
    if (errInsert)
      return { ok: false, total: 0, encontrados: 0, noEncontrados: [], error: errInsert.message };
  }

  // Update total_animales count
  const { count } = await sb
    .from("eventos_sanitarios")
    .select("*", { count: "exact", head: true })
    .eq("sanitario_trabajo_id", sanitarioTrabajoId);

  await sb.from("sanitario_trabajos").update({ total_animales: count ?? 0 }).eq("id", sanitarioTrabajoId);

  revalidatePath(`/sanitario/${sanitarioTrabajoId}`);
  revalidatePath("/sanitario");

  return {
    ok: true,
    total: eids.length,
    encontrados: rows.length,
    noEncontrados,
  };
}
