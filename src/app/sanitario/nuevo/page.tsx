import { createAdminClient } from "@/lib/supabase/admin";
import { getCurrentUser } from "@/lib/auth";
import { redirect } from "next/navigation";
import NuevoSanitario from "./NuevoSanitario";

export default async function NuevoSanitarioPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  if (user.rol !== "administrador") redirect("/sanitario");

  const sb = createAdminClient();
  const { data: productos } = await sb
    .from("productos_sanitarios")
    .select("id, nombre, precio_por_unidad, unidad")
    .eq("empresa_id", user.empresa_id)
    .eq("activo", true)
    .order("nombre");

  return (
    <div className="space-y-6">
      <div className="border-b border-stone-200 pb-5">
        <a href="/sanitario" className="text-sm text-stone-400 hover:text-green-700 transition-colors">
          ← Sanitario masivo
        </a>
        <h1 className="text-3xl font-bold text-stone-800 mt-2">Nuevo evento sanitario masivo</h1>
        <p className="text-stone-500 mt-1 text-sm">Aplicá el mismo evento a múltiples animales importando sus caravanas</p>
      </div>
      <NuevoSanitario productos={productos ?? []} />
    </div>
  );
}
