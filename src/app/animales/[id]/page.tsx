import { createAdminClient } from "@/lib/supabase/admin";
import { notFound } from "next/navigation";
import TabsAnimal from "./TabsAnimal";

function formatDate(dateStr: string | null) {
  if (!dateStr) return "—";
  const d = new Date(dateStr + "T00:00:00");
  return d.toLocaleDateString("es-AR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

function Campo({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div>
      <p className="text-xs text-stone-400 uppercase tracking-wide">{label}</p>
      <p className="text-sm text-stone-800 mt-0.5">{value ?? "—"}</p>
    </div>
  );
}

export default async function AnimalPage({
  params,
}: {
  params: { id: string };
}) {
  const supabase = createAdminClient();

  const [
    { data: animal, error },
    { data: movimientos },
    { data: pesajes },
    { data: eventos },
  ] = await Promise.all([
    supabase
      .from("animales")
      .select("*, campo:campo_actual_id(nombre)")
      .eq("id", params.id)
      .single(),
    supabase
      .from("movimientos_campo")
      .select("id, fecha_movimiento, motivo, observaciones, origen:campo_origen_id(nombre), destino:campo_destino_id(nombre)")
      .eq("animal_id", params.id)
      .order("fecha_movimiento", { ascending: false }),
    supabase
      .from("pesajes")
      .select("id, peso_kg, fecha_pesaje, campo:campo_id(nombre), observaciones")
      .eq("animal_id", params.id)
      .order("fecha_pesaje", { ascending: false }),
    supabase
      .from("eventos_sanitarios")
      .select("id, tipo_evento, fecha_evento, producto, dosis, veterinario, descripcion")
      .eq("animal_id", params.id)
      .order("fecha_evento", { ascending: false }),
  ]);

  if (error || !animal) return notFound();

  const campo = animal.campo as { nombre: string } | null;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 border-b border-stone-200 pb-5">
        <div>
          <p className="text-sm text-stone-400 mb-1">
            <a href="/animales" className="hover:text-green-700 transition-colors">Animales</a>
            <span className="mx-1">/</span>
            {animal.chip_id}
          </p>
          <h1 className="text-3xl font-bold text-stone-800">Caravana {animal.chip_id}</h1>
        </div>
        <a
          href={`/animales/${params.id}/editar`}
          className="px-4 py-2 border border-stone-300 rounded-lg text-sm text-stone-600 hover:bg-stone-50 transition-colors"
        >
          Editar
        </a>
      </div>

      <div className="bg-white rounded-xl border border-stone-200 p-6 shadow-sm">
        <h2 className="text-xs font-semibold text-stone-400 uppercase tracking-wider mb-5">
          Datos generales
        </h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-5">
          <Campo label="Caravana" value={animal.chip_id} />
          <Campo label="Categoría" value={animal.categoria} />
          <Campo label="Raza" value={animal.raza} />
          <Campo label="Sexo" value={animal.sexo} />
          <Campo label="Color / pelaje" value={animal.color_pelaje} />
          <Campo label="Fecha de nacimiento" value={formatDate(animal.fecha_nacimiento)} />
          <Campo label="Procedencia" value={animal.procedencia} />
          <Campo
            label="Valor comercial"
            value={animal.valor_comercial ? `$${Number(animal.valor_comercial).toLocaleString("es-AR")}` : null}
          />
          <Campo label="Estado sanitario" value={animal.estado_sanitario} />
          <Campo label="Campo actual" value={campo?.nombre} />
          <Campo
            label="Activo"
            value={
              <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${animal.activo ? "bg-green-100 text-green-700" : "bg-stone-100 text-stone-500"}`}>
                {animal.activo ? "Sí" : "No"}
              </span>
            }
          />
        </div>
      </div>

      <TabsAnimal
        movimientos={(movimientos ?? []).map((m) => ({
          id: m.id,
          fecha: formatDate(m.fecha_movimiento),
          origen: (m.origen as { nombre: string } | null)?.nombre ?? "—",
          destino: (m.destino as { nombre: string } | null)?.nombre ?? "—",
          motivo: m.motivo ?? "—",
          observaciones: m.observaciones ?? null,
        }))}
        pesajes={(pesajes ?? []).map((p) => ({
          id: p.id,
          fecha: formatDate(p.fecha_pesaje),
          peso: p.peso_kg,
          campo: (p.campo as { nombre: string } | null)?.nombre ?? "—",
          observaciones: p.observaciones ?? null,
        }))}
        eventos={(eventos ?? []).map((e) => ({
          id: e.id,
          fecha: formatDate(e.fecha_evento),
          tipo: e.tipo_evento ?? "—",
          producto: e.producto ?? "—",
          dosis: e.dosis,
          veterinario: e.veterinario ?? "—",
          descripcion: e.descripcion ?? null,
        }))}
      />
    </div>
  );
}
