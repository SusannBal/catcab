import { useState, useRef } from 'react'
import { Plus, Pencil, Trash2, Upload, Loader } from 'lucide-react'
import { Btn, Modal, Field, Input, Textarea, Select, Row, Spinner, Badge } from '../components/UI'

const CATS = ['Cables', 'Audífonos', 'Audio']
const EMPTY = { name:'', model:'', category:'Cables', specs:'', price:'', buy_price:'', initial_stock:'', installments:'', code:'', image_url:'' }

export default function GestionPage({ products, sales = [], saveProduct, deleteProduct, uploadImage, soldMap, stockOf, loading }) {
  const [open,      setOpen]      = useState(false)
  const [form,      setForm]      = useState(EMPTY)
  const [saving,    setSaving]    = useState(false)
  const [uploading, setUploading] = useState(false)
  const [preview,   setPreview]   = useState(null)
  const [error,     setError]     = useState('')
  const [search,    setSearch]    = useState('')
  const fileRef = useRef()

  const set = k => e => setForm(f => ({ ...f, [k]: e.target.value }))

  function openNew() {
    setForm(EMPTY); setPreview(null); setError(''); setOpen(true)
  }
  function openEdit(p) {
    setForm({ ...EMPTY, ...p, price: p.price ?? '', buy_price: p.buy_price ?? '', initial_stock: p.initial_stock ?? '' })
    setPreview(p.image_url || null)
    setError('')
    setOpen(true)
  }

  async function handleFile(e) {
    const file = e.target.files[0]; if (!file) return
    setUploading(true); setError('')
    try {
      const url = await uploadImage(file)
      setForm(f => ({ ...f, image_url: url })); setPreview(url)
    } catch(err) { setError('Error subiendo imagen: ' + err.message) }
    finally { setUploading(false) }
  }

  async function handleSave() {
    if (!form.name.trim() || !form.price) { setError('Nombre y precio de venta son requeridos.'); return }
    setSaving(true); setError('')
    try { await saveProduct(form); setOpen(false) }
    catch(err) { setError(err.message) }
    finally { setSaving(false) }
  }

  async function handleDelete(p) {
    if (!window.confirm(`¿Eliminar "${p.name}" y todas sus ventas?`)) return
    await deleteProduct(p.id)
  }

  const visible = products.filter(p => {
    const q = search.toLowerCase()
    return !q || p.name?.toLowerCase().includes(q) || p.category?.toLowerCase().includes(q)
  })

  return (
    <div style={{ padding: 24 }}>
      {/* Topbar */}
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:20, flexWrap:'wrap', gap:12 }}>
        <h2 style={{ fontSize:17, fontWeight:800 }}>Gestión de productos</h2>
        <div style={{ display:'flex', gap:10, alignItems:'center' }}>
          <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Buscar..."
            style={{ padding:'8px 12px', border:'1.5px solid var(--gray-200)', borderRadius:'var(--radius-sm)', fontSize:13, outline:'none', width:200 }} />
          <Btn variant="primary" onClick={openNew}><Plus size={14}/> Nuevo producto</Btn>
        </div>
      </div>


      {loading ? <Spinner /> : (
        <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
          {visible.length === 0 && (
            <div style={{ textAlign:'center', padding:'60px 0', color:'var(--gray-400)', fontSize:13 }}>
              No hay productos. Usa "+ Nuevo producto" para agregar.
            </div>
          )}
          {visible.map(p => {
            const sold  = soldMap[p.id] || 0
            const stock = stockOf ? stockOf(p) : ((p.initial_stock || 0) - sold)
            const productSales = sales.filter(s => s.product_id === p.id)
            const profit = p.buy_price != null ? productSales.reduce((acc, s) => {
              const salePrice = s.price_at_sale ?? p.price ?? 0
              return acc + (salePrice - p.buy_price)
            }, 0).toFixed(2) : null

            return (
              <div key={p.id} style={{
                background:'var(--white)', border:'1.5px solid var(--gray-100)',
                borderRadius:'var(--radius-md)', padding:'14px 18px',
                display:'flex', gap:16, alignItems:'center',
                boxShadow:'var(--shadow)',
              }}>
                {/* Thumbnail */}
                <div style={{
                  width:72, height:72, flexShrink:0,
                  background:'var(--gray-50)', borderRadius:'var(--radius-sm)',
                  overflow:'hidden', border:'1px solid var(--gray-100)',
                  display:'flex', alignItems:'center', justifyContent:'center',
                }}>
                  {p.image_url
                    ? <img src={p.image_url} alt={p.name} loading="lazy" style={{ width:'100%', height:'100%', objectFit:'contain' }}/>
                    : <span style={{ fontSize:9, color:'var(--gray-300)' }}>Sin imagen</span>
                  }
                </div>

                {/* Info */}
                <div style={{ flex:1, minWidth:0 }}>
                  <div style={{ display:'flex', alignItems:'center', gap:8, flexWrap:'wrap', marginBottom:4 }}>
                    <p style={{ fontWeight:800, fontSize:14 }}>{p.name}</p>
                    <Badge>{p.category}</Badge>
                    {stock <= 0 && <Badge color="var(--danger)">AGOTADO</Badge>}
                  </div>
                  {p.model && <p style={{ fontSize:11, color:'var(--gray-600)' }}>{p.model}</p>}

                  {/* Stats row */}
                  <div style={{ display:'flex', gap:20, marginTop:6, flexWrap:'wrap' }}>
                    <Stat label="Precio venta"   value={`Bs. ${p.price}`} highlight />
                    {p.buy_price != null && <Stat label="Precio compra" value={`Bs. ${p.buy_price}`} />}
                    <Stat label="Stock inicial" value={p.initial_stock ?? '—'} />
                    <Stat label="Vendidos"      value={sold} />
                    <Stat label="Restantes"     value={stock} color={stock <= 0 ? 'var(--danger)' : stock <= 3 ? 'orange' : 'var(--success)'} />
                    {profit !== null && <Stat label="Ganancia acum." value={`Bs. ${profit}`} color="var(--success)" />}
                  </div>
                </div>

                {/* Actions */}
                <div style={{ display:'flex', gap:8, flexShrink:0 }}>
                  <Btn variant="ghost" onClick={() => openEdit(p)} style={{ padding:'7px 12px' }}>
                    <Pencil size={13}/> Editar
                  </Btn>
                  <Btn variant="danger" onClick={() => handleDelete(p)} style={{ padding:'7px 10px' }}>
                    <Trash2 size={13}/>
                  </Btn>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Modal */}
      {open && (
        <Modal
          title={form.id ? 'Editar producto' : 'Nuevo producto'}
          onClose={() => setOpen(false)}
          width={560}
          footer={<>
            <Btn variant="ghost" onClick={() => setOpen(false)}>Cancelar</Btn>
            <Btn variant="primary" onClick={handleSave} disabled={saving}>
              {saving ? 'Guardando...' : 'Guardar'}
            </Btn>
          </>}
        >
          <div style={{ display:'flex', flexDirection:'column', gap:14 }}>
            {/* Image upload */}
            <Field label="Imagen">
              <div
                onClick={() => fileRef.current.click()}
                style={{
                  height:140, border:'2px dashed var(--gray-200)', borderRadius:'var(--radius-md)',
                  display:'flex', alignItems:'center', justifyContent:'center',
                  cursor:'pointer', overflow:'hidden', background:'var(--gray-50)',
                }}
              >
                {uploading
                  ? <Loader size={22} style={{ animation:'spin 1s linear infinite' }}/>
                  : preview
                    ? <img src={preview} alt="preview" style={{ height:'100%', objectFit:'contain' }}/>
                    : <div style={{ textAlign:'center', color:'var(--gray-400)' }}>
                        <Upload size={24} style={{ marginBottom:6 }}/>
                        <p style={{ fontSize:12 }}>Clic para subir imagen</p>
                      </div>
                }
              </div>
              <input ref={fileRef} type="file" accept="image/*" onChange={handleFile} style={{ display:'none' }}/>
            </Field>

            <Row>
              <div style={{ flex:2 }}><Field label="Nombre *"><Input value={form.name} onChange={set('name')} placeholder="EarPods Lightning"/></Field></div>
              <div style={{ flex:1 }}><Field label="Modelo"><Input value={form.model} onChange={set('model')} placeholder="A1694"/></Field></div>
            </Row>

            <Row>
              <div style={{ flex:1 }}>
                <Field label="Categoría">
                  <Select value={form.category} onChange={set('category')}>
                    {CATS.map(c => <option key={c}>{c}</option>)}
                  </Select>
                </Field>
              </div>
              <div style={{ flex:1 }}><Field label="Código catálogo"><Input value={form.code} onChange={set('code')} placeholder="A1694"/></Field></div>
            </Row>

            <Field label="Especificaciones / Descripción">
              <Textarea value={form.specs} onChange={set('specs')} rows={3} placeholder="Conector: Lightning, Color: Blanco, Bluetooth 4.2..."/>
            </Field>

            {/* Pricing */}
            <div style={{
              background:'var(--gray-50)', border:'1px solid var(--gray-100)',
              borderRadius:'var(--radius-md)', padding:'14px 16px',
            }}>
              <p style={{ fontSize:11, fontWeight:800, textTransform:'uppercase', letterSpacing:'0.06em', color:'var(--gray-600)', marginBottom:12 }}>
                Precios e inventario
              </p>
              <Row>
                <div style={{ flex:1 }}>
                  <Field label="Precio de venta * (va al catálogo)">
                    <Input type="number" value={form.price} onChange={set('price')} placeholder="24.99"/>
                  </Field>
                </div>
                <div style={{ flex:1 }}>
                  <Field label="Precio de compra (costo)">
                    <Input type="number" value={form.buy_price} onChange={set('buy_price')} placeholder="12.00"/>
                  </Field>
                </div>
              </Row>
              <div style={{ marginTop:12 }}>
                <Field label="Cuotas (ej: 24 quincenas)">
                  <Input value={form.installments} onChange={set('installments')} placeholder="24 quincenas"/>
                </Field>
              </div>
              <div style={{ marginTop:12 }}>
                <Field label="Stock inicial (cuántos compraste)">
                  <Input type="number" value={form.initial_stock} onChange={set('initial_stock')} placeholder="6"/>
                </Field>
              </div>
            </div>

            {error && (
              <p style={{ fontSize:12, color:'var(--danger)', background:'#fff0f0', padding:'8px 12px', borderRadius:6 }}>
                {error}
              </p>
            )}
          </div>
        </Modal>
      )}
    </div>
  )
}

function Stat({ label, value, highlight, color }) {
  return (
    <div>
      <p style={{ fontSize:9, textTransform:'uppercase', letterSpacing:'0.06em', color:'var(--gray-400)', marginBottom:2 }}>{label}</p>
      <p style={{ fontSize:13, fontWeight:800, color: color || (highlight ? 'var(--black)' : 'var(--gray-800)') }}>
        {value}
      </p>
    </div>
  )
}
