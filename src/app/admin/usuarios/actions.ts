"use server";

import { createAdminClient } from "@/lib/supabase/admin";
import { getCurrentUser } from "@/lib/auth";
import { revalidatePath } from "next/cache";

async function requireAdmin() {
  const user = await getCurrentUser();
  if (!user || user.rol !== "administrador") throw new Error("Sin permiso");
  return user;
}

export async function crearUsuario(formData: FormData) {
  const admin = await requireAdmin();
  const sb = createAdminClient();

  const email = (formData.get("email") as string).trim().toLowerCase();
  const nombre = (formData.get("nombre") as string).trim();
  const rol = formData.get("rol") as string;
  const password = formData.get("password") as string;

  const { data: authData, error: authError } = await sb.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
  });

  if (authError) return { ok: false, error: authError.message };

  const { error: dbError } = await sb.from("usuarios").insert({
    nombre,
    email,
    rol,
    empresa_id: admin.empresa_id,
    activo: true,
  });

  if (dbError) {
    await sb.auth.admin.deleteUser(authData.user.id);
    return { ok: false, error: dbError.message };
  }

  revalidatePath("/admin/usuarios");
  return { ok: true };
}

export async function toggleActivo(usuarioId: string, activo: boolean) {
  await requireAdmin();
  const sb = createAdminClient();
  await sb.from("usuarios").update({ activo }).eq("id", usuarioId);
  revalidatePath("/admin/usuarios");
}

export async function asignarCampo(usuarioId: string, campoId: string) {
  await requireAdmin();
  const sb = createAdminClient();
  await sb.from("usuario_campos").upsert({ usuario_id: usuarioId, campo_id: campoId });
  revalidatePath("/admin/usuarios");
}

export async function quitarCampo(usuarioId: string, campoId: string) {
  await requireAdmin();
  const sb = createAdminClient();
  await sb
    .from("usuario_campos")
    .delete()
    .eq("usuario_id", usuarioId)
    .eq("campo_id", campoId);
  revalidatePath("/admin/usuarios");
}
