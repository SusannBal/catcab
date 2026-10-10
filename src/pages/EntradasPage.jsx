import { useMemo, useState } from 'react'
import {
  PackagePlus, Search, Pencil, Trash2, Check, X, AlertTriangle, CheckCircle2,
  Truck, Calendar, Package, Wallet, Layers,
} from 'lucide-react'
import { Btn, Field, Input, Spinner, Badge } from '../components/UI'
import ProveedoresSection, { ProveedorSelect, useProveedorNames } from './ProveedoresSection'

// Fecha local 'YYYY-MM-DD' (para inputs type="date")
function ymd(d) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}
function fmtBs(n) { return `Bs. ${(Number(n) || 0).toFixed(2)}` }
function monthKey(d) { return ymd(d).slice(0, 7) }
function monthLabel(key) {
  const [y, m] = key.split('-').map(Number)
  const s = new Date(y, m - 1, 1).toLocaleDateString('es', { month: 'long', year: 'numeric' })
  return s.charAt(0).toUpperCase() + s.slice(1)
}

const card = {
  background: 'var(--surface)', border: '1.5px solid var(--gray-100)',
  borderRadius: 'var(--radius-md)', boxShadow: 'var(--shadow)', minWidth: 0,
}
const stepTitle = {
  display: 'flex', alignItems: 'center', gap: 8, fontSize: 11, fontWeight: 800,
  textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--gray-600)', marginBottom: 10,
}
const stepNum = {
  width: 20, height: 20, borderRadius: 99, background: 'var(--accent)', color: '#111',
  display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 900, flexShrink: 0,
}

function Thumb({ src, size = 40 }) {
  return (
    <div style={{
      width: size, height: size, borderRadius: 8, flexShrink: 0, overflow: 'hidden',
      background: 'var(--gray-50)', border: '1px solid var(--gray-100)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
    }}>
      {src
        ? <img src={src} alt="" loading="lazy" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
        : <Package size={size * 0.4} style={{ color: 'var(--gray-300)' }} />}
    </div>
  )
}

