"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { toggleActivo } from "./actions";

type Item = { id: string; nombre: string; activo: boolean };

type Props = {
  tabla: "categorias" | "razas";
  items: Item[];
  onCrear: (nombre: string) => Promise<{ ok: boolean; error?: string }>;
  onActualizar: (id: string, nombre: string) => Promise<{ ok: boolean; error?: string }>;
};

export default function SimpleListConfig({ tabla, items, onCrear, onActualizar }: Props) {
  const router = useRouter();
  const [nuevoNombre, setNuevoNombre] = useState("");
  const [mostrarNuevo, setMostrarNuevo] = useState(false);
  const [editandoId, setEditandoId] = useState<string | null>(null);
  const [editNombre, setEditNombre] = useState("");
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleCrear() {
    if (!nuevoNombre.trim()) return;
    setGuardando(true);
    setError(null);
    const res = await onCrear(nuevoNombre);
    if (res.ok) {
      setNuevoNombre("");
      setMostrarNuevo(false);
      router.refresh();
    } else {
      setError(res.error ?? "Error al crear");
    }
    setGuardando(false);
  }

  async function handleActualizar(id: string) {
    if (!editNombre.trim()) return;
    setGuardando(true);
    setError(null);
    const res = await onActualizar(id, editNombre);
    if (res.ok) {
      setEditandoId(null);
      router.refresh();
    } else {
      setError(res.error ?? "Error al actualizar");
    }
    setGuardando(false);
  }

  async function handleToggle(id: string, activo: boolean) {
    setGuardando(true);
    await toggleActivo(tabla, id, !activo);
    router.refresh();
    setGuardando(false);
  }

  return (
    <div className="space-y-4">
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg px-4 py-2 text-sm text-red-600">
          {error}
        </div>
      )}

      {mostrarNuevo ? (
        <div className="flex gap-2 items-center">
          <input
            autoFocus
            value={nuevoNombre}
            onChange={(e) => setNuevoNombre(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleCrear()}
            placeholder="Nombre..."
            className="border border-gray-300 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-gray-300 w-64"
          />
          <button
            onClick={handleCrear}
            disabled={guardando || !nuevoNombre.trim()}
            className="px-3 py-1.5 bg-gray-800 text-white rounded-lg text-sm hover:bg-gray-700 disabled:opacity-40"
          >
            {guardando ? "..." : "Guardar"}
          </button>
          <button
            onClick={() => { setMostrarNuevo(false); setNuevoNombre(""); }}
            className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm hover:bg-gray-50"
          >
            Cancelar
          </button>
        </div>
      ) : (
        <button
          onClick={() => { setMostrarNuevo(true); setEditandoId(null); }}
          className="px-4 py-2 border border-dashed border-gray-300 rounded-xl text-sm text-gray-500 hover:border-gray-400 hover:text-gray-700 w-full text-center"
        >
          + Agregar
        </button>
      )}

      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        {items.length === 0 ? (
          <p className="px-4 py-8 text-center text-sm text-gray-400">No hay registros aún</p>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-xs text-gray-500 uppercase">
              <tr>
                <th className="px-4 py-3 text-left">Nombre</th>
                <th className="px-4 py-3 text-left">Estado</th>
                <th className="px-4 py-3 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {items.map((item) =>
                editandoId === item.id ? (
                  <tr key={item.id} className="bg-blue-50">
                    <td className="px-4 py-2">
                      <input
                        autoFocus
                        value={editNombre}
                        onChange={(e) => setEditNombre(e.target.value)}
                        onKeyDown={(e) => e.key === "Enter" && handleActualizar(item.id)}
                        className="w-full border border-gray-300 rounded px-2 py-1 text-sm focus:outline-none focus:ring-1 focus:ring-gray-300"
                      />
                    </td>
                    <td colSpan={2} className="px-4 py-2">
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleActualizar(item.id)}
                          disabled={guardando}
                          className="px-3 py-1 bg-gray-800 text-white rounded text-xs hover:bg-gray-700 disabled:opacity-40"
                        >
                          {guardando ? "..." : "Guardar"}
                        </button>
                        <button
                          onClick={() => setEditandoId(null)}
                          className="px-3 py-1 border border-gray-300 rounded text-xs hover:bg-gray-50"
                        >
                          Cancelar
                        </button>
                      </div>
                    </td>
                  </tr>
                ) : (
                  <tr key={item.id} className={`hover:bg-gray-50 ${!item.activo ? "opacity-50" : ""}`}>
                    <td className="px-4 py-3 text-gray-800">{item.nombre}</td>
                    <td className="px-4 py-3">
                      <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${item.activo ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"}`}>
                        {item.activo ? "Activo" : "Inactivo"}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex gap-2 justify-end">
                        <button
                          onClick={() => { setEditandoId(item.id); setEditNombre(item.nombre); setMostrarNuevo(false); }}
                          className="text-xs text-gray-500 hover:text-gray-800 underline"
                        >
                          Editar
                        </button>
                        <button
                          onClick={() => handleToggle(item.id, item.activo)}
                          disabled={guardando}
                          className="text-xs text-gray-500 hover:text-gray-800 underline disabled:opacity-40"
                        >
                          {item.activo ? "Desactivar" : "Activar"}
                        </button>
                      </div>
                    </td>
                  </tr>
                )
              )}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
