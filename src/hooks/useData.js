import { useState, useEffect, useCallback, useRef, useMemo } from 'react'
import { supabase } from '../lib/supabase'
import { computeLots, nextLot } from '../lib/lots'

const PRODUCT_FIELDS_BASE = 'id,name,model,category,specs,price,buy_price,initial_stock,installments,code,image_url,created_at'
const PRODUCT_FIELDS      = PRODUCT_FIELDS_BASE + ',archived'
const ENTRADA_FIELDS_BASE = 'id,product_id,cantidad,buy_price,entered_at'
const ENTRADA_FIELDS      = ENTRADA_FIELDS_BASE + ',proveedor'
const PROV_FIELDS_BASE    = 'id,nombre,telefono,notas,created_at'
const PROV_EXTRA          = ['tipo', 'contacto', 'direccion', 'ciudad', 'maps_url', 'horario', 'web', 'metodos_pago', 'tiempo_entrega', 'compra_minima', 'hace_envios', 'calificacion']
const PROV_FIELDS         = PROV_FIELDS_BASE + ',' + PROV_EXTRA.join(',')

// 'YYYY-MM-DD' → ISO. Si es hoy usa la hora actual; si es otro día, mediodía local (evita saltos de zona horaria)
function dateToIso(fecha) {
  if (!fecha) return new Date().toISOString()
  const [y, m, d] = fecha.split('-').map(Number)
  const now = new Date()
  if (y === now.getFullYear() && m === now.getMonth() + 1 && d === now.getDate()) return now.toISOString()
  return new Date(y, m - 1, d, 12).toISOString()
}

