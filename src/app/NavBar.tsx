"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const links = [
  { href: "/", label: "Inicio" },
  { href: "/animales", label: "Animales" },
  { href: "/movimientos", label: "Movimientos" },
  { href: "/transacciones", label: "Transacciones" },
  { href: "/trabajos", label: "Trabajos" },
  { href: "/configuracion", label: "Configuración" },
];

export default function NavBar() {
  const pathname = usePathname();

  return (
    <nav className="bg-green-900 shadow-lg">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center h-16 gap-10">
          <Link href="/" className="shrink-0">
            <span className="font-bold text-white text-xl tracking-wide">
              Sistema Ganadero
            </span>
          </Link>
          <div className="flex items-center gap-1">
            {links.map(({ href, label }) => {
              const isActive =
                href === "/" ? pathname === "/" : pathname.startsWith(href);
              return (
                <Link
                  key={href}
                  href={href}
                  className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                    isActive
                      ? "bg-green-700 text-white"
                      : "text-green-100 hover:bg-green-800 hover:text-white"
                  }`}
                >
                  {label}
                </Link>
              );
            })}
          </div>
        </div>
      </div>
    </nav>
  );
}
