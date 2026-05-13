"use client";

import { useState } from "react";
import { eliminarAnimalesMasivo } from "./actions";

type AnimalEncontrado = {
  id: string;
  chip_id: string;
  numero_caravana: string | null;
  campo: { nombre: string } | null;
};

type Paso = "form" | "confirmar" | "resultado";

export default function EliminarMasivo() {
  const [textChips, setTextChips] = useState("");
  const [buscando, setBuscando] = useState(false);
  const [animalesEncontrados, setAnimalesEncontrados] = useState<AnimalEncontrado[]>([]);
  const [noEncontrados, setNoEncontrados] = useState<string[]>([]);
  const [buscado, setBuscado] = useState(false);

  const [paso, setPaso] = useState<Paso>("form");
  const [guardando, setGuardando] = useState(false);
  const [resultado, setResultado] = useState<{ ok: boolean; eliminados: number; error?: string } | null>(null);

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

  async function confirmar() {
    setGuardando(true);
    const res = await eliminarAnimalesMasivo(animalesEncontrados.map((a) => a.id));
    setResultado(res);
    setPaso("resultado");
    setGuardando(false);
  }

  function reiniciar() {
    setTextChips("");
    setAnimalesEncontrados([]);
    setNoEncontrados([]);
    setBuscado(false);
    setPaso("form");
    setResultado(null);
  }

  if (paso === "resultado") {
    return (
      <div className={`rounded-xl border p-6 ${resultado?.ok ? "bg-green-50 border-green-200" : "bg-red-50 border-red-200"}`}>
        {resultado?.ok ? (
          <>
            <p className="font-semibold text-green-700 text-lg">Baja registrada</p>
            <p className="text-green-600 mt-1">
              Se dieron de baja <strong>{resultado.eliminados}</strong> animal{resultado.eliminados !== 1 ? "es" : ""}.
            </p>
          </>
        ) : (
          <>
            <p className="font-semibold text-red-700">Error al eliminar</p>
            <p className="text-red-600 text-sm font-mono mt-1">{resultado?.error}</p>
          </>
        )}
        <button onClick={reiniciar} className="mt-4 px-4 py-2 bg-green-800 text-white rounded-lg text-sm hover:bg-green-700">
          Nueva eliminación masiva
        </button>
      </div>
    );
  }

  if (paso === "confirmar") {
    return (
      <div className="bg-red-50 border border-red-200 rounded-xl p-6 space-y-4">
        <p className="font-semibold text-red-800">¿Confirmás la baja?</p>
        <p className="text-red-700">
          Se van a dar de baja <strong>{animalesEncontrados.length}</strong> animal{animalesEncontrados.length !== 1 ? "es" : ""}.
          Esta acción los marcará como inactivos.
        </p>
        <div className="max-h-48 overflow-y-auto border border-red-200 rounded-lg divide-y divide-red-100 bg-white">
          {animalesEncontrados.map((a) => (
            <div key={a.id} className="flex items-center justify-between px-3 py-2 text-sm">
              <span className="font-mono font-medium text-stone-700">{a.chip_id}</span>
              <span className="text-stone-400 text-xs">
                {(a.campo as unknown as { nombre: string } | null)?.nombre ?? "sin campo"}
              </span>
            </div>
          ))}
        </div>
        <div className="flex gap-3 pt-1">
          <button
            onClick={confirmar}
            disabled={guardando}
            className="px-4 py-2 bg-red-600 text-white rounded-lg text-sm hover:bg-red-700 disabled:opacity-50"
          >
            {guardando ? "Eliminando..." : "Sí, dar de baja"}
          </button>
          <button onClick={() => setPaso("form")} className="px-4 py-2 border border-stone-300 rounded-lg text-sm hover:bg-stone-50">
            Cancelar
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white border border-stone-200 rounded-xl p-6 space-y-5">
      <div>
        <label className="block text-sm font-medium text-stone-700 mb-2">
          Pegá las caravanas a dar de baja (una por línea)
        </label>
        <div className="flex gap-2 items-start">
          <textarea
            value={textChips}
            onChange={(e) => { setTextChips(e.target.value); setBuscado(false); setAnimalesEncontrados([]); setNoEncontrados([]); }}
            placeholder={"032010010158200\n032010010158201\n032010010158202"}
            rows={6}
            className="flex-1 border border-stone-300 rounded-lg px-3 py-2 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-red-300 resize-none"
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
      </div>

      {buscado && (
        <div className="space-y-3">
          <p className="text-sm font-medium text-stone-700">
            {animalesEncontrados.length} animal{animalesEncontrados.length !== 1 ? "es" : ""} encontrado{animalesEncontrados.length !== 1 ? "s" : ""}
          </p>

          {noEncontrados.length > 0 && (
            <div className="bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
              <p className="text-xs text-amber-700 font-medium mb-1">No encontrados ({noEncontrados.length}):</p>
              <p className="text-xs font-mono text-amber-600">{noEncontrados.join(", ")}</p>
            </div>
          )}

          {animalesEncontrados.length > 0 && (
            <>
              <div className="max-h-48 overflow-y-auto border border-stone-200 rounded-lg divide-y divide-stone-100">
                {animalesEncontrados.map((a) => (
                  <div key={a.id} className="flex items-center justify-between px-3 py-2 text-sm">
                    <span className="font-mono font-medium text-stone-700">{a.chip_id}</span>
                    <span className="text-stone-400 text-xs">
                      {(a.campo as unknown as { nombre: string } | null)?.nombre ?? "sin campo"}
                    </span>
                  </div>
                ))}
              </div>
              <button
                onClick={() => setPaso("confirmar")}
                className="px-5 py-2 bg-red-600 text-white rounded-lg text-sm hover:bg-red-700"
              >
                Dar de baja {animalesEncontrados.length} animal{animalesEncontrados.length !== 1 ? "es" : ""}
              </button>
            </>
          )}
        </div>
      )}
    </div>
  );
}