export function useData() {
  const [products, setProducts]   = useState([])
  const [sales,    setSales]      = useState([])
  const [entradas, setEntradas]   = useState([])
  const [loading,  setLoading]    = useState(true)
  const [canArchive, setCanArchive] = useState(true) // false si falta la columna "archived" en Supabase
  const [canProveedor, setCanProveedor] = useState(true) // false si falta la columna "proveedor" en entradas
  const [proveedores, setProveedores] = useState([])
  const [canProveedores, setCanProveedores] = useState(true) // false si falta la tabla "proveedores"
  const [provExtra, setProvExtra] = useState(true)            // false si faltan las columnas extra de proveedores

  // ── Fetch inicial (ÚNICA llamada a la API al cargar) ──────────
  const fetchAll = useCallback(async () => {
    setLoading(true)
    const [
      prodsRes,
      { data: salesData },
      entradasRes,
      provRes,
    ] = await Promise.all([
      supabase.from('productos').select(PRODUCT_FIELDS).order('created_at', { ascending: false }),
      supabase.from('ventas').select('id,product_id,sold_at,seller,price_at_sale,buy_price_at_sale').order('sold_at', { ascending: false }),
      supabase.from('entradas').select(ENTRADA_FIELDS).order('entered_at', { ascending: false }),
      supabase.from('proveedores').select(PROV_FIELDS).order('nombre'),
    ])
    if (provRes.error) {
      // Puede faltar la tabla entera o solo las columnas extra
      const { data, error } = await supabase.from('proveedores').select(PROV_FIELDS_BASE).order('nombre')
      if (error) setCanProveedores(false)
      else { setProveedores(data || []); setProvExtra(false) }
    } else setProveedores(provRes.data || [])
    let prods = prodsRes.data
    // Si la columna "archived" aún no existe en Supabase, reintenta sin ella
    if (prodsRes.error) {
      const { data } = await supabase.from('productos').select(PRODUCT_FIELDS_BASE).order('created_at', { ascending: false })
      prods = (data || []).map(p => ({ ...p, archived: false }))
      setCanArchive(false)
    }
    let entradasData = entradasRes.data
    // Igual para la columna "proveedor" de entradas
    if (entradasRes.error) {
      const { data } = await supabase.from('entradas').select(ENTRADA_FIELDS_BASE).order('entered_at', { ascending: false })
      entradasData = (data || []).map(e => ({ ...e, proveedor: null }))
      setCanProveedor(false)
    }
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
        .select(PRODUCT_FIELDS)
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

  // ── Archivado ──────────────────────────────────────────────────
  // Archivado manual (solo para productos con stock; los agotados se archivan solos, ver isArchived)
  async function setArchived(id, archived) {
    if (!canArchive) throw new Error('Falta crear la columna "archived" en Supabase. Ejecuta migration-archivados.sql en el SQL Editor.')
    const { error } = await supabase.from('productos').update({ archived }).eq('id', id)
    if (error) throw error
    setProducts(prev => prev.map(p => p.id === id ? { ...p, archived } : p))
  }

  // Versión automática (tras una entrada): un fallo aquí no debe anular la operación principal
  async function autoArchive(id, archived) {
    try { await setArchived(id, archived) }
    catch (err) { console.warn('No se pudo actualizar el archivado:', err.message) }
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
  // extra: { proveedor, fecha: 'YYYY-MM-DD' } (opcionales)
  async function registerEntrada(productId, quantity, newBuyPrice, updateSellPrice = null, extra = {}) {
    const qty  = parseInt(quantity)
    const cost = parseFloat(newBuyPrice)

    const row = { product_id: productId, cantidad: qty, buy_price: cost, entered_at: dateToIso(extra.fecha) }
    if (canProveedor) row.proveedor = extra.proveedor?.trim() || null

    const { data, error: errEntrada } = await supabase
      .from('entradas')
      .insert([row])
      .select(canProveedor ? ENTRADA_FIELDS : ENTRADA_FIELDS_BASE)
      .single()
    if (errEntrada) throw errEntrada

    // Actualización optimista: agrega la entrada al estado local
    setEntradas(prev => [data, ...prev])

    // Si el producto estaba archivado, vuelve a estar activo al recibir mercadería
    if (productMap[productId]?.archived) await autoArchive(productId, false)

    // Si se quiere actualizar el precio de venta, actualizarlo también optimistamente
    if (updateSellPrice !== null && updateSellPrice !== '') {
      const newPrice = parseFloat(updateSellPrice)
      const { error: errUpdate } = await supabase
        .from('productos').update({ price: newPrice }).eq('id', productId)
      if (errUpdate) throw errUpdate
      setProducts(prev => prev.map(p => p.id === productId ? { ...p, price: newPrice } : p))
    }
  }

  // ── Proveedores ───────────────────────────────────────────────
  function provError() {
    return new Error('Falta crear la tabla de proveedores. Ejecuta migration-proveedores-tabla.sql en el SQL Editor de Supabase.')
  }

  async function saveProveedor(form) {
    if (!canProveedores) throw provError()
    const payload = {
      nombre:   form.nombre.trim(),
      telefono: form.telefono?.trim() || null,
      notas:    form.notas?.trim() || null,
    }
    if (provExtra) {
      PROV_EXTRA.forEach(k => {
        if (form[k] === undefined) return
        const v = form[k]
        payload[k] = typeof v === 'string' ? (v.trim() || null) : v
      })
      if (payload.calificacion != null) payload.calificacion = Number(payload.calificacion) || null
    }
    if (!payload.nombre) throw new Error('El nombre es obligatorio.')
    const dup = proveedores.find(p => p.nombre.toLowerCase() === payload.nombre.toLowerCase() && p.id !== form.id)
    if (dup) throw new Error(`Ya existe un proveedor llamado "${dup.nombre}".`)

    if (form.id) {
      const old = proveedores.find(p => p.id === form.id)
      const { error } = await supabase.from('proveedores').update(payload).eq('id', form.id)
      if (error) throw error
      setProveedores(prev => prev.map(p => p.id === form.id ? { ...p, ...payload } : p).sort((a, b) => a.nombre.localeCompare(b.nombre)))
      // Si cambió el nombre, actualiza también las entradas que lo usaban
      if (old && old.nombre !== payload.nombre && canProveedor) {
        const { error: errE } = await supabase.from('entradas').update({ proveedor: payload.nombre }).eq('proveedor', old.nombre)
        if (errE) throw errE
        setEntradas(prev => prev.map(e => e.proveedor === old.nombre ? { ...e, proveedor: payload.nombre } : e))
      }
      return { ...old, ...payload }
    }
    const { data, error } = await supabase.from('proveedores').insert([payload])
      .select(provExtra ? PROV_FIELDS : PROV_FIELDS_BASE).single()
    if (error) throw error
    setProveedores(prev => [...prev, data].sort((a, b) => a.nombre.localeCompare(b.nombre)))
    return data
  }

  // Borra el proveedor de la lista; las entradas conservan el nombre como texto
  async function deleteProveedor(id) {
    if (!canProveedores) throw provError()
    const { error } = await supabase.from('proveedores').delete().eq('id', id)
    if (error) throw error
    setProveedores(prev => prev.filter(p => p.id !== id))
  }

  async function deleteEntrada(id) {
    const { error } = await supabase.from('entradas').delete().eq('id', id)
    if (error) throw error
    // Actualización optimista
    setEntradas(prev => prev.filter(e => e.id !== id))
  }

  // extra: { proveedor, fecha: 'YYYY-MM-DD' } (opcionales)
  async function updateEntrada(id, quantity, buyPrice, extra = {}) {
    const updates = { cantidad: parseInt(quantity), buy_price: parseFloat(buyPrice) }
    if (extra.fecha) updates.entered_at = dateToIso(extra.fecha)
    if (canProveedor && extra.proveedor !== undefined) updates.proveedor = extra.proveedor?.trim() || null
    const { error } = await supabase.from('entradas').update(updates).eq('id', id)
    if (error) throw error
    // Actualización optimista
    setEntradas(prev => prev.map(e => e.id === id ? { ...e, ...updates } : e))
  }

  // ── Lotes y costo FIFO (ver src/lib/lots.js) ─────────────────
  function getLots(productId) {
    return computeLots(productMap[productId], entradas, sales)
  }

  // Costo del lote del que sale la próxima venta (el más antiguo que aún tiene unidades)
  function getFifoCost(productId) {
    const product = productMap[productId]
    if (!product) return 0
    const lot = nextLot(getLots(productId))
    return lot ? lot.cost : (Number(product.buy_price) || 0)
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

  // ── Datos derivados (memoizados — solo recalculan si el array cambia) ──
  const soldMap = useMemo(() => sales.reduce((acc, s) => {
    acc[s.product_id] = (acc[s.product_id] || 0) + 1
    return acc
  }, {}), [sales])

  const enteredMap = useMemo(() => entradas.reduce((acc, e) => {
    acc[e.product_id] = (acc[e.product_id] || 0) + (Number(e.cantidad) || 0)
    return acc
  }, {}), [entradas])

  // productMap: O(1) lookup por id (evita .find() repetido en las páginas)
  const productMap = useMemo(() => Object.fromEntries(products.map(p => [p.id, p])), [products])

  function stockOf(product) {
    if (!product) return 0
    return (Number(product.initial_stock) || 0) + (enteredMap[product.id] || 0) - (soldMap[product.id] || 0)
  }

  // Archivado efectivo: archivado a mano, o agotado (stock 0). Al entrar mercadería deja de estarlo solo.
  function isArchived(product) {
    return !!product?.archived || stockOf(product) <= 0
  }

  const totalProfit = useMemo(() => sales.reduce((acc, s) => {
    return acc + ((s.price_at_sale ?? 0) - (s.buy_price_at_sale ?? 0))
  }, 0), [sales])

  const totalRevenue = useMemo(() => sales.reduce((acc, s) => acc + (s.price_at_sale ?? 0), 0), [sales])

  return {
    products, sales, entradas, loading,
    saveProduct, deleteProduct, uploadImage, setArchived, isArchived, canArchive, canProveedor,
    registerEntrada, deleteEntrada, updateEntrada,
    proveedores, canProveedores, provExtra, saveProveedor, deleteProveedor,
    registerSale, undoLastSale, undoSaleById, getFifoCost, getLots,
    soldMap, enteredMap, stockOf, totalProfit, totalRevenue,
    productMap,          // Map id→producto para lookups O(1)
    refresh: fetchAll,   // disponible si se necesita un refresh manual
  }
}
