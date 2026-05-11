"use server";

import { createAdminClient } from "@/lib/supabase/admin";
import { revalidatePath } from "next/cache";

type AnimalTransaccion = { animal_id: string; precio_unitario: number };

export async function registrarTransaccion(params: {
  tipo: "compra" | "venta";
  fecha: string;
  contraparte: string;
  contraparte_cuit: string;
  precio_total: number;
  numero_remito: string;
  numero_transaccion: string;
  observaciones: string;
  animales: AnimalTransaccion[];
}): Promise<{ ok: boolean; id?: string; error?: string }> {
  if (params.animales.length === 0)
    return { ok: false, error: "No hay animales seleccionados." };

  const empresaId = process.env.EMPRESA_ID;
  if (!empresaId) return { ok: false, error: "EMPRESA_ID no configurado." };

  const supabase = createAdminClient();
  const { data, error } = await supabase.rpc("registrar_transaccion", {
    p_empresa_id: empresaId,
    p_tipo: params.tipo,
    p_fecha: params.fecha,
    p_contraparte: params.contraparte,
    p_contraparte_cuit: params.contraparte_cuit || null,
    p_precio_total: params.precio_total,
    p_numero_remito: params.numero_remito || null,
    p_numero_transaccion: params.numero_transaccion || null,
    p_observaciones: params.observaciones || null,
    p_animales: params.animales,
  });

  if (error) return { ok: false, error: error.message };

  revalidatePath("/transacciones");
  revalidatePath("/animales");
  revalidatePath("/");
  return { ok: true, id: data as string };
}
