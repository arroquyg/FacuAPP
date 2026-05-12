import { getCurrentUser } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { redirect } from "next/navigation";
import UsuariosAdmin from "./UsuariosAdmin";

export default async function AdminUsuariosPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  if (user.rol !== "admin") redirect("/");

  const sb = createAdminClient();

  const [{ data: usuarios }, { data: campos }] = await Promise.all([
    sb
      .from("usuarios")
      .select("id, nombre, email, rol, activo")
      .eq("empresa_id", user.empresa_id)
      .order("nombre"),
    sb
      .from("campos")
      .select("id, nombre")
      .eq("empresa_id", user.empresa_id)
      .eq("activo", true)
      .order("nombre"),
  ]);

  // Cargar campos asignados por operario
  const usuarioIds = (usuarios ?? []).map((u) => u.id);
  const { data: asignaciones } = await sb
    .from("usuario_campos")
    .select("usuario_id, campo_id, campo:campo_id(id, nombre)")
    .in("usuario_id", usuarioIds.length > 0 ? usuarioIds : ["_"]);

  const usuariosConCampos = (usuarios ?? []).map((u) => ({
    ...u,
    campos: (asignaciones ?? [])
      .filter((a) => a.usuario_id === u.id)
      .map((a) => a.campo as unknown as { id: string; nombre: string }),
  }));

  return (
    <div className="space-y-6">
      <div className="border-b border-stone-200 pb-5">
        <h1 className="text-3xl font-bold text-stone-800">Usuarios</h1>
        <p className="text-stone-500 mt-1 text-sm">
          Gestioná los usuarios de {user.empresa_nombre}
        </p>
      </div>

      <UsuariosAdmin
        usuarios={usuariosConCampos}
        campos={campos ?? []}
      />
    </div>
  );
}
