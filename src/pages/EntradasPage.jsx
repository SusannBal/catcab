import { useState } from 'react'
import { PackagePlus, Search, Info, Pencil, Trash2, Check, X } from 'lucide-react'
import { Btn, Field, Input, Spinner } from '../components/UI'

export default function EntradasPage({ products, entradas = [], registerEntrada, deleteEntrada, updateEntrada, loading, stockOf }) {
  const [search, setSearch] = useState('')
  const [selectedProductId, setSelectedProductId] = useState('')
  const [quantity, setQuantity] = useState('')
  const [buyPrice, setBuyPrice] = useState('')
  const [updateSellPrice, setUpdateSellPrice] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [toast, setToast] = useState(null) // { type: 'success'|'error', text: '' }

  function showToast(text, type = 'success') {
    setToast({ text, type })
    setTimeout(() => setToast(null), 3500)
  }

  // Estado para edición en línea del historial
  const [editingId, setEditingId] = useState(null)
  const [editQty, setEditQty] = useState('')
  const [editCost, setEditCost] = useState('')

  const filteredProducts = products.filter(p =>
    p.name?.toLowerCase().includes(search.toLowerCase()) ||
    (p.code && p.code.toLowerCase().includes(search.toLowerCase()))
  )

  const selectedProduct = products.find(p => p.id === selectedProductId)

  async function handleSubmit(e) {
    e.preventDefault()
    if (!selectedProductId || !quantity || !buyPrice) return

    setIsSubmitting(true)
    try {
      await registerEntrada(selectedProductId, quantity, buyPrice, updateSellPrice)
      setSelectedProductId('')
      setQuantity('')
      setBuyPrice('')
      setUpdateSellPrice('')
      setSearch('')
      showToast('¡Entrada de mercadería registrada con éxito!')
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
  }

  async function saveEdit(entradaId) {
    if (!editQty || !editCost) return
    try {
      await updateEntrada(entradaId, editQty, editCost)
      setEditingId(null)
      showToast('Entrada actualizada con éxito')
    } catch (err) {
      showToast('Error al actualizar entrada: ' + err.message, 'error')
    }
  }

  if (loading) return <Spinner />

  return (
    <div style={{ padding: 24 }}>
      {/* Notification Toast */}
      {toast && (
        <div style={{
          padding: '12px 18px', borderRadius: 'var(--radius-sm)', marginBottom: 16,
          background: toast.type === 'error' ? '#fff5f5' : '#f0fff4',
          color: toast.type === 'error' ? 'var(--danger)' : 'var(--success)',
          border: `1.5px solid ${toast.type === 'error' ? '#feb2b2' : '#9ae6b4'}`,
          fontSize: 13, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 8,
          animation: 'fadeIn 0.2s ease-out'
        }}>
          <span>{toast.type === 'error' ? '⚠️' : '✅'}</span>
          <span>{toast.text}</span>
        </div>
      )}

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20 }}>
        <PackagePlus size={20} style={{ color: 'var(--accent)' }} />
        <h2 style={{ fontSize: 17, fontWeight: 800 }}>Entrada de Mercadería</h2>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 24 }}>
        {/* Formulario */}
        <div style={{
          background: 'var(--white)', border: '1.5px solid var(--gray-100)',
          borderRadius: 'var(--radius-md)', padding: 20, boxShadow: 'var(--shadow)'
        }}>
          <h3 style={{ margin: '0 0 16px 0', fontSize: 15, fontWeight: 800 }}>Registrar Nuevo Ingreso</h3>

          <div style={{ marginBottom: 16 }}>
            <Field label="Buscar Producto">
              <div style={{ position: 'relative' }}>
                <Search size={15} style={{ position: 'absolute', left: 10, top: 11, color: 'var(--gray-400)' }} />
                <Input
                  style={{ paddingLeft: 32 }}
                  placeholder="Nombre o código del producto..."
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                />
              </div>
            </Field>

            {search && filteredProducts.length > 0 && !selectedProduct && (
              <div style={{
                marginTop: 8, maxHeight: 180, overflowY: 'auto',
                border: '1.5px solid var(--gray-200)', borderRadius: 'var(--radius-sm)',
                background: 'var(--white)'
              }}>
                {filteredProducts.map(p => (
                  <div
                    key={p.id}
                    onClick={() => {
                      setSelectedProductId(p.id)
                      setSearch('')
                      setBuyPrice(p.buy_price || '')
                      setUpdateSellPrice(p.price || '')
                    }}
                    style={{
                      padding: '10px 14px', borderBottom: '1px solid var(--gray-100)',
                      cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center'
                    }}
                  >
                    <div>
                      <strong style={{ fontSize: 13, display: 'block' }}>{p.name}</strong>
                      {p.code && <span style={{ fontSize: 10, color: 'var(--gray-500)' }}>Cód: {p.code}</span>}
                    </div>
                    <span style={{ color: 'var(--gray-600)', fontSize: 12, fontWeight: 700 }}>Stock: {stockOf(p)}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {selectedProduct ? (
            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div style={{
                padding: '12px 14px', background: 'var(--gray-50)',
                borderRadius: 'var(--radius-sm)', border: '1px solid var(--gray-200)',
                display: 'flex', justifyContent: 'space-between', alignItems: 'center'
              }}>
                <div>
                  <strong style={{ display: 'block', fontSize: 14 }}>{selectedProduct.name}</strong>
                  <span style={{ fontSize: 12, color: 'var(--gray-600)' }}>Stock actual: <strong>{stockOf(selectedProduct)}</strong></span>
                </div>
                <button
                  type="button"
                  onClick={() => setSelectedProductId('')}
                  style={{ background: 'none', border: 'none', color: 'var(--danger)', cursor: 'pointer', fontSize: 12, fontWeight: 700 }}
                >
                  Cambiar
                </button>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <Field label="Cantidad a ingresar">
                  <Input
                    type="number" min="1" required
                    value={quantity} onChange={e => setQuantity(e.target.value)}
                    placeholder="Ej: 10"
                  />
                </Field>

                <Field label="Nuevo Precio Costo (Bs)">
                  <Input
                    type="number" step="0.01" required
                    value={buyPrice} onChange={e => setBuyPrice(e.target.value)}
                    placeholder="Ej: 15.50"
                  />
                </Field>
              </div>

              <Field label="Actualizar Precio Venta (Bs) - Opcional">
                <Input
                  type="number" step="0.01"
                  value={updateSellPrice} onChange={e => setUpdateSellPrice(e.target.value)}
                  placeholder="Dejar vacio para no cambiar"
                />
                <small style={{ color: 'var(--gray-500)', marginTop: 4, display: 'flex', alignItems: 'center', gap: 4, fontSize: 11 }}>
                  <Info size={12}/>
                  Los cambios de precio no afectarán el histórico de ganancias pasadas.
                </small>
              </Field>

              <Btn variant="primary" type="submit" disabled={isSubmitting} style={{ marginTop: 8, justifyContent: 'center' }}>
                {isSubmitting ? 'Registrando...' : 'Confirmar Ingreso'}
              </Btn>
            </form>
          ) : (
            <div style={{ padding: '30px 20px', textAlign: 'center', color: 'var(--gray-400)', background: 'var(--gray-50)', borderRadius: 'var(--radius-sm)', fontSize: 13 }}>
              Busca y selecciona un producto para ingresar stock.
            </div>
          )}
        </div>

        {/* Historial */}
        <div style={{
          background: 'var(--white)', border: '1.5px solid var(--gray-100)',
          borderRadius: 'var(--radius-md)', padding: 20, boxShadow: 'var(--shadow)'
        }}>
          <h3 style={{ margin: '0 0 16px 0', fontSize: 15, fontWeight: 800 }}>Historial de Entradas</h3>
          {entradas.length === 0 ? (
            <p style={{ color: 'var(--gray-400)', fontSize: 13 }}>No hay registros de entradas de mercadería.</p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {entradas.slice(0, 15).map(e => {
                const p = products.find(prod => prod.id === e.product_id)
                const isEditing = editingId === e.id

                return (
                  <div key={e.id} style={{
                    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                    padding: '10px 12px', background: 'var(--gray-50)', borderRadius: 'var(--radius-sm)',
                    border: '1px solid var(--gray-100)', gap: 12
                  }}>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontWeight: 700, fontSize: 13 }}>{p ? p.name : 'Producto Eliminado'}</div>
                      <div style={{ color: 'var(--gray-500)', fontSize: 11 }}>{new Date(e.entered_at).toLocaleString()}</div>
                    </div>

                    {isEditing ? (
                      <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                        <div style={{ width: 60 }}>
                          <Input
                            type="number"
                            value={editQty}
                            onChange={ev => setEditQty(ev.target.value)}
                            style={{ padding: '4px 6px', fontSize: 12 }}
                            placeholder="Cant."
                          />
                        </div>
                        <div style={{ width: 70 }}>
                          <Input
                            type="number"
                            step="0.01"
                            value={editCost}
                            onChange={ev => setEditCost(ev.target.value)}
                            style={{ padding: '4px 6px', fontSize: 12 }}
                            placeholder="Costo"
                          />
                        </div>
                        <Btn variant="success" onClick={() => saveEdit(e.id)} style={{ padding: '4px 8px' }}>
                          <Check size={13}/>
                        </Btn>
                        <Btn variant="ghost" onClick={() => setEditingId(null)} style={{ padding: '4px 6px' }}>
                          <X size={13}/>
                        </Btn>
                      </div>
                    ) : (
                      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                        <div style={{ textAlign: 'right' }}>
                          <div style={{ fontWeight: 800, color: 'var(--success)', fontSize: 13 }}>+{e.cantidad} uds.</div>
                          <div style={{ fontSize: 11, color: 'var(--gray-600)' }}>Costo: Bs. {e.buy_price}</div>
                        </div>
                        <div style={{ display: 'flex', gap: 4 }}>
                          <Btn variant="ghost" onClick={() => startEditing(e)} style={{ padding: '5px 8px' }} title="Editar entrada">
                            <Pencil size={12}/>
                          </Btn>
                          <Btn variant="danger" onClick={() => handleDelete(e.id)} style={{ padding: '5px 8px' }} title="Eliminar entrada">
                            <Trash2 size={12}/>
                          </Btn>
                        </div>
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
