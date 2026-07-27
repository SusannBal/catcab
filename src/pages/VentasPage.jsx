import { useState } from 'react'
import { TrendingUp, DollarSign, ShoppingBag, User } from 'lucide-react'

const SELLER_LABELS = { S: 'S', F: 'F', N: 'N' }
const SELLER_COLORS = { S: '#f0c040', F: '#60c8f0', N: '#a0a0b0' }

export default function VentasPage({ products, sales, loading }) {
  const [filter, setFilter] = useState('all')

  // Sales filtered by seller
  const filteredSales = filter === 'all' ? sales : sales.filter(s => s.seller === filter)

  // Stats per seller — uses price_at_sale when available
  function sellerStats(sellerKey) {
    const sellerSales = sellerKey === 'all' ? sales : sales.filter(s => s.seller === sellerKey)
    const units = sellerSales.length
    const revenue = sellerSales.reduce((acc, s) => {
      const prod = products.find(p => p.id === s.product_id)
      const salePrice = s.price_at_sale ?? prod?.price ?? 0
      return acc + salePrice
    }, 0)
    const profit = sellerSales.reduce((acc, s) => {
      const prod = products.find(p => p.id === s.product_id)
      const salePrice = s.price_at_sale ?? prod?.price ?? 0
      // Usa buy_price_at_sale si está guardado, si no cae al buy_price del producto
      const buyCost = s.buy_price_at_sale ?? prod?.buy_price ?? 0
      return acc + (salePrice - buyCost)
    }, 0)
    return { units, revenue, profit }
  }

  // Group filtered sales by date
  const salesByDate = filteredSales.reduce((acc, s) => {
    const date = new Date(s.sold_at).toLocaleDateString('es', { day: '2-digit', month: 'short', year: 'numeric' })
    if (!acc[date]) acc[date] = []
    acc[date].push(s)
    return acc
  }, {})

  const allStats = sellerStats('all')
  const sStats   = sellerStats('S')
  const fStats   = sellerStats('F')

  const filterBtns = [
    { key: 'all', label: 'Todos', color: '#ffffff' },
    { key: 'S',   label: 'S',     color: SELLER_COLORS.S },
    { key: 'F',   label: 'F',     color: SELLER_COLORS.F },
    { key: 'N',   label: 'N',     color: SELLER_COLORS.N },
  ]

  return (
    <div>
      {/* Top stats — totales generales */}
      <div style={{
        background: 'var(--black)', padding: '16px var(--page-pad) 8px',
        display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: 12,
      }}>
        <MiniCard icon={<ShoppingBag size={16}/>} label="Total vendidas" value={allStats.units} />
        <MiniCard icon={<DollarSign size={16}/>}  label="Ingresos totales" value={`Bs. ${allStats.revenue.toFixed(2)}`} />
        <MiniCard icon={<TrendingUp size={16}/>}  label="Ganancia total" value={`Bs. ${allStats.profit.toFixed(2)}`} accent />
      </div>

      {/* Per-seller row */}
      <div style={{
        background: 'var(--black)', padding: '8px var(--page-pad) 16px',
        display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 12,
        borderTop: '1px solid rgba(255,255,255,0.06)',
      }}>
        <SellerCard letter="S" color={SELLER_COLORS.S} stats={sStats} />
        <SellerCard letter="F" color={SELLER_COLORS.F} stats={fStats} />
      </div>

      {/* Filter bar */}
      <div style={{
        background: 'var(--white)', borderBottom: '1px solid var(--gray-100)',
        padding: '12px var(--page-pad)', display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap',
      }}>
        <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--gray-500)', marginRight: 4 }}>Filtrar por:</span>
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
          {filterBtns.map(b => (
            <button key={b.key} onClick={() => setFilter(b.key)} style={{
              padding: '6px 14px', borderRadius: 6, border: 'none', cursor: 'pointer',
              fontWeight: 800, fontSize: 12,
              background: filter === b.key ? 'var(--black)' : 'var(--gray-100)',
              color: filter === b.key ? b.color : 'var(--gray-500)',
              boxShadow: filter === b.key ? `0 0 0 2px ${b.color}40` : 'none',
              transition: 'all 0.15s',
            }}>
              {b.label === 'Todos' ? 'Todos' : (
                <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                  <User size={11} /> {b.label}
                </span>
              )}
            </button>
          ))}
        </div>
        <span style={{ marginLeft: 'auto', fontSize: 12, color: 'var(--gray-400)' }}>
          {filteredSales.length} venta(s)
        </span>
      </div>

      {/* Sales history */}
      <div style={{ padding: 'var(--page-pad)' }}>
        <div style={{ background: 'var(--white)', borderRadius: 'var(--radius-md)', boxShadow: 'var(--shadow)', overflow: 'hidden' }}>
          <div style={{
            background: 'var(--black)', color: 'var(--white)',
            padding: '14px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          }}>
            <h2 style={{ fontSize: 15, fontWeight: 900 }}>HISTORIAL DE VENTAS</h2>
            <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.5)' }}>
              {filter === 'all' ? 'Todos' : `Vendedor: ${filter}`} · {filteredSales.length} registro(s)
            </span>
          </div>

          {loading ? (
            <div style={{ padding: 40, textAlign: 'center', color: 'var(--gray-400)', fontSize: 13 }}>Cargando...</div>
          ) : filteredSales.length === 0 ? (
            <div style={{ padding: 40, textAlign: 'center', color: 'var(--gray-400)', fontSize: 13 }}>
              No hay ventas{filter !== 'all' ? ` para el vendedor "${filter}"` : ''} aún.
            </div>
          ) : (
            <div style={{ padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: 20 }}>
              {Object.entries(salesByDate).map(([date, daySales]) => {
                const dayRevenue = daySales.reduce((acc, s) => {
                  const prod = products.find(p => p.id === s.product_id)
                  const salePrice = s.price_at_sale ?? prod?.price ?? 0
                  return acc + salePrice
                }, 0)
                const dayProfit = daySales.reduce((acc, s) => {
                  const prod = products.find(p => p.id === s.product_id)
                  const salePrice = s.price_at_sale ?? prod?.price ?? 0
                  // Usa el costo histórico guardado en la venta
                  const buyCost = s.buy_price_at_sale ?? prod?.buy_price ?? 0
                  return acc + (salePrice - buyCost)
                }, 0)

                return (
                  <div key={date}>
                    {/* Day header */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8 }}>
                      <span style={{
                        background: 'var(--accent)', color: 'var(--black)',
                        fontWeight: 800, fontSize: 11, padding: '3px 10px', borderRadius: 4,
                      }}>{date}</span>
                      <span style={{ fontSize: 12, color: 'var(--gray-600)' }}>
                        {daySales.length} venta(s) · Bs. {dayRevenue.toFixed(2)} ingreso · <span style={{ color: 'var(--success)', fontWeight: 700 }}>Bs. {dayProfit.toFixed(2)} ganancia</span>
                      </span>
                      <div style={{ flex: 1, height: 1, background: 'var(--gray-100)' }} />
                    </div>

                    {/* Day sales */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 6, paddingLeft: 8 }}>
                      {daySales.map(s => {
                        const prod = products.find(p => p.id === s.product_id)
                        const time = new Date(s.sold_at).toLocaleTimeString('es', { hour: '2-digit', minute: '2-digit' })
                        const sellerColor = SELLER_COLORS[s.seller] || SELLER_COLORS.N
                        return (
                          <div key={s.id} style={{
                            display: 'flex', alignItems: 'center', gap: 12,
                            padding: '8px 12px', background: 'var(--gray-50)',
                            borderRadius: 'var(--radius-sm)', border: '1px solid var(--gray-100)',
                          }}>
                            {prod?.image_url && (
                              <img src={prod.image_url} alt="" crossOrigin="anonymous" loading="lazy"
                                style={{ width: 32, height: 32, objectFit: 'contain', borderRadius: 4 }} />
                            )}
                            <div style={{ flex: 1 }}>
                              <p style={{ fontSize: 13, fontWeight: 700 }}>{prod?.name || 'Producto eliminado'}</p>
                              <p style={{ fontSize: 11, color: 'var(--gray-500)' }}>{time}</p>
                            </div>
                            {/* Seller badge */}
                            <span style={{
                              background: sellerColor + '22',
                              color: sellerColor,
                              border: `1px solid ${sellerColor}55`,
                              fontWeight: 800, fontSize: 11,
                              padding: '2px 10px', borderRadius: 20,
                              letterSpacing: '0.05em',
                            }}>
                              {s.seller || 'N'}
                            </span>
                            <div style={{ textAlign: 'right' }}>
                              {(() => {
                                const salePrice = s.price_at_sale ?? prod?.price
                                const isCustom = s.price_at_sale != null && prod && s.price_at_sale !== prod.price
                                return (
                                  <>
                                    <p style={{ fontSize: 13, fontWeight: 800 }}>
                                      Bs. {salePrice ?? '—'}
                                      {isCustom && (
                                        <span title={`Precio de catálogo actual: Bs. ${prod.price}`}
                                          style={{ marginLeft: 4, fontSize: 9, background: '#e8f4fd', color: '#2196f3', borderRadius: 3, padding: '1px 5px', fontWeight: 700, verticalAlign: 'middle' }}>
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
                          </div>
                        )
                      })}
                    </div>
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

function MiniCard({ icon, label, value, accent }) {
  return (
    <div style={{
      background: accent ? 'var(--accent)' : 'rgba(255,255,255,0.08)',
      borderRadius: 'var(--radius-md)', padding: '14px 18px',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
        <span style={{ color: accent ? 'var(--black)' : 'rgba(255,255,255,0.5)' }}>{icon}</span>
        <span style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em',
          color: accent ? 'var(--black)' : 'rgba(255,255,255,0.5)' }}>
          {label}
        </span>
      </div>
      <p style={{ fontSize: 22, fontWeight: 900, color: accent ? 'var(--black)' : 'var(--white)' }}>{value}</p>
    </div>
  )
}

function SellerCard({ letter, color, stats }) {
  return (
    <div style={{
      background: `${color}18`,
      border: `1.5px solid ${color}44`,
      borderRadius: 'var(--radius-md)', padding: '14px 18px',
      display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12, alignItems: 'center',
    }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <span style={{
          background: color, color: '#000',
          fontWeight: 900, fontSize: 13, width: 26, height: 26,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          borderRadius: 6, flexShrink: 0,
        }}>{letter}</span>
        <div>
          <p style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color, opacity: 0.8 }}>Vendedor</p>
          <p style={{ fontSize: 20, fontWeight: 900, color }}>{stats.units} <span style={{ fontSize: 11, fontWeight: 600 }}>uds.</span></p>
        </div>
      </div>
      {/* Revenue */}
      <div>
        <p style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'rgba(255,255,255,0.4)', marginBottom: 4 }}>Ingresos</p>
        <p style={{ fontSize: 16, fontWeight: 900, color: 'var(--white)' }}>Bs. {stats.revenue.toFixed(2)}</p>
      </div>
      {/* Profit */}
      <div>
        <p style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'rgba(255,255,255,0.4)', marginBottom: 4 }}>Ganancia</p>
        <p style={{ fontSize: 16, fontWeight: 900, color }}>Bs. {stats.profit.toFixed(2)}</p>
      </div>
    </div>
  )
}
