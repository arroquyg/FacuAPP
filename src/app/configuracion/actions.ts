"use server";

import { createAdminClient } from "@/lib/supabase/admin";
import { getCurrentUser } from "@/lib/auth";
import { revalidatePath } from "next/cache";

async function getEmpresaId() {
  const user = await getCurrentUser();
  if (!user) throw new Error("No autenticado");
  return user.empresa_id;
}

function revalidarTodo() {
  revalidatePath("/configuracion");
  revalidatePath("/animales");
  revalidatePath("/movimientos");
  revalidatePath("/");
}

export async function crearCampo(data: {
  nombre: string;
  superficie_ha?: number | null;
  capacidad_max?: number | null;
  tipo_pasto?: string | null;
}): Promise<{ ok: boolean; error?: string }> {
  const empresaId = await getEmpresaId();
  const sb = createAdminClient();
  const { error } = await sb.from("campos").insert({
    empresa_id: empresaId,
    nombre: data.nombre.trim(),
    superficie_ha: data.superficie_ha || null,
    capacidad_max: data.capacidad_max || null,
    tipo_pasto: data.tipo_pasto?.trim() || null,
    activo: true,
  });
  if (error) return { ok: false, error: error.message };
  revalidarTodo();
  return { ok: true };
}

export async function actualizarCampo(id: string, data: {
  nombre: string;
  superficie_ha?: number | null;
  capacidad_max?: number | null;
  tipo_pasto?: string | null;
}): Promise<{ ok: boolean; error?: string }> {
  const empresaId = await getEmpresaId();
  const sb = createAdminClient();
  const { error } = await sb.from("campos").update({
    nombre: data.nombre.trim(),
    superficie_ha: data.superficie_ha || null,
    capacidad_max: data.capacidad_max || null,
    tipo_pasto: data.tipo_pasto?.trim() || null,
  }).eq("id", id).eq("empresa_id", empresaId);
  if (error) return { ok: false, error: error.message };
  revalidarTodo();
  return { ok: true };
}

export async function crearCategoria(nombre: string): Promise<{ ok: boolean; error?: string }> {
  const empresaId = await getEmpresaId();
  const sb = createAdminClient();
  const { error } = await sb.from("categorias").insert({ empresa_id: empresaId, nombre: nombre.trim(), activo: true });
  if (error) return { ok: false, error: error.message };
  revalidatePath("/configuracion");
  revalidatePath("/animales");
  return { ok: true };
}

export async function actualizarCategoria(id: string, nombre: string): Promise<{ ok: boolean; error?: string }> {
  const empresaId = await getEmpresaId();
  const sb = createAdminClient();
  const { error } = await sb.from("categorias").update({ nombre: nombre.trim() }).eq("id", id).eq("empresa_id", empresaId);
  if (error) return { ok: false, error: error.message };
  revalidatePath("/configuracion");
  revalidatePath("/animales");
  return { ok: true };
}

export async function crearRaza(nombre: string): Promise<{ ok: boolean; error?: string }> {
  const empresaId = await getEmpresaId();
  const sb = createAdminClient();
  const { error } = await sb.from("razas").insert({ empresa_id: empresaId, nombre: nombre.trim(), activo: true });
  if (error) return { ok: false, error: error.message };
  revalidatePath("/configuracion");
  revalidatePath("/animales");
  return { ok: true };
}

export async function actualizarRaza(id: string, nombre: string): Promise<{ ok: boolean; error?: string }> {
  const empresaId = await getEmpresaId();
  const sb = createAdminClient();
  const { error } = await sb.from("razas").update({ nombre: nombre.trim() }).eq("id", id).eq("empresa_id", empresaId);
  if (error) return { ok: false, error: error.message };
  revalidatePath("/configuracion");
  revalidatePath("/animales");
  return { ok: true };
}

export async function toggleActivo(tabla: "campos" | "categorias" | "razas" | "alimentos" | "productos_sanitarios", id: string, activo: boolean): Promise<{ ok: boolean; error?: string }> {
  const empresaId = await getEmpresaId();
  const sb = createAdminClient();
  const { error } = await sb.from(tabla).update({ activo }).eq("id", id).eq("empresa_id", empresaId);
  if (error) return { ok: false, error: error.message };
  revalidarTodo();
  return { ok: true };
}

export async function crearAlimento(data: { nombre: string; precio_por_tonelada: number }): Promise<{ ok: boolean; error?: string }> {
  const empresaId = await getEmpresaId();
  const sb = createAdminClient();
  const { error } = await sb.from("alimentos").insert({
    empresa_id: empresaId,
    nombre: data.nombre.trim(),
    precio_por_tonelada: data.precio_por_tonelada,
    activo: true,
  });
  if (error) return { ok: false, error: error.message };
  revalidatePath("/configuracion");
  return { ok: true };
}

export async function actualizarAlimento(id: string, data: { nombre: string; precio_por_tonelada: number }): Promise<{ ok: boolean; error?: string }> {
  const empresaId = await getEmpresaId();
  const sb = createAdminClient();
  const { error } = await sb.from("alimentos").update({
    nombre: data.nombre.trim(),
    precio_por_tonelada: data.precio_por_tonelada,
  }).eq("id", id).eq("empresa_id", empresaId);
  if (error) return { ok: false, error: error.message };
  revalidatePath("/configuracion");
  return { ok: true };
}

export async function crearProductoSanitario(data: { nombre: string; precio_por_unidad: number; unidad: string }): Promise<{ ok: boolean; error?: string }> {
  const empresaId = await getEmpresaId();
  const sb = createAdminClient();
  const { error } = await sb.from("productos_sanitarios").insert({
    empresa_id: empresaId,
    nombre: data.nombre.trim(),
    precio_por_unidad: data.precio_por_unidad,
    unidad: data.unidad.trim() || "ml",
    activo: true,
  });
  if (error) return { ok: false, error: error.message };
  revalidatePath("/configuracion");
  return { ok: true };
}

export async function actualizarProductoSanitario(id: string, data: { nombre: string; precio_por_unidad: number; unidad: string }): Promise<{ ok: boolean; error?: string }> {
  const empresaId = await getEmpresaId();
  const sb = createAdminClient();
  const { error } = await sb.from("productos_sanitarios").update({
    nombre: data.nombre.trim(),
    precio_por_unidad: data.precio_por_unidad,
    unidad: data.unidad.trim() || "ml",
  }).eq("id", id).eq("empresa_id", empresaId);
  if (error) return { ok: false, error: error.message };
  revalidatePath("/configuracion");
  return { ok: true };
}
