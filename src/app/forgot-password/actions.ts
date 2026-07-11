"use server";

import { createClient } from "@/lib/supabase/server";
import { headers } from "next/headers";

export async function requestPasswordReset(formData: FormData) {
  const email = formData.get("email") as string;

  const headersList = await headers();
  const origin = headersList.get("origin") ?? "http://localhost:3000";

  const sb = createClient();
  const { error } = await sb.auth.resetPasswordForEmail(email, {
    redirectTo: `${origin}/reset-password`,
  });

  if (error) {
    return { error: "No se pudo enviar el correo. Verificá que el email sea correcto." };
  }

  return { success: true };
}
