"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { crearTrabajo } from "./actions";

export default function NuevoTrabajo() {
  const router = useRouter();
  const [tipo, setTipo] = useState("");
  const [veterinario, setVeterinario] = useState("");
  const [campo, setCampo] = useState("");
  const [fecha, setFecha] = useState(new Date().toISOString().slice(0, 10));
  const [columnas, setColumnas] = useState<string[]>([""]);
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState("");

  const formCompleto = tipo.trim() && veterinario.trim() && campo.trim() && fecha;

  function updateColumna(i: number, val: string) {
    const next = [...columnas];
    next[i] = val;
    setColumnas(next);
  }

  function agregarColumna() {
    if (columnas.length < 10) setColumnas([...columnas, ""]);
  }

  function quitarColumna(i: number) {
    setColumnas(columnas.filter((_, idx) => idx !== i));
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
    const colsFiltradas = columnas.map((c) => c.trim()).filter(Boolean);
    if (!formCompleto) {
      setError("Completá todos los campos obligatorios.");
      return;
    }
    setError("");
    setGuardando(true);
    const res = await crearTrabajo({
      tipo: tipo.trim(),
      veterinario: veterinario.trim(),
      campo: campo.trim(),
      fecha,
      columnas: colsFiltradas,
    });
    if (!res.ok) {
      setError(res.error ?? "Error al crear el trabajo.");
      setGuardando(false);
      return;
    }
    descargarTemplate(colsFiltradas);
    router.push(`/trabajos/${res.id}`);
  }

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-xl border border-stone-200 p-6 space-y-5">
        <p className="font-medium text-stone-800">Datos del trabajo</p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-stone-700 mb-1">Tipo de trabajo <span className="text-red-500">*</span></label>
            <input
              value={tipo}
              onChange={(e) => setTipo(e.target.value)}
              placeholder="Ej: Vacunación Brucelosis"
              className="w-full border border-stone-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-400"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-stone-700 mb-1">Veterinario a cargo <span className="text-red-500">*</span></label>
            <input
              value={veterinario}
              onChange={(e) => setVeterinario(e.target.value)}
              placeholder="Nombre del veterinario"
              className="w-full border border-stone-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-400"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-stone-700 mb-1">Campo donde se realizó <span className="text-red-500">*</span></label>
            <input
              value={campo}
              onChange={(e) => setCampo(e.target.value)}
              placeholder="Ej: Manga Norte"
              className="w-full border border-stone-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-400"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-stone-700 mb-1">Fecha del trabajo <span className="text-red-500">*</span></label>
            <input
              type="date"
              value={fecha}
              onChange={(e) => setFecha(e.target.value)}
              className="w-full border border-stone-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-400"
            />
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-stone-200 p-6 space-y-4">
        <div>
          <p className="font-medium text-stone-800">Campos a registrar por animal</p>
          <p className="text-sm text-stone-500 mt-1">
            El chip (EID) se registra siempre. Agregá hasta 10 observaciones adicionales.
          </p>
        </div>

        <div className="space-y-2">
          <div className="flex items-center gap-3 py-2 px-3 bg-stone-50 rounded-lg border border-stone-200">
            <span className="text-xs font-semibold text-stone-400 w-16">Fijo</span>
            <span className="text-sm font-medium text-stone-600">EID — Chip electrónico</span>
          </div>

          {columnas.map((col, i) => (
            <div key={i} className="flex items-center gap-3">
              <span className="text-xs text-stone-400 w-16 shrink-0">Obs {i + 1}</span>
              <input
                value={col}
                onChange={(e) => updateColumna(i, e.target.value)}
                placeholder="Ej: Peso, Estado sanitario, Dosis aplicada..."
                className="flex-1 border border-stone-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-400"
              />
              {columnas.length > 1 && (
                <button
                  onClick={() => quitarColumna(i)}
                  className="text-gray-300 hover:text-red-400 text-xl leading-none shrink-0"
                >
                  ×
                </button>
              )}
            </div>
          ))}
        </div>

        {columnas.length < 10 && (
          <button onClick={agregarColumna} className="text-sm text-blue-600 hover:underline">
            + Agregar observación
          </button>
        )}
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}

      <div className="flex gap-3">
        <button
          onClick={handleCrear}
          disabled={guardando || !formCompleto}
          className="px-5 py-2 bg-green-800 text-white rounded-lg text-sm hover:bg-green-700 disabled:opacity-40 disabled:cursor-not-allowed"
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
