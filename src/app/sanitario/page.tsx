import { createAdminClient } from "@/lib/supabase/admin";
import { getCurrentUser } from "@/lib/auth";
import { redirect } from "next/navigation";
import Link from "next/link";

function formatDate(d: string) {
  return new Date(d + "T00:00:00").toLocaleDateString("es-AR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

export default async function SanitarioPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const sb = createAdminClient();
  const { data: trabajos } = await sb
    .from("sanitario_trabajos")
    .select("id, tipo_evento, producto, dosis, unidad, veterinario, fecha, total_animales")
    .eq("empresa_id", user.empresa_id)
    .order("fecha", { ascending: false });

  const esAdmin = user.rol === "administrador";

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-stone-800">Sanitario masivo</h1>
          <p className="text-stone-500 mt-1 text-sm">Eventos sanitarios aplicados a múltiples animales</p>
        </div>
        {esAdmin && (
          <Link
            href="/sanitario/nuevo"
            className="self-start sm:self-auto px-4 py-2 bg-green-800 text-white rounded-lg text-sm hover:bg-green-700 transition-colors"
          >
            Nuevo evento masivo
          </Link>
        )}
      </div>

      {(trabajos ?? []).length === 0 ? (
        <div className="bg-white rounded-xl border border-stone-200 p-10 text-center shadow-sm">
          <p className="text-stone-400 text-sm">No hay eventos sanitarios masivos registrados todavía.</p>
        </div>
      ) : (
        <>
          {/* Mobile cards */}
          <div className="md:hidden space-y-3">
            {(trabajos ?? []).map((t) => (
              <Link key={t.id} href={`/sanitario/${t.id}`} className="block bg-white rounded-xl border border-stone-200 p-4 shadow-sm active:bg-stone-50">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="font-semibold text-stone-800 leading-snug">{t.tipo_evento}</p>
                    {t.producto && <p className="text-xs text-stone-500 mt-0.5">{t.producto}</p>}
                  </div>
                  <span className="shrink-0 text-xs font-mono bg-stone-100 text-stone-600 px-2 py-1 rounded-full">{t.total_animales} animales</span>
                </div>
                <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-stone-500">
                  <span>{formatDate(t.fecha)}</span>
                  {t.veterinario && <span>{t.veterinario}</span>}
                  {t.dosis != null && <span>{t.dosis} {t.unidad ?? "ud"}</span>}
                </div>
              </Link>
            ))}
          </div>

          {/* Desktop table */}
          <div className="hidden md:block bg-white rounded-xl border border-stone-200 shadow-sm overflow-x-auto">
            <table className="w-full min-w-max text-sm">
              <thead className="bg-stone-50 text-stone-400 uppercase text-xs border-b border-stone-100">
                <tr>
                  <th className="px-4 py-3 text-left">Fecha</th>
                  <th className="px-4 py-3 text-left">Tipo</th>
                  <th className="px-4 py-3 text-left">Producto</th>
                  <th className="px-4 py-3 text-left">Dosis</th>
                  <th className="px-4 py-3 text-left">Veterinario</th>
                  <th className="px-4 py-3 text-center">Animales</th>
                  <th className="px-4 py-3"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100">
                {(trabajos ?? []).map((t) => (
                  <tr key={t.id} className="hover:bg-stone-50">
                    <td className="px-4 py-3">{formatDate(t.fecha)}</td>
                    <td className="px-4 py-3 font-medium">{t.tipo_evento}</td>
                    <td className="px-4 py-3 text-stone-600">{t.producto ?? "—"}</td>
                    <td className="px-4 py-3 text-stone-600 font-mono">{t.dosis != null ? `${t.dosis} ${t.unidad ?? "ud"}` : "—"}</td>
                    <td className="px-4 py-3 text-stone-600">{t.veterinario ?? "—"}</td>
                    <td className="px-4 py-3 text-center font-mono text-stone-700">{t.total_animales}</td>
                    <td className="px-4 py-3 text-right">
                      <Link href={`/sanitario/${t.id}`} className="text-green-700 hover:underline text-xs font-medium">
                        Ver detalle →
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
}
