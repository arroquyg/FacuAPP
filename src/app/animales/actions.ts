"use server";

import { createAdminClient } from "@/lib/supabase/admin";
import { getCurrentUser } from "@/lib/auth";
import { revalidatePath } from "next/cache";

type AnimalData = {
  chip_id: string;
  sexo: string;
  categoria: string;
  raza: string;
  fecha_nacimiento: string | null;
  color_pelaje: string | null;
  genetica_empresa: string | null;
  valor_comercial: number | null;
  estado_sanitario: string | null;
  campo_actual_id: string | null;
  activo: boolean;
  vivo: boolean;
};

export async function crearAnimal(data: AnimalData): Promise<{ ok: boolean; id?: string; error?: string }> {
  const user = await getCurrentUser();
  if (!user) return { ok: false, error: "No autenticado" };

  const sb = createAdminClient();
  const { data: inserted, error } = await sb
    .from("animales")
    .insert({ ...data, empresa_id: user.empresa_id })
    .select("id")
    .single();

  if (error) return { ok: false, error: error.message };
  revalidatePath("/animales");
  revalidatePath("/");
  return { ok: true, id: inserted.id };
}

export async function actualizarAnimal(id: string, data: AnimalData): Promise<{ ok: boolean; error?: string }> {
  const user = await getCurrentUser();
  if (!user) return { ok: false, error: "No autenticado" };

  const sb = createAdminClient();
  const { error } = await sb
    .from("animales")
    .update(data)
    .eq("id", id)
    .eq("empresa_id", user.empresa_id);

  if (error) return { ok: false, error: error.message };
  revalidatePath("/animales");
  revalidatePath(`/animales/${id}`);
  revalidatePath("/");
  return { ok: true };
}
