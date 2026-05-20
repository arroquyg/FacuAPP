"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { crearAnimal, actualizarAnimal } from "./actions";

type Lookup = { id: string; nombre: string };
type Campo = { id: string; nombre: string };

type Valores = {
  chip_id: string;
  sexo: string;
  categoria: string;
  raza: string;
  fecha_nacimiento: string;
  color_pelaje: string;
  genetica_empresa: string;
  valor_comercial: string;
  estado_sanitario: string;
  campo_actual_id: string;
  activo: boolean;
  vivo: boolean;
  fecha_muerte: string;
};

const valoresVacios: Valores = {
  chip_id: "",
  sexo: "",
  categoria: "",
  raza: "",
  fecha_nacimiento: "",
  color_pelaje: "",
  genetica_empresa: "",
  valor_comercial: "",
  estado_sanitario: "",
  campo_actual_id: "",
  activo: true,
  vivo: true,
  fecha_muerte: "",
};

function parsear(v: Valores) {
  const chip = v.chip_id.trim().toUpperCase();
  return {
    chip_id: chip,
    sexo: v.sexo,
    categoria: v.categoria,
    raza: v.raza,
    fecha_nacimiento: v.fecha_nacimiento || null,
    color_pelaje: v.color_pelaje.trim() || null,
    genetica_empresa: v.genetica_empresa.trim() || null,
    valor_comercial: v.valor_comercial ? parseFloat(v.valor_comercial) : null,
    estado_sanitario: v.estado_sanitario.trim() || null,
    campo_actual_id: v.campo_actual_id || null,
    activo: v.activo,
    vivo: v.vivo,
    fecha_muerte: v.vivo ? null : (v.fecha_muerte || null),
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
  const [chipError, setChipError] = useState<string | null>(null);
  const [confirmandoMuerte, setConfirmandoMuerte] = useState(false);
  const [fechaMuerteTmp, setFechaMuerteTmp] = useState("");

  function set(campo: keyof Valores, valor: string | boolean) {
    setValores((v) => ({ ...v, [campo]: valor }));
  }

  function handleChipChange(raw: string) {
    const valor = raw.toUpperCase().replace(/\s/g, "");
    set("chip_id", valor);
    if (valor && !/^[A-Z0-9-]+$/.test(valor)) {
      setChipError("Solo letras, números y guiones. Sin espacios ni símbolos.");
    } else {
      setChipError(null);
    }
  }

  const camposRequeridos =
    valores.chip_id.trim() &&
    !chipError &&
    valores.sexo &&
    valores.categoria &&
    valores.raza &&
    !confirmandoMuerte &&
    (valores.vivo || valores.fecha_muerte);

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
    <div className="bg-white rounded-xl border border-stone-200 p-6 space-y-6">
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg px-4 py-3 text-sm text-red-600">
          {error}
        </div>
      )}

      {/* Identificación */}
      <section className="space-y-3">
        <h3 className="text-xs font-semibold text-stone-400 uppercase tracking-wide">
          Identificación
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <div>
            <label className="block text-xs text-stone-500 mb-1">Caravana *</label>
            <input
              value={valores.chip_id}
              onChange={(e) => handleChipChange(e.target.value)}
              placeholder="Ej: ARG000123456789"
              className={`w-full border rounded-lg px-3 py-2 text-sm font-mono focus:outline-none focus:ring-2 ${
                chipError
                  ? "border-red-400 focus:ring-red-200"
                  : "border-stone-300 focus:ring-green-300"
              }`}
            />
            {chipError ? (
              <p className="text-xs text-red-500 mt-1">{chipError}</p>
            ) : (
              <p className="text-xs text-stone-400 mt-1">Letras y números, se guarda en mayúsculas</p>
            )}
          </div>
          <div>
            <label className="block text-xs text-stone-500 mb-1">Campo actual</label>
            <select
              value={valores.campo_actual_id}
              onChange={(e) => set("campo_actual_id", e.target.value)}
              className="w-full border border-stone-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-300"
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
        <h3 className="text-xs font-semibold text-stone-400 uppercase tracking-wide">
          Características
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <div>
            <label className="block text-xs text-stone-500 mb-1">Sexo *</label>
            <select
              value={valores.sexo}
              onChange={(e) => set("sexo", e.target.value)}
              className="w-full border border-stone-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-300"
            >
              <option value="">Seleccionar</option>
              <option value="macho">Macho</option>
              <option value="hembra">Hembra</option>
            </select>
          </div>
          <div>
            <label className="block text-xs text-stone-500 mb-1">Categoría *</label>
            <select
              value={valores.categoria}
              onChange={(e) => set("categoria", e.target.value)}
              className="w-full border border-stone-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-300"
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
            <label className="block text-xs text-stone-500 mb-1">Raza *</label>
            <select
              value={valores.raza}
              onChange={(e) => set("raza", e.target.value)}
              className="w-full border border-stone-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-300"
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
            <label className="block text-xs text-stone-500 mb-1">Color / pelaje</label>
            <input
              value={valores.color_pelaje}
              onChange={(e) => set("color_pelaje", e.target.value)}
              className="w-full border border-stone-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-300"
            />
          </div>
          <div>
            <label className="block text-xs text-stone-500 mb-1">Fecha de nacimiento</label>
            <input
              type="date"
              value={valores.fecha_nacimiento}
              onChange={(e) => set("fecha_nacimiento", e.target.value)}
              className="w-full border border-stone-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-300"
            />
          </div>
          <div>
            <label className="block text-xs text-stone-500 mb-1">Estado sanitario</label>
            <input
              value={valores.estado_sanitario}
              onChange={(e) => set("estado_sanitario", e.target.value)}
              placeholder="Ej: Al día"
              className="w-full border border-stone-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-300"
            />
          </div>
        </div>
      </section>

      {/* Datos comerciales */}
      <section className="space-y-3">
        <h3 className="text-xs font-semibold text-stone-400 uppercase tracking-wide">
          Datos comerciales
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <div>
            <label className="block text-xs text-stone-500 mb-1">Genética/Empresa</label>
            <input
              value={valores.genetica_empresa}
              onChange={(e) => set("genetica_empresa", e.target.value)}
              className="w-full border border-stone-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-300"
            />
          </div>
          <div>
            <label className="block text-xs text-stone-500 mb-1">Valor comercial ($)</label>
            <input
              type="number"
              min="0"
              step="0.01"
              value={valores.valor_comercial}
              onChange={(e) => set("valor_comercial", e.target.value)}
              className="w-full border border-stone-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-300"
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
                  className="w-4 h-4 rounded border-stone-300"
                />
                <label htmlFor="activo" className="text-sm text-stone-700">
                  Animal activo (pertenece a la empresa)
                </label>
              </div>
              <div className="flex items-center gap-3">
                <input
                  id="vivo"
                  type="checkbox"
                  checked={valores.vivo && !confirmandoMuerte}
                  onChange={(e) => {
                    if (!e.target.checked && valores.vivo) {
                      setFechaMuerteTmp("");
                      setConfirmandoMuerte(true);
                    } else if (e.target.checked) {
                      set("vivo", true);
                      set("fecha_muerte", "");
                      setConfirmandoMuerte(false);
                    }
                  }}
                  className="w-4 h-4 rounded border-stone-300"
                />
                <label htmlFor="vivo" className="text-sm text-stone-700">
                  Animal vivo
                </label>
              </div>
              {confirmandoMuerte && (
                <div className="rounded-lg border border-red-200 bg-red-50 p-3 space-y-2">
                  <p className="text-xs font-medium text-red-700">Registrar como muerto</p>
                  <div className="space-y-1">
                    <label className="block text-xs text-stone-500">Fecha de muerte *</label>
                    <input
                      type="date"
                      value={fechaMuerteTmp}
                      onChange={(e) => setFechaMuerteTmp(e.target.value)}
                      className="w-full border border-red-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-200 bg-white"
                    />
                  </div>
                  <div className="flex gap-2 pt-1">
                    <button
                      type="button"
                      disabled={!fechaMuerteTmp}
                      onClick={() => {
                        set("vivo", false);
                        set("fecha_muerte", fechaMuerteTmp);
                        setConfirmandoMuerte(false);
                      }}
                      className="px-3 py-1.5 bg-red-600 text-white rounded-lg text-xs hover:bg-red-700 disabled:opacity-40 disabled:cursor-not-allowed"
                    >
                      Confirmar
                    </button>
                    <button
                      type="button"
                      onClick={() => setConfirmandoMuerte(false)}
                      className="px-3 py-1.5 border border-stone-300 rounded-lg text-xs hover:bg-stone-50"
                    >
                      Cancelar
                    </button>
                  </div>
                </div>
              )}
              {!valores.vivo && !confirmandoMuerte && (
                <p className="text-xs text-red-500">
                  Registrado como muerto el {valores.fecha_muerte || "—"}.
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
          className="px-5 py-2 bg-green-800 text-white rounded-lg text-sm hover:bg-green-700 disabled:opacity-40 disabled:cursor-not-allowed"
        >
          {guardando ? "Guardando..." : modo === "nuevo" ? "Registrar animal" : "Guardar cambios"}
        </button>
        <button
          onClick={() => router.back()}
          className="px-5 py-2 border border-stone-300 rounded-lg text-sm hover:bg-stone-50"
        >
          Cancelar
        </button>
      </div>
    </div>
  );
}
