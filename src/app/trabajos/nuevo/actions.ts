"use server";

import { createAdminClient } from "@/lib/supabase/admin";
import { revalidatePath } from "next/cache";

const EMPRESA_ID = () => process.env.EMPRESA_ID!;

export async function crearTrabajo(data: {
  tipo: string;
  veterinario: string;
  campo: string;
  fecha: string;
  columnas: string[];
}): Promise<{ ok: boolean; id?: string; error?: string }> {
  const sb = createAdminClient();
  const { data: nuevo, error } = await sb
    .from("trabajos")
    .insert({
      empresa_id: EMPRESA_ID(),
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
