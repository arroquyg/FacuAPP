import type { Metadata } from "next";
import Link from "next/link";
import "./globals.css";

export const metadata: Metadata = {
  title: "Sistema Ganadero",
  description: "Gestión de animales y campos",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es">
      <body className="bg-gray-50 min-h-screen">
        <nav className="bg-white border-b border-gray-200 shadow-sm">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center h-14 gap-8">
              <span className="font-bold text-gray-800 text-lg">
                Sistema Ganadero
              </span>
              <div className="flex gap-6">
                <Link href="/" className="text-sm text-gray-600 hover:text-gray-900 font-medium">
                  Inicio
                </Link>
                <Link href="/animales" className="text-sm text-gray-600 hover:text-gray-900 font-medium">
                  Animales
                </Link>
                <Link href="/movimientos" className="text-sm text-gray-600 hover:text-gray-900 font-medium">
                  Movimientos
                </Link>
                <Link href="/transacciones" className="text-sm text-gray-600 hover:text-gray-900 font-medium">
                  Transacciones
                </Link>
                <Link href="/trabajos" className="text-sm text-gray-600 hover:text-gray-900 font-medium">
                  Trabajos
                </Link>
                <Link href="/configuracion" className="text-sm text-gray-600 hover:text-gray-900 font-medium">
                  Configuración
                </Link>
              </div>
            </div>
          </div>
        </nav>
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {children}
        </main>
      </body>
    </html>
  );
}
