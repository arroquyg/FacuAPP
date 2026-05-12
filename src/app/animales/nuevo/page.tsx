import { createAdminClient } from "@/lib/supabase/admin";
import { getCurrentUser } from "@/lib/auth";
import { redirect } from "next/navigation";
import FormAnimal from "../FormAnimal";

export default async function NuevoAnimalPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const sb = createAdminClient();
  const empresaId = user.empresa_id;

  const [{ data: categorias }, { data: razas }, { data: campos }] =
    await Promise.all([
      sb.from("categorias").select("id, nombre").eq("empresa_id", empresaId).eq("activo", true).order("nombre"),
      sb.from("razas").select("id, nombre").eq("empresa_id", empresaId).eq("activo", true).order("nombre"),
      sb.from("campos").select("id, nombre").eq("empresa_id", empresaId).eq("activo", true).order("nombre"),
    ]);

  return (
    <div className="space-y-6">
      <div>
        <p className="text-sm text-stone-400 mb-1">
          <a href="/animales" className="hover:underline">Animales</a> / Nuevo
        </p>
        <h1 className="text-2xl font-bold text-stone-800">Registrar animal</h1>
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
