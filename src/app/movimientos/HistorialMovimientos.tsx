"use client";

import { useState } from "react";

type Movimiento = {
  id: string;
  fecha: string;
  chip_id: string;
  origen: string;
  destino: string;
  motivo: string | null;
};

type Campo = { id: string; nombre: string };

export default function HistorialMovimientos({
  movimientos,
  campos,
}: {
  movimientos: Movimiento[];
  campos: Campo[];
}) {
  const [campofiltro, setCampoFiltro] = useState("");
  const [desde, setDesde] = useState("");
  const [hasta, setHasta] = useState("");

  const filtrados = movimientos.filter((m) => {
    if (campofiltro) {
      const campo = campos.find((c) => c.id === campofiltro);
      if (!campo) return false;
      if (m.origen !== campo.nombre && m.destino !== campo.nombre) return false;
    }
    if (desde && m.fecha < desde) return false;
    if (hasta && m.fecha > hasta) return false;
    return true;
  });

  return (
    <div className="space-y-4">
      <h2 className="text-lg font-semibold text-stone-700">Historial de movimientos</h2>

      {/* Filtros */}
      <div className="flex flex-wrap gap-3">
        <select
          value={campofiltro}
          onChange={(e) => setCampoFiltro(e.target.value)}
          className="border border-stone-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-300 bg-white w-full sm:w-auto"
        >
          <option value="">Todos los campos</option>
          {campos.map((c) => (
            <option key={c.id} value={c.id}>{c.nombre}</option>
          ))}
        </select>
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <label className="text-xs text-stone-500 shrink-0">Desde</label>
          <input
            type="date"
            value={desde}
            onChange={(e) => setDesde(e.target.value)}
            className="border border-stone-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-300 flex-1 sm:flex-none"
          />
        </div>
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <label className="text-xs text-stone-500 shrink-0">Hasta</label>
          <input
            type="date"
            value={hasta}
            onChange={(e) => setHasta(e.target.value)}
            className="border border-stone-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-300 flex-1 sm:flex-none"
          />
        </div>
        {(campofiltro || desde || hasta) && (
          <button
            onClick={() => { setCampoFiltro(""); setDesde(""); setHasta(""); }}
            className="text-xs text-stone-400 hover:text-stone-600 underline"
          >
            Limpiar filtros
          </button>
        )}
      </div>

      {filtrados.length === 0 ? (
        <div className="bg-white rounded-xl border border-stone-200 p-8 text-center shadow-sm">
          <p className="text-stone-400 text-sm">Sin movimientos para mostrar</p>
        </div>
      ) : (
        <>
          {/* Mobile cards */}
          <div className="md:hidden space-y-2">
            {filtrados.map((m) => (
              <div key={m.id} className="bg-white rounded-xl border border-stone-200 p-4 shadow-sm">
                <div className="flex items-start justify-between gap-2">
                  <span className="font-mono text-sm font-semibold text-stone-700">{m.chip_id}</span>
                  <span className="text-xs text-stone-400 shrink-0">{m.fecha}</span>
                </div>
                <div className="mt-2 flex items-center gap-1.5 text-xs text-stone-500">
                  <span className="font-medium text-stone-600">{m.origen}</span>
                  <span>→</span>
                  <span className="font-medium text-stone-600">{m.destino}</span>
                </div>
                {m.motivo && (
                  <p className="mt-1 text-xs text-stone-400">{m.motivo}</p>
                )}
              </div>
            ))}
          </div>

          {/* Desktop table */}
          <div className="hidden md:block bg-white rounded-xl border border-stone-200 overflow-hidden shadow-sm">
            <table className="w-full text-sm">
              <thead className="bg-stone-50 text-stone-400 text-xs uppercase border-b border-stone-100">
                <tr>
                  <th className="px-4 py-3 text-left">Fecha</th>
                  <th className="px-4 py-3 text-left">Caravana</th>
                  <th className="px-4 py-3 text-left">Origen</th>
                  <th className="px-4 py-3 text-left">Destino</th>
                  <th className="px-4 py-3 text-left">Motivo</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100">
                {filtrados.map((m) => (
                  <tr key={m.id} className="hover:bg-stone-50">
                    <td className="px-4 py-3 text-stone-600 whitespace-nowrap">{m.fecha}</td>
                    <td className="px-4 py-3 font-mono text-stone-700">{m.chip_id}</td>
                    <td className="px-4 py-3 text-stone-600">{m.origen}</td>
                    <td className="px-4 py-3 text-stone-600">{m.destino}</td>
                    <td className="px-4 py-3 text-stone-500">{m.motivo ?? "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}

      <p className="text-xs text-stone-400">{filtrados.length} de {movimientos.length} movimientos</p>
    </div>
  );
}
