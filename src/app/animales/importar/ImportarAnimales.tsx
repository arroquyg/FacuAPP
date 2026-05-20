"use client";

import { useRef, useState } from "react";
import * as XLSX from "xlsx";
import { importarAnimales } from "./actions";

type Lookup = { id: string; nombre: string };
type Campo = { id: string; nombre: string };

type FilaParsed = {
  chip_id: string;
  sexo: string;
  categoria: string;
  raza: string;
  campo: string;
  color_pelaje: string;
  fecha_nacimiento: string;
  genetica_empresa: string;
  valor_comercial: string;
  estado_sanitario: string;
  errores: string[];
};

type Paso = "upload" | "preview" | "resultado";

function parsearFecha(val: unknown): string {
  if (!val) return "";
  if (typeof val === "number") {
    // Excel serial date
    const date = XLSX.SSF.parse_date_code(val);
    if (!date) return "";
    const mm = String(date.m).padStart(2, "0");
    const dd = String(date.d).padStart(2, "0");
    return `${date.y}-${mm}-${dd}`;
  }
  const str = String(val).trim();
  // Accept YYYY-MM-DD or DD/MM/YYYY
  if (/^\d{4}-\d{2}-\d{2}$/.test(str)) return str;
  if (/^\d{2}\/\d{2}\/\d{4}$/.test(str)) {
    const [d, m, y] = str.split("/");
    return `${y}-${m}-${d}`;
  }
  return str;
}

