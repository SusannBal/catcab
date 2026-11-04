# Actualización de noviembre 2026: Enfoque en Vendedor F y Archivado de S y N

Resumen de los cambios incorporados en la rama `actualizacion-noviembre`.

---

## 1. ¿Qué se hizo en esta actualización?

En esta versión la aplicación pasa a estar **enfocada exclusivamente en el vendedor F**, archivando la presencia operativa y visual de los vendedores **S** y **N**, sin comprometer la integridad del stock físico ni el historial de ventas.

### A. Registro de ventas más rápido y directo
- En **Inventario** (`InventarioPage.jsx`), al presionar **"Vendí 1"**, el vendedor se asigna automáticamente a **`F`**.
- Se ocultó el selector de vendedor `¿Quién realizó la venta?` (`[S, F, N]`), haciendo el proceso de venta en 1 solo paso sin pasos extra.

### B. Dinero total y estadísticas enfocadas en F
- **Página de Ventas:** Las tarjetas superiores de "Total vendidas", "Ingresos totales" y "Ganancia total" ahora reflejan **únicamente las ventas generadas por F**.
- Se retiró la tarjeta destacada de estadísticas del vendedor S, manteniendo visible la de F.
- Se agregó el filtro **"Ventas de F"** (activo por defecto) y un botón **"Archivados (S y N)"** que permite consultar el historial de ventas pasadas de S y N cuando sea necesario, sin necesidad de tocar código.
- **Página de Inventario:** "Ganancia total", "Ingresos totales" y "Unidades vendidas" calculan exclusivamente lo generado por F.
- **Dashboard:** Ya estaba programado 100% sobre las ventas de F (`seller === 'F'`), por lo que ahora toda la app habla el mismo idioma financiero sin discrepancias.

### C. Integridad del Stock físico y Lotes FIFO
- El cálculo de unidades disponibles en estante (`stockOf`) y la rotación de costos por lote (`computeLots` en `lots.js`) **siguen tomando en cuenta todas las salidas reales**.
- Ninguna venta de S o N fue borrada de Supabase: las unidades que S vendió en la realidad siguen descontadas del almacén para que el inventario no se infle artificialmente.

---

## 2. Diferencia entre ramas: Octubre vs. Noviembre

- **Rama `actualizacion-octubre`:**
  - Versión con sistema **multivendedor activo para ambos** (S y F).
  - Muestra tarjetas separadas para S y F, selector de vendedor `[S, F, N]` al vender y sumas consolidadas de ambos en Inventario y Ventas.
  - Se mantiene guardada en Git intacta como respaldo histórico.

- **Rama `actualizacion-noviembre` (y rama `main`):**
  - Versión **unificada y enfocada en F**.
  - Oculta operativamente a S y N, enfoca todos los totales de dinero en F y agiliza el flujo de venta.

---

## 3. ¿Cómo desarchivar / revertir al sistema para ambos vendedores?

Si algún día necesitas volver a mostrar activamente al vendedor S y N, solo debes cambiar 3 constantes booleanas en el código:

### Paso 1: Totales de dinero en `src/hooks/useData.js`
En la línea 14 de [`src/hooks/useData.js`](file:///src/hooks/useData.js):
```javascript
// Cambiar 'F' por null para que vuelva a sumar a todos los vendedores:
export const FOCUS_SELLER = null
```

### Paso 2: Selector al vender en `src/pages/InventarioPage.jsx`
En la línea 8 de [`src/pages/InventarioPage.jsx`](file:///src/pages/InventarioPage.jsx):
```javascript
// Cambiar true a false para volver a mostrar los botones [S, F, N]:
const ARCHIVE_SELLERS_S_N = false
```

### Paso 3: Tarjeta y filtros en `src/pages/VentasPage.jsx`
En la línea 8 de [`src/pages/VentasPage.jsx`](file:///src/pages/VentasPage.jsx):
```javascript
// Cambiar true a false para mostrar la tarjeta de S y los filtros de todos:
const ARCHIVE_SELLERS_S_N = false
```

Al hacer estos 3 cambios, la app vuelve exactamente al modo multivendedor de octubre.

---

## 4. Opciones adicionales archivadas recientemente

También se dejaron preparados con interruptores reversibles:
- **Pestaña "Contáctanos":** Se puede reactivar cambiando `SHOW_CONTACT_TAB = true` en [`src/App.jsx`](file:///src/App.jsx).
- **Modal y botón de "Novedades":** Se puede reactivar cambiando `SHOW_NEWS = true` en [`src/pages/DashboardPage.jsx`](file:///src/pages/DashboardPage.jsx).

---

## 5. Respaldo de datos del usuario S en Supabase

Todos los registros originales del usuario S siguen almacenados de forma segura en la base de datos de Supabase:
- **Tabla:** `ventas`
- **Filtro:** `seller = 'S'`
- Ningún dato histórico fue eliminado ni alterado.
