"use server";

import { createAdminClient } from "@/lib/supabase/admin";
import { getCurrentUser } from "@/lib/auth";
import { revalidatePath } from "next/cache";

export async function eliminarAnimalesMasivo(
  animalIds: string[]
): Promise<{ ok: boolean; eliminados: number; error?: string }> {
  if (animalIds.length === 0) return { ok: false, eliminados: 0, error: "Sin animales seleccionados." };

  const user = await getCurrentUser();
  if (!user) return { ok: false, eliminados: 0, error: "No autenticado." };
  if (user.rol !== "administrador") return { ok: false, eliminados: 0, error: "Sin permisos." };

  const sb = createAdminClient();

  const { error } = await sb
    .from("animales")
    .update({ activo: false })
    .eq("empresa_id", user.empresa_id)
    .in("id", animalIds);

  if (error) return { ok: false, eliminados: 0, error: error.message };

  revalidatePath("/animales");
  revalidatePath("/");
  return { ok: true, eliminados: animalIds.length };
}
