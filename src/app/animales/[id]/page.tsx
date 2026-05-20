import { createAdminClient } from "@/lib/supabase/admin";
import { getCurrentUser } from "@/lib/auth";
import { notFound, redirect } from "next/navigation";
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
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const supabase = createAdminClient();

  const [
    { data: animal, error },
    { data: movimientos },
    { data: pesajes },
    { data: eventos },
    { data: trabajosRegistros },
    { data: lotesAnimal },
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
    supabase
      .from("trabajo_registros")
      .select("id, dato1, dato2, dato3, dato4, dato5, dato6, dato7, dato8, dato9, dato10, trabajo:trabajo_id(id, tipo, fecha, veterinario, campo, columnas, empresa_id)")
      .eq("animal_id", params.id)
      .eq("encontrado", true)
      .order("created_at", { ascending: false }),
    supabase
      .from("lote_animales")
      .select("id, fecha_entrada, peso_entrada_kg, fecha_salida, peso_salida_kg, lote:lote_id(id, nombre, campo:campo_id(nombre), lote_alimentos(kg_por_dia, precio_por_tonelada))")
      .eq("animal_id", params.id)
      .order("fecha_entrada", { ascending: false }),
  ]);

  const today = new Date().toISOString().slice(0, 10);

  // Headcount por lote para calcular costo por animal
  const loteIds = [...new Set(
    (lotesAnimal ?? [])
      .map(la => (la.lote as unknown as { id: string } | null)?.id)
      .filter(Boolean) as string[]
  )];
  const { data: headcountData } = loteIds.length
    ? await supabase
        .from("lote_animales")
        .select("lote_id, animal_id")
        .eq("empresa_id", user.empresa_id)
        .in("lote_id", loteIds)
    : { data: [] };
  // Distinct por animal_id para no contar reingresos múltiples veces
  const headcountByLote = new Map<string, number>();
  const seenPairs = new Set<string>();
  for (const row of headcountData ?? []) {
    const key = `${row.lote_id}:${row.animal_id}`;
    if (!seenPairs.has(key)) {
      seenPairs.add(key);
      headcountByLote.set(row.lote_id, (headcountByLote.get(row.lote_id) ?? 0) + 1);
    }
  }

  // Último peso: el más reciente entre pesajes y pesos de lote
  const primerPesaje = (pesajes ?? [])[0];
  let loteUltimoPeso: { peso: number; fecha: string } | null = null;
  for (const la of (lotesAnimal ?? [])) {
    const fechaRef = la.fecha_salida ?? la.fecha_entrada;
    const pesoRef = la.fecha_salida != null ? (la.peso_salida_kg ?? null) : la.peso_entrada_kg;
    if (pesoRef != null && fechaRef && (!loteUltimoPeso || fechaRef > loteUltimoPeso.fecha)) {
      loteUltimoPeso = { peso: pesoRef, fecha: fechaRef };
    }
  }
  let ultimoPeso: number | null = null;
  if (primerPesaje && loteUltimoPeso) {
    ultimoPeso = primerPesaje.fecha_pesaje >= loteUltimoPeso.fecha
      ? primerPesaje.peso_kg : loteUltimoPeso.peso;
  } else {
    ultimoPeso = primerPesaje?.peso_kg ?? loteUltimoPeso?.peso ?? null;
  }

  // Costo nutricional total del animal
  const costoTotalNutricion = (lotesAnimal ?? []).reduce((sum, la) => {
    type LoteData = { id: string; lote_alimentos: { kg_por_dia: number; precio_por_tonelada: number }[] };
    const lote = la.lote as unknown as LoteData | null;
    const loteId = lote?.id ?? "";
    const headcount = headcountByLote.get(loteId) ?? 1;
    const costoDiarioLote = (lote?.lote_alimentos ?? []).reduce(
      (s, a) => s + (a.kg_por_dia * a.precio_por_tonelada) / 1000, 0
    );
    const fechaRef = la.fecha_salida ?? today;
    const dias = la.fecha_entrada
      ? Math.max(0, Math.floor((new Date(fechaRef).getTime() - new Date(la.fecha_entrada).getTime()) / 86400000))
      : 0;
    return sum + (costoDiarioLote / headcount) * dias;
  }, 0);

  // Resolución de nombres de empresa por separado para evitar dependencia de FK
  const empresaIds = [
    ...new Set(
      (trabajosRegistros ?? [])
        .map((r) => (r.trabajo as unknown as { empresa_id?: string } | null)?.empresa_id)
        .filter(Boolean) as string[]
    ),
  ];
  const { data: empresas } = empresaIds.length
    ? await supabase.from("empresas").select("id, nombre").in("id", empresaIds)
    : { data: [] };
  const empresaMap = new Map((empresas ?? []).map((e) => [e.id, e.nombre]));

  if (error || !animal) return notFound();

  const campo = animal.campo as unknown as { nombre: string } | null;

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
        {user.rol === "administrador" && (
          <a
            href={`/animales/${params.id}/editar`}
            className="px-4 py-2 border border-stone-300 rounded-lg text-sm text-stone-600 hover:bg-stone-50 transition-colors"
          >
            Editar
          </a>
        )}
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
          <Campo label="Genética/Empresa" value={animal.genetica_empresa} />
          <Campo
            label="Valor comercial"
            value={animal.valor_comercial ? `$${Number(animal.valor_comercial).toLocaleString("es-AR")}` : null}
          />
          <Campo label="Estado sanitario" value={animal.estado_sanitario} />
          <Campo label="Campo actual" value={campo?.nombre} />
          {ultimoPeso != null && (
            <Campo
              label="Último peso"
              value={`${Number(ultimoPeso).toFixed(0)} kg`}
            />
          )}
          {costoTotalNutricion > 0 && (
            <Campo
              label="Costo nutricional"
              value={`$${costoTotalNutricion.toLocaleString("es-AR", { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`}
            />
          )}
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
          origen: (m.origen as unknown as { nombre: string } | null)?.nombre ?? "—",
          destino: (m.destino as unknown as { nombre: string } | null)?.nombre ?? "—",
          motivo: m.motivo ?? "—",
          observaciones: m.observaciones ?? null,
        }))}
        pesajes={(pesajes ?? []).map((p) => ({
          id: p.id,
          fecha: formatDate(p.fecha_pesaje),
          peso: p.peso_kg,
          campo: (p.campo as unknown as { nombre: string } | null)?.nombre ?? "—",
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
        historialClinico={(trabajosRegistros ?? []).map((r) => {
          const trabajo = r.trabajo as unknown as { id: string; tipo: string; fecha: string; veterinario: string; campo: string; columnas: string[]; empresa_id?: string } | null;
          const datos: (string | null)[] = [r.dato1, r.dato2, r.dato3, r.dato4, r.dato5, r.dato6, r.dato7, r.dato8, r.dato9, r.dato10];
          return {
            id: r.id,
            trabajoId: trabajo?.id ?? "",
            fecha: formatDate(trabajo?.fecha ?? null),
            tipo: trabajo?.tipo ?? "—",
            veterinario: trabajo?.veterinario ?? "—",
            campo: trabajo?.campo ?? "—",
            columnas: trabajo?.columnas ?? [],
            empresa: empresaMap.get(trabajo?.empresa_id ?? "") ?? "—",
            datos,
          };
        })}
        nutricion={(lotesAnimal ?? []).map((la) => {
          type LoteData = { id: string; nombre: string; campo: { nombre: string } | null; lote_alimentos: { kg_por_dia: number; precio_por_tonelada: number }[] };
          const lote = la.lote as unknown as LoteData | null;
          const loteId = lote?.id ?? "";
          const headcount = headcountByLote.get(loteId) ?? 1;
          const fechaRef = la.fecha_salida ?? today;
          const dias = la.fecha_entrada
            ? Math.max(0, Math.floor((new Date(fechaRef).getTime() - new Date(la.fecha_entrada).getTime()) / 86400000))
            : 0;
          const kgGanados = la.peso_salida_kg != null ? la.peso_salida_kg - la.peso_entrada_kg : null;
          const pctGanado = kgGanados != null && la.peso_entrada_kg > 0
            ? parseFloat(((kgGanados / la.peso_entrada_kg) * 100).toFixed(1))
            : null;
          const costoDiarioLote = (lote?.lote_alimentos ?? []).reduce(
            (sum, a) => sum + (a.kg_por_dia * a.precio_por_tonelada) / 1000, 0
          );
          const costoAcum = (costoDiarioLote / headcount) * dias;
          return {
            id: la.id,
            loteId,
            loteNombre: lote?.nombre ?? "—",
            campo: (lote?.campo as unknown as { nombre: string } | null)?.nombre ?? "—",
            fechaEntrada: formatDate(la.fecha_entrada),
            fechaSalida: formatDate(la.fecha_salida),
            dias,
            pesoEntrada: la.peso_entrada_kg,
            pesoSalida: la.peso_salida_kg,
            kgGanados,
            pctGanado,
            costoAcum,
            activo: !la.fecha_salida,
          };
        })}
      />
    </div>
  );
}
