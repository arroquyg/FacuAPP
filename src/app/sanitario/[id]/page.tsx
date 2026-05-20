import { createAdminClient } from "@/lib/supabase/admin";
import { getCurrentUser } from "@/lib/auth";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";

function formatDate(d: string) {
  return new Date(d + "T00:00:00").toLocaleDateString("es-AR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

export default async function SanitarioDetallePage({ params }: { params: { id: string } }) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const sb = createAdminClient();
  const empresaId = user.empresa_id;

  const [{ data: trabajo }, { data: eventos }] = await Promise.all([
    sb
      .from("sanitario_trabajos")
      .select("*")
      .eq("id", params.id)
      .eq("empresa_id", empresaId)
      .single(),
    sb
      .from("eventos_sanitarios")
      .select("id, animal_id, dosis, animal:animal_id(chip_id)")
      .eq("sanitario_trabajo_id", params.id)
      .order("created_at"),
  ]);

  if (!trabajo) notFound();

  const costo = trabajo.dosis != null && trabajo.precio_unitario != null
    ? trabajo.dosis * trabajo.precio_unitario
    : null;
  const costoTotal = costo != null ? costo * (trabajo.total_animales ?? 0) : null;

  return (
    <div className="space-y-6">
      <div className="border-b border-stone-200 pb-5">
        <Link href="/sanitario" className="text-sm text-stone-400 hover:text-green-700 transition-colors">
          ← Sanitario masivo
        </Link>
        <h1 className="text-3xl font-bold text-stone-800 mt-2">{trabajo.tipo_evento}</h1>
        {trabajo.producto && (
          <p className="text-stone-500 mt-1 text-sm">{trabajo.producto}</p>
        )}
      </div>

      {/* Info cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: "Fecha", value: formatDate(trabajo.fecha) },
          { label: "Veterinario", value: trabajo.veterinario ?? "—" },
          { label: "Animales registrados", value: trabajo.total_animales ?? 0 },
          { label: "Dosis", value: trabajo.dosis != null ? `${trabajo.dosis} ${trabajo.unidad ?? "ud"}` : "—" },
        ].map(({ label, value }) => (
          <div key={label} className="bg-white rounded-xl border border-stone-200 p-4 shadow-sm">
            <p className="text-xs font-semibold text-stone-400 uppercase tracking-wider">{label}</p>
            <p className="font-semibold text-stone-800 mt-1.5 text-lg">{value}</p>
          </div>
        ))}
      </div>

      {/* Costo total estimado */}
      {costoTotal != null && costoTotal > 0 && (
        <div className="bg-green-50 border border-green-200 rounded-xl p-4 flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-green-600 uppercase tracking-wider">Costo total estimado</p>
            <p className="text-2xl font-bold text-green-800 mt-0.5">
              ${costoTotal.toLocaleString("es-AR", { minimumFractionDigits: 2 })}
            </p>
          </div>
          <div className="text-xs text-green-600">
            ${costo!.toLocaleString("es-AR", { minimumFractionDigits: 2 })}/animal × {trabajo.total_animales} animales
          </div>
        </div>
      )}

      {trabajo.descripcion && (
        <div className="bg-stone-50 border border-stone-200 rounded-xl p-4 text-sm text-stone-600">
          <span className="font-medium text-stone-700">Descripción: </span>
          {trabajo.descripcion}
        </div>
      )}

      <div className="flex justify-start sm:justify-end">
        <Link
          href={`/sanitario/${params.id}/importar`}
          className="px-4 py-2 border border-stone-300 rounded-lg text-sm hover:bg-stone-50"
        >
          Importar animales (CSV)
        </Link>
      </div>

      {/* Lista de animales */}
      <div className="bg-white rounded-xl border border-stone-200 shadow-sm overflow-x-auto">
        <table className="w-full min-w-max text-sm">
          <thead className="bg-stone-50 text-stone-400 uppercase text-xs border-b border-stone-100">
            <tr>
              <th className="px-4 py-3 text-left">#</th>
              <th className="px-4 py-3 text-left">Caravana</th>
              <th className="px-4 py-3 text-right">Dosis aplicada</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-stone-100">
            {(eventos ?? []).length === 0 ? (
              <tr>
                <td colSpan={3} className="px-4 py-8 text-center text-stone-400">
                  Sin animales registrados aún. Importá un CSV.
                </td>
              </tr>
            ) : (
              (eventos ?? []).map((ev, i) => {
                const animal = ev.animal as { chip_id: string } | null;
                return (
                  <tr key={ev.id} className="hover:bg-stone-50">
                    <td className="px-4 py-3 text-stone-400 text-xs">{i + 1}</td>
                    <td className="px-4 py-3 font-medium">
                      {ev.animal_id ? (
                        <Link href={`/animales/${ev.animal_id}`} className="text-green-800 hover:underline">
                          {animal?.chip_id ?? "—"}
                        </Link>
                      ) : "—"}
                    </td>
                    <td className="px-4 py-3 text-right text-stone-600 font-mono">
                      {ev.dosis != null ? `${ev.dosis} ${trabajo.unidad ?? "ud"}` : "—"}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
