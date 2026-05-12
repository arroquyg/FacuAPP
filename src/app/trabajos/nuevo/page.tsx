import Link from "next/link";
import NuevoTrabajo from "./NuevoTrabajo";

export default function NuevoTrabajoPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/trabajos" className="text-sm text-stone-500 hover:text-stone-700">
          ← Volver
        </Link>
        <h1 className="text-2xl font-bold text-stone-800">Nuevo trabajo</h1>
      </div>
      <NuevoTrabajo />
    </div>
  );
}
