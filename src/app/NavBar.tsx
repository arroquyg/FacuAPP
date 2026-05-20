"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import type { UserProfile } from "@/lib/auth";
import { signOut } from "@/app/login/actions";

type NavChild = { href: string; label: string; badge?: boolean };
type NavSection = { href: string; label: string; children: NavChild[] };

function buildSections(isAdmin: boolean, transferenciasCount: number): NavSection[] {
  const sections: NavSection[] = [
    { href: "/", label: "Inicio", children: [] },
    {
      href: "/animales",
      label: "Stock Animal",
      children: [
        { href: "/campos", label: "Campos" },
        { href: "/trabajos", label: "Trabajos" },
        { href: "/sanitario", label: "Sanitario masivo" },
        { href: "/movimientos", label: "Movimientos" },
        { href: "/lotes", label: "Lotes" },
      ],
    },
    {
      href: "/transacciones",
      label: "Transacciones",
      children: isAdmin
        ? [{ href: "/transferencias", label: "Transferencias Entrantes", badge: transferenciasCount > 0 }]
        : [],
    },
  ];

  if (isAdmin) {
    sections.push({
      href: "/configuracion",
      label: "Configuración",
      children: [{ href: "/admin/usuarios", label: "Usuarios" }],
    });
  }

  return sections;
}

