"use client";

import { useState } from "react";
import { editarAnimalesMasivo, type CampoEditable } from "./actions";

type OpcionSimple = { id: string; nombre: string };

type AnimalEncontrado = {
  id: string;
  chip_id: string;
  numero_caravana: string | null;
  campo: { nombre: string } | null;
};

type Paso = "form" | "confirmar" | "resultado";

const CAMPOS_EDITABLES: { value: CampoEditable; label: string }[] = [
  { value: "categoria", label: "Categoría" },
  { value: "raza", label: "Raza" },
  { value: "campo_actual_id", label: "Campo actual" },
  { value: "estado_sanitario", label: "Estado sanitario" },
  { value: "color_pelaje", label: "Color / pelaje" },
  { value: "procedencia", label: "Procedencia" },
];

const CAMPOS_CON_LISTA: CampoEditable[] = ["categoria", "raza", "campo_actual_id"];

export default function EditarMasivo({
  categorias,
  razas,
  campos,
}: {
  categorias: OpcionSimple[];
  razas: OpcionSimple[];
  campos: OpcionSimple[];
}) {
  const [textChips, setTextChips] = useState("");
  const [buscando, setBuscando] = useState(false);
  const [animalesEncontrados, setAnimalesEncontrados] = useState<AnimalEncontrado[]>([]);
  const [noEncontrados, setNoEncontrados] = useState<string[]>([]);
  const [buscado, setBuscado] = useState(false);

  const [campoEditar, setCampoEditar] = useState<CampoEditable>("categoria");
  const [nuevoValor, setNuevoValor] = useState("");

  const [paso, setPaso] = useState<Paso>("form");
  const [guardando, setGuardando] = useState(false);
  const [resultado, setResultado] = useState<{ ok: boolean; actualizados: number; error?: string } | null>(null);

  async function buscar() {
    const chips = textChips.split(/[\n,]/).map((c) => c.trim().toUpperCase()).filter(Boolean);
    if (chips.length === 0) return;

    setBuscando(true);
    setBuscado(false);
    setAnimalesEncontrados([]);
    setNoEncontrados([]);

    try {
      const res = await fetch(`/api/animales/bulk-search?chips=${encodeURIComponent(chips.join(","))}`);
      const encontrados: AnimalEncontrado[] = await res.json();
      setAnimalesEncontrados(encontrados);
      setNoEncontrados(chips.filter((c) => !encontrados.find((a) => a.chip_id === c)));
      setBuscado(true);
    } catch {
      setNoEncontrados(["Error al buscar. Intentá de nuevo."]);
    } finally {
      setBuscando(false);
    }
  }

  function getOpciones(): OpcionSimple[] {
    if (campoEditar === "categoria") return categorias;
    if (campoEditar === "raza") return razas;
    if (campoEditar === "campo_actual_id") return campos;
    return [];
  }

  function getLabelValor(): string {
    if (CAMPOS_CON_LISTA.includes(campoEditar)) {
      const opciones = getOpciones();
      return opciones.find((o) => o.id === nuevoValor)?.nombre ?? nuevoValor;
    }
    return nuevoValor;
  }

  function getLabelCampo(): string {
    return CAMPOS_EDITABLES.find((c) => c.value === campoEditar)?.label ?? campoEditar;
  }

  async function confirmar() {
    setGuardando(true);
    const res = await editarAnimalesMasivo(
      animalesEncontrados.map((a) => a.id),
      campoEditar,
      nuevoValor
    );
    setResultado(res);
    setPaso("resultado");
    setGuardando(false);
  }

  function reiniciar() {
    setTextChips("");
    setAnimalesEncontrados([]);
    setNoEncontrados([]);
    setBuscado(false);
    setCampoEditar("categoria");
    setNuevoValor("");
    setPaso("form");
    setResultado(null);
  }

  if (paso === "resultado") {
    return (
      <div className={`rounded-xl border p-6 ${resultado?.ok ? "bg-green-50 border-green-200" : "bg-red-50 border-red-200"}`}>
        {resultado?.ok ? (
          <>
            <p className="font-semibold text-green-700 text-lg">Actualización exitosa</p>
            <p className="text-green-600 mt-1">
              Se actualizó <strong>{getLabelCampo()}</strong> a <strong>{getLabelValor()}</strong> en{" "}
              <strong>{resultado.actualizados}</strong> animal{resultado.actualizados !== 1 ? "es" : ""}.
            </p>
          </>
        ) : (
          <>
            <p className="font-semibold text-red-700">Error al actualizar</p>
            <p className="text-red-600 text-sm font-mono mt-1">{resultado?.error}</p>
          </>
        )}
        <button onClick={reiniciar} className="mt-4 px-4 py-2 bg-green-800 text-white rounded-lg text-sm hover:bg-green-700">
          Nueva edición masiva
        </button>
      </div>
    );
  }

  if (paso === "confirmar") {
    return (
      <div className="bg-amber-50 border border-amber-200 rounded-xl p-6 space-y-4">
        <p className="font-semibold text-amber-800">Confirmación</p>
        <p className="text-amber-700">
          Vas a cambiar <strong>{getLabelCampo()}</strong> a{" "}
          <strong>&ldquo;{getLabelValor()}&rdquo;</strong> en{" "}
          <strong>{animalesEncontrados.length}</strong> animal{animalesEncontrados.length !== 1 ? "es" : ""}.
        </p>
        <div className="max-h-40 overflow-y-auto space-y-0.5">
          {animalesEncontrados.map((a) => (
            <p key={a.id} className="text-sm font-mono text-amber-700">{a.chip_id}</p>
          ))}
        </div>
        <div className="flex gap-3 pt-2">
          <button
            onClick={confirmar}
            disabled={guardando}
            className="px-4 py-2 bg-green-800 text-white rounded-lg text-sm hover:bg-green-700 disabled:opacity-50"
          >
            {guardando ? "Actualizando..." : "Confirmar"}
          </button>
          <button onClick={() => setPaso("form")} className="px-4 py-2 border border-stone-300 rounded-lg text-sm hover:bg-stone-50">
            Volver
          </button>
        </div>
      </div>
    );
  }

  const puedeConfirmar = animalesEncontrados.length > 0 && nuevoValor.trim() !== "";

  return (
    <div className="bg-white border border-stone-200 rounded-xl p-6 space-y-6">

      {/* Paso 1: chips */}
      <div>
        <p className="text-sm font-medium text-stone-700 mb-2">1. Pegá las caravanas (una por línea)</p>
        <div className="flex gap-2 items-start">
          <textarea
            value={textChips}
            onChange={(e) => { setTextChips(e.target.value); setBuscado(false); setAnimalesEncontrados([]); setNoEncontrados([]); }}
            placeholder={"032010010158200\n032010010158201\n032010010158202"}
            rows={5}
            className="flex-1 border border-stone-300 rounded-lg px-3 py-2 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-green-300 resize-none"
          />
          <button
            type="button"
            onClick={buscar}
            disabled={buscando || !textChips.trim()}
            className="px-4 py-2 bg-stone-100 border border-stone-300 rounded-lg text-sm text-stone-700 hover:bg-stone-200 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {buscando ? "Buscando..." : "Buscar"}
          </button>
        </div>

        {buscado && (
          <div className="mt-3 space-y-2">
            <p className="text-sm text-green-700 font-medium">{animalesEncontrados.length} animal{animalesEncontrados.length !== 1 ? "es" : ""} encontrado{animalesEncontrados.length !== 1 ? "s" : ""}</p>
            {noEncontrados.length > 0 && (
              <div className="bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
                <p className="text-xs text-amber-700 font-medium mb-1">No encontrados ({noEncontrados.length}):</p>
                <p className="text-xs font-mono text-amber-600">{noEncontrados.join(", ")}</p>
              </div>
            )}
            {animalesEncontrados.length > 0 && (
              <div className="max-h-36 overflow-y-auto border border-stone-200 rounded-lg divide-y divide-stone-100">
                {animalesEncontrados.map((a) => (
                  <div key={a.id} className="flex items-center justify-between px-3 py-2 text-sm">
                    <span className="font-mono font-medium text-stone-700">{a.chip_id}</span>
                    <span className="text-stone-400 text-xs">
                      {(a.campo as { nombre: string } | null)?.nombre ?? "sin campo"}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Paso 2: qué cambiar */}
      {animalesEncontrados.length > 0 && (
        <div className="space-y-4">
          <p className="text-sm font-medium text-stone-700">2. Elegí qué cambiar y el nuevo valor</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs text-stone-500 mb-1">Campo a modificar</label>
              <select
                value={campoEditar}
                onChange={(e) => { setCampoEditar(e.target.value as CampoEditable); setNuevoValor(""); }}
                className="w-full border border-stone-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-300"
              >
                {CAMPOS_EDITABLES.map((c) => (
                  <option key={c.value} value={c.value}>{c.label}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs text-stone-500 mb-1">Nuevo valor</label>
              {CAMPOS_CON_LISTA.includes(campoEditar) ? (
                <select
                  value={nuevoValor}
                  onChange={(e) => setNuevoValor(e.target.value)}
                  className="w-full border border-stone-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-300"
                >
                  <option value="">Seleccionar...</option>
                  {getOpciones().map((o) => (
                    <option key={o.id} value={o.id}>{o.nombre}</option>
                  ))}
                </select>
              ) : (
                <input
                  type="text"
                  value={nuevoValor}
                  onChange={(e) => setNuevoValor(e.target.value)}
                  placeholder={`Nuevo ${getLabelCampo().toLowerCase()}`}
                  className="w-full border border-stone-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-300"
                />
              )}
            </div>
          </div>

          <button
            onClick={() => setPaso("confirmar")}
            disabled={!puedeConfirmar}
            className="px-5 py-2 bg-green-800 text-white rounded-lg text-sm hover:bg-green-700 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            Continuar
          </button>
        </div>
      )}
    </div>
  );
}
