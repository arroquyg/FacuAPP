"use server";

import { createClient } from "@/lib/supabase/server";
import { headers } from "next/headers";

export async function requestPasswordReset(formData: FormData) {
  const email = formData.get("email") as string;

  const headersList = await headers();
  const origin = headersList.get("origin") ?? "http://localhost:3000";

  const redirectTo = `${origin}/reset-password`;
  console.log("[forgot-password] Intentando enviar reset a:", email, "| redirectTo:", redirectTo);

  const sb = createClient();
  const { data, error } = await sb.auth.resetPasswordForEmail(email, { redirectTo });

  if (error) {
    console.error("[forgot-password] ERROR:", JSON.stringify(error));
    return { error: "No se pudo enviar el correo. Verificá que el email sea correcto." };
  }

  console.log("[forgot-password] OK - respuesta de Supabase:", JSON.stringify(data));
  return { success: true };
}
