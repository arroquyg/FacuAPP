"use client";

import { useEffect, useRef, useState } from "react";
import { registrarMovimientos } from "./actions";

type AnimalResultado = {
  id: string;
  chip_id: string;
  campo: { nombre: string } | null;
};

type Campo = { id: string; nombre: string };

type Paso = "form" | "confirmar" | "resultado";

type Resultado = { ok: boolean; movidos?: number; error?: string };

function hoy() {
  return new Date().toISOString().slice(0, 10);
}

function Tooltip({ texto }: { texto: string }) {
  const [visible, setVisible] = useState(false);
  return (
    <span className="relative inline-flex items-center ml-1">
      <button
        type="button"
        onMouseEnter={() => setVisible(true)}
        onMouseLeave={() => setVisible(false)}
        onFocus={() => setVisible(true)}
        onBlur={() => setVisible(false)}
        className="w-4 h-4 rounded-full bg-gray-300 text-stone-600 text-xs font-bold flex items-center justify-center hover:bg-gray-400 leading-none"
      >
        ?
      </button>
      {visible && (
        <span className="absolute left-6 top-0 z-20 w-64 bg-green-800 text-white text-xs rounded-lg px-3 py-2 shadow-lg whitespace-pre-line">
          {texto}
        </span>
      )}
    </span>
  );
}

