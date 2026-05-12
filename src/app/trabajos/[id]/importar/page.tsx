import { createAdminClient } from "@/lib/supabase/admin";
import Link from "next/link";
import { notFound } from "next/navigation";
import ImportarDatos from "./ImportarDatos";

export default async function ImportarDatosPage({ params }: { params: { id: string } }) {
  const sb = createAdminClient();
  const empresaId = process.env.EMPRESA_ID!;

  const { data: trabajo } = await sb
    .from("trabajos")
    .select("id, tipo, columnas")
    .eq("id", params.id)
    .eq("empresa_id", empresaId)
    .single();

  if (!trabajo) notFound();

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href={`/trabajos/${params.id}`} className="text-sm text-stone-500 hover:text-stone-700">
          ← Volver
        </Link>
        <div>
          <p className="text-xs text-stone-500">Importar datos para</p>
          <h1 className="text-xl font-bold text-stone-800">{trabajo.tipo}</h1>
        </div>
      </div>
      <ImportarDatos trabajo={{ id: trabajo.id, tipo: trabajo.tipo, columnas: trabajo.columnas ?? [] }} />
    </div>
  );
}