export default function NavBar({ user, transferenciasCount = 0 }: { user: UserProfile | null; transferenciasCount?: number }) {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [mobileExpanded, setMobileExpanded] = useState<string | null>(null);
  const [desktopOpen, setDesktopOpen] = useState<string | null>(null);
  const [userMenuOpen, setUserMenuOpen] = useState(false);

  const isAdmin = user?.rol === "administrador";
  const sections = buildSections(isAdmin, transferenciasCount);

  function isActive(href: string) {
    return href === "/" ? pathname === "/" : pathname.startsWith(href);
  }

  function isSectionActive(section: NavSection) {
    return isActive(section.href) || section.children.some((c) => isActive(c.href));
  }

  return (
    <nav className="bg-green-900 shadow-lg">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <Link href="/" className="shrink-0" onClick={() => setMobileOpen(false)}>
            <span className="font-bold text-white text-lg tracking-wide">Sistema Ganadero</span>
          </Link>

          {/* Desktop nav */}
          <div className="hidden md:flex items-center gap-1">
            {sections.map((section) =>
              section.children.length === 0 ? (
                // Link simple (Inicio)
                <Link
                  key={section.href}
                  href={section.href}
                  className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                    isSectionActive(section)
                      ? "bg-green-700 text-white"
                      : "text-green-100 hover:bg-green-800 hover:text-white"
                  }`}
                >
                  {section.label}
                </Link>
              ) : (
                // Sección con dropdown
                <div
                  key={section.href}
                  className="relative"
                  onMouseEnter={() => setDesktopOpen(section.href)}
                  onMouseLeave={() => setDesktopOpen(null)}
                >
                  <Link
                    href={section.href}
                    className={`flex items-center gap-1 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                      isSectionActive(section)
                        ? "bg-green-700 text-white"
                        : "text-green-100 hover:bg-green-800 hover:text-white"
                    }`}
                  >
                    {section.label}
                    <svg className="w-3 h-3 opacity-70" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </Link>

                  {desktopOpen === section.href && (
                    <div className="absolute top-full left-0 mt-1 w-52 bg-white rounded-xl border border-stone-200 shadow-lg z-50 py-1">
                      {section.children.map((child) => (
                        <Link
                          key={child.href}
                          href={child.href}
                          onClick={() => setDesktopOpen(null)}
                          className={`flex items-center justify-between px-4 py-2.5 text-sm transition-colors ${
                            isActive(child.href)
                              ? "text-green-800 font-semibold bg-green-50"
                              : "text-stone-600 hover:bg-stone-50"
                          }`}
                        >
                          {child.label}
                          {child.badge && (
                            <span className="bg-red-500 text-white text-xs rounded-full px-1.5 py-0.5 font-bold leading-none">
                              {transferenciasCount > 9 ? "9+" : transferenciasCount}
                            </span>
                          )}
                        </Link>
                      ))}
                    </div>
                  )}
                </div>
              )
            )}
          </div>

          {/* User menu desktop */}
          <div className="hidden md:flex items-center gap-3">
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
                        isAdmin ? "bg-green-100 text-green-700" : "bg-stone-100 text-stone-500"
                      }`}>
                        {isAdmin ? "Administrador" : "Operario"}
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
                      <button type="submit" className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50">
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
            onClick={() => setMobileOpen((v) => !v)}
            className="md:hidden flex flex-col justify-center items-center w-10 h-10 gap-1.5 rounded-lg hover:bg-green-800 transition-colors"
            aria-label="Menú"
          >
            <span className={`block w-5 h-0.5 bg-white transition-all duration-200 ${mobileOpen ? "rotate-45 translate-y-2" : ""}`} />
            <span className={`block w-5 h-0.5 bg-white transition-all duration-200 ${mobileOpen ? "opacity-0" : ""}`} />
            <span className={`block w-5 h-0.5 bg-white transition-all duration-200 ${mobileOpen ? "-rotate-45 -translate-y-2" : ""}`} />
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      {mobileOpen && (
        <div className="md:hidden border-t border-green-800 bg-green-900 px-4 pb-4 pt-2 space-y-1">
          {sections.map((section) =>
            section.children.length === 0 ? (
              <Link
                key={section.href}
                href={section.href}
                onClick={() => setMobileOpen(false)}
                className={`flex items-center px-4 py-3 rounded-lg text-sm font-medium transition-colors ${
                  isSectionActive(section) ? "bg-green-700 text-white" : "text-green-100 hover:bg-green-800"
                }`}
              >
                {section.label}
              </Link>
            ) : (
              <div key={section.href}>
                <button
                  onClick={() => setMobileExpanded(mobileExpanded === section.href ? null : section.href)}
                  className={`w-full flex items-center justify-between px-4 py-3 rounded-lg text-sm font-medium transition-colors ${
                    isSectionActive(section) ? "bg-green-700 text-white" : "text-green-100 hover:bg-green-800"
                  }`}
                >
                  <Link
                    href={section.href}
                    onClick={(e) => { e.stopPropagation(); setMobileOpen(false); }}
                    className="flex-1 text-left"
                  >
                    {section.label}
                  </Link>
                  <svg
                    className={`w-4 h-4 opacity-70 transition-transform ${mobileExpanded === section.href ? "rotate-180" : ""}`}
                    fill="none" viewBox="0 0 24 24" stroke="currentColor"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>

                {mobileExpanded === section.href && (
                  <div className="mt-1 ml-4 space-y-1">
                    {section.children.map((child) => (
                      <Link
                        key={child.href}
                        href={child.href}
                        onClick={() => setMobileOpen(false)}
                        className={`flex items-center justify-between px-4 py-2.5 rounded-lg text-sm transition-colors ${
                          isActive(child.href)
                            ? "bg-green-600 text-white font-medium"
                            : "text-green-200 hover:bg-green-800"
                        }`}
                      >
                        {child.label}
                        {child.badge && (
                          <span className="bg-red-500 text-white text-xs rounded-full px-1.5 py-0.5 font-bold leading-none">
                            {transferenciasCount > 9 ? "9+" : transferenciasCount}
                          </span>
                        )}
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            )
          )}

          {/* Usuario mobile */}
          {user && (
            <div className="border-t border-green-800 pt-3 mt-2">
              <div className="px-4 py-2">
                <p className="text-sm font-medium text-white">{user.nombre}</p>
                <p className="text-xs text-green-300">{user.empresa_nombre}</p>
                <span className={`inline-block mt-1 text-xs px-2 py-0.5 rounded-full font-medium ${
                  isAdmin ? "bg-green-700 text-green-100" : "bg-green-800 text-green-300"
                }`}>
                  {isAdmin ? "Administrador" : "Operario"}
                </span>
              </div>
              <Link
                href="/perfil"
                onClick={() => setMobileOpen(false)}
                className="block px-4 py-3 rounded-lg text-sm text-green-100 hover:bg-green-800"
              >
                Mi perfil
              </Link>
              <form action={signOut}>
                <button type="submit" className="w-full text-left px-4 py-3 rounded-lg text-sm text-red-300 hover:bg-green-800">
                  Cerrar sesión
                </button>
              </form>
            </div>
          )}
        </div>
      )}
    </nav>
  );
}
