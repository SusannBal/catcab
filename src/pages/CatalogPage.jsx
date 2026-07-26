import { useState } from 'react'
import { FileDown, Search } from 'lucide-react'
import { exportCatalogPdf } from '../lib/exportPdf'
import { Btn, Spinner, Badge } from '../components/UI'

const ALL = 'Todas'

const priceBadge = {
  width: 76, height: 76, borderRadius: '50%',
  background: 'var(--accent)', border: '3px solid var(--black)',
  display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
}

export default function CatalogPage({ products, stockOf, loading }) {
  const [search,   setSearch]   = useState('')
  const [category, setCategory] = useState(ALL)
  const [exporting, setExp]     = useState(false)

  const categories = [ALL, 'Cables', 'Audífonos', 'Audio']

  // Map new filter names → what to match in DB (handles old category values)
  const CAT_MATCH = {
    'Cables':    ['Cables', 'Cables y Audífonos'],
    'Audífonos': ['Audífonos'],
    'Audio':     ['Audio'],
  }

  const visible = products.filter(p => {
    const matchCat = category === ALL || (CAT_MATCH[category] || [category]).includes(p.category)
    const q = search.toLowerCase()
    const matchQ = !q || p.name?.toLowerCase().includes(q) || p.specs?.toLowerCase().includes(q)
    return matchCat && matchQ
  })

  async function handleExport() {
    setExp(true)
    try {
      await exportCatalogPdf(visible, 'catalogo.pdf', stockOf)
    } catch (err) {
      console.error('Error exportando PDF:', err)
    }
    setExp(false)
  }

  return (
    <div>
      {/* Controls */}
      <div style={{
        background: 'var(--white)', borderBottom: '1px solid var(--gray-100)',
        padding: '12px var(--page-pad)', display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap',
      }}>
        <div style={{ position: 'relative', flex: '1 1 200px' }}>
          <Search size={13} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: 'var(--gray-400)' }} />
          <input
            value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Buscar..."
            style={{
              width: '100%', padding: '8px 10px 8px 30px',
              border: '1.5px solid var(--gray-200)', borderRadius: 'var(--radius-sm)',
              fontSize: 13, outline: 'none',
            }}
          />
        </div>

        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
          {categories.map(cat => (
            <button key={cat} onClick={() => setCategory(cat)} style={{
              padding: '6px 12px', borderRadius: 20, fontSize: 12, fontWeight: 600,
              border: category === cat ? '2px solid var(--black)' : '1.5px solid var(--gray-200)',
              background: category === cat ? 'var(--black)' : 'var(--white)',
              color: category === cat ? 'var(--white)' : 'var(--gray-600)',
              cursor: 'pointer',
            }}>{cat}</button>
          ))}
        </div>

        <Btn variant="dark" style={{ marginLeft: 'auto' }} onClick={handleExport} disabled={exporting}>
          <FileDown size={14} />
          {exporting ? 'Exportando...' : 'Guardar PDF'}
        </Btn>
      </div>

      {/* Printable area */}
      <div style={{ padding: 'var(--page-pad)' }}>
        {loading ? <Spinner /> : (
          <div id="catalog-print" style={{ background: 'var(--white)', padding: 'var(--page-pad)', borderRadius: 'var(--radius-md)' }}>
            {/* Header */}
            <div style={{
              background: 'var(--black)', color: 'var(--white)',
              borderRadius: 'var(--radius-md)', padding: '16px 24px',
              marginBottom: 24, display: 'flex', justifyContent: 'space-between', alignItems: 'center',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <Badge color="var(--accent)">CATÁLOGO</Badge>
                <h1 style={{ fontSize: 20, fontWeight: 900, letterSpacing: '-0.02em' }}>
                  PRODUCTOS
                </h1>
              </div>
              <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.5)', fontWeight: 600 }}>
                {new Date().toLocaleString('es', { month: 'long', year: 'numeric' }).toUpperCase()}
              </p>
            </div>

            {/* Grid */}
            {visible.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '60px 0', color: 'var(--gray-400)', fontSize: 13 }}>
                Sin productos para mostrar.
              </div>
            ) : (
              <div className="card-grid" style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(170px, 1fr))',
                gap: 12,
              }}>
                {visible.map(p => {
                  const stock = stockOf(p)
                  const outOfStock = stock <= 0
                  return (
                    <div key={p.id} style={{
                      border: outOfStock
                        ? '1.5px solid var(--gray-200)'
                        : '1.5px solid var(--gray-200)',
                      borderRadius: 'var(--radius-md)',
                      overflow: 'hidden',
                      display: 'flex', flexDirection: 'column',
                      boxShadow: 'var(--shadow)',
                      opacity: outOfStock ? 0.65 : 1,
                      position: 'relative',
                    }}>
                      {/* Agotado ribbon */}
                      {outOfStock && (
                        <div style={{
                          position: 'absolute', top: 12, right: -22,
                          background: 'var(--danger)', color: 'var(--white)',
                          fontSize: 9, fontWeight: 800, padding: '3px 28px',
                          transform: 'rotate(35deg)', letterSpacing: '0.08em',
                          zIndex: 2,
                        }}>AGOTADO</div>
                      )}

                      {/* Image */}
                      <div style={{
                        height: 170, background: 'var(--gray-50)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        overflow: 'hidden', borderBottom: '1px solid var(--gray-100)',
                      }}>
                        {p.image_url
                          ? <img src={p.image_url} alt={p.name} crossOrigin="anonymous" style={{ width: '100%', height: '100%', objectFit: 'contain', padding: 8 }} />
                          : <span style={{ color: 'var(--gray-300)', fontSize: 12 }}>Sin imagen</span>
                        }
                      </div>

                      {/* Content */}
                      <div style={{ padding: '12px 14px', display: 'flex', flexDirection: 'column', gap: 5, flex: 1 }}>
                        <span style={{
                          fontSize: 9, fontWeight: 800, textTransform: 'uppercase',
                          letterSpacing: '0.07em', background: 'var(--black)', color: 'var(--white)',
                          padding: '2px 7px', borderRadius: 3, alignSelf: 'flex-start',
                        }}>{p.category}</span>

                        <p style={{ fontWeight: 800, fontSize: 13, lineHeight: 1.3 }}>{p.name}</p>
                        {p.model && <p style={{ fontSize: 11, color: 'var(--gray-600)', fontWeight: 600 }}>{p.model}</p>}
                        {p.specs && <p style={{ fontSize: 11, color: 'var(--gray-600)', lineHeight: 1.5 }}>{p.specs}</p>}

                        {/* Price circle */}
                        <div style={{ marginTop: 'auto', paddingTop: 10 }}>
                          <div style={priceBadge}>
                            <span style={{ fontSize: 8, fontWeight: 800, lineHeight: 1 }}>Bs.</span>
                            <span style={{ fontSize: 21, fontWeight: 900, lineHeight: 1 }}>{p.price}</span>
                            {p.installments && (
                              <span style={{ fontSize: 7, fontWeight: 700, lineHeight: 1.3, textAlign: 'center', maxWidth: 64 }}>
                                {p.installments}
                              </span>
                            )}
                          </div>
                        </div>
                        {p.code && <p style={{ fontSize: 10, color: 'var(--gray-400)' }}>Cód: {p.code}</p>}
                      </div>
                    </div>
                  )
                })}
              </div>
            )}

            {/* Footer */}
            <p style={{ marginTop: 24, fontSize: 10, color: 'var(--gray-400)', borderTop: '1px solid var(--gray-100)', paddingTop: 12 }}>
              Precios en bolivianos. Válidos hasta agotar existencias.
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
