"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { crearAlimento, actualizarAlimento, toggleActivo } from "./actions";

type Alimento = { id: string; nombre: string; precio_por_tonelada: number; activo: boolean };

export default function AlimentosConfig({ items }: { items: Alimento[] }) {
  const router = useRouter();
  const [mostrarNuevo, setMostrarNuevo] = useState(false);
  const [nuevoNombre, setNuevoNombre] = useState("");
  const [nuevoPrecio, setNuevoPrecio] = useState("");
  const [editandoId, setEditandoId] = useState<string | null>(null);
  const [editNombre, setEditNombre] = useState("");
  const [editPrecio, setEditPrecio] = useState("");
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleCrear() {
    if (!nuevoNombre.trim() || !nuevoPrecio) return;
    setGuardando(true);
    setError(null);
    const res = await crearAlimento({ nombre: nuevoNombre, precio_por_tonelada: parseFloat(nuevoPrecio) });
    if (res.ok) {
      setNuevoNombre("");
      setNuevoPrecio("");
      setMostrarNuevo(false);
      router.refresh();
    } else {
      setError(res.error ?? "Error al crear");
    }
    setGuardando(false);
  }

  async function handleActualizar(id: string) {
    if (!editNombre.trim() || !editPrecio) return;
    setGuardando(true);
    setError(null);
    const res = await actualizarAlimento(id, { nombre: editNombre, precio_por_tonelada: parseFloat(editPrecio) });
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
    await toggleActivo("alimentos", id, !activo);
    router.refresh();
    setGuardando(false);
  }

  return (
    <div className="space-y-4">
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg px-4 py-2 text-sm text-red-600">{error}</div>
      )}

      {mostrarNuevo ? (
        <div className="flex gap-2 items-center flex-wrap">
          <input
            autoFocus
            value={nuevoNombre}
            onChange={(e) => setNuevoNombre(e.target.value)}
            placeholder="Nombre del alimento..."
            className="border border-stone-300 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-300 w-52"
          />
          <div className="flex items-center gap-1">
            <span className="text-sm text-stone-500">$</span>
            <input
              type="number"
              min="0"
              step="0.01"
              value={nuevoPrecio}
              onChange={(e) => setNuevoPrecio(e.target.value)}
              placeholder="Precio por tonelada"
              className="border border-stone-300 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-300 w-44"
            />
            <span className="text-xs text-stone-400">/ton</span>
          </div>
          <button
            onClick={handleCrear}
            disabled={guardando || !nuevoNombre.trim() || !nuevoPrecio}
            className="px-3 py-1.5 bg-green-800 text-white rounded-lg text-sm hover:bg-green-700 disabled:opacity-40"
          >
            {guardando ? "..." : "Guardar"}
          </button>
          <button
            onClick={() => { setMostrarNuevo(false); setNuevoNombre(""); setNuevoPrecio(""); }}
            className="px-3 py-1.5 border border-stone-300 rounded-lg text-sm hover:bg-stone-50"
          >
            Cancelar
          </button>
        </div>
      ) : (
        <button
          onClick={() => { setMostrarNuevo(true); setEditandoId(null); }}
          className="px-4 py-2 border border-dashed border-stone-300 rounded-xl text-sm text-stone-500 hover:border-gray-400 hover:text-stone-700 w-full text-center"
        >
          + Agregar alimento
        </button>
      )}

      <div className="bg-white rounded-xl border border-stone-200 shadow-sm overflow-x-auto">
        {items.length === 0 ? (
          <p className="px-4 py-8 text-center text-sm text-stone-400">No hay alimentos cargados aún</p>
        ) : (
          <table className="w-full min-w-max text-sm">
            <thead className="bg-stone-50 text-xs text-stone-500 uppercase">
              <tr>
                <th className="px-4 py-3 text-left">Nombre</th>
                <th className="px-4 py-3 text-right">Precio / tonelada</th>
                <th className="px-4 py-3 text-left">Estado</th>
                <th className="px-4 py-3 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100">
              {items.map((item) =>
                editandoId === item.id ? (
                  <tr key={item.id} className="bg-blue-50">
                    <td className="px-4 py-2">
                      <input
                        autoFocus
                        value={editNombre}
                        onChange={(e) => setEditNombre(e.target.value)}
                        className="w-full border border-stone-300 rounded px-2 py-1 text-sm focus:outline-none focus:ring-1 focus:ring-green-300"
                      />
                    </td>
                    <td className="px-4 py-2">
                      <div className="flex items-center gap-1 justify-end">
                        <span className="text-stone-400 text-xs">$</span>
                        <input
                          type="number"
                          min="0"
                          step="0.01"
                          value={editPrecio}
                          onChange={(e) => setEditPrecio(e.target.value)}
                          className="w-36 border border-stone-300 rounded px-2 py-1 text-sm text-right focus:outline-none focus:ring-1 focus:ring-green-300"
                        />
                      </div>
                    </td>
                    <td colSpan={2} className="px-4 py-2">
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleActualizar(item.id)}
                          disabled={guardando}
                          className="px-3 py-1 bg-green-800 text-white rounded text-xs hover:bg-green-700 disabled:opacity-40"
                        >
                          {guardando ? "..." : "Guardar"}
                        </button>
                        <button
                          onClick={() => setEditandoId(null)}
                          className="px-3 py-1 border border-stone-300 rounded text-xs hover:bg-stone-50"
                        >
                          Cancelar
                        </button>
                      </div>
                    </td>
                  </tr>
                ) : (
                  <tr key={item.id} className={`hover:bg-stone-50 ${!item.activo ? "opacity-50" : ""}`}>
                    <td className="px-4 py-3 text-stone-800 font-medium">{item.nombre}</td>
                    <td className="px-4 py-3 text-stone-700 text-right font-mono">
                      ${Number(item.precio_por_tonelada).toLocaleString("es-AR", { minimumFractionDigits: 2 })}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${item.activo ? "bg-green-100 text-green-700" : "bg-stone-100 text-stone-500"}`}>
                        {item.activo ? "Activo" : "Inactivo"}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex gap-2 justify-end">
                        <button
                          onClick={() => { setEditandoId(item.id); setEditNombre(item.nombre); setEditPrecio(String(item.precio_por_tonelada)); setMostrarNuevo(false); }}
                          className="text-xs text-stone-500 hover:text-stone-800 underline"
                        >
                          Editar
                        </button>
                        <button
                          onClick={() => handleToggle(item.id, item.activo)}
                          disabled={guardando}
                          className="text-xs text-stone-500 hover:text-stone-800 underline disabled:opacity-40"
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
