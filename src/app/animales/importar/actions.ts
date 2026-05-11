"use server";

import { createAdminClient } from "@/lib/supabase/admin";
import { revalidatePath } from "next/cache";

const EID = () => process.env.EMPRESA_ID!;

type FilaAnimal = {
  chip_id: string;
  numero_caravana: string;
  sexo: string;
  categoria: string;
  raza: string;
  campo_actual_id: string | null;
  color_pelaje: string | null;
  fecha_nacimiento: string | null;
  procedencia: string | null;
  valor_comercial: number | null;
  estado_sanitario: string | null;
};

export async function importarAnimales(
  filas: FilaAnimal[]
): Promise<{ ok: boolean; insertados: number; error?: string }> {
  if (filas.length === 0) return { ok: false, insertados: 0, error: "Sin filas para importar" };

  const sb = createAdminClient();
  const registros = filas.map((f) => ({ ...f, empresa_id: EID(), activo: true, vivo: true }));

  const { error, count } = await sb
    .from("animales")
    .insert(registros, { count: "exact" });

  if (error) return { ok: false, insertados: 0, error: error.message };

  revalidatePath("/animales");
  revalidatePath("/");
  return { ok: true, insertados: count ?? filas.length };
}
