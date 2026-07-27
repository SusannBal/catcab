import { useState, useEffect, useCallback, useRef } from 'react'
import { supabase } from '../lib/supabase'

export function useData() {
  const [products, setProducts]   = useState([])
  const [sales,    setSales]      = useState([])
  const [entradas, setEntradas]   = useState([])
  const [loading,  setLoading]    = useState(true)

  const fetchAll = useCallback(async () => {
    setLoading(true)
    const [
      { data: prods },
      { data: salesData },
      { data: entradasData }
    ] = await Promise.all([
      supabase.from('productos').select('id,name,model,category,specs,price,buy_price,initial_stock,installments,code,image_url,created_at').order('created_at', { ascending: false }),
      supabase.from('ventas').select('id,product_id,sold_at,seller,price_at_sale,buy_price_at_sale').order('sold_at', { ascending: false }),
      supabase.from('entradas').select('id,product_id,cantidad,buy_price,entered_at').order('entered_at', { ascending: false })
    ])
    setProducts(prods || [])
    setSales(salesData || [])
    setEntradas(entradasData || [])
    setLoading(false)
  }, []) // sin dependencias → referencia estable, nunca se recrea

  // Ref para garantizar que el fetch inicial corre solo UNA vez (Strict Mode / dev)
  const didFetch = useRef(false)
  useEffect(() => {
    if (didFetch.current) return
    didFetch.current = true
    fetchAll()
  }, [fetchAll])

  // ── Products ──────────────────────────────────────────────
  async function saveProduct(form) {
    const payload = {
      name:         form.name,
      model:        form.model || null,
      category:     form.category,
      specs:        form.specs || null,
      price:        parseFloat(form.price),
      buy_price:    form.buy_price ? parseFloat(form.buy_price) : null,
      initial_stock: form.initial_stock ? parseInt(form.initial_stock) : 0,
      installments: form.installments || null,
      code:         form.code || null,
      image_url:    form.image_url || null,
    }
    if (form.id) {
      const { error } = await supabase.from('productos').update(payload).eq('id', form.id)
      if (error) throw error
    } else {
      const { error } = await supabase.from('productos')
        .insert([{ ...payload, created_at: new Date().toISOString() }])
      if (error) throw error
    }
    await fetchAll()
  }

  async function deleteProduct(id) {
    await supabase.from('ventas').delete().eq('product_id', id)
    await supabase.from('entradas').delete().eq('product_id', id)
    const { error } = await supabase.from('productos').delete().eq('id', id)
    if (error) throw error
    await fetchAll()
  }

  async function uploadImage(file) {
    const ext      = file.name.split('.').pop()
    const filename = `${Date.now()}.${ext}`
    const { error } = await supabase.storage.from('productos').upload(filename, file, {
      upsert: true,
      cacheControl: '31536000', // 1 año de caché — seguro porque el filename incluye Date.now()
    })
    if (error) throw error
    const { data } = supabase.storage.from('productos').getPublicUrl(filename)
    return data.publicUrl
  }

  // ── Entradas (Stock Entry) ────────────────────────────────


  async function deleteEntrada(id) {
    const { error } = await supabase.from('entradas').delete().eq('id', id)
    if (error) throw error
    await fetchAll()
  }

  async function registerEntrada(productId, quantity, newBuyPrice, updateSellPrice = null) {
    const qty = parseInt(quantity)
    const cost = parseFloat(newBuyPrice)
    
    const { error: errEntrada } = await supabase.from('entradas').insert([{
      product_id: productId,
      cantidad: qty,
      buy_price: cost,
      entered_at: new Date().toISOString()
    }])
    if (errEntrada) throw errEntrada

    // IMPORTANTE: NO actualizamos buy_price en productos para no pisar el precio original
    // del stock inicial. El costo actual se lee siempre desde las entradas.
    // Solo actualizamos el precio de venta si el usuario lo indicó.
    if (updateSellPrice !== null && updateSellPrice !== '') {
      const { error: errUpdate } = await supabase.from('productos')
        .update({ price: parseFloat(updateSellPrice) })
        .eq('id', productId)
      if (errUpdate) throw errUpdate
    }

    await fetchAll()
  }


  async function updateEntrada(id, quantity, buyPrice) {
    const { error } = await supabase.from('entradas').update({
      cantidad: parseInt(quantity),
      buy_price: parseFloat(buyPrice),
    }).eq('id', id)
    if (error) throw error
    await fetchAll()
  }

  // ── Costo FIFO (First-In, First-Out) ──────────────────────
// Calcula el costo de compra usando FIFO (primeras entradas, primeras salidas)
function getFifoCost(productId) {
  const product = products.find(p => p.id === productId);
  if (!product) return 0;

  // Build purchase batches (initial stock + entradas) in chronological order
  const batches = [];
  // initial stock batch (if any)
  if ((Number(product.initial_stock) || 0) > 0) {
    batches.push({ qty: Number(product.initial_stock), cost: Number(product.buy_price) || 0 });
  }
  // stock entries (entradas) sorted by entry date
  const prodEntradas = entradas
    .filter(e => e.product_id === productId)
    .sort((a, b) => new Date(a.entered_at) - new Date(b.entered_at));
  for (const e of prodEntradas) {
    batches.push({ qty: Number(e.cantidad), cost: Number(e.buy_price) || 0 });
  }

  if (batches.length === 0) return Number(product.buy_price) || 0;

  // Sales for this product, sorted chronologically
  const prodSales = sales
    .filter(s => s.product_id === productId)
    .sort((a, b) => new Date(a.sold_at) - new Date(b.sold_at));

  let batchIdx = 0;
  let remaining = batches[0].qty;

  // Consume quantity for each previous sale (assuming 1 unit per sale)
  for (const _ of prodSales) {
    if (remaining > 0) {
      remaining--;
    }
    while (remaining === 0 && batchIdx < batches.length - 1) {
      batchIdx++;
      remaining = batches[batchIdx].qty;
      if (remaining > 0) break;
    }
  }

  // Cost for the next sale is the cost of the current batch
  return batchIdx < batches.length ? batches[batchIdx].cost : (Number(product.buy_price) || 0);
}


  // ── Sales ─────────────────────────────────────────────────
  async function registerSale(productId, seller = 'N', customPrice = null, customBuyCost = null) {
    const product = products.find(p => p.id === productId)
    if (!product) return

    const priceToSave = customPrice !== null && customPrice !== ''
      ? parseFloat(customPrice)
      : (product.price ?? 0)

    // Si se pasa un costo manual (ej. para CAB-09), úsalo; si no, usa FIFO
    const buyPriceToSave = customBuyCost !== null ? parseFloat(customBuyCost) : getFifoCost(productId)

    const { error } = await supabase.from('ventas').insert([{
      product_id: productId,
      sold_at: new Date().toISOString(),
      seller,
      price_at_sale: priceToSave,
      buy_price_at_sale: buyPriceToSave
    }])
    if (error) throw error
    await fetchAll()
  }

  async function undoLastSale(productId) {
    // find the most recent sale for this product
    const last = sales.find(s => s.product_id === productId)
    if (!last) return
    const { error } = await supabase.from('ventas').delete().eq('id', last.id)
    if (error) throw error
    await fetchAll()
  }

  // ── Derived data ──────────────────────────────────────────
  // units sold per product
  const soldMap = sales.reduce((acc, s) => {
    acc[s.product_id] = (acc[s.product_id] || 0) + 1
    return acc
  }, {})

  // units entered per product
  const enteredMap = entradas.reduce((acc, e) => {
    acc[e.product_id] = (acc[e.product_id] || 0) + (Number(e.cantidad) || 0)
    return acc
  }, {})

  // current stock = initial_stock + entered - sold
  function stockOf(product) {
    if (!product) return 0
    return (Number(product.initial_stock) || 0) + (enteredMap[product.id] || 0) - (soldMap[product.id] || 0)
  }

  // total profit across all sales (using historical buy price and sale price)
  const totalProfit = sales.reduce((acc, s) => {
    const salePrice = s.price_at_sale ?? 0
    const buyPrice = s.buy_price_at_sale ?? 0
    return acc + (salePrice - buyPrice)
  }, 0)

  // total revenue
  const totalRevenue = sales.reduce((acc, s) => {
    return acc + (s.price_at_sale ?? 0)
  }, 0)

  return {
    products, sales, entradas, loading,
    saveProduct, deleteProduct, uploadImage,
    registerEntrada, deleteEntrada, updateEntrada,
    registerSale, undoLastSale, getFifoCost,
    soldMap, enteredMap, stockOf, totalProfit, totalRevenue,
    refresh: fetchAll,
  }
}
