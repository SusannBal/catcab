import { useMemo, useState } from 'react'
import {
  Truck, Pencil, Trash2, Phone, Plus, X, Check, AlertTriangle, Search, Save,
  MapPin, Clock, Globe, Star, User, CreditCard, PackageCheck, ExternalLink,
} from 'lucide-react'
import { Btn, Field, Input, Textarea, Select, Badge } from '../components/UI'

function fmtBs(n) { return `Bs. ${(Number(n) || 0).toFixed(2)}` }

const TIPOS   = ['Tienda física', 'Mayorista', 'Importador', 'Tienda online', 'Feria / mercado', 'Otro']
const PAGOS   = ['Efectivo', 'QR', 'Transferencia', 'Tarjeta', 'Crédito']
const CIUDADES = ['La Paz', 'El Alto', 'Santa Cruz', 'Cochabamba', 'Oruro', 'Potosí', 'Sucre', 'Tarija', 'Trinidad', 'Cobija']

const EMPTY = {
  id: null, nombre: '', telefono: '', notas: '',
  tipo: '', contacto: '', direccion: '', ciudad: '', maps_url: '', horario: '', web: '',
  metodos_pago: '', tiempo_entrega: '', compra_minima: '', hace_envios: false, calificacion: null,
}

const card = {
  background: 'var(--surface)', border: '1.5px solid var(--gray-100)',
  borderRadius: 'var(--radius-md)', boxShadow: 'var(--shadow)', minWidth: 0,
}
const groupTitle = {
  fontSize: 11, fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.07em',
  color: 'var(--gray-500)', paddingBottom: 6, borderBottom: '1px solid var(--gray-100)',
}

// Enlaces útiles
function waLink(tel) {
  const digits = (tel || '').replace(/\D/g, '')
  return digits ? `https://wa.me/${digits.length === 8 ? '591' + digits : digits}` : null
}
function mapsLink(p) {
  if (p.maps_url) return p.maps_url
  const q = [p.direccion, p.ciudad].filter(Boolean).join(', ')
  return q ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(q)}` : null
}
function webLink(w) {
  if (!w) return null
  return /^https?:\/\//i.test(w) ? w : `https://${w}`
}
function splitPagos(s) { return (s || '').split(',').map(x => x.trim()).filter(Boolean) }

// Lista de nombres para elegir: los guardados + los que ya aparecen en entradas
export function useProveedorNames(proveedores, entradas) {
  return useMemo(() => {
    const set = new Map()
    proveedores.forEach(p => set.set(p.nombre.toLowerCase(), p.nombre))
    entradas.forEach(e => { const n = e.proveedor?.trim(); if (n && !set.has(n.toLowerCase())) set.set(n.toLowerCase(), n) })
    return [...set.values()].sort((a, b) => a.localeCompare(b))
  }, [proveedores, entradas])
}

// Selector de proveedor con opción de agregar uno nuevo sin salir del formulario
export function ProveedorSelect({ value, onChange, names, onCreate, disabled }) {
  const [adding, setAdding] = useState(false)
  const [nuevo, setNuevo] = useState('')
  const [busy, setBusy] = useState(false)
  const list = value && !names.includes(value) ? [...names, value] : names

  async function add() {
    const name = nuevo.trim()
    if (!name) return
    setBusy(true)
    try {
      const saved = await onCreate(name)
      onChange(saved?.nombre ?? name)
      setAdding(false); setNuevo('')
    } catch (err) {
      window.alert(err.message)
    } finally { setBusy(false) }
  }

  if (adding) return (
    <div style={{ display: 'flex', gap: 6 }}>
      <Input autoFocus value={nuevo} onChange={e => setNuevo(e.target.value)} placeholder="Nombre del proveedor"
        onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); add() } if (e.key === 'Escape') setAdding(false) }} />
      <Btn variant="success" type="button" onClick={add} disabled={busy} style={{ padding: '6px 10px' }} title="Agregar"><Check size={14} /></Btn>
      <Btn variant="ghost" type="button" onClick={() => setAdding(false)} style={{ padding: '6px 8px' }} title="Cancelar"><X size={14} /></Btn>
    </div>
  )

  return (
    <select
      value={value || ''} disabled={disabled}
      onChange={e => e.target.value === '__new' ? setAdding(true) : onChange(e.target.value)}
      style={{
        width: '100%', padding: '8px 11px', border: '1.5px solid var(--gray-200)', borderRadius: 'var(--radius-sm)',
        fontSize: 13, outline: 'none', color: 'var(--text)', background: 'var(--surface)',
      }}>
      <option value="">Sin proveedor</option>
      {list.map(n => <option key={n} value={n}>{n}</option>)}
      <option value="__new">+ Agregar proveedor nuevo...</option>
    </select>
  )
}

