"use client";

import { useRef, useState } from "react";
import { importarAnimalesSanitario } from "./actions";

type Resultado = {
  ok: boolean;
  total: number;
  encontrados: number;
  noEncontrados: string[];
  error?: string;
};

function parsearEIDs(text: string): string[] {
  const lines = text.trim().split(/\r?\n/);
  if (lines.length < 1) return [];

  const headers = lines[0].split(";").map((h) => h.trim());
  // Find EID column index (first col named EID or EID (Caravana) or just take first col)
  let eidIdx = headers.findIndex((h) => h === "EID" || h === "EID (Caravana)");
  if (eidIdx === -1) eidIdx = 0; // fallback to first column

  const eids: string[] = [];
  for (let i = 1; i < lines.length; i++) {
    const vals = lines[i].split(";");
    const eid = vals[eidIdx]?.trim();
    if (eid && eid.length > 0) eids.push(eid);
  }
  return eids;
}

export default function ImportarAnimales({ sanitarioTrabajoId }: { sanitarioTrabajoId: string }) {
  const [paso, setPaso] = useState<"upload" | "preview" | "resultado">("upload");
  const [eids, setEids] = useState<string[]>([]);
  const [importando, setImportando] = useState(false);
  const [resultado, setResultado] = useState<Resultado | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  function handleCSV(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const parsed = parsearEIDs(ev.target?.result as string);
      setEids(parsed);
      if (parsed.length > 0) setPaso("preview");
    };
    reader.readAsText(file, "utf-8");
    e.target.value = "";
  }

  async function handleImportar() {
    setImportando(true);
    const res = await importarAnimalesSanitario(sanitarioTrabajoId, eids);
    setResultado(res);
    setPaso("resultado");
    setImportando(false);
  }

  function reiniciar() {
    setPaso("upload");
    setEids([]);
    setResultado(null);
  }

  if (paso === "resultado" && resultado) {
    return (
      <div className={`rounded-xl border p-6 ${resultado.ok ? "bg-green-50 border-green-200" : "bg-red-50 border-red-200"}`}>
        {resultado.ok ? (
          <>
            <p className="font-semibold text-green-700 text-lg">Animales importados correctamente</p>
            <p className="text-green-600 mt-1">
              {resultado.total} caravanas procesadas — {resultado.encontrados} eventos creados.
            </p>
            {resultado.noEncontrados.length > 0 && (
              <div className="mt-3 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                <p className="text-yellow-800 text-sm font-medium">
                  {resultado.noEncontrados.length} caravana(s) no encontradas en la base de datos:
                </p>
                <p className="text-yellow-700 text-xs mt-1 font-mono break-all">
                  {resultado.noEncontrados.join(", ")}
                </p>
              </div>
            )}
          </>
        ) : (
          <>
            <p className="font-semibold text-red-700">Error al importar</p>
            <p className="text-red-600 text-sm font-mono mt-1">{resultado.error}</p>
          </>
        )}
        <div className="flex gap-3 mt-5">
          <a
            href={`/sanitario/${sanitarioTrabajoId}`}
            className="px-4 py-2 bg-green-800 text-white rounded-lg text-sm hover:bg-green-700"
          >
            Ver evento
          </a>
          <button onClick={reiniciar} className="px-4 py-2 border border-stone-300 rounded-lg text-sm hover:bg-stone-50">
            Importar otro archivo
          </button>
        </div>
      </div>
    );
  }

  if (paso === "preview") {
    return (
      <div className="space-y-5">
        <div className="flex items-center justify-between">
          <p className="text-sm text-stone-600">
            <span className="font-semibold text-stone-800">{eids.length}</span> caravanas detectadas
          </p>
          <button onClick={reiniciar} className="text-sm text-stone-500 hover:underline">
            Cargar otro archivo
          </button>
        </div>

        <div className="bg-white rounded-xl border border-stone-200 shadow-sm overflow-x-auto">
          <table className="w-full min-w-max text-xs">
            <thead className="bg-stone-50 text-stone-500 uppercase">
              <tr>
                <th className="px-3 py-2 text-left">#</th>
                <th className="px-3 py-2 text-left">Caravana (EID)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100">
              {eids.slice(0, 50).map((eid, i) => (
                <tr key={i} className="hover:bg-stone-50">
                  <td className="px-3 py-2 text-stone-400">{i + 1}</td>
                  <td className="px-3 py-2 font-mono">{eid}</td>
                </tr>
              ))}
              {eids.length > 50 && (
                <tr>
                  <td colSpan={2} className="px-3 py-2 text-center text-stone-400 text-xs">
                    ...y {eids.length - 50} más
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <div className="flex gap-3">
          <button
            onClick={handleImportar}
            disabled={importando}
            className="px-5 py-2 bg-green-800 text-white rounded-lg text-sm hover:bg-green-700 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {importando ? "Guardando..." : `Registrar ${eids.length} animal${eids.length !== 1 ? "es" : ""}`}
          </button>
          <button onClick={reiniciar} className="px-4 py-2 border border-stone-300 rounded-lg text-sm hover:bg-stone-50">
            Cancelar
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl border border-stone-200 p-6 space-y-5">
      <div>
        <p className="font-medium text-stone-800">Formato esperado del CSV</p>
        <div className="flex flex-wrap gap-2 mt-3">
          <span className="px-2 py-1 bg-green-800 text-white text-xs rounded font-medium">EID (Caravana)</span>
        </div>
        <p className="text-xs text-stone-500 mt-2">
          Una caravana por fila. Separador de columnas: punto y coma (;). Compatible con el bastón XRS2i.
        </p>
      </div>

      <input ref={fileRef} type="file" accept=".csv" onChange={handleCSV} className="hidden" />
      <button
        onClick={() => fileRef.current?.click()}
        className="px-5 py-3 border-2 border-dashed border-stone-300 rounded-lg text-sm text-stone-600 hover:border-gray-400 hover:bg-stone-50 w-full text-center transition-colors"
      >
        Seleccionar archivo CSV (.csv)
      </button>
    </div>
  );
}
