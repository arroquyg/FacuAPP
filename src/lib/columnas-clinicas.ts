export type ColumnaTipo = "number" | "text";

export type ColumnaClinica = {
  nombre: string;
  tipo: ColumnaTipo;
  placeholder: string;
};

export const COLUMNAS_PREDEFINIDAS: ColumnaClinica[] = [
  { nombre: "Peso (kg)",           tipo: "number", placeholder: "Ej: 320.5" },
  { nombre: "Vacuna aplicada",     tipo: "text",   placeholder: "Nombre de la vacuna" },
  { nombre: "Dosis (ml)",          tipo: "number", placeholder: "Ej: 5" },
  { nombre: "Diagnóstico preñez",  tipo: "text",   placeholder: "Preñada / Vacía" },
  { nombre: "Condición corporal",  tipo: "text",   placeholder: "Ej: Buena" },
  { nombre: "Observaciones",       tipo: "text",   placeholder: "Notas libres" },
];

export function getTipoColumna(nombre: string): ColumnaTipo {
  return COLUMNAS_PREDEFINIDAS.find((c) => c.nombre === nombre)?.tipo ?? "text";
}

export function formatearValor(nombre: string, valor: string | null): string {
  if (valor === null || valor === "") return "—";
  if (getTipoColumna(nombre) === "number") {
    const n = parseFloat(valor);
    return isNaN(n) ? valor : n.toLocaleString("es-AR");
  }
  return valor;
}
