"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

const STORAGE_KEY = "alerta_muertos_dismissed_at";
// Vuelve a mostrar la alerta si pasaron más de 24hs desde que se ocultó
const TTL_MS = 24 * 60 * 60 * 1000;

export default function AlertaMuertos({ totalMuertos }: { totalMuertos: number }) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const dismissedAt = localStorage.getItem(STORAGE_KEY);
    if (!dismissedAt || Date.now() - Number(dismissedAt) > TTL_MS) {
      setVisible(true);
    }
  }, []);

  if (!visible || totalMuertos === 0) return null;

  function descartar() {
    localStorage.setItem(STORAGE_KEY, String(Date.now()));
    setVisible(false);
  }

  return (
    <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-center justify-between">
      <div>
        <p className="font-semibold text-red-700">
          {totalMuertos} animal{totalMuertos !== 1 ? "es" : ""} registrado{totalMuertos !== 1 ? "s" : ""} como muerto
        </p>
        <p className="text-red-500 text-sm mt-0.5">Revisar el listado de animales para más detalles</p>
      </div>
      <div className="flex items-center gap-3 shrink-0">
        <Link href="/animales" className="text-red-600 text-sm font-medium hover:underline">
          Ver animales →
        </Link>
        <button
          onClick={descartar}
          className="text-xs px-3 py-1.5 border border-red-300 text-red-600 rounded-lg hover:bg-red-100 transition-colors"
        >
          OK
        </button>
      </div>
    </div>
  );
}
