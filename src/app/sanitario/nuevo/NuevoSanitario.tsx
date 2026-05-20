"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import * as XLSX from "xlsx";
import { crearSanitarioTrabajo } from "./actions";

type ProductoSanitario = { id: string; nombre: string; precio_por_unidad: number; unidad: string };
type LineaProducto = { productoId: string; dosis: string };

const TIPOS_EVENTO = ["Vacunación", "Desparasitación", "Tratamiento", "Revisión", "Cirugía", "Otro"];

function descargarTemplate(tipoEvento: string) {
  const wb = XLSX.utils.book_new();
  const wsDatos = XLSX.utils.aoa_to_sheet([["EID (Caravana)"], ["Ej: 982000123456789"]]);
  wsDatos["!cols"] = [{ wch: 24 }];
  XLSX.utils.book_append_sheet(wb, wsDatos, "Animales");
  const wsAyuda = XLSX.utils.aoa_to_sheet([
    [`Template: ${tipoEvento}`],
    [],
    ["REGLAS"],
    ["1. Una caravana (EID) por fila."],
    ["2. Eliminar la fila de ejemplo antes de importar."],
    ["3. El EID debe ser el número de caravana electrónica completo."],
    ["4. Los animales no encontrados en la base de datos serán ignorados."],
  ]);
  wsAyuda["!cols"] = [{ wch: 60 }];
  XLSX.utils.book_append_sheet(wb, wsAyuda, "Ayuda");
  XLSX.writeFile(wb, `template_sanitario_${tipoEvento.replace(/\s+/g, "_")}.xlsx`);
}

