"use server";

import { createAdminClient } from "@/lib/supabase/admin";
import { getCurrentUser } from "@/lib/auth";
import { isDemoUser, DEMO_MSG } from "@/lib/demo";
import { revalidatePath } from "next/cache";
import { registrarAudit } from "@/lib/audit";

type FilaAnimal = {
  chip_id: string;
  sexo: string;
  categoria: string;
  raza: string;
  campo_actual_id: string | null;
  color_pelaje: string | null;
  fecha_nacimiento: string | null;
  genetica_empresa: string | null;
  valor_comercial: number | null;
  estado_sanitario: string | null;
};

export async function importarAnimales(filas: FilaAnimal[]): Promise<{ ok: boolean; insertados: number; error?: string }> {
  if (filas.length === 0) return { ok: false, insertados: 0, error: "Sin filas para importar" };

  const user = await getCurrentUser();
  if (!user) return { ok: false, insertados: 0, error: "No autenticado" };
  if (isDemoUser(user)) return { ok: false, insertados: 0, error: DEMO_MSG };

  const sb = createAdminClient();
  const registros = filas.map((f) => ({
    ...f,
    empresa_id: user.empresa_id,
    activo: true,
    vivo: true,
    created_by: user.id,
  }));

  const { error, count } = await sb.from("animales").insert(registros, { count: "exact" });

  if (error) return { ok: false, insertados: 0, error: error.message };

  const insertados = count ?? filas.length;

  await registrarAudit(user, "importar_animales", {
    tabla: "animales",
    detalle: { cantidad: insertados },
  });

  revalidatePath("/animales");
  revalidatePath("/");
  return { ok: true, insertados };
}
