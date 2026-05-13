"use server";

import { createAdminClient } from "@/lib/supabase/admin";
import { getCurrentUser } from "@/lib/auth";
import { revalidatePath } from "next/cache";

export async function actualizarCaravanas(data: {
  caravanas_compradas: number;
  caravanas_bajas: number;
}): Promise<{ ok: boolean; error?: string }> {
  const user = await getCurrentUser();
  if (!user || user.rol !== "administrador") return { ok: false, error: "No autorizado." };

  const sb = createAdminClient();
  const { error } = await sb
    .from("empresas")
    .update({
      caravanas_compradas: data.caravanas_compradas,
      caravanas_bajas: data.caravanas_bajas,
    })
    .eq("id", user.empresa_id);

  if (error) return { ok: false, error: error.message };
  revalidatePath("/");
  return { ok: true };
}
