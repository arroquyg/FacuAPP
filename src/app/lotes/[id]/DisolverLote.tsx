"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import * as XLSX from "xlsx";
import { disolverLote } from "../actions";

type AnimalRow = { id: string; chip_id: string; peso_entrada_kg: number };

export default function DisolverLote({ loteId, animales }: { loteId: string; animales: AnimalRow[] }) {
  const router = useRouter();
  const fileRef = useRef<HTMLInputElement>(null);
  const [abierto, setAbierto] = useState(false);
  const [fechaFin, setFechaFin] = useState(new Date().toISOString().slice(0, 10));
  const [modo, setModo] = useState<"promedio" | "archivo">("promedio");
  const [pesoPromedio, setPesoPromedio] = useState("");
  const [pesosArchivo, setPesosArchivo] = useState<Map<string, number>>(new Map());
  const [disolviendo, setDisolviendo] = useState(false);
  const [error, setError] = useState("");

  function handleArchivo(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const wb = XLSX.read(ev.target?.result, { type: "array" });
      const ws = wb.Sheets[wb.SheetNames[0]];
      const rows = XLSX.utils.sheet_to_json<Record<string, unknown>>(ws, { defval: "" });
      const map = new Map<string, number>();
      for (const row of rows) {
        const chip = String(row["EID"] ?? row["chip_id"] ?? row["Caravana"] ?? "").trim().replace(/\s+/g, "");
        const peso = parseFloat(String(row["Peso"] ?? row["peso_kg"] ?? row["peso"] ?? "0"));
        if (chip && !isNaN(peso) && peso > 0) map.set(chip, peso);
      }
      setPesosArchivo(map);
      setError(map.size === 0 ? "No se encontraron pesos en el archivo." : "");
    };
    reader.readAsArrayBuffer(file);
  }

  function descargarTemplate() {
    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.aoa_to_sheet([
      ["EID", "Peso"],
      ...animales.map((a) => [a.chip_id, ""]),
    ]);
    ws["!cols"] = [{ wch: 22 }, { wch: 10 }];
    XLSX.utils.book_append_sheet(wb, ws, "Salida");
    XLSX.writeFile(wb, `salida_lote.xlsx`);
  }

  async function handleDisolver() {
    if (!fechaFin) { setError("Ingresá la fecha de cierre."); return; }

    let pesos: { lote_animal_id: string; peso_salida_kg: number }[] = [];

    if (modo === "promedio") {
      const peso = parseFloat(pesoPromedio);
      if (isNaN(peso) || peso <= 0) { setError("Ingresá un peso promedio válido."); return; }
      pesos = animales.map((a) => ({ lote_animal_id: a.id, peso_salida_kg: peso }));
    } else {
      const faltantes = animales.filter((a) => !pesosArchivo.has(a.chip_id));
      if (faltantes.length > 0) {
        setError(`Faltan pesos para: ${faltantes.slice(0, 3).map((a) => a.chip_id).join(", ")}${faltantes.length > 3 ? ` y ${faltantes.length - 3} más` : ""}`);
        return;
      }
      pesos = animales.map((a) => ({ lote_animal_id: a.id, peso_salida_kg: pesosArchivo.get(a.chip_id)! }));
    }

    setError("");
    setDisolviendo(true);
    const res = await disolverLote(loteId, fechaFin, pesos);
    if (!res.ok) { setError(res.error ?? "Error al disolver el lote."); setDisolviendo(false); return; }
    router.refresh();
  }

  if (!abierto) {
    return (
      <div className="bg-white rounded-xl border border-red-200 shadow-sm p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="font-medium text-stone-800">Disolver lote</p>
            <p className="text-sm text-stone-500 mt-0.5">Registra el peso de salida de todos los animales y cierra el lote.</p>
          </div>
          <button onClick={() => setAbierto(true)}
            className="px-4 py-2 bg-red-600 text-white rounded-lg text-sm hover:bg-red-500 transition-colors">
            Disolver lote
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl border border-red-200 shadow-sm p-6 space-y-5">
      <p className="font-medium text-stone-800">Disolver lote — registrar pesos de salida</p>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-stone-700 mb-1">Fecha de cierre <span className="text-red-500">*</span></label>
          <input type="date" value={fechaFin} onChange={(e) => setFechaFin(e.target.value)}
            className="w-full border border-stone-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-300" />
        </div>
      </div>

      <div className="flex gap-3">
        <button onClick={() => setModo("promedio")}
          className={`px-3 py-1.5 rounded-lg text-sm border transition-colors ${modo === "promedio" ? "bg-green-800 text-white border-green-800" : "border-stone-300 text-stone-600 hover:bg-stone-50"}`}>
          Peso promedio de salida
        </button>
        <button onClick={() => setModo("archivo")}
          className={`px-3 py-1.5 rounded-lg text-sm border transition-colors ${modo === "archivo" ? "bg-green-800 text-white border-green-800" : "border-stone-300 text-stone-600 hover:bg-stone-50"}`}>
          Peso individual por archivo
        </button>
      </div>

      {modo === "promedio" ? (
        <div>
          <label className="block text-sm font-medium text-stone-700 mb-1">Peso promedio de salida (kg) <span className="text-red-500">*</span></label>
          <input type="number" min="0" step="0.5" value={pesoPromedio} onChange={(e) => setPesoPromedio(e.target.value)}
            placeholder="Ej: 380"
            className="w-40 border border-stone-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-300" />
          <p className="text-xs text-stone-400 mt-1">Se asignará a los {animales.length} animales del lote.</p>
        </div>
      ) : (
        <div className="space-y-3">
          <div className="flex items-center gap-3">
            <input ref={fileRef} type="file" accept=".xlsx,.xls,.csv" onChange={handleArchivo}
              className="block text-sm text-stone-500 file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border file:border-stone-300 file:text-sm file:bg-white file:text-stone-600 hover:file:bg-stone-50" />
            <button onClick={descargarTemplate} className="text-xs text-green-700 hover:underline whitespace-nowrap">
              Descargar template con caravanas
            </button>
          </div>
          {pesosArchivo.size > 0 && (
            <p className="text-sm text-green-700">{pesosArchivo.size} pesos cargados desde el archivo.</p>
          )}
        </div>
      )}

      {error && <p className="text-sm text-red-600">{error}</p>}

      <div className="flex gap-3 pt-2 border-t border-stone-100">
        <button onClick={handleDisolver} disabled={disolviendo}
          className="px-4 py-2 bg-red-600 text-white rounded-lg text-sm hover:bg-red-500 disabled:opacity-40 transition-colors">
          {disolviendo ? "Disolviendo..." : `Confirmar — disolver lote (${animales.length} animales)`}
        </button>
        <button onClick={() => setAbierto(false)} className="px-4 py-2 border border-stone-300 rounded-lg text-sm hover:bg-stone-50">
          Cancelar
        </button>
      </div>
    </div>
  );
}
