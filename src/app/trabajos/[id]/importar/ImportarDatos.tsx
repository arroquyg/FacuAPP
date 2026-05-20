"use client";

import { useRef, useState } from "react";
import { importarDatos } from "./actions";

type RegistroFila = { eid: string; datos: (string | null)[] };
type Trabajo = { id: string; tipo: string; columnas: string[] };
type Modo = "archivo" | "pegar";

const SKIP_COLS = new Set(["VID", "Date", "Time"]);

function parsearCSV(text: string, columnasTrabajo: string[]): RegistroFila[] {
  const lines = text.trim().split(/\r?\n/);
  if (lines.length < 2) return [];

  const headers = lines[0].split(";").map((h) => h.trim());
  const eidIdx = headers.findIndex((h) => h === "EID");
  if (eidIdx === -1) return [];

  const colIndices = columnasTrabajo.map((col) => headers.indexOf(col));
  const customByPosition = headers
    .map((h, i) => ({ h, i }))
    .filter(({ h }) => h !== "EID" && !SKIP_COLS.has(h))
    .map(({ i }) => i);

  const filas: RegistroFila[] = [];
  for (let i = 1; i < lines.length; i++) {
    const vals = lines[i].split(";");
    const eid = vals[eidIdx]?.trim();
    if (!eid) continue;
    const datos = columnasTrabajo.map((_, ci) => {
      const idx = colIndices[ci] !== -1 ? colIndices[ci] : customByPosition[ci];
      return idx !== undefined ? vals[idx]?.trim() || null : null;
    });
    filas.push({ eid, datos });
  }
  return filas;
}

type Resultado = { ok: boolean; total: number; encontrados: number; noEncontrados: string[]; error?: string };

