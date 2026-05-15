import { createAdminClient } from "@/lib/supabase/admin";
import { getCurrentUser, getCamposOperario } from "@/lib/auth";
import { redirect } from "next/navigation";
import AnimalesTable, { type Animal } from "./AnimalesTable";

export default async function AnimalesPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const sb = createAdminClient();
  const empresaId = user.empresa_id;

  let campoIds: string[] | null = null;
  if (user.rol === "operario") {
    campoIds = await getCamposOperario(user.id);
  }

  let animales: Animal[] = [];
  let error = null;

  if (campoIds === null || campoIds.length > 0) {
    const PAGE = 1000;
    let from = 0;
    while (true) {
      let pageQuery = sb
        .from("animales")
        .select("id, chip_id, numero_caravana, categoria, raza, estado_sanitario, activo, vivo, campo:campo_actual_id(id, nombre)")
        .eq("empresa_id", empresaId)
        .eq("activo", true)
        .order("chip_id")
        .range(from, from + PAGE - 1);

      if (campoIds !== null) {
        pageQuery = pageQuery.in("campo_actual_id", campoIds);
      }

      const { data, error: pageError } = await pageQuery;
      if (pageError) { error = pageError; break; }
      if (!data || data.length === 0) break;
      animales = animales.concat(data as unknown as Animal[]);
      if (data.length < PAGE) break;
      from += PAGE;
    }
  }

  const camposQuery = sb.from("campos").select("id, nombre").eq("empresa_id", empresaId).eq("activo", true).order("nombre");
  const [{ data: campos }, { data: categorias }, { data: razas }] = await Promise.all([
    campoIds !== null && campoIds.length > 0
      ? sb.from("campos").select("id, nombre").in("id", campoIds).order("nombre")
      : campoIds === null
        ? camposQuery
        : Promise.resolve({ data: [] }),
    sb.from("categorias").select("id, nombre").eq("empresa_id", empresaId).eq("activo", true).order("nombre"),
    sb.from("razas").select("id, nombre").eq("empresa_id", empresaId).eq("activo", true).order("nombre"),
  ]);

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <p className="text-red-700 font-semibold">Error al cargar animales</p>
        <p className="text-red-600 text-sm font-mono">{error.message}</p>
      </div>
    );
  }

  const esAdmin = user.rol === "administrador";

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 border-b border-stone-200 pb-5">
        <div>
          <h1 className="text-3xl font-bold text-stone-800">Animales</h1>
          <p className="text-stone-500 mt-1 text-sm">
            {campoIds !== null ? `Campos asignados a tu usuario` : "Listado completo del rodeo"}
          </p>
        </div>
        {esAdmin && (
          <div className="flex flex-wrap gap-2">
            <a href="/api/animales/export" download className="px-4 py-2 border border-stone-300 text-stone-600 rounded-lg text-sm hover:bg-stone-50 transition-colors">
              Exportar
            </a>
            <a href="/animales/importar" className="px-4 py-2 border border-stone-300 text-stone-600 rounded-lg text-sm hover:bg-stone-50 transition-colors">
              Importar
            </a>
            <a href="/animales/editar-masivo" className="px-4 py-2 border border-stone-300 text-stone-600 rounded-lg text-sm hover:bg-stone-50 transition-colors">
              Edición masiva
            </a>
            <a href="/animales/eliminar-masivo" className="px-4 py-2 border border-red-200 text-red-600 rounded-lg text-sm hover:bg-red-50 transition-colors">
              Eliminar masivo
            </a>
            <a href="/animales/nuevo" className="px-4 py-2 bg-green-800 text-white rounded-lg text-sm hover:bg-green-700 transition-colors">
              + Nuevo animal
            </a>
          </div>
        )}
      </div>
      <AnimalesTable
        animales={(animales ?? []) as unknown as Animal[]}
        campos={campos ?? []}
        categorias={categorias ?? []}
        razas={razas ?? []}
        soloLectura={!esAdmin}
      />
    </div>
  );
}
