"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { actualizarCampo, crearCampo, toggleActivo } from "./actions";

type Campo = {
  id: string;
  nombre: string;
  superficie_ha: number | null;
  capacidad_max: number | null;
  tipo_pasto: string | null;
  activo: boolean;
};

type FormData = {
  nombre: string;
  superficie_ha: string;
  capacidad_max: string;
  tipo_pasto: string;
};

const formVacio: FormData = { nombre: "", superficie_ha: "", capacidad_max: "", tipo_pasto: "" };

function campoToForm(c: Campo): FormData {
  return {
    nombre: c.nombre,
    superficie_ha: c.superficie_ha?.toString() ?? "",
    capacidad_max: c.capacidad_max?.toString() ?? "",
    tipo_pasto: c.tipo_pasto ?? "",
  };
}

export default function CamposConfig({ campos }: { campos: Campo[] }) {
  const router = useRouter();
  const [mostrarNuevo, setMostrarNuevo] = useState(false);
  const [formNuevo, setFormNuevo] = useState<FormData>(formVacio);
  const [editandoId, setEditandoId] = useState<string | null>(null);
  const [formEdit, setFormEdit] = useState<FormData>(formVacio);
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function parsear(f: FormData) {
    return {
      nombre: f.nombre,
      superficie_ha: f.superficie_ha ? parseFloat(f.superficie_ha) : null,
      capacidad_max: f.capacidad_max ? parseInt(f.capacidad_max) : null,
      tipo_pasto: f.tipo_pasto || null,
    };
  }

  async function handleCrear() {
    if (!formNuevo.nombre.trim()) return;
    setGuardando(true);
    setError(null);
    const res = await crearCampo(parsear(formNuevo));
    if (res.ok) {
      setFormNuevo(formVacio);
      setMostrarNuevo(false);
      router.refresh();
    } else {
      setError(res.error ?? "Error al crear campo");
    }
    setGuardando(false);
  }

  async function handleActualizar(id: string) {
    if (!formEdit.nombre.trim()) return;
    setGuardando(true);
    setError(null);
    const res = await actualizarCampo(id, parsear(formEdit));
    if (res.ok) {
      setEditandoId(null);
      router.refresh();
    } else {
      setError(res.error ?? "Error al actualizar campo");
    }
    setGuardando(false);
  }

  async function handleToggle(id: string, activo: boolean) {
    setGuardando(true);
    await toggleActivo("campos", id, !activo);
    router.refresh();
    setGuardando(false);
  }

  function iniciarEdicion(c: Campo) {
    setEditandoId(c.id);
    setFormEdit(campoToForm(c));
    setMostrarNuevo(false);
  }

  return (
    <div className="space-y-4">
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg px-4 py-2 text-sm text-red-600">
          {error}
        </div>
      )}

      {/* Formulario nuevo campo */}
      {mostrarNuevo ? (
        <div className="bg-gray-50 border border-gray-200 rounded-xl p-4 space-y-3">
          <p className="text-sm font-medium text-gray-700">Nuevo campo</p>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="col-span-2 sm:col-span-1">
              <label className="text-xs text-gray-500">Nombre *</label>
              <input
                autoFocus
                value={formNuevo.nombre}
                onChange={(e) => setFormNuevo((f) => ({ ...f, nombre: e.target.value }))}
                className="mt-0.5 w-full border border-gray-300 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-gray-300"
              />
            </div>
            <div>
              <label className="text-xs text-gray-500">Superficie (ha)</label>
              <input
                type="number"
                value={formNuevo.superficie_ha}
                onChange={(e) => setFormNuevo((f) => ({ ...f, superficie_ha: e.target.value }))}
                className="mt-0.5 w-full border border-gray-300 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-gray-300"
              />
            </div>
            <div>
              <label className="text-xs text-gray-500">Cap. máx. animales</label>
              <input
                type="number"
                value={formNuevo.capacidad_max}
                onChange={(e) => setFormNuevo((f) => ({ ...f, capacidad_max: e.target.value }))}
                className="mt-0.5 w-full border border-gray-300 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-gray-300"
              />
            </div>
            <div>
              <label className="text-xs text-gray-500">Tipo de pasto</label>
              <input
                value={formNuevo.tipo_pasto}
                onChange={(e) => setFormNuevo((f) => ({ ...f, tipo_pasto: e.target.value }))}
                className="mt-0.5 w-full border border-gray-300 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-gray-300"
              />
            </div>
          </div>
          <div className="flex gap-2">
            <button
              onClick={handleCrear}
              disabled={guardando || !formNuevo.nombre.trim()}
              className="px-3 py-1.5 bg-green-800 text-white rounded-lg text-sm hover:bg-green-700 disabled:opacity-40"
            >
              {guardando ? "Guardando..." : "Guardar"}
            </button>
            <button
              onClick={() => { setMostrarNuevo(false); setFormNuevo(formVacio); }}
              className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm hover:bg-gray-50"
            >
              Cancelar
            </button>
          </div>
        </div>
      ) : (
        <button
          onClick={() => { setMostrarNuevo(true); setEditandoId(null); }}
          className="px-4 py-2 border border-dashed border-gray-300 rounded-xl text-sm text-gray-500 hover:border-gray-400 hover:text-gray-700 w-full text-center"
        >
          + Agregar campo
        </button>
      )}

      {/* Lista */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        {campos.length === 0 ? (
          <p className="px-4 py-8 text-center text-sm text-gray-400">
            No hay campos configurados aún
          </p>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-xs text-gray-500 uppercase">
              <tr>
                <th className="px-4 py-3 text-left">Nombre</th>
                <th className="px-4 py-3 text-left">Superficie</th>
                <th className="px-4 py-3 text-left">Cap. máx.</th>
                <th className="px-4 py-3 text-left">Tipo de pasto</th>
                <th className="px-4 py-3 text-left">Estado</th>
                <th className="px-4 py-3 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {campos.map((c) =>
                editandoId === c.id ? (
                  <tr key={c.id} className="bg-blue-50">
                    <td className="px-4 py-2">
                      <input
                        autoFocus
                        value={formEdit.nombre}
                        onChange={(e) => setFormEdit((f) => ({ ...f, nombre: e.target.value }))}
                        className="w-full border border-gray-300 rounded px-2 py-1 text-sm focus:outline-none focus:ring-1 focus:ring-gray-300"
                      />
                    </td>
                    <td className="px-4 py-2">
                      <input
                        type="number"
                        value={formEdit.superficie_ha}
                        onChange={(e) => setFormEdit((f) => ({ ...f, superficie_ha: e.target.value }))}
                        className="w-24 border border-gray-300 rounded px-2 py-1 text-sm focus:outline-none"
                      />
                    </td>
                    <td className="px-4 py-2">
                      <input
                        type="number"
                        value={formEdit.capacidad_max}
                        onChange={(e) => setFormEdit((f) => ({ ...f, capacidad_max: e.target.value }))}
                        className="w-24 border border-gray-300 rounded px-2 py-1 text-sm focus:outline-none"
                      />
                    </td>
                    <td className="px-4 py-2">
                      <input
                        value={formEdit.tipo_pasto}
                        onChange={(e) => setFormEdit((f) => ({ ...f, tipo_pasto: e.target.value }))}
                        className="w-full border border-gray-300 rounded px-2 py-1 text-sm focus:outline-none"
                      />
                    </td>
                    <td colSpan={2} className="px-4 py-2">
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleActualizar(c.id)}
                          disabled={guardando}
                          className="px-3 py-1 bg-green-800 text-white rounded text-xs hover:bg-green-700 disabled:opacity-40"
                        >
                          {guardando ? "..." : "Guardar"}
                        </button>
                        <button
                          onClick={() => setEditandoId(null)}
                          className="px-3 py-1 border border-gray-300 rounded text-xs hover:bg-gray-50"
                        >
                          Cancelar
                        </button>
                      </div>
                    </td>
                  </tr>
                ) : (
                  <tr key={c.id} className={`hover:bg-gray-50 ${!c.activo ? "opacity-50" : ""}`}>
                    <td className="px-4 py-3 font-medium text-gray-800">{c.nombre}</td>
                    <td className="px-4 py-3 text-gray-500">
                      {c.superficie_ha ? `${c.superficie_ha} ha` : "—"}
                    </td>
                    <td className="px-4 py-3 text-gray-500">{c.capacidad_max ?? "—"}</td>
                    <td className="px-4 py-3 text-gray-500">{c.tipo_pasto ?? "—"}</td>
                    <td className="px-4 py-3">
                      <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${c.activo ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"}`}>
                        {c.activo ? "Activo" : "Inactivo"}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex gap-2 justify-end">
                        <button
                          onClick={() => iniciarEdicion(c)}
                          className="text-xs text-gray-500 hover:text-gray-800 underline"
                        >
                          Editar
                        </button>
                        <button
                          onClick={() => handleToggle(c.id, c.activo)}
                          disabled={guardando}
                          className="text-xs text-gray-500 hover:text-gray-800 underline disabled:opacity-40"
                        >
                          {c.activo ? "Desactivar" : "Activar"}
                        </button>
                      </div>
                    </td>
                  </tr>
                )
              )}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
