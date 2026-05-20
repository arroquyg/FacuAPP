import type { UserProfile } from "@/lib/auth";

export const DEMO_EMPRESA_ID = "03ad363d-be9d-4861-99e7-a020c47e80d3";
export const DEMO_MSG = "Cuenta demo: los cambios no se guardan.";
export const DEMO_BLOCKED = { ok: false as const, error: DEMO_MSG };

export function isDemoUser(user: UserProfile): boolean {
  return user.empresa_id === DEMO_EMPRESA_ID;
}
