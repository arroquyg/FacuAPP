"use server";

import { createAdminClient } from "@/lib/supabase/admin";
import { getCurrentUser } from "@/lib/auth";
import { revalidatePath } from "next/cache";

export async function crearSanitarioTrabajo(data: {
  tipo_evento: string;
  producto: string | null;
  dosis: number | null;
  precio_unitario: number | null;
  unidad: string | null;
  veterinario: string | null;
  descripcion: string | null;
  fecha: string;
}): Promise<{ ok: boolean; id?: string; error?: string }> {
  const user = await getCurrentUser();
  if (!user) return { ok: false, error: "No autenticado" };

  const sb = createAdminClient();
  const { data: nuevo, error } = await sb
    .from("sanitario_trabajos")
    .insert({
      empresa_id: user.empresa_id,
      tipo_evento: data.tipo_evento,
      producto: data.producto || null,
      dosis: data.dosis,
      precio_unitario: data.precio_unitario,
      unidad: data.unidad || null,
      veterinario: data.veterinario || null,
      descripcion: data.descripcion || null,
      fecha: data.fecha,
      total_animales: 0,
    })
    .select("id")
    .single();

  if (error) return { ok: false, error: error.message };
  revalidatePath("/sanitario");
  return { ok: true, id: nuevo.id };
}