function Stars({ value, onChange, size = 18 }) {
  return (
    <div style={{ display: 'inline-flex', gap: 2 }}>
      {[1, 2, 3, 4, 5].map(n => {
        const on = (value || 0) >= n
        const Tag = onChange ? 'button' : 'span'
        return (
          <Tag key={n} type={onChange ? 'button' : undefined}
            onClick={onChange ? () => onChange(value === n ? null : n) : undefined}
            title={onChange ? `${n} de 5` : undefined}
            style={{ background: 'none', border: 'none', padding: 0, display: 'flex', color: on ? 'var(--accent)' : 'var(--gray-300)' }}>
            <Star size={size} fill={on ? 'currentColor' : 'none'} />
          </Tag>
        )
      })}
    </div>
  )
}

function Chip({ children, active, onClick }) {
  return (
    <button type="button" onClick={onClick} style={{
      padding: '5px 11px', borderRadius: 99, fontSize: 12, fontWeight: 700,
      border: active ? '1.5px solid var(--accent)' : '1.5px solid var(--gray-200)',
      background: active ? 'var(--accent)' : 'var(--surface)',
      color: active ? '#111' : 'var(--gray-600)',
    }}>{children}</button>
  )
}

export default function ProveedoresSection({ proveedores = [], entradas = [], products = [], canProveedores, provExtra = true, saveProveedor, deleteProveedor }) {
  const [form, setForm]     = useState(EMPTY)
  const [saving, setSaving] = useState(false)
  const [error, setError]   = useState('')
  const [search, setSearch] = useState('')
  const [sortBy, setSortBy] = useState('compras') // 'compras' | 'calificacion' | 'nombre'

  const productMap = useMemo(() => Object.fromEntries(products.map(p => [p.id, p])), [products])

  // Estadísticas por proveedor a partir de las entradas
  const rows = useMemo(() => {
    const map = new Map()
    const get = name => {
      const k = name.toLowerCase()
      if (!map.has(k)) map.set(k, { nombre: name, saved: null, total: 0, units: 0, count: 0, last: null, prods: {} })
      return map.get(k)
    }
    proveedores.forEach(p => { get(p.nombre).saved = p })
    entradas.forEach(e => {
      const n = e.proveedor?.trim(); if (!n) return
      const r = get(n)
      const qty = Number(e.cantidad) || 0
      r.total += qty * (Number(e.buy_price) || 0); r.units += qty; r.count++
      const t = new Date(e.entered_at); if (!r.last || t > r.last) r.last = t
      r.prods[e.product_id] = (r.prods[e.product_id] || 0) + qty
    })
    return [...map.values()].map(r => ({
      ...r,
      avg: r.units ? r.total / r.units : 0,
      topProducts: Object.entries(r.prods).sort((a, b) => b[1] - a[1]).slice(0, 3)
        .map(([id, qty]) => `${productMap[id]?.name ?? 'Producto eliminado'} (${qty})`),
    }))
  }, [proveedores, entradas, productMap])

  const SORTERS = {
    compras:      (a, b) => b.total - a.total || a.nombre.localeCompare(b.nombre),
    calificacion: (a, b) => (b.saved?.calificacion || 0) - (a.saved?.calificacion || 0) || a.nombre.localeCompare(b.nombre),
    nombre:       (a, b) => a.nombre.localeCompare(b.nombre),
  }
  const grandTotal = rows.reduce((a, r) => a + r.total, 0)
  const q = search.toLowerCase()
  const visible = rows
    .filter(r => {
      if (!q) return true
      const s = r.saved || {}
      return [r.nombre, s.notas, s.tipo, s.contacto, s.direccion, s.ciudad, s.metodos_pago]
        .some(v => v?.toLowerCase().includes(q))
    })
    .sort(SORTERS[sortBy])

  const set  = k => e => setForm(f => ({ ...f, [k]: e.target.value }))
  const pagos = splitPagos(form.metodos_pago)
  function togglePago(p) {
    const next = pagos.includes(p) ? pagos.filter(x => x !== p) : [...pagos, p]
    setForm(f => ({ ...f, metodos_pago: next.join(', ') }))
  }

  function startEdit(p) {
    const f = { ...EMPTY }
    Object.keys(EMPTY).forEach(k => { if (p[k] !== undefined && p[k] !== null) f[k] = p[k] })
    setForm(f); setError('')
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  async function handleSave(e) {
    e.preventDefault()
    setSaving(true); setError('')
    try {
      const payload = { ...form }
      if (!provExtra) Object.keys(EMPTY).forEach(k => { if (!['id', 'nombre', 'telefono', 'notas'].includes(k)) delete payload[k] })
      await saveProveedor(payload)
      setForm(EMPTY)
    }
    catch (err) { setError(err.message) }
    finally { setSaving(false) }
  }

  async function quickSave(nombre) {
    try { await saveProveedor({ nombre }) }
    catch (err) { window.alert(err.message) }
  }

  async function handleDelete(p) {
    if (!window.confirm(`¿Quitar a "${p.nombre}" de la lista de proveedores?\nLas entradas registradas conservan el nombre.`)) return
    try { await deleteProveedor(p.id); if (form.id === p.id) setForm(EMPTY) }
    catch (err) { window.alert(err.message) }
  }

  const disabledAll   = !canProveedores
  const disabledExtra = !canProveedores || !provExtra
  const formMapsLink  = mapsLink(form)

  return (
    <div>
      {!canProveedores && (
        <Notice>
          Para guardar proveedores, ejecuta <strong>migration-proveedores-tabla.sql</strong> en el SQL Editor de Supabase y recarga la página.
          Mientras tanto se muestran los proveedores que ya usaste en entradas.
        </Notice>
      )}
      {canProveedores && !provExtra && (
        <Notice>
          Para guardar lugar de compra, contacto, pagos y demás datos, ejecuta <strong>migration-proveedores-datos.sql</strong> en el SQL Editor de Supabase y recarga la página.
        </Notice>
      )}

      <datalist id="ciudades-list">{CIUDADES.map(c => <option key={c} value={c} />)}</datalist>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(340px, 100%), 1fr))', gap: 20, alignItems: 'start' }}>
        {/* ── Formulario ── */}
        <form onSubmit={handleSave} style={{ ...card, padding: 20, display: 'flex', flexDirection: 'column', gap: 16 }}>
          <h3 style={{ fontSize: 15, fontWeight: 900, display: 'flex', alignItems: 'center', gap: 8 }}>
            {form.id ? <><Pencil size={16} /> Editar proveedor</> : <><Plus size={16} /> Nuevo proveedor</>}
          </h3>

          {/* Datos básicos */}
          <p style={groupTitle}>Datos básicos</p>
          <div style={grid2}>
            <Field label="Nombre *">
              <Input value={form.nombre} onChange={set('nombre')} placeholder="Ej: Importadora X" disabled={disabledAll} />
            </Field>
            <Field label="Tipo">
              <Select value={form.tipo} onChange={set('tipo')} disabled={disabledExtra}>
                <option value="">Sin especificar</option>
                {TIPOS.map(t => <option key={t}>{t}</option>)}
              </Select>
            </Field>
            <Field label="Persona de contacto">
              <Input value={form.contacto} onChange={set('contacto')} placeholder="Ej: Don Carlos" disabled={disabledExtra} />
            </Field>
            <Field label="Teléfono / WhatsApp">
              <Input value={form.telefono} onChange={set('telefono')} placeholder="Ej: 70012345" inputMode="tel" disabled={disabledAll} />
            </Field>
          </div>

          {/* Lugar de compra */}
          <p style={groupTitle}>Lugar de compra</p>
          <div style={grid2}>
            <div style={{ gridColumn: '1 / -1' }}>
              <Field label="Dirección / referencia">
                <Input value={form.direccion} onChange={set('direccion')} placeholder="Ej: Calle Eloy Salmón, galería X, puesto 12" disabled={disabledExtra} />
              </Field>
            </div>
            <Field label="Ciudad">
              <Input list="ciudades-list" value={form.ciudad} onChange={set('ciudad')} placeholder="Ej: La Paz" disabled={disabledExtra} />
            </Field>
            <Field label="Horario de atención">
              <Input value={form.horario} onChange={set('horario')} placeholder="Ej: Lun-Sáb 9:00-19:00" disabled={disabledExtra} />
            </Field>
            <div style={{ gridColumn: '1 / -1' }}>
              <Field label="Enlace de Google Maps (opcional)">
                <div style={{ display: 'flex', gap: 6 }}>
                  <Input value={form.maps_url} onChange={set('maps_url')} placeholder="Pega aquí el enlace de la ubicación" disabled={disabledExtra} />
                  {formMapsLink && (
                    <a href={formMapsLink} target="_blank" rel="noreferrer" title="Ver en el mapa" style={linkBtn}>
                      <MapPin size={14} />
                    </a>
                  )}
                </div>
              </Field>
            </div>
          </div>

          {/* Condiciones */}
          <p style={groupTitle}>Condiciones de compra</p>
          <Field label="Métodos de pago">
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', opacity: disabledExtra ? 0.5 : 1, pointerEvents: disabledExtra ? 'none' : 'auto' }}>
              {PAGOS.map(p => <Chip key={p} active={pagos.includes(p)} onClick={() => togglePago(p)}>{p}</Chip>)}
            </div>
          </Field>
          <div style={grid2}>
            <Field label="Tiempo de entrega">
              <Input value={form.tiempo_entrega} onChange={set('tiempo_entrega')} placeholder="Ej: Inmediato, 3-5 días" disabled={disabledExtra} />
            </Field>
            <Field label="Compra mínima">
              <Input value={form.compra_minima} onChange={set('compra_minima')} placeholder="Ej: Docena, Bs. 500" disabled={disabledExtra} />
            </Field>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap', opacity: disabledExtra ? 0.5 : 1 }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, fontWeight: 700, cursor: 'pointer' }}>
              <input type="checkbox" checked={!!form.hace_envios} disabled={disabledExtra}
                onChange={e => setForm(f => ({ ...f, hace_envios: e.target.checked }))}
                style={{ width: 16, height: 16, accentColor: 'var(--accent)' }} />
              Hace envíos
            </label>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, pointerEvents: disabledExtra ? 'none' : 'auto' }}>
              <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--gray-600)' }}>Calificación</span>
              <Stars value={form.calificacion} onChange={v => setForm(f => ({ ...f, calificacion: v }))} />
            </div>
          </div>

          {/* Otros */}
          <p style={groupTitle}>Otros</p>
          <Field label="Página web o redes">
            <Input value={form.web} onChange={set('web')} placeholder="Ej: facebook.com/importadorax" disabled={disabledExtra} />
          </Field>
          <Field label="Notas">
            <Textarea rows={3} value={form.notas} onChange={set('notas')} placeholder="Qué vende, precios por mayor, garantías..." disabled={disabledAll} />
          </Field>

          {error && <p style={{ fontSize: 12, color: 'var(--danger)', background: 'var(--tint-danger)', padding: '8px 12px', borderRadius: 6 }}>{error}</p>}
          <div style={{ display: 'flex', gap: 8 }}>
            {form.id && <Btn variant="ghost" type="button" onClick={() => { setForm(EMPTY); setError('') }} style={{ flex: 1, justifyContent: 'center' }}>Cancelar</Btn>}
            <Btn variant="primary" type="submit" disabled={saving || disabledAll || !form.nombre.trim()}
              style={{ flex: 2, justifyContent: 'center', padding: '11px 18px', opacity: (disabledAll || !form.nombre.trim()) ? 0.5 : 1 }}>
              <Save size={14} /> {saving ? 'Guardando...' : form.id ? 'Guardar cambios' : 'Agregar proveedor'}
            </Btn>
          </div>
          {form.id && <p style={{ fontSize: 11, color: 'var(--gray-500)' }}>Si cambias el nombre, también se actualiza en sus entradas.</p>}
        </form>

        {/* ── Lista ── */}
        <div style={{ ...card, overflow: 'hidden' }}>
          <div style={{ padding: '16px 18px', borderBottom: '1px solid var(--gray-100)', display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
            <h3 style={{ fontSize: 15, fontWeight: 900, flex: '1 1 auto' }}>Proveedores ({rows.length})</h3>
            <select value={sortBy} onChange={e => setSortBy(e.target.value)} style={{
              padding: '7px 10px', border: '1.5px solid var(--gray-200)', borderRadius: 'var(--radius-sm)',
              fontSize: 12, fontWeight: 700, background: 'var(--surface)', color: 'var(--text)',
            }}>
              <option value="compras">Más compras</option>
              <option value="calificacion">Mejor calificados</option>
              <option value="nombre">Nombre (A-Z)</option>
            </select>
            <div style={{ position: 'relative', flex: '1 1 160px' }}>
              <Search size={13} style={{ position: 'absolute', left: 10, top: 10, color: 'var(--gray-400)' }} />
              <Input value={search} onChange={e => setSearch(e.target.value)} placeholder="Nombre, ciudad, tipo..." style={{ paddingLeft: 30, fontSize: 12 }} />
            </div>
          </div>

          {visible.length === 0 ? (
            <p style={{ padding: 24, textAlign: 'center', color: 'var(--gray-400)', fontSize: 13 }}>
              {rows.length === 0 ? 'Todavía no hay proveedores. Agrega el primero con el formulario.' : 'Ningún proveedor coincide.'}
            </p>
          ) : visible.map(r => {
            const s = r.saved || {}
            const share = grandTotal > 0 ? Math.round((r.total / grandTotal) * 100) : 0
            const wa = waLink(s.telefono)
            const maps = mapsLink(s)
            const web = webLink(s.web)
            const lugar = [s.direccion, s.ciudad].filter(Boolean).join(', ')
            const conds = [
              ...splitPagos(s.metodos_pago).map(p => ({ icon: CreditCard, text: p })),
              s.hace_envios && { icon: Truck, text: 'Hace envíos' },
              s.tiempo_entrega && { icon: Clock, text: `Entrega: ${s.tiempo_entrega}` },
              s.compra_minima && { icon: PackageCheck, text: `Mínimo: ${s.compra_minima}` },
            ].filter(Boolean)

            return (
              <div key={r.nombre} style={{ padding: '16px 18px', borderBottom: '1px solid var(--gray-100)', background: form.id && form.id === s.id ? 'var(--gray-50)' : 'transparent' }}>
                {/* Cabecera */}
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
                  <div style={{
                    width: 40, height: 40, borderRadius: 10, flexShrink: 0, background: 'var(--accent)', color: '#111',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16, fontWeight: 900,
                  }}>{r.nombre.charAt(0).toUpperCase()}</div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                      <p style={{ fontSize: 15, fontWeight: 900 }}>{r.nombre}</p>
                      {s.tipo && <Badge color="var(--black)">{s.tipo}</Badge>}
                      {!r.saved && <Badge color="var(--gray-400)">No guardado</Badge>}
                    </div>
                    {s.calificacion ? <div style={{ marginTop: 3 }}><Stars value={s.calificacion} size={13} /></div> : null}
                  </div>
                  <div style={{ display: 'flex', gap: 4, flexShrink: 0 }}>
                    {r.saved ? (
                      <>
                        <button title="Editar" onClick={() => startEdit(r.saved)} style={iconBtn}><Pencil size={13} /></button>
                        <button title="Quitar de la lista" onClick={() => handleDelete(r.saved)} style={{ ...iconBtn, color: 'var(--danger)' }}><Trash2 size={13} /></button>
                      </>
                    ) : canProveedores && (
                      <Btn variant="ghost" onClick={() => quickSave(r.nombre)} style={{ padding: '5px 10px', fontSize: 11 }}><Save size={12} /> Guardar</Btn>
                    )}
                  </div>
                </div>

                {/* Contacto y lugar */}
                {(s.contacto || s.telefono || lugar || s.horario || web) && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 5, marginTop: 10, fontSize: 12, color: 'var(--gray-700)' }}>
                    {(s.contacto || s.telefono) && (
                      <span style={infoLine}>
                        {s.contacto && <><User size={12} /> {s.contacto}</>}
                        {s.contacto && s.telefono && <span style={{ color: 'var(--gray-300)' }}>|</span>}
                        {s.telefono && <><Phone size={12} /> {s.telefono}</>}
                        {wa && <a href={wa} target="_blank" rel="noreferrer" style={{ ...pillLink, color: 'var(--success)', borderColor: 'var(--tint-success-border)' }}>WhatsApp</a>}
                      </span>
                    )}
                    {lugar && (
                      <span style={infoLine}>
                        <MapPin size={12} /> {lugar}
                        {maps && <a href={maps} target="_blank" rel="noreferrer" style={pillLink}>Ver mapa <ExternalLink size={10} /></a>}
                      </span>
                    )}
                    {!lugar && s.maps_url && (
                      <span style={infoLine}><MapPin size={12} /><a href={s.maps_url} target="_blank" rel="noreferrer" style={pillLink}>Ver ubicación <ExternalLink size={10} /></a></span>
                    )}
                    {s.horario && <span style={infoLine}><Clock size={12} /> {s.horario}</span>}
                    {web && (
                      <span style={infoLine}>
                        <Globe size={12} />
                        <a href={web} target="_blank" rel="noreferrer" style={{ color: 'var(--text)', fontWeight: 700, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', minWidth: 0 }}>{s.web}</a>
                      </span>
                    )}
                  </div>
                )}

                {/* Condiciones */}
                {conds.length > 0 && (
                  <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap', marginTop: 10 }}>
                    {conds.map(c => {
                      const Icon = c.icon
                      return (
                        <span key={c.text} style={{
                          display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 11, fontWeight: 700,
                          background: 'var(--gray-100)', color: 'var(--gray-700)', padding: '3px 9px', borderRadius: 99,
                        }}><Icon size={11} /> {c.text}</span>
                      )
                    })}
                  </div>
                )}

                {s.notas && <p style={{ fontSize: 12, color: 'var(--gray-500)', marginTop: 8, lineHeight: 1.5 }}>{s.notas}</p>}

                {/* Compras */}
                {r.count > 0 ? (
                  <div style={{ marginTop: 12, paddingTop: 12, borderTop: '1px dashed var(--gray-200)' }}>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(90px, 1fr))', gap: 8 }}>
                      <Mini label="Comprado" value={fmtBs(r.total)} color="var(--danger)" />
                      <Mini label="Unidades" value={r.units} />
                      <Mini label="Costo prom." value={fmtBs(r.avg)} />
                      <Mini label="Última compra" value={r.last.toLocaleDateString('es', { day: '2-digit', month: 'short' })} />
                    </div>
                    <div style={{ marginTop: 10, background: 'var(--gray-100)', borderRadius: 99, height: 6, overflow: 'hidden' }}>
                      <div style={{ width: `${share}%`, height: '100%', background: 'var(--danger)', borderRadius: 99 }} />
                    </div>
                    <p style={{ fontSize: 10, color: 'var(--gray-500)', marginTop: 5, lineHeight: 1.5 }}>
                      {share}% de todas las compras · {r.count} entrada{r.count !== 1 ? 's' : ''} · {r.topProducts.join(', ')}
                    </p>
                  </div>
                ) : (
                  <p style={{ fontSize: 11, color: 'var(--gray-400)', marginTop: 10, fontStyle: 'italic' }}>Aún sin entradas registradas.</p>
                )}
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}

function Notice({ children }) {
  return (
    <div style={{
      display: 'flex', gap: 10, alignItems: 'flex-start', padding: '12px 16px', marginBottom: 16,
      background: 'var(--tint-warn)', border: '1.5px solid var(--tint-warn-border)', color: 'var(--tint-warn-text)',
      borderRadius: 'var(--radius-sm)', fontSize: 12, lineHeight: 1.5,
    }}>
      <AlertTriangle size={16} style={{ flexShrink: 0, marginTop: 1 }} />
      <span>{children}</span>
    </div>
  )
}

function Mini({ label, value, color }) {
  return (
    <div style={{ background: 'var(--gray-50)', border: '1px solid var(--gray-100)', borderRadius: 8, padding: '7px 10px', minWidth: 0 }}>
      <p style={{ fontSize: 9, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--gray-500)' }}>{label}</p>
      <p style={{ fontSize: 13, fontWeight: 900, color: color || 'var(--text)', whiteSpace: 'nowrap' }}>{value}</p>
    </div>
  )
}

const grid2 = { display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: 12 }
const infoLine = { display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap', minWidth: 0 }
const pillLink = {
  display: 'inline-flex', alignItems: 'center', gap: 3, fontSize: 11, fontWeight: 800, textDecoration: 'none',
  color: 'var(--text)', border: '1px solid var(--gray-200)', padding: '1px 8px', borderRadius: 99,
}
const linkBtn = {
  width: 36, flexShrink: 0, borderRadius: 'var(--radius-sm)', border: '1.5px solid var(--gray-200)',
  display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text)', background: 'var(--surface)',
}
const iconBtn = {
  width: 30, height: 30, borderRadius: 'var(--radius-sm)', border: '1.5px solid var(--gray-200)',
  background: 'var(--surface)', color: 'var(--gray-600)', display: 'flex', alignItems: 'center', justifyContent: 'center',
}
