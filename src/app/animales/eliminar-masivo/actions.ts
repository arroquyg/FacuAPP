"use server";

import { createAdminClient } from "@/lib/supabase/admin";
import { getCurrentUser } from "@/lib/auth";
import { isDemoUser, DEMO_MSG } from "@/lib/demo";
import { revalidatePath } from "next/cache";
import { registrarAudit } from "@/lib/audit";

async function eliminarEnLotes(
  sb: ReturnType<typeof createAdminClient>,
  tabla: string,
  columna: string,
  ids: string[]
) {
  const LOTE = 100;
  for (let i = 0; i < ids.length; i += LOTE) {
    const lote = ids.slice(i, i + LOTE);
    const { error } = await sb.from(tabla).delete().in(columna, lote);
    if (error) throw new Error(`Error eliminando ${tabla}: ${error.message}`);
  }
}

export async function eliminarAnimalesMasivo(
  animalIds: string[]
): Promise<{ ok: boolean; eliminados: number; error?: string }> {
  if (animalIds.length === 0) return { ok: false, eliminados: 0, error: "Sin animales seleccionados." };

  const user = await getCurrentUser();
  if (!user) return { ok: false, eliminados: 0, error: "No autenticado." };
  if (isDemoUser(user)) return { ok: false, eliminados: 0, error: DEMO_MSG };
  if (user.rol !== "administrador") return { ok: false, eliminados: 0, error: "Sin permisos." };

  const sb = createAdminClient();

  try {
    // Eliminar en orden: tablas hijas primero
    await eliminarEnLotes(sb, "transferencias_pendientes", "animal_id", animalIds);
    await eliminarEnLotes(sb, "transaccion_animales", "animal_id", animalIds);
    await eliminarEnLotes(sb, "movimientos_campo", "animal_id", animalIds);
    await eliminarEnLotes(sb, "trabajo_registros", "animal_id", animalIds);
    await eliminarEnLotes(sb, "animales", "id", animalIds);
  } catch (e) {
    return { ok: false, eliminados: 0, error: (e as Error).message };
  }

  await registrarAudit(user, "eliminar_masivo", {
    tabla: "animales",
    detalle: { cantidad: animalIds.length, animal_ids: animalIds },
  });

  revalidatePath("/animales");
  revalidatePath("/");
  return { ok: true, eliminados: animalIds.length };
}