export default function FormMovimiento({ campos }: { campos: Campo[] }) {
  const [query, setQuery] = useState("");
  const [resultados, setResultados] = useState<AnimalResultado[]>([]);
  const [buscando, setBuscando] = useState(false);
  const [seleccionados, setSeleccionados] = useState<AnimalResultado[]>([]);
  const [campoDestinoId, setCampoDestinoId] = useState("");
  const [fecha, setFecha] = useState(hoy());
  const [motivo, setMotivo] = useState("");
  const [paso, setPaso] = useState<Paso>("form");
  const [resultado, setResultado] = useState<Resultado | null>(null);
  const [guardando, setGuardando] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const [textMasivo, setTextMasivo] = useState("");
  const [cargandoMasivo, setCargandoMasivo] = useState(false);
  const [avisoMasivo, setAvisoMasivo] = useState<string | null>(null);

  useEffect(() => {
    if (query.length < 2) { setResultados([]); return; }
    const timer = setTimeout(async () => {
      setBuscando(true);
      try {
        const res = await fetch(`/api/animales/search?q=${encodeURIComponent(query)}`);
        setResultados(await res.json());
      } catch { setResultados([]); }
      finally { setBuscando(false); }
    }, 300);
    return () => clearTimeout(timer);
  }, [query]);

  function agregarAnimal(animal: AnimalResultado) {
    if (!seleccionados.find((a) => a.id === animal.id)) {
      setSeleccionados((prev) => [...prev, animal]);
    }
    setQuery("");
    setResultados([]);
  }

  function quitarAnimal(id: string) {
    setSeleccionados((prev) => prev.filter((a) => a.id !== id));
  }

  async function cargarMasivo() {
    const chips = textMasivo
      .split(/[\n,]/)
      .map((c) => c.trim().toUpperCase())
      .filter(Boolean);
    if (chips.length === 0) return;

    setCargandoMasivo(true);
    setAvisoMasivo(null);
    try {
      const res = await fetch(
        `/api/animales/bulk-search?chips=${encodeURIComponent(chips.join(","))}`
      );
      const encontrados: AnimalResultado[] = await res.json();
      const nuevos = encontrados.filter(
        (a) => !seleccionados.find((s) => s.id === a.id)
      );
      setSeleccionados((prev) => [...prev, ...nuevos]);

      const noEncontrados = chips.filter(
        (c) => !encontrados.find((a) => a.chip_id === c)
      );
      if (noEncontrados.length > 0) {
        setAvisoMasivo(
          `${nuevos.length} agregado${nuevos.length !== 1 ? "s" : ""}. No encontrados: ${noEncontrados.join(", ")}`
        );
      } else {
        setAvisoMasivo(`${nuevos.length} animal${nuevos.length !== 1 ? "es" : ""} agregado${nuevos.length !== 1 ? "s" : ""} correctamente.`);
      }
      setTextMasivo("");
    } catch {
      setAvisoMasivo("Error al buscar los chips. Intentá de nuevo.");
    } finally {
      setCargandoMasivo(false);
    }
  }

  function campoDestino() {
    return campos.find((c) => c.id === campoDestinoId);
  }

  async function confirmar() {
    setGuardando(true);
    const res = await registrarMovimientos(
      seleccionados.map((a) => a.id),
      campoDestinoId,
      fecha,
      motivo || null
    );
    setResultado(res);
    setPaso("resultado");
    setGuardando(false);
  }

  function reiniciar() {
    setSeleccionados([]);
    setCampoDestinoId("");
    setFecha(hoy());
    setMotivo("");
    setPaso("form");
    setResultado(null);
    setQuery("");
  }

  if (paso === "resultado") {
    return (
      <div className={`rounded-xl border p-6 ${resultado?.ok ? "bg-green-50 border-green-200" : "bg-red-50 border-red-200"}`}>
        {resultado?.ok ? (
          <>
            <p className="font-semibold text-green-700 text-lg">
              Movimiento registrado exitosamente
            </p>
            <p className="text-green-600 mt-1">
              Se movieron {resultado.movidos} animales al campo {campoDestino()?.nombre}.
            </p>
          </>
        ) : (
          <>
            <p className="font-semibold text-red-700">Error al registrar movimiento</p>
            <p className="text-red-600 text-sm font-mono mt-1">{resultado?.error}</p>
          </>
        )}
        <button
          onClick={reiniciar}
          className="mt-4 px-4 py-2 bg-green-800 text-white rounded-lg text-sm hover:bg-green-700"
        >
          Nuevo movimiento
        </button>
      </div>
    );
  }

  if (paso === "confirmar") {
    return (
      <div className="bg-amber-50 border border-amber-200 rounded-xl p-6 space-y-4">
        <p className="font-semibold text-amber-800">Confirmación</p>
        <p className="text-amber-700">
          Vas a mover <strong>{seleccionados.length}</strong> animal
          {seleccionados.length !== 1 ? "es" : ""} al campo{" "}
          <strong>{campoDestino()?.nombre}</strong>.
        </p>
        <div className="text-sm text-amber-700 space-y-0.5">
          {seleccionados.map((a) => (
            <div key={a.id} className="font-mono">{a.chip_id}</div>
          ))}
        </div>
        <div className="flex gap-3 pt-2">
          <button
            onClick={confirmar}
            disabled={guardando}
            className="px-4 py-2 bg-green-800 text-white rounded-lg text-sm hover:bg-green-700 disabled:opacity-50"
          >
            {guardando ? "Guardando..." : "Confirmar definitivamente"}
          </button>
          <button
            onClick={() => setPaso("form")}
            className="px-4 py-2 border border-stone-300 rounded-lg text-sm hover:bg-stone-50"
          >
            Volver
          </button>
        </div>
      </div>
    );
  }

  const puedeConfirmar = seleccionados.length > 0 && campoDestinoId && fecha;

  return (
    <div className="bg-white border border-stone-200 rounded-xl p-6 space-y-5">
      <h2 className="font-semibold text-stone-700">Registrar movimiento</h2>

      {/* Buscador */}
      <div className="relative" ref={dropdownRef}>
        <label className="block text-xs text-stone-500 mb-1">Buscar animales por chip o caravana</label>
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Ej: CHK-001"
          className="w-full border border-stone-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-300"
        />
        {(resultados.length > 0 || buscando) && (
          <div className="absolute z-10 mt-1 w-full bg-white border border-stone-200 rounded-lg shadow-lg max-h-48 overflow-y-auto">
            {buscando && <div className="px-3 py-2 text-sm text-stone-400">Buscando...</div>}
            {resultados.map((a) => (
              <button
                key={a.id}
                onClick={() => agregarAnimal(a)}
                className="w-full text-left px-3 py-2 text-sm hover:bg-stone-50 border-b border-gray-100 last:border-0"
              >
                <span className="font-mono font-medium">{a.chip_id}</span>
                <span className="text-stone-400 ml-2 text-xs">
                  {(a.campo as { nombre: string } | null)?.nombre ?? "sin campo"}
                </span>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Carga masiva */}
      <div>
        <label className="block text-xs text-stone-500 mb-1 flex items-center">
          Carga masiva por chip
          <Tooltip texto={"Pegá los chips uno por línea (o separados por coma).\n\nSolo se agregan chips exactos que existan en el sistema."} />
        </label>
        <div className="flex gap-2">
          <textarea
            value={textMasivo}
            onChange={(e) => { setTextMasivo(e.target.value); setAvisoMasivo(null); }}
            placeholder={"032010010158200\n032010010158201\n032010010158202"}
            rows={5}
            className="flex-1 border border-stone-300 rounded-lg px-3 py-2 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-green-300 resize-none"
          />
          <button
            type="button"
            onClick={cargarMasivo}
            disabled={cargandoMasivo || !textMasivo.trim()}
            className="px-4 py-2 bg-stone-100 border border-stone-300 rounded-lg text-sm text-stone-700 hover:bg-gray-200 disabled:opacity-40 disabled:cursor-not-allowed self-end"
          >
            {cargandoMasivo ? "Cargando..." : "Cargar"}
          </button>
        </div>
        {avisoMasivo && (
          <p className={`text-xs mt-1 ${avisoMasivo.includes("No encontrados") ? "text-amber-600" : "text-green-600"}`}>
            {avisoMasivo}
          </p>
        )}
      </div>

      {/* Animales seleccionados */}
      {seleccionados.length > 0 && (
        <div>
          <p className="text-xs text-stone-500 mb-2">
            {seleccionados.length} animal{seleccionados.length !== 1 ? "es" : ""} seleccionado{seleccionados.length !== 1 ? "s" : ""}
          </p>
          <div className="space-y-1 max-h-40 overflow-y-auto">
            {seleccionados.map((a) => (
              <div key={a.id} className="flex items-center justify-between bg-stone-50 rounded-lg px-3 py-1.5 text-sm">
                <span>
                  <span className="font-mono font-medium">{a.chip_id}</span>
                  <span className="text-stone-400 ml-2 text-xs">
                    {(a.campo as { nombre: string } | null)?.nombre ?? "—"}
                  </span>
                </span>
                <button
                  onClick={() => quitarAnimal(a.id)}
                  className="text-stone-400 hover:text-red-500 ml-3 text-xs"
                >
                  ✕
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Campos del formulario */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div>
          <label className="block text-xs text-stone-500 mb-1">Campo destino *</label>
          <select
            value={campoDestinoId}
            onChange={(e) => setCampoDestinoId(e.target.value)}
            className="w-full border border-stone-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-300"
          >
            <option value="">Seleccionar campo</option>
            {campos.map((c) => (
              <option key={c.id} value={c.id}>{c.nombre}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-xs text-stone-500 mb-1">Fecha *</label>
          <input
            type="date"
            value={fecha}
            onChange={(e) => setFecha(e.target.value)}
            className="w-full border border-stone-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-300"
          />
        </div>
        <div>
          <label className="block text-xs text-stone-500 mb-1">Motivo (opcional)</label>
          <input
            type="text"
            value={motivo}
            onChange={(e) => setMotivo(e.target.value)}
            placeholder="Ej: Separación por categoría"
            className="w-full border border-stone-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-300"
          />
        </div>
      </div>

      <button
        onClick={() => setPaso("confirmar")}
        disabled={!puedeConfirmar}
        className="px-4 py-2 bg-green-800 text-white rounded-lg text-sm hover:bg-green-700 disabled:opacity-40 disabled:cursor-not-allowed"
      >
        Confirmar movimiento
      </button>
    </div>
  );
}