export default function ImportarAnimales({
  campos,
  categorias,
  razas,
}: {
  campos: Campo[];
  categorias: Lookup[];
  razas: Lookup[];
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [paso, setPaso] = useState<Paso>("upload");
  const [filas, setFilas] = useState<FilaParsed[]>([]);
  const [importando, setImportando] = useState(false);
  const [resultado, setResultado] = useState<{ ok: boolean; insertados: number; error?: string } | null>(null);

  const camposPorNombre = Object.fromEntries(campos.map((c) => [c.nombre.toLowerCase(), c.id]));
  const categoriaSet = new Set(categorias.map((c) => c.nombre.toLowerCase()));
  const razaSet = new Set(razas.map((r) => r.nombre.toLowerCase()));

  function validar(raw: Record<string, unknown>): FilaParsed {
    // normalize keys: strip " *" suffix added in headers
    const norm: Record<string, unknown> = {};
    for (const k of Object.keys(raw)) norm[k.replace(" *", "")] = raw[k];
    const str = (k: string) => String(norm[k] ?? "").trim();
    const fila: FilaParsed = {
      chip_id: str("chip_id").replace(/\s+/g, ""),
      sexo: str("sexo").toLowerCase(),
      categoria: str("categoria"),
      raza: str("raza"),
      campo: str("campo"),
      color_pelaje: str("color_pelaje"),
      fecha_nacimiento: parsearFecha(norm["fecha_nacimiento"]),
      genetica_empresa: str("genetica_empresa"),
      valor_comercial: str("valor_comercial"),
      estado_sanitario: str("estado_sanitario"),
      errores: [],
    };

    if (!fila.chip_id) fila.errores.push("chip_id requerido");
    if (!["macho", "hembra"].includes(fila.sexo)) fila.errores.push("sexo debe ser macho o hembra");
    if (!fila.categoria) fila.errores.push("categoría requerida");
    else if (!categoriaSet.has(fila.categoria.toLowerCase())) fila.errores.push(`categoría "${fila.categoria}" no existe`);
    if (!fila.raza) fila.errores.push("raza requerida");
    else if (!razaSet.has(fila.raza.toLowerCase())) fila.errores.push(`raza "${fila.raza}" no existe`);
    if (fila.campo && !camposPorNombre[fila.campo.toLowerCase()]) fila.errores.push(`campo "${fila.campo}" no existe`);

    return fila;
  }

  function handleArchivo(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const data = ev.target?.result;
      const wb = XLSX.read(data, { type: "array" });
      const ws = wb.Sheets[wb.SheetNames[0]];
      const rows = XLSX.utils.sheet_to_json<Record<string, unknown>>(ws, { defval: "" });
      const parsed = rows.map(validar);
      setFilas(parsed);
      setPaso("preview");
    };
    reader.readAsArrayBuffer(file);
    e.target.value = "";
  }

  async function handleImportar() {
    const validas = filas.filter((f) => f.errores.length === 0);
    if (validas.length === 0) return;
    setImportando(true);

    const payload = validas.map((f) => ({
      chip_id: f.chip_id,
      sexo: f.sexo,
      categoria: f.categoria,
      raza: f.raza,
      campo_actual_id: f.campo ? (camposPorNombre[f.campo.toLowerCase()] ?? null) : null,
      color_pelaje: f.color_pelaje || null,
      fecha_nacimiento: f.fecha_nacimiento || null,
      genetica_empresa: f.genetica_empresa || null,
      valor_comercial: f.valor_comercial ? parseFloat(f.valor_comercial) : null,
      estado_sanitario: f.estado_sanitario || null,
    }));

    const res = await importarAnimales(payload);
    setResultado(res);
    setPaso("resultado");
    setImportando(false);
  }

  function reiniciar() {
    setFilas([]);
    setPaso("upload");
    setResultado(null);
  }

  const validas = filas.filter((f) => f.errores.length === 0);
  const invalidas = filas.filter((f) => f.errores.length > 0);

  if (paso === "resultado") {
    return (
      <div className={`rounded-xl border p-6 ${resultado?.ok ? "bg-green-50 border-green-200" : "bg-red-50 border-red-200"}`}>
        {resultado?.ok ? (
          <>
            <p className="font-semibold text-green-700 text-lg">Importación exitosa</p>
            <p className="text-green-600 mt-1">{resultado.insertados} animales registrados correctamente.</p>
          </>
        ) : (
          <>
            <p className="font-semibold text-red-700">Error al importar</p>
            <p className="text-red-600 text-sm font-mono mt-1">{resultado?.error}</p>
          </>
        )}
        <div className="flex gap-3 mt-4">
          <button onClick={reiniciar} className="px-4 py-2 bg-green-800 text-white rounded-lg text-sm hover:bg-green-700">
            Nueva importación
          </button>
          <a href="/animales" className="px-4 py-2 border border-stone-300 rounded-lg text-sm hover:bg-stone-50">
            Ver animales
          </a>
        </div>
      </div>
    );
  }

  if (paso === "preview") {
    return (
      <div className="space-y-5">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-stone-600">
              <span className="text-green-600 font-semibold">{validas.length} listas para importar</span>
              {invalidas.length > 0 && (
                <span className="text-red-500 font-semibold ml-3">{invalidas.length} con errores (se omiten)</span>
              )}
            </p>
          </div>
          <button onClick={reiniciar} className="text-sm text-stone-500 hover:underline">
            Cargar otro archivo
          </button>
        </div>

        <div className="bg-white rounded-xl border border-stone-200 overflow-x-auto">
          <table className="w-full text-xs">
            <thead className="bg-stone-50 text-stone-500 uppercase">
              <tr>
                <th className="px-3 py-2 text-left">#</th>
                <th className="px-3 py-2 text-left">Chip</th>
                <th className="px-3 py-2 text-left">Sexo</th>
                <th className="px-3 py-2 text-left">Categoría</th>
                <th className="px-3 py-2 text-left">Raza</th>
                <th className="px-3 py-2 text-left">Campo</th>
                <th className="px-3 py-2 text-left">Estado</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100">
              {filas.map((f, i) => (
                <tr key={i} className={f.errores.length > 0 ? "bg-red-50" : "hover:bg-stone-50"}>
                  <td className="px-3 py-2 text-stone-400">{i + 1}</td>
                  <td className="px-3 py-2 font-mono">{f.chip_id || "—"}</td>
                  <td className="px-3 py-2 capitalize">{f.sexo || "—"}</td>
                  <td className="px-3 py-2">{f.categoria || "—"}</td>
                  <td className="px-3 py-2">{f.raza || "—"}</td>
                  <td className="px-3 py-2">{f.campo || "—"}</td>
                  <td className="px-3 py-2">
                    {f.errores.length === 0 ? (
                      <span className="text-green-600 font-medium">OK</span>
                    ) : (
                      <span className="text-red-500" title={f.errores.join(" | ")}>
                        ✕ {f.errores[0]}{f.errores.length > 1 ? ` (+${f.errores.length - 1})` : ""}
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="flex gap-3">
          <button
            onClick={handleImportar}
            disabled={importando || validas.length === 0}
            className="px-5 py-2 bg-green-800 text-white rounded-lg text-sm hover:bg-green-700 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {importando ? "Importando..." : `Importar ${validas.length} animal${validas.length !== 1 ? "es" : ""}`}
          </button>
          <button onClick={reiniciar} className="px-4 py-2 border border-stone-300 rounded-lg text-sm hover:bg-stone-50">
            Cancelar
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Paso 1: Descargar base */}
      <div className="bg-white rounded-xl border border-stone-200 p-6 flex items-start gap-5">
        <div className="flex-1">
          <p className="font-medium text-stone-800">Paso 1 — Descargar base</p>
          <p className="text-sm text-stone-500 mt-1">
            Descargá el archivo Excel con el formato correcto. Incluye una hoja de referencia con los campos, categorías y razas válidas.
          </p>
        </div>
        <a
          href="/api/animales/template"
          download
          className="shrink-0 px-4 py-2 bg-green-800 text-white rounded-lg text-sm hover:bg-green-700 flex items-center gap-2"
        >
          Descargar base
        </a>
      </div>

      {/* Paso 2: Completar y subir */}
      <div className="bg-white rounded-xl border border-stone-200 p-6 space-y-4">
        <div>
          <p className="font-medium text-stone-800">Paso 2 — Completar y subir el archivo</p>
          <p className="text-sm text-stone-500 mt-1">
            Completá la hoja <strong>Animales</strong> y subí el archivo. Se validará cada fila antes de importar.
          </p>
        </div>
        <input
          ref={inputRef}
          type="file"
          accept=".xlsx,.xls"
          onChange={handleArchivo}
          className="hidden"
        />
        <button
          onClick={() => inputRef.current?.click()}
          className="px-5 py-2 border-2 border-dashed border-stone-300 rounded-lg text-sm text-stone-600 hover:border-gray-400 hover:bg-stone-50 w-full text-center"
        >
          Seleccionar archivo Excel (.xlsx)
        </button>
      </div>
    </div>
  );
}
