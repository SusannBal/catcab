import { useState } from 'react'
import { FileDown, Minus, RotateCcw, TrendingUp, DollarSign, ShoppingBag, Package, Pencil, X, Search, ChevronDown, ChevronUp } from 'lucide-react'
import { exportCatalogPdf } from '../lib/exportPdf'
import { availableByCost } from '../lib/lots'
import { Btn, Spinner } from '../components/UI'

export default function InventarioPage({ products, sales, entradas, stockOf, isArchived, soldMap, totalProfit, totalRevenue, registerSale, undoLastSale, undoSaleById, getFifoCost, getLots, productMap = {}, loading }) {
  const [exporting, setExp] = useState(false)
  const [search,   setSearch] = useState('')
  const [confirm,  setConfirm] = useState(null) // { id, seller } waiting confirm
  const [category, setCategory] = useState('Todas')
  const [sortBy,   setSortBy]   = useState('vendidos') // 'vendidos' | 'nombre' | 'stock'
  const [showHistory, setShowHistory] = useState(false)

  async function handleExport() {
    setExp(true)
    try {
      await exportCatalogPdf(activeProducts, 'inventario.pdf')
    } catch (err) {
      console.error('Error exportando PDF:', err)
    }
    setExp(false)
  }

  async function handleSale(productId) {
    if (confirm?.id === productId) {
      await registerSale(productId, confirm.seller, confirm.price, confirm.batchCost ?? null)
      setConfirm(null)
    } else {
      const prod = productMap[productId]
      const defaultCost = getFifoCost(productId)
      setConfirm({ id: productId, seller: 'S', price: prod?.price ?? '', batchCost: defaultCost })
    }
  }

  // Group sales by date for the history section
  const salesByDate = sales.reduce((acc, s) => {
    const date = new Date(s.sold_at).toLocaleDateString('es', { day:'2-digit', month:'short', year:'numeric' })
    if (!acc[date]) acc[date] = []
    acc[date].push(s)
    return acc
  }, {})

  // Solo productos disponibles: los agotados y los archivados a mano no aparecen
  const activeProducts = products.filter(p => !isArchived(p))
  const hiddenCount    = products.length - activeProducts.length
  const categories     = ['Todas', ...new Set(activeProducts.map(p => p.category).filter(Boolean))]

  const SORTERS = {
    vendidos: (a, b) => (soldMap[b.id] || 0) - (soldMap[a.id] || 0) || a.name.localeCompare(b.name),
    nombre:   (a, b) => a.name.localeCompare(b.name),
    stock:    (a, b) => stockOf(a) - stockOf(b) || a.name.localeCompare(b.name),
  }
  const visible = activeProducts
    .filter(p => {
      const q = search.toLowerCase()
      return (category === 'Todas' || p.category === category)
        && (!q || p.name?.toLowerCase().includes(q) || p.code?.toLowerCase().includes(q))
    })
    .sort(SORTERS[sortBy])

  // Total units sold
  const totalUnits = Object.values(soldMap).reduce((a, b) => a + b, 0)

  return (
    <div>
      {/* Stats cards */}
      <div style={{
        background: 'var(--band)', padding: '20px var(--page-pad)',
        display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: 12,
      }}>
        <StatCard icon={<TrendingUp size={18}/>} label="Ganancia total" value={`Bs. ${totalProfit.toFixed(2)}`} accent />
        <StatCard icon={<DollarSign size={18}/>} label="Ingresos totales" value={`Bs. ${totalRevenue.toFixed(2)}`} />
        <StatCard icon={<ShoppingBag size={18}/>} label="Unidades vendidas" value={totalUnits} />
        <StatCard icon={<Package size={18}/>}     label="Productos activos" value={activeProducts.length} />
      </div>


      {/* Controls */}
      <div style={{
        background: 'var(--surface)', borderBottom: '1px solid var(--gray-100)',
        padding: '12px var(--page-pad)', display: 'flex', flexDirection: 'column', gap: 10,
        position: 'sticky', top: 'var(--topbar-h)', zIndex: 50,
      }}>
        <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
          <div style={{ position: 'relative', flex: '1 1 200px' }}>
            <Search size={13} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: 'var(--gray-400)' }} />
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Buscar por nombre o código..."
              style={{ width:'100%', padding:'8px 12px 8px 30px', border:'1.5px solid var(--gray-200)', borderRadius:'var(--radius-sm)', fontSize:13, outline:'none' }}/>
          </div>
          <select value={sortBy} onChange={e => setSortBy(e.target.value)}
            style={{ padding:'8px 10px', border:'1.5px solid var(--gray-200)', borderRadius:'var(--radius-sm)', fontSize:12, fontWeight:700, background:'var(--surface)' }}>
            <option value="vendidos">Más vendidos primero</option>
            <option value="nombre">Nombre (A-Z)</option>
            <option value="stock">Menos stock primero</option>
          </select>
          <Btn variant="dark" onClick={handleExport} disabled={exporting}>
            <FileDown size={14}/> {exporting ? 'Exportando...' : 'Guardar PDF'}
          </Btn>
        </div>
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', alignItems: 'center' }}>
          {categories.map(c => (
            <button key={c} onClick={() => setCategory(c)} style={{
              padding:'5px 12px', borderRadius:99, fontSize:12, fontWeight:700, cursor:'pointer',
              border: category === c ? '1.5px solid var(--black)' : '1.5px solid var(--gray-200)',
              background: category === c ? 'var(--black)' : 'var(--surface)',
              color: category === c ? 'var(--accent)' : 'var(--gray-600)',
            }}>{c}</button>
          ))}
          {hiddenCount > 0 && (
            <span style={{ marginLeft: 'auto', fontSize: 11, color: 'var(--gray-400)' }}>
              {hiddenCount} agotado{hiddenCount > 1 ? 's' : ''} o archivado{hiddenCount > 1 ? 's' : ''} oculto{hiddenCount > 1 ? 's' : ''} (ver en Gestión)
            </span>
          )}
        </div>
      </div>

      <div style={{ padding: '20px var(--page-pad)', display: 'flex', flexDirection: 'column', gap: 24 }}>

        {/* ── Inventory table ── */}
        <div id="inv-print" style={{ background:'var(--surface)', borderRadius:'var(--radius-md)', overflow:'hidden', boxShadow:'var(--shadow)' }}>
          {/* Table header */}
          <div style={{
            background:'var(--black)', color:'var(--white)',
            padding:'14px 20px', display:'flex', justifyContent:'space-between', alignItems:'center',
          }}>
            <h2 style={{ fontSize:15, fontWeight:900 }}>INVENTARIO</h2>
            <p style={{ fontSize:11, color:'rgba(255,255,255,0.5)' }}>
              {new Date().toLocaleDateString('es', { day:'2-digit', month:'long', year:'numeric' })}
            </p>
          </div>

          {loading ? <Spinner /> : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width:'100%', borderCollapse:'collapse' }}>
                <thead>
                  <tr style={{ background:'var(--gray-50)', borderBottom:'1.5px solid var(--gray-200)' }}>
                    {[['Producto'],['Vender'],['Quedan'],['Precio venta'],['Precio compra','hide-mobile'],['Ganancia u.','hide-mobile'],['Ini.','hide-mobile'],['Vendidos','hide-mobile']].map(([h, cls]) => (
                      <th key={h} className={cls} style={{ padding:'10px 16px', textAlign:'left', fontSize:10, fontWeight:800, textTransform:'uppercase', letterSpacing:'0.06em', color:'var(--gray-600)', whiteSpace:'nowrap' }}>
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {visible.length === 0 && (
                    <tr><td colSpan={8} style={{ padding:'40px 16px', textAlign:'center', fontSize:13, color:'var(--gray-400)' }}>
                      No hay productos disponibles con este filtro.
                    </td></tr>
                  )}
                  {visible.map((p, i) => {
                    const sold   = soldMap[p.id] || 0
                    const stock  = stockOf(p)
                    const unitProfit = p.buy_price != null ? (p.price - p.buy_price) : null

                    return (
                      <tr key={p.id} style={{
                        borderBottom: '1px solid var(--gray-100)',
                        background: i % 2 === 0 ? 'var(--surface)' : 'var(--gray-50)',
                      }}>
                        {/* Product */}
                        <td style={{ padding:'12px 16px' }}>
                          <div style={{ display:'flex', alignItems:'center', gap:10 }}>
                            {p.image_url
                              ? <img src={p.image_url} alt="" crossOrigin="anonymous" loading="lazy" style={{ width:36, height:36, objectFit:'contain', borderRadius:4, border:'1px solid var(--gray-100)' }}/>
                              : <div style={{ width:36, height:36, background:'var(--gray-100)', borderRadius:4 }}/>
                            }
                            <div>
                              <p style={{ fontSize:13, fontWeight:700 }}>{p.name}</p>
                              {p.model && <p style={{ fontSize:10, color:'var(--gray-500)' }}>{p.model}</p>}
                            </div>
                          </div>
                        </td>

                        {/* Register sale button */}
                        <td style={{ padding:'12px 16px' }}>
                          <Btn variant="success" onClick={() => handleSale(p.id)} style={{ padding:'7px 14px', fontSize:12, whiteSpace:'nowrap' }}>
                            <Minus size={12}/> Vendí 1
                          </Btn>
                        </td>

                        {/* Remaining */}
                        <td style={td}>
                          <span style={{ fontWeight:800, color: stock <= 2 ? 'orange' : 'var(--success)' }}>{stock}</span>
                        </td>

                        <td style={td}><span style={{ fontWeight:700, whiteSpace:'nowrap' }}>Bs. {p.price}</span></td>
                        <td style={td} className="hide-mobile">{p.buy_price != null ? `Bs. ${p.buy_price}` : <span style={{ color:'var(--gray-300)' }}>—</span>}</td>

                        {/* Unit profit */}
                        <td style={td} className="hide-mobile">
                          {unitProfit != null
                            ? <span style={{ fontWeight:700, color: unitProfit >= 0 ? 'var(--success)' : 'var(--danger)' }}>
                                Bs. {unitProfit.toFixed(2)}
                              </span>
                            : <span style={{ color:'var(--gray-300)' }}>—</span>
                          }
                        </td>

                        <td style={td} className="hide-mobile">{p.initial_stock ?? '—'}</td>
                        <td style={td} className="hide-mobile"><span style={{ fontWeight:700 }}>{sold}</span></td>
                      </tr>
                    )
                  })}
                </tbody>

                {/* Totals row */}
                <tfoot>
                  <tr style={{ background:'var(--black)', color:'var(--white)' }}>
                    <td style={{ padding:'12px 16px', fontWeight:800, fontSize:13 }}>TOTALES</td>
                    <td style={{ padding:'12px 16px', fontWeight:800, color:'var(--accent)', whiteSpace:'nowrap' }} colSpan={3}>
                      {totalUnits} uds. vendidas · Bs. {totalProfit.toFixed(2)} ganancia
                    </td>
                    <td style={tdLight} className="hide-mobile" colSpan={4}></td>
                  </tr>
                </tfoot>
              </table>
            </div>
          )}
        </div>

        {/* Modal para Confirmar Venta */}
        {confirm && (() => {
          const p = products.find(prod => prod.id === confirm.id)
          if (!p) return null
          const isCAB09 = p.code === 'CAB-09'

          return (
            <div style={{
              position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
              background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(3px)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              zIndex: 1000, padding: 16
            }}>
              <div style={{
                background: 'var(--surface)', width: '100%', maxWidth: 380,
                borderRadius: 'var(--radius-md)', padding: 20,
                boxShadow: '0 10px 25px rgba(0,0,0,0.2)',
                display: 'flex', flexDirection: 'column', gap: 16,
                animation: 'fadeIn 0.2s ease-out'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--gray-100)', paddingBottom: 10 }}>
                  <h3 style={{ fontSize: 16, fontWeight: 900 }}>Confirmar Venta</h3>
                  <button onClick={() => setConfirm(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--gray-400)', display: 'flex' }}><X size={18} /></button>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  {p.image_url && <img src={p.image_url} alt="" loading="lazy" style={{ width: 44, height: 44, objectFit: 'contain', borderRadius: 6, border: '1px solid var(--gray-100)' }} />}
                  <div>
                    <p style={{ fontWeight: 800, fontSize: 14 }}>{p.name}</p>
                    <p style={{ fontSize: 11, color: 'var(--gray-500)' }}>Cód: {p.code || 'S/C'}</p>
                  </div>
                </div>

                {/* Lote: de qué compra sale esta unidad */}
                {(() => {
                  const lots   = getLots(p.id)
                  const groups = availableByCost(lots)
                  const soldOut = lots.filter(l => l.remaining <= 0).length
                  if (groups.length === 0) return null
                  return (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                      <label style={{ fontSize: 11, fontWeight: 700, color: 'var(--gray-600)' }}>
                        {groups.length > 1 ? '¿De qué compra sale esta unidad?' : 'Sale de la compra:'}
                      </label>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                        {groups.map((g, idx) => {
                          const selected = confirm.batchCost === g.cost
                          return (
                            <button key={idx} type="button"
                              onClick={() => setConfirm(c => ({ ...c, batchCost: g.cost }))}
                              style={{
                                display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10,
                                padding: '9px 12px', borderRadius: 8, cursor: 'pointer', textAlign: 'left',
                                border: selected ? '2px solid var(--accent)' : '1.5px solid var(--gray-200)',
                                background: selected ? 'var(--tint-warn)' : 'var(--gray-50)',
                                color: 'var(--text)', transition: 'all 0.15s',
                              }}>
                              <span style={{ minWidth: 0 }}>
                                <span style={{ display: 'block', fontSize: 13, fontWeight: 900 }}>
                                  Costo Bs. {g.cost}
                                  {idx === 0 && <span style={{ marginLeft: 6, fontSize: 9, fontWeight: 900, background: 'var(--accent)', color: '#111', padding: '1px 6px', borderRadius: 4, verticalAlign: 'middle' }}>PRIMERO EN SALIR</span>}
                                </span>
                                <span style={{ display: 'block', fontSize: 10, color: 'var(--gray-500)', marginTop: 1 }}>{g.labels.join(', ')}</span>
                              </span>
                              <span style={{ fontSize: 12, fontWeight: 800, color: g.remaining <= 2 ? 'orange' : 'var(--success)', whiteSpace: 'nowrap' }}>
                                quedan {g.remaining}
                              </span>
                            </button>
                          )
                        })}
                      </div>
                      {soldOut > 0 && (
                        <p style={{ fontSize: 10, color: 'var(--gray-500)' }}>
                          {soldOut} compra{soldOut > 1 ? 's' : ''} anterior{soldOut > 1 ? 'es' : ''} ya vendida{soldOut > 1 ? 's' : ''} por completo (no se muestra{soldOut > 1 ? 'n' : ''}).
                        </p>
                      )}
                    </div>
                  )
                })()}

                {/* Seller selection */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  <label style={{ fontSize: 11, fontWeight: 700, color: 'var(--gray-600)' }}>¿Quién realizó la venta?</label>
                  <div style={{ display: 'flex', gap: 8 }}>
                    {['S', 'F', 'N'].map(opt => (
                      <button key={opt} onClick={() => setConfirm(c => ({ ...c, seller: opt }))}
                        style={{
                          flex: 1, padding: '8px 0', borderRadius: 8, border: 'none', cursor: 'pointer',
                          fontWeight: 800, fontSize: 13,
                          background: confirm.seller === opt ? 'var(--black)' : 'var(--gray-100)',
                          color: confirm.seller === opt ? 'var(--accent)' : 'var(--gray-600)',
                          transition: 'all 0.15s',
                        }}>{opt}</button>
                    ))}
                  </div>
                </div>

                {/* Custom price */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  <label style={{ fontSize: 11, fontWeight: 700, color: 'var(--gray-600)', display: 'flex', alignItems: 'center', gap: 4 }}>
                    <Pencil size={11} /> Precio de venta:
                  </label>
                  <div style={{ display: 'flex', alignItems: 'center', background: 'var(--gray-50)', border: '1.5px solid var(--gray-200)', borderRadius: 8, padding: '6px 12px' }}>
                    <span style={{ fontSize: 13, fontWeight: 800, color: 'var(--gray-500)', marginRight: 4 }}>Bs.</span>
                    <input
                      type="number"
                      step="0.5"
                      value={confirm.price ?? ''}
                      onChange={e => setConfirm(c => ({ ...c, price: e.target.value }))}
                      style={{ width: '100%', border: 'none', outline: 'none', fontSize: 14, fontWeight: 800, background: 'transparent' }}
                    />
                  </div>
                </div>

                {/* Buttons */}
                <div style={{ display: 'flex', gap: 8, marginTop: 4 }}>
                  <Btn variant="danger"
                    onClick={() => handleSale(p.id)}
                    style={{ flex: 2, padding: '10px 14px', fontSize: 13, justifyContent: 'center' }}>
                    <Minus size={14} /> Confirmar Venta
                  </Btn>
                  <Btn variant="ghost" onClick={() => setConfirm(null)} style={{ flex: 1, padding: '10px 14px', fontSize: 13, justifyContent: 'center' }}>
                    Cancelar
                  </Btn>
                </div>
              </div>
            </div>
          )
        })()}

        {/* ── Sales history ── */}
        <div style={{ background:'var(--surface)', borderRadius:'var(--radius-md)', boxShadow:'var(--shadow)', overflow:'hidden' }}>
          <button onClick={() => setShowHistory(v => !v)} style={{
            width:'100%', border:'none', cursor:'pointer', textAlign:'left',
            background:'var(--black)', color:'var(--white)',
            padding:'14px 20px', display:'flex', justifyContent:'space-between', alignItems:'center', gap:12,
          }}>
            <h2 style={{ fontSize:15, fontWeight:900 }}>HISTORIAL DE VENTAS</h2>
            <span style={{ fontSize:11, color:'rgba(255,255,255,0.6)', display:'flex', alignItems:'center', gap:6 }}>
              {sales.length} registro(s) · {showHistory ? 'Ocultar' : 'Mostrar'}
              {showHistory ? <ChevronUp size={14}/> : <ChevronDown size={14}/>}
            </span>
          </button>

          {showHistory && (sales.length === 0 ? (
            <div style={{ textAlign:'center', padding:'40px 0', color:'var(--gray-400)', fontSize:13 }}>
              No hay ventas registradas aún.
            </div>
          ) : (
            <div style={{ padding:'16px 20px', display:'flex', flexDirection:'column', gap:20 }}>
              {Object.entries(salesByDate).map(([date, daySales]) => {
                const dayRevenue = daySales.reduce((acc, s) => {
                  const prod = products.find(p => p.id === s.product_id)
                  const salePrice = s.price_at_sale ?? prod?.price ?? 0
                  return acc + salePrice
                }, 0)
                const dayProfit = daySales.reduce((acc, s) => {
                  const salePrice = s.price_at_sale ?? 0
                  const buyPrice = s.buy_price_at_sale ?? 0
                  return acc + (salePrice - buyPrice)
                }, 0)

                return (
                  <div key={date}>
                    {/* Day header */}
                    <div style={{
                      display:'flex', alignItems:'center', gap:12, marginBottom:8,
                    }}>
                      <span style={{
                        background:'var(--accent)', color:'#111',
                        fontWeight:800, fontSize:11, padding:'3px 10px', borderRadius:4,
                      }}>{date}</span>
                      <span style={{ fontSize:12, color:'var(--gray-600)' }}>
                        {daySales.length} venta(s) · Bs. {dayRevenue.toFixed(2)} ingreso · <span style={{ color:'var(--success)', fontWeight:700 }}>Bs. {dayProfit.toFixed(2)} ganancia</span>
                      </span>
                      <div style={{ flex:1, height:1, background:'var(--gray-100)' }}/>
                    </div>

                    {/* Day sales */}
                    <div style={{ display:'flex', flexDirection:'column', gap:6, paddingLeft:8 }}>
                      {daySales.map(s => {
                        const prod = products.find(p => p.id === s.product_id)
                        const time = new Date(s.sold_at).toLocaleTimeString('es', { hour:'2-digit', minute:'2-digit' })
                        return (
                          <div key={s.id} style={{
                            display:'flex', alignItems:'center', gap:12,
                            padding:'8px 12px', background:'var(--gray-50)',
                            borderRadius:'var(--radius-sm)', border:'1px solid var(--gray-100)',
                          }}>
                            {prod?.image_url && (
                              <img src={prod.image_url} alt="" crossOrigin="anonymous" loading="lazy" style={{ width:32, height:32, objectFit:'contain', borderRadius:4 }}/>
                            )}
                            <div style={{ flex:1 }}>
                              <p style={{ fontSize:13, fontWeight:700 }}>{prod?.name || 'Producto eliminado'}</p>
                              <p style={{ fontSize:11, color:'var(--gray-500)' }}>{time}</p>
                            </div>
                            <div style={{ textAlign:'right' }}>
                              {(() => {
                                const salePrice = s.price_at_sale ?? prod?.price
                                const isCustom = s.price_at_sale != null && prod && s.price_at_sale !== prod.price
                                return (
                                  <>
                                    <p style={{ fontSize: 13, fontWeight: 800 }}>
                                      Bs. {salePrice ?? '—'}
                                      {isCustom && (
                                        <span title={`Precio de catálogo actual: Bs. ${prod.price}`}
                                          style={{ marginLeft: 4, fontSize: 9, background: 'var(--tint-info)', color: '#2196f3', borderRadius: 3, padding: '1px 5px', fontWeight: 700, verticalAlign: 'middle' }}>
                                          esp.
                                        </span>
                                      )}
                                    </p>
                                    {s.buy_price_at_sale != null && salePrice != null && (() => {
                                      const profit = salePrice - s.buy_price_at_sale
                                      return (
                                        <p style={{ fontSize: 10, color: profit >= 0 ? 'var(--success)' : 'var(--danger)', fontWeight: 700 }}>
                                          {profit >= 0 ? '+' : ''}Bs. {profit.toFixed(2)}
                                        </p>
                                      )
                                    })()}
                                  </>
                                )
                              })()}
                            </div>
                            <Btn variant="ghost"
                              onClick={async () => {
                                if (!window.confirm('¿Deshacer esta venta?')) return
                                await (undoSaleById ? undoSaleById(s.id) : undoLastSale(s.product_id))
                              }}
                              style={{ padding:'4px 8px', fontSize:11 }}
                              title="Deshacer esta venta">
                              <RotateCcw size={11}/>
                            </Btn>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                )
              })}
            </div>
          ))}
        </div>

      </div>
    </div>
  )
}

const td      = { padding:'12px 16px', fontSize:13, color:'var(--text)' }
const tdLight = { padding:'12px 16px', fontSize:13, color:'rgba(255,255,255,0.4)' }

function StatCard({ icon, label, value, accent }) {
  return (
    <div style={{
      background: accent ? 'var(--accent)' : 'rgba(255,255,255,0.08)',
      borderRadius: 'var(--radius-md)', padding: '14px 18px',
    }}>
      <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:6 }}>
        <span style={{ color: accent ? '#111' : 'rgba(255,255,255,0.5)' }}>{icon}</span>
        <span style={{ fontSize:10, fontWeight:700, textTransform:'uppercase', letterSpacing:'0.06em',
          color: accent ? '#111' : 'rgba(255,255,255,0.5)' }}>
          {label}
        </span>
      </div>
      <p style={{ fontSize:24, fontWeight:900, color: accent ? '#111' : 'var(--white)' }}>{value}</p>
    </div>
  )
}
