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
}: {
  animales: Animal[];
  campos: Campo[];
  categorias: Lookup[];
  razas: Lookup[];
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

  return (
    <div className="space-y-4">
      {/* Filtros */}
      <div className="flex flex-wrap gap-3">
        <input
          type="text"
          placeholder="Buscar por chip o caravana..."
          value={busqueda}
          onChange={(e) => setBusqueda(e.target.value)}
          className="border border-gray-300 rounded-lg px-3 py-2 text-sm w-64 focus:outline-none focus:ring-2 focus:ring-gray-300"
        />
        <select
          value={campoFiltro}
          onChange={(e) => setCampoFiltro(e.target.value)}
          className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-300"
        >
          <option value="">Todos los campos</option>
          {campos.map((c) => (
            <option key={c.id} value={c.id}>{c.nombre}</option>
          ))}
        </select>
        <select
          value={categoriaFiltro}
          onChange={(e) => setCategoriaFiltro(e.target.value)}
          className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-300"
        >
          <option value="">Todas las categorías</option>
          {categorias.map((c) => (
            <option key={c.id} value={c.nombre}>{c.nombre}</option>
          ))}
        </select>
        <select
          value={razaFiltro}
          onChange={(e) => setRazaFiltro(e.target.value)}
          className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-300"
        >
          <option value="">Todas las razas</option>
          {razas.map((r) => (
            <option key={r.id} value={r.nombre}>{r.nombre}</option>
          ))}
        </select>
        <select
          value={sanitarioFiltro}
          onChange={(e) => setSanitarioFiltro(e.target.value)}
          className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-300"
        >
          <option value="">Todos los estados san.</option>
          {estadosSanitarios.map((e) => (
            <option key={e} value={e}>{e}</option>
          ))}
        </select>
        <select
          value={vivoFiltro}
          onChange={(e) => setVivoFiltro(e.target.value)}
          className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-300"
        >
          <option value="todos">Todos</option>
          <option value="vivos">Vivos</option>
          <option value="muertos">Muertos</option>
        </select>
      </div>

      {/* Tabla */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        {filtrados.length === 0 ? (
          <p className="px-4 py-8 text-gray-400 text-sm text-center">
            No se encontraron animales con esos filtros
          </p>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-gray-500 text-xs uppercase">
              <tr>
                <th className="px-4 py-3 text-left">Chip ID</th>
                <th className="px-4 py-3 text-left">Caravana</th>
                <th className="px-4 py-3 text-left">Categoría</th>
                <th className="px-4 py-3 text-left">Raza</th>
                <th className="px-4 py-3 text-left">Campo actual</th>
                <th className="px-4 py-3 text-left">Estado sanitario</th>
                <th className="px-4 py-3 text-left">Estado</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filtrados.map((a) => (
                <tr key={a.id} className="hover:bg-gray-50 cursor-pointer">
                  <td className="px-4 py-3">
                    <Link
                      href={`/animales/${a.id}`}
                      className="font-mono text-blue-600 hover:underline"
                    >
                      {a.chip_id}
                    </Link>
                  </td>
                  <td className="px-4 py-3 text-gray-600">{a.numero_caravana ?? "—"}</td>
                  <td className="px-4 py-3 text-gray-600 capitalize">{a.categoria ?? "—"}</td>
                  <td className="px-4 py-3 text-gray-600">{a.raza ?? "—"}</td>
                  <td className="px-4 py-3 text-gray-600">{a.campo?.nombre ?? "—"}</td>
                  <td className="px-4 py-3 text-gray-600">{a.estado_sanitario ?? "—"}</td>
                  <td className="px-4 py-3">
                    <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${a.vivo ? "bg-green-100 text-green-700" : "bg-red-100 text-red-600"}`}>
                      {a.vivo ? "Vivo" : "Muerto"}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
      <p className="text-xs text-gray-400">
        {filtrados.length} de {animales.length} animales
      </p>
    </div>
  );
}
