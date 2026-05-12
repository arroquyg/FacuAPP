import { createAdminClient } from "@/lib/supabase/admin";
import { getCurrentUser } from "@/lib/auth";
import { notFound, redirect } from "next/navigation";
import FormAnimal from "../../FormAnimal";

export default async function EditarAnimalPage({
  params,
}: {
  params: { id: string };
}) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const sb = createAdminClient();
  const empresaId = user.empresa_id;

  const [{ data: animal }, { data: categorias }, { data: razas }, { data: campos }] =
    await Promise.all([
      sb.from("animales").select("*").eq("id", params.id).single(),
      sb.from("categorias").select("id, nombre").eq("empresa_id", empresaId).eq("activo", true).order("nombre"),
      sb.from("razas").select("id, nombre").eq("empresa_id", empresaId).eq("activo", true).order("nombre"),
      sb.from("campos").select("id, nombre").eq("empresa_id", empresaId).eq("activo", true).order("nombre"),
    ]);

  if (!animal) return notFound();

  const inicial = {
    chip_id: animal.chip_id ?? "",
    numero_caravana: animal.numero_caravana ?? "",
    sexo: animal.sexo ?? "",
    categoria: animal.categoria ?? "",
    raza: animal.raza ?? "",
    fecha_nacimiento: animal.fecha_nacimiento ?? "",
    color_pelaje: animal.color_pelaje ?? "",
    procedencia: animal.procedencia ?? "",
    valor_comercial: animal.valor_comercial?.toString() ?? "",
    estado_sanitario: animal.estado_sanitario ?? "",
    campo_actual_id: animal.campo_actual_id ?? "",
    activo: animal.activo ?? true,
    vivo: animal.vivo ?? true,
  };

  return (
    <div className="space-y-6">
      <div>
        <p className="text-sm text-stone-400 mb-1">
          <a href="/animales" className="hover:underline">Animales</a>{" "}
          /{" "}
          <a href={`/animales/${params.id}`} className="hover:underline">
            {animal.chip_id}
          </a>{" "}
          / Editar
        </p>
        <h1 className="text-2xl font-bold text-stone-800">Editar animal</h1>
      </div>
      <FormAnimal
        modo="editar"
        animalId={params.id}
        inicial={inicial}
        categorias={categorias ?? []}
        razas={razas ?? []}
        campos={campos ?? []}
      />
    </div>
  );
}
