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
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-800">Animales</h1>
        <div className="flex gap-2">
          <a
            href="/api/animales/export"
            download
            className="px-4 py-2 border border-gray-300 text-gray-600 rounded-lg text-sm hover:bg-gray-50"
          >
            Exportar
          </a>
          <a
            href="/animales/importar"
            className="px-4 py-2 border border-gray-300 text-gray-600 rounded-lg text-sm hover:bg-gray-50"
          >
            Importar
          </a>
          <a
            href="/animales/nuevo"
            className="px-4 py-2 bg-green-800 text-white rounded-lg text-sm hover:bg-green-700"
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
