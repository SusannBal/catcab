# CablesPro · Catálogo e inventario

App web para manejar el catálogo, el inventario, las compras y las ventas de CablesPro.

**Tecnologías:** React + Vite · Supabase (base de datos y fotos) · Netlify (publicación)

Lo último que se incorporó está en [ACTUALIZACION-OCTUBRE.md](ACTUALIZACION-OCTUBRE.md).

---

## Qué hace cada pestaña

| Pestaña | Para qué sirve |
|---|---|
| **Dashboard** | Ingresos, gastos y balance por mes, semana o rango; estadísticas, inventario, análisis y respaldo en Excel |
| **Catálogo** | Productos disponibles con foto y precio; se exporta a PDF |
| **Gestión** | Crear, editar, archivar y borrar productos |
| **Entradas** | Registrar compras de mercadería y administrar proveedores |
| **Inventario** | Stock disponible y registro rápido de ventas ("Vendí 1") |
| **Ventas** | Historial de ventas por vendedor |
| **Contáctanos** | Reportar errores, quejas o sugerencias |

### Conceptos clave
- **Entradas = gastos.** Cada entrada suma stock y cuenta como gasto en el Dashboard.
- **Ventas = ingresos.** El Dashboard muestra las ventas del vendedor F.
- **Lotes (FIFO).** El stock inicial y cada entrada son lotes con su propio costo. Las ventas
  descuentan del lote más antiguo con unidades, así la ganancia de cada venta usa el costo real.
- **Archivados.** Los agotados se ocultan solos y vuelven al registrar una entrada.

---

## Instalación

### 1. Supabase
1. Crear un proyecto en [supabase.com](https://supabase.com).
2. En **SQL Editor**, ejecutar `supabase-setup.sql` (crea todas las tablas).
   - Si la base ya existía de una versión anterior, ejecutar en su lugar los archivos
     `migration-*.sql` indicados en [ACTUALIZACION-OCTUBRE.md](ACTUALIZACION-OCTUBRE.md).
3. En **Project Settings > API**, copiar la `Project URL` y la clave `anon public`.

### 2. Variables de entorno
Crear un archivo `.env` en la raíz (ver `.env.example`):

```
VITE_SUPABASE_URL=https://XXXXXXXX.supabase.co
VITE_SUPABASE_ANON_KEY=tu_clave_anon
```

### 3. Ejecutar en tu computadora

```bash
npm install
```

```bash
npm run dev
```

Abrir `http://localhost:5173`.

### 4. Publicar en Netlify
El sitio se publica solo al subir cambios a la rama `main` de GitHub.

- Build command: `npm run build`
- Publish directory: `dist`
- Variables de entorno en **Site settings > Environment variables**: `VITE_SUPABASE_URL` y
  `VITE_SUPABASE_ANON_KEY`.

---

## Estructura del proyecto

```
src/
├── App.jsx                     Barra superior, pestañas y tema claro/oscuro
├── hooks/
│   └── useData.js              Carga y guarda todo en Supabase
├── lib/
│   ├── supabase.js             Cliente de Supabase
│   ├── lots.js                 Lotes y costo FIFO
│   ├── exportPdf.js            Catálogo e inventario en PDF
│   └── exportExcel.js          Respaldo en Excel
├── components/
│   ├── UI.jsx                  Botones, campos, modal y otros elementos comunes
│   ├── LazyImage.jsx           Carga diferida de imágenes
│   └── ContactSection.jsx      Pestaña Contáctanos
└── pages/
    ├── DashboardPage.jsx
    ├── CatalogPage.jsx
    ├── GestionPage.jsx
    ├── EntradasPage.jsx
    ├── ProveedoresSection.jsx
    ├── InventarioPage.jsx
    └── VentasPage.jsx
```

### Base de datos (Supabase)

| Tabla | Contenido |
|---|---|
| `productos` | Nombre, categoría, precios, stock inicial, foto, archivado |
| `entradas` | Compras: producto, cantidad, costo, proveedor, fecha |
| `ventas` | Ventas: producto, vendedor, precio y costo al momento de vender |
| `proveedores` | Datos de contacto, lugar de compra y condiciones |
| `reportes` | Mensajes de la pestaña Contáctanos |
