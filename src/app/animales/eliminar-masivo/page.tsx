import { getCurrentUser } from "@/lib/auth";
import { redirect } from "next/navigation";
import EliminarMasivo from "./EliminarMasivo";

export default async function EliminarMasivoPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  if (user.rol !== "administrador") redirect("/animales");

  return (
    <div className="space-y-6">
      <div>
        <p className="text-sm text-stone-400 mb-1">
          <a href="/animales" className="hover:underline">Animales</a> / Eliminar masivo
        </p>
        <h1 className="text-2xl font-bold text-stone-800">Eliminar animales</h1>
        <p className="text-stone-500 text-sm mt-1">Pegá una lista de caravanas para darlas de baja del sistema</p>
      </div>
      <EliminarMasivo />
    </div>
  );
}
