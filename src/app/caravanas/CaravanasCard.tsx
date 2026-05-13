"use client";

import { useState } from "react";
import { actualizarCaravanas } from "./actions";

export default function CaravanasCard({
  compradas,
  bajas,
  activos,
}: {
  compradas: number;
  bajas: number;
  activos: number;
}) {
  const [editando, setEditando] = useState(false);
  const [valCompradas, setValCompradas] = useState(String(compradas));
  const [valBajas, setValBajas] = useState(String(bajas));
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function guardar() {
    setGuardando(true);
    setError(null);
    const res = await actualizarCaravanas({
      caravanas_compradas: parseInt(valCompradas) || 0,
      caravanas_bajas: parseInt(valBajas) || 0,
    });
    if (!res.ok) setError(res.error ?? "Error");
    else setEditando(false);
    setGuardando(false);
  }

  function cancelar() {
    setValCompradas(String(compradas));
    setValBajas(String(bajas));
    setEditando(false);
    setError(null);
  }

  const inputClass = "w-24 border border-stone-300 rounded-lg px-2 py-1 text-lg font-bold text-stone-800 focus:outline-none focus:ring-2 focus:ring-green-300 text-center";

  return (
    <div className="bg-white rounded-xl border border-stone-200 shadow-sm p-5 col-span-2 sm:col-span-4">
      <div className="flex items-center justify-between mb-4">
        <p className="text-xs font-semibold text-stone-400 uppercase tracking-wider">Control de caravanas</p>
        {!editando ? (
          <button
            onClick={() => setEditando(true)}
            className="text-xs text-green-700 hover:underline font-medium"
          >
            Editar
          </button>
        ) : (
          <div className="flex gap-2">
            <button
              onClick={guardar}
              disabled={guardando}
              className="text-xs px-3 py-1 bg-green-700 text-white rounded-lg hover:bg-green-600 disabled:opacity-50"
            >
              {guardando ? "Guardando..." : "Guardar"}
            </button>
            <button onClick={cancelar} className="text-xs px-3 py-1 border border-stone-300 rounded-lg hover:bg-stone-50">
              Cancelar
            </button>
          </div>
        )}
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div className="text-center">
          <p className="text-xs text-stone-400 mb-1">Compradas</p>
          {editando ? (
            <input
              type="number"
              min="0"
              value={valCompradas}
              onChange={(e) => setValCompradas(e.target.value)}
              className={inputClass}
              autoFocus
            />
          ) : (
            <p className="text-3xl font-bold text-stone-800">{compradas}</p>
          )}
        </div>

        <div className="text-center">
          <p className="text-xs text-stone-400 mb-1">Animales activos</p>
          <p className="text-3xl font-bold text-green-700">{activos}</p>
        </div>

        <div className="text-center">
          <p className="text-xs text-stone-400 mb-1">Dadas de baja</p>
          {editando ? (
            <input
              type="number"
              min="0"
              value={valBajas}
              onChange={(e) => setValBajas(e.target.value)}
              className={inputClass}
            />
          ) : (
            <p className="text-3xl font-bold text-amber-600">{bajas}</p>
          )}
        </div>
      </div>

      {error && <p className="text-xs text-red-600 mt-3 text-center">{error}</p>}

      {!editando && compradas > 0 && (
        <div className="mt-4">
          <div className="flex justify-between text-xs text-stone-400 mb-1">
            <span>Activos vs compradas</span>
            <span className="font-medium text-stone-600">{compradas > 0 ? Math.round((activos / compradas) * 100) : 0}%</span>
          </div>
          <div className="h-2 bg-stone-100 rounded-full overflow-hidden">
            <div
              className="h-full bg-green-500 rounded-full transition-all"
              style={{ width: `${compradas > 0 ? Math.min(100, Math.round((activos / compradas) * 100)) : 0}%` }}
            />
          </div>
        </div>
      )}
    </div>
  );
}
