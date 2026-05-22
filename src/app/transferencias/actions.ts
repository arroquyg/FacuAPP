"use server";

import { createAdminClient } from "@/lib/supabase/admin";
import { getCurrentUser } from "@/lib/auth";
import { revalidatePath } from "next/cache";
import { registrarAudit } from "@/lib/audit";

function revalidarTodo() {
  revalidatePath("/transferencias");
  revalidatePath("/animales");
  revalidatePath("/transacciones");
  revalidatePath("/");
}

export async function aceptarTransferencia(
  transferenciaId: string,
  campoId: string | null
): Promise<{ ok: boolean; error?: string }> {
  const user = await getCurrentUser();
  if (!user || user.rol !== "administrador") return { ok: false, error: "No autorizado." };

  const sb = createAdminClient();

  const { data: transferencia, error: errGet } = await sb
    .from("transferencias_pendientes")
    .select("animal_id, empresa_destino_id")
    .eq("id", transferenciaId)
    .eq("empresa_destino_id", user.empresa_id)
    .eq("estado", "pendiente")
    .single();

  if (errGet || !transferencia) return { ok: false, error: "Transferencia no encontrada." };

  const { error: errAnimal } = await sb
    .from("animales")
    .update({
      empresa_id: transferencia.empresa_destino_id,
      en_transferencia: false,
      campo_actual_id: campoId,
      updated_by: user.id,
    })
    .eq("id", transferencia.animal_id);
  if (errAnimal) return { ok: false, error: errAnimal.message };

  const { error: errEstado } = await sb
    .from("transferencias_pendientes")
    .update({ estado: "aceptada" })
    .eq("id", transferenciaId);
  if (errEstado) return { ok: false, error: errEstado.message };

  await registrarAudit(user, "aceptar_transferencia", {
    tabla: "transferencias_pendientes",
    registro_id: transferenciaId,
    detalle: { animal_id: transferencia.animal_id, campo_id: campoId },
  });

  revalidarTodo();
  return { ok: true };
}

export async function crearCampoParaTransferencia(nombre: string): Promise<{ ok: boolean; id?: string; error?: string }> {
  const user = await getCurrentUser();
  if (!user || user.rol !== "administrador") return { ok: false, error: "No autorizado." };

  const sb = createAdminClient();
  const { data, error } = await sb
    .from("campos")
    .insert({ empresa_id: user.empresa_id, nombre: nombre.trim(), activo: true })
    .select("id")
    .single();

  if (error) return { ok: false, error: error.message };
  revalidatePath("/transferencias");
  revalidatePath("/configuracion");
  return { ok: true, id: data.id };
}

export async function denegarTransferencia(
  transferenciaId: string
): Promise<{ ok: boolean; error?: string }> {
  const user = await getCurrentUser();
  if (!user || user.rol !== "administrador") return { ok: false, error: "No autorizado." };

  const sb = createAdminClient();

  const { data: transferencia, error: errGet } = await sb
    .from("transferencias_pendientes")
    .select("animal_id, transaccion_id")
    .eq("id", transferenciaId)
    .eq("empresa_destino_id", user.empresa_id)
    .eq("estado", "pendiente")
    .single();

  if (errGet || !transferencia) return { ok: false, error: "Transferencia no encontrada." };

  const { error: errAnimal } = await sb
    .from("animales")
    .update({ en_transferencia: false })
    .eq("id", transferencia.animal_id);
  if (errAnimal) return { ok: false, error: errAnimal.message };

  await sb
    .from("transferencias_pendientes")
    .update({ estado: "denegada" })
    .eq("id", transferenciaId);

  await sb.from("transaccion_animales").delete().eq("transaccion_id", transferencia.transaccion_id);
  await sb.from("transacciones").delete().eq("id", transferencia.transaccion_id);

  await registrarAudit(user, "denegar_transferencia", {
    tabla: "transferencias_pendientes",
    registro_id: transferenciaId,
    detalle: { animal_id: transferencia.animal_id },
  });

  revalidarTodo();
  return { ok: true };
}
