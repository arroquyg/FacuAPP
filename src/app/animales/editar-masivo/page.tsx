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

  const [{ data: campos }, { data: categorias }, { data: razas }] = await Promise.all([
    sb.from("campos").select("id, nombre").eq("empresa_id", empresaId).eq("activo", true).order("nombre"),
    sb.from("categorias").select("id, nombre").eq("empresa_id", empresaId).eq("activo", true).order("nombre"),
    sb.from("razas").select("id, nombre").eq("empresa_id", empresaId).eq("activo", true).order("nombre"),
  ]);

  return (
    <div className="space-y-6">
      <div className="border-b border-stone-200 pb-5">
        <h1 className="text-3xl font-bold text-stone-800">Edición masiva</h1>
        <p className="text-stone-500 mt-1 text-sm">Modificá un campo en múltiples animales a la vez</p>
      </div>
      <EditarMasivo campos={campos ?? []} categorias={categorias ?? []} razas={razas ?? []} />
    </div>
  );
}
