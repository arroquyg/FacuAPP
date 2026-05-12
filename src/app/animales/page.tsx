import { createAdminClient } from "@/lib/supabase/admin";
import AnimalesTable from "./AnimalesTable";

export default async function AnimalesPage() {
  const supabase = createAdminClient();
  const empresaId = process.env.EMPRESA_ID!;

  const { data: animales, error } = await supabase
    .from("animales")
    .select("id, chip_id, numero_caravana, categoria, raza, estado_sanitario, activo, vivo, campo:campo_actual_id(id, nombre)")
    .eq("empresa_id", empresaId)
    .eq("activo", true)
    .order("chip_id");

  const [{ data: campos }, { data: categorias }, { data: razas }] =
    await Promise.all([
      supabase.from("campos").select("id, nombre").eq("empresa_id", empresaId).eq("activo", true).order("nombre"),
      supabase.from("categorias").select("id, nombre").eq("empresa_id", empresaId).eq("activo", true).order("nombre"),
      supabase.from("razas").select("id, nombre").eq("empresa_id", empresaId).eq("activo", true).order("nombre"),
    ]);

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <p className="text-red-700 font-semibold">Error al cargar animales</p>
        <p className="text-red-600 text-sm font-mono">{error.message}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 border-b border-stone-200 pb-5">
        <div>
          <h1 className="text-3xl font-bold text-stone-800">Animales</h1>
          <p className="text-stone-500 mt-1 text-sm">Listado completo del rodeo</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <a
            href="/api/animales/export"
            download
            className="px-4 py-2 border border-stone-300 text-stone-600 rounded-lg text-sm hover:bg-stone-50 transition-colors"
          >
            Exportar
          </a>
          <a
            href="/animales/importar"
            className="px-4 py-2 border border-stone-300 text-stone-600 rounded-lg text-sm hover:bg-stone-50 transition-colors"
          >
            Importar
          </a>
          <a
            href="/animales/nuevo"
            className="px-4 py-2 bg-green-800 text-white rounded-lg text-sm hover:bg-green-700 transition-colors"
          >
            + Nuevo animal
          </a>
        </div>
      </div>
      <AnimalesTable
        animales={animales ?? []}
        campos={campos ?? []}
        categorias={categorias ?? []}
        razas={razas ?? []}
      />
    </div>
  );
}
