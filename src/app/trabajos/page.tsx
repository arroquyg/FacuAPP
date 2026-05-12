import { createAdminClient } from "@/lib/supabase/admin";
import { getCurrentUser, getCamposOperario } from "@/lib/auth";
import { redirect } from "next/navigation";
import Link from "next/link";

function formatDate(d: string) {
  return new Date(d + "T00:00:00").toLocaleDateString("es-AR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

export default async function TrabajosPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const sb = createAdminClient();
  const empresaId = user.empresa_id;

  let query = sb
    .from("trabajos")
    .select("id, tipo, veterinario, campo, fecha, total_chips")
    .eq("empresa_id", empresaId)
    .order("fecha", { ascending: false });

  if (user.rol === "operario") {
    const campoIds = await getCamposOperario(user.id);
    if (campoIds.length === 0) {
      // No tiene campos asignados — mostrar vacío
      return (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold text-stone-800">Trabajos</h1>
              <p className="text-stone-500 mt-1 text-sm">Registro de actividades veterinarias y de campo</p>
            </div>
          </div>
          <div className="bg-white rounded-xl border border-stone-200 p-10 text-center shadow-sm">
            <p className="text-stone-400 text-sm">No tenés campos asignados todavía.</p>
          </div>
        </div>
      );
    }
    // Para operario filtrar por nombre de campo (campo es text, no FK)
    const { data: camposData } = await sb.from("campos").select("nombre").in("id", campoIds);
    const nombresCampos = (camposData ?? []).map((c) => c.nombre);
    if (nombresCampos.length > 0) {
      query = query.in("campo", nombresCampos);
    }
  }

  const { data: trabajos, error } = await query;
  const esAdmin = user.rol === "administrador";

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-stone-800">Trabajos</h1>
          <p className="text-stone-500 mt-1 text-sm">Registro de actividades veterinarias y de campo</p>
        </div>
        {esAdmin && (
          <Link
            href="/trabajos/nuevo"
            className="self-start sm:self-auto px-4 py-2 bg-green-800 text-white rounded-lg text-sm hover:bg-green-700 transition-colors"
          >
            Nuevo trabajo
          </Link>
        )}
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-700 font-semibold">Error al cargar trabajos</p>
          <p className="text-red-600 text-sm font-mono">{error.message}</p>
        </div>
      )}

      {(trabajos ?? []).length === 0 ? (
        <div className="bg-white rounded-xl border border-stone-200 p-10 text-center shadow-sm">
          <p className="text-stone-400 text-sm">No hay trabajos registrados todavía.</p>
        </div>
      ) : (
        <>
          {/* Mobile cards */}
          <div className="md:hidden space-y-3">
            {(trabajos ?? []).map((t) => (
              <Link key={t.id} href={`/trabajos/${t.id}`} className="block bg-white rounded-xl border border-stone-200 p-4 shadow-sm active:bg-stone-50">
                <div className="flex items-start justify-between gap-2">
                  <p className="font-semibold text-stone-800 leading-snug">{t.tipo}</p>
                  <span className="shrink-0 text-xs font-mono bg-stone-100 text-stone-600 px-2 py-1 rounded-full">{t.total_chips} chips</span>
                </div>
                <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-stone-500">
                  <span>{formatDate(t.fecha)}</span>
                  <span>{t.veterinario}</span>
                  <span>{t.campo}</span>
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
                  <th className="px-4 py-3 text-left">Tipo de trabajo</th>
                  <th className="px-4 py-3 text-left">Veterinario</th>
                  <th className="px-4 py-3 text-left">Campo</th>
                  <th className="px-4 py-3 text-center">Chips</th>
                  <th className="px-4 py-3"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100">
                {(trabajos ?? []).map((t) => (
                  <tr key={t.id} className="hover:bg-stone-50">
                    <td className="px-4 py-3">{formatDate(t.fecha)}</td>
                    <td className="px-4 py-3 font-medium">{t.tipo}</td>
                    <td className="px-4 py-3 text-stone-600">{t.veterinario}</td>
                    <td className="px-4 py-3 text-stone-600">{t.campo}</td>
                    <td className="px-4 py-3 text-center font-mono text-stone-700">{t.total_chips}</td>
                    <td className="px-4 py-3 text-right">
                      <Link href={`/trabajos/${t.id}`} className="text-green-700 hover:underline text-xs font-medium">
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
