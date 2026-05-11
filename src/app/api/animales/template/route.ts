import { createAdminClient } from "@/lib/supabase/admin";
import { NextResponse } from "next/server";
import * as XLSX from "xlsx";

export async function GET() {
  const sb = createAdminClient();
  const empresaId = process.env.EMPRESA_ID!;

  const [{ data: campos }, { data: categorias }, { data: razas }] =
    await Promise.all([
      sb.from("campos").select("nombre").eq("empresa_id", empresaId).eq("activo", true).order("nombre"),
      sb.from("categorias").select("nombre").eq("empresa_id", empresaId).eq("activo", true).order("nombre"),
      sb.from("razas").select("nombre").eq("empresa_id", empresaId).eq("activo", true).order("nombre"),
    ]);

  const wb = XLSX.utils.book_new();

  // Hoja principal con headers + fila de ejemplo
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
  ];
  const wsAnimales = XLSX.utils.aoa_to_sheet([headers]);
  // Ancho de columnas
  wsAnimales["!cols"] = headers.map(() => ({ wch: 20 }));
  XLSX.utils.book_append_sheet(wb, wsAnimales, "Animales");

  // Hoja de referencia con valores válidos
  const refRows: string[][] = [["Campos válidos", "Categorías válidas", "Razas válidas", "Sexo válido"]];
  const maxLen = Math.max(
    campos?.length ?? 0,
    categorias?.length ?? 0,
    razas?.length ?? 0,
    2
  );
  for (let i = 0; i < maxLen; i++) {
    refRows.push([
      campos?.[i]?.nombre ?? "",
      categorias?.[i]?.nombre ?? "",
      razas?.[i]?.nombre ?? "",
      i === 0 ? "macho" : i === 1 ? "hembra" : "",
    ]);
  }
  const wsRef = XLSX.utils.aoa_to_sheet(refRows);
  wsRef["!cols"] = [{ wch: 22 }, { wch: 22 }, { wch: 22 }, { wch: 14 }];
  XLSX.utils.book_append_sheet(wb, wsRef, "Referencia");

  const buf = XLSX.write(wb, { type: "buffer", bookType: "xlsx" });

  return new NextResponse(buf, {
    headers: {
      "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": 'attachment; filename="base_animales.xlsx"',
    },
  });
}
