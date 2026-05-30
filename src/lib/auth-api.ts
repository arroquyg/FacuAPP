import { createAdminClient } from "@/lib/supabase/admin";
import { getCurrentUser, type UserProfile } from "@/lib/auth";

type PerfilRow = {
  id: string;
  nombre: string;
  email: string;
  rol: string;
  empresa_id: string;
  activo: boolean;
  empresa: { nombre: string } | null;
};

// Autentica desde header JWT (app móvil) o desde cookie (web).
export async function getUserFromRequest(req: Request): Promise<UserProfile | null> {
  const authHeader = req.headers.get("Authorization");
  const token = authHeader?.startsWith("Bearer ") ? authHeader.slice(7) : null;

  if (token) {
    const admin = createAdminClient();
    const { data: { user }, error } = await admin.auth.getUser(token);
    if (error || !user) return null;

    const { data: perfilRaw } = await admin
      .from("usuarios")
      .select("id, nombre, email, rol, empresa_id, activo, empresa:empresa_id(nombre)")
      .eq("email", user.email!)
      .eq("activo", true)
      .single();

    if (!perfilRaw) return null;
    const perfil = perfilRaw as unknown as PerfilRow;

    return {
      id: perfil.id,
      nombre: perfil.nombre,
      email: perfil.email,
      rol: perfil.rol as UserProfile["rol"],
      empresa_id: perfil.empresa_id,
      empresa_nombre: perfil.empresa?.nombre ?? "",
      activo: perfil.activo ?? true,
    };
  }

  // Fallback: sesión por cookie (web)
  return getCurrentUser();
}
