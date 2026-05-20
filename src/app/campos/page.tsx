import { createAdminClient } from "@/lib/supabase/admin";
import { getCurrentUser, getCamposOperario } from "@/lib/auth";
import { redirect } from "next/navigation";

type Campo = {
  id: string;
  nombre: string;
  superficie_ha: number | null;
  capacidad_max: number | null;
  tipo_pasto: string | null;
};

type CampoConConteo = Campo & {
  categorias: Record<string, number>;
  total: number;
};

export default async function CamposPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const sb = createAdminClient();
  const empresaId = user.empresa_id;

  let campoIds: string[] | null = null;
  if (user.rol === "operario") {
    campoIds = await getCamposOperario(user.id);
  }

  if (campoIds !== null && campoIds.length === 0) {
    return (
      <div className="space-y-6">
        <div className="border-b border-stone-200 pb-5">
          <h1 className="text-3xl font-bold text-stone-800">Campos</h1>
        </div>
        <div className="bg-white rounded-xl border border-stone-200 px-4 py-10 text-center shadow-sm">
          <p className="text-stone-400 text-sm">No tenés campos asignados</p>
        </div>
      </div>
    );
  }

  let camposQuery = sb
    .from("campos")
    .select("id, nombre, superficie_ha, capacidad_max, tipo_pasto")
    .eq("empresa_id", empresaId)
    .eq("activo", true)
    .order("nombre");

  if (campoIds !== null) {
    camposQuery = camposQuery.in("id", campoIds);
  }

  let animalesQuery = sb
    .from("animales")
    .select("campo_actual_id, categoria")
    .eq("empresa_id", empresaId)
    .eq("activo", true)
    .eq("vivo", true);

  if (campoIds !== null && campoIds.length > 0) {
    animalesQuery = animalesQuery.in("campo_actual_id", campoIds);
  }

  const [{ data: campos }, { data: animales }] = await Promise.all([
    camposQuery,
    animalesQuery,
  ]);

  const conteoPorCampo: Record<string, Record<string, number>> = {};
  for (const a of animales ?? []) {
    if (!a.campo_actual_id) continue;
    if (!conteoPorCampo[a.campo_actual_id]) conteoPorCampo[a.campo_actual_id] = {};
    const cat = a.categoria ?? "Sin categoría";
    conteoPorCampo[a.campo_actual_id][cat] = (conteoPorCampo[a.campo_actual_id][cat] ?? 0) + 1;
  }

  const camposConConteo: CampoConConteo[] = (campos ?? []).map((c) => {
    const cats = conteoPorCampo[c.id] ?? {};
    const total = Object.values(cats).reduce((s, n) => s + n, 0);
    return { ...c, categorias: cats, total };
  });

  return (
    <div className="space-y-6">
      <div className="border-b border-stone-200 pb-5">
        <h1 className="text-3xl font-bold text-stone-800">Campos</h1>
        <p className="text-stone-500 mt-1 text-sm">Desglose de animales por campo y categoría</p>
      </div>

      {camposConConteo.length === 0 ? (
        <div className="bg-white rounded-xl border border-stone-200 px-4 py-10 text-center shadow-sm">
          <p className="text-stone-400 text-sm">No hay campos activos</p>
        </div>
      ) : (
        <div className="space-y-4">
          {camposConConteo.map((campo) => {
            const pct =
              campo.capacidad_max && campo.capacidad_max > 0
                ? Math.min(100, Math.round((campo.total / campo.capacidad_max) * 100))
                : null;

            const categoriasOrdenadas = Object.entries(campo.categorias).sort(
              ([, a], [, b]) => b - a
            );

            return (
              <div
                key={campo.id}
                className="bg-white rounded-xl border border-stone-200 shadow-sm overflow-hidden"
              >
                {/* Header */}
                <div className="px-5 py-4 border-b border-stone-100 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                  <div>
                    <h2 className="text-lg font-semibold text-stone-800">{campo.nombre}</h2>
                    <div className="flex flex-wrap items-center gap-3 mt-1">
                      {campo.superficie_ha != null && (
                        <span className="text-xs text-stone-500">{campo.superficie_ha} ha</span>
                      )}
                      {campo.tipo_pasto && (
                        <span className="text-xs text-stone-500">Pasto: {campo.tipo_pasto}</span>
                      )}
                      <span className="text-xs font-semibold text-stone-700">
                        {campo.total} animales
                        {campo.capacidad_max ? ` / cap. ${campo.capacidad_max}` : ""}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Barra de ocupación */}
                {pct !== null && (
                  <div className="px-5 py-3 bg-stone-50 border-b border-stone-100">
                    <div className="flex justify-between text-xs text-stone-400 mb-1.5">
                      <span>Ocupación</span>
                      <span
                        className={
                          pct >= 90
                            ? "text-red-500 font-medium"
                            : pct >= 70
                            ? "text-amber-500 font-medium"
                            : "text-green-600 font-medium"
                        }
                      >
                        {pct}%
                      </span>
                    </div>
                    <div className="h-2 bg-stone-200 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full ${
                          pct >= 90 ? "bg-red-400" : pct >= 70 ? "bg-amber-400" : "bg-green-500"
                        }`}
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                )}

                {/* Categorías */}
                <div className="px-5 py-4">
                  {categoriasOrdenadas.length === 0 ? (
                    <p className="text-sm text-stone-400">Sin animales en este campo</p>
                  ) : (
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
                      {categoriasOrdenadas.map(([cat, count]) => (
                        <div
                          key={cat}
                          className="bg-stone-50 border border-stone-100 rounded-lg px-3 py-2.5"
                        >
                          <p className="text-xs text-stone-500 truncate" title={cat}>
                            {cat}
                          </p>
                          <p className="text-2xl font-bold text-stone-800 mt-0.5">{count}</p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
