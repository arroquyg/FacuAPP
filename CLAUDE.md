# FacuAPP — Instrucciones para Claude Code

## Reglas obligatorias

- Nunca ejecutar SQL directamente. Si se necesita una query, pasársela al usuario para que la corra en el SQL Editor de Supabase.
- Nunca usar `process.env.EMPRESA_ID`. Siempre usar `getCurrentUser()` → `user.empresa_id`.
- No hacer `git commit` ni `git push` sin confirmación explícita del usuario.
- Si hay dudas sobre cómo el usuario quiere que funcione algo nuevo, preguntar antes de implementar.
- Hace tests unitarios y de integración.
- No te extiendas con explicacion si no te lo pedí antes.
- antes de hardcodear algo, preguntar si es posible hacerlo de forma dinámica.
- respeta siempre tengamos la base de datos con FN3 en lo posible.
## Stack

- Next.js 14 App Router (server components + server actions + client components)
- TypeScript
- Tailwind CSS (paleta stone + green)
- Supabase con `createAdminClient()` (SERVICE_ROLE_KEY, bypasa RLS) para todas las queries de datos
- `createClient()` solo para leer la sesión de auth