export default function NuevoSanitario({ productos }: { productos: ProductoSanitario[] }) {
  const router = useRouter();

  const [tipoEvento, setTipoEvento] = useState(TIPOS_EVENTO[0]);
  const [fecha, setFecha] = useState(new Date().toISOString().slice(0, 10));
  const [veterinario, setVeterinario] = useState("");
  const [descripcion, setDescripcion] = useState("");
  const [lineas, setLineas] = useState<LineaProducto[]>([{ productoId: "", dosis: "" }]);
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState("");

  function setLinea(i: number, campo: keyof LineaProducto, valor: string) {
    setLineas((prev) => prev.map((l, idx) => idx === i ? { ...l, [campo]: valor } : l));
  }

  function agregarLinea() {
    setLineas((prev) => [...prev, { productoId: "", dosis: "" }]);
  }

  function quitarLinea(i: number) {
    setLineas((prev) => prev.filter((_, idx) => idx !== i));
  }

  const costoTotal = lineas.reduce((sum, l) => {
    const prod = productos.find((p) => p.id === l.productoId);
    if (prod && l.dosis) return sum + prod.precio_por_unidad * parseFloat(l.dosis);
    return sum;
  }, 0);

  async function handleCrear() {
    if (!tipoEvento || !fecha) { setError("Completá los campos obligatorios."); return; }
    setError("");
    setGuardando(true);

    const lineasData = lineas.map((l) => {
      const prod = productos.find((p) => p.id === l.productoId) ?? null;
      return {
        producto: prod?.nombre ?? null,
        dosis: l.dosis ? parseFloat(l.dosis) : null,
        precio_unitario: prod?.precio_por_unidad ?? null,
        unidad: prod?.unidad ?? null,
      };
    });

    const res = await crearSanitarioTrabajo({
      tipo_evento: tipoEvento,
      veterinario: veterinario.trim() || null,
      descripcion: descripcion.trim() || null,
      fecha,
      lineas: lineasData,
    });

    if (!res.ok) { setError(res.error ?? "Error al crear."); setGuardando(false); return; }
    descargarTemplate(tipoEvento);
    router.push(`/sanitario/${res.id}`);
  }

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-xl border border-stone-200 shadow-sm p-6 space-y-5">
        <p className="font-medium text-stone-800">Datos del evento sanitario</p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-stone-700 mb-1">
              Tipo de evento <span className="text-red-500">*</span>
            </label>
            <select
              value={tipoEvento}
              onChange={(e) => setTipoEvento(e.target.value)}
              className="w-full border border-stone-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-300 bg-white"
            >
              {TIPOS_EVENTO.map((t) => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-stone-700 mb-1">
              Fecha del evento <span className="text-red-500">*</span>
            </label>
            <input
              type="date"
              value={fecha}
              onChange={(e) => setFecha(e.target.value)}
              className="w-full border border-stone-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-300"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-stone-700 mb-1">Veterinario</label>
            <input
              type="text"
              value={veterinario}
              onChange={(e) => setVeterinario(e.target.value)}
              placeholder="Nombre del veterinario"
              className="w-full border border-stone-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-300"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-stone-700 mb-1">Descripción / observación</label>
            <input
              type="text"
              value={descripcion}
              onChange={(e) => setDescripcion(e.target.value)}
              placeholder="Ej: Refuerzo anual"
              className="w-full border border-stone-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-300"
            />
          </div>
        </div>

        {/* Líneas de productos */}
        <div className="space-y-3">
          <p className="text-sm font-medium text-stone-700">Insumos veterinarios</p>
          {lineas.map((linea, i) => {
            const prod = productos.find((p) => p.id === linea.productoId) ?? null;
            const costo = prod && linea.dosis ? prod.precio_por_unidad * parseFloat(linea.dosis) : null;
            return (
              <div key={i} className="flex items-center gap-2 flex-wrap">
                <select
                  value={linea.productoId}
                  onChange={(e) => setLinea(i, "productoId", e.target.value)}
                  className="border border-stone-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-300 bg-white flex-1 min-w-48"
                >
                  <option value="">Sin producto</option>
                  {productos.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.nombre} (${Number(p.precio_por_unidad).toLocaleString("es-AR", { minimumFractionDigits: 2 })}/{p.unidad})
                    </option>
                  ))}
                </select>
                <div className="flex items-center gap-1">
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={linea.dosis}
                    onChange={(e) => setLinea(i, "dosis", e.target.value)}
                    placeholder="Dosis"
                    className="w-28 border border-stone-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-300"
                  />
                  {prod && <span className="text-xs text-stone-400 w-6">{prod.unidad}</span>}
                </div>
                {costo != null && (
                  <span className="text-sm text-green-700 font-medium">
                    ${costo.toLocaleString("es-AR", { minimumFractionDigits: 2 })}/animal
                  </span>
                )}
                {lineas.length > 1 && (
                  <button onClick={() => quitarLinea(i)} className="text-xs text-red-400 hover:text-red-600">✕</button>
                )}
              </div>
            );
          })}
          <button
            onClick={agregarLinea}
            className="text-sm text-green-700 hover:text-green-900 underline"
          >
            + Agregar insumo
          </button>
          {costoTotal > 0 && (
            <p className="text-sm text-stone-600">
              Costo total estimado por animal:{" "}
              <span className="font-semibold text-green-800">
                ${costoTotal.toLocaleString("es-AR", { minimumFractionDigits: 2 })}
              </span>
            </p>
          )}
        </div>
      </div>

      <div className="bg-stone-50 rounded-xl border border-stone-200 p-4 text-sm text-stone-600 space-y-1">
        <p className="font-medium text-stone-700">Próximo paso</p>
        <p>Al crear el evento se descarga un template Excel. Completalo con los EID de los animales y luego importalo — también podés pegar las caravanas directamente.</p>
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}

      <div className="flex gap-3">
        <button
          onClick={handleCrear}
          disabled={guardando || !tipoEvento || !fecha}
          className="px-5 py-2 bg-green-800 text-white rounded-lg text-sm hover:bg-green-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
        >
          {guardando ? "Creando..." : "Crear evento y descargar template"}
        </button>
        <a href="/sanitario" className="px-4 py-2 border border-stone-300 rounded-lg text-sm hover:bg-stone-50">
          Cancelar
        </a>
      </div>
    </div>
  );
}
