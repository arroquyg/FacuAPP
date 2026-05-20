"use server";

import { createAdminClient } from "@/lib/supabase/admin";
import { getCurrentUser } from "@/lib/auth";
import { revalidatePath } from "next/cache";

export async function crearEventoSanitario(data: {
  animal_id: string;
  tipo_evento: string;
  fecha_evento: string;
  producto: string | null;
  dosis: number | null;
  precio_unitario: number | null;
  unidad: string | null;
  veterinario: string | null;
  descripcion: string | null;
}): Promise<{ ok: boolean; error?: string }> {
  const user = await getCurrentUser();
  if (!user) return { ok: false, error: "No autenticado" };

  const sb = createAdminClient();
  const { error } = await sb.from("eventos_sanitarios").insert({
    animal_id: data.animal_id,
    tipo_evento: data.tipo_evento,
    fecha_evento: data.fecha_evento,
    producto: data.producto || null,
    dosis: data.dosis,
    precio_unitario: data.precio_unitario,
    unidad: data.unidad || null,
    veterinario: data.veterinario || null,
    descripcion: data.descripcion || null,
  });

  if (error) return { ok: false, error: error.message };
  revalidatePath(`/animales/${data.animal_id}`);
  return { ok: true };
}
