"use server";

import { createAdminClient } from "@/lib/supabase/admin";
import { getCurrentUser } from "@/lib/auth";
import { revalidatePath } from "next/cache";

export type CampoEditable = "categoria" | "raza" | "campo_actual_id" | "estado_sanitario" | "color_pelaje" | "procedencia";

export async function editarAnimalesMasivo(
  animalIds: string[],
  campo: CampoEditable,
  valor: string
): Promise<{ ok: boolean; actualizados: number; error?: string }> {
  if (animalIds.length === 0) return { ok: false, actualizados: 0, error: "Sin animales seleccionados." };

  const user = await getCurrentUser();
  if (!user) return { ok: false, actualizados: 0, error: "No autenticado." };
  if (user.rol !== "administrador") return { ok: false, actualizados: 0, error: "Sin permisos." };

  const sb = createAdminClient();

  const { error } = await sb
    .from("animales")
    .update({ [campo]: valor || null })
    .eq("empresa_id", user.empresa_id)
    .in("id", animalIds);

  if (error) return { ok: false, actualizados: 0, error: error.message };

  revalidatePath("/animales");
  return { ok: true, actualizados: animalIds.length };
}
