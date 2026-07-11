"use client";

import { useState } from "react";
import Link from "next/link";
import { requestPasswordReset } from "./actions";

export default function ForgotPasswordPage() {
  const [estado, setEstado] = useState<"idle" | "enviado" | "error">("idle");
  const [mensajeError, setMensajeError] = useState<string | null>(null);
  const [cargando, setCargando] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setCargando(true);
    setMensajeError(null);

    const formData = new FormData(e.currentTarget);
    const res = await requestPasswordReset(formData);

    if (res?.error) {
      setMensajeError(res.error);
      setEstado("error");
    } else {
      setEstado("enviado");
    }
    setCargando(false);
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
          <p className="text-stone-300 text-sm mt-1">Recuperá tu contraseña</p>
        </div>

        <div className="bg-white rounded-xl border border-stone-200 shadow-sm p-6">
          {estado === "enviado" ? (
            <div className="text-center space-y-4">
              <div className="text-green-700 text-4xl">✓</div>
              <p className="text-sm text-stone-700 font-medium">
                Te enviamos un correo con el link para restablecer tu contraseña.
              </p>
              <p className="text-xs text-stone-500">
                Revisá tu bandeja de entrada y también spam.
              </p>
              <Link
                href="/login"
                className="block text-center text-sm text-green-800 hover:underline mt-2"
              >
                Volver al inicio de sesión
              </Link>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              {mensajeError && (
                <div className="bg-red-50 border border-red-200 rounded-lg px-4 py-3 text-sm text-red-600">
                  {mensajeError}
                </div>
              )}

              <p className="text-sm text-stone-600">
                Ingresá tu email y te enviamos un link para restablecer tu contraseña.
              </p>

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

              <button
                type="submit"
                disabled={cargando}
                className="w-full py-2.5 bg-green-800 text-white rounded-lg text-sm font-medium hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {cargando ? "Enviando..." : "Enviar link de recuperación"}
              </button>

              <div className="text-center">
                <Link
                  href="/login"
                  className="text-xs text-stone-500 hover:text-stone-700 hover:underline"
                >
                  Volver al inicio de sesión
                </Link>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
