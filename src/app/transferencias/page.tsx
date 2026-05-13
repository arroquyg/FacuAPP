import { createAdminClient } from "@/lib/supabase/admin";
import { getCurrentUser } from "@/lib/auth";
import { redirect } from "next/navigation";
import TransferenciasEntrantes from "./TransferenciasEntrantes";

export default async function TransferenciasPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  if (user.rol !== "administrador") redirect("/");

  const sb = createAdminClient();

  const [{ data: transferencias }, { data: campos }] = await Promise.all([
    sb
      .from("transferencias_pendientes")
      .select(`
        id,
        estado,
        precio_total,
        creado_en,
        animal:animal_id(id, chip_id, numero_caravana, categoria, raza),
        empresa_origen:empresa_origen_id(nombre)
      `)
      .eq("empresa_destino_id", user.empresa_id)
      .eq("estado", "pendiente")
      .order("creado_en", { ascending: false }),
    sb
      .from("campos")
      .select("id, nombre")
      .eq("empresa_id", user.empresa_id)
      .eq("activo", true)
      .order("nombre"),
  ]);

  return (
    <div className="space-y-6">
      <div className="border-b border-stone-200 pb-5">
        <h1 className="text-3xl font-bold text-stone-800">Transferencias entrantes</h1>
        <p className="text-stone-500 mt-1 text-sm">Animales que otras empresas te transfirieron y esperan tu aprobación</p>
      </div>

      <TransferenciasEntrantes
        transferencias={(transferencias ?? []) as unknown as Parameters<typeof TransferenciasEntrantes>[0]["transferencias"]}
        campos={campos ?? []}
      />
    </div>
  );
}
