"use server";

import { createAdminClient } from "@/lib/supabase/admin";
import { getCurrentUser } from "@/lib/auth";
import { isDemoUser, DEMO_BLOCKED } from "@/lib/demo";
import { revalidatePath } from "next/cache";
import { registrarAudit } from "@/lib/audit";

type AnimalTransaccion = { animal_id: string; precio_unitario: number };

function revalidarTodo() {
  revalidatePath("/transacciones");
  revalidatePath("/transferencias");
  revalidatePath("/animales");
  revalidatePath("/");
}

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

  const user = await getCurrentUser();
  if (!user) return { ok: false, error: "No autenticado." };
  if (isDemoUser(user)) return DEMO_BLOCKED;

  const supabase = createAdminClient();
  const { data, error } = await supabase.rpc("registrar_transaccion", {
    p_empresa_id: user.empresa_id,
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

  const transaccionId = data as string;

  // Registrar quién creó la transacción
  await supabase
    .from("transacciones")
    .update({ registrado_por: user.id })
    .eq("id", transaccionId);

  await registrarAudit(user, "registrar_transaccion", {
    tabla: "transacciones",
    registro_id: transaccionId,
    detalle: {
      tipo: params.tipo,
      contraparte: params.contraparte,
      precio_total: params.precio_total,
      cantidad_animales: params.animales.length,
    },
  });

  revalidarTodo();
  return { ok: true, id: transaccionId };
}

export async function registrarTransferenciaEmpresa(params: {
  empresaDestinoId: string;
  fecha: string;
  precio_total: number;
  numero_remito: string;
  numero_transaccion: string;
  observaciones: string;
  animales: AnimalTransaccion[];
}): Promise<{ ok: boolean; error?: string }> {
  if (params.animales.length === 0)
    return { ok: false, error: "No hay animales seleccionados." };

  const user = await getCurrentUser();
  if (!user) return { ok: false, error: "No autenticado." };
  if (isDemoUser(user)) return DEMO_BLOCKED;

  const sb = createAdminClient();

  const { data: transaccion, error: errT } = await sb
    .from("transacciones")
    .insert({
      empresa_id: user.empresa_id,
      tipo: "venta",
      fecha: params.fecha,
      contraparte: `Transferencia a empresa`,
      precio_total: params.precio_total,
      numero_remito: params.numero_remito || null,
      numero_transaccion: params.numero_transaccion || null,
      observaciones: params.observaciones || null,
      registrado_por: user.id,
    })
    .select("id")
    .single();

  if (errT) return { ok: false, error: errT.message };

  const { error: errTA } = await sb.from("transaccion_animales").insert(
    params.animales.map((a) => ({
      transaccion_id: transaccion.id,
      animal_id: a.animal_id,
      precio_unitario: a.precio_unitario,
    }))
  );
  if (errTA) return { ok: false, error: errTA.message };

  const animalIds = params.animales.map((a) => a.animal_id);

  const { error: errA } = await sb
    .from("animales")
    .update({ en_transferencia: true })
    .in("id", animalIds);
  if (errA) return { ok: false, error: errA.message };

  const { error: errP } = await sb.from("transferencias_pendientes").insert(
    animalIds.map((animal_id) => ({
      animal_id,
      empresa_origen_id: user.empresa_id,
      empresa_destino_id: params.empresaDestinoId,
      transaccion_id: transaccion.id,
      precio_total: params.precio_total,
    }))
  );
  if (errP) return { ok: false, error: errP.message };

  await registrarAudit(user, "transferencia_empresa", {
    tabla: "transferencias_pendientes",
    detalle: {
      empresa_destino_id: params.empresaDestinoId,
      precio_total: params.precio_total,
      cantidad_animales: params.animales.length,
    },
  });

  revalidarTodo();
  return { ok: true };
}
