import { createAdminClient } from "@/lib/supabase/admin";
import { getCurrentUser } from "@/lib/auth";
import { NextResponse } from "next/server";
import * as XLSX from "xlsx";

export async function GET() {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "No autenticado" }, { status: 401 });

  const sb = createAdminClient();
  const empresaId = user.empresa_id;

  const PAGE = 1000;
  let animales: Record<string, unknown>[] = [];
  let from = 0;
  while (true) {
    const { data, error } = await sb
      .from("animales")
      .select("chip_id, numero_caravana, sexo, categoria, raza, color_pelaje, fecha_nacimiento, procedencia, valor_comercial, estado_sanitario, vivo, campo:campo_actual_id(nombre)")
      .eq("empresa_id", empresaId)
      .eq("activo", true)
      .order("chip_id")
      .range(from, from + PAGE - 1);

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    if (!data || data.length === 0) break;
    animales = animales.concat(data);
    if (data.length < PAGE) break;
    from += PAGE;
  }

  const headers = [
    "chip_id *",
    "numero_caravana *",
    "sexo *",
    "categoria *",
    "raza *",
    "campo",
    "color_pelaje",
    "fecha_nacimiento",
    "procedencia",
    "valor_comercial",
    "estado_sanitario",
    "vivo",
  ];

  const filas = animales.map((a) => [
    a.chip_id ?? "",
    a.numero_caravana ?? "",
    a.sexo ?? "",
    a.categoria ?? "",
    a.raza ?? "",
    (a.campo as unknown as { nombre: string } | null)?.nombre ?? "",
    a.color_pelaje ?? "",
    a.fecha_nacimiento ?? "",
    a.procedencia ?? "",
    a.valor_comercial ?? "",
    a.estado_sanitario ?? "",
    a.vivo ? "sí" : "no",
  ]);

  const wb = XLSX.utils.book_new();
  const ws = XLSX.utils.aoa_to_sheet([headers, ...filas]);
  ws["!cols"] = headers.map(() => ({ wch: 22 }));
  XLSX.utils.book_append_sheet(wb, ws, "Animales");

  const buf = XLSX.write(wb, { type: "buffer", bookType: "xlsx" });

  const fecha = new Date().toISOString().slice(0, 10);

  return new NextResponse(buf, {
    headers: {
      "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": `attachment; filename="animales_${fecha}.xlsx"`,
    },
  });
}
