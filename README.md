
# Alumco LMS

Una plataforma de gestión de aprendizaje (LMS) moderna y escalable, construida con Next.js y Supabase.

## 🚀 Tecnologías Principales

Este proyecto utiliza las siguientes tecnologías y librerías:

* **Framework:** [Next.js 16](https://nextjs.org/) (App Router) con React 19.
* **Lenguaje:** [TypeScript](https://www.typescriptlang.org/).
* **Base de Datos y Autenticación:** [Supabase](https://supabase.com/) (`@supabase/ssr`, `@supabase/supabase-js`).
* **Estilos:** [Tailwind CSS v4](https://tailwindcss.com/).
* **Componentes UI:** [Shadcn UI](https://ui.shadcn.com/) (Radix UI) y [Lucide React](https://lucide.dev/) para iconos.
* **Gestión de Estado y Fetching:** [TanStack React Query](https://tanstack.com/query/latest).
* **Formularios y Validación:** [React Hook Form](https://react-hook-form.com/) y [Zod](https://zod.dev/).
* **Utilidades adicionales:** `pdf-lib` para manejo de PDFs, `sonner` para notificaciones (toast), `next-themes` para modo oscuro/claro.

---

## 💻 Cómo iniciar el proyecto en un dispositivo nuevo

Sigue estos pasos para configurar y ejecutar el entorno de desarrollo localmente.

### 1. Requisitos previos
* Tener instalado [Node.js](https://nodejs.org/) (versión 20 o superior recomendada).
* Tener instalado un gestor de paquetes (`npm`, `yarn`, `pnpm` o `bun`).
* Tener acceso a un proyecto de Supabase para las credenciales de base de datos.

### 2. Clonar el repositorio
```bash
git clone <url-del-repositorio>
cd alumco-lms
````

### 3\. Instalar las dependencias

Ejecuta el siguiente comando para instalar todas las librerías necesarias definidas en el `package.json`:

```bash
npm install
# o
yarn install
# o
pnpm install
```

### 4\. Configurar las variables de entorno

Crea un archivo `.env.local` en la raíz del proyecto. Deberás añadir las credenciales de tu proyecto de Supabase (puedes encontrarlas en el panel de configuración de tu proyecto en Supabase):

```env
NEXT_PUBLIC_SUPABASE_URL=tu_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=tu_supabase_anon_key
```

### 5\. Iniciar el servidor de desarrollo

Una vez configurado todo, inicia la aplicación en modo desarrollo:

```bash
npm run dev
# o
yarn dev
# o
pnpm dev
```

Abre [http://localhost:3000](https://www.google.com/search?q=http://localhost:3000) en tu navegador para ver la aplicación funcionando.

-----

## 📂 Estructura del Proyecto

El proyecto sigue una arquitectura modular utilizando el **App Router** de Next.js. Todo el código fuente principal se encuentra dentro de la carpeta `/src`.

```text
alumco-lms/
├── public/                 # Archivos estáticos (imágenes, SVGs como file.svg, globe.svg, etc.)
├── src/
│   ├── app/                # Rutas y páginas de la aplicación (Next.js App Router)
│   │   ├── (auth)/         # Grupo de rutas para autenticación (ej. /login)
│   │   ├── (dashboard)/    # Grupo de rutas para la vista principal del usuario (ej. /cursos)
│   │   ├── admin/          # Panel de administración de la plataforma
│   │   ├── globals.css     # Estilos globales y configuración de Tailwind
│   │   └── layout.tsx      # Layout principal de la aplicación
│   │
│   ├── components/         # Componentes de React reutilizables
│   │   ├── alumco/         # Componentes específicos del negocio (LoginForm, AdminSidebar, BottomNav)
│   │   └── ui/             # Componentes base generados por Shadcn UI (botones, inputs, modales)
│   │
│   └── lib/                # Utilidades, configuraciones y funciones lógicas
│       ├── actions/        # Server Actions de Next.js (ej. mutaciones de auth)
│       ├── supabase/       # Configuración del cliente y middleware de Supabase (SSR)
│       ├── types/          # Definiciones de tipos e interfaces de TypeScript (ej. base de datos)
│       └── utils.ts        # Funciones utilitarias (ej. cn para Tailwind)
│
├── .gitignore              # Archivos ignorados por git
├── components.json         # Configuración de Shadcn UI
├── eslint.config.mjs       # Configuración del linter
├── next.config.ts          # Configuración del framework Next.js
├── package.json            # Dependencias y scripts del proyecto
├── postcss.config.mjs      # Configuración de PostCSS
└── tsconfig.json           # Configuración del compilador de TypeScript
```

## 🛠 Scripts disponibles

En el directorio del proyecto, puedes ejecutar los siguientes comandos:

  * `npm run dev`: Inicia la aplicación en modo desarrollo.
  * `npm run build`: Construye la aplicación optimizada para producción.
  * `npm run start`: Inicia el servidor de producción (requiere haber ejecutado el build previamente).
  * `npm run lint`: Ejecuta ESLint para analizar el código en busca de errores y malas prácticas.

<!-- end list -->

```
```
