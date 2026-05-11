"use client";

import { useState } from "react";

type Transaccion = {
  id: string;
  tipo: string;
  fecha: string;
  fechaRaw: string;
  contraparte: string;
  precio_total: number | null;
  numero_remito: string | null;
  cantidad_animales: number;
};

type AnimalDetalle = {
  id: string;
  precio_unitario: number | null;
  animal: { chip_id: string; numero_caravana: string | null; categoria: string | null; raza: string | null } | null;
};

function formatPeso(n: number | null) {
  if (n === null) return "—";
  return `$${Number(n).toLocaleString("es-AR", { minimumFractionDigits: 2 })}`;
}

export default function HistorialTransacciones({ transacciones }: { transacciones: Transaccion[] }) {
  const [tipoFiltro, setTipoFiltro] = useState("");
  const [desde, setDesde] = useState("");
  const [hasta, setHasta] = useState("");
  const [expandido, setExpandido] = useState<string | null>(null);
  const [detalle, setDetalle] = useState<Record<string, AnimalDetalle[]>>({});
  const [cargandoDetalle, setCargandoDetalle] = useState<string | null>(null);

  const filtradas = transacciones.filter((t) => {
    if (tipoFiltro && t.tipo !== tipoFiltro) return false;
    if (desde && t.fechaRaw < desde) return false;
    if (hasta && t.fechaRaw > hasta) return false;
    return true;
  });

  async function toggleDetalle(id: string) {
    if (expandido === id) { setExpandido(null); return; }
    setExpandido(id);
    if (detalle[id]) return;
    setCargandoDetalle(id);
    try {
      const res = await fetch(`/api/transacciones/${id}/animales`);
      const data = await res.json();
      setDetalle((prev) => ({ ...prev, [id]: data }));
    } catch { /* silently fail */ }
    finally { setCargandoDetalle(null); }
  }

  return (
    <div className="space-y-4">
      <h2 className="text-lg font-semibold text-gray-700">Historial de transacciones</h2>

      {/* Filtros */}
      <div className="flex flex-wrap gap-3">
        <select
          value={tipoFiltro}
          onChange={(e) => setTipoFiltro(e.target.value)}
          className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-300"
        >
          <option value="">Compras y ventas</option>
          <option value="compra">Solo compras</option>
          <option value="venta">Solo ventas</option>
        </select>
        <div className="flex items-center gap-2">
          <label className="text-xs text-gray-500">Desde</label>
          <input type="date" value={desde} onChange={(e) => setDesde(e.target.value)}
            className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-300" />
        </div>
        <div className="flex items-center gap-2">
          <label className="text-xs text-gray-500">Hasta</label>
          <input type="date" value={hasta} onChange={(e) => setHasta(e.target.value)}
            className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-300" />
        </div>
        {(tipoFiltro || desde || hasta) && (
          <button onClick={() => { setTipoFiltro(""); setDesde(""); setHasta(""); }}
            className="text-xs text-gray-400 hover:text-gray-600 underline">
            Limpiar filtros
          </button>
        )}
      </div>

      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        {filtradas.length === 0 ? (
          <p className="px-4 py-8 text-gray-400 text-sm text-center">Sin transacciones para mostrar</p>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-gray-500 text-xs uppercase">
              <tr>
                <th className="px-4 py-3 text-left">Fecha</th>
                <th className="px-4 py-3 text-left">Tipo</th>
                <th className="px-4 py-3 text-left">Contraparte</th>
                <th className="px-4 py-3 text-left">Animales</th>
                <th className="px-4 py-3 text-left">Total</th>
                <th className="px-4 py-3 text-left">Remito</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filtradas.map((t) => (
                <>
                  <tr
                    key={t.id}
                    onClick={() => toggleDetalle(t.id)}
                    className="hover:bg-gray-50 cursor-pointer"
                  >
                    <td className="px-4 py-3 text-gray-600 whitespace-nowrap">{t.fecha}</td>
                    <td className="px-4 py-3">
                      <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${
                        t.tipo === "compra" ? "bg-blue-100 text-blue-700" : "bg-orange-100 text-orange-700"
                      }`}>
                        {t.tipo}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-gray-700">{t.contraparte}</td>
                    <td className="px-4 py-3 text-gray-600">{t.cantidad_animales}</td>
                    <td className="px-4 py-3 text-gray-700 font-medium">{formatPeso(t.precio_total)}</td>
                    <td className="px-4 py-3 text-gray-500">{t.numero_remito ?? "—"}</td>
                  </tr>
                  {expandido === t.id && (
                    <tr key={`${t.id}-detalle`}>
                      <td colSpan={6} className="bg-gray-50 px-6 py-3">
                        {cargandoDetalle === t.id ? (
                          <p className="text-xs text-gray-400">Cargando animales...</p>
                        ) : detalle[t.id] ? (
                          <table className="w-full text-xs">
                            <thead>
                              <tr className="text-gray-400 uppercase">
                                <th className="pb-1 text-left">Chip ID</th>
                                <th className="pb-1 text-left">Caravana</th>
                                <th className="pb-1 text-left">Categoría</th>
                                <th className="pb-1 text-left">Raza</th>
                                <th className="pb-1 text-left">Precio unit.</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-200">
                              {detalle[t.id].map((item) => (
                                <tr key={item.id}>
                                  <td className="py-1 font-mono pr-4">{item.animal?.chip_id ?? "—"}</td>
                                  <td className="py-1 pr-4 text-gray-500">{item.animal?.numero_caravana ?? "—"}</td>
                                  <td className="py-1 pr-4 text-gray-500 capitalize">{item.animal?.categoria ?? "—"}</td>
                                  <td className="py-1 pr-4 text-gray-500">{item.animal?.raza ?? "—"}</td>
                                  <td className="py-1 text-gray-600">{formatPeso(item.precio_unitario)}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        ) : (
                          <p className="text-xs text-gray-400">Sin datos</p>
                        )}
                      </td>
                    </tr>
                  )}
                </>
              ))}
            </tbody>
          </table>
        )}
      </div>
      <p className="text-xs text-gray-400">{filtradas.length} de {transacciones.length} transacciones</p>
    </div>
  );
}
