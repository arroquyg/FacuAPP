"use client";

import { useState } from "react";
import { crearUsuario, toggleActivo, asignarCampo, quitarCampo } from "./actions";

type Usuario = {
  id: string;
  nombre: string;
  email: string;
  rol: string;
  activo: boolean;
  campos: { id: string; nombre: string }[];
};

type Campo = { id: string; nombre: string };

export default function UsuariosAdmin({
  usuarios,
  campos,
}: {
  usuarios: Usuario[];
  campos: Campo[];
}) {
  const [mostrarForm, setMostrarForm] = useState(false);
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [expandido, setExpandido] = useState<string | null>(null);

  async function handleCrear(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setGuardando(true);
    setError(null);
    const formData = new FormData(e.currentTarget);
    const res = await crearUsuario(formData);
    if (!res.ok) {
      setError(res.error ?? "Error al crear el usuario");
      setGuardando(false);
    } else {
      setMostrarForm(false);
      setGuardando(false);
      (e.target as HTMLFormElement).reset();
    }
  }

  return (
    <div className="space-y-6">
      {/* Botón nuevo usuario */}
      <div className="flex justify-end">
        <button
          onClick={() => { setMostrarForm((v) => !v); setError(null); }}
          className="px-4 py-2 bg-green-800 text-white rounded-lg text-sm hover:bg-green-700 transition-colors"
        >
          {mostrarForm ? "Cancelar" : "+ Nuevo usuario"}
        </button>
      </div>

      {/* Formulario nuevo usuario */}
      {mostrarForm && (
        <form onSubmit={handleCrear} className="bg-white rounded-xl border border-stone-200 shadow-sm p-6 space-y-4">
          <p className="font-medium text-stone-800">Nuevo usuario</p>
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg px-4 py-3 text-sm text-red-600">{error}</div>
          )}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs text-stone-500 mb-1">Nombre completo *</label>
              <input name="nombre" required className="w-full border border-stone-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-300" />
            </div>
            <div>
              <label className="block text-xs text-stone-500 mb-1">Email *</label>
              <input name="email" type="email" required className="w-full border border-stone-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-300" />
            </div>
            <div>
              <label className="block text-xs text-stone-500 mb-1">Contraseña inicial *</label>
              <input name="password" type="password" required minLength={6} className="w-full border border-stone-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-300" />
            </div>
            <div>
              <label className="block text-xs text-stone-500 mb-1">Rol *</label>
              <select name="rol" required className="w-full border border-stone-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-300">
                <option value="operario">Operario</option>
                <option value="admin">Administrador</option>
              </select>
            </div>
          </div>
          <button
            type="submit"
            disabled={guardando}
            className="px-5 py-2 bg-green-800 text-white rounded-lg text-sm hover:bg-green-700 disabled:opacity-40"
          >
            {guardando ? "Creando..." : "Crear usuario"}
          </button>
        </form>
      )}

      {/* Lista de usuarios */}
      <div className="space-y-3">
        {usuarios.length === 0 ? (
          <div className="bg-white rounded-xl border border-stone-200 p-8 text-center text-stone-400 text-sm">
            No hay usuarios registrados todavía
          </div>
        ) : (
          usuarios.map((u) => (
            <div key={u.id} className="bg-white rounded-xl border border-stone-200 shadow-sm">
              <div className="p-4 flex items-center justify-between gap-3">
                <div className="flex items-center gap-3 min-w-0">
                  <div className={`w-9 h-9 rounded-full flex items-center justify-center text-white text-sm font-bold shrink-0 ${u.activo ? "bg-green-700" : "bg-stone-400"}`}>
                    {u.nombre.charAt(0).toUpperCase()}
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="font-medium text-stone-800 text-sm">{u.nombre}</p>
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                        u.rol === "admin" ? "bg-green-100 text-green-700" : "bg-stone-100 text-stone-500"
                      }`}>
                        {u.rol === "admin" ? "Admin" : "Operario"}
                      </span>
                      {!u.activo && (
                        <span className="text-xs px-2 py-0.5 rounded-full bg-red-100 text-red-600 font-medium">Inactivo</span>
                      )}
                    </div>
                    <p className="text-xs text-stone-400">{u.email}</p>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  {u.rol === "operario" && (
                    <button
                      onClick={() => setExpandido(expandido === u.id ? null : u.id)}
                      className="text-xs text-green-700 hover:underline font-medium"
                    >
                      {expandido === u.id ? "Cerrar" : `Campos (${u.campos.length})`}
                    </button>
                  )}
                  <button
                    onClick={() => toggleActivo(u.id, !u.activo)}
                    className={`text-xs px-3 py-1 rounded-lg border font-medium transition-colors ${
                      u.activo
                        ? "border-stone-300 text-stone-500 hover:bg-stone-50"
                        : "border-green-300 text-green-700 hover:bg-green-50"
                    }`}
                  >
                    {u.activo ? "Desactivar" : "Activar"}
                  </button>
                </div>
              </div>

              {/* Panel de campos del operario */}
              {expandido === u.id && u.rol === "operario" && (
                <div className="border-t border-stone-100 px-4 py-4 space-y-3">
                  <p className="text-xs font-semibold text-stone-400 uppercase tracking-wider">Campos asignados</p>
                  <div className="flex flex-wrap gap-2">
                    {u.campos.map((c) => (
                      <span key={c.id} className="flex items-center gap-1.5 px-3 py-1 bg-green-50 border border-green-200 text-green-700 text-sm rounded-lg">
                        {c.nombre}
                        <button
                          onClick={() => quitarCampo(u.id, c.id)}
                          className="text-green-400 hover:text-red-500 font-bold leading-none"
                          title="Quitar campo"
                        >
                          ×
                        </button>
                      </span>
                    ))}
                    {u.campos.length === 0 && (
                      <p className="text-sm text-stone-400">Sin campos asignados</p>
                    )}
                  </div>

                  <div>
                    <p className="text-xs text-stone-400 mb-1.5">Asignar campo:</p>
                    <div className="flex flex-wrap gap-2">
                      {campos
                        .filter((c) => !u.campos.find((uc) => uc.id === c.id))
                        .map((c) => (
                          <button
                            key={c.id}
                            onClick={() => asignarCampo(u.id, c.id)}
                            className="px-3 py-1 border border-dashed border-stone-300 text-stone-500 text-sm rounded-lg hover:border-green-400 hover:text-green-700 hover:bg-green-50 transition-colors"
                          >
                            + {c.nombre}
                          </button>
                        ))}
                      {campos.filter((c) => !u.campos.find((uc) => uc.id === c.id)).length === 0 && (
                        <p className="text-sm text-stone-400">Todos los campos ya están asignados</p>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
