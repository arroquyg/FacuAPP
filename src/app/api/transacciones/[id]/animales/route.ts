import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

export async function GET(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("transaccion_animales")
    .select(
      "id, precio_unitario, animal:animal_id(chip_id, categoria, raza)"
    )
    .eq("transaccion_id", params.id);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data ?? []);
}
