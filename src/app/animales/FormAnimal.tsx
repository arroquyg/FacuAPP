"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { crearAnimal, actualizarAnimal } from "./actions";

type Lookup = { id: string; nombre: string };
type Campo = { id: string; nombre: string };

type Valores = {
  chip_id: string;
  numero_caravana: string;
  sexo: string;
  categoria: string;
  raza: string;
  fecha_nacimiento: string;
  color_pelaje: string;
  procedencia: string;
  valor_comercial: string;
  estado_sanitario: string;
  campo_actual_id: string;
  activo: boolean;
  vivo: boolean;
};

const valoresVacios: Valores = {
  chip_id: "",
  numero_caravana: "",
  sexo: "",
  categoria: "",
  raza: "",
  fecha_nacimiento: "",
  color_pelaje: "",
  procedencia: "",
  valor_comercial: "",
  estado_sanitario: "",
  campo_actual_id: "",
  activo: true,
  vivo: true,
};

function parsear(v: Valores) {
  return {
    chip_id: v.chip_id.trim(),
    numero_caravana: v.numero_caravana.trim(),
    sexo: v.sexo,
    categoria: v.categoria,
    raza: v.raza,
    fecha_nacimiento: v.fecha_nacimiento || null,
    color_pelaje: v.color_pelaje.trim() || null,
    procedencia: v.procedencia.trim() || null,
    valor_comercial: v.valor_comercial ? parseFloat(v.valor_comercial) : null,
    estado_sanitario: v.estado_sanitario.trim() || null,
    campo_actual_id: v.campo_actual_id || null,
    activo: v.activo,
    vivo: v.vivo,
  };
}

type Props = {
  modo: "nuevo" | "editar";
  animalId?: string;
  inicial?: Partial<Valores>;
  categorias: Lookup[];
  razas: Lookup[];
  campos: Campo[];
};

