import { createAdminClient } from "@/lib/supabase/admin";
import { getCurrentUser } from "@/lib/auth";
import { redirect } from "next/navigation";
import EditarMasivo from "./EditarMasivo";

export default async function EditarMasivoPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  if (user.rol !== "administrador") redirect("/animales");

  const sb = createAdminClient();
  const empresaId = user.empresa_id;

  const [{ data: categorias }, { data: razas }, { data: campos }] = await Promise.all([
    sb.from("categorias").select("id, nombre").eq("empresa_id", empresaId).eq("activo", true).order("nombre"),
    sb.from("razas").select("id, nombre").eq("empresa_id", empresaId).eq("activo", true).order("nombre"),
    sb.from("campos").select("id, nombre").eq("empresa_id", empresaId).eq("activo", true).order("nombre"),
  ]);

  return (
    <div className="space-y-6">
      <div>
        <p className="text-sm text-stone-400 mb-1">
          <a href="/animales" className="hover:underline">Animales</a> / Edición masiva
        </p>
        <h1 className="text-2xl font-bold text-stone-800">Edición masiva</h1>
        <p className="text-stone-500 text-sm mt-1">Pegá una lista de caravanas y elegí qué campo actualizar</p>
      </div>
      <EditarMasivo
        categorias={categorias ?? []}
        razas={razas ?? []}
        campos={campos ?? []}
      />
    </div>
  );
}
