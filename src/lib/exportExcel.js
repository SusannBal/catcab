// Respaldo completo en Excel (.xlsx): ventas, entradas, productos y resumen mensual.
// La librería se carga solo al exportar para no aumentar el peso inicial de la app.

function fecha(iso) {
  const d = new Date(iso)
  return isNaN(d) ? '' : d
}
function num(n) {
  const v = Number(n)
  return isNaN(v) ? 0 : Math.round(v * 100) / 100
}
function monthKey(d) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
}

// Ancho de columnas según el contenido más largo
function autoWidth(rows) {
  if (!rows.length) return []
  return Object.keys(rows[0]).map(k => ({
    wch: Math.min(45, Math.max(k.length, ...rows.map(r => {
      const v = r[k]
      return v instanceof Date ? 16 : String(v ?? '').length
    })) + 2),
  }))
}

export async function exportBackupExcel({ products = [], sales = [], entradas = [] }) {
  const XLSX = await import('xlsx')
  const pm = Object.fromEntries(products.map(p => [p.id, p]))

  const ventas = [...sales]
    .sort((a, b) => new Date(a.sold_at) - new Date(b.sold_at))
    .map(s => {
      const p = pm[s.product_id]
      const precio = num(s.price_at_sale ?? p?.price)
      const costo  = num(s.buy_price_at_sale ?? p?.buy_price)
      return {
        'Fecha': fecha(s.sold_at),
        'Producto': p?.name ?? 'Producto eliminado',
        'Código': p?.code ?? '',
        'Categoría': p?.category ?? '',
        'Vendedor': s.seller ?? '',
        'Precio venta (Bs)': precio,
        'Costo (Bs)': costo,
        'Ganancia (Bs)': num(precio - costo),
      }
    })

  const compras = [...entradas]
    .sort((a, b) => new Date(a.entered_at) - new Date(b.entered_at))
    .map(e => {
      const p = pm[e.product_id]
      return {
        'Fecha': fecha(e.entered_at),
        'Producto': p?.name ?? 'Producto eliminado',
        'Código': p?.code ?? '',
        'Categoría': p?.category ?? '',
        'Proveedor': e.proveedor ?? '',
        'Cantidad': Number(e.cantidad) || 0,
        'Costo unitario (Bs)': num(e.buy_price),
        'Total (Bs)': num((Number(e.cantidad) || 0) * (Number(e.buy_price) || 0)),
      }
    })

  const soldMap = {}, enteredMap = {}
  sales.forEach(s => { soldMap[s.product_id] = (soldMap[s.product_id] || 0) + 1 })
  entradas.forEach(e => { enteredMap[e.product_id] = (enteredMap[e.product_id] || 0) + (Number(e.cantidad) || 0) })
  const productos = products.map(p => {
    const stock = (Number(p.initial_stock) || 0) + (enteredMap[p.id] || 0) - (soldMap[p.id] || 0)
    return {
      'Producto': p.name,
      'Código': p.code ?? '',
      'Categoría': p.category ?? '',
      'Precio venta (Bs)': num(p.price),
      'Precio compra (Bs)': num(p.buy_price),
      'Stock inicial': Number(p.initial_stock) || 0,
      'Entradas (uds.)': enteredMap[p.id] || 0,
      'Vendidos': soldMap[p.id] || 0,
      'Stock actual': stock,
      'Estado': p.archived ? 'Archivado' : stock <= 0 ? 'Agotado' : 'Activo',
    }
  })

  // Resumen por mes: ventas de todos los vendedores + gastos en entradas
  const months = {}
  const get = k => months[k] || (months[k] = { 'Mes': k, 'Ventas (uds.)': 0, 'Ingresos (Bs)': 0, 'Ganancia (Bs)': 0, 'Gastos en entradas (Bs)': 0 })
  ventas.forEach(v => { const m = get(monthKey(v['Fecha'])); m['Ventas (uds.)']++; m['Ingresos (Bs)'] += v['Precio venta (Bs)']; m['Ganancia (Bs)'] += v['Ganancia (Bs)'] })
  compras.forEach(c => { get(monthKey(c['Fecha']))['Gastos en entradas (Bs)'] += c['Total (Bs)'] })
  const resumen = Object.values(months)
    .sort((a, b) => a['Mes'].localeCompare(b['Mes']))
    .map(m => ({
      ...m,
      'Ingresos (Bs)': num(m['Ingresos (Bs)']),
      'Ganancia (Bs)': num(m['Ganancia (Bs)']),
      'Gastos en entradas (Bs)': num(m['Gastos en entradas (Bs)']),
      'Balance (Bs)': num(m['Ingresos (Bs)'] - m['Gastos en entradas (Bs)']),
    }))

  const wb = XLSX.utils.book_new()
  const add = (rows, name, headers) => {
    const ws = rows.length
      ? XLSX.utils.json_to_sheet(rows, { cellDates: true, dateNF: 'dd/mm/yyyy hh:mm' })
      : XLSX.utils.aoa_to_sheet([headers])
    ws['!cols'] = autoWidth(rows)
    XLSX.utils.book_append_sheet(wb, ws, name)
  }
  add(resumen,   'Resumen mensual', ['Mes'])
  add(ventas,    'Ventas',          ['Fecha', 'Producto'])
  add(compras,   'Entradas',        ['Fecha', 'Producto'])
  add(productos, 'Productos',       ['Producto'])

  const today = new Date()
  const stamp = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`
  XLSX.writeFile(wb, `respaldo-cablespro-${stamp}.xlsx`, { cellDates: true })
}
