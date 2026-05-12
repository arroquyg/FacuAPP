"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import type { UserProfile } from "@/lib/auth";
import { signOut } from "@/app/login/actions";

const baseLinks = [
  { href: "/", label: "Inicio" },
  { href: "/animales", label: "Animales" },
  { href: "/movimientos", label: "Movimientos" },
  { href: "/transacciones", label: "Transacciones" },
  { href: "/trabajos", label: "Trabajos" },
];

const adminLinks = [
  { href: "/configuracion", label: "Configuración" },
  { href: "/admin/usuarios", label: "Usuarios" },
];

export default function NavBar({ user }: { user: UserProfile | null }) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);

  const links = user?.rol === "admin" ? [...baseLinks, ...adminLinks] : baseLinks;

  function isActive(href: string) {
    return href === "/" ? pathname === "/" : pathname.startsWith(href);
  }

  return (
    <nav className="bg-green-900 shadow-lg">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <Link href="/" className="shrink-0" onClick={() => setOpen(false)}>
            <span className="font-bold text-white text-lg tracking-wide">
              Sistema Ganadero
            </span>
          </Link>

          {/* Desktop links */}
          <div className="hidden md:flex items-center gap-1">
            {links.map(({ href, label }) => (
              <Link
                key={href}
                href={href}
                className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                  isActive(href)
                    ? "bg-green-700 text-white"
                    : "text-green-100 hover:bg-green-800 hover:text-white"
                }`}
              >
                {label}
              </Link>
            ))}
          </div>

          <div className="hidden md:flex items-center gap-3">
            {/* User chip */}
            {user && (
              <div className="relative">
                <button
                  onClick={() => setUserMenuOpen((v) => !v)}
                  className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-green-800 hover:bg-green-700 transition-colors"
                >
                  <div className="w-6 h-6 rounded-full bg-green-600 flex items-center justify-center text-white text-xs font-bold shrink-0">
                    {user.nombre.charAt(0).toUpperCase()}
                  </div>
                  <div className="text-left">
                    <p className="text-xs font-medium text-white leading-tight">{user.nombre}</p>
                    <p className="text-xs text-green-300 leading-tight">{user.empresa_nombre}</p>
                  </div>
                </button>

                {userMenuOpen && (
                  <div className="absolute right-0 mt-2 w-48 bg-white rounded-xl border border-stone-200 shadow-lg z-50 py-1">
                    <div className="px-4 py-2 border-b border-stone-100">
                      <p className="text-xs font-semibold text-stone-700">{user.nombre}</p>
                      <p className="text-xs text-stone-400">{user.email}</p>
                      <span className={`inline-block mt-1 text-xs px-2 py-0.5 rounded-full font-medium ${
                        user.rol === "admin"
                          ? "bg-green-100 text-green-700"
                          : "bg-stone-100 text-stone-500"
                      }`}>
                        {user.rol === "admin" ? "Administrador" : "Operario"}
                      </span>
                    </div>
                    <Link
                      href="/perfil"
                      onClick={() => setUserMenuOpen(false)}
                      className="block px-4 py-2 text-sm text-stone-600 hover:bg-stone-50"
                    >
                      Mi perfil
                    </Link>
                    <form action={signOut}>
                      <button
                        type="submit"
                        className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50"
                      >
                        Cerrar sesión
                      </button>
                    </form>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Hamburger */}
          <button
            onClick={() => setOpen((v) => !v)}
            className="md:hidden flex flex-col justify-center items-center w-10 h-10 gap-1.5 rounded-lg hover:bg-green-800 transition-colors"
            aria-label="Menú"
          >
            <span className={`block w-5 h-0.5 bg-white transition-all duration-200 ${open ? "rotate-45 translate-y-2" : ""}`} />
            <span className={`block w-5 h-0.5 bg-white transition-all duration-200 ${open ? "opacity-0" : ""}`} />
            <span className={`block w-5 h-0.5 bg-white transition-all duration-200 ${open ? "-rotate-45 -translate-y-2" : ""}`} />
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      {open && (
        <div className="md:hidden border-t border-green-800 bg-green-900 px-4 pb-4 pt-2 space-y-1">
          {links.map(({ href, label }) => (
            <Link
              key={href}
              href={href}
              onClick={() => setOpen(false)}
              className={`block px-4 py-3 rounded-lg text-sm font-medium transition-colors ${
                isActive(href)
                  ? "bg-green-700 text-white"
                  : "text-green-100 hover:bg-green-800"
              }`}
            >
              {label}
            </Link>
          ))}

          {user && (
            <>
              <div className="border-t border-green-800 pt-3 mt-2">
                <div className="px-4 py-2">
                  <p className="text-sm font-medium text-white">{user.nombre}</p>
                  <p className="text-xs text-green-300">{user.empresa_nombre}</p>
                  <span className={`inline-block mt-1 text-xs px-2 py-0.5 rounded-full font-medium ${
                    user.rol === "admin"
                      ? "bg-green-700 text-green-100"
                      : "bg-green-800 text-green-300"
                  }`}>
                    {user.rol === "admin" ? "Administrador" : "Operario"}
                  </span>
                </div>
                <Link
                  href="/perfil"
                  onClick={() => setOpen(false)}
                  className="block px-4 py-3 rounded-lg text-sm text-green-100 hover:bg-green-800"
                >
                  Mi perfil
                </Link>
                <form action={signOut}>
                  <button
                    type="submit"
                    className="w-full text-left px-4 py-3 rounded-lg text-sm text-red-300 hover:bg-green-800"
                  >
                    Cerrar sesión
                  </button>
                </form>
              </div>
            </>
          )}
        </div>
      )}
    </nav>
  );
}
