"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { crearTrabajo } from "./actions";
import { COLUMNAS_PREDEFINIDAS } from "@/lib/columnas-clinicas";

const MAX_COLUMNAS = 10;

export default function NuevoTrabajo() {
  const router = useRouter();
  const [tipo, setTipo] = useState("");
  const [veterinario, setVeterinario] = useState("");
  const [campo, setCampo] = useState("");
  const [fecha, setFecha] = useState(new Date().toISOString().slice(0, 10));
  const [predefinidas, setPredefinidas] = useState<Set<string>>(new Set());
  const [obsCount, setObsCount] = useState(0);
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState("");

  const formCompleto = tipo.trim() && veterinario.trim() && campo.trim() && fecha;

  const totalColumnas = predefinidas.size + obsCount;
  const slotsLibres = MAX_COLUMNAS - predefinidas.size;

  function togglePredefinida(nombre: string) {
    setPredefinidas((prev) => {
      const next = new Set(prev);
      if (next.has(nombre)) {
        next.delete(nombre);
        if (obsCount > slotsLibres + 1) setObsCount(slotsLibres + 1 - 1);
      } else {
        if (totalColumnas < MAX_COLUMNAS) next.add(nombre);
      }
      return next;
    });
  }

  function buildColumnas(): string[] {
    const cols: string[] = [];
    for (const c of COLUMNAS_PREDEFINIDAS) {
      if (predefinidas.has(c.nombre)) cols.push(c.nombre);
    }
    for (let i = 1; i <= obsCount; i++) cols.push(`Obs${i}`);
    return cols;
  }

  function descargarTemplate(cols: string[]) {
    const header = ["EID", ...cols].join(";");
    const blob = new Blob([header + "\n"], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `template_${tipo.trim().replace(/\s+/g, "_")}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  async function handleCrear() {
    if (!formCompleto) { setError("Completá todos los campos obligatorios."); return; }
    if (totalColumnas === 0) { setError("Seleccioná al menos un campo a registrar."); return; }
    setError("");
    setGuardando(true);
    const cols = buildColumnas();
    const res = await crearTrabajo({ tipo: tipo.trim(), veterinario: veterinario.trim(), campo: campo.trim(), fecha, columnas: cols });
    if (!res.ok) { setError(res.error ?? "Error al crear el trabajo."); setGuardando(false); return; }
    descargarTemplate(cols);
    router.push(`/trabajos/${res.id}`);
  }

  const slotsLibresActuales = MAX_COLUMNAS - predefinidas.size;

  return (
    <div className="space-y-6">
      {/* Datos del trabajo */}
      <div className="bg-white rounded-xl border border-stone-200 shadow-sm p-6 space-y-5">
        <p className="font-medium text-stone-800">Datos del trabajo</p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-stone-700 mb-1">Tipo de trabajo <span className="text-red-500">*</span></label>
            <input value={tipo} onChange={(e) => setTipo(e.target.value)}
              placeholder="Ej: Vacunación Brucelosis"
              className="w-full border border-stone-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-300" />
          </div>
          <div>
            <label className="block text-sm font-medium text-stone-700 mb-1">Veterinario a cargo <span className="text-red-500">*</span></label>
            <input value={veterinario} onChange={(e) => setVeterinario(e.target.value)}
              placeholder="Nombre del veterinario"
              className="w-full border border-stone-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-300" />
          </div>
          <div>
            <label className="block text-sm font-medium text-stone-700 mb-1">Campo donde se realizó <span className="text-red-500">*</span></label>
            <input value={campo} onChange={(e) => setCampo(e.target.value)}
              placeholder="Ej: Manga Norte"
              className="w-full border border-stone-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-300" />
          </div>
          <div>
            <label className="block text-sm font-medium text-stone-700 mb-1">Fecha del trabajo <span className="text-red-500">*</span></label>
            <input type="date" value={fecha} onChange={(e) => setFecha(e.target.value)}
              className="w-full border border-stone-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-300" />
          </div>
        </div>
      </div>

      {/* Campos clínicos */}
      <div className="bg-white rounded-xl border border-stone-200 shadow-sm p-6 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="font-medium text-stone-800">Campos a registrar</p>
            <p className="text-xs text-stone-400 mt-0.5">
              La caravana siempre se registra. Seleccioná hasta {MAX_COLUMNAS} campos adicionales.
            </p>
          </div>
          <span className={`text-xs font-semibold px-2 py-1 rounded-full ${totalColumnas >= MAX_COLUMNAS ? "bg-amber-100 text-amber-700" : "bg-stone-100 text-stone-500"}`}>
            {totalColumnas} / {MAX_COLUMNAS}
          </span>
        </div>

        {/* Predefinidas */}
        <div>
          <p className="text-xs font-semibold text-stone-400 uppercase tracking-wider mb-2">Campos clínicos</p>
          <div className="space-y-2">
            {COLUMNAS_PREDEFINIDAS.map((col) => {
              const seleccionada = predefinidas.has(col.nombre);
              const deshabilitada = !seleccionada && totalColumnas >= MAX_COLUMNAS;
              return (
                <label
                  key={col.nombre}
                  className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${
                    seleccionada
                      ? "border-green-300 bg-green-50"
                      : deshabilitada
                      ? "border-stone-200 bg-stone-50 opacity-40 cursor-not-allowed"
                      : "border-stone-200 hover:border-stone-300 hover:bg-stone-50"
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={seleccionada}
                    disabled={deshabilitada}
                    onChange={() => togglePredefinida(col.nombre)}
                    className="w-4 h-4 accent-green-700"
                  />
                  <span className="flex-1 text-sm font-medium text-stone-700">{col.nombre}</span>
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                    col.tipo === "number"
                      ? "bg-blue-50 text-blue-600 border border-blue-100"
                      : "bg-stone-100 text-stone-500 border border-stone-200"
                  }`}>
                    {col.tipo === "number" ? "número" : "texto"}
                  </span>
                </label>
              );
            })}
          </div>
        </div>

        {/* Obs libres */}
        <div>
          <p className="text-xs font-semibold text-stone-400 uppercase tracking-wider mb-2">Observaciones libres</p>
          <div className="flex items-center gap-3">
            <div className="flex gap-2 flex-wrap">
              {Array.from({ length: obsCount }).map((_, i) => (
                <span key={i} className="px-3 py-1 bg-stone-100 border border-stone-200 text-stone-600 text-xs rounded-lg font-medium">
                  Obs{i + 1}
                </span>
              ))}
            </div>
            <div className="flex gap-2 ml-auto">
              {obsCount > 0 && (
                <button
                  onClick={() => setObsCount((n) => n - 1)}
                  className="w-7 h-7 rounded-lg border border-stone-300 text-stone-500 hover:bg-stone-100 text-sm font-bold"
                >
                  −
                </button>
              )}
              <button
                onClick={() => setObsCount((n) => n + 1)}
                disabled={totalColumnas >= MAX_COLUMNAS}
                className="w-7 h-7 rounded-lg border border-stone-300 text-stone-500 hover:bg-stone-100 text-sm font-bold disabled:opacity-30 disabled:cursor-not-allowed"
              >
                +
              </button>
            </div>
          </div>
          {obsCount === 0 && (
            <p className="text-xs text-stone-400 mt-1">Usá + para agregar campos de observación libre.</p>
          )}
        </div>

        {/* Preview */}
        {totalColumnas > 0 && (
          <div className="pt-2 border-t border-stone-100">
            <p className="text-xs text-stone-400 mb-2">Template a exportar:</p>
            <div className="flex flex-wrap gap-1.5">
              <span className="px-2 py-1 bg-green-800 text-white text-xs rounded font-medium">Caravana</span>
              {buildColumnas().map((col) => (
                <span key={col} className={`px-2 py-1 text-xs rounded font-medium border ${
                  COLUMNAS_PREDEFINIDAS.find(c => c.nombre === col)?.tipo === "number"
                    ? "bg-blue-50 text-blue-700 border-blue-100"
                    : "bg-stone-100 text-stone-600 border-stone-200"
                }`}>
                  {col}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}

      <div className="flex gap-3">
        <button
          onClick={handleCrear}
          disabled={guardando || !formCompleto || totalColumnas === 0}
          className="px-5 py-2 bg-green-800 text-white rounded-lg text-sm hover:bg-green-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
        >
          {guardando ? "Creando..." : "Crear trabajo y descargar template"}
        </button>
        <a href="/trabajos" className="px-4 py-2 border border-stone-300 rounded-lg text-sm hover:bg-stone-50">
          Cancelar
        </a>
      </div>
    </div>
  );
}
