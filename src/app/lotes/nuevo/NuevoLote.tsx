"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import * as XLSX from "xlsx";
import { crearLote } from "../actions";

type Campo = { id: string; nombre: string };
type Alimento = { id: string; nombre: string; precio_por_tonelada: number };
type AnimalRow = { chip_id: string; peso_entrada_kg: number };
type AlimentoLote = { alimento_id: string; nombre: string; kg_por_dia: number; precio_por_tonelada: number };

export default function NuevoLote({ campos, alimentos }: { campos: Campo[]; alimentos: Alimento[] }) {
  const router = useRouter();
  const fileRef = useRef<HTMLInputElement>(null);

  const [nombre, setNombre] = useState("");
  const [campoId, setCampoId] = useState("");
  const [fechaInicio, setFechaInicio] = useState(new Date().toISOString().slice(0, 10));
  const [alimentosLote, setAlimentosLote] = useState<AlimentoLote[]>([]);
  const [animales, setAnimales] = useState<AnimalRow[]>([]);
  const [pesoPromedio, setPesoPromedio] = useState("");
  const [modoIngreso, setModoIngreso] = useState<"caravanas" | "promedio" | "archivo">("caravanas");
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState("");

  // Estado para modo "caravanas"
  const [textChips, setTextChips] = useState("");
  const [buscando, setBuscando] = useState(false);
  const [noEncontrados, setNoEncontrados] = useState<string[]>([]);
  const [buscadoChips, setBuscadoChips] = useState(false);

  // ── Alimentos ─────────────────────────────────────────────────────────────
  function agregarAlimento(alimentoId: string) {
    if (alimentosLote.find((a) => a.alimento_id === alimentoId)) return;
    const alim = alimentos.find((a) => a.id === alimentoId);
    if (!alim) return;
    setAlimentosLote((prev) => [...prev, { alimento_id: alim.id, nombre: alim.nombre, kg_por_dia: 0, precio_por_tonelada: alim.precio_por_tonelada }]);
  }

  function actualizarKg(alimentoId: string, kg: number) {
    setAlimentosLote((prev) => prev.map((a) => a.alimento_id === alimentoId ? { ...a, kg_por_dia: kg } : a));
  }

  function quitarAlimento(alimentoId: string) {
    setAlimentosLote((prev) => prev.filter((a) => a.alimento_id !== alimentoId));
  }

  // ── Modo caravanas: buscar por chip ───────────────────────────────────────
  async function handleBuscarChips() {
    const chips = textChips.split(/[\n,]/).map((c) => c.trim().replace(/\s+/g, "").toUpperCase()).filter(Boolean);
    if (chips.length === 0) { setError("Ingresá al menos una caravana."); return; }
    setError("");
    setBuscando(true);
    try {
      const res = await fetch("/api/animales/bulk-search", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ chips }),
      });
      const data: { id: string; chip_id: string }[] = await res.json();
      const encontradosSet = new Set(data.map((a) => a.chip_id));
      const noEnc = chips.filter((c) => !encontradosSet.has(c));
      setAnimales(data.map((a) => ({ chip_id: a.chip_id, peso_entrada_kg: 0 })));
      setNoEncontrados(noEnc);
      setBuscadoChips(true);
    } catch {
      setError("Error al buscar las caravanas.");
    } finally {
      setBuscando(false);
    }
  }

  // ── Modo archivo ──────────────────────────────────────────────────────────
  function handleArchivo(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const wb = XLSX.read(ev.target?.result, { type: "array" });
      const ws = wb.Sheets[wb.SheetNames[0]];
      const rows = XLSX.utils.sheet_to_json<Record<string, unknown>>(ws, { defval: "" });
      const parsed: AnimalRow[] = [];
      for (const row of rows) {
        const chip = String(row["EID"] ?? row["chip_id"] ?? row["Caravana"] ?? "").trim().replace(/\s+/g, "");
        if (!chip) continue;
        if (modoIngreso === "archivo") {
          const peso = parseFloat(String(row["Peso"] ?? row["peso_kg"] ?? row["peso"] ?? "0"));
          if (!isNaN(peso) && peso > 0) parsed.push({ chip_id: chip, peso_entrada_kg: peso });
        } else {
          parsed.push({ chip_id: chip, peso_entrada_kg: 0 });
        }
      }
      setAnimales(parsed);
      setError(parsed.length === 0 ? "No se encontraron filas válidas en el archivo." : "");
    };
    reader.readAsArrayBuffer(file);
  }

  function descargarTemplate() {
    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.aoa_to_sheet([
      ["EID", "Peso"],
      ["982000123456789", 320],
    ]);
    ws["!cols"] = [{ wch: 22 }, { wch: 10 }];
    XLSX.utils.book_append_sheet(wb, ws, "Animales");
    XLSX.writeFile(wb, "template_lote_animales.xlsx");
  }

  // ── Cambiar modo ──────────────────────────────────────────────────────────
  function cambiarModo(modo: "caravanas" | "promedio" | "archivo") {
    setModoIngreso(modo);
    setAnimales([]);
    setNoEncontrados([]);
    setBuscadoChips(false);
    setError("");
    if (fileRef.current) fileRef.current.value = "";
  }

  // ── Validar y crear ───────────────────────────────────────────────────────
  async function handleCrear() {
    if (!nombre.trim()) { setError("Ingresá un nombre para el lote."); return; }
    if (!campoId) { setError("Seleccioná un campo."); return; }
    if (!fechaInicio) { setError("Ingresá la fecha de inicio."); return; }
    if (alimentosLote.length === 0) { setError("Agregá al menos un alimento."); return; }
    if (alimentosLote.some((a) => a.kg_por_dia <= 0)) { setError("Todos los alimentos deben tener kg/día mayor a 0."); return; }

    let animalesFinales: AnimalRow[] = [];

    if (modoIngreso === "caravanas" || modoIngreso === "promedio") {
      const peso = parseFloat(pesoPromedio);
      if (isNaN(peso) || peso <= 0) { setError("Ingresá un peso promedio válido."); return; }
      if (animales.length === 0) {
        setError(modoIngreso === "caravanas" ? "Buscá las caravanas primero." : "Cargá los animales desde un archivo primero.");
        return;
      }
      if (modoIngreso === "caravanas" && noEncontrados.length > 0) {
        setError(`Hay ${noEncontrados.length} caravana(s) no encontrada(s). Revisá el listado.`);
        return;
      }
      animalesFinales = animales.map((a) => ({ ...a, peso_entrada_kg: peso }));
    } else {
      if (animales.length === 0) { setError("El archivo no tiene animales válidos."); return; }
      animalesFinales = animales;
    }

    setError("");
    setGuardando(true);

    const res = await crearLote({
      nombre: nombre.trim(),
      campo_id: campoId,
      fecha_inicio: fechaInicio,
      alimentos: alimentosLote.map(({ alimento_id, kg_por_dia, precio_por_tonelada }) => ({ alimento_id, kg_por_dia, precio_por_tonelada })),
      animales: animalesFinales.map(({ chip_id, peso_entrada_kg }) => ({ chip_id, peso_entrada_kg })),
    });

    if (!res.ok) { setError(res.error ?? "Error al crear el lote."); setGuardando(false); return; }
    router.push(`/lotes/${res.id}`);
  }

  const costoDiarioTotal = alimentosLote.reduce((sum, a) => sum + (a.kg_por_dia * a.precio_por_tonelada) / 1000, 0);
  const costoDiarioPorAnimal = animales.length > 0 ? costoDiarioTotal / animales.length : null;

  return (
    <div className="space-y-6">
      {/* Datos del lote */}
      <div className="bg-white rounded-xl border border-stone-200 shadow-sm p-6 space-y-4">
        <p className="font-medium text-stone-800">Datos del lote</p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-stone-700 mb-1">Nombre del lote <span className="text-red-500">*</span></label>
            <input value={nombre} onChange={(e) => setNombre(e.target.value)} placeholder="Ej: Engorde verano 2026"
              className="w-full border border-stone-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-300" />
          </div>
          <div>
            <label className="block text-sm font-medium text-stone-700 mb-1">Campo <span className="text-red-500">*</span></label>
            <select value={campoId} onChange={(e) => setCampoId(e.target.value)}
              className="w-full border border-stone-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-300 bg-white">
              <option value="">Seleccionar...</option>
              {campos.map((c) => <option key={c.id} value={c.id}>{c.nombre}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-stone-700 mb-1">Fecha de inicio <span className="text-red-500">*</span></label>
            <input type="date" value={fechaInicio} onChange={(e) => setFechaInicio(e.target.value)}
              className="w-full border border-stone-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-300" />
          </div>
        </div>
      </div>

      {/* Alimentos */}
      <div className="bg-white rounded-xl border border-stone-200 shadow-sm p-6 space-y-4">
        <p className="font-medium text-stone-800">Alimentos diarios del lote</p>
        <div className="flex gap-2 items-center">
          <select defaultValue="" onChange={(e) => { agregarAlimento(e.target.value); e.target.value = ""; }}
            className="border border-stone-300 rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-green-300">
            <option value="">+ Agregar alimento...</option>
            {alimentos.filter((a) => !alimentosLote.find((al) => al.alimento_id === a.id)).map((a) => (
              <option key={a.id} value={a.id}>{a.nombre} — ${Number(a.precio_por_tonelada).toLocaleString("es-AR")}/ton</option>
            ))}
          </select>
        </div>

        {alimentosLote.length > 0 && (
          <div className="space-y-2">
            {alimentosLote.map((a) => (
              <div key={a.alimento_id} className="flex items-center gap-3 p-3 bg-stone-50 rounded-lg border border-stone-200">
                <span className="flex-1 text-sm font-medium text-stone-700">{a.nombre}</span>
                <div className="flex items-center gap-1.5">
                  <input type="number" min="0" step="0.5" value={a.kg_por_dia || ""} onChange={(e) => actualizarKg(a.alimento_id, parseFloat(e.target.value) || 0)}
                    placeholder="kg/día"
                    className="w-24 border border-stone-300 rounded px-2 py-1 text-sm text-right focus:outline-none focus:ring-1 focus:ring-green-300" />
                  <span className="text-xs text-stone-400">kg/día</span>
                </div>
                <span className="text-xs text-stone-500 w-28 text-right">
                  ${((a.kg_por_dia * a.precio_por_tonelada) / 1000).toLocaleString("es-AR", { minimumFractionDigits: 2 })}/día
                </span>
                <button onClick={() => quitarAlimento(a.alimento_id)} className="text-stone-400 hover:text-red-500 text-sm">✕</button>
              </div>
            ))}
            <div className="flex justify-between pt-2 border-t border-stone-100 text-sm">
              <span className="text-stone-500">Costo total diario del lote</span>
              <span className="font-semibold text-stone-800">${costoDiarioTotal.toLocaleString("es-AR", { minimumFractionDigits: 2 })}/día</span>
            </div>
            {costoDiarioPorAnimal !== null && (
              <div className="flex justify-between text-sm">
                <span className="text-stone-500">Costo por animal/día ({animales.length} animales)</span>
                <span className="font-semibold text-green-800">${costoDiarioPorAnimal.toLocaleString("es-AR", { minimumFractionDigits: 2 })}/día</span>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Animales */}
      <div className="bg-white rounded-xl border border-stone-200 shadow-sm p-6 space-y-4">
        <div className="flex items-center justify-between">
          <p className="font-medium text-stone-800">Animales del lote</p>
          {modoIngreso !== "caravanas" && (
            <button onClick={descargarTemplate} className="text-xs text-green-700 hover:underline">
              Descargar template
            </button>
          )}
        </div>

        {/* Selector de modo */}
        <div className="flex flex-wrap gap-2">
          <button onClick={() => cambiarModo("caravanas")}
            className={`px-3 py-1.5 rounded-lg text-sm border transition-colors ${modoIngreso === "caravanas" ? "bg-green-800 text-white border-green-800" : "border-stone-300 text-stone-600 hover:bg-stone-50"}`}>
            Pegar caravanas
          </button>
          <button onClick={() => cambiarModo("promedio")}
            className={`px-3 py-1.5 rounded-lg text-sm border transition-colors ${modoIngreso === "promedio" ? "bg-green-800 text-white border-green-800" : "border-stone-300 text-stone-600 hover:bg-stone-50"}`}>
            Archivo + peso promedio
          </button>
          <button onClick={() => cambiarModo("archivo")}
            className={`px-3 py-1.5 rounded-lg text-sm border transition-colors ${modoIngreso === "archivo" ? "bg-green-800 text-white border-green-800" : "border-stone-300 text-stone-600 hover:bg-stone-50"}`}>
            Archivo + peso individual
          </button>
        </div>

        <div className="space-y-3">
          {/* Modo caravanas */}
          {modoIngreso === "caravanas" && (
            <>
              <div>
                <label className="block text-sm font-medium text-stone-700 mb-1">Peso promedio de entrada (kg) <span className="text-red-500">*</span></label>
                <input type="number" min="0" step="0.5" value={pesoPromedio} onChange={(e) => setPesoPromedio(e.target.value)}
                  placeholder="Ej: 285"
                  className="w-40 border border-stone-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-300" />
              </div>
              <div>
                <label className="block text-sm font-medium text-stone-700 mb-1">
                  Caravanas <span className="text-red-500">*</span>
                </label>
                <div className="flex gap-2 items-start">
                  <textarea
                    value={textChips}
                    onChange={(e) => { setTextChips(e.target.value); setBuscadoChips(false); setAnimales([]); setNoEncontrados([]); }}
                    placeholder={"032010010158200\n032010010158201\n032010010158202"}
                    rows={6}
                    className="flex-1 border border-stone-300 rounded-lg px-3 py-2 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-green-300 resize-none"
                  />
                  <button
                    onClick={handleBuscarChips}
                    disabled={buscando || !textChips.trim()}
                    className="px-4 py-2 bg-green-800 text-white rounded-lg text-sm hover:bg-green-700 disabled:opacity-40 transition-colors whitespace-nowrap"
                  >
                    {buscando ? "Buscando..." : "Buscar animales"}
                  </button>
                </div>
                <p className="text-xs text-stone-400 mt-1">Una caravana por línea, o separadas por coma.</p>
              </div>

              {buscadoChips && (
                <div className="space-y-2">
                  {animales.length > 0 && (
                    <div className="bg-green-50 rounded-lg border border-green-200 p-3">
                      <p className="text-sm font-medium text-green-800 mb-2">{animales.length} animales encontrados</p>
                      <div className="max-h-40 overflow-y-auto space-y-1">
                        {animales.slice(0, 50).map((a, i) => (
                          <span key={i} className="inline-block font-mono text-xs text-green-700 mr-3">{a.chip_id}</span>
                        ))}
                        {animales.length > 50 && <p className="text-xs text-green-600">... y {animales.length - 50} más</p>}
                      </div>
                    </div>
                  )}
                  {noEncontrados.length > 0 && (
                    <div className="bg-red-50 rounded-lg border border-red-200 p-3">
                      <p className="text-sm font-medium text-red-700 mb-1">{noEncontrados.length} caravana(s) no encontrada(s)</p>
                      <div className="flex flex-wrap gap-1">
                        {noEncontrados.map((c, i) => (
                          <span key={i} className="font-mono text-xs text-red-600 bg-red-100 px-1.5 py-0.5 rounded">{c}</span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </>
          )}

          {/* Modo archivo (promedio o individual) */}
          {(modoIngreso === "promedio" || modoIngreso === "archivo") && (
            <>
              {modoIngreso === "promedio" && (
                <div>
                  <label className="block text-sm font-medium text-stone-700 mb-1">Peso promedio de entrada (kg) <span className="text-red-500">*</span></label>
                  <input type="number" min="0" step="0.5" value={pesoPromedio} onChange={(e) => setPesoPromedio(e.target.value)}
                    placeholder="Ej: 285"
                    className="w-40 border border-stone-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-300" />
                  {animales.length > 0 && (
                    <p className="text-xs text-stone-400 mt-1">Se asignará a los {animales.length} animales del archivo.</p>
                  )}
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-stone-700 mb-1">
                  {modoIngreso === "promedio" ? "Archivo de animales (EID)" : "Archivo de animales (EID + Peso)"}
                  {" "}<span className="text-red-500">*</span>
                </label>
                <input ref={fileRef} type="file" accept=".xlsx,.xls,.csv" onChange={handleArchivo}
                  className="block text-sm text-stone-500 file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border file:border-stone-300 file:text-sm file:bg-white file:text-stone-600 hover:file:bg-stone-50" />
              </div>

              {animales.length > 0 && (
                <div className="bg-stone-50 rounded-lg border border-stone-200 p-3">
                  <p className="text-sm font-medium text-stone-700 mb-2">{animales.length} animales cargados</p>
                  <div className="max-h-40 overflow-y-auto space-y-1">
                    {animales.slice(0, 50).map((a, i) => (
                      <div key={i} className="flex justify-between text-xs text-stone-600">
                        <span className="font-mono">{a.chip_id}</span>
                        {modoIngreso === "archivo" && <span>{a.peso_entrada_kg} kg</span>}
                      </div>
                    ))}
                    {animales.length > 50 && <p className="text-xs text-stone-400">... y {animales.length - 50} más</p>}
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}

      <div className="flex gap-3">
        <button onClick={handleCrear} disabled={guardando}
          className="px-5 py-2 bg-green-800 text-white rounded-lg text-sm hover:bg-green-700 disabled:opacity-40 transition-colors">
          {guardando ? "Creando..." : "Crear lote"}
        </button>
        <a href="/lotes" className="px-4 py-2 border border-stone-300 rounded-lg text-sm hover:bg-stone-50">Cancelar</a>
      </div>
    </div>
  );
}
