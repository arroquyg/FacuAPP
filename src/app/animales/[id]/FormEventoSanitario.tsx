"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { crearEventoSanitario } from "./actions";

type ProductoSanitario = { id: string; nombre: string; precio_por_unidad: number; unidad: string };

const TIPOS_EVENTO = [
  "Vacunación",
  "Desparasitación",
  "Tratamiento",
  "Revisión",
  "Cirugía",
  "Otro",
];

export default function FormEventoSanitario({
  animalId,
  productos,
}: {
  animalId: string;
  productos: ProductoSanitario[];
}) {
  const router = useRouter();
  const [abierto, setAbierto] = useState(false);
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const hoy = new Date().toISOString().slice(0, 10);

  const [fecha, setFecha] = useState(hoy);
  const [tipoEvento, setTipoEvento] = useState(TIPOS_EVENTO[0]);
  const [productoId, setProductoId] = useState("");
  const [dosis, setDosis] = useState("");
  const [veterinario, setVeterinario] = useState("");
  const [descripcion, setDescripcion] = useState("");

  const productoSeleccionado = productos.find((p) => p.id === productoId) ?? null;
  const unidad = productoSeleccionado?.unidad || "ml";
  const costoEstimado =
    productoSeleccionado && dosis
      ? productoSeleccionado.precio_por_unidad * parseFloat(dosis)
      : null;

  function resetForm() {
    setFecha(hoy);
    setTipoEvento(TIPOS_EVENTO[0]);
    setProductoId("");
    setDosis("");
    setVeterinario("");
    setDescripcion("");
    setError(null);
  }

  async function handleSubmit() {
    if (!fecha || !tipoEvento) return;
    setGuardando(true);
    setError(null);

    const res = await crearEventoSanitario({
      animal_id: animalId,
      tipo_evento: tipoEvento,
      fecha_evento: fecha,
      producto: productoSeleccionado?.nombre ?? null,
      dosis: dosis ? parseFloat(dosis) : null,
      precio_unitario: productoSeleccionado?.precio_por_unidad ?? null,
      unidad: productoSeleccionado ? unidad : null,
      veterinario: veterinario || null,
      descripcion: descripcion || null,
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

      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
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
            {TIPOS_EVENTO.map((t) => (
              <option key={t} value={t}>{t}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="text-xs text-stone-500 block mb-1">Producto</label>
          <select
            value={productoId}
            onChange={(e) => setProductoId(e.target.value)}
            className="w-full border border-stone-300 rounded-lg px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-300 bg-white"
          >
            <option value="">Sin producto</option>
            {productos.map((p) => (
              <option key={p.id} value={p.id}>{p.nombre}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="text-xs text-stone-500 block mb-1">
            Dosis ({productoSeleccionado ? unidad : "ud"})
            {productoSeleccionado && (
              <span className="ml-1 text-stone-400">
                — ${Number(productoSeleccionado.precio_por_unidad).toLocaleString("es-AR", { minimumFractionDigits: 2 })}/{unidad}
              </span>
            )}
          </label>
          <input
            type="number"
            min="0"
            step="0.01"
            value={dosis}
            onChange={(e) => setDosis(e.target.value)}
            placeholder="0"
            className="w-full border border-stone-300 rounded-lg px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-300"
          />
          {costoEstimado != null && (
            <p className="text-xs text-green-700 mt-0.5">
              Costo estimado: ${costoEstimado.toLocaleString("es-AR", { minimumFractionDigits: 2 })}
            </p>
          )}
        </div>

        <div>
          <label className="text-xs text-stone-500 block mb-1">Veterinario</label>
          <input
            type="text"
            value={veterinario}
            onChange={(e) => setVeterinario(e.target.value)}
            placeholder="Nombre del veterinario"
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

      <div className="flex gap-2">
        <button
          onClick={handleSubmit}
          disabled={guardando || !fecha || !tipoEvento}
          className="px-4 py-1.5 bg-green-800 text-white rounded-lg text-sm hover:bg-green-700 disabled:opacity-40"
        >
          {guardando ? "Guardando..." : "Guardar"}
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
