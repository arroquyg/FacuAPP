"use server";

import { createAdminClient } from "@/lib/supabase/admin";
import { getCurrentUser } from "@/lib/auth";
import { isDemoUser, DEMO_MSG } from "@/lib/demo";
import { revalidatePath } from "next/cache";

type RegistroInput = {
  eid: string;
  datos: (string | null)[];
};

export async function importarDatos(
  trabajoId: string,
  registros: RegistroInput[]
): Promise<{
  ok: boolean;
  total: number;
  encontrados: number;
  noEncontrados: string[];
  error?: string;
}> {
  if (registros.length === 0)
    return { ok: false, total: 0, encontrados: 0, noEncontrados: [], error: "El CSV no tiene registros." };

  const user = await getCurrentUser();
  if (!user) return { ok: false, total: 0, encontrados: 0, noEncontrados: [], error: "No autenticado." };
  if (isDemoUser(user)) return { ok: false, total: 0, encontrados: 0, noEncontrados: [], error: DEMO_MSG };

  const sb = createAdminClient();
  const empresaId = user.empresa_id;

  const eids = registros.map((r) => r.eid);
  const eidsNorm = eids.map((e) => e.replace(/\s+/g, ""));

  const [{ data: byEid }, { data: byNorm }] = await Promise.all([
    sb.from("animales").select("id, chip_id").eq("empresa_id", empresaId).in("chip_id", eids),
    sb.from("animales").select("id, chip_id").eq("empresa_id", empresaId).in("chip_id", eidsNorm),
  ]);

  const animalMap = new Map<string, string>();
  for (const a of byEid ?? []) animalMap.set(a.chip_id, a.id);
  for (const a of byNorm ?? []) if (!animalMap.has(a.chip_id)) animalMap.set(a.chip_id, a.id);

  const noEncontrados: string[] = [];
  const rows = registros.map((r) => {
    const eidNorm = r.eid.replace(/\s+/g, "");
    const animalId = animalMap.get(r.eid) ?? animalMap.get(eidNorm) ?? null;
    if (!animalId) noEncontrados.push(r.eid);
    return {
      trabajo_id: trabajoId,
      animal_id: animalId,
      eid: r.eid,
      encontrado: animalId !== null,
      dato1: r.datos[0] ?? null,
      dato2: r.datos[1] ?? null,
      dato3: r.datos[2] ?? null,
      dato4: r.datos[3] ?? null,
      dato5: r.datos[4] ?? null,
      dato6: r.datos[5] ?? null,
      dato7: r.datos[6] ?? null,
      dato8: r.datos[7] ?? null,
      dato9: r.datos[8] ?? null,
      dato10: r.datos[9] ?? null,
    };
  });

  const { error: errRegistros } = await sb.from("trabajo_registros").insert(rows);
  if (errRegistros)
    return { ok: false, total: 0, encontrados: 0, noEncontrados: [], error: errRegistros.message };

  const { count } = await sb
    .from("trabajo_registros")
    .select("*", { count: "exact", head: true })
    .eq("trabajo_id", trabajoId);

  await sb.from("trabajos").update({ total_chips: count ?? 0 }).eq("id", trabajoId);

  revalidatePath(`/trabajos/${trabajoId}`);
  revalidatePath("/trabajos");

  return {
    ok: true,
    total: registros.length,
    encontrados: registros.length - noEncontrados.length,
    noEncontrados,
  };
}
