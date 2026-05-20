"use server";

import { createAdminClient } from "@/lib/supabase/admin";
import { getCurrentUser } from "@/lib/auth";
import { isDemoUser, DEMO_MSG } from "@/lib/demo";
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
  if (isDemoUser(user)) return { ok: false, total: 0, encontrados: 0, noEncontrados: [], error: DEMO_MSG };

  const sb = createAdminClient();
  const empresaId = user.empresa_id;

  // Fetch trabajo + productos
  const [{ data: trabajo, error: trabajoError }, { data: sanitarioProductos }] = await Promise.all([
    sb.from("sanitario_trabajos").select("*").eq("id", sanitarioTrabajoId).eq("empresa_id", empresaId).single(),
    sb.from("sanitario_productos").select("*").eq("sanitario_id", sanitarioTrabajoId),
  ]);

  if (trabajoError || !trabajo)
    return { ok: false, total: 0, encontrados: 0, noEncontrados: [], error: "Evento no encontrado." };

  // Si tiene productos en sanitario_productos úsalos; si no, cae al campo único del trabajo
  const productos = (sanitarioProductos ?? []).length > 0
    ? sanitarioProductos!
    : trabajo.producto
      ? [{ producto: trabajo.producto, dosis: trabajo.dosis, precio_unitario: trabajo.precio_unitario, unidad: trabajo.unidad }]
      : [];

  // Normalize EIDs
  const eidsNorm = eids.map((e) => e.replace(/\s+/g, ""));

  const [{ data: byEid }, { data: byNorm }] = await Promise.all([
    sb.from("animales").select("id, chip_id").eq("empresa_id", empresaId).in("chip_id", eids),
    sb.from("animales").select("id, chip_id").eq("empresa_id", empresaId).in("chip_id", eidsNorm),
  ]);

  const animalMap = new Map<string, string>();
  for (const a of byEid ?? []) animalMap.set(a.chip_id, a.id);
  for (const a of byNorm ?? []) if (!animalMap.has(a.chip_id)) animalMap.set(a.chip_id, a.id);

  const noEncontrados: string[] = [];
  const rows: object[] = [];

  for (const eid of eids) {
    const eidNorm = eid.replace(/\s+/g, "");
    const animalId = animalMap.get(eid) ?? animalMap.get(eidNorm) ?? null;
    if (!animalId) { noEncontrados.push(eid); continue; }

    if (productos.length === 0) {
      rows.push({
        animal_id: animalId,
        empresa_id: empresaId,
        sanitario_trabajo_id: sanitarioTrabajoId,
        tipo_evento: trabajo.tipo_evento,
        fecha_evento: trabajo.fecha,
        producto: null,
        dosis: null,
        precio_unitario: null,
        unidad: null,
        veterinario: trabajo.veterinario,
        descripcion: trabajo.descripcion,
      });
    } else {
      for (const p of productos) {
        rows.push({
          animal_id: animalId,
          empresa_id: empresaId,
          sanitario_trabajo_id: sanitarioTrabajoId,
          tipo_evento: trabajo.tipo_evento,
          fecha_evento: trabajo.fecha,
          producto: p.producto,
          dosis: p.dosis,
          precio_unitario: p.precio_unitario,
          unidad: p.unidad,
          veterinario: trabajo.veterinario,
          descripcion: trabajo.descripcion,
        });
      }
    }
  }

  if (rows.length > 0) {
    const { error: errInsert } = await sb.from("eventos_sanitarios").insert(rows);
    if (errInsert)
      return { ok: false, total: 0, encontrados: 0, noEncontrados: [], error: errInsert.message };
  }

  // total_animales = animales distintos (no filas, que pueden ser N por producto)
  const encontrados = eids.length - noEncontrados.length;
  await sb.from("sanitario_trabajos")
    .update({ total_animales: encontrados })
    .eq("id", sanitarioTrabajoId);

  revalidatePath(`/sanitario/${sanitarioTrabajoId}`);
  revalidatePath("/sanitario");

  return {
    ok: true,
    total: eids.length,
    encontrados,
    noEncontrados,
  };
}
