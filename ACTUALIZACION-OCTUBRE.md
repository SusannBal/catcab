# Actualización de octubre 2026

Resumen de todo lo que se incorporó en la rama `actualizacion-octubre`.

---

## Antes de usar esta versión: SQL en Supabase

Esta versión necesita columnas y tablas nuevas. Hay que ejecutar cada archivo **una sola vez** en
**Supabase Dashboard > SQL Editor**, en este orden:

| Archivo | Qué hace |
|---|---|
| `migration-archivados.sql` | Agrega la columna `archived` a `productos` |
| `migration-proveedor.sql` | Agrega la columna `proveedor` a `entradas` |
| `migration-proveedores-tabla.sql` | Crea la tabla `proveedores` y copia los que ya estaban en entradas |
| `migration-proveedores-datos.sql` | Agrega lugar de compra, contacto, pagos, etc. a `proveedores` |
| `migration-reportes.sql` | Crea la tabla `reportes` (pestaña Contáctanos) |

Ninguno borra datos. Si falta alguno, la app sigue funcionando: la parte que lo necesita se
muestra desactivada con un aviso que indica qué archivo ejecutar.

---

## Lo nuevo

### Dashboard renovado
- **Filtro de periodo:** Mes, Semana, Rango de fechas o Todo. Los selectores solo muestran
  meses y semanas con movimiento. Cada número se compara con el periodo anterior equivalente.
- **Entradas vs salidas:** ingresos (ventas de F) contra gastos (entradas de mercadería),
  balance, ganancia, margen y unidades.
- **Gráfico de flujo** por día, semana o mes según el largo del periodo.
- **Flujo por mes:** ingresos, gastos, balance, ganancia y acumulado de cada mes. Tocar un mes
  lo abre en detalle.
- **Top productos** por unidades, ganancia o margen, y lista de **movimientos** del periodo.
- **Ventas por categoría** (Cables, Audífonos, Audio) y **compras por proveedor**.
- **Ritmo de ventas:** ticket promedio, ventas por día, días con ventas, mejor día de la semana.
- **Estadísticas:** promedio, mediana y desviación diaria, día récord, recuperación del gasto,
  vendido vs ingresado y proyección de cierre de mes.
- **Inventario actual:** unidades, valor al costo, valor a precio de venta, ganancia potencial,
  stock bajo y productos sin venderse hace 30 días o más.
- **Análisis automático** del periodo (avisos y puntos positivos).
- **Respaldo en Excel:** descarga un `.xlsx` con ventas, entradas, productos y resumen mensual.
- **Novedades:** nota que aparece una vez cuando hay cambios y se puede volver a abrir.

### Productos archivados
- Los productos agotados se archivan solos y vuelven a activos al registrar una entrada.
- En **Gestión** hay pestañas Activos / Archivados y botón para archivar o desarchivar a mano.
- Los archivados no aparecen en Catálogo ni en Inventario (ni en sus PDF).

### Entradas rediseñada
- Formulario en 3 pasos: producto, datos de la compra y precio de venta (opcional).
- Proveedor y **fecha de compra** en cada entrada (editables después).
- Resumen antes de confirmar: gasto total y cómo queda el stock.
- El precio de venta **solo cambia si se escribe uno distinto**; el formulario avisa si se
  mantiene o cambia. Las ventas pasadas nunca cambian.
- Historial agrupado por mes, con buscador por producto o proveedor.

### Proveedores
- Pestaña **Proveedores** dentro de Entradas.
- Datos: nombre, tipo, persona de contacto, teléfono (con enlace a WhatsApp), dirección, ciudad,
  enlace de Google Maps, horario, métodos de pago, tiempo de entrega, compra mínima, si hace
  envíos, página o redes, calificación de 1 a 5 y notas.
- Estadísticas por proveedor: cuánto se le compró, unidades, costo promedio, última compra,
  porcentaje de las compras y productos que vende.
- Al registrar una entrada, el proveedor se elige de una lista o se agrega uno nuevo ahí mismo.

### Costos por lote exactos (FIFO)
- El stock inicial y cada entrada son lotes separados, cada uno con su costo y sus unidades.
- Al vender solo aparecen los costos que todavía tienen unidades, con cuántas quedan, y viene
  elegido el más antiguo ("primero en salir").
- Si se compra más barato, lo que ya había se sigue vendiendo con su costo original.
- Toda la lógica está en `src/lib/lots.js` y la usan la venta, el costo automático y el valor
  del inventario.

### Inventario más cómodo
- Solo muestra productos disponibles, los más vendidos primero (también por nombre o menos stock).
- Filtro por categoría y buscador por nombre o código, fijos arriba al hacer scroll.
- Botón "Vendí 1" junto al nombre; historial de ventas plegable.

### Contáctanos
- Pestaña nueva junto a Ventas para reportar errores, quejas, sugerencias o preguntas.
- Los mensajes quedan como pendientes y se pueden marcar como resueltos o eliminar.

### Diseño
- **Modo claro y oscuro** con el botón de sol o luna junto al logo; recuerda la elección.
- Catálogo con tarjetas más limpias: foto sobre fondo blanco y precio en etiqueta amarilla.
- Mejor contraste en modo oscuro y sin emojis en toda la app.

---

## Archivos nuevos

```
src/lib/lots.js                   Cálculo de lotes y costo FIFO
src/lib/exportExcel.js            Respaldo en Excel
src/pages/ProveedoresSection.jsx  Pestaña de proveedores
src/components/ContactSection.jsx Pestaña Contáctanos
migration-*.sql                   Cambios de base de datos (ver tabla arriba)
```

Dependencia nueva: `xlsx` (SheetJS), que se carga solo al descargar el respaldo.
