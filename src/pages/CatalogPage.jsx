import { useState } from 'react'
import { FileDown, Search } from 'lucide-react'
import { exportCatalogPdf } from '../lib/exportPdf'
import { Btn, Spinner, Badge } from '../components/UI'

const ALL = 'Todas'

const clamp = lines => ({
  overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: lines, WebkitBoxOrient: 'vertical',
})

export default function CatalogPage({ products, stockOf, isArchived, loading }) {
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
    if (isArchived(p)) return false
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
        background: 'var(--surface)', borderBottom: '1px solid var(--gray-100)',
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
              fontSize: 13, outline: 'none', background: 'var(--surface)', color: 'var(--text)',
            }}
          />
        </div>

        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
          {categories.map(cat => (
            <button key={cat} onClick={() => setCategory(cat)} style={{
              padding: '6px 14px', borderRadius: 20, fontSize: 12, fontWeight: 700,
              border: category === cat ? '1.5px solid var(--accent)' : '1.5px solid var(--gray-200)',
              background: category === cat ? 'var(--accent)' : 'var(--surface)',
              color: category === cat ? '#111' : 'var(--gray-600)',
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
          <div id="catalog-print">
            {/* Header */}
            <div style={{
              background: '#111', color: '#fff', border: '1px solid var(--gray-200)',
              borderRadius: 'var(--radius-md)', padding: '16px 22px',
              marginBottom: 20, display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12, flexWrap: 'wrap',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <Badge color="var(--accent)">CATÁLOGO</Badge>
                <h1 style={{ fontSize: 20, fontWeight: 900, letterSpacing: '-0.02em' }}>
                  PRODUCTOS
                </h1>
                <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.5)', fontWeight: 700 }}>{visible.length} disponibles</span>
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
                gridTemplateColumns: 'repeat(auto-fill, minmax(190px, 1fr))',
                gap: 16,
              }}>
                {visible.map(p => (
                  <div key={p.id} className="product-card" style={{
                    background: 'var(--surface)', border: '1px solid var(--gray-100)',
                    borderRadius: 14, overflow: 'hidden',
                    display: 'flex', flexDirection: 'column', boxShadow: 'var(--shadow)',
                  }}>
                    {/* Imagen: siempre sobre blanco para que las fotos de producto se vean limpias */}
                    <div style={{
                      aspectRatio: '1 / 1', background: '#fff',
                      display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden',
                    }}>
                      {p.image_url
                        ? <img src={p.image_url} alt={p.name} crossOrigin="anonymous" loading="lazy" style={{ width: '100%', height: '100%', objectFit: 'contain', padding: 12 }} />
                        : <span style={{ color: '#bbb', fontSize: 12 }}>Sin imagen</span>
                      }
                    </div>

                    {/* Contenido */}
                    <div style={{ padding: '12px 14px 14px', display: 'flex', flexDirection: 'column', gap: 6, flex: 1, borderTop: '1px solid var(--gray-100)' }}>
                      <span style={{
                        fontSize: 10, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--gray-500)',
                      }}>{p.category}</span>

                      <p style={{ fontWeight: 800, fontSize: 14, lineHeight: 1.3, ...clamp(2) }}>{p.name}</p>
                      {p.model && <p style={{ fontSize: 11, color: 'var(--gray-600)', fontWeight: 600 }}>{p.model}</p>}
                      {p.specs && <p style={{ fontSize: 11, color: 'var(--gray-500)', lineHeight: 1.5, ...clamp(3) }}>{p.specs}</p>}

                      {/* Precio */}
                      <div style={{ marginTop: 'auto', paddingTop: 10, display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: 8 }}>
                        <div>
                          <span style={{
                            display: 'inline-flex', alignItems: 'baseline', gap: 3,
                            background: 'var(--accent)', color: '#111', borderRadius: 8, padding: '5px 10px',
                          }}>
                            <span style={{ fontSize: 11, fontWeight: 800 }}>Bs.</span>
                            <span style={{ fontSize: 20, fontWeight: 900, lineHeight: 1 }}>{p.price}</span>
                          </span>
                          {p.installments && (
                            <p style={{ fontSize: 10, color: 'var(--gray-500)', fontWeight: 700, marginTop: 4 }}>{p.installments}</p>
                          )}
                        </div>
                        {p.code && <span style={{ fontSize: 10, color: 'var(--gray-400)', fontWeight: 700, whiteSpace: 'nowrap' }}>{p.code}</span>}
                      </div>
                    </div>
                  </div>
                ))}
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
