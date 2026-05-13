import type { Metadata, Viewport } from "next";
import NavBar from "./NavBar";
import ProgressBar from "./ProgressBar";
import { getCurrentUser } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import "./globals.css";

export const metadata: Metadata = {
  title: "Sistema Ganadero",
  description: "Gestión de animales y campos",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getCurrentUser();

  let transferenciasCount = 0;
  if (user?.rol === "administrador") {
    const sb = createAdminClient();
    const { count } = await sb
      .from("transferencias_pendientes")
      .select("*", { count: "exact", head: true })
      .eq("empresa_destino_id", user.empresa_id)
      .eq("estado", "pendiente");
    transferenciasCount = count ?? 0;
  }

  return (
    <html lang="es">
      <body className="bg-stone-100 min-h-screen">
        <ProgressBar />
        <NavBar user={user} transferenciasCount={transferenciasCount} />
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
          {children}
        </main>
      </body>
    </html>
  );
}
