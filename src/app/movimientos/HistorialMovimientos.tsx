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
          className="border border-stone-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-300"
        >
          <option value="">Todos los campos</option>
          {campos.map((c) => (
            <option key={c.id} value={c.id}>{c.nombre}</option>
          ))}
        </select>
        <div className="flex items-center gap-2">
          <label className="text-xs text-stone-500">Desde</label>
          <input
            type="date"
            value={desde}
            onChange={(e) => setDesde(e.target.value)}
            className="border border-stone-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-300"
          />
        </div>
        <div className="flex items-center gap-2">
          <label className="text-xs text-stone-500">Hasta</label>
          <input
            type="date"
            value={hasta}
            onChange={(e) => setHasta(e.target.value)}
            className="border border-stone-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-300"
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

      <div className="bg-white rounded-xl border border-stone-200 overflow-hidden shadow-sm">
        {filtrados.length === 0 ? (
          <p className="px-4 py-8 text-stone-400 text-sm text-center">
            Sin movimientos para mostrar
          </p>
        ) : (
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
        )}
      </div>
      <p className="text-xs text-stone-400">{filtrados.length} de {movimientos.length} movimientos</p>
    </div>
  );
}
