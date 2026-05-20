"use server";

import { createAdminClient } from "@/lib/supabase/admin";
import { getCurrentUser } from "@/lib/auth";
import { revalidatePath } from "next/cache";

export async function crearLote(data: {
  nombre: string;
  campo_id: string;
  fecha_inicio: string;
  alimentos: { alimento_id: string; kg_por_dia: number; precio_por_tonelada: number }[];
  animales: { chip_id: string; peso_entrada_kg: number }[];
}): Promise<{ ok: boolean; id?: string; error?: string }> {
  const user = await getCurrentUser();
  if (!user) return { ok: false, error: "No autenticado" };

  const sb = createAdminClient();

  // 1. Resolver chip_ids → animal UUIDs
  const chips = data.animales.map((a) => a.chip_id.trim().replace(/\s+/g, "").toUpperCase());
  const { data: animalesDB } = await sb
    .from("animales")
    .select("id, chip_id")
    .eq("empresa_id", user.empresa_id)
    .in("chip_id", chips);

  const chipToId = new Map((animalesDB ?? []).map((a) => [a.chip_id, a.id]));
  const noEncontrados = chips.filter((c) => !chipToId.has(c));
  if (noEncontrados.length > 0) {
    return { ok: false, error: `Caravanas no encontradas: ${noEncontrados.slice(0, 5).join(", ")}${noEncontrados.length > 5 ? ` y ${noEncontrados.length - 5} más` : ""}` };
  }

  // 2. Crear el lote
  const { data: lote, error: errLote } = await sb
    .from("lotes")
    .insert({
      empresa_id: user.empresa_id,
      campo_id: data.campo_id,
      nombre: data.nombre.trim(),
      fecha_inicio: data.fecha_inicio,
      activo: true,
    })
    .select("id")
    .single();

  if (errLote || !lote) return { ok: false, error: errLote?.message ?? "Error al crear lote" };

  // 3. Insertar alimentos con snapshot de precio
  if (data.alimentos.length > 0) {
    const { error: errAlim } = await sb.from("lote_alimentos").insert(
      data.alimentos.map((a) => ({ lote_id: lote.id, ...a }))
    );
    if (errAlim) return { ok: false, error: errAlim.message };
  }

  // 4. Insertar animales
  const { error: errAnim } = await sb.from("lote_animales").insert(
    data.animales.map((a) => ({
      lote_id: lote.id,
      animal_id: chipToId.get(a.chip_id.trim().replace(/\s+/g, "").toUpperCase())!,
      empresa_id: user.empresa_id,
      fecha_entrada: data.fecha_inicio,
      peso_entrada_kg: a.peso_entrada_kg,
    }))
  );
  if (errAnim) return { ok: false, error: errAnim.message };

  revalidatePath("/lotes");
  return { ok: true, id: lote.id };
}

export async function disolverLote(
  loteId: string,
  fecha_fin: string,
  pesos: { lote_animal_id: string; peso_salida_kg: number }[]
): Promise<{ ok: boolean; error?: string }> {
  const user = await getCurrentUser();
  if (!user) return { ok: false, error: "No autenticado" };

  const sb = createAdminClient();

  // Actualizar cada animal con su peso de salida
  for (const p of pesos) {
    const { error } = await sb
      .from("lote_animales")
      .update({ fecha_salida: fecha_fin, peso_salida_kg: p.peso_salida_kg })
      .eq("id", p.lote_animal_id)
      .eq("empresa_id", user.empresa_id);
    if (error) return { ok: false, error: error.message };
  }

  // Cerrar el lote
  const { error: errLote } = await sb
    .from("lotes")
    .update({ activo: false, fecha_fin })
    .eq("id", loteId)
    .eq("empresa_id", user.empresa_id);

  if (errLote) return { ok: false, error: errLote.message };

  revalidatePath("/lotes");
  revalidatePath(`/lotes/${loteId}`);
  return { ok: true };
}
