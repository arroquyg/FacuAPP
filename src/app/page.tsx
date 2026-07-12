import { createAdminClient } from "@/lib/supabase/admin";
import { getCurrentUser, getCamposOperario } from "@/lib/auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import CaravanasCard from "./caravanas/CaravanasCard";
import AlertaMuertos from "./AlertaMuertos";

// UUID inválido → fuerza 0 filas en Supabase cuando el operario no tiene campos asignados
const EMPRESA_SIN_CAMPOS = "00000000-0000-0000-0000-000000000000";

type MovimientoCampo = {
  id: string;
  fecha_movimiento: string;
  motivo: string | null;
  animal: { chip_id: string } | null;
  origen: { nombre: string } | null;
  destino: { nombre: string } | null;
};

function formatDate(dateStr: string | null) {
  if (!dateStr) return "—";
  return new Date(dateStr).toLocaleDateString("es-AR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

export default async function DashboardPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const supabase = createAdminClient();
  const empresaId = user.empresa_id;

  let campoIds: string[] | null = null;
  let campoNombres: string[] | null = null;
  if (user.rol === "operario") {
    campoIds = await getCamposOperario(user.id);
    if (campoIds.length > 0) {
      const { data: camposData } = await supabase.from("campos").select("nombre").in("id", campoIds);
      campoNombres = camposData?.map((c) => c.nombre) ?? [];
    } else {
      campoNombres = [];
    }
  }

  let qVivos = supabase.from("animales").select("*", { count: "exact", head: true }).eq("empresa_id", empresaId).eq("activo", true).eq("vivo", true);
  let qMuertos = supabase.from("animales").select("*", { count: "exact", head: true }).eq("empresa_id", empresaId).eq("activo", true).eq("vivo", false);

  if (campoIds !== null && campoIds.length > 0) {
    qVivos = qVivos.in("campo_actual_id", campoIds);
    qMuertos = qMuertos.in("campo_actual_id", campoIds);
  }

  let qCampos = supabase.from("campos").select("id, nombre, capacidad_max, activo").eq("activo", true);
  if (campoIds !== null) {
    qCampos = campoIds.length > 0 ? qCampos.in("id", campoIds) : qCampos.eq("empresa_id", EMPRESA_SIN_CAMPOS);
  } else {
    qCampos = qCampos.eq("empresa_id", empresaId);
  }

  // Necesitamos los campo IDs de la empresa para filtrar movimientos correctamente
  let campoIdsParaMovimientos: string[] = campoIds ?? [];
  if (campoIds === null) {
    const { data: camposEmpresa } = await supabase
      .from("campos")
      .select("id")
      .eq("empresa_id", empresaId)
      .eq("activo", true);
    campoIdsParaMovimientos = camposEmpresa?.map((c) => c.id) ?? [];
  }

  let qTrabajos = supabase.from("trabajos").select("*", { count: "exact", head: true }).eq("empresa_id", empresaId);
  if (campoNombres !== null && campoNombres.length > 0) {
    qTrabajos = qTrabajos.in("campo", campoNombres);
  }

  const sinMovimientos = Promise.resolve({ data: [], error: null });
  const sinConteo = Promise.resolve({ count: 0, data: null, error: null });

  // Paginación de categorías para no truncar en el límite de 1000 filas de Supabase
  type CatRow = { campo_actual_id: string | null; categoria: string | null };
  let categoriasRaw: CatRow[] = [];
  if (campoIds === null || campoIds.length > 0) {
    const PAGE = 1000;
    let from = 0;
    while (true) {
      let q = supabase
        .from("animales")
        .select("campo_actual_id, categoria")
        .eq("empresa_id", empresaId)
        .eq("activo", true)
        .eq("vivo", true)
        .range(from, from + PAGE - 1);
      if (campoIds !== null && campoIds.length > 0) {
        q = q.in("campo_actual_id", campoIds);
      }
      const { data } = await q;
      if (!data || data.length === 0) break;
      categoriasRaw = categoriasRaw.concat(data as CatRow[]);
      if (data.length < PAGE) break;
      from += PAGE;
    }
  }

  const [
    { count: totalVivos },
    { count: totalMuertos },
    { data: campos, error: errCampos },
    { data: movimientosRaw, error: errMovimientos },
    { count: totalTrabajos },
    // RPC agrega en la BD — devuelve una fila por campo, sin límite de filas
    { data: conteoRpc },
    { data: sexoRpc },
  ] = await Promise.all([
    campoIds !== null && campoIds.length === 0 ? sinConteo : qVivos,
    campoIds !== null && campoIds.length === 0 ? sinConteo : qMuertos,
    qCampos,
    campoIdsParaMovimientos.length > 0
      ? supabase.from("movimientos_campo")
          .select("id, fecha_movimiento, motivo, animal:animal_id(chip_id), origen:campo_origen_id(nombre), destino:campo_destino_id(nombre)")
          .or(`campo_origen_id.in.(${campoIdsParaMovimientos.join(",")}),campo_destino_id.in.(${campoIdsParaMovimientos.join(",")})`)
          .order("fecha_movimiento", { ascending: false })
          .limit(10)
      : sinMovimientos,
    campoNombres !== null && campoNombres.length === 0 ? sinConteo : qTrabajos,
    supabase.rpc("contar_animales_por_campo", { p_empresa_id: empresaId }),
    supabase.rpc("contar_animales_por_sexo", { p_empresa_id: empresaId }),
  ]);

  const movimientos = movimientosRaw as MovimientoCampo[] | null;

  const { data: empresaData } = user.rol === "administrador"
    ? await supabase.from("empresas").select("caravanas_compradas, caravanas_bajas").eq("id", empresaId).single()
    : { data: null };

  // Para operario: filtrar los resultados del RPC por sus campos asignados
  const conteoFiltrado = campoIds !== null
    ? (conteoRpc ?? []).filter((r: { campo_actual_id: string }) => campoIds.includes(r.campo_actual_id))
    : (conteoRpc ?? []);

  const sexoFiltrado = campoIds !== null && campoIds.length > 0
    ? null // para operario usamos los counts filtrados de qVivos (ya filtrado por campo)
    : (sexoRpc ?? []);

  const machos = sexoFiltrado
    ? (sexoFiltrado as { sexo: string; cantidad: number }[]).find((s) => s.sexo === "macho")?.cantidad ?? 0
    : 0;
  const hembras = sexoFiltrado
    ? (sexoFiltrado as { sexo: string; cantidad: number }[]).find((s) => s.sexo === "hembra")?.cantidad ?? 0
    : 0;

  const conteoPorCampo: Record<string, number> = {};
  conteoFiltrado.forEach((r: { campo_actual_id: string; cantidad: number }) => {
    conteoPorCampo[r.campo_actual_id] = Number(r.cantidad);
  });

  const conteoPorCategoria: Record<string, number> = {};
  const catPorCampo: Record<string, Record<string, number>> = {};
  for (const a of categoriasRaw ?? []) {
    const cat = a.categoria ?? "Sin categoría";
    conteoPorCategoria[cat] = (conteoPorCategoria[cat] ?? 0) + 1;
    if (a.campo_actual_id) {
      if (!catPorCampo[a.campo_actual_id]) catPorCampo[a.campo_actual_id] = {};
      catPorCampo[a.campo_actual_id][cat] = (catPorCampo[a.campo_actual_id][cat] ?? 0) + 1;
    }
  }
  const categoriasOrdenadas = Object.entries(conteoPorCategoria).sort(([, a], [, b]) => b - a);

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="border-b border-stone-200 pb-5">
        <h1 className="text-3xl font-bold text-stone-800">Resumen del establecimiento</h1>
        <p className="text-stone-500 mt-1 text-sm">Estado actual del rodeo y actividad reciente</p>
      </div>

      {(errCampos || errMovimientos) && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4">
          <p className="text-red-700 font-semibold">Error al cargar datos</p>
          <p className="text-red-600 text-sm font-mono mt-1">{(errCampos || errMovimientos)?.message}</p>
        </div>
      )}

      {/* Control de caravanas — solo admin */}
      {user.rol === "administrador" && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <CaravanasCard
            compradas={empresaData?.caravanas_compradas ?? 0}
            bajas={empresaData?.caravanas_bajas ?? 0}
            activos={totalVivos ?? 0}
          />
        </div>
      )}

      {/* Tarjetas de resumen */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl border border-stone-200 p-5 border-l-4 border-l-green-600 shadow-sm">
          <p className="text-xs font-semibold text-stone-400 uppercase tracking-wider">Animales vivos</p>
          <p className="text-4xl font-bold text-stone-800 mt-2">{totalVivos ?? 0}</p>
        </div>

        <div className="bg-white rounded-xl border border-stone-200 p-5 border-l-4 border-l-green-400 shadow-sm">
          <p className="text-xs font-semibold text-stone-400 uppercase tracking-wider">Machos / Hembras</p>
          <p className="text-3xl font-bold text-stone-800 mt-2">
            {machos} <span className="text-xl font-normal text-stone-300">/</span> {hembras}
          </p>
        </div>

        <div className="bg-white rounded-xl border border-stone-200 p-5 border-l-4 border-l-amber-500 shadow-sm">
          <p className="text-xs font-semibold text-stone-400 uppercase tracking-wider">Campos activos</p>
          <p className="text-4xl font-bold text-stone-800 mt-2">{campos?.length ?? 0}</p>
        </div>

        <div className="bg-white rounded-xl border border-stone-200 p-5 border-l-4 border-l-emerald-600 shadow-sm">
          <p className="text-xs font-semibold text-stone-400 uppercase tracking-wider">Trabajos realizados</p>
          <p className="text-4xl font-bold text-stone-800 mt-2">{totalTrabajos ?? 0}</p>
        </div>
      </div>

      {/* Alerta muertos */}
      <AlertaMuertos totalMuertos={totalMuertos ?? 0} />

      {/* Animales por categoría — totales */}
      {categoriasOrdenadas.length > 0 && (
        <div>
          <h2 className="text-lg font-semibold text-stone-700 mb-4">Animales por categoría</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
            {categoriasOrdenadas.map(([cat, count]) => (
              <div
                key={cat}
                className="bg-white rounded-xl border border-stone-200 px-4 py-3 shadow-sm"
              >
                <p className="text-xs text-stone-400 truncate" title={cat}>{cat}</p>
                <p className="text-3xl font-bold text-stone-800 mt-1">{count}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Campos */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-stone-700">Campos</h2>
          {user.rol === "administrador" && (
            <Link href="/configuracion" className="text-sm text-green-700 hover:underline font-medium">
              Administrar →
            </Link>
          )}
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {(campos ?? []).length === 0 ? (
            <p className="text-stone-400 text-sm col-span-3">No hay campos configurados.</p>
          ) : (
            campos!.map((campo) => {
              const cantidad = conteoPorCampo[campo.id] ?? 0;
              const pct =
                campo.capacidad_max && campo.capacidad_max > 0
                  ? Math.min(100, Math.round((cantidad / campo.capacidad_max) * 100))
                  : null;
              const catsDelCampo = Object.entries(catPorCampo[campo.id] ?? {}).sort(
                ([, a], [, b]) => b - a
              );
              return (
                <div key={campo.id} className="bg-white rounded-xl border border-stone-200 shadow-sm hover:shadow-md transition-shadow">
                  <div className="p-5">
                    <p className="font-semibold text-stone-800 text-base">{campo.nombre}</p>
                    <p className="text-sm text-stone-500 mt-1">
                      <span className="font-medium text-stone-700">{cantidad}</span>
                      {campo.capacidad_max ? ` de ${campo.capacidad_max} animales` : " animales"}
                    </p>
                    {pct !== null && (
                      <div className="mt-4">
                        <div className="flex justify-between text-xs text-stone-400 mb-1.5">
                          <span>Ocupación</span>
                          <span className={pct >= 90 ? "text-red-500 font-medium" : pct >= 70 ? "text-amber-500 font-medium" : "text-green-600 font-medium"}>
                            {pct}%
                          </span>
                        </div>
                        <div className="h-2 bg-stone-100 rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full transition-all ${
                              pct >= 90 ? "bg-red-400" : pct >= 70 ? "bg-amber-400" : "bg-green-500"
                            }`}
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                      </div>
                    )}
                  </div>
                  {catsDelCampo.length > 0 && (
                    <div className="border-t border-stone-100 px-5 py-3 grid grid-cols-2 gap-x-4 gap-y-1.5">
                      {catsDelCampo.map(([cat, count]) => (
                        <div key={cat} className="flex items-center justify-between gap-1 min-w-0">
                          <span className="text-xs text-stone-400 truncate" title={cat}>{cat}</span>
                          <span className="text-xs font-semibold text-stone-700 shrink-0">{count}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Últimos movimientos */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-stone-700">Últimos movimientos</h2>
          <Link href="/movimientos" className="text-sm text-green-700 hover:underline font-medium">
            Ver todos →
          </Link>
        </div>
        {movimientos && movimientos.length > 0 ? (
          <>
            {/* Mobile cards */}
            <div className="md:hidden space-y-2">
              {movimientos.map((m) => {
                const chip = m.animal?.chip_id ?? "—";
                const origen = m.origen?.nombre ?? "—";
                const destino = m.destino?.nombre ?? "—";
                return (
                  <div key={m.id} className="bg-white rounded-xl border border-stone-200 p-4 shadow-sm">
                    <div className="flex items-start justify-between gap-2">
                      <span className="font-mono text-sm font-semibold text-stone-700">{chip}</span>
                      <span className="text-xs text-stone-400 shrink-0">{formatDate(m.fecha_movimiento)}</span>
                    </div>
                    <div className="mt-2 flex items-center gap-1.5 text-xs text-stone-500">
                      <span className="font-medium text-stone-600">{origen}</span>
                      <span>→</span>
                      <span className="font-medium text-stone-600">{destino}</span>
                    </div>
                    {m.motivo && <p className="mt-1 text-xs text-stone-400">{m.motivo}</p>}
                  </div>
                );
              })}
            </div>
            {/* Desktop table */}
            <div className="hidden md:block bg-white rounded-xl border border-stone-200 shadow-sm overflow-x-auto">
              <table className="w-full min-w-max text-sm">
                <thead className="bg-stone-50 text-stone-400 text-xs uppercase border-b border-stone-100">
                  <tr>
                    <th className="px-4 py-3 text-left tracking-wider">Fecha</th>
                    <th className="px-4 py-3 text-left tracking-wider">Caravana</th>
                    <th className="px-4 py-3 text-left tracking-wider">Origen</th>
                    <th className="px-4 py-3 text-left tracking-wider">Destino</th>
                    <th className="px-4 py-3 text-left tracking-wider">Motivo</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-50">
                  {movimientos.map((m) => (
                    <tr key={m.id} className="hover:bg-stone-50 transition-colors">
                      <td className="px-4 py-3 text-stone-500 whitespace-nowrap">{formatDate(m.fecha_movimiento)}</td>
                      <td className="px-4 py-3 font-mono text-stone-700 text-xs">
                        {m.animal?.chip_id ?? "—"}
                      </td>
                      <td className="px-4 py-3 text-stone-600">{m.origen?.nombre ?? "—"}</td>
                      <td className="px-4 py-3 text-stone-600">{m.destino?.nombre ?? "—"}</td>
                      <td className="px-4 py-3 text-stone-400">{m.motivo ?? "—"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        ) : (
          <div className="bg-white rounded-xl border border-stone-200 px-4 py-10 text-center shadow-sm">
            <p className="text-stone-400 text-sm">Sin movimientos registrados</p>
          </div>
        )}
      </div>
    </div>
  );
}
