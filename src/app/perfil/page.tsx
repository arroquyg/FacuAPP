import { getCurrentUser, getCamposOperario } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { redirect } from "next/navigation";

export default async function PerfilPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const admin = createAdminClient();

  const { data: empresa } = await admin
    .from("empresas")
    .select("nombre, razon_social, cuit")
    .eq("id", user.empresa_id)
    .single();

  let camposAsignados: { nombre: string }[] = [];
  if (user.rol === "operario") {
    const campoIds = await getCamposOperario(user.id);
    if (campoIds.length > 0) {
      const { data } = await admin
        .from("campos")
        .select("nombre")
        .in("id", campoIds);
      camposAsignados = data ?? [];
    }
  }

  return (
    <div className="space-y-6 max-w-2xl">
      <div className="border-b border-stone-200 pb-5">
        <h1 className="text-3xl font-bold text-stone-800">Mi perfil</h1>
        <p className="text-stone-500 mt-1 text-sm">Tu información de cuenta</p>
      </div>

      {/* Usuario */}
      <div className="bg-white rounded-xl border border-stone-200 shadow-sm p-6 space-y-4">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-full bg-green-800 flex items-center justify-center text-white text-2xl font-bold shrink-0">
            {user.nombre.charAt(0).toUpperCase()}
          </div>
          <div>
            <h2 className="text-xl font-semibold text-stone-800">{user.nombre}</h2>
            <p className="text-sm text-stone-500">{user.email}</p>
            <span className={`inline-block mt-1 text-xs px-2.5 py-0.5 rounded-full font-medium ${
              user.rol === "admin"
                ? "bg-green-100 text-green-700"
                : "bg-stone-100 text-stone-600"
            }`}>
              {user.rol === "admin" ? "Administrador" : "Operario"}
            </span>
          </div>
        </div>

        {user.rol === "operario" && (
          <div className="pt-3 border-t border-stone-100">
            <p className="text-xs font-semibold text-stone-400 uppercase tracking-wider mb-2">
              Campos asignados
            </p>
            {camposAsignados.length === 0 ? (
              <p className="text-sm text-stone-400">Sin campos asignados todavía</p>
            ) : (
              <div className="flex flex-wrap gap-2">
                {camposAsignados.map((c) => (
                  <span key={c.nombre} className="px-3 py-1 bg-green-50 border border-green-200 text-green-700 text-sm rounded-lg font-medium">
                    {c.nombre}
                  </span>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Empresa */}
      <div className="bg-white rounded-xl border border-stone-200 shadow-sm p-6 space-y-3">
        <p className="text-xs font-semibold text-stone-400 uppercase tracking-wider">Empresa</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <p className="text-xs text-stone-400">Nombre</p>
            <p className="text-sm font-medium text-stone-800 mt-0.5">{empresa?.nombre ?? "—"}</p>
          </div>
          {empresa?.razon_social && (
            <div>
              <p className="text-xs text-stone-400">Razón social</p>
              <p className="text-sm font-medium text-stone-800 mt-0.5">{empresa.razon_social}</p>
            </div>
          )}
          {empresa?.cuit && (
            <div>
              <p className="text-xs text-stone-400">CUIT</p>
              <p className="text-sm font-medium text-stone-800 mt-0.5">{empresa.cuit}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
