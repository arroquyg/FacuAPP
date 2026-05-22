import { createAdminClient } from "@/lib/supabase/admin";
import type { UserProfile } from "@/lib/auth";

export type AuditAccion =
  | "crear_animal"
  | "actualizar_animal"
  | "editar_masivo"
  | "eliminar_masivo"
  | "importar_animales"
  | "registrar_transaccion"
  | "transferencia_empresa"
  | "aceptar_transferencia"
  | "denegar_transferencia"
  | "crear_lote"
  | "disolver_lote"
  | "crear_usuario"
  | "toggle_usuario"
  | "crear_sanitario";

export async function registrarAudit(
  user: UserProfile,
  accion: AuditAccion,
  opts?: {
    tabla?: string;
    registro_id?: string;
    detalle?: Record<string, unknown>;
  }
): Promise<void> {
  try {
    const sb = createAdminClient();
    await sb.from("audit_log").insert({
      empresa_id: user.empresa_id,
      usuario_id: user.id,
      usuario_nombre: user.nombre,
      accion,
      tabla: opts?.tabla ?? null,
      registro_id: opts?.registro_id ?? null,
      detalle: opts?.detalle ?? null,
    });
  } catch {
    // El log de auditoría nunca debe romper la operación principal
  }
}
