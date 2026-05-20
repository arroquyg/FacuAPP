"use server";

import { createAdminClient } from "@/lib/supabase/admin";
import { getCurrentUser } from "@/lib/auth";
import { isDemoUser, DEMO_BLOCKED } from "@/lib/demo";
import { revalidatePath } from "next/cache";

export async function registrarMovimientos(
  animalIds: string[],
  campoDestinoId: string,
  fecha: string,
  motivo: string | null
): Promise<{ ok: boolean; movidos?: number; error?: string }> {
  if (animalIds.length === 0) return { ok: false, error: "No hay animales seleccionados." };

  const user = await getCurrentUser();
  if (!user) return { ok: false, error: "No autenticado." };
  if (isDemoUser(user)) return DEMO_BLOCKED;

  const supabase = createAdminClient();
  const { data, error } = await supabase.rpc("registrar_movimientos", {
    p_animal_ids: animalIds,
    p_campo_destino_id: campoDestinoId,
    p_fecha: fecha,
    p_motivo: motivo || null,
  });

  if (error) return { ok: false, error: error.message };

  revalidatePath("/movimientos");
  revalidatePath("/");
  return { ok: true, movidos: data as number };
}
