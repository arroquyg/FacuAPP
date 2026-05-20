"use server";

import { createAdminClient } from "@/lib/supabase/admin";
import { getCurrentUser } from "@/lib/auth";
import { isDemoUser, DEMO_MSG } from "@/lib/demo";
import { revalidatePath } from "next/cache";

export type CampoEditable = "categoria" | "raza" | "campo_actual_id" | "estado_sanitario" | "color_pelaje" | "genetica_empresa" | "vivo";

export async function editarAnimalesMasivo(
  animalIds: string[],
  campo: CampoEditable,
  valor: string,
  fechaMuerte?: string
): Promise<{ ok: boolean; editados: number; error?: string }> {
  if (animalIds.length === 0) return { ok: false, editados: 0, error: "Sin animales seleccionados." };

  const user = await getCurrentUser();
  if (!user) return { ok: false, editados: 0, error: "No autenticado." };
  if (isDemoUser(user)) return { ok: false, editados: 0, error: DEMO_MSG };
  if (user.rol !== "administrador") return { ok: false, editados: 0, error: "Sin permisos." };

  const sb = createAdminClient();
  const valorFinal =
    campo === "vivo" ? valor === "true" :
    campo === "campo_actual_id" && valor === "" ? null :
    valor || null;

  const payload: Record<string, unknown> = { [campo]: valorFinal };
  if (campo === "vivo" && valor === "false") {
    payload.fecha_muerte = fechaMuerte || null;
  } else if (campo === "vivo" && valor === "true") {
    payload.fecha_muerte = null;
  }

  const LOTE = 100;
  for (let i = 0; i < animalIds.length; i += LOTE) {
    const lote = animalIds.slice(i, i + LOTE);
    const { error } = await sb
      .from("animales")
      .update(payload)
      .eq("empresa_id", user.empresa_id)
      .in("id", lote);
    if (error) return { ok: false, editados: i, error: error.message };
  }

  revalidatePath("/animales");
  revalidatePath("/");
  return { ok: true, editados: animalIds.length };
}