export default function FormAnimal({
  modo,
  animalId,
  inicial,
  categorias,
  razas,
  campos,
}: Props) {
  const router = useRouter();
  const [valores, setValores] = useState<Valores>({ ...valoresVacios, ...inicial });
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function set(campo: keyof Valores, valor: string | boolean) {
    setValores((v) => ({ ...v, [campo]: valor }));
  }

  const camposRequeridos =
    valores.chip_id.trim() &&
    valores.numero_caravana.trim() &&
    valores.sexo &&
    valores.categoria &&
    valores.raza;

  async function handleSubmit() {
    if (!camposRequeridos) return;
    setGuardando(true);
    setError(null);

    const data = parsear(valores);
    const res =
      modo === "nuevo"
        ? await crearAnimal(data)
        : await actualizarAnimal(animalId!, data);

    if (res.ok) {
      const destino =
        modo === "nuevo" && "id" in res ? `/animales/${res.id}` : `/animales/${animalId}`;
      router.push(destino);
      router.refresh();
    } else {
      setError(res.error ?? "Error al guardar");
      setGuardando(false);
    }
  }

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-6">
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg px-4 py-3 text-sm text-red-600">
          {error}
        </div>
      )}

      {/* Identificación */}
      <section className="space-y-3">
        <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wide">
          Identificación
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <div>
            <label className="block text-xs text-gray-500 mb-1">Chip ID *</label>
            <input
              value={valores.chip_id}
              onChange={(e) => set("chip_id", e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-300 font-mono"
            />
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1">Número de caravana *</label>
            <input
              value={valores.numero_caravana}
              onChange={(e) => set("numero_caravana", e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-300"
            />
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1">Campo actual</label>
            <select
              value={valores.campo_actual_id}
              onChange={(e) => set("campo_actual_id", e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-300"
            >
              <option value="">Sin campo asignado</option>
              {campos.map((c) => (
                <option key={c.id} value={c.id}>{c.nombre}</option>
              ))}
            </select>
          </div>
        </div>
      </section>

      {/* Características */}
      <section className="space-y-3">
        <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wide">
          Características
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <div>
            <label className="block text-xs text-gray-500 mb-1">Sexo *</label>
            <select
              value={valores.sexo}
              onChange={(e) => set("sexo", e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-300"
            >
              <option value="">Seleccionar</option>
              <option value="macho">Macho</option>
              <option value="hembra">Hembra</option>
            </select>
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1">Categoría *</label>
            <select
              value={valores.categoria}
              onChange={(e) => set("categoria", e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-300"
            >
              <option value="">Seleccionar</option>
              {categorias.map((c) => (
                <option key={c.id} value={c.nombre}>{c.nombre}</option>
              ))}
            </select>
            {categorias.length === 0 && (
              <p className="text-xs text-amber-500 mt-1">
                No hay categorías — agregá desde{" "}
                <a href="/configuracion?tab=categorias" className="underline">Configuración</a>.
              </p>
            )}
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1">Raza *</label>
            <select
              value={valores.raza}
              onChange={(e) => set("raza", e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-300"
            >
              <option value="">Seleccionar</option>
              {razas.map((r) => (
                <option key={r.id} value={r.nombre}>{r.nombre}</option>
              ))}
            </select>
            {razas.length === 0 && (
              <p className="text-xs text-amber-500 mt-1">
                No hay razas — agregá desde{" "}
                <a href="/configuracion?tab=razas" className="underline">Configuración</a>.
              </p>
            )}
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1">Color / pelaje</label>
            <input
              value={valores.color_pelaje}
              onChange={(e) => set("color_pelaje", e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-300"
            />
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1">Fecha de nacimiento</label>
            <input
              type="date"
              value={valores.fecha_nacimiento}
              onChange={(e) => set("fecha_nacimiento", e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-300"
            />
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1">Estado sanitario</label>
            <input
              value={valores.estado_sanitario}
              onChange={(e) => set("estado_sanitario", e.target.value)}
              placeholder="Ej: Al día"
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-300"
            />
          </div>
        </div>
      </section>

      {/* Datos comerciales */}
      <section className="space-y-3">
        <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wide">
          Datos comerciales
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <div>
            <label className="block text-xs text-gray-500 mb-1">Procedencia</label>
            <input
              value={valores.procedencia}
              onChange={(e) => set("procedencia", e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-300"
            />
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1">Valor comercial ($)</label>
            <input
              type="number"
              min="0"
              step="0.01"
              value={valores.valor_comercial}
              onChange={(e) => set("valor_comercial", e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-300"
            />
          </div>
          {modo === "editar" && (
            <div className="flex flex-col gap-3 pt-5">
              <div className="flex items-center gap-3">
                <input
                  id="activo"
                  type="checkbox"
                  checked={valores.activo}
                  onChange={(e) => set("activo", e.target.checked)}
                  className="w-4 h-4 rounded border-gray-300"
                />
                <label htmlFor="activo" className="text-sm text-gray-700">
                  Animal activo (pertenece a la empresa)
                </label>
              </div>
              <div className="flex items-center gap-3">
                <input
                  id="vivo"
                  type="checkbox"
                  checked={valores.vivo}
                  onChange={(e) => set("vivo", e.target.checked)}
                  className="w-4 h-4 rounded border-gray-300"
                />
                <label htmlFor="vivo" className="text-sm text-gray-700">
                  Animal vivo
                </label>
              </div>
              {!valores.vivo && (
                <p className="text-xs text-red-500">
                  Al desmarcar &quot;Animal vivo&quot; el animal quedará registrado como muerto.
                </p>
              )}
            </div>
          )}
        </div>
      </section>

      {/* Acciones */}
      <div className="flex gap-3 pt-2">
        <button
          onClick={handleSubmit}
          disabled={guardando || !camposRequeridos}
          className="px-5 py-2 bg-gray-800 text-white rounded-lg text-sm hover:bg-gray-700 disabled:opacity-40 disabled:cursor-not-allowed"
        >
          {guardando ? "Guardando..." : modo === "nuevo" ? "Registrar animal" : "Guardar cambios"}
        </button>
        <button
          onClick={() => router.back()}
          className="px-5 py-2 border border-gray-300 rounded-lg text-sm hover:bg-gray-50"
        >
          Cancelar
        </button>
      </div>
    </div>
  );
}
