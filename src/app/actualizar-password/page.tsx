"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function ActualizarPasswordPage() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [confirmar, setConfirmar] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [cargando, setCargando] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);

    if (password.length < 6) {
      setError("La contraseña debe tener al menos 6 caracteres.");
      return;
    }
    if (password !== confirmar) {
      setError("Las contraseñas no coinciden.");
      return;
    }

    setCargando(true);
    const supabase = createClient();
    const { error: updateError } = await supabase.auth.updateUser({ password });
    setCargando(false);

    if (updateError) {
      setError("No se pudo actualizar la contraseña. Pedí un nuevo link de recuperación e intentá de nuevo.");
      return;
    }

    await supabase.auth.signOut();
    router.replace("/login");
  }

  return (
    <div className="max-w-sm mx-auto mt-12">
      <div className="text-center mb-6">
        <h1 className="text-2xl font-bold text-stone-800">Nueva contraseña</h1>
        <p className="text-stone-500 text-sm mt-1">Elegí una nueva contraseña para tu cuenta</p>
      </div>

      <form onSubmit={handleSubmit} className="bg-white rounded-xl border border-stone-200 shadow-sm p-6 space-y-4">
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg px-4 py-3 text-sm text-red-600">
            {error}
          </div>
        )}

        <div>
          <label className="block text-xs font-medium text-stone-600 mb-1">Contraseña nueva</label>
          <input
            type="password"
            required
            autoComplete="new-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full border border-stone-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-300"
            placeholder="••••••••"
          />
        </div>

        <div>
          <label className="block text-xs font-medium text-stone-600 mb-1">Confirmar contraseña</label>
          <input
            type="password"
            required
            autoComplete="new-password"
            value={confirmar}
            onChange={(e) => setConfirmar(e.target.value)}
            className="w-full border border-stone-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-300"
            placeholder="••••••••"
          />
        </div>

        <button
          type="submit"
          disabled={cargando}
          className="w-full py-2.5 bg-green-800 text-white rounded-lg text-sm font-medium hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {cargando ? "Guardando..." : "Guardar contraseña"}
        </button>
      </form>
    </div>
  );
}
