"use client";

import { useState } from "react";
import { aceptarTransferencia, denegarTransferencia, crearCampoParaTransferencia } from "./actions";

type Campo = { id: string; nombre: string };
type Transferencia = {
  id: string;
  estado: string;
  precio_total: number | null;
  creado_en: string;
  animal: { id: string; chip_id: string; numero_caravana: string | null; categoria: string | null; raza: string | null } | null;
  empresa_origen: { nombre: string } | null;
};

function formatPeso(n: number) {
  return n.toLocaleString("es-AR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}
function formatDate(str: string) {
  return new Date(str).toLocaleDateString("es-AR", { day: "2-digit", month: "2-digit", year: "numeric" });
}

function ModalCampo({
  campos: camposIniciales,
  onConfirmar,
  onCancelar,
}: {
  campos: Campo[];
  onConfirmar: (campoId: string | null) => void;
  onCancelar: () => void;
}) {
  const [campos, setCampos] = useState<Campo[]>(camposIniciales);
  const [campoId, setCampoId] = useState<string>("sin-campo");
  const [creando, setCreando] = useState(false);
  const [nombreNuevo, setNombreNuevo] = useState("");
  const [guardandoCampo, setGuardandoCampo] = useState(false);
  const [errorCampo, setErrorCampo] = useState<string | null>(null);

  async function handleCrearCampo() {
    if (!nombreNuevo.trim()) return;
    setGuardandoCampo(true);
    setErrorCampo(null);
    const res = await crearCampoParaTransferencia(nombreNuevo.trim());
    if (!res.ok) {
      setErrorCampo(res.error ?? "Error al crear campo");
    } else {
      const nuevo = { id: res.id!, nombre: nombreNuevo.trim() };
      setCampos((prev) => [...prev, nuevo]);
      setCampoId(nuevo.id);
      setCreando(false);
      setNombreNuevo("");
    }
    setGuardandoCampo(false);
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-md p-6 space-y-4">
        <h3 className="font-semibold text-stone-800 text-lg">¿En qué campo asignás este animal?</h3>

        <div className="space-y-2 max-h-52 overflow-y-auto">
          <label className={`flex items-center gap-3 px-3 py-2 rounded-lg cursor-pointer border transition-colors ${campoId === "sin-campo" ? "border-green-300 bg-green-50" : "border-stone-200 hover:bg-stone-50"}`}>
            <input type="radio" name="campo" value="sin-campo" checked={campoId === "sin-campo"} onChange={() => setCampoId("sin-campo")} className="accent-green-700" />
            <span className="text-sm text-stone-500 italic">Sin campo asignado por ahora</span>
          </label>
          {campos.map((c) => (
            <label key={c.id} className={`flex items-center gap-3 px-3 py-2 rounded-lg cursor-pointer border transition-colors ${campoId === c.id ? "border-green-300 bg-green-50" : "border-stone-200 hover:bg-stone-50"}`}>
              <input type="radio" name="campo" value={c.id} checked={campoId === c.id} onChange={() => setCampoId(c.id)} className="accent-green-700" />
              <span className="text-sm font-medium text-stone-700">{c.nombre}</span>
            </label>
          ))}
        </div>

        {/* Crear nuevo campo */}
        {!creando ? (
          <button
            type="button"
            onClick={() => setCreando(true)}
            className="text-sm text-green-700 hover:underline font-medium"
          >
            + Crear nuevo campo
          </button>
        ) : (
          <div className="space-y-2 border border-stone-200 rounded-lg p-3 bg-stone-50">
            <p className="text-xs font-medium text-stone-600">Nombre del nuevo campo</p>
            <div className="flex gap-2">
              <input
                type="text"
                value={nombreNuevo}
                onChange={(e) => setNombreNuevo(e.target.value)}
                placeholder="Ej: Potrero Norte"
                className="flex-1 border border-stone-300 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-300"
                autoFocus
              />
              <button
                type="button"
                onClick={handleCrearCampo}
                disabled={guardandoCampo || !nombreNuevo.trim()}
                className="px-3 py-1.5 bg-green-700 text-white rounded-lg text-sm hover:bg-green-600 disabled:opacity-50"
              >
                {guardandoCampo ? "..." : "Crear"}
              </button>
              <button type="button" onClick={() => { setCreando(false); setNombreNuevo(""); }} className="px-3 py-1.5 border border-stone-300 rounded-lg text-sm hover:bg-stone-100">
                Cancelar
              </button>
            </div>
            {errorCampo && <p className="text-xs text-red-600">{errorCampo}</p>}
          </div>
        )}

        <div className="flex gap-3 pt-2 border-t border-stone-100">
          <button
            onClick={() => onConfirmar(campoId === "sin-campo" ? null : campoId)}
            className="flex-1 px-4 py-2 bg-green-700 text-white rounded-lg text-sm font-medium hover:bg-green-600"
          >
            Confirmar aceptación
          </button>
          <button
            onClick={onCancelar}
            className="px-4 py-2 border border-stone-300 rounded-lg text-sm hover:bg-stone-50"
          >
            Cancelar
          </button>
        </div>
      </div>
    </div>
  );
}

export default function TransferenciasEntrantes({
  transferencias,
  campos,
}: {
  transferencias: Transferencia[];
  campos: Campo[];
}) {
  const [procesando, setProcesando] = useState<string | null>(null);
  const [errores, setErrores] = useState<Record<string, string>>({});
  const [modalAceptar, setModalAceptar] = useState<string | null>(null);

  async function handleAceptar(id: string, campoId: string | null) {
    setModalAceptar(null);
    setProcesando(id);
    const res = await aceptarTransferencia(id, campoId);
    if (!res.ok) setErrores((prev) => ({ ...prev, [id]: res.error ?? "Error" }));
    setProcesando(null);
  }

  async function handleDenegar(id: string) {
    if (!confirm("¿Seguro que querés denegar esta transferencia? La transacción se anulará.")) return;
    setProcesando(id);
    const res = await denegarTransferencia(id);
    if (!res.ok) setErrores((prev) => ({ ...prev, [id]: res.error ?? "Error" }));
    setProcesando(null);
  }

  if (transferencias.length === 0) {
    return (
      <div className="bg-white rounded-xl border border-stone-200 px-4 py-12 text-center shadow-sm">
        <p className="text-stone-400 text-sm">No hay transferencias entrantes pendientes</p>
      </div>
    );
  }

  return (
    <>
      {modalAceptar && (
        <ModalCampo
          campos={campos}
          onConfirmar={(campoId) => handleAceptar(modalAceptar, campoId)}
          onCancelar={() => setModalAceptar(null)}
        />
      )}

      <div className="space-y-4">
        {transferencias.map((t) => {
          const animal = t.animal as Transferencia["animal"];
          const origen = (t.empresa_origen as { nombre: string } | null)?.nombre ?? "—";
          const cargando = procesando === t.id;

          return (
            <div key={t.id} className="bg-white rounded-xl border border-amber-200 shadow-sm p-5">
              <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="inline-block px-2 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-700">
                      Pendiente
                    </span>
                    <span className="text-xs text-stone-400">{formatDate(t.creado_en)}</span>
                  </div>
                  <p className="text-sm text-stone-500">
                    Enviado por <span className="font-semibold text-stone-700">{origen}</span>
                  </p>
                  {animal && (
                    <div className="mt-2 space-y-0.5">
                      <p className="font-mono font-semibold text-green-700">{animal.chip_id}</p>
                      <p className="text-xs text-stone-500">
                        {[animal.numero_caravana, animal.categoria, animal.raza].filter(Boolean).join(" · ")}
                      </p>
                    </div>
                  )}
                  {t.precio_total != null && t.precio_total > 0 && (
                    <p className="text-sm text-stone-600 mt-1">
                      Precio: <span className="font-semibold">${formatPeso(t.precio_total)}</span>
                    </p>
                  )}
                </div>

                <div className="flex gap-2 shrink-0">
                  <button
                    onClick={() => setModalAceptar(t.id)}
                    disabled={cargando}
                    className="px-4 py-2 bg-green-700 text-white rounded-lg text-sm font-medium hover:bg-green-600 disabled:opacity-50 transition-colors"
                  >
                    {cargando ? "..." : "Aceptar"}
                  </button>
                  <button
                    onClick={() => handleDenegar(t.id)}
                    disabled={cargando}
                    className="px-4 py-2 bg-white border border-red-200 text-red-600 rounded-lg text-sm font-medium hover:bg-red-50 disabled:opacity-50 transition-colors"
                  >
                    {cargando ? "..." : "Denegar"}
                  </button>
                </div>
              </div>

              {errores[t.id] && (
                <p className="mt-3 text-xs text-red-600 font-mono">{errores[t.id]}</p>
              )}
            </div>
          );
        })}
      </div>
    </>
  );
}
