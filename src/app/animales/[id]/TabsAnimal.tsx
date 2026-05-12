"use client";

import { useState } from "react";

type Movimiento = {
  id: string;
  fecha: string;
  origen: string;
  destino: string;
  motivo: string;
  observaciones: string | null;
};

type Pesaje = {
  id: string;
  fecha: string;
  peso: number;
  campo: string;
  observaciones: string | null;
};

type Evento = {
  id: string;
  fecha: string;
  tipo: string;
  producto: string;
  dosis: number | null;
  veterinario: string;
  descripcion: string | null;
};

const TABS = ["Movimientos", "Pesajes", "Eventos sanitarios"] as const;
type Tab = (typeof TABS)[number];

export default function TabsAnimal({
  movimientos,
  pesajes,
  eventos,
}: {
  movimientos: Movimiento[];
  pesajes: Pesaje[];
  eventos: Evento[];
}) {
  const [tab, setTab] = useState<Tab>("Movimientos");

  return (
    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
      {/* Pestañas */}
      <div className="flex border-b border-gray-200">
        {TABS.map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-5 py-3 text-sm font-medium border-b-2 transition-colors ${
              tab === t
                ? "border-green-800 text-gray-800"
                : "border-transparent text-gray-400 hover:text-gray-600"
            }`}
          >
            {t}
          </button>
        ))}
      </div>

      <div className="p-4">
        {tab === "Movimientos" &&
          (movimientos.length === 0 ? (
            <p className="text-gray-400 text-sm py-4 text-center">
              Sin registros
            </p>
          ) : (
            <table className="w-full text-sm">
              <thead className="text-xs text-gray-400 uppercase">
                <tr>
                  <th className="pb-2 text-left">Fecha</th>
                  <th className="pb-2 text-left">Origen</th>
                  <th className="pb-2 text-left">Destino</th>
                  <th className="pb-2 text-left">Motivo</th>
                  <th className="pb-2 text-left">Observaciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {movimientos.map((m) => (
                  <tr key={m.id}>
                    <td className="py-2 pr-4 text-gray-600 whitespace-nowrap">
                      {m.fecha}
                    </td>
                    <td className="py-2 pr-4 text-gray-600">{m.origen}</td>
                    <td className="py-2 pr-4 text-gray-600">{m.destino}</td>
                    <td className="py-2 pr-4 text-gray-600">{m.motivo}</td>
                    <td className="py-2 text-gray-400">
                      {m.observaciones ?? "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ))}

        {tab === "Pesajes" &&
          (pesajes.length === 0 ? (
            <p className="text-gray-400 text-sm py-4 text-center">
              Sin registros
            </p>
          ) : (
            <table className="w-full text-sm">
              <thead className="text-xs text-gray-400 uppercase">
                <tr>
                  <th className="pb-2 text-left">Fecha</th>
                  <th className="pb-2 text-left">Peso</th>
                  <th className="pb-2 text-left">Campo</th>
                  <th className="pb-2 text-left">Observaciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {pesajes.map((p) => (
                  <tr key={p.id}>
                    <td className="py-2 pr-4 text-gray-600 whitespace-nowrap">
                      {p.fecha}
                    </td>
                    <td className="py-2 pr-4 text-gray-700 font-medium">
                      {Number(p.peso).toFixed(2)} kg
                    </td>
                    <td className="py-2 pr-4 text-gray-600">{p.campo}</td>
                    <td className="py-2 text-gray-400">
                      {p.observaciones ?? "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ))}

        {tab === "Eventos sanitarios" &&
          (eventos.length === 0 ? (
            <p className="text-gray-400 text-sm py-4 text-center">
              Sin registros
            </p>
          ) : (
            <table className="w-full text-sm">
              <thead className="text-xs text-gray-400 uppercase">
                <tr>
                  <th className="pb-2 text-left">Fecha</th>
                  <th className="pb-2 text-left">Tipo</th>
                  <th className="pb-2 text-left">Producto</th>
                  <th className="pb-2 text-left">Dosis</th>
                  <th className="pb-2 text-left">Veterinario</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {eventos.map((e) => (
                  <tr key={e.id}>
                    <td className="py-2 pr-4 text-gray-600 whitespace-nowrap">
                      {e.fecha}
                    </td>
                    <td className="py-2 pr-4 text-gray-600 capitalize">
                      {e.tipo}
                    </td>
                    <td className="py-2 pr-4 text-gray-600">{e.producto}</td>
                    <td className="py-2 pr-4 text-gray-600">
                      {e.dosis !== null ? `${e.dosis} ml` : "—"}
                    </td>
                    <td className="py-2 text-gray-600">{e.veterinario}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          ))}
      </div>
    </div>
  );
}
