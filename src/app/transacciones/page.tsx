import { createAdminClient } from "@/lib/supabase/admin";
import FormTransaccion from "./FormTransaccion";
import HistorialTransacciones from "./HistorialTransacciones";

function formatDate(dateStr: string | null) {
  if (!dateStr) return "—";
  const d = new Date(dateStr + "T00:00:00");
  return d.toLocaleDateString("es-AR", { day: "2-digit", month: "2-digit", year: "numeric" });
}

export default async function TransaccionesPage() {
  const supabase = createAdminClient();
  const empresaId = process.env.EMPRESA_ID!;

  const { data: transacciones, error } = await supabase
    .from("transacciones")
    .select("id, tipo, fecha, contraparte, precio_total, numero_remito")
    .eq("empresa_id", empresaId)
    .order("fecha", { ascending: false })
    .limit(500);

  // Contar animales por transacción
  const { data: conteos } = await supabase
    .from("transaccion_animales")
    .select("transaccion_id");

  const conteoPorTransaccion: Record<string, number> = {};
  conteos?.forEach((c) => {
    conteoPorTransaccion[c.transaccion_id] = (conteoPorTransaccion[c.transaccion_id] ?? 0) + 1;
  });

  const historial = (transacciones ?? []).map((t) => ({
    id: t.id,
    tipo: t.tipo,
    fecha: formatDate(t.fecha),
    fechaRaw: t.fecha ?? "",
    contraparte: t.contraparte,
    precio_total: t.precio_total,
    numero_remito: t.numero_remito,
    cantidad_animales: conteoPorTransaccion[t.id] ?? 0,
  }));

  return (
    <div className="space-y-8">
      <h1 className="text-2xl font-bold text-stone-800">Transacciones</h1>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-700 font-semibold">Error al cargar historial</p>
          <p className="text-red-600 text-sm font-mono">{error.message}</p>
        </div>
      )}

      <FormTransaccion />
      <HistorialTransacciones transacciones={historial} />
    </div>
  );
}
