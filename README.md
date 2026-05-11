# Sistema de Gestión Ganadera

Panel web para gestión de animales, campos y operaciones ganaderas.

## Requisitos

- Node.js 18 o superior
- Una cuenta en [Supabase](https://supabase.com) con la base de datos ya creada

---

## Cómo correr el proyecto localmente

### 1. Instalar dependencias

```bash
npm install
```

### 2. Configurar las variables de entorno

Copiá el archivo de ejemplo y completá con tus credenciales de Supabase:

```bash
cp .env.example .env.local
```

Abrí `.env.local` y pegá tus valores:

```
NEXT_PUBLIC_SUPABASE_URL=https://TU-PROYECTO.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=tu-anon-key
```

> Las credenciales las encontrás en Supabase → tu proyecto → Settings → API.

### 3. Correr el servidor de desarrollo

```bash
npm run dev
```

Abrí [http://localhost:3000](http://localhost:3000) en el navegador. Si la conexión funciona, vas a ver el total de animales registrados.

---

## Cómo hacer el deploy a Vercel

### Primera vez

1. Entrá a [vercel.com](https://vercel.com) y conectá tu cuenta de GitHub
2. Importá este repositorio
3. En la sección **Environment Variables**, agregá las mismas variables que están en `.env.example`:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
4. Hacé click en **Deploy**

### Actualizaciones siguientes

Cada vez que hagas `git push` a la rama principal, Vercel redeploya automáticamente.

---

## Estructura del proyecto

```
src/
├── app/
│   ├── layout.tsx     # Estructura HTML base (envuelve todas las páginas)
│   ├── globals.css    # Estilos globales con Tailwind
│   └── page.tsx       # Página de inicio con conexión a Supabase
└── lib/
    └── supabase/
        ├── client.ts  # Conexión para componentes del navegador
        └── server.ts  # Conexión para el servidor (Server Components)
```
