"use server";

import { createAdminClient } from "@/lib/supabase/admin";
import { getCurrentUser } from "@/lib/auth";
import { isDemoUser, DEMO_BLOCKED } from "@/lib/demo";
import { revalidatePath } from "next/cache";
import { registrarAudit } from "@/lib/audit";

export async function crearSanitarioTrabajo(data: {
  tipo_evento: string;
  veterinario: string | null;
  descripcion: string | null;
  fecha: string;
  lineas: Array<{
    producto: string | null;
    dosis: number | null;
    precio_unitario: number | null;
    unidad: string | null;
  }>;
}): Promise<{ ok: boolean; id?: string; error?: string }> {
  const user = await getCurrentUser();
  if (!user) return { ok: false, error: "No autenticado" };
  if (isDemoUser(user)) return DEMO_BLOCKED;

  const sb = createAdminClient();
  const primeraLinea = data.lineas[0] ?? {};

  const { data: nuevo, error } = await sb
    .from("sanitario_trabajos")
    .insert({
      empresa_id: user.empresa_id,
      tipo_evento: data.tipo_evento,
      producto: primeraLinea.producto || null,
      dosis: primeraLinea.dosis ?? null,
      precio_unitario: primeraLinea.precio_unitario ?? null,
      unidad: primeraLinea.unidad || null,
      veterinario: data.veterinario,
      descripcion: data.descripcion,
      fecha: data.fecha,
      total_animales: 0,
    })
    .select("id")
    .single();

  if (error) return { ok: false, error: error.message };

  const productosRows = data.lineas
    .filter((l) => l.producto)
    .map((l) => ({
      sanitario_id: nuevo.id,
      producto: l.producto,
      dosis: l.dosis,
      precio_unitario: l.precio_unitario,
      unidad: l.unidad,
    }));

  if (productosRows.length > 0) {
    const { error: errProd } = await sb.from("sanitario_productos").insert(productosRows);
    if (errProd) return { ok: false, error: errProd.message };
  }

  await registrarAudit(user, "crear_sanitario", {
    tabla: "sanitario_trabajos",
    registro_id: nuevo.id,
    detalle: { tipo_evento: data.tipo_evento, fecha: data.fecha },
  });

  revalidatePath("/sanitario");
  return { ok: true, id: nuevo.id };
}
