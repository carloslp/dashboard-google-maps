# Release Changes - Version 1.0.0

Esta es la versión inicial del dashboard de analíticas geográficas. Se implementó la integración completa con Supabase y la funcionalidad de carga y upsert de archivos CSV.

## 🚀 Nuevas Características

- **Autenticación Completa con Supabase**:
  - Pantalla de inicio de sesión y registro moderna, responsiva y animada.
  - Gestión de sesiones reactiva con Svelte 5.
  - Restricción de rutas: redirección automática a `/login` si no se ha iniciado sesión, y a `/` si ya se autenticó.
- **Carga de Datos CSV Interactiva**:
  - Zona de arrastrar y soltar (drag and drop) intuitiva con estados interactivos.
  - Parseo del lado del cliente utilizando PapaParse.
  - Sanitización automática y mapeo de campos.
  - Lógica de Upsert en Supabase basada en la clave única compuesta `(name, address)`.
- **Dashboard de Métricas & Tabla**:
  - Tarjetas de resumen en tiempo real: total de lugares, número de categorías únicas, calificación promedio general y conteo acumulado de reseñas.
  - Filtro por categoría dinámico.
  - Barra de búsqueda interactiva sobre nombre, dirección o categoría.
  - Tabla adaptada a dispositivos móviles.

## 📁 Archivos Creados y Modificados

### Configuración del Proyecto
- [x] [package.json](file:///Users/jc/Documents/proyectos/dashboard-google-maps/package.json): Se añadieron dependencias de Supabase y PapaParse.
- [x] [.env.example](file:///Users/jc/Documents/proyectos/dashboard-google-maps/.env.example) & [.env](file:///Users/jc/Documents/proyectos/dashboard-google-maps/.env): Variables de entorno para inicializar la conexión.

### Lógica y Estado
- [x] [src/lib/supabase.ts](file:///Users/jc/Documents/proyectos/dashboard-google-maps/src/lib/supabase.ts): Inicialización del cliente Supabase.
- [x] [src/lib/auth.svelte.ts](file:///Users/jc/Documents/proyectos/dashboard-google-maps/src/lib/auth.svelte.ts): Administrador reactivo del estado de autenticación usando las nuevas runas de Svelte 5 (`$state`).

### Vistas y UI
- [x] [src/routes/+layout.svelte](file:///Users/jc/Documents/proyectos/dashboard-google-maps/src/routes/+layout.svelte): Comprobación de estado y loader general del sitio.
- [x] [src/routes/login/+page.svelte](file:///Users/jc/Documents/proyectos/dashboard-google-maps/src/routes/login/+page.svelte): Formulario de Login/Registro con diseño premium y animaciones.
- [x] [src/routes/+page.svelte](file:///Users/jc/Documents/proyectos/dashboard-google-maps/src/routes/+page.svelte): Vista principal del dashboard con visualización de datos, estadísticas y zona de carga de archivos.

### Scripts de Base de Datos y Datos de Prueba
- [x] [supabase/setup.sql](file:///Users/jc/Documents/proyectos/dashboard-google-maps/supabase/setup.sql): Scripts SQL para inicializar tablas, índices, triggers de actualización y políticas RLS.
- [x] [sample.csv](file:///Users/jc/Documents/proyectos/dashboard-google-maps/sample.csv): Archivo de datos de muestra para verificar la importación.
