import { createAdminClient } from "@/lib/supabase/admin";
import FormAnimal from "../FormAnimal";

export default async function NuevoAnimalPage() {
  const sb = createAdminClient();
  const empresaId = process.env.EMPRESA_ID!;

  const [{ data: categorias }, { data: razas }, { data: campos }] =
    await Promise.all([
      sb.from("categorias").select("id, nombre").eq("empresa_id", empresaId).eq("activo", true).order("nombre"),
      sb.from("razas").select("id, nombre").eq("empresa_id", empresaId).eq("activo", true).order("nombre"),
      sb.from("campos").select("id, nombre").eq("empresa_id", empresaId).eq("activo", true).order("nombre"),
    ]);

  return (
    <div className="space-y-6">
      <div>
        <p className="text-sm text-gray-400 mb-1">
          <a href="/animales" className="hover:underline">Animales</a> / Nuevo
        </p>
        <h1 className="text-2xl font-bold text-gray-800">Registrar animal</h1>
      </div>
      <FormAnimal
        modo="nuevo"
        categorias={categorias ?? []}
        razas={razas ?? []}
        campos={campos ?? []}
      />
    </div>
  );
}
