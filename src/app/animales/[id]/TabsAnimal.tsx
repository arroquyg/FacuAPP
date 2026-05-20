"use client";

import { useState } from "react";
import React from "react";
import { formatearValor } from "@/lib/columnas-clinicas";

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
  precioUnitario: number | null;
  unidad: string | null;
  veterinario: string;
  descripcion: string | null;
};

type Nutricion = {
  id: string;
  loteId: string;
  loteNombre: string;
  campo: string;
  fechaEntrada: string;
  fechaSalida: string;
  dias: number;
  pesoEntrada: number;
  pesoSalida: number | null;
  kgGanados: number | null;
  pctGanado: number | null;
  costoAcum: number;
  activo: boolean;
};

type HistorialClinico = {
  id: string;
  trabajoId: string;
  fecha: string;
  tipo: string;
  veterinario: string;
  campo: string;
  empresa: string;
  columnas: string[];
  datos: (string | null)[];
};

const TABS = ["Movimientos", "Pesajes", "Eventos sanitarios", "Historia clínica", "Nutrición"] as const;
type Tab = (typeof TABS)[number];

export default function TabsAnimal({
  movimientos,
  pesajes,
  eventos,
  historialClinico,
  nutricion,
  formEventoSanitario,
}: {
  movimientos: Movimiento[];
  pesajes: Pesaje[];
  eventos: Evento[];
  historialClinico: HistorialClinico[];
  nutricion: Nutricion[];
  formEventoSanitario?: React.ReactNode;
}) {
  const [tab, setTab] = useState<Tab>("Movimientos");
  const [expandido, setExpandido] = useState<string | null>(null);

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

        {tab === "Eventos sanitarios" && (
          <div className="space-y-4">
            {formEventoSanitario}
            {eventos.length === 0 ? (
              <p className="text-stone-400 text-sm py-4 text-center">Sin registros</p>
            ) : (
              <div className="overflow-x-auto -mx-4 px-4">
                <table className="text-sm min-w-max w-full">
                  <thead className="text-xs text-stone-400 uppercase">
                    <tr>
                      <th className="pb-2 pr-4 text-left whitespace-nowrap">Fecha</th>
                      <th className="pb-2 pr-4 text-left whitespace-nowrap">Tipo</th>
                      <th className="pb-2 pr-4 text-left whitespace-nowrap">Producto</th>
                      <th className="pb-2 pr-4 text-left whitespace-nowrap">Dosis</th>
                      <th className="pb-2 pr-4 text-left whitespace-nowrap">Veterinario</th>
                      <th className="pb-2 text-right whitespace-nowrap">Costo</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-stone-100">
                    {eventos.map((e) => {
                      const costo = e.dosis != null && e.precioUnitario != null
                        ? e.dosis * e.precioUnitario
                        : null;
                      return (
                        <tr key={e.id}>
                          <td className="py-2 pr-4 text-stone-600 whitespace-nowrap">{e.fecha}</td>
                          <td className="py-2 pr-4 text-stone-600 capitalize whitespace-nowrap">{e.tipo}</td>
                          <td className="py-2 pr-4 text-stone-600">{e.producto}</td>
                          <td className="py-2 pr-4 text-stone-600 whitespace-nowrap">{e.dosis !== null ? `${e.dosis} ${e.unidad || "ud"}` : "—"}</td>
                          <td className="py-2 pr-4 text-stone-600">{e.veterinario}</td>
                          <td className="py-2 text-right whitespace-nowrap text-stone-700">
                            {costo != null
                              ? `$${costo.toLocaleString("es-AR", { minimumFractionDigits: 2 })}`
                              : "—"}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                  {eventos.length > 1 && (() => {
                    const total = eventos.reduce((sum, e) => {
                      if (e.dosis != null && e.precioUnitario != null) return sum + e.dosis * e.precioUnitario;
                      return sum;
                    }, 0);
                    return total > 0 ? (
                      <tfoot>
                        <tr className="border-t-2 border-stone-200 bg-stone-50">
                          <td colSpan={5} className="py-2 pr-4 text-right text-xs font-semibold text-stone-500 uppercase tracking-wide">Total</td>
                          <td className="py-2 text-right whitespace-nowrap font-bold text-stone-800">
                            ${total.toLocaleString("es-AR", { minimumFractionDigits: 2 })}
                          </td>
                        </tr>
                      </tfoot>
                    ) : null;
                  })()}
                </table>
              </div>
            )}
          </div>
        )}

        {tab === "Historia clínica" &&
          (historialClinico.length === 0 ? (
            <p className="text-stone-400 text-sm py-4 text-center">
              Sin registros de trabajos para este animal
            </p>
          ) : (
            <div className="space-y-2">
              {historialClinico.map((h) => (
                <div key={h.id} className="border border-stone-200 rounded-lg overflow-hidden">
                  <button
                    onClick={() => setExpandido(expandido === h.id ? null : h.id)}
                    className="w-full flex items-center justify-between px-4 py-3 bg-stone-50 hover:bg-stone-100 transition-colors text-left"
                  >
                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 min-w-0">
                      <span className="text-xs text-stone-400 whitespace-nowrap">{h.fecha}</span>
                      <span className="text-sm font-medium text-stone-800 whitespace-nowrap">{h.tipo}</span>
                      <span className="text-xs text-stone-500 whitespace-nowrap">Empresa: {h.empresa}</span>
                      <span className="text-xs text-stone-500 whitespace-nowrap">Vet: {h.veterinario}</span>
                      <span className="text-xs text-stone-500 whitespace-nowrap">Campo: {h.campo}</span>
                    </div>
                    <span className="text-stone-400 text-sm ml-3 shrink-0">
                      {expandido === h.id ? "▲" : "▼"}
                    </span>
                  </button>

                  {expandido === h.id && (
                    <div className="px-4 py-3 bg-white">
                      {h.columnas.length === 0 ? (
                        <p className="text-stone-400 text-sm">Sin datos registrados</p>
                      ) : (
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                          {h.columnas.map((col, i) => (
                            <div key={i}>
                              <p className="text-xs text-stone-400 uppercase tracking-wide">{col}</p>
                              <p className="text-sm font-medium text-stone-800 mt-0.5">
                                {formatearValor(col, h.datos[i] ?? null)}
                              </p>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          ))}

        {tab === "Nutrición" &&
          (nutricion.length === 0 ? (
            <p className="text-stone-400 text-sm py-4 text-center">
              Sin registros de lotes para este animal
            </p>
          ) : (
            <div className="overflow-x-auto -mx-4 px-4">
              <table className="text-sm min-w-max w-full">
                <thead className="text-xs text-stone-400 uppercase">
                  <tr>
                    <th className="pb-2 pr-4 text-left whitespace-nowrap">Lote</th>
                    <th className="pb-2 pr-4 text-left whitespace-nowrap">Campo</th>
                    <th className="pb-2 pr-4 text-left whitespace-nowrap">Entrada</th>
                    <th className="pb-2 pr-4 text-left whitespace-nowrap">Salida</th>
                    <th className="pb-2 pr-4 text-right whitespace-nowrap">Días</th>
                    <th className="pb-2 pr-4 text-right whitespace-nowrap">Peso entrada</th>
                    <th className="pb-2 pr-4 text-right whitespace-nowrap">Peso salida</th>
                    <th className="pb-2 pr-4 text-right whitespace-nowrap">Kg ganados</th>
                    <th className="pb-2 text-right whitespace-nowrap">Costo acumulado</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-100">
                  {nutricion.map((n) => (
                    <tr key={n.id}>
                      <td className="py-2 pr-4 text-stone-700 font-medium whitespace-nowrap">
                        <a href={`/lotes/${n.loteId}`} className="text-green-800 hover:underline">{n.loteNombre}</a>
                        {n.activo && <span className="ml-1 text-xs text-green-600">(activo)</span>}
                      </td>
                      <td className="py-2 pr-4 text-stone-600 whitespace-nowrap">{n.campo}</td>
                      <td className="py-2 pr-4 text-stone-600 whitespace-nowrap">{n.fechaEntrada}</td>
                      <td className="py-2 pr-4 text-stone-600 whitespace-nowrap">{n.activo ? "En curso" : n.fechaSalida}</td>
                      <td className="py-2 pr-4 text-stone-600 text-right">{n.dias}</td>
                      <td className="py-2 pr-4 text-stone-600 text-right whitespace-nowrap">{n.pesoEntrada} kg</td>
                      <td className="py-2 pr-4 text-stone-600 text-right whitespace-nowrap">
                        {n.pesoSalida != null ? `${n.pesoSalida} kg` : "—"}
                      </td>
                      <td className="py-2 pr-4 text-right whitespace-nowrap">
                        {n.kgGanados != null ? (
                          <span className={`font-medium ${n.kgGanados >= 0 ? "text-green-700" : "text-red-600"}`}>
                            {n.kgGanados > 0 ? "+" : ""}{n.kgGanados} kg
                            {n.pctGanado != null && (
                              <span className="text-xs ml-1 opacity-70">({n.pctGanado}%)</span>
                            )}
                          </span>
                        ) : "—"}
                      </td>
                      <td className="py-2 text-right whitespace-nowrap text-stone-700 font-medium">
                        ${n.costoAcum.toLocaleString("es-AR", { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
                        {n.activo && <span className="text-xs text-stone-400 ml-1">(est.)</span>}
                      </td>
                    </tr>
                  ))}
                  {nutricion.length > 1 && (
                    <tr className="border-t-2 border-stone-200 bg-stone-50">
                      <td colSpan={8} className="py-2 pr-4 text-right text-xs font-semibold text-stone-500 uppercase tracking-wide">Total</td>
                      <td className="py-2 text-right whitespace-nowrap font-bold text-stone-800">
                        ${nutricion.reduce((s, n) => s + n.costoAcum, 0).toLocaleString("es-AR", { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          ))}
      </div>
    </div>
  );
}
