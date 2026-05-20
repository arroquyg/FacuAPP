"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { crearEventosSanitarios } from "./actions";

type ProductoSanitario = { id: string; nombre: string; precio_por_unidad: number; unidad: string };
type Linea = { productoId: string; dosis: string };

const TIPOS_EVENTO = ["Vacunación", "Desparasitación", "Tratamiento", "Revisión", "Cirugía", "Otro"];

export default function FormEventoSanitario({
  animalId,
  productos,
}: {
  animalId: string;
  productos: ProductoSanitario[];
}) {
  const router = useRouter();
  const hoy = new Date().toISOString().slice(0, 10);

  const [abierto, setAbierto] = useState(false);
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fecha, setFecha] = useState(hoy);
  const [tipoEvento, setTipoEvento] = useState(TIPOS_EVENTO[0]);
  const [veterinario, setVeterinario] = useState("");
  const [descripcion, setDescripcion] = useState("");
  const [lineas, setLineas] = useState<Linea[]>([{ productoId: "", dosis: "" }]);

  function resetForm() {
    setFecha(hoy);
    setTipoEvento(TIPOS_EVENTO[0]);
    setVeterinario("");
    setDescripcion("");
    setLineas([{ productoId: "", dosis: "" }]);
    setError(null);
  }

  function setLinea(i: number, campo: keyof Linea, valor: string) {
    setLineas((prev) => prev.map((l, idx) => idx === i ? { ...l, [campo]: valor } : l));
  }

  function agregarLinea() {
    setLineas((prev) => [...prev, { productoId: "", dosis: "" }]);
  }

  function quitarLinea(i: number) {
    setLineas((prev) => prev.filter((_, idx) => idx !== i));
  }

  async function handleSubmit() {
    if (!fecha || !tipoEvento) return;
    setGuardando(true);
    setError(null);

    const lineasData = lineas.map((l) => {
      const prod = productos.find((p) => p.id === l.productoId) ?? null;
      return {
        producto: prod?.nombre ?? null,
        dosis: l.dosis ? parseFloat(l.dosis) : null,
        precio_unitario: prod?.precio_por_unidad ?? null,
        unidad: prod?.unidad ?? null,
      };
    });

    const res = await crearEventosSanitarios({
      animal_id: animalId,
      tipo_evento: tipoEvento,
      fecha_evento: fecha,
      veterinario: veterinario || null,
      descripcion: descripcion || null,
      lineas: lineasData,
    });

    if (res.ok) {
      resetForm();
      setAbierto(false);
      router.refresh();
    } else {
      setError(res.error ?? "Error al guardar");
    }
    setGuardando(false);
  }

  if (!abierto) {
    return (
      <button
        onClick={() => setAbierto(true)}
        className="px-3 py-1.5 border border-dashed border-stone-300 rounded-lg text-xs text-stone-500 hover:border-stone-400 hover:text-stone-700 transition-colors"
      >
        + Agregar evento
      </button>
    );
  }

  return (
    <div className="border border-stone-200 rounded-xl p-4 bg-stone-50 space-y-3">
      <p className="text-sm font-medium text-stone-700">Nuevo evento sanitario</p>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded px-3 py-1.5 text-xs text-red-600">{error}</div>
      )}

      {/* Campos generales */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div>
          <label className="text-xs text-stone-500 block mb-1">Fecha *</label>
          <input
            type="date"
            value={fecha}
            onChange={(e) => setFecha(e.target.value)}
            className="w-full border border-stone-300 rounded-lg px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-300"
          />
        </div>
        <div>
          <label className="text-xs text-stone-500 block mb-1">Tipo de evento *</label>
          <select
            value={tipoEvento}
            onChange={(e) => setTipoEvento(e.target.value)}
            className="w-full border border-stone-300 rounded-lg px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-300 bg-white"
          >
            {TIPOS_EVENTO.map((t) => <option key={t} value={t}>{t}</option>)}
          </select>
        </div>
        <div>
          <label className="text-xs text-stone-500 block mb-1">Veterinario</label>
          <input
            type="text"
            value={veterinario}
            onChange={(e) => setVeterinario(e.target.value)}
            placeholder="Nombre"
            className="w-full border border-stone-300 rounded-lg px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-300"
          />
        </div>
        <div>
          <label className="text-xs text-stone-500 block mb-1">Descripción</label>
          <input
            type="text"
            value={descripcion}
            onChange={(e) => setDescripcion(e.target.value)}
            placeholder="Observaciones..."
            className="w-full border border-stone-300 rounded-lg px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-300"
          />
        </div>
      </div>

      {/* Líneas de productos */}
      <div className="space-y-2">
        <p className="text-xs text-stone-500 font-medium">Insumos veterinarios aplicados</p>
        {lineas.map((linea, i) => {
          const prod = productos.find((p) => p.id === linea.productoId) ?? null;
          const costo = prod && linea.dosis ? prod.precio_por_unidad * parseFloat(linea.dosis) : null;
          return (
            <div key={i} className="flex items-center gap-2 flex-wrap">
              <select
                value={linea.productoId}
                onChange={(e) => setLinea(i, "productoId", e.target.value)}
                className="border border-stone-300 rounded-lg px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-300 bg-white flex-1 min-w-40"
              >
                <option value="">Sin producto</option>
                {productos.map((p) => (
                  <option key={p.id} value={p.id}>{p.nombre}</option>
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
                  className="w-24 border border-stone-300 rounded-lg px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-300"
                />
                {prod && <span className="text-xs text-stone-400">{prod.unidad}</span>}
              </div>
              {costo != null && (
                <span className="text-xs text-green-700">
                  ${costo.toLocaleString("es-AR", { minimumFractionDigits: 2 })}
                </span>
              )}
              {lineas.length > 1 && (
                <button
                  onClick={() => quitarLinea(i)}
                  className="text-xs text-red-400 hover:text-red-600"
                >
                  ✕
                </button>
              )}
            </div>
          );
        })}
        <button
          onClick={agregarLinea}
          className="text-xs text-green-700 hover:text-green-900 underline"
        >
          + Agregar insumo
        </button>
      </div>

      <div className="flex gap-2">
        <button
          onClick={handleSubmit}
          disabled={guardando || !fecha || !tipoEvento}
          className="px-4 py-1.5 bg-green-800 text-white rounded-lg text-sm hover:bg-green-700 disabled:opacity-40"
        >
          {guardando ? "Guardando..." : `Guardar${lineas.length > 1 ? ` (${lineas.length} insumos)` : ""}`}
        </button>
        <button
          onClick={() => { resetForm(); setAbierto(false); }}
          className="px-4 py-1.5 border border-stone-300 rounded-lg text-sm hover:bg-stone-100"
        >
          Cancelar
        </button>
      </div>
    </div>
  );
}
