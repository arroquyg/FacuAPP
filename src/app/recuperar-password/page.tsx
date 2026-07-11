"use client";

import { useState } from "react";
import Link from "next/link";
import { requestPasswordReset } from "./actions";

export default function RecuperarPasswordPage() {
  const [enviado, setEnviado] = useState(false);
  const [cargando, setCargando] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setCargando(true);
    const formData = new FormData(e.currentTarget);
    await requestPasswordReset(formData);
    setCargando(false);
    setEnviado(true);
  }

  return (
    <div className="max-w-sm mx-auto mt-12">
      <div className="text-center mb-6">
        <h1 className="text-2xl font-bold text-stone-800">Recuperar contraseña</h1>
        <p className="text-stone-500 text-sm mt-1">Te enviamos un link para elegir una nueva</p>
      </div>

      <div className="bg-white rounded-xl border border-stone-200 shadow-sm p-6">
        {enviado ? (
          <div className="text-sm text-stone-600 space-y-4">
            <p>
              Si el email está registrado, te llegará un link para restablecer tu contraseña.
              Revisá también la carpeta de spam.
            </p>
            <Link href="/login" className="block text-center text-green-800 font-medium hover:underline">
              Volver al login
            </Link>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
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

            <Link href="/login" className="block text-center text-xs text-stone-500 hover:underline">
              Volver al login
            </Link>
          </form>
        )}
      </div>
    </div>
  );
}
