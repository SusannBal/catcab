// ─── Lotes de un producto (FIFO exacto) ───────────────────────────
// Cada producto tiene lotes: el stock inicial y cada entrada, cada uno con su costo.
// Cada venta guarda el costo con que se registró (buy_price_at_sale), así que se
// descuenta del lote más antiguo que tenga ESE costo y aún tenga unidades.
// Si no hay ninguno con ese costo (ventas antiguas o costos editados), se descuenta
// del lote más antiguo con unidades (FIFO normal).

const sameCost = (a, b) => Math.round(Number(a) * 100) === Math.round(Number(b) * 100)

export function computeLots(product, entradas = [], sales = []) {
  if (!product) return []
  const lots = []

  const initial = Number(product.initial_stock) || 0
  if (initial > 0) {
    lots.push({
      key: 'inicial', label: 'Stock inicial', isInitial: true,
      date: new Date(product.created_at || 0), qty: initial,
      cost: Number(product.buy_price) || 0, sold: 0,
    })
  }

  entradas
    .filter(e => e.product_id === product.id)
    .sort((a, b) => new Date(a.entered_at) - new Date(b.entered_at))
    .forEach((e, i) => lots.push({
      key: e.id, label: `Entrada ${i + 1}`, isInitial: false,
      date: new Date(e.entered_at), qty: Number(e.cantidad) || 0,
      cost: Number(e.buy_price) || 0, sold: 0, proveedor: e.proveedor || null,
    }))

  sales
    .filter(s => s.product_id === product.id)
    .sort((a, b) => new Date(a.sold_at) - new Date(b.sold_at))
    .forEach(s => {
      const hasCost = s.buy_price_at_sale !== null && s.buy_price_at_sale !== undefined
      const lot =
        (hasCost && lots.find(l => l.sold < l.qty && sameCost(l.cost, s.buy_price_at_sale))) ||
        lots.find(l => l.sold < l.qty)
      if (lot) lot.sold++
    })

  return lots.map(l => ({ ...l, remaining: l.qty - l.sold }))
}

// Lote del que debería salir la próxima venta (el más antiguo con unidades)
export function nextLot(lots) {
  return lots.find(l => l.remaining > 0) || null
}

// Lotes con unidades, agrupados por costo y en orden FIFO (para elegir en la venta)
export function availableByCost(lots) {
  const groups = []
  lots.filter(l => l.remaining > 0).forEach(l => {
    const g = groups.find(g => sameCost(g.cost, l.cost))
    if (g) { g.remaining += l.remaining; g.labels.push(l.label) }
    else groups.push({ cost: l.cost, remaining: l.remaining, labels: [l.label], date: l.date })
  })
  return groups
}

// Valor al costo de lo que queda en stock
export function remainingValue(lots) {
  return lots.reduce((a, l) => a + Math.max(0, l.remaining) * l.cost, 0)
}
