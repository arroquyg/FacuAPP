import { createAdminClient } from "@/lib/supabase/admin";
import { getCurrentUser } from "@/lib/auth";
import { redirect } from "next/navigation";
import NuevoLote from "./NuevoLote";

export default async function NuevoLotePage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const sb = createAdminClient();
  const empresaId = user.empresa_id;

  const [{ data: campos }, { data: alimentos }] = await Promise.all([
    sb.from("campos").select("id, nombre").eq("empresa_id", empresaId).eq("activo", true).order("nombre"),
    sb.from("alimentos").select("id, nombre, precio_por_tonelada").eq("empresa_id", empresaId).eq("activo", true).order("nombre"),
  ]);

  return (
    <div className="space-y-6">
      <div className="border-b border-stone-200 pb-5">
        <p className="text-sm text-stone-400 mb-1">
          <a href="/lotes" className="hover:text-green-700 transition-colors">Lotes</a>
          <span className="mx-1">/</span>
          Nuevo lote
        </p>
        <h1 className="text-3xl font-bold text-stone-800">Nuevo lote</h1>
      </div>
      <NuevoLote campos={campos ?? []} alimentos={alimentos ?? []} />
    </div>
  );
}
