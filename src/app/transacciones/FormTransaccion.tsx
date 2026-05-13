"use client";

import { useEffect, useState } from "react";
import { registrarTransaccion } from "./actions";

type AnimalResultado = {
  id: string;
  chip_id: string;
  numero_caravana: string | null;
  campo: { nombre: string } | null;
};

type AnimalSeleccionado = AnimalResultado & { precio: string };

type Paso = "form" | "confirmar" | "resultado";
type Resultado = { ok: boolean; error?: string };

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

function formatPeso(n: number) {
  return n.toLocaleString("es-AR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

export default function FormTransaccion() {
  const tipo = "venta" as const;
  const [contraparte, setContraparte] = useState("");
  const [cuit, setCuit] = useState("");
  const [fecha, setFecha] = useState(hoy());
  const [remito, setRemito] = useState("");
  const [nroTransaccion, setNroTransaccion] = useState("");
  const [observaciones, setObservaciones] = useState("");

  const [query, setQuery] = useState("");
  const [resultados, setResultados] = useState<AnimalResultado[]>([]);
  const [buscando, setBuscando] = useState(false);
  const [seleccionados, setSeleccionados] = useState<AnimalSeleccionado[]>([]);

  const [paso, setPaso] = useState<Paso>("form");
  const [resultado, setResultado] = useState<Resultado | null>(null);
  const [guardando, setGuardando] = useState(false);

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
      setSeleccionados((prev) => [...prev, { ...animal, precio: "" }]);
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
      setSeleccionados((prev) => [...prev, ...nuevos.map((a) => ({ ...a, precio: "" }))]);

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

  function setPrecio(id: string, valor: string) {
    setSeleccionados((prev) =>
      prev.map((a) => (a.id === id ? { ...a, precio: valor } : a))
    );
  }

  const precioTotal = seleccionados.reduce((acc, a) => acc + (parseFloat(a.precio) || 0), 0);

  async function confirmar() {
    setGuardando(true);
    const res = await registrarTransaccion({
      tipo,
      fecha,
      contraparte,
      contraparte_cuit: cuit,
      precio_total: precioTotal,
      numero_remito: remito,
      numero_transaccion: nroTransaccion,
      observaciones,
      animales: seleccionados.map((a) => ({
        animal_id: a.id,
        precio_unitario: parseFloat(a.precio) || 0,
      })),
    });
    setResultado(res);
    setPaso("resultado");
    setGuardando(false);
  }

  function reiniciar() {
    setContraparte("");
    setCuit("");
    setFecha(hoy());
    setRemito("");
    setNroTransaccion("");
    setObservaciones("");
    setSeleccionados([]);
    setPaso("form");
    setResultado(null);
    setQuery("");
  }

  if (paso === "resultado") {
    return (
      <div className={`rounded-xl border p-6 ${resultado?.ok ? "bg-green-50 border-green-200" : "bg-red-50 border-red-200"}`}>
        {resultado?.ok ? (
          <p className="font-semibold text-green-700 text-lg">
            Transacción registrada exitosamente
          </p>
        ) : (
          <>
            <p className="font-semibold text-red-700">Error al registrar transacción</p>
            <p className="text-red-600 text-sm font-mono mt-1">{resultado?.error}</p>
          </>
        )}
        <button onClick={reiniciar} className="mt-4 px-4 py-2 bg-green-800 text-white rounded-lg text-sm hover:bg-green-700">
          Nueva transacción
        </button>
      </div>
    );
  }

  if (paso === "confirmar") {
    return (
      <div className="bg-amber-50 border border-amber-200 rounded-xl p-6 space-y-4">
        <p className="font-semibold text-amber-800">Confirmación</p>
        <p className="text-amber-700">
          Vas a registrar una <strong>venta</strong> de{" "}
          <strong>{seleccionados.length}</strong> animal{seleccionados.length !== 1 ? "es" : ""}{" "}
          por <strong>${formatPeso(precioTotal)}</strong> con{" "}
          <strong>{contraparte}</strong>.
          <span className="block mt-1 text-amber-600 text-sm">
            Los animales vendidos quedarán marcados como inactivos.
          </span>
        </p>
        <div className="flex gap-3 pt-2">
          <button
            onClick={confirmar}
            disabled={guardando}
            className="px-4 py-2 bg-green-800 text-white rounded-lg text-sm hover:bg-green-700 disabled:opacity-50"
          >
            {guardando ? "Guardando..." : "Confirmar definitivamente"}
          </button>
          <button onClick={() => setPaso("form")} className="px-4 py-2 border border-stone-300 rounded-lg text-sm hover:bg-stone-50">
            Volver
          </button>
        </div>
      </div>
    );
  }

  const puedeConfirmar = contraparte && fecha && seleccionados.length > 0;

  return (
    <div className="bg-white border border-stone-200 rounded-xl p-6 space-y-5">
      <h2 className="font-semibold text-stone-700">Registrar venta</h2>

      {/* Datos del encabezado */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <div>
          <label className="block text-xs text-stone-500 mb-1">Contraparte *</label>
          <input type="text" value={contraparte} onChange={(e) => setContraparte(e.target.value)}
            placeholder="Nombre del comprador/vendedor"
            className="w-full border border-stone-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-300" />
        </div>
        <div>
          <label className="block text-xs text-stone-500 mb-1">CUIT</label>
          <input type="text" value={cuit} onChange={(e) => setCuit(e.target.value)}
            placeholder="XX-XXXXXXXX-X"
            className="w-full border border-stone-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-300" />
        </div>
        <div>
          <label className="block text-xs text-stone-500 mb-1">Fecha *</label>
          <input type="date" value={fecha} onChange={(e) => setFecha(e.target.value)}
            className="w-full border border-stone-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-300" />
        </div>
        <div>
          <label className="block text-xs text-stone-500 mb-1">Número de remito</label>
          <input type="text" value={remito} onChange={(e) => setRemito(e.target.value)}
            className="w-full border border-stone-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-300" />
        </div>
        <div>
          <label className="block text-xs text-stone-500 mb-1">Número de transacción</label>
          <input type="text" value={nroTransaccion} onChange={(e) => setNroTransaccion(e.target.value)}
            className="w-full border border-stone-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-300" />
        </div>
        <div>
          <label className="block text-xs text-stone-500 mb-1">Observaciones</label>
          <input type="text" value={observaciones} onChange={(e) => setObservaciones(e.target.value)}
            className="w-full border border-stone-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-300" />
        </div>
      </div>

      {/* Buscador de animales */}
      <div className="relative">
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
              <button key={a.id} onClick={() => agregarAnimal(a)}
                className="w-full text-left px-3 py-2 text-sm hover:bg-stone-50 border-b border-gray-100 last:border-0">
                <span className="font-mono font-medium">{a.chip_id}</span>
                {a.numero_caravana && <span className="text-stone-500 ml-2">— {a.numero_caravana}</span>}
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
          <Tooltip texto={"Pegá los chips uno por línea (o separados por coma).\n\nSe agregan con precio vacío — completá el precio de cada uno después."} />
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

      {/* Animales seleccionados con precio */}
      {seleccionados.length > 0 && (
        <div className="space-y-2">
          <p className="text-xs text-stone-500">{seleccionados.length} animal{seleccionados.length !== 1 ? "es" : ""} seleccionado{seleccionados.length !== 1 ? "s" : ""}</p>
          <div className="space-y-1 max-h-52 overflow-y-auto">
            {seleccionados.map((a) => (
              <div key={a.id} className="flex items-center gap-3 bg-stone-50 rounded-lg px-3 py-2 text-sm">
                <span className="font-mono font-medium w-28 shrink-0">{a.chip_id}</span>
                <span className="text-stone-400 text-xs flex-1">
                  {(a.campo as { nombre: string } | null)?.nombre ?? "—"}
                </span>
                <div className="flex items-center gap-1 shrink-0">
                  <span className="text-stone-500 text-xs">$</span>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={a.precio}
                    onChange={(e) => setPrecio(a.id, e.target.value)}
                    placeholder="0.00"
                    className="w-24 border border-stone-300 rounded px-2 py-1 text-sm focus:outline-none focus:ring-1 focus:ring-green-300"
                  />
                </div>
                <button onClick={() => quitarAnimal(a.id)} className="text-stone-400 hover:text-red-500 text-xs">✕</button>
              </div>
            ))}
          </div>

          {/* Total */}
          <div className="flex justify-end pt-1">
            <span className="text-sm font-semibold text-stone-700">
              Total: <span className="text-gray-900">${formatPeso(precioTotal)}</span>
            </span>
          </div>
        </div>
      )}

      <button
        onClick={() => setPaso("confirmar")}
        disabled={!puedeConfirmar}
        className="px-4 py-2 bg-green-800 text-white rounded-lg text-sm hover:bg-green-700 disabled:opacity-40 disabled:cursor-not-allowed"
      >
        Confirmar transacción
      </button>
    </div>
  );
}
