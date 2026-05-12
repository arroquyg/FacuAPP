import { createAdminClient } from "@/lib/supabase/admin";
import Link from "next/link";
import { notFound } from "next/navigation";
import { formatearValor, getTipoColumna } from "@/lib/columnas-clinicas";

function formatDate(d: string) {
  return new Date(d + "T00:00:00").toLocaleDateString("es-AR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

export default async function TrabajoDetallePage({ params }: { params: { id: string } }) {
  const sb = createAdminClient();
  const empresaId = process.env.EMPRESA_ID!;

  const [{ data: trabajo }, { data: registros }] = await Promise.all([
    sb.from("trabajos").select("*").eq("id", params.id).eq("empresa_id", empresaId).single(),
    sb
      .from("trabajo_registros")
      .select("*, animal:animal_id(chip_id, numero_caravana)")
      .eq("trabajo_id", params.id)
      .order("created_at"),
  ]);

  if (!trabajo) notFound();

  const columnas: string[] = trabajo.columnas ?? [];
  const todos = registros ?? [];
  const noEncontrados = todos.filter((r) => !r.encontrado);

  const datoKeys = ["dato1", "dato2", "dato3", "dato4", "dato5", "dato6", "dato7", "dato8", "dato9", "dato10"] as const;

  return (
    <div className="space-y-6">
      <div className="border-b border-stone-200 pb-5">
        <Link href="/trabajos" className="text-sm text-stone-400 hover:text-green-700 transition-colors">
          ← Trabajos
        </Link>
        <h1 className="text-3xl font-bold text-stone-800 mt-2">{trabajo.tipo}</h1>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {[
          { label: "Veterinario", value: trabajo.veterinario },
          { label: "Campo", value: trabajo.campo },
          { label: "Fecha", value: formatDate(trabajo.fecha) },
          { label: "Chips registrados", value: trabajo.total_chips },
        ].map(({ label, value }) => (
          <div key={label} className="bg-white rounded-xl border border-stone-200 p-4 shadow-sm">
            <p className="text-xs font-semibold text-stone-400 uppercase tracking-wider">{label}</p>
            <p className="font-semibold text-stone-800 mt-1.5 text-lg">{value}</p>
          </div>
        ))}
      </div>

      <div className="flex justify-end">
        <Link
          href={`/trabajos/${params.id}/importar`}
          className="px-4 py-2 border border-stone-300 rounded-lg text-sm hover:bg-stone-50"
        >
          Importar datos CSV
        </Link>
      </div>

      {noEncontrados.length > 0 && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <p className="text-yellow-800 font-semibold text-sm">
            {noEncontrados.length} chip{noEncontrados.length !== 1 ? "s" : ""} no encontrado{noEncontrados.length !== 1 ? "s" : ""} en la base de datos
          </p>
          <p className="text-yellow-700 text-xs mt-1 font-mono break-all">
            {noEncontrados.map((r) => r.eid).join(", ")}
          </p>
        </div>
      )}

      <div className="bg-white rounded-xl border border-stone-200 overflow-x-auto shadow-sm">
        <table className="w-full text-sm">
          <thead className="bg-stone-50 text-stone-400 uppercase text-xs border-b border-stone-100">
            <tr>
              <th className="px-4 py-3 text-left">Caravana</th>
              {columnas.map((col, i) => (
                <th key={i} className={`px-4 py-3 ${getTipoColumna(col) === "number" ? "text-right" : "text-left"}`}>
                  {col}
                  {getTipoColumna(col) === "number" && (
                    <span className="ml-1 text-blue-400 font-normal normal-case">#</span>
                  )}
                </th>
              ))}
              <th className="px-4 py-3 text-left">Estado</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-stone-100">
            {todos.length === 0 ? (
              <tr>
                <td colSpan={2 + columnas.length} className="px-4 py-8 text-center text-stone-400">
                  Sin registros
                </td>
              </tr>
            ) : (
              todos.map((r) => {
                const animal = r.animal as { chip_id: string; numero_caravana: string } | null;
                return (
                  <tr key={r.id} className={!r.encontrado ? "bg-yellow-50" : "hover:bg-stone-50"}>
                    <td className="px-4 py-3 font-medium">{r.eid}</td>
                    {datoKeys.slice(0, columnas.length).map((key, i) => {
                      const isNum = getTipoColumna(columnas[i]) === "number";
                      return (
                        <td key={i} className={`px-4 py-3 ${isNum ? "text-right font-mono text-stone-700" : "text-stone-600"}`}>
                          {formatearValor(columnas[i], r[key] as string | null)}
                        </td>
                      );
                    })}
                    <td className="px-4 py-3">
                      {r.encontrado ? (
                        <span className="text-xs font-medium text-green-600">OK</span>
                      ) : (
                        <span className="text-xs font-medium text-yellow-600">No en BD</span>
                      )}
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