export default function ImportarDatos({ trabajo }: { trabajo: Trabajo }) {
  const [paso, setPaso] = useState<"upload" | "preview" | "resultado">("upload");
  const [modo, setModo] = useState<Modo>("archivo");
  const [filas, setFilas] = useState<RegistroFila[]>([]);
  const [texto, setTexto] = useState("");
  const [importando, setImportando] = useState(false);
  const [resultado, setResultado] = useState<Resultado | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  function handleCSVFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      procesarTexto(ev.target?.result as string);
    };
    reader.readAsText(file, "utf-8");
    e.target.value = "";
  }

  function procesarTexto(text: string) {
    const parsed = parsearCSV(text, trabajo.columnas);
    setFilas(parsed);
    if (parsed.length > 0) setPaso("preview");
  }

  async function handleImportar() {
    setImportando(true);
    const res = await importarDatos(trabajo.id, filas);
    setResultado(res);
    setPaso("resultado");
    setImportando(false);
  }

  function reiniciar() {
    setPaso("upload");
    setFilas([]);
    setResultado(null);
    setTexto("");
  }

  if (paso === "resultado" && resultado) {
    return (
      <div className={`rounded-xl border p-6 ${resultado.ok ? "bg-green-50 border-green-200" : "bg-red-50 border-red-200"}`}>
        {resultado.ok ? (
          <>
            <p className="font-semibold text-green-700 text-lg">Datos importados correctamente</p>
            <p className="text-green-600 mt-1">
              {resultado.total} chips procesados — {resultado.encontrados} encontrados en la base de datos.
            </p>
            {resultado.noEncontrados.length > 0 && (
              <div className="mt-3 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                <p className="text-yellow-800 text-sm font-medium">
                  {resultado.noEncontrados.length} chip(s) no encontrados:
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
          <a href={`/trabajos/${trabajo.id}`} className="px-4 py-2 bg-green-800 text-white rounded-lg text-sm hover:bg-green-700">
            Ver trabajo
          </a>
          <button onClick={reiniciar} className="px-4 py-2 border border-stone-300 rounded-lg text-sm hover:bg-stone-50">
            Importar de nuevo
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
            <span className="font-semibold text-stone-800">{filas.length}</span> registros detectados
          </p>
          <button onClick={reiniciar} className="text-sm text-stone-500 hover:underline">Volver</button>
        </div>
        <div className="bg-white rounded-xl border border-stone-200 shadow-sm overflow-x-auto">
          <table className="w-full min-w-max text-xs">
            <thead className="bg-stone-50 text-stone-500 uppercase">
              <tr>
                <th className="px-3 py-2 text-left">Caravana</th>
                {trabajo.columnas.map((col, i) => (
                  <th key={i} className="px-3 py-2 text-left">{col}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100">
              {filas.map((f, i) => (
                <tr key={i} className="hover:bg-stone-50">
                  <td className="px-3 py-2 font-mono">{f.eid}</td>
                  {f.datos.map((d, di) => (
                    <td key={di} className="px-3 py-2">{d ?? "—"}</td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="flex gap-3">
          <button
            onClick={handleImportar}
            disabled={importando}
            className="px-5 py-2 bg-green-800 text-white rounded-lg text-sm hover:bg-green-700 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {importando ? "Guardando..." : `Importar ${filas.length} animal${filas.length !== 1 ? "es" : ""}`}
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
      {/* Columnas esperadas */}
      <div>
        <p className="font-medium text-stone-800">Columnas esperadas</p>
        <div className="flex flex-wrap gap-2 mt-3">
          <span className="px-2 py-1 bg-green-800 text-white text-xs rounded font-medium">EID (Caravana)</span>
          {trabajo.columnas.map((col, i) => (
            <span key={i} className="px-2 py-1 bg-stone-100 text-stone-700 text-xs rounded border border-stone-200">{col}</span>
          ))}
        </div>
      </div>

      {/* Selector de modo */}
      <div className="flex gap-2 border-b border-stone-200 pb-1">
        {(["archivo", "pegar"] as Modo[]).map((m) => (
          <button
            key={m}
            onClick={() => setModo(m)}
            className={`px-4 py-2 text-sm font-medium rounded-t-lg transition-colors ${
              modo === m
                ? "bg-green-800 text-white"
                : "text-stone-500 hover:text-stone-800 hover:bg-stone-50"
            }`}
          >
            {m === "archivo" ? "Subir archivo CSV" : "Pegar CSV"}
          </button>
        ))}
      </div>

      {modo === "archivo" ? (
        <div className="space-y-3">
          <p className="text-sm text-stone-500">
            Subí el CSV del bastón XRS2i o generado desde el template. Las columnas se detectan por nombre (separador: <code className="bg-stone-100 px-1 rounded">;</code>).
          </p>
          <input ref={fileRef} type="file" accept=".csv" onChange={handleCSVFile} className="hidden" />
          <button
            onClick={() => fileRef.current?.click()}
            className="px-5 py-3 border-2 border-dashed border-stone-300 rounded-lg text-sm text-stone-600 hover:border-gray-400 hover:bg-stone-50 w-full text-center transition-colors"
          >
            Seleccionar archivo CSV (.csv)
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          <p className="text-sm text-stone-500">
            Pegá el contenido del CSV con la primera fila como encabezado. Separador: <code className="bg-stone-100 px-1 rounded">;</code> — la columna <strong>EID</strong> es obligatoria.
          </p>
          <textarea
            value={texto}
            onChange={(e) => setTexto(e.target.value)}
            rows={8}
            placeholder={"EID;Peso;BCS\n982000123456789;320;3.0\n982000987654321;280;2.5"}
            className="w-full border border-stone-300 rounded-lg px-3 py-2 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-green-300 resize-y"
          />
          <button
            onClick={() => procesarTexto(texto)}
            disabled={!texto.trim()}
            className="px-5 py-2 bg-green-800 text-white rounded-lg text-sm hover:bg-green-700 disabled:opacity-40"
          >
            Previsualizar
          </button>
        </div>
      )}
    </div>
  );
}
