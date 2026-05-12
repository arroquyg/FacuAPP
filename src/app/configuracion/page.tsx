import { createAdminClient } from "@/lib/supabase/admin";
import CamposConfig from "./CamposConfig";
import SimpleListConfig from "./SimpleListConfig";
import {
  actualizarCategoria,
  actualizarRaza,
  crearCategoria,
  crearRaza,
} from "./actions";

export default async function ConfiguracionPage({
  searchParams,
}: {
  searchParams: { tab?: string };
}) {
  const sb = createAdminClient();
  const empresaId = process.env.EMPRESA_ID!;
  const tab = searchParams.tab ?? "campos";

  const [{ data: campos }, { data: categorias }, { data: razas }] =
    await Promise.all([
      sb
        .from("campos")
        .select("id, nombre, superficie_ha, capacidad_max, tipo_pasto, activo")
        .eq("empresa_id", empresaId)
        .order("nombre"),
      sb
        .from("categorias")
        .select("id, nombre, activo")
        .eq("empresa_id", empresaId)
        .order("nombre"),
      sb
        .from("razas")
        .select("id, nombre, activo")
        .eq("empresa_id", empresaId)
        .order("nombre"),
    ]);

  const tabs = [
    { key: "campos", label: "Campos" },
    { key: "categorias", label: "Categorías" },
    { key: "razas", label: "Razas" },
  ];

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-800">Configuración</h1>

      {/* Pestañas */}
      <div className="flex border-b border-gray-200">
        {tabs.map((t) => (
          <a
            key={t.key}
            href={`/configuracion?tab=${t.key}`}
            className={`px-5 py-3 text-sm font-medium border-b-2 transition-colors ${
              tab === t.key
                ? "border-green-800 text-gray-800"
                : "border-transparent text-gray-400 hover:text-gray-600"
            }`}
          >
            {t.label}
          </a>
        ))}
      </div>

      {/* Contenido */}
      {tab === "campos" && <CamposConfig campos={campos ?? []} />}

      {tab === "categorias" && (
        <SimpleListConfig
          tabla="categorias"
          items={categorias ?? []}
          onCrear={crearCategoria}
          onActualizar={actualizarCategoria}
        />
      )}

      {tab === "razas" && (
        <SimpleListConfig
          tabla="razas"
          items={razas ?? []}
          onCrear={crearRaza}
          onActualizar={actualizarRaza}
        />
      )}
    </div>
  );
}
