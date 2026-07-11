"use server";

import { headers } from "next/headers";
import { createClient } from "@/lib/supabase/server";

export async function requestPasswordReset(formData: FormData) {
  const email = formData.get("email") as string;

  const origin = (await headers()).get("origin") ?? "https://facu-app.vercel.app";

  const sb = createClient();
  await sb.auth.resetPasswordForEmail(email, {
    redirectTo: `${origin}/actualizar-password`,
  });

  // Siempre devolvemos éxito, exista o no el email, para no filtrar qué emails están registrados.
  return { ok: true };
}
