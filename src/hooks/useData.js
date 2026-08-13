import { useState, useEffect, useCallback, useRef } from 'react'
import { supabase } from '../lib/supabase'

export function useData() {
  const [products, setProducts]   = useState([])
  const [sales,    setSales]      = useState([])
  const [entradas, setEntradas]   = useState([])
  const [loading,  setLoading]    = useState(true)

  // ── Fetch inicial (ÚNICA llamada a la API al cargar) ──────────
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
  }, [])

  // Corre solo UNA vez al montar (evita doble fetch en React Strict Mode)
  const didFetch = useRef(false)
  useEffect(() => {
    if (didFetch.current) return
    didFetch.current = true
    fetchAll()
  }, [fetchAll])

  // ── Products ───────────────────────────────────────────────────
  async function saveProduct(form) {
    const payload = {
      name:          form.name,
      model:         form.model || null,
      category:      form.category,
      specs:         form.specs || null,
      price:         parseFloat(form.price),
      buy_price:     form.buy_price ? parseFloat(form.buy_price) : null,
      initial_stock: form.initial_stock ? parseInt(form.initial_stock) : 0,
      installments:  form.installments || null,
      code:          form.code || null,
      image_url:     form.image_url || null,
    }

    if (form.id) {
      // EDITAR → actualización optimista: reemplaza el producto en el estado local
      const { error } = await supabase.from('productos').update(payload).eq('id', form.id)
      if (error) throw error
      setProducts(prev => prev.map(p => p.id === form.id ? { ...p, ...payload } : p))
    } else {
      // CREAR → obtiene la fila completa del servidor (necesitamos el id y created_at generados)
      const { data, error } = await supabase
        .from('productos')
        .insert([{ ...payload, created_at: new Date().toISOString() }])
        .select('id,name,model,category,specs,price,buy_price,initial_stock,installments,code,image_url,created_at')
        .single()
      if (error) throw error
      setProducts(prev => [data, ...prev])
    }
  }

  async function deleteProduct(id) {
    // Borrar en cascada (ventas y entradas asociadas)
    await supabase.from('ventas').delete().eq('product_id', id)
    await supabase.from('entradas').delete().eq('product_id', id)
    const { error } = await supabase.from('productos').delete().eq('id', id)
    if (error) throw error
    // Actualización optimista: remove de los tres estados locales
    setProducts(prev  => prev.filter(p => p.id !== id))
    setSales(prev     => prev.filter(s => s.product_id !== id))
    setEntradas(prev  => prev.filter(e => e.product_id !== id))
  }

  // ── Compresión + Upload de imágenes ───────────────────────────
  // Comprime la imagen en el cliente (máx 800px, JPEG 75%) antes de subir
  async function compressImage(file, maxPx = 800, quality = 0.75) {
    return new Promise((resolve, reject) => {
      const img = new Image()
      const url = URL.createObjectURL(file)
      img.onload = () => {
        URL.revokeObjectURL(url)
        let { width, height } = img
        if (width > maxPx || height > maxPx) {
          if (width > height) { height = Math.round(height * maxPx / width); width = maxPx }
          else                { width  = Math.round(width  * maxPx / height); height = maxPx }
        }
        const canvas  = document.createElement('canvas')
        canvas.width  = width
        canvas.height = height
        canvas.getContext('2d').drawImage(img, 0, 0, width, height)
        canvas.toBlob(blob => {
          if (!blob) { reject(new Error('No se pudo comprimir la imagen')); return }
          resolve(new File([blob], file.name.replace(/\.[^.]+$/, '.jpg'), { type: 'image/jpeg' }))
        }, 'image/jpeg', quality)
      }
      img.onerror = reject
      img.src = url
    })
  }

  async function uploadImage(file) {
    const compressed = await compressImage(file)
    const filename   = `${Date.now()}.jpg`
    const { error }  = await supabase.storage.from('productos').upload(filename, compressed, {
      upsert:       true,
      cacheControl: '31536000', // 1 año → el navegador no vuelve a descargar la misma imagen
      contentType:  'image/jpeg',
    })
    if (error) throw error
    const { data } = supabase.storage.from('productos').getPublicUrl(filename)
    return data.publicUrl
  }

  // ── Entradas ──────────────────────────────────────────────────
  async function registerEntrada(productId, quantity, newBuyPrice, updateSellPrice = null) {
    const qty  = parseInt(quantity)
    const cost = parseFloat(newBuyPrice)

    const { data, error: errEntrada } = await supabase
      .from('entradas')
      .insert([{ product_id: productId, cantidad: qty, buy_price: cost, entered_at: new Date().toISOString() }])
      .select('id,product_id,cantidad,buy_price,entered_at')
      .single()
    if (errEntrada) throw errEntrada

    // Actualización optimista: agrega la entrada al estado local
    setEntradas(prev => [data, ...prev])

    // Si se quiere actualizar el precio de venta, actualizarlo también optimistamente
    if (updateSellPrice !== null && updateSellPrice !== '') {
      const newPrice = parseFloat(updateSellPrice)
      const { error: errUpdate } = await supabase
        .from('productos').update({ price: newPrice }).eq('id', productId)
      if (errUpdate) throw errUpdate
      setProducts(prev => prev.map(p => p.id === productId ? { ...p, price: newPrice } : p))
    }
  }

  async function deleteEntrada(id) {
    const { error } = await supabase.from('entradas').delete().eq('id', id)
    if (error) throw error
    // Actualización optimista
    setEntradas(prev => prev.filter(e => e.id !== id))
  }

  async function updateEntrada(id, quantity, buyPrice) {
    const updates = { cantidad: parseInt(quantity), buy_price: parseFloat(buyPrice) }
    const { error } = await supabase.from('entradas').update(updates).eq('id', id)
    if (error) throw error
    // Actualización optimista
    setEntradas(prev => prev.map(e => e.id === id ? { ...e, ...updates } : e))
  }

  // ── Costo FIFO (First-In, First-Out) ──────────────────────────
  function getFifoCost(productId) {
    const product = products.find(p => p.id === productId)
    if (!product) return 0

    const batches = []
    if ((Number(product.initial_stock) || 0) > 0) {
      batches.push({ qty: Number(product.initial_stock), cost: Number(product.buy_price) || 0 })
    }
    const prodEntradas = entradas
      .filter(e => e.product_id === productId)
      .sort((a, b) => new Date(a.entered_at) - new Date(b.entered_at))
    for (const e of prodEntradas) {
      batches.push({ qty: Number(e.cantidad), cost: Number(e.buy_price) || 0 })
    }

    if (batches.length === 0) return Number(product.buy_price) || 0

    const prodSales = sales
      .filter(s => s.product_id === productId)
      .sort((a, b) => new Date(a.sold_at) - new Date(b.sold_at))

    let batchIdx  = 0
    let remaining = batches[0].qty

    for (const _ of prodSales) {
      if (remaining > 0) remaining--
      while (remaining === 0 && batchIdx < batches.length - 1) {
        batchIdx++
        remaining = batches[batchIdx].qty
        if (remaining > 0) break
      }
    }

    return batchIdx < batches.length ? batches[batchIdx].cost : (Number(product.buy_price) || 0)
  }

  // ── Sales ──────────────────────────────────────────────────────
  async function registerSale(productId, seller = 'N', customPrice = null, customBuyCost = null) {
    const product = products.find(p => p.id === productId)
    if (!product) return

    const priceToSave    = customPrice !== null && customPrice !== ''
      ? parseFloat(customPrice) : (product.price ?? 0)
    const buyPriceToSave = customBuyCost !== null
      ? parseFloat(customBuyCost) : getFifoCost(productId)

    const { data, error } = await supabase
      .from('ventas')
      .insert([{
        product_id:        productId,
        sold_at:           new Date().toISOString(),
        seller,
        price_at_sale:     priceToSave,
        buy_price_at_sale: buyPriceToSave,
      }])
      .select('id,product_id,sold_at,seller,price_at_sale,buy_price_at_sale')
      .single()
    if (error) throw error

    // Actualización optimista: agrega la venta al estado local (más reciente primero)
    setSales(prev => [data, ...prev])
  }

  // Deshace una venta específica por su ID exacto
  async function undoSaleById(saleId) {
    if (!saleId) return
    const { error } = await supabase.from('ventas').delete().eq('id', saleId)
    if (error) throw error
    // Actualización optimista
    setSales(prev => prev.filter(s => s.id !== saleId))
  }

  // Compatibilidad: elimina la venta más reciente del producto
  async function undoLastSale(productId) {
    const last = sales.find(s => s.product_id === productId)
    if (!last) return
    await undoSaleById(last.id)
  }

  // ── Datos derivados (calculados localmente, sin llamadas extra) ─
  const soldMap = sales.reduce((acc, s) => {
    acc[s.product_id] = (acc[s.product_id] || 0) + 1
    return acc
  }, {})

  const enteredMap = entradas.reduce((acc, e) => {
    acc[e.product_id] = (acc[e.product_id] || 0) + (Number(e.cantidad) || 0)
    return acc
  }, {})

  function stockOf(product) {
    if (!product) return 0
    return (Number(product.initial_stock) || 0) + (enteredMap[product.id] || 0) - (soldMap[product.id] || 0)
  }

  const totalProfit = sales.reduce((acc, s) => {
    return acc + ((s.price_at_sale ?? 0) - (s.buy_price_at_sale ?? 0))
  }, 0)

  const totalRevenue = sales.reduce((acc, s) => acc + (s.price_at_sale ?? 0), 0)

  return {
    products, sales, entradas, loading,
    saveProduct, deleteProduct, uploadImage,
    registerEntrada, deleteEntrada, updateEntrada,
    registerSale, undoLastSale, undoSaleById, getFifoCost,
    soldMap, enteredMap, stockOf, totalProfit, totalRevenue,
    refresh: fetchAll,  // disponible si se necesita un refresh manual
  }
}
