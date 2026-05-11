import { createAdminClient } from "@/lib/supabase/admin";
import FormMovimiento from "./FormMovimiento";
import HistorialMovimientos from "./HistorialMovimientos";

function formatDate(dateStr: string | null) {
  if (!dateStr) return "—";
  const d = new Date(dateStr + "T00:00:00");
  return d.toLocaleDateString("es-AR", { day: "2-digit", month: "2-digit", year: "numeric" });
}

export default async function MovimientosPage() {
  const supabase = createAdminClient();
  const empresaId = process.env.EMPRESA_ID!;

  const [{ data: campos }, { data: movimientos, error }] = await Promise.all([
    supabase.from("campos").select("id, nombre").eq("empresa_id", empresaId).eq("activo", true).order("nombre"),
    supabase
      .from("movimientos_campo")
      .select("id, fecha_movimiento, motivo, animal:animal_id(chip_id), origen:campo_origen_id(nombre), destino:campo_destino_id(nombre)")
      .order("fecha_movimiento", { ascending: false })
      .limit(500),
  ]);

  const historial = (movimientos ?? []).map((m) => ({
    id: m.id,
    fecha: formatDate(m.fecha_movimiento),
    fechaRaw: m.fecha_movimiento ?? "",
    chip_id: (m.animal as { chip_id: string } | null)?.chip_id ?? "—",
    origen: (m.origen as { nombre: string } | null)?.nombre ?? "—",
    destino: (m.destino as { nombre: string } | null)?.nombre ?? "—",
    motivo: m.motivo ?? null,
  }));

  return (
    <div className="space-y-8">
      <h1 className="text-2xl font-bold text-gray-800">Movimientos</h1>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-700 font-semibold">Error al cargar historial</p>
          <p className="text-red-600 text-sm font-mono">{error.message}</p>
        </div>
      )}

      <FormMovimiento campos={campos ?? []} />
      <HistorialMovimientos movimientos={historial} campos={campos ?? []} />
    </div>
  );
}
