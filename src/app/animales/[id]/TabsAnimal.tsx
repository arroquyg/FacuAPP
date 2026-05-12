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
    <div className="bg-white rounded-xl border border-stone-200 shadow-sm">
      {/* Pestañas */}
      <div className="flex overflow-x-auto border-b border-stone-200 bg-stone-50 rounded-t-xl">
        {TABS.map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-5 py-3 text-sm font-medium border-b-2 transition-colors ${
              tab === t
                ? "border-green-800 text-stone-800"
                : "border-transparent text-stone-400 hover:text-stone-600"
            }`}
          >
            {t}
          </button>
        ))}
      </div>

      <div className="p-4">
        {tab === "Movimientos" &&
          (movimientos.length === 0 ? (
            <p className="text-stone-400 text-sm py-4 text-center">
              Sin registros
            </p>
          ) : (
            <div className="overflow-x-auto -mx-4 px-4">
              <table className="text-sm min-w-max w-full">
                <thead className="text-xs text-stone-400 uppercase">
                  <tr>
                    <th className="pb-2 pr-4 text-left whitespace-nowrap">Fecha</th>
                    <th className="pb-2 pr-4 text-left whitespace-nowrap">Origen</th>
                    <th className="pb-2 pr-4 text-left whitespace-nowrap">Destino</th>
                    <th className="pb-2 pr-4 text-left whitespace-nowrap">Motivo</th>
                    <th className="pb-2 text-left whitespace-nowrap">Observaciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-100">
                  {movimientos.map((m) => (
                    <tr key={m.id}>
                      <td className="py-2 pr-4 text-stone-600 whitespace-nowrap">{m.fecha}</td>
                      <td className="py-2 pr-4 text-stone-600 whitespace-nowrap">{m.origen}</td>
                      <td className="py-2 pr-4 text-stone-600 whitespace-nowrap">{m.destino}</td>
                      <td className="py-2 pr-4 text-stone-600">{m.motivo}</td>
                      <td className="py-2 text-stone-400">{m.observaciones ?? "—"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ))}

        {tab === "Pesajes" &&
          (pesajes.length === 0 ? (
            <p className="text-stone-400 text-sm py-4 text-center">
              Sin registros
            </p>
          ) : (
            <div className="overflow-x-auto -mx-4 px-4">
              <table className="text-sm min-w-max w-full">
                <thead className="text-xs text-stone-400 uppercase">
                  <tr>
                    <th className="pb-2 pr-4 text-left whitespace-nowrap">Fecha</th>
                    <th className="pb-2 pr-4 text-left whitespace-nowrap">Peso</th>
                    <th className="pb-2 pr-4 text-left whitespace-nowrap">Campo</th>
                    <th className="pb-2 text-left whitespace-nowrap">Observaciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-100">
                  {pesajes.map((p) => (
                    <tr key={p.id}>
                      <td className="py-2 pr-4 text-stone-600 whitespace-nowrap">{p.fecha}</td>
                      <td className="py-2 pr-4 text-stone-700 font-medium whitespace-nowrap">{Number(p.peso).toFixed(2)} kg</td>
                      <td className="py-2 pr-4 text-stone-600">{p.campo}</td>
                      <td className="py-2 text-stone-400">{p.observaciones ?? "—"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ))}

        {tab === "Eventos sanitarios" &&
          (eventos.length === 0 ? (
            <p className="text-stone-400 text-sm py-4 text-center">
              Sin registros
            </p>
          ) : (
            <div className="overflow-x-auto -mx-4 px-4">
              <table className="text-sm min-w-max w-full">
                <thead className="text-xs text-stone-400 uppercase">
                  <tr>
                    <th className="pb-2 pr-4 text-left whitespace-nowrap">Fecha</th>
                    <th className="pb-2 pr-4 text-left whitespace-nowrap">Tipo</th>
                    <th className="pb-2 pr-4 text-left whitespace-nowrap">Producto</th>
                    <th className="pb-2 pr-4 text-left whitespace-nowrap">Dosis</th>
                    <th className="pb-2 text-left whitespace-nowrap">Veterinario</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-100">
                  {eventos.map((e) => (
                    <tr key={e.id}>
                      <td className="py-2 pr-4 text-stone-600 whitespace-nowrap">{e.fecha}</td>
                      <td className="py-2 pr-4 text-stone-600 capitalize whitespace-nowrap">{e.tipo}</td>
                      <td className="py-2 pr-4 text-stone-600">{e.producto}</td>
                      <td className="py-2 pr-4 text-stone-600 whitespace-nowrap">{e.dosis !== null ? `${e.dosis} ml` : "—"}</td>
                      <td className="py-2 text-stone-600">{e.veterinario}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ))}
      </div>
    </div>
  );
}
