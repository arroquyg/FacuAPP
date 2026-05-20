"use server";

import { createAdminClient } from "@/lib/supabase/admin";
import { getCurrentUser } from "@/lib/auth";
import { revalidatePath } from "next/cache";

export async function crearEventosSanitarios(data: {
  animal_id: string;
  tipo_evento: string;
  fecha_evento: string;
  veterinario: string | null;
  descripcion: string | null;
  lineas: Array<{
    producto: string | null;
    dosis: number | null;
    precio_unitario: number | null;
    unidad: string | null;
  }>;
}): Promise<{ ok: boolean; error?: string }> {
  const user = await getCurrentUser();
  if (!user) return { ok: false, error: "No autenticado" };

  const sb = createAdminClient();
  const rows = data.lineas.map((l) => ({
    animal_id: data.animal_id,
    empresa_id: user.empresa_id,
    tipo_evento: data.tipo_evento,
    fecha_evento: data.fecha_evento,
    veterinario: data.veterinario,
    descripcion: data.descripcion,
    producto: l.producto,
    dosis: l.dosis,
    precio_unitario: l.precio_unitario,
    unidad: l.unidad,
  }));

  const { error } = await sb.from("eventos_sanitarios").insert(rows);
  if (error) return { ok: false, error: error.message };

  revalidatePath(`/animales/${data.animal_id}`);
  return { ok: true };
}

export async function cambiarCaravana(
  animalId: string,
  data: { chip_nuevo: string; fecha: string; motivo: string | null }
): Promise<{ ok: boolean; error?: string }> {
  const user = await getCurrentUser();
  if (!user) return { ok: false, error: "No autenticado" };

  const sb = createAdminClient();

  const { data: animal, error: errAnimal } = await sb
    .from("animales")
    .select("chip_id")
    .eq("id", animalId)
    .eq("empresa_id", user.empresa_id)
    .single();

  if (errAnimal || !animal) return { ok: false, error: "Animal no encontrado" };

  const chipNuevo = data.chip_nuevo.trim();
  if (!chipNuevo) return { ok: false, error: "La nueva caravana no puede estar vacía" };
  if (chipNuevo === animal.chip_id) return { ok: false, error: "La nueva caravana es igual a la actual" };

  const { error: errInsert } = await sb.from("cambios_caravana").insert({
    animal_id: animalId,
    chip_id_anterior: animal.chip_id,
    chip_id_nuevo: chipNuevo,
    fecha: data.fecha,
    motivo: data.motivo || null,
    usuario_id: user.id,
  });
  if (errInsert) return { ok: false, error: errInsert.message };

  const { error: errUpdate } = await sb
    .from("animales")
    .update({ chip_id: chipNuevo })
    .eq("id", animalId)
    .eq("empresa_id", user.empresa_id);
  if (errUpdate) return { ok: false, error: errUpdate.message };

  revalidatePath(`/animales/${animalId}`);
  revalidatePath("/animales");
  return { ok: true };
}
