"use server";

import { createAdminClient } from "@/lib/supabase/admin";
import { getCurrentUser } from "@/lib/auth";
import { isDemoUser, DEMO_BLOCKED } from "@/lib/demo";
import { revalidatePath } from "next/cache";

export async function crearTrabajo(data: {
  tipo: string;
  veterinario: string;
  campo: string;
  fecha: string;
  columnas: string[];
}): Promise<{ ok: boolean; id?: string; error?: string }> {
  const user = await getCurrentUser();
  if (!user) return { ok: false, error: "No autenticado" };
  if (isDemoUser(user)) return DEMO_BLOCKED;

  const sb = createAdminClient();
  const { data: nuevo, error } = await sb
    .from("trabajos")
    .insert({
      empresa_id: user.empresa_id,
      tipo: data.tipo,
      veterinario: data.veterinario,
      campo: data.campo,
      fecha: data.fecha,
      columnas: data.columnas,
      total_chips: 0,
    })
    .select("id")
    .single();

  if (error) return { ok: false, error: error.message };
  revalidatePath("/trabajos");
  return { ok: true, id: nuevo.id };
}
