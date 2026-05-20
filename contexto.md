# Contexto — Feature Bastón Tru-Test XRS2i

> Leer este archivo al inicio de cada sesión sobre esta feature.
> Rama de trabajo: `feature/investigacion`

---

## ¿Qué estamos haciendo?

Integrando el bastón lector de caravanas **Tru-Test XRS2i** con FacuAPP.
El bastón lee EIDs (chips electrónicos de caravanas) y queremos que esos datos
lleguen a FacuAPP sin necesidad de WiFi en el campo.

Para info técnica del bastón: leer `Info-Baston.md`

---

## Dato clave confirmado

El número que lee el bastón **es exactamente igual** al `chip_id` guardado en la tabla `animales`.
Ejemplo: `032010010151429` → mismo número en la caravana física y en la BD.
**No hace falta ninguna columna nueva en la tabla animales.**

---

## Arquitectura definida

### App móvil (React Native + Expo) — AÚN NO EMPEZADA
- Se conecta al XRS2i por Bluetooth
- El bastón funciona en iOS (el usuario ya lo conectó por Bluetooth, confirmado)
- Guarda datos offline en SQLite del celular
- Al detectar WiFi: captura GPS automáticamente y sube todo lo pendiente

### 3 funciones de la app móvil
1. **Sync de Trabajo**: EIDs escaneados → animales existentes → crea Trabajo + trabajo_registros
2. **Nuevos animales**: EIDs no encontrados → crear animal nuevo
3. **Cache offline**: descarga lista de chip_ids al celular para clasificar offline sin consultar la BD

### Nombre del Trabajo = nombre de la sesión del bastón
El XRS2i guarda los escaneos en "sesiones" con nombre (ej: "Vacunación Lote Norte").
Ese nombre se convierte directamente en el campo `tipo` del Trabajo en FacuAPP.

### Integración con el modelo de datos existente
- Un Trabajo = una sesión del bastón
- Cada animal escaneado = un `trabajo_registro` (encontrado: true/false)
- Los `trabajo_registros` con `encontrado: true` ya aparecen automáticamente
  en la tab "Historial Clínico" de cada animal (lógica ya existente, no tocar)

---

## Lo ya implementado (Fase 1 — Backend)

### Archivos creados en esta sesión:

**`src/lib/auth-api.ts`**
- Helper `getUserFromRequest(req)` que acepta JWT en header `Authorization: Bearer <token>`
- Fallback a cookie de sesión (para uso desde el browser)
- Necesario porque la app móvil no tiene cookies

**`src/app/api/baston/sync/route.ts`** — `POST /api/baston/sync`
- Crea un Trabajo con el nombre de la sesión del bastón
- Busca cada EID en `animales` por `chip_id` (con y sin espacios)
- Crea `trabajo_registros` para cada EID (encontrado: true/false)
- Actualiza `total_chips` en el trabajo
- Body: `{ session_name, fecha, campo, veterinario, eids: string[] }`
- Response: `{ ok, trabajoId, total, encontrados, noEncontrados }`

**`src/app/api/baston/cache/route.ts`** — `GET /api/baston/cache`
- Devuelve todos los `chip_id` activos de la empresa
- Para que la app móvil haga cache offline y pueda clasificar EIDs sin internet
- Response: `{ chips: string[], total: number }`

**`src/app/api/baston/animales-nuevos/route.ts`** — `POST /api/baston/animales-nuevos`
- Crea animales nuevos a partir de EIDs no encontrados
- Body: `{ animales: [{ chip_id, campo?, fecha_ingreso? }] }`
- Response: `{ ok, creados, animales }`

---

## Pendiente

### Fase 1 — Testear los endpoints
- Usar Postman para verificar los 3 endpoints
- Login para JWT: `POST https://[supabase].supabase.co/auth/v1/token?grant_type=password`
- Header en todos los requests: `Authorization: Bearer <access_token>`

### Fase 2 — App móvil (React Native + Expo)
- Nueva app en una carpeta separada (ej: `facuapp-mobile/` fuera del repo Next.js)
- Bluetooth: conectar al XRS2i, descargar sesiones
- SQLite offline: `pending_trabajos`, `pending_animales_nuevos`
- Sync automático al conectar WiFi + captura de GPS
- UI: pantalla de conexión Bluetooth, lista de sesiones, estado de sync

---

## Stack del proyecto actual (para contexto)

- Next.js 14 App Router
- TypeScript
- Tailwind CSS (paleta stone + green)
- Supabase con `createAdminClient()` (SERVICE_ROLE_KEY) para queries
- `createClient()` solo para leer sesión de auth
- Nunca usar `process.env.EMPRESA_ID` → siempre `getCurrentUser()` → `user.empresa_id`
- No hacer commit/push sin confirmación explícita del usuario
