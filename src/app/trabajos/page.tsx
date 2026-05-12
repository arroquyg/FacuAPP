import { createAdminClient } from "@/lib/supabase/admin";
import Link from "next/link";

function formatDate(d: string) {
  return new Date(d + "T00:00:00").toLocaleDateString("es-AR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

export default async function TrabajosPage() {
  const sb = createAdminClient();
  const empresaId = process.env.EMPRESA_ID!;

  const { data: trabajos, error } = await sb
    .from("trabajos")
    .select("id, tipo, veterinario, campo, fecha, total_chips")
    .eq("empresa_id", empresaId)
    .order("fecha", { ascending: false });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-800">Trabajos</h1>
        <Link
          href="/trabajos/nuevo"
          className="px-4 py-2 bg-green-800 text-white rounded-lg text-sm hover:bg-green-700"
        >
          Nuevo trabajo
        </Link>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-700 font-semibold">Error al cargar trabajos</p>
          <p className="text-red-600 text-sm font-mono">{error.message}</p>
        </div>
      )}

      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-gray-500 uppercase text-xs">
            <tr>
              <th className="px-4 py-3 text-left">Fecha</th>
              <th className="px-4 py-3 text-left">Tipo de trabajo</th>
              <th className="px-4 py-3 text-left">Veterinario</th>
              <th className="px-4 py-3 text-left">Campo</th>
              <th className="px-4 py-3 text-center">Chips</th>
              <th className="px-4 py-3"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {(trabajos ?? []).length === 0 ? (
              <tr>
                <td colSpan={6} className="px-4 py-10 text-center text-gray-400">
                  No hay trabajos registrados todavía. Importá el CSV del bastón para comenzar.
                </td>
              </tr>
            ) : (
              (trabajos ?? []).map((t) => (
                <tr key={t.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3">{formatDate(t.fecha)}</td>
                  <td className="px-4 py-3 font-medium">{t.tipo}</td>
                  <td className="px-4 py-3 text-gray-600">{t.veterinario}</td>
                  <td className="px-4 py-3 text-gray-600">{t.campo}</td>
                  <td className="px-4 py-3 text-center font-mono text-gray-700">{t.total_chips}</td>
                  <td className="px-4 py-3 text-right">
                    <Link
                      href={`/trabajos/${t.id}`}
                      className="text-blue-600 hover:underline text-xs font-medium"
                    >
                      Ver detalle →
                    </Link>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
