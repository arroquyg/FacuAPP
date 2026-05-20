"use client";

import { useState } from "react";
import { editarAnimalesMasivo, type CampoEditable } from "./actions";

type Lookup = { id: string; nombre: string };
type AnimalEncontrado = {
  id: string;
  chip_id: string;
  campo: { nombre: string } | null;
};
type Paso = "form" | "editar" | "confirmar" | "resultado";

const CAMPOS: { value: CampoEditable; label: string }[] = [
  { value: "vivo", label: "Estado (Vivo/Muerto)" },
  { value: "categoria", label: "Categoría" },
  { value: "raza", label: "Raza" },
  { value: "campo_actual_id", label: "Campo actual" },
  { value: "estado_sanitario", label: "Estado sanitario" },
  { value: "color_pelaje", label: "Color de pelaje" },
  { value: "genetica_empresa", label: "Procedencia" },
];

export default function EditarMasivo({
  campos,
  categorias,
  razas,
}: {
  campos: Lookup[];
  categorias: Lookup[];
  razas: Lookup[];
}) {
  const [textChips, setTextChips] = useState("");
  const [buscando, setBuscando] = useState(false);
  const [animales, setAnimales] = useState<AnimalEncontrado[]>([]);
  const [noEncontrados, setNoEncontrados] = useState<string[]>([]);
  const [buscado, setBuscado] = useState(false);

  const [campoEditar, setCampoEditar] = useState<CampoEditable>("categoria");
  const [valor, setValor] = useState("");

  const [paso, setPaso] = useState<Paso>("form");
  const [guardando, setGuardando] = useState(false);
  const [resultado, setResultado] = useState<{ ok: boolean; editados: number; error?: string } | null>(null);

  async function buscar() {
    const chips = textChips.split(/[\n,]/).map((c) => c.trim().replace(/\s+/g, "").toUpperCase()).filter(Boolean);
    if (chips.length === 0) return;
    setBuscando(true);
    setBuscado(false);
    setAnimales([]);
    setNoEncontrados([]);
    try {
      const res = await fetch("/api/animales/bulk-search", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ chips }),
      });
      const encontrados: AnimalEncontrado[] = await res.json();
      setAnimales(encontrados);
      setNoEncontrados(chips.filter((c) => !encontrados.find((a) => a.chip_id === c)));
      setBuscado(true);
      if (encontrados.length > 0) setPaso("editar");
    } catch {
      setNoEncontrados(["Error al buscar. Intentá de nuevo."]);
    } finally {
      setBuscando(false);
    }
  }

  async function confirmar() {
    setGuardando(true);
    const res = await editarAnimalesMasivo(animales.map((a) => a.id), campoEditar, valor);
    setResultado(res);
    setPaso("resultado");
    setGuardando(false);
  }

  function reiniciar() {
    setTextChips("");
    setAnimales([]);
    setNoEncontrados([]);
    setBuscado(false);
    setCampoEditar("categoria");
    setValor("");
    setPaso("form");
    setResultado(null);
  }

  const labelCampo = CAMPOS.find((c) => c.value === campoEditar)?.label ?? "";

  function renderSelector() {
    if (campoEditar === "vivo") {
      return (
        <select value={valor} onChange={(e) => setValor(e.target.value)} className={selectClass}>
          <option value="">— Seleccioná estado —</option>
          <option value="true">Vivo</option>
          <option value="false">Muerto</option>
        </select>
      );
    }
    if (campoEditar === "categoria") {
      return (
        <select value={valor} onChange={(e) => setValor(e.target.value)} className={selectClass}>
          <option value="">— Seleccioná categoría —</option>
          {categorias.map((c) => <option key={c.id} value={c.nombre}>{c.nombre}</option>)}
        </select>
      );
    }
    if (campoEditar === "raza") {
      return (
        <select value={valor} onChange={(e) => setValor(e.target.value)} className={selectClass}>
          <option value="">— Seleccioná raza —</option>
          {razas.map((r) => <option key={r.id} value={r.nombre}>{r.nombre}</option>)}
        </select>
      );
    }
    if (campoEditar === "campo_actual_id") {
      return (
        <select value={valor} onChange={(e) => setValor(e.target.value)} className={selectClass}>
          <option value="">— Sin campo —</option>
          {campos.map((c) => <option key={c.id} value={c.id}>{c.nombre}</option>)}
        </select>
      );
    }
    return (
      <input
        type="text"
        value={valor}
        onChange={(e) => setValor(e.target.value)}
        placeholder={`Nuevo valor para ${labelCampo.toLowerCase()}`}
        className="w-full border border-stone-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-300"
      />
    );
  }

  const selectClass = "w-full border border-stone-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-300 bg-white";

  if (paso === "resultado") {
    return (
      <div className={`rounded-xl border p-6 ${resultado?.ok ? "bg-green-50 border-green-200" : "bg-red-50 border-red-200"}`}>
        {resultado?.ok ? (
          <>
            <p className="font-semibold text-green-700 text-lg">Edición completada</p>
            <p className="text-green-600 mt-1">
              Se actualizaron <strong>{resultado.editados}</strong> animal{resultado.editados !== 1 ? "es" : ""}.
            </p>
          </>
        ) : (
          <>
            <p className="font-semibold text-red-700">Error al editar</p>
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
          Vas a cambiar <strong>{labelCampo}</strong> a{" "}
          <strong>
            {campoEditar === "vivo"
              ? valor === "true" ? "Vivo" : "Muerto"
              : campoEditar === "campo_actual_id"
              ? (campos.find((c) => c.id === valor)?.nombre ?? "Sin campo")
              : valor || "vacío"}
          </strong>{" "}
          en <strong>{animales.length}</strong> animal{animales.length !== 1 ? "es" : ""}.
        </p>
        <div className="flex gap-3">
          <button onClick={confirmar} disabled={guardando} className="px-4 py-2 bg-green-800 text-white rounded-lg text-sm hover:bg-green-700 disabled:opacity-50">
            {guardando ? "Guardando..." : "Confirmar"}
          </button>
          <button onClick={() => setPaso("editar")} className="px-4 py-2 border border-stone-300 rounded-lg text-sm hover:bg-stone-50">
            Volver
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Paso 1: buscar animales */}
      <div className="bg-white border border-stone-200 rounded-xl p-6 space-y-4">
        <h2 className="font-semibold text-stone-700">1. Seleccioná los animales</h2>
        <div className="flex gap-2 items-start">
          <textarea
            value={textChips}
            onChange={(e) => { setTextChips(e.target.value); setBuscado(false); setAnimales([]); setNoEncontrados([]); if (paso === "editar") setPaso("form"); }}
            placeholder={"032010010158200\n032010010158201\n032010010158202"}
            rows={6}
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
          <div className="space-y-2">
            <p className="text-sm text-stone-600">
              <strong>{animales.length}</strong> animal{animales.length !== 1 ? "es" : ""} encontrado{animales.length !== 1 ? "s" : ""}
            </p>
            {noEncontrados.length > 0 && (
              <div className="bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
                <p className="text-xs text-amber-700 font-medium mb-1">No encontrados ({noEncontrados.length}):</p>
                <p className="text-xs font-mono text-amber-600">{noEncontrados.join(", ")}</p>
              </div>
            )}
            {animales.length > 0 && (
              <div className="max-h-40 overflow-y-auto border border-stone-200 rounded-lg divide-y divide-stone-100">
                {animales.map((a) => (
                  <div key={a.id} className="flex items-center justify-between px-3 py-2 text-sm">
                    <span className="font-mono font-medium text-stone-700">{a.chip_id}</span>
                    <span className="text-stone-400 text-xs">{(a.campo as { nombre: string } | null)?.nombre ?? "sin campo"}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Paso 2: elegir campo y valor */}
      {paso === "editar" && animales.length > 0 && (
        <div className="bg-white border border-stone-200 rounded-xl p-6 space-y-4">
          <h2 className="font-semibold text-stone-700">2. ¿Qué campo querés cambiar?</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs text-stone-500 mb-1">Campo a editar</label>
              <select value={campoEditar} onChange={(e) => { setCampoEditar(e.target.value as CampoEditable); setValor(""); }} className={selectClass}>
                {CAMPOS.map((c) => <option key={c.value} value={c.value}>{c.label}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs text-stone-500 mb-1">Nuevo valor</label>
              {renderSelector()}
            </div>
          </div>
          <button
            onClick={() => setPaso("confirmar")}
            disabled={campoEditar !== "campo_actual_id" && campoEditar !== "vivo" && !valor.trim() || campoEditar === "vivo" && !valor}
            className="px-4 py-2 bg-green-800 text-white rounded-lg text-sm hover:bg-green-700 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            Continuar
          </button>
        </div>
      )}
    </div>
  );
}
