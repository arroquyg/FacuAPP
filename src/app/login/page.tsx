"use client";

import { useState } from "react";
import { signIn } from "./actions";

export default function LoginPage() {
  const [error, setError] = useState<string | null>(null);
  const [cargando, setCargando] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setCargando(true);
    setError(null);
    const formData = new FormData(e.currentTarget);
    const res = await signIn(formData);
    if (res?.error) {
      setError(res.error);
      setCargando(false);
    }
  }

  return (
    <div className="relative min-h-screen flex items-center justify-center px-4 overflow-hidden">
      {/* Video de fondo */}
      <video
        autoPlay
        loop
        muted
        playsInline
        className="absolute inset-0 w-full h-full object-cover"
        src="/login-bg-compressed.mp4"
      />
      {/* Overlay oscuro */}
      <div className="absolute inset-0 bg-black/50" />

      <div className="relative z-10 w-full max-w-sm">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-white">Sistema Ganadero</h1>
          <p className="text-stone-300 text-sm mt-1">Ingresá con tu cuenta</p>
        </div>

        <form onSubmit={handleSubmit} className="bg-white rounded-xl border border-stone-200 shadow-sm p-6 space-y-4">
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg px-4 py-3 text-sm text-red-600">
              {error}
            </div>
          )}

          <div>
            <label className="block text-xs font-medium text-stone-600 mb-1">Email</label>
            <input
              name="email"
              type="email"
              required
              autoComplete="email"
              className="w-full border border-stone-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-300"
              placeholder="tu@email.com"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-stone-600 mb-1">Contraseña</label>
            <input
              name="password"
              type="password"
              required
              autoComplete="current-password"
              className="w-full border border-stone-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-300"
              placeholder="••••••••"
            />
          </div>

          <button
            type="submit"
            disabled={cargando}
            className="w-full py-2.5 bg-green-800 text-white rounded-lg text-sm font-medium hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {cargando ? "Ingresando..." : "Ingresar"}
          </button>
        </form>
      </div>
    </div>
  );
}
