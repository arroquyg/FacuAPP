import { createAdminClient } from "@/lib/supabase/admin";
import { getCurrentUser } from "@/lib/auth";
import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import ImportarAnimales from "./ImportarAnimales";

export default async function ImportarSanitarioPage({ params }: { params: { id: string } }) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const sb = createAdminClient();
  const { data: trabajo } = await sb
    .from("sanitario_trabajos")
    .select("id, tipo_evento, producto, fecha")
    .eq("id", params.id)
    .eq("empresa_id", user.empresa_id)
    .single();

  if (!trabajo) notFound();

  return (
    <div className="space-y-6">
      <div className="border-b border-stone-200 pb-5">
        <Link href={`/sanitario/${params.id}`} className="text-sm text-stone-400 hover:text-green-700 transition-colors">
          ← {trabajo.tipo_evento}{trabajo.producto ? ` — ${trabajo.producto}` : ""}
        </Link>
        <h1 className="text-3xl font-bold text-stone-800 mt-2">Importar animales</h1>
      </div>
      <ImportarAnimales sanitarioTrabajoId={params.id} />
    </div>
  );
}
