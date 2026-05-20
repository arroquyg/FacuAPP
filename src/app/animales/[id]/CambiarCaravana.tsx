"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { cambiarCaravana } from "./actions";

export default function CambiarCaravana({ animalId }: { animalId: string }) {
  const router = useRouter();
  const hoy = new Date().toISOString().slice(0, 10);

  const [abierto, setAbierto] = useState(false);
  const [chipNuevo, setChipNuevo] = useState("");
  const [fecha, setFecha] = useState(hoy);
  const [motivo, setMotivo] = useState("");
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleGuardar() {
    if (!chipNuevo.trim() || !fecha) return;
    setGuardando(true);
    setError(null);
    const res = await cambiarCaravana(animalId, {
      chip_nuevo: chipNuevo,
      fecha,
      motivo: motivo || null,
    });
    if (res.ok) {
      setAbierto(false);
      setChipNuevo("");
      setMotivo("");
      router.refresh();
    } else {
      setError(res.error ?? "Error al cambiar caravana");
    }
    setGuardando(false);
  }

  if (!abierto) {
    return (
      <button
        onClick={() => setAbierto(true)}
        className="px-4 py-2 border border-stone-300 rounded-lg text-sm text-stone-600 hover:bg-stone-50 transition-colors"
      >
        Cambiar caravana
      </button>
    );
  }

  return (
    <div className="border border-amber-200 bg-amber-50 rounded-xl p-4 space-y-3 w-full sm:w-auto sm:min-w-80">
      <p className="text-sm font-medium text-stone-700">Cambiar caravana</p>
      {error && (
        <div className="bg-red-50 border border-red-200 rounded px-3 py-1.5 text-xs text-red-600">{error}</div>
      )}
      <div className="space-y-2">
        <div>
          <label className="text-xs text-stone-500 block mb-1">Nueva caravana *</label>
          <input
            autoFocus
            type="text"
            value={chipNuevo}
            onChange={(e) => setChipNuevo(e.target.value)}
            placeholder="Número de caravana"
            className="w-full border border-stone-300 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-amber-300"
          />
        </div>
        <div>
          <label className="text-xs text-stone-500 block mb-1">Fecha *</label>
          <input
            type="date"
            value={fecha}
            onChange={(e) => setFecha(e.target.value)}
            className="w-full border border-stone-300 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-amber-300"
          />
        </div>
        <div>
          <label className="text-xs text-stone-500 block mb-1">Motivo</label>
          <input
            type="text"
            value={motivo}
            onChange={(e) => setMotivo(e.target.value)}
            placeholder="Ej: Caravana rota"
            className="w-full border border-stone-300 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-amber-300"
          />
        </div>
      </div>
      <div className="flex gap-2">
        <button
          onClick={handleGuardar}
          disabled={guardando || !chipNuevo.trim() || !fecha}
          className="px-4 py-1.5 bg-amber-600 text-white rounded-lg text-sm hover:bg-amber-500 disabled:opacity-40"
        >
          {guardando ? "Guardando..." : "Confirmar cambio"}
        </button>
        <button
          onClick={() => { setAbierto(false); setChipNuevo(""); setMotivo(""); setError(null); }}
          className="px-4 py-1.5 border border-stone-300 rounded-lg text-sm hover:bg-stone-100"
        >
          Cancelar
        </button>
      </div>
    </div>
  );
}
