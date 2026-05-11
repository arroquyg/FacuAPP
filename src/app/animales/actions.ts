"use server";

import { createAdminClient } from "@/lib/supabase/admin";
import { revalidatePath } from "next/cache";

const EID = () => process.env.EMPRESA_ID!;

type AnimalData = {
  chip_id: string;
  numero_caravana: string;
  sexo: string;
  categoria: string;
  raza: string;
  fecha_nacimiento: string | null;
  color_pelaje: string | null;
  procedencia: string | null;
  valor_comercial: number | null;
  estado_sanitario: string | null;
  campo_actual_id: string | null;
  activo: boolean;
  vivo: boolean;
};

export async function crearAnimal(
  data: AnimalData
): Promise<{ ok: boolean; id?: string; error?: string }> {
  const sb = createAdminClient();
  const { data: inserted, error } = await sb
    .from("animales")
    .insert({ ...data, empresa_id: EID() })
    .select("id")
    .single();

  if (error) return { ok: false, error: error.message };
  revalidatePath("/animales");
  revalidatePath("/");
  return { ok: true, id: inserted.id };
}

export async function actualizarAnimal(
  id: string,
  data: AnimalData
): Promise<{ ok: boolean; error?: string }> {
  const sb = createAdminClient();
  const { error } = await sb
    .from("animales")
    .update(data)
    .eq("id", id)
    .eq("empresa_id", EID());

  if (error) return { ok: false, error: error.message };
  revalidatePath("/animales");
  revalidatePath(`/animales/${id}`);
  revalidatePath("/");
  return { ok: true };
}
