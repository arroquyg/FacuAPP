import { createAdminClient } from "@/lib/supabase/admin";
import { getCurrentUser, getCamposOperario } from "@/lib/auth";
import { redirect } from "next/navigation";
import FormMovimiento from "./FormMovimiento";
import HistorialMovimientos from "./HistorialMovimientos";

function formatDate(dateStr: string | null) {
  if (!dateStr) return "—";
  const d = new Date(dateStr + "T00:00:00");
  return d.toLocaleDateString("es-AR", { day: "2-digit", month: "2-digit", year: "numeric" });
}

export default async function MovimientosPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const sb = createAdminClient();
  const empresaId = user.empresa_id;
  const esAdmin = user.rol === "administrador";

  let campoIds: string[] | null = null;
  if (!esAdmin) {
    campoIds = await getCamposOperario(user.id);
  }

  const camposQuery = campoIds !== null
    ? sb.from("campos").select("id, nombre").in("id", campoIds.length > 0 ? campoIds : ["_"]).order("nombre")
    : sb.from("campos").select("id, nombre").eq("empresa_id", empresaId).eq("activo", true).order("nombre");

  let movQuery = sb
    .from("movimientos_campo")
    .select("id, fecha_movimiento, motivo, animal:animal_id(chip_id), origen:campo_origen_id(nombre), destino:campo_destino_id(nombre)")
    .order("fecha_movimiento", { ascending: false })
    .limit(500);

  if (campoIds !== null && campoIds.length > 0) {
    movQuery = movQuery.or(`campo_origen_id.in.(${campoIds.join(",")}),campo_destino_id.in.(${campoIds.join(",")})`);
  }

  const [{ data: campos }, { data: movimientos, error }] = await Promise.all([
    camposQuery,
    campoIds !== null && campoIds.length === 0
      ? Promise.resolve({ data: [], error: null })
      : movQuery,
  ]);

  const historial = (movimientos ?? []).map((m) => ({
    id: m.id,
    fecha: formatDate(m.fecha_movimiento),
    fechaRaw: m.fecha_movimiento ?? "",
    chip_id: (m.animal as unknown as { chip_id: string } | null)?.chip_id ?? "—",
    origen: (m.origen as unknown as { nombre: string } | null)?.nombre ?? "—",
    destino: (m.destino as unknown as { nombre: string } | null)?.nombre ?? "—",
    motivo: m.motivo ?? null,
  }));

  return (
    <div className="space-y-8">
      <div className="border-b border-stone-200 pb-5">
        <h1 className="text-3xl font-bold text-stone-800">Movimientos</h1>
        <p className="text-stone-500 mt-1 text-sm">Registro de traslados entre campos</p>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-700 font-semibold">Error al cargar historial</p>
          <p className="text-red-600 text-sm font-mono">{(error as { message: string }).message}</p>
        </div>
      )}

      {esAdmin && <FormMovimiento campos={campos ?? []} />}
      <HistorialMovimientos movimientos={historial} campos={campos ?? []} />
    </div>
  );
}
