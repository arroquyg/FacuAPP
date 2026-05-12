import { cache } from "react";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export type UserProfile = {
  id: string;
  nombre: string;
  email: string;
  rol: "admin" | "operario";
  empresa_id: string;
  empresa_nombre: string;
  activo: boolean;
};

export const getCurrentUser = cache(async (): Promise<UserProfile | null> => {
  try {
    const sb = createClient();
    const { data: { user }, error } = await sb.auth.getUser();
    if (error || !user) return null;

    const admin = createAdminClient();
    const { data: perfil } = await admin
      .from("usuarios")
      .select("id, nombre, email, rol, empresa_id, activo, empresa:empresa_id(nombre)")
      .eq("email", user.email!)
      .eq("activo", true)
      .single();

    if (!perfil) return null;

    return {
      id: perfil.id,
      nombre: perfil.nombre,
      email: perfil.email,
      rol: perfil.rol as "admin" | "operario",
      empresa_id: perfil.empresa_id,
      empresa_nombre: (perfil.empresa as unknown as { nombre: string } | null)?.nombre ?? "",
      activo: perfil.activo ?? true,
    };
  } catch {
    return null;
  }
});

export async function getCamposOperario(usuarioId: string): Promise<string[]> {
  const admin = createAdminClient();
  const { data } = await admin
    .from("usuario_campos")
    .select("campo_id")
    .eq("usuario_id", usuarioId);
  return (data ?? []).map((r) => r.campo_id);
}
