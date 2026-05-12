import { createAdminClient } from "@/lib/supabase/admin";
import ImportarAnimales from "./ImportarAnimales";

export default async function ImportarAnimalesPage() {
  const sb = createAdminClient();
  const empresaId = process.env.EMPRESA_ID!;

  const [{ data: campos }, { data: categorias }, { data: razas }] =
    await Promise.all([
      sb.from("campos").select("id, nombre").eq("empresa_id", empresaId).eq("activo", true).order("nombre"),
      sb.from("categorias").select("id, nombre").eq("empresa_id", empresaId).eq("activo", true).order("nombre"),
      sb.from("razas").select("id, nombre").eq("empresa_id", empresaId).eq("activo", true).order("nombre"),
    ]);

  return (
    <div className="space-y-6">
      <div>
        <p className="text-sm text-stone-400 mb-1">
          <a href="/animales" className="hover:underline">Animales</a> / Importar
        </p>
        <h1 className="text-2xl font-bold text-stone-800">Importar animales</h1>
      </div>
      <ImportarAnimales
        campos={campos ?? []}
        categorias={categorias ?? []}
        razas={razas ?? []}
      />
    </div>
  );
}