function MiniStat({ icon, label, value, color }) {
  return (
    <div style={{ ...card, padding: '12px 14px', display: 'flex', alignItems: 'center', gap: 10 }}>
      <span style={{ color: color || 'var(--gray-600)', display: 'flex' }}>{icon}</span>
      <div style={{ minWidth: 0 }}>
        <p style={{ fontSize: 9, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--gray-500)' }}>{label}</p>
        <p style={{ fontSize: 16, fontWeight: 900, color: color || 'var(--text)', whiteSpace: 'nowrap' }}>{value}</p>
      </div>
    </div>
  )
}

export default function EntradasPage({
  products, entradas = [], registerEntrada, deleteEntrada, updateEntrada, loading, stockOf, isArchived, canProveedor = true,
  proveedores: savedProveedores = [], canProveedores = false, provExtra = false, saveProveedor, deleteProveedor,
}) {
  const [view, setView] = useState('registrar') // 'registrar' | 'proveedores'
  const [search, setSearch] = useState('')
  const [selectedProductId, setSelectedProductId] = useState('')
  const [quantity, setQuantity] = useState('')
  const [buyPrice, setBuyPrice] = useState('')
  const [updateSellPrice, setUpdateSellPrice] = useState('')
  const [proveedor, setProveedor] = useState('')
  const [fecha, setFecha] = useState(() => ymd(new Date()))
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [toast, setToast] = useState(null) // { type: 'success'|'error', text: '' }

  // Historial
  const [histSearch, setHistSearch] = useState('')
  const [limit, setLimit] = useState(20)
  const [editingId, setEditingId] = useState(null)
  const [editQty, setEditQty] = useState('')
  const [editCost, setEditCost] = useState('')
  const [editProv, setEditProv] = useState('')
  const [editFecha, setEditFecha] = useState('')

  function showToast(text, type = 'success') {
    setToast({ text, type })
    setTimeout(() => setToast(null), 3500)
  }

  const productMap = useMemo(() => Object.fromEntries(products.map(p => [p.id, p])), [products])

  // Proveedores para elegir: los guardados + los que ya aparecen en entradas
  const proveedores = useProveedorNames(savedProveedores, entradas)

  // Crea un proveedor desde el selector (si la tabla existe se guarda en la lista)
  async function createProveedor(nombre) {
    const existing = proveedores.find(n => n.toLowerCase() === nombre.toLowerCase())
    if (existing) return { nombre: existing }
    if (canProveedores) return await saveProveedor({ nombre })
    return { nombre }
  }

  // Resumen del mes actual
  const thisMonth = useMemo(() => {
    const key = monthKey(new Date())
    const list = entradas.filter(e => monthKey(new Date(e.entered_at)) === key)
    return {
      total: list.reduce((a, e) => a + (Number(e.cantidad) || 0) * (Number(e.buy_price) || 0), 0),
      units: list.reduce((a, e) => a + (Number(e.cantidad) || 0), 0),
      count: list.length,
    }
  }, [entradas])

  const q = search.toLowerCase()
  const filteredProducts = q ? products.filter(p =>
    p.name?.toLowerCase().includes(q) || p.code?.toLowerCase().includes(q)
  ).slice(0, 12) : []

  const selectedProduct = productMap[selectedProductId]
  const qtyN   = parseInt(quantity) || 0
  const costN  = parseFloat(buyPrice) || 0
  const priceN = parseFloat(updateSellPrice) || 0
  const total  = qtyN * costN
  const unitProfit = priceN && costN ? priceN - costN : null
  const currentPrice = selectedProduct?.price != null ? Number(selectedProduct.price) : null
  const priceChanged = updateSellPrice !== '' && currentPrice !== null && priceN !== currentPrice

  function selectProduct(p) {
    setSelectedProductId(p.id)
    setSearch('')
    setBuyPrice(p.buy_price ?? '')
    setUpdateSellPrice(p.price ?? '')
  }

  async function handleSubmit(e) {
    e.preventDefault()
    if (!selectedProductId || !quantity || !buyPrice) return

    setIsSubmitting(true)
    try {
      const wasArchived = isArchived(selectedProduct)
      // El precio de venta solo se actualiza si lo cambiaste
      await registerEntrada(selectedProductId, quantity, buyPrice, priceChanged ? updateSellPrice : null, { proveedor, fecha })
      setSelectedProductId('')
      setQuantity('')
      setBuyPrice('')
      setUpdateSellPrice('')
      setSearch('')
      showToast(wasArchived
        ? 'Entrada registrada. El producto salió de archivados y vuelve a estar activo.'
        : 'Entrada de mercadería registrada con éxito.')
    } catch (err) {
      showToast('Error al registrar: ' + err.message, 'error')
    } finally {
      setIsSubmitting(false)
    }
  }

  async function handleDelete(entradaId) {
    if (!window.confirm('¿Estás seguro de eliminar este registro de entrada?')) return
    try {
      await deleteEntrada(entradaId)
      showToast('Entrada eliminada correctamente')
    } catch (err) {
      showToast('Error al eliminar: ' + err.message, 'error')
    }
  }

  function startEditing(e) {
    setEditingId(e.id)
    setEditQty(e.cantidad)
    setEditCost(e.buy_price)
    setEditProv(e.proveedor || '')
    setEditFecha(ymd(new Date(e.entered_at)))
  }

  async function saveEdit(entradaId) {
    if (!editQty || !editCost) return
    try {
      const original = entradas.find(e => e.id === entradaId)
      const fechaCambio = original && editFecha !== ymd(new Date(original.entered_at)) ? editFecha : undefined
      await updateEntrada(entradaId, editQty, editCost, { proveedor: editProv, fecha: fechaCambio })
      setEditingId(null)
      showToast('Entrada actualizada con éxito')
    } catch (err) {
      showToast('Error al actualizar entrada: ' + err.message, 'error')
    }
  }

  // Historial filtrado y agrupado por mes
  const hq = histSearch.toLowerCase()
  const histFiltered = entradas.filter(e => !hq
    || productMap[e.product_id]?.name?.toLowerCase().includes(hq)
    || e.proveedor?.toLowerCase().includes(hq))
  const histVisible = histFiltered.slice(0, limit)
  const groups = []
  histVisible.forEach(e => {
    const key = monthKey(new Date(e.entered_at))
    let g = groups[groups.length - 1]
    if (!g || g.key !== key) { g = { key, items: [] }; groups.push(g) }
    g.items.push(e)
  })
  // Totales del mes con todas las entradas filtradas (no solo las visibles)
  const monthTotals = {}
  histFiltered.forEach(e => {
    const key = monthKey(new Date(e.entered_at))
    const t = monthTotals[key] || (monthTotals[key] = { total: 0, units: 0 })
    t.total += (Number(e.cantidad) || 0) * (Number(e.buy_price) || 0)
    t.units += Number(e.cantidad) || 0
  })

  if (loading) return <Spinner />

  return (
    <div style={{ padding: '20px var(--page-pad) 40px' }}>
      {/* Encabezado */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
        <PackagePlus size={20} style={{ color: 'var(--accent)' }} />
        <h2 style={{ fontSize: 18, fontWeight: 900 }}>Entradas de mercadería</h2>
      </div>
      <p style={{ fontSize: 12, color: 'var(--gray-500)', marginBottom: 16 }}>
        Registra lo que compras. Cada entrada suma stock y cuenta como gasto en el Dashboard.
      </p>

      <div style={{ display: 'inline-flex', gap: 4, padding: 4, background: 'var(--gray-100)', borderRadius: 10, marginBottom: 18 }}>
        {[
          { id: 'registrar',   label: 'Registrar entradas', icon: PackagePlus },
          { id: 'proveedores', label: `Proveedores (${proveedores.length})`, icon: Truck },
        ].map(t => {
          const Icon = t.icon
          const active = view === t.id
          return (
            <button key={t.id} onClick={() => setView(t.id)} style={{
              display: 'flex', alignItems: 'center', gap: 6, padding: '8px 14px', borderRadius: 8, border: 'none',
              fontSize: 13, fontWeight: 800,
              background: active ? 'var(--surface)' : 'transparent',
              color: active ? 'var(--text)' : 'var(--gray-600)',
              boxShadow: active ? 'var(--shadow)' : 'none',
            }}><Icon size={14} /> {t.label}</button>
          )
        })}
      </div>

      {view === 'proveedores' ? (
        <ProveedoresSection proveedores={savedProveedores} entradas={entradas} products={products}
          canProveedores={canProveedores} provExtra={provExtra} saveProveedor={saveProveedor} deleteProveedor={deleteProveedor} />
      ) : (<>

      {/* Resumen del mes */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: 10, marginBottom: 18 }} className="stat-grid">
        <MiniStat icon={<Wallet size={18} />} label="Gastado este mes" value={fmtBs(thisMonth.total)} color="var(--danger)" />
        <MiniStat icon={<Layers size={18} />} label="Unidades este mes" value={thisMonth.units} />
        <MiniStat icon={<PackagePlus size={18} />} label="Entradas este mes" value={thisMonth.count} />
        <MiniStat icon={<Truck size={18} />} label="Proveedores" value={proveedores.length} />
      </div>

      {/* Aviso */}
      {toast && (
        <div style={{
          padding: '12px 16px', borderRadius: 'var(--radius-sm)', marginBottom: 16,
          background: toast.type === 'error' ? 'var(--tint-danger)' : 'var(--tint-success)',
          color: toast.type === 'error' ? 'var(--danger)' : 'var(--success)',
          border: `1.5px solid ${toast.type === 'error' ? 'var(--tint-danger-border)' : 'var(--tint-success-border)'}`,
          fontSize: 13, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 8,
          animation: 'fadeIn 0.2s ease-out',
        }}>
          {toast.type === 'error' ? <AlertTriangle size={15} /> : <CheckCircle2 size={15} />}
          <span>{toast.text}</span>
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(360px, 100%), 1fr))', gap: 20, alignItems: 'start' }}>

        {/* ── Formulario ── */}
        <form onSubmit={handleSubmit} style={{ ...card, padding: 20, display: 'flex', flexDirection: 'column', gap: 20 }}>
          <h3 style={{ fontSize: 15, fontWeight: 900 }}>Registrar nueva entrada</h3>

          {/* 1. Producto */}
          <div>
            <p style={stepTitle}><span style={stepNum}>1</span> Producto</p>
            {selectedProduct ? (
              <div style={{
                display: 'flex', alignItems: 'center', gap: 12, padding: 12,
                background: 'var(--gray-50)', border: '1.5px solid var(--accent)', borderRadius: 'var(--radius-sm)',
              }}>
                <Thumb src={selectedProduct.image_url} size={48} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ fontSize: 14, fontWeight: 800, display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                    {selectedProduct.name}
                    {isArchived(selectedProduct) && <Badge color="var(--gray-400)">Archivado</Badge>}
                  </p>
                  <p style={{ fontSize: 11, color: 'var(--gray-600)', marginTop: 2 }}>
                    Stock actual: <strong>{stockOf(selectedProduct)}</strong>
                    {selectedProduct.buy_price != null && <> · Costo actual: <strong>{fmtBs(selectedProduct.buy_price)}</strong></>}
                    {selectedProduct.code && <> · {selectedProduct.code}</>}
                  </p>
                </div>
                <Btn variant="ghost" type="button" onClick={() => setSelectedProductId('')} style={{ padding: '6px 10px', fontSize: 12 }}>
                  Cambiar
                </Btn>
              </div>
            ) : (
              <div style={{ position: 'relative' }}>
                <Search size={15} style={{ position: 'absolute', left: 11, top: 11, color: 'var(--gray-400)' }} />
                <Input
                  style={{ paddingLeft: 34, padding: '10px 12px 10px 34px' }}
                  placeholder="Nombre o código del producto..."
                  value={search} onChange={e => setSearch(e.target.value)}
                  autoComplete="off"
                />
                {search && (
                  <div style={{
                    marginTop: 6, maxHeight: 260, overflowY: 'auto',
                    border: '1.5px solid var(--gray-200)', borderRadius: 'var(--radius-sm)', background: 'var(--surface)',
                  }}>
                    {filteredProducts.length === 0 && (
                      <p style={{ padding: 14, fontSize: 12, color: 'var(--gray-500)' }}>No se encontró ningún producto.</p>
                    )}
                    {filteredProducts.map(p => {
                      const st = stockOf(p)
                      return (
                        <div key={p.id} onClick={() => selectProduct(p)} style={{
                          padding: '8px 12px', borderBottom: '1px solid var(--gray-100)', cursor: 'pointer',
                          display: 'flex', alignItems: 'center', gap: 10,
                        }}>
                          <Thumb src={p.image_url} size={34} />
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <p style={{ fontSize: 13, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                              {p.name}
                              {isArchived(p) && <Badge color="var(--gray-400)">Archivado</Badge>}
                            </p>
                            {p.code && <p style={{ fontSize: 10, color: 'var(--gray-500)' }}>{p.code}</p>}
                          </div>
                          <span style={{ fontSize: 11, fontWeight: 800, color: st <= 0 ? 'var(--danger)' : 'var(--gray-600)', whiteSpace: 'nowrap' }}>
                            {st <= 0 ? 'Agotado' : `Stock ${st}`}
                          </span>
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* 2. Datos de la compra */}
          <fieldset disabled={!selectedProduct} style={{ border: 'none', padding: 0, margin: 0, opacity: selectedProduct ? 1 : 0.45, minWidth: 0 }}>
            <p style={stepTitle}><span style={stepNum}>2</span> Datos de la compra</p>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: 12 }}>
              <Field label="Cantidad">
                <Input type="number" min="1" required value={quantity} onChange={e => setQuantity(e.target.value)} placeholder="Ej: 10" />
              </Field>
              <Field label="Costo por unidad (Bs)">
                <Input type="number" step="0.01" min="0" required value={buyPrice} onChange={e => setBuyPrice(e.target.value)} placeholder="Ej: 15.50" />
              </Field>
              <Field label="Proveedor">
                <ProveedorSelect value={proveedor} onChange={setProveedor} names={proveedores}
                  onCreate={createProveedor} disabled={!canProveedor} />
              </Field>
              <Field label="Fecha de compra">
                <Input type="date" required max={ymd(new Date())} value={fecha} onChange={e => setFecha(e.target.value)} />
              </Field>
            </div>
            {!canProveedor && (
              <p style={{ fontSize: 11, color: 'var(--gray-500)', marginTop: 8, lineHeight: 1.5 }}>
                Para poder guardar el proveedor, ejecuta <strong>migration-proveedor.sql</strong> en el SQL Editor de Supabase y recarga la página.
              </p>
            )}
          </fieldset>

          {/* 3. Precio de venta */}
          <fieldset disabled={!selectedProduct} style={{ border: 'none', padding: 0, margin: 0, opacity: selectedProduct ? 1 : 0.45, minWidth: 0 }}>
            <p style={stepTitle}><span style={stepNum}>3</span> Precio de venta <span style={{ fontWeight: 600, textTransform: 'none', letterSpacing: 0 }}>(opcional)</span></p>
            <Input type="number" step="0.01" min="0" value={updateSellPrice} onChange={e => setUpdateSellPrice(e.target.value)} placeholder="Dejar igual" />
            {selectedProduct && (
              <p style={{
                fontSize: 11, marginTop: 6, padding: '6px 10px', borderRadius: 6, fontWeight: 700,
                background: priceChanged ? 'var(--tint-warn)' : 'var(--gray-50)',
                color: priceChanged ? 'var(--tint-warn-text)' : 'var(--gray-600)',
              }}>
                {priceChanged
                  ? `Cambiará de ${fmtBs(currentPrice)} a ${fmtBs(priceN)} para las próximas ventas.`
                  : `Se mantiene tu precio actual de ${fmtBs(currentPrice)}.`}
              </p>
            )}
            <p style={{ fontSize: 11, color: 'var(--gray-500)', marginTop: 6 }}>
              {unitProfit !== null
                ? <>Con este costo ganas <strong style={{ color: unitProfit >= 0 ? 'var(--success)' : 'var(--danger)' }}>{fmtBs(unitProfit)}</strong> por unidad ({Math.round((unitProfit / priceN) * 100)}% de margen). Las ventas pasadas no cambian.</>
                : 'Las ventas pasadas no cambian.'}
            </p>
          </fieldset>

          {/* Resumen + confirmar */}
          <div style={{
            display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: 10,
            background: 'var(--gray-50)', border: '1px solid var(--gray-100)', borderRadius: 'var(--radius-sm)', padding: 14,
          }}>
            <div>
              <p style={{ fontSize: 10, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--gray-500)' }}>Gasto total</p>
              <p style={{ fontSize: 20, fontWeight: 900, color: 'var(--danger)' }}>{fmtBs(total)}</p>
            </div>
            <div>
              <p style={{ fontSize: 10, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--gray-500)' }}>Stock después</p>
              <p style={{ fontSize: 20, fontWeight: 900 }}>
                {selectedProduct ? <>{stockOf(selectedProduct) + qtyN} <span style={{ fontSize: 12, color: 'var(--success)' }}>(+{qtyN})</span></> : '—'}
              </p>
            </div>
          </div>

          <Btn variant="primary" type="submit" disabled={isSubmitting || !selectedProduct || !qtyN || !buyPrice}
            style={{ justifyContent: 'center', padding: '12px 18px', fontSize: 14, opacity: (!selectedProduct || !qtyN || !buyPrice) ? 0.5 : 1 }}>
            {isSubmitting ? 'Registrando...' : 'Confirmar entrada'}
          </Btn>
        </form>

        {/* ── Historial ── */}
        <div style={{ ...card, overflow: 'hidden' }}>
          <div style={{ padding: '16px 18px', borderBottom: '1px solid var(--gray-100)', display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
            <h3 style={{ fontSize: 15, fontWeight: 900, flex: '1 1 auto' }}>Historial</h3>
            <div style={{ position: 'relative', flex: '1 1 180px' }}>
              <Search size={13} style={{ position: 'absolute', left: 10, top: 10, color: 'var(--gray-400)' }} />
              <Input value={histSearch} onChange={e => { setHistSearch(e.target.value); setLimit(20) }}
                placeholder="Producto o proveedor..." style={{ paddingLeft: 30, fontSize: 12 }} />
            </div>
          </div>

          {histFiltered.length === 0 ? (
            <p style={{ padding: 24, textAlign: 'center', color: 'var(--gray-400)', fontSize: 13 }}>
              {entradas.length === 0 ? 'Aún no hay entradas registradas.' : 'Ninguna entrada coincide con la búsqueda.'}
            </p>
          ) : (
            <div>
              {groups.map(g => (
                <div key={g.key}>
                  <div style={{
                    display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 10,
                    padding: '8px 18px', background: 'var(--gray-50)', borderBottom: '1px solid var(--gray-100)',
                  }}>
                    <span style={{ fontSize: 11, fontWeight: 900, color: 'var(--gray-700)' }}>{monthLabel(g.key)}</span>
                    <span style={{ fontSize: 11, color: 'var(--gray-600)', whiteSpace: 'nowrap' }}>
                      {monthTotals[g.key].units} uds. · <strong style={{ color: 'var(--danger)' }}>{fmtBs(monthTotals[g.key].total)}</strong>
                    </span>
                  </div>

                  {g.items.map(e => {
                    const p = productMap[e.product_id]
                    const isEditing = editingId === e.id
                    const rowTotal = (Number(e.cantidad) || 0) * (Number(e.buy_price) || 0)
                    return (
                      <div key={e.id} style={{ padding: '12px 18px', borderBottom: '1px solid var(--gray-100)', background: isEditing ? 'var(--gray-50)' : 'transparent' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                          <Thumb src={p?.image_url} size={40} />
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <p style={{ fontSize: 13, fontWeight: 800, lineHeight: 1.3, overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', wordBreak: 'break-word' }}>
                              {p ? p.name : 'Producto eliminado'}
                            </p>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap', marginTop: 3, fontSize: 11, color: 'var(--gray-500)' }}>
                              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 3 }}>
                                <Calendar size={11} /> {new Date(e.entered_at).toLocaleDateString('es', { day: '2-digit', month: 'short' })}
                              </span>
                              {e.proveedor
                                ? <span style={{ display: 'inline-flex', alignItems: 'center', gap: 3, background: 'var(--gray-100)', color: 'var(--gray-700)', fontWeight: 700, padding: '1px 7px', borderRadius: 99 }}>
                                    <Truck size={11} /> {e.proveedor}
                                  </span>
                                : <span style={{ fontStyle: 'italic', color: 'var(--gray-400)' }}>sin proveedor</span>}
                            </div>
                          </div>
                          <div style={{ textAlign: 'right', flexShrink: 0 }}>
                            <p style={{ fontSize: 14, fontWeight: 900, color: 'var(--danger)', whiteSpace: 'nowrap' }}>{fmtBs(rowTotal)}</p>
                            <p style={{ fontSize: 11, color: 'var(--gray-500)', whiteSpace: 'nowrap' }}>{e.cantidad} x {fmtBs(e.buy_price)}</p>
                          </div>
                          {!isEditing && (
                            <div style={{ display: 'flex', gap: 4, flexShrink: 0 }}>
                              <button onClick={() => startEditing(e)} title="Editar entrada" style={iconBtn}><Pencil size={13} /></button>
                              <button onClick={() => handleDelete(e.id)} title="Eliminar entrada" style={{ ...iconBtn, color: 'var(--danger)' }}><Trash2 size={13} /></button>
                            </div>
                          )}
                        </div>

                        {isEditing && (
                          <div style={{ marginTop: 12 }}>
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))', gap: 10 }}>
                              <Field label="Cantidad">
                                <Input type="number" min="1" value={editQty} onChange={ev => setEditQty(ev.target.value)} />
                              </Field>
                              <Field label="Costo unidad">
                                <Input type="number" step="0.01" value={editCost} onChange={ev => setEditCost(ev.target.value)} />
                              </Field>
                              <Field label="Proveedor">
                                <ProveedorSelect value={editProv} onChange={setEditProv} names={proveedores}
                                  onCreate={createProveedor} disabled={!canProveedor} />
                              </Field>
                              <Field label="Fecha">
                                <Input type="date" max={ymd(new Date())} value={editFecha} onChange={ev => setEditFecha(ev.target.value)} />
                              </Field>
                            </div>
                            <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', marginTop: 10 }}>
                              <Btn variant="ghost" onClick={() => setEditingId(null)} style={{ padding: '6px 12px', fontSize: 12 }}>
                                <X size={13} /> Cancelar
                              </Btn>
                              <Btn variant="success" onClick={() => saveEdit(e.id)} style={{ padding: '6px 12px', fontSize: 12 }}>
                                <Check size={13} /> Guardar
                              </Btn>
                            </div>
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>
              ))}
              {histFiltered.length > limit && (
                <button onClick={() => setLimit(l => l + 20)} style={{
                  width: '100%', background: 'none', border: 'none', padding: 14,
                  color: 'var(--gray-600)', fontSize: 12, fontWeight: 800,
                }}>
                  Ver más ({histFiltered.length - limit} restantes)
                </button>
              )}
            </div>
          )}
        </div>
      </div>
      </>)}
    </div>
  )
}

const iconBtn = {
  width: 30, height: 30, borderRadius: 'var(--radius-sm)', border: '1.5px solid var(--gray-200)',
  background: 'var(--surface)', color: 'var(--gray-600)', display: 'flex', alignItems: 'center', justifyContent: 'center',
}
