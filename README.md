# GeoAnalytics - Dashboard para Google Maps con Supabase y SvelteKit

GeoAnalytics es un dashboard interactivo y responsivo construido con **SvelteKit**, **Tailwind CSS** y **Supabase**. Permite cargar datos de Google Maps desde archivos CSV, insertándolos o actualizándolos (upsert) en una base de datos de Supabase, y visualizar estas métricas en tiempo real.

---

## 🛠️ Tecnologías Utilizadas

- **Framework**: [SvelteKit](https://svelte.dev) (Svelte 5 con runas reactivas)
- **Estilos**: [Tailwind CSS v4](https://tailwindcss.com) (usando el plugin integrado para Vite)
- **Base de Datos y Autenticación**: [Supabase](https://supabase.com)
- **Parser de CSV**: [PapaParse](https://www.papaparse.com)

---

## 🚀 Requisitos y Configuración

### 1. Variables de Entorno

Crea un archivo `.env` en la raíz del proyecto (basado en el `.env.example` provisto) con tus credenciales de Supabase:

```env
PUBLIC_SUPABASE_URL="https://tu-proyecto-id.supabase.co"
PUBLIC_SUPABASE_ANON_KEY="tu-anon-key-de-supabase"
```

### 2. Configurar la Base de Datos en Supabase

En la consola de Supabase, ve al **SQL Editor** de tu proyecto y ejecuta el contenido del script que se encuentra en la carpeta del proyecto:
📄 [supabase/setup.sql](file:///Users/jc/Documents/proyectos/dashboard-google-maps/supabase/setup.sql)

Este script creará:
- La tabla `places`.
- Un trigger para actualizar la columna `updated_at` de forma automática.
- Las políticas de seguridad a nivel de fila (RLS) para requerir autenticación al leer y guardar datos.
- Una restricción única compuesta sobre `(name, address)` para soportar el mecanismo de upsert.

### 3. Instalar y Ejecutar Localmente

Ejecuta los siguientes comandos para instalar dependencias y levantar el servidor de desarrollo:

```bash
# Instalar dependencias (ya configuradas en package.json)
npm install

# Iniciar servidor de desarrollo
npm run dev
```

El panel estará disponible en [http://localhost:5173](http://localhost:5173).

---

## 📁 Estructura del Archivo CSV

Para cargar los datos, el archivo CSV debe contener una cabecera con los siguientes nombres exactos:

| Columna | Tipo | Requerido | Descripción |
| :--- | :--- | :--- | :--- |
| `name` | Texto | **Sí** | Nombre del lugar / establecimiento |
| `address` | Texto | **Sí** | Dirección completa |
| `website` | Texto | No | Enlace de sitio web |
| `phone_number` | Texto | No | Número de teléfono |
| `reviews_count` | Entero | No | Cantidad de reseñas recibidas |
| `reviews_average` | Decimal | No | Calificación media (ej. 4.85) |
| `place_type` | Texto | No | Tipo/Categoría de lugar (ej. Cafe, Restaurant, Gym) |
| `opens_at` | Texto | No | Horario de apertura (ej. 08:00 AM - 10:00 PM) |

> 💡 **Nota sobre el Upsert**: Si subes un registro con un `name` y `address` que ya existen en la base de datos, Supabase sobrescribirá las columnas restantes con la información más reciente en lugar de duplicar el registro.

Se proporciona un archivo de ejemplo listo para probar en:
📄 [sample.csv](file:///Users/jc/Documents/proyectos/dashboard-google-maps/sample.csv)
