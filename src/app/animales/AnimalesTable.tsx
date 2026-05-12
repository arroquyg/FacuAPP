"use client";

import Link from "next/link";
import { useState } from "react";

type Lookup = { id: string; nombre: string };
type Campo = { id: string; nombre: string };
type Animal = {
  id: string;
  chip_id: string;
  numero_caravana: string | null;
  categoria: string | null;
  raza: string | null;
  estado_sanitario: string | null;
  activo: boolean;
  vivo: boolean;
  campo: { id: string; nombre: string } | null;
};

export default function AnimalesTable({
  animales,
  campos,
  categorias,
  razas,
  soloLectura = false,
}: {
  animales: Animal[];
  campos: Campo[];
  categorias: Lookup[];
  razas: Lookup[];
  soloLectura?: boolean;
}) {
  const [busqueda, setBusqueda] = useState("");
  const [campoFiltro, setCampoFiltro] = useState("");
  const [categoriaFiltro, setCategoriaFiltro] = useState("");
  const [razaFiltro, setRazaFiltro] = useState("");
  const [sanitarioFiltro, setSanitarioFiltro] = useState("");
  const [vivoFiltro, setVivoFiltro] = useState("vivos");

  const estadosSanitarios = [
    ...new Set(animales.map((a) => a.estado_sanitario).filter(Boolean)),
  ] as string[];

  const filtrados = animales.filter((a) => {
    const q = busqueda.toLowerCase();
    if (
      q &&
      !a.chip_id.toLowerCase().includes(q) &&
      !(a.numero_caravana ?? "").toLowerCase().includes(q)
    )
      return false;
    if (campoFiltro && a.campo?.id !== campoFiltro) return false;
    if (categoriaFiltro && a.categoria !== categoriaFiltro) return false;
    if (razaFiltro && a.raza !== razaFiltro) return false;
    if (sanitarioFiltro && a.estado_sanitario !== sanitarioFiltro) return false;
    if (vivoFiltro === "vivos" && !a.vivo) return false;
    if (vivoFiltro === "muertos" && a.vivo) return false;
    return true;
  });

  const selectClass = "border border-stone-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-300 w-full sm:w-auto bg-white";

  return (
    <div className="space-y-4">
      {/* Filtros */}
      <div className="bg-white rounded-xl border border-stone-200 shadow-sm p-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:flex lg:flex-wrap gap-3">
          <input
            type="text"
            placeholder="Buscar por caravana..."
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            className="border border-stone-300 rounded-lg px-3 py-2 text-sm w-full lg:w-64 focus:outline-none focus:ring-2 focus:ring-green-300"
          />
          <select value={campoFiltro} onChange={(e) => setCampoFiltro(e.target.value)} className={selectClass}>
            <option value="">Todos los campos</option>
            {campos.map((c) => (
              <option key={c.id} value={c.id}>{c.nombre}</option>
            ))}
          </select>
          <select value={categoriaFiltro} onChange={(e) => setCategoriaFiltro(e.target.value)} className={selectClass}>
            <option value="">Todas las categorías</option>
            {categorias.map((c) => (
              <option key={c.id} value={c.nombre}>{c.nombre}</option>
            ))}
          </select>
          <select value={razaFiltro} onChange={(e) => setRazaFiltro(e.target.value)} className={selectClass}>
            <option value="">Todas las razas</option>
            {razas.map((r) => (
              <option key={r.id} value={r.nombre}>{r.nombre}</option>
            ))}
          </select>
          <select value={sanitarioFiltro} onChange={(e) => setSanitarioFiltro(e.target.value)} className={selectClass}>
            <option value="">Todos los estados san.</option>
            {estadosSanitarios.map((e) => (
              <option key={e} value={e}>{e}</option>
            ))}
          </select>
          <select value={vivoFiltro} onChange={(e) => setVivoFiltro(e.target.value)} className={selectClass}>
            <option value="todos">Todos</option>
            <option value="vivos">Vivos</option>
            <option value="muertos">Muertos</option>
          </select>
        </div>
      </div>

      {filtrados.length === 0 ? (
        <p className="px-4 py-8 text-stone-400 text-sm text-center bg-white rounded-xl border border-stone-200">
          No se encontraron animales con esos filtros
        </p>
      ) : (
        <>
          {/* Mobile cards */}
          <div className="md:hidden space-y-2">
            {filtrados.map((a) => (
              <Link
                key={a.id}
                href={`/animales/${a.id}`}
                className="block bg-white rounded-xl border border-stone-200 p-4 shadow-sm active:bg-stone-50"
              >
                <div className="flex items-start justify-between gap-2">
                  <span className="font-semibold text-green-700 text-base font-mono">{a.chip_id}</span>
                  <span className={`shrink-0 inline-block px-2 py-0.5 rounded-full text-xs font-medium ${a.vivo ? "bg-green-100 text-green-700" : "bg-red-100 text-red-600"}`}>
                    {a.vivo ? "Vivo" : "Muerto"}
                  </span>
                </div>
                <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-stone-500">
                  {a.categoria && <span className="capitalize">{a.categoria}</span>}
                  {a.raza && <span>{a.raza}</span>}
                  {a.campo && <span>{a.campo.nombre}</span>}
                  {a.estado_sanitario && <span>{a.estado_sanitario}</span>}
                </div>
              </Link>
            ))}
          </div>

          {/* Desktop table */}
          <div className="hidden md:block bg-white rounded-xl border border-stone-200 shadow-sm overflow-x-auto">
            <table className="w-full min-w-max text-sm">
              <thead className="bg-stone-50 text-stone-400 text-xs uppercase border-b border-stone-100">
                <tr>
                  <th className="px-4 py-3 text-left">Caravana</th>
                  <th className="px-4 py-3 text-left">Categoría</th>
                  <th className="px-4 py-3 text-left">Raza</th>
                  <th className="px-4 py-3 text-left">Campo actual</th>
                  <th className="px-4 py-3 text-left">Estado sanitario</th>
                  <th className="px-4 py-3 text-left">Estado</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100">
                {filtrados.map((a) => (
                  <tr key={a.id} className="hover:bg-stone-50 cursor-pointer">
                    <td className="px-4 py-3">
                      <Link
                        href={`/animales/${a.id}`}
                        className="text-green-700 hover:underline font-medium"
                      >
                        {a.chip_id}
                      </Link>
                    </td>
                    <td className="px-4 py-3 text-stone-600 capitalize">{a.categoria ?? "—"}</td>
                    <td className="px-4 py-3 text-stone-600">{a.raza ?? "—"}</td>
                    <td className="px-4 py-3 text-stone-600">{a.campo?.nombre ?? "—"}</td>
                    <td className="px-4 py-3 text-stone-600">{a.estado_sanitario ?? "—"}</td>
                    <td className="px-4 py-3">
                      <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${a.vivo ? "bg-green-100 text-green-700" : "bg-red-100 text-red-600"}`}>
                        {a.vivo ? "Vivo" : "Muerto"}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}

      <p className="text-xs text-stone-400">
        {filtrados.length} de {animales.length} animales
      </p>
    </div>
  );
}
