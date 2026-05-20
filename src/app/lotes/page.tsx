import { createAdminClient } from "@/lib/supabase/admin";
import { getCurrentUser } from "@/lib/auth";
import { redirect } from "next/navigation";
import Link from "next/link";

export default async function LotesPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const sb = createAdminClient();

  const { data: lotes } = await sb
    .from("lotes")
    .select("id, nombre, fecha_inicio, fecha_fin, activo, campo:campo_id(nombre)")
    .eq("empresa_id", user.empresa_id)
    .order("fecha_inicio", { ascending: false });

  // Cabezas por lote
  const loteIds = (lotes ?? []).map((l) => l.id);
  const { data: conteos } = loteIds.length
    ? await sb
        .from("lote_animales")
        .select("lote_id")
        .in("lote_id", loteIds)
        .is("fecha_salida", null)
    : { data: [] };

  const cabezasPorLote = new Map<string, number>();
  for (const c of conteos ?? []) {
    cabezasPorLote.set(c.lote_id, (cabezasPorLote.get(c.lote_id) ?? 0) + 1);
  }

  const activos = (lotes ?? []).filter((l) => l.activo);
  const cerrados = (lotes ?? []).filter((l) => !l.activo);

  function formatDate(d: string | null) {
    if (!d) return "—";
    return new Date(d + "T00:00:00").toLocaleDateString("es-AR", { day: "2-digit", month: "2-digit", year: "numeric" });
  }

  function LoteRow({ l }: { l: typeof lotes extends (infer T)[] | null ? T : never }) {
    const campo = l.campo as unknown as { nombre: string } | null;
    const cabezas = cabezasPorLote.get(l.id) ?? 0;
    return (
      <tr className="hover:bg-stone-50">
        <td className="px-4 py-3">
          <Link href={`/lotes/${l.id}`} className="font-medium text-stone-800 hover:text-green-800 hover:underline">
            {l.nombre}
          </Link>
        </td>
        <td className="px-4 py-3 text-stone-600">{campo?.nombre ?? "—"}</td>
        <td className="px-4 py-3 text-stone-600">{formatDate(l.fecha_inicio)}</td>
        <td className="px-4 py-3 text-stone-600">{l.fecha_fin ? formatDate(l.fecha_fin) : "—"}</td>
        <td className="px-4 py-3 text-stone-700 font-medium">{cabezas}</td>
        <td className="px-4 py-3">
          <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${l.activo ? "bg-green-100 text-green-700" : "bg-stone-100 text-stone-500"}`}>
            {l.activo ? "Activo" : "Cerrado"}
          </span>
        </td>
        <td className="px-4 py-3 text-right">
          <Link href={`/lotes/${l.id}`} className="text-xs text-stone-500 hover:text-stone-800 underline">
            Ver
          </Link>
        </td>
      </tr>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between border-b border-stone-200 pb-5">
        <div>
          <h1 className="text-3xl font-bold text-stone-800">Lotes</h1>
          <p className="text-stone-500 mt-1 text-sm">Separación de animales por lote para seguimiento nutricional</p>
        </div>
        <Link
          href="/lotes/nuevo"
          className="px-4 py-2 bg-green-800 text-white rounded-lg text-sm hover:bg-green-700 transition-colors"
        >
          + Nuevo lote
        </Link>
      </div>

      {/* Activos */}
      <div>
        <p className="text-xs font-semibold text-stone-400 uppercase tracking-wider mb-3">Lotes activos ({activos.length})</p>
        <div className="bg-white rounded-xl border border-stone-200 shadow-sm overflow-x-auto">
          {activos.length === 0 ? (
            <p className="px-4 py-8 text-center text-sm text-stone-400">No hay lotes activos</p>
          ) : (
            <table className="w-full min-w-max text-sm">
              <thead className="bg-stone-50 text-xs text-stone-500 uppercase">
                <tr>
                  <th className="px-4 py-3 text-left">Nombre</th>
                  <th className="px-4 py-3 text-left">Campo</th>
                  <th className="px-4 py-3 text-left">Inicio</th>
                  <th className="px-4 py-3 text-left">Fin</th>
                  <th className="px-4 py-3 text-left">Cabezas</th>
                  <th className="px-4 py-3 text-left">Estado</th>
                  <th className="px-4 py-3 text-right"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100">
                {activos.map((l) => <LoteRow key={l.id} l={l} />)}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Cerrados */}
      {cerrados.length > 0 && (
        <div>
          <p className="text-xs font-semibold text-stone-400 uppercase tracking-wider mb-3">Lotes cerrados ({cerrados.length})</p>
          <div className="bg-white rounded-xl border border-stone-200 shadow-sm overflow-x-auto">
            <table className="w-full min-w-max text-sm">
              <thead className="bg-stone-50 text-xs text-stone-500 uppercase">
                <tr>
                  <th className="px-4 py-3 text-left">Nombre</th>
                  <th className="px-4 py-3 text-left">Campo</th>
                  <th className="px-4 py-3 text-left">Inicio</th>
                  <th className="px-4 py-3 text-left">Fin</th>
                  <th className="px-4 py-3 text-left">Cabezas</th>
                  <th className="px-4 py-3 text-left">Estado</th>
                  <th className="px-4 py-3 text-right"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100">
                {cerrados.map((l) => <LoteRow key={l.id} l={l} />)}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
