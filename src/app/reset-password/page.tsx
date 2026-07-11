"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import Link from "next/link";

export default function ResetPasswordPage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [estado, setEstado] = useState<"cargando" | "listo" | "exito" | "error">("cargando");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [cargando, setCargando] = useState(false);
  const [verPassword, setVerPassword] = useState(false);

  useEffect(() => {
    const code = searchParams.get("code");
    if (!code) {
      setEstado("error");
      setErrorMsg("El link de recuperación es inválido o expiró. Solicitá uno nuevo.");
      return;
    }

    const sb = createClient();
    sb.auth.exchangeCodeForSession(code).then(({ error }) => {
      if (error) {
        setEstado("error");
        setErrorMsg("El link de recuperación expiró. Solicitá uno nuevo.");
      } else {
        setEstado("listo");
      }
    });
  }, [searchParams]);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setCargando(true);
    setErrorMsg(null);

    const formData = new FormData(e.currentTarget);
    const password = formData.get("password") as string;
    const confirmar = formData.get("confirmar") as string;

    if (password !== confirmar) {
      setErrorMsg("Las contraseñas no coinciden.");
      setCargando(false);
      return;
    }

    if (password.length < 6) {
      setErrorMsg("La contraseña debe tener al menos 6 caracteres.");
      setCargando(false);
      return;
    }

    const sb = createClient();
    const { error } = await sb.auth.updateUser({ password });

    if (error) {
      setErrorMsg("No se pudo actualizar la contraseña. Intentá de nuevo.");
      setCargando(false);
    } else {
      setEstado("exito");
      setTimeout(() => router.push("/login"), 2500);
    }
  }

  return (
    <div className="relative min-h-screen flex items-center justify-center px-4 overflow-hidden">
      <video
        autoPlay
        loop
        muted
        playsInline
        className="absolute inset-0 w-full h-full object-cover"
        src="/login-bg-compressed.mp4"
      />
      <div className="absolute inset-0 bg-black/50" />

      <div className="relative z-10 w-full max-w-sm">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-white">Sistema Ganadero</h1>
          <p className="text-stone-300 text-sm mt-1">Nueva contraseña</p>
        </div>

        <div className="bg-white rounded-xl border border-stone-200 shadow-sm p-6">
          {estado === "cargando" && (
            <p className="text-sm text-stone-500 text-center">Verificando link...</p>
          )}

          {estado === "error" && (
            <div className="text-center space-y-4">
              <p className="text-sm text-red-600">{errorMsg}</p>
              <Link
                href="/forgot-password"
                className="block text-sm text-green-800 hover:underline"
              >
                Solicitar nuevo link
              </Link>
            </div>
          )}

          {estado === "exito" && (
            <div className="text-center space-y-3">
              <div className="text-green-700 text-4xl">✓</div>
              <p className="text-sm text-stone-700 font-medium">
                ¡Contraseña actualizada correctamente!
              </p>
              <p className="text-xs text-stone-500">Redirigiendo al inicio de sesión...</p>
            </div>
          )}

          {estado === "listo" && (
            <form onSubmit={handleSubmit} className="space-y-4">
              {errorMsg && (
                <div className="bg-red-50 border border-red-200 rounded-lg px-4 py-3 text-sm text-red-600">
                  {errorMsg}
                </div>
              )}

              <div>
                <label className="block text-xs font-medium text-stone-600 mb-1">
                  Nueva contraseña
                </label>
                <div className="relative">
                  <input
                    name="password"
                    type={verPassword ? "text" : "password"}
                    required
                    autoComplete="new-password"
                    className="w-full border border-stone-300 rounded-lg px-3 py-2 pr-10 text-sm focus:outline-none focus:ring-2 focus:ring-green-300"
                    placeholder="••••••••"
                  />
                  <button
                    type="button"
                    onClick={() => setVerPassword((v) => !v)}
                    className="absolute inset-y-0 right-0 flex items-center px-3 text-stone-400 hover:text-stone-600"
                    tabIndex={-1}
                  >
                    {verPassword ? (
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 4.411m0 0L21 21" />
                      </svg>
                    ) : (
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                      </svg>
                    )}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-stone-600 mb-1">
                  Confirmar contraseña
                </label>
                <input
                  name="confirmar"
                  type={verPassword ? "text" : "password"}
                  required
                  autoComplete="new-password"
                  className="w-full border border-stone-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-300"
                  placeholder="••••••••"
                />
              </div>

              <button
                type="submit"
                disabled={cargando}
                className="w-full py-2.5 bg-green-800 text-white rounded-lg text-sm font-medium hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {cargando ? "Guardando..." : "Guardar nueva contraseña"}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
