import { createAdminClient } from "@/lib/supabase/admin";

function formatDate(dateStr: string | null) {
  if (!dateStr) return "—";
  const d = new Date(dateStr);
  return d.toLocaleDateString("es-AR", { day: "2-digit", month: "2-digit", year: "numeric" });
}

export default async function DashboardPage() {
  const supabase = createAdminClient();
  const empresaId = process.env.EMPRESA_ID!;

  const [
    { count: totalVivos },
    { count: totalMuertos },
    { data: animalesSexo },
    { data: campos, error: errCampos },
    { data: movimientos, error: errMovimientos },
  ] = await Promise.all([
    supabase.from("animales").select("*", { count: "exact", head: true })
      .eq("empresa_id", empresaId).eq("activo", true).eq("vivo", true),
    supabase.from("animales").select("*", { count: "exact", head: true })
      .eq("empresa_id", empresaId).eq("activo", true).eq("vivo", false),
    supabase.from("animales").select("sexo")
      .eq("empresa_id", empresaId).eq("activo", true).eq("vivo", true),
    supabase.from("campos").select("id, nombre, capacidad_max, activo")
      .eq("empresa_id", empresaId).eq("activo", true),
    supabase.from("movimientos_campo")
      .select("id, fecha_movimiento, motivo, animal:animal_id(chip_id), origen:campo_origen_id(nombre), destino:campo_destino_id(nombre)")
      .order("fecha_movimiento", { ascending: false }).limit(10),
  ]);

  const machos = animalesSexo?.filter((a) => a.sexo === "macho").length ?? 0;
  const hembras = animalesSexo?.filter((a) => a.sexo === "hembra").length ?? 0;

  const { data: conteoXCampo } = await supabase
    .from("animales").select("campo_actual_id")
    .eq("empresa_id", empresaId).eq("activo", true).eq("vivo", true);

  const conteoPorCampo: Record<string, number> = {};
  conteoXCampo?.forEach((a) => {
    if (a.campo_actual_id)
      conteoPorCampo[a.campo_actual_id] = (conteoPorCampo[a.campo_actual_id] ?? 0) + 1;
  });

  return (
    <div className="space-y-8">
      <h1 className="text-2xl font-bold text-gray-800">Panel General</h1>

      {(errCampos || errMovimientos) && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-700 font-semibold">Error al cargar datos</p>
          <p className="text-red-600 text-sm font-mono">
            {(errCampos || errMovimientos)?.message}
          </p>
        </div>
      )}

      {/* Tarjetas de resumen */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <p className="text-sm text-gray-500">Animales vivos</p>
          <p className="text-4xl font-bold text-gray-800 mt-1">{totalVivos ?? 0}</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <p className="text-sm text-gray-500">Machos / Hembras</p>
          <p className="text-4xl font-bold text-gray-800 mt-1">
            {machos} <span className="text-2xl font-normal text-gray-400">/</span> {hembras}
          </p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <p className="text-sm text-gray-500">Campos activos</p>
          <p className="text-4xl font-bold text-gray-800 mt-1">{campos?.length ?? 0}</p>
        </div>
        <div className={`rounded-xl border p-6 ${(totalMuertos ?? 0) > 0 ? "bg-red-50 border-red-200" : "bg-white border-gray-200"}`}>
          <p className="text-sm text-gray-500">Animales muertos</p>
          <p className={`text-4xl font-bold mt-1 ${(totalMuertos ?? 0) > 0 ? "text-red-700" : "text-gray-300"}`}>
            {totalMuertos ?? 0}
          </p>
        </div>
      </div>

      {/* Sección campos */}
      <div>
        <h2 className="text-lg font-semibold text-gray-700 mb-3">Campos</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {campos?.map((campo) => {
            const cantidad = conteoPorCampo[campo.id] ?? 0;
            const pct = campo.capacidad_max && campo.capacidad_max > 0
              ? Math.min(100, Math.round((cantidad / campo.capacidad_max) * 100))
              : null;
            return (
              <div key={campo.id} className="bg-white rounded-xl border border-gray-200 p-5">
                <p className="font-semibold text-gray-800">{campo.nombre}</p>
                <p className="text-sm text-gray-500 mt-1">
                  {cantidad} animales{campo.capacidad_max ? ` de ${campo.capacidad_max}` : ""}
                </p>
                {pct !== null && (
                  <div className="mt-3">
                    <div className="flex justify-between text-xs text-gray-400 mb-1">
                      <span>Ocupación</span><span>{pct}%</span>
                    </div>
                    <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full ${pct >= 90 ? "bg-red-400" : pct >= 70 ? "bg-yellow-400" : "bg-green-400"}`}
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Últimos movimientos */}
      <div>
        <h2 className="text-lg font-semibold text-gray-700 mb-3">Últimos movimientos</h2>
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          {movimientos && movimientos.length > 0 ? (
            <table className="w-full text-sm">
              <thead className="bg-gray-50 text-gray-500 text-xs uppercase">
                <tr>
                  <th className="px-4 py-3 text-left">Fecha</th>
                  <th className="px-4 py-3 text-left">Animal (chip)</th>
                  <th className="px-4 py-3 text-left">Origen</th>
                  <th className="px-4 py-3 text-left">Destino</th>
                  <th className="px-4 py-3 text-left">Motivo</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {movimientos.map((m) => (
                  <tr key={m.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 text-gray-600 whitespace-nowrap">{formatDate(m.fecha_movimiento)}</td>
                    <td className="px-4 py-3 font-mono text-gray-700">
                      {(m.animal as { chip_id: string } | null)?.chip_id ?? "—"}
                    </td>
                    <td className="px-4 py-3 text-gray-600">{(m.origen as { nombre: string } | null)?.nombre ?? "—"}</td>
                    <td className="px-4 py-3 text-gray-600">{(m.destino as { nombre: string } | null)?.nombre ?? "—"}</td>
                    <td className="px-4 py-3 text-gray-500">{m.motivo ?? "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <p className="px-4 py-6 text-gray-400 text-sm">Sin movimientos registrados</p>
          )}
        </div>
      </div>
    </div>
  );
}
