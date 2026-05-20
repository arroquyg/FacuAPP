import { createAdminClient } from "@/lib/supabase/admin";
import { getCurrentUser } from "@/lib/auth";
import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import DisolverLote from "./DisolverLote";

function formatDate(d: string | null) {
  if (!d) return "—";
  return new Date(d + "T00:00:00").toLocaleDateString("es-AR", { day: "2-digit", month: "2-digit", year: "numeric" });
}

export default async function LotePage({ params }: { params: { id: string } }) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const sb = createAdminClient();

  const { data: lote } = await sb
    .from("lotes")
    .select("id, nombre, fecha_inicio, fecha_fin, activo, campo:campo_id(nombre)")
    .eq("id", params.id)
    .eq("empresa_id", user.empresa_id)
    .single();

  if (!lote) return notFound();

  const [{ data: alimentosLote }, { data: animalesLote }] = await Promise.all([
    sb.from("lote_alimentos")
      .select("id, kg_por_dia, precio_por_tonelada, alimento:alimento_id(nombre)")
      .eq("lote_id", params.id),
    sb.from("lote_animales")
      .select("id, fecha_entrada, peso_entrada_kg, fecha_salida, peso_salida_kg, animal:animal_id(id, chip_id)")
      .eq("lote_id", params.id)
      .order("fecha_entrada"),
  ]);

  const campo = lote.campo as unknown as { nombre: string } | null;
  const animalesActivos = (animalesLote ?? []).filter((a) => !a.fecha_salida);
  const today = new Date().toISOString().slice(0, 10);

  // Cálculos para lote activo
  const costoDiarioLote = (alimentosLote ?? []).reduce(
    (sum, a) => sum + (a.kg_por_dia * a.precio_por_tonelada) / 1000, 0
  );
  const nAnimales = animalesActivos.length;
  // Usa el total de animales del lote como denominador (no solo los activos)
  // evita que el costo acumulado quede en 0 cuando el lote está cerrado
  const totalAnimalesLote = (animalesLote ?? []).length;
  const costoDiarioAnimal = totalAnimalesLote > 0 ? costoDiarioLote / totalAnimalesLote : 0;

  function diasDesde(fecha: string) {
    const diff = new Date(today).getTime() - new Date(fecha).getTime();
    return Math.max(0, Math.floor(diff / 86400000));
  }

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between border-b border-stone-200 pb-5">
        <div>
          <p className="text-sm text-stone-400 mb-1">
            <Link href="/lotes" className="hover:text-green-700 transition-colors">Lotes</Link>
            <span className="mx-1">/</span>
            {lote.nombre}
          </p>
          <h1 className="text-3xl font-bold text-stone-800">{lote.nombre}</h1>
          <div className="flex items-center gap-3 mt-1">
            <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${lote.activo ? "bg-green-100 text-green-700" : "bg-stone-100 text-stone-500"}`}>
              {lote.activo ? "Activo" : "Cerrado"}
            </span>
            <span className="text-sm text-stone-500">{campo?.nombre ?? "—"}</span>
            <span className="text-sm text-stone-500">{formatDate(lote.fecha_inicio)} → {formatDate(lote.fecha_fin)}</span>
          </div>
        </div>
      </div>

      {/* Resumen */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: "Animales", value: String(nAnimales) },
          { label: "Costo diario lote", value: `$${costoDiarioLote.toLocaleString("es-AR", { minimumFractionDigits: 2 })}` },
          { label: "Costo/animal/día", value: `$${costoDiarioAnimal.toLocaleString("es-AR", { minimumFractionDigits: 2 })}` },
          { label: "Días activo", value: lote.activo ? String(diasDesde(lote.fecha_inicio)) : String(diasDesde(lote.fecha_inicio) + " (cerrado)") },
        ].map((s) => (
          <div key={s.label} className="bg-white rounded-xl border border-stone-200 p-4 shadow-sm">
            <p className="text-xs text-stone-400 uppercase tracking-wide">{s.label}</p>
            <p className="text-xl font-bold text-stone-800 mt-1">{s.value}</p>
          </div>
        ))}
      </div>

      {/* Alimentos */}
      <div className="bg-white rounded-xl border border-stone-200 shadow-sm p-6">
        <p className="font-medium text-stone-800 mb-4">Alimentos diarios</p>
        <div className="space-y-2">
          {(alimentosLote ?? []).map((a) => {
            const alim = a.alimento as unknown as { nombre: string } | null;
            const costoDia = (a.kg_por_dia * a.precio_por_tonelada) / 1000;
            return (
              <div key={a.id} className="flex items-center gap-4 p-3 bg-stone-50 rounded-lg border border-stone-200 text-sm">
                <span className="flex-1 font-medium text-stone-700">{alim?.nombre ?? "—"}</span>
                <span className="text-stone-500">{a.kg_por_dia} kg/día</span>
                <span className="text-stone-500">${Number(a.precio_por_tonelada).toLocaleString("es-AR")}/ton</span>
                <span className="text-stone-700 font-medium w-28 text-right">
                  ${costoDia.toLocaleString("es-AR", { minimumFractionDigits: 2 })}/día
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Animales */}
      <div className="bg-white rounded-xl border border-stone-200 shadow-sm p-6">
        <p className="font-medium text-stone-800 mb-4">
          Animales ({nAnimales} en lote)
        </p>
        <div className="overflow-x-auto -mx-6 px-6">
          <table className="w-full min-w-max text-sm">
            <thead className="text-xs text-stone-400 uppercase">
              <tr>
                <th className="pb-2 pr-4 text-left">Caravana</th>
                <th className="pb-2 pr-4 text-right">Peso entrada</th>
                <th className="pb-2 pr-4 text-right">Días en lote</th>
                <th className="pb-2 pr-4 text-right">Costo acumulado</th>
                {!lote.activo && <th className="pb-2 pr-4 text-right">Peso salida</th>}
                {!lote.activo && <th className="pb-2 text-right">Kg ganados</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100">
              {(animalesLote ?? []).map((a) => {
                const animal = a.animal as unknown as { id: string; chip_id: string } | null;
                const fechaRef = a.fecha_salida ?? today;
                const diff = new Date(fechaRef).getTime() - new Date(a.fecha_entrada).getTime();
                const dias = Math.max(0, Math.floor(diff / 86400000));
                const costoAcum = costoDiarioAnimal * dias;
                const kgGanados = a.peso_salida_kg != null ? a.peso_salida_kg - a.peso_entrada_kg : null;
                const pctGanado = kgGanados != null && a.peso_entrada_kg > 0
                  ? ((kgGanados / a.peso_entrada_kg) * 100).toFixed(1)
                  : null;
                return (
                  <tr key={a.id} className="hover:bg-stone-50">
                    <td className="py-2 pr-4">
                      {animal ? (
                        <Link href={`/animales/${animal.id}`} className="text-green-800 hover:underline font-mono text-xs">
                          {animal.chip_id}
                        </Link>
                      ) : "—"}
                    </td>
                    <td className="py-2 pr-4 text-right text-stone-600">{a.peso_entrada_kg} kg</td>
                    <td className="py-2 pr-4 text-right text-stone-600">{dias}</td>
                    <td className="py-2 pr-4 text-right text-stone-700">${costoAcum.toLocaleString("es-AR", { minimumFractionDigits: 2 })}</td>
                    {!lote.activo && (
                      <td className="py-2 pr-4 text-right text-stone-600">
                        {a.peso_salida_kg != null ? `${a.peso_salida_kg} kg` : "—"}
                      </td>
                    )}
                    {!lote.activo && (
                      <td className="py-2 text-right">
                        {kgGanados != null ? (
                          <span className={`font-medium ${kgGanados >= 0 ? "text-green-700" : "text-red-600"}`}>
                            {kgGanados > 0 ? "+" : ""}{kgGanados} kg
                            {pctGanado && <span className="text-xs ml-1 opacity-70">({pctGanado}%)</span>}
                          </span>
                        ) : "—"}
                      </td>
                    )}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Disolver */}
      {lote.activo && (
        <DisolverLote
          loteId={params.id}
          animales={(animalesLote ?? []).map((a) => ({
            id: a.id,
            chip_id: (a.animal as unknown as { chip_id: string } | null)?.chip_id ?? "—",
            peso_entrada_kg: a.peso_entrada_kg,
          }))}
        />
      )}
    </div>
  );
}
