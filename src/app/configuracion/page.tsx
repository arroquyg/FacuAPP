import { createAdminClient } from "@/lib/supabase/admin";
import { getCurrentUser } from "@/lib/auth";
import { redirect } from "next/navigation";
import CamposConfig from "./CamposConfig";
import SimpleListConfig from "./SimpleListConfig";
import AlimentosConfig from "./AlimentosConfig";
import ProductosSanitariosConfig from "./ProductosSanitariosConfig";
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
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const sb = createAdminClient();
  const empresaId = user.empresa_id;
  const tab = searchParams.tab ?? "campos";

  const [{ data: campos }, { data: categorias }, { data: razas }, { data: alimentos }, { data: productosSanitarios }] =
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
      sb
        .from("alimentos")
        .select("id, nombre, precio_por_tonelada, activo")
        .eq("empresa_id", empresaId)
        .order("nombre"),
      sb
        .from("productos_sanitarios")
        .select("id, nombre, precio_por_unidad, unidad, activo")
        .eq("empresa_id", empresaId)
        .order("nombre"),
    ]);

  const tabs = [
    { key: "campos", label: "Campos" },
    { key: "categorias", label: "Categorías" },
    { key: "razas", label: "Razas" },
    ...(user.rol === "administrador" ? [{ key: "alimentos", label: "Alimentos" }] : []),
    ...(user.rol === "administrador" ? [{ key: "productos_sanitarios", label: "Productos sanitarios" }] : []),
  ];

  return (
    <div className="space-y-6">
      <div className="border-b border-stone-200 pb-5">
        <h1 className="text-3xl font-bold text-stone-800">Configuración</h1>
        <p className="text-stone-500 mt-1 text-sm">Campos, categorías y razas del establecimiento</p>
      </div>

      {/* Pestañas */}
      <div className="flex border-b border-stone-200 bg-white rounded-t-xl border border-stone-200 px-2 shadow-sm">
        {tabs.map((t) => (
          <a
            key={t.key}
            href={`/configuracion?tab=${t.key}`}
            className={`px-5 py-3 text-sm font-medium border-b-2 transition-colors ${
              tab === t.key
                ? "border-green-800 text-stone-800"
                : "border-transparent text-stone-400 hover:text-stone-600"
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

      {tab === "alimentos" && user.rol === "administrador" && (
        <AlimentosConfig items={alimentos ?? []} />
      )}

      {tab === "productos_sanitarios" && user.rol === "administrador" && (
        <ProductosSanitariosConfig items={productosSanitarios ?? []} />
      )}
    </div>
  );
}
