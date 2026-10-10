import { useMemo, useState } from 'react'
import {
  TrendingUp, TrendingDown, DollarSign, ShoppingBag, Star, Lightbulb,
  Calendar, BarChart2, Percent, AlertTriangle, AlertCircle, Info,
  Clock, ArrowDownRight, ArrowUpRight, PackageSearch, BadgePercent,
  Wallet, PackagePlus, Package, Activity, Sigma, Scale, Archive, Sparkles, X,
  Layers, Truck, FileSpreadsheet,
} from 'lucide-react'
import { computeLots, remainingValue } from '../lib/lots'

// ─── Colores por serie (versión más oscura en modo claro para que se lean) ──
const PALETTE = {
  dark:  { ing: '#F5C400', gas: '#e5534b', bal: '#60c8f0', gan: '#27ae60' },
  light: { ing: '#b58900', gas: '#d1403a', bal: '#1a85c2', gan: '#1e9650' },
}
const COL = { ...PALETTE.dark }  // ing = ingresos (ventas), gas = gastos (entradas), bal = balance, gan = ganancia

// ─── Nota de novedades (se muestra una vez por versión) ───────────
const NEWS_KEY = 'novedades-2026-10-10e'
const NEWS = [
  { title: 'Contáctanos', body: 'Nueva pestaña "Contáctanos" en la barra superior, junto a Ventas, con un formulario para reportar errores, quejas, sugerencias o preguntas. Los mensajes quedan guardados como pendientes y se pueden marcar como resueltos.' },
  { title: 'Costos por lote exactos', body: 'Cada compra (stock inicial y cada entrada) lleva su propia cuenta de unidades. Al vender solo aparecen los costos que aún tienen unidades, con cuántas quedan de cada uno, y viene marcada la compra más antigua (primero en salir). Si compras más barato, las unidades que ya tenías se siguen vendiendo con su costo original. El valor del inventario en el Dashboard usa este mismo cálculo.' },
  { title: 'Sección de proveedores', body: 'En Entradas hay una pestaña "Proveedores". Guarda el lugar de compra (dirección, ciudad, mapa y horario), la persona de contacto, el teléfono con enlace a WhatsApp, el tipo de proveedor, los métodos de pago, si hace envíos, el tiempo de entrega, la compra mínima, la página o redes y una calificación de 1 a 5. También muestra cuánto le compraste, su costo promedio y qué productos te vende. Al registrar una entrada eliges el proveedor de una lista o agregas uno nuevo ahí mismo.' },
  { title: 'Entradas rediseñada', body: 'Formulario en 3 pasos con resumen del gasto y del stock final, e historial agrupado por mes con buscador. Tu precio de venta solo cambia si escribes uno distinto; el formulario te avisa si se mantiene o cambia.' },
  { title: 'Catálogo y colores renovados', body: 'Tarjetas de producto más limpias, con la foto sobre fondo blanco y el precio en etiqueta amarilla. En modo oscuro los botones, chips y textos ahora tienen buen contraste.' },
  { title: 'Proveedor y fecha en las entradas', body: 'Al registrar una entrada eliges el proveedor de una lista y la fecha de la compra (también se pueden corregir en entradas anteriores con el lápiz). En el Dashboard verás cuánto le compras a cada proveedor y a qué costo promedio.' },
  { title: 'Ventas por categoría', body: 'El Dashboard muestra cuánto se vende de Cables, Audífonos y Audio en el periodo elegido, con ganancia, margen y porcentaje de las ventas.' },
  { title: 'Respaldo en Excel', body: 'Con el botón "Respaldo Excel" del Dashboard descargas un archivo con ventas, entradas, productos y un resumen por mes.' },
  { title: 'Dashboard renovado', body: 'Filtra por mes, semana, rango de fechas o todo el historial. Muestra ingresos (ventas de F), gastos (entradas), balance, flujo por mes, top productos, ritmo de ventas, estadísticas e inventario actual.' },
  { title: 'Productos archivados', body: 'Los agotados se archivan solos y vuelven a activos cuando registras una entrada. En Gestión puedes archivar o desarchivar a mano y ver la pestaña Archivados.' },
  { title: 'Inventario más cómodo', body: 'Solo muestra productos disponibles, los más vendidos primero, con filtro por categoría. El botón "Vendí 1" está junto al nombre y el historial de ventas se abre al tocarlo.' },
  { title: 'Modo claro y oscuro', body: 'Cámbialo con el botón de sol o luna junto al logo, arriba a la izquierda.' },
  { title: 'Esta nota de novedades', body: 'Aparece una vez cada vez que hay cambios. Puedes volver a abrirla cuando quieras con el botón "Novedades" debajo de la fecha del Dashboard.' },
]

function NewsModal({ onClose }) {
  return (
    <div onClick={onClose} style={{
      position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', zIndex: 1000,
      display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16,
    }}>
      <div onClick={e => e.stopPropagation()} role="dialog" aria-label="Novedades" style={{
        background: 'var(--d-tooltip)', color: 'var(--d-fg)', width: '100%', maxWidth: 460,
        borderRadius: 16, border: '1px solid rgba(var(--d-fg-rgb),0.12)', padding: '20px 22px',
        boxShadow: '0 20px 50px rgba(0,0,0,0.4)', animation: 'fadeIn 0.25s ease', maxHeight: '85vh', overflowY: 'auto',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
          <Sparkles size={18} style={{ color: COL.ing }} />
          <h2 style={{ fontSize: 16, fontWeight: 900 }}>Novedades</h2>
          <button onClick={onClose} aria-label="Cerrar" style={{ marginLeft: 'auto', background: 'none', border: 'none', color: 'rgba(var(--d-fg-rgb),0.5)', display: 'flex' }}>
            <X size={18} />
          </button>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {NEWS.map(n => (
            <div key={n.title} style={{ borderLeft: `3px solid ${COL.ing}`, paddingLeft: 12 }}>
              <p style={{ fontSize: 13, fontWeight: 800, marginBottom: 3 }}>{n.title}</p>
              <p style={{ fontSize: 12, lineHeight: 1.5, color: 'rgba(var(--d-fg-rgb),0.65)' }}>{n.body}</p>
            </div>
          ))}
        </div>
        <button onClick={onClose} style={{
          marginTop: 18, width: '100%', background: COL.ing, color: '#111', border: 'none',
          borderRadius: 10, padding: '10px 0', fontSize: 13, fontWeight: 900,
        }}>Entendido</button>
      </div>
    </div>
  )
}
const DAY = 86400000
const WEEKDAYS = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom']

// ─── Helpers de fecha ─────────────────────────────────────────────
function startOfDay(d) { return new Date(d.getFullYear(), d.getMonth(), d.getDate()) }
function startOfWeek(d) {
  const s = startOfDay(d)
  s.setDate(s.getDate() - (s.getDay() + 6) % 7)  // lunes = inicio
  return s
}
function addDays(d, n) { const r = new Date(d); r.setDate(r.getDate() + n); return r }
function ymd(d) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}
function parseYmd(s) { const [y, m, d] = s.split('-').map(Number); return new Date(y, m - 1, d) }
function monthKey(d) { return ymd(d).slice(0, 7) }
function monthStart(key) { const [y, m] = key.split('-').map(Number); return new Date(y, m - 1, 1) }
function monthLabel(key, short = false) {
  return monthStart(key).toLocaleDateString('es', short ? { month: 'short', year: '2-digit' } : { month: 'long', year: 'numeric' })
}
function fmtDay(d) { return d.toLocaleDateString('es', { day: '2-digit', month: 'short' }) }
function fmtBs(n) { return `Bs. ${(n || 0).toFixed(2)}` }
function pct(curr, prev) {
  if (!prev) return null
  return Math.round(((curr - prev) / Math.abs(prev)) * 100)
}
function sum(arr, f) { return arr.reduce((a, x) => a + f(x), 0) }
function median(nums) {
  if (!nums.length) return 0
  const s = [...nums].sort((a, b) => a - b)
  const m = Math.floor(s.length / 2)
  return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2
}

// ─── Resumen de un intervalo [from, to) ───────────────────────────
function summarize(ventas, compras, from, to) {
  const v = ventas.filter(x => x.t >= from && x.t < to)
  const c = compras.filter(x => x.t >= from && x.t < to)
  const revenue = sum(v, x => x.price)
  const profit  = revenue - sum(v, x => x.cost)
  const gasto   = sum(c, x => x.amount)
  return {
    ventas: v, compras: c,
    units: v.length, revenue, profit, gasto,
    unitsIn: sum(c, x => x.qty),
    balance: revenue - gasto,
    margin: revenue > 0 ? Math.round((profit / revenue) * 100) : 0,
  }
}

// ─── Sub-componentes ──────────────────────────────────────────────
function SectionHeader({ icon, title, right }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14, flexWrap: 'wrap' }}>
      <span style={{ color: COL.ing, display: 'flex' }}>{icon}</span>
      <h2 style={{ fontSize: 13, fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--d-fg)' }}>{title}</h2>
      {right && <div style={{ marginLeft: 'auto' }}>{right}</div>}
    </div>
  )
}

function Block({ children, style }) {
  return (
    <div style={{
      background: 'rgba(var(--d-fg-rgb),0.04)', border: '1px solid rgba(var(--d-fg-rgb),0.08)',
      borderRadius: 14, padding: '18px 20px', minWidth: 0, ...style,
    }}>
      {children}
    </div>
  )
}

function Delta({ value, invert = false }) {
  if (value === null) return <span style={{ fontSize: 10, color: 'rgba(var(--d-fg-rgb),0.3)' }}>sin datos previos</span>
  const good  = invert ? value < 0 : value > 0
  const color = value === 0 ? '#9e9e9e' : good ? COL.gan : COL.gas
  const Icon  = value >= 0 ? TrendingUp : TrendingDown
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 3, fontSize: 10, fontWeight: 800, color,
      background: `${color}18`, padding: '2px 7px', borderRadius: 20,
    }}>
      <Icon size={10} /> {value > 0 ? '+' : ''}{value}%
    </span>
  )
}

function Kpi({ icon, label, value, color, sub, delta, invert, highlight }) {
  return (
    <div style={{
      background: highlight ? `${color}14` : 'rgba(var(--d-fg-rgb),0.05)',
      border: `1px solid ${highlight ? `${color}40` : 'rgba(var(--d-fg-rgb),0.08)'}`,
      borderRadius: 14, padding: '16px 18px', display: 'flex', flexDirection: 'column', gap: 6,
      animation: 'fadeIn 0.3s ease', minWidth: 0,
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
        <span style={{ color, display: 'flex' }}>{icon}</span>
        <span style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.07em', color: 'rgba(var(--d-fg-rgb),0.5)' }}>{label}</span>
      </div>
      <p style={{ fontSize: 'clamp(16px, 4.6vw, 22px)', fontWeight: 900, color, lineHeight: 1.1, whiteSpace: 'nowrap' }}>{value}</p>
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
        {delta !== undefined && <Delta value={delta} invert={invert} />}
        {sub && <span style={{ fontSize: 10, color: 'rgba(var(--d-fg-rgb),0.4)' }}>{sub}</span>}
      </div>
    </div>
  )
}

function StatLine({ label, value, sub, color = 'var(--d-fg)' }) {
  return (
    <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', gap: 12, padding: '9px 0', borderBottom: '1px solid rgba(var(--d-fg-rgb),0.06)' }}>
      <div style={{ minWidth: 0 }}>
        <p style={{ fontSize: 12, color: 'rgba(var(--d-fg-rgb),0.6)', fontWeight: 600 }}>{label}</p>
        {sub && <p style={{ fontSize: 10, color: 'rgba(var(--d-fg-rgb),0.3)', marginTop: 2 }}>{sub}</p>}
      </div>
      <span style={{ fontSize: 13, fontWeight: 800, color, whiteSpace: 'nowrap' }}>{value}</span>
    </div>
  )
}

function Legend() {
  return (
    <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap' }}>
      {[['Ingresos (ventas)', COL.ing], ['Gastos (entradas)', COL.gas]].map(([l, c]) => (
        <span key={l} style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 10, color: 'rgba(var(--d-fg-rgb),0.55)', fontWeight: 700 }}>
          <span style={{ width: 9, height: 9, borderRadius: 2, background: c }} /> {l}
        </span>
      ))}
    </div>
  )
}

// Barras agrupadas ingresos vs gastos por tramo (día / semana / mes)
function FlowChart({ buckets }) {
  const [hovered, setHovered] = useState(null)
  const max = Math.max(...buckets.map(b => Math.max(b.ing, b.gas)), 1)
  const every = Math.ceil(buckets.length / 10)
  const gap = buckets.length > 20 ? 2 : 6
  const H = 150
  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'flex-end', gap, height: H, position: 'relative' }}>
        {buckets.map((b, i) => {
          const isH = hovered === i
          const empty = b.ing === 0 && b.gas === 0
          return (
            <div key={i}
              onMouseEnter={() => setHovered(i)} onMouseLeave={() => setHovered(null)}
              onClick={() => setHovered(h => h === i ? null : i)}
              style={{ flex: 1, minWidth: 0, height: '100%', display: 'flex', alignItems: 'flex-end', justifyContent: 'center', gap: 1, position: 'relative' }}>
              {isH && (
                <div style={{
                  position: 'absolute', bottom: H + 6, left: '50%',
                  transform: i < buckets.length / 3 ? 'translateX(-15%)' : i > buckets.length * 2 / 3 ? 'translateX(-85%)' : 'translateX(-50%)',
                  background: 'var(--d-tooltip)', border: '1px solid rgba(var(--d-fg-rgb),0.15)', borderRadius: 8,
                  padding: '8px 12px', zIndex: 10, fontSize: 11, color: 'var(--d-fg)', whiteSpace: 'nowrap',
                  boxShadow: '0 8px 24px rgba(0,0,0,0.4)', pointerEvents: 'none',
                }}>
                  <p style={{ fontWeight: 800, marginBottom: 4 }}>{b.title}</p>
                  <p style={{ color: COL.ing }}>Ingresos: {fmtBs(b.ing)}</p>
                  <p style={{ color: COL.gas }}>Gastos: {fmtBs(b.gas)}</p>
                  <p style={{ color: COL.bal }}>Balance: {fmtBs(b.ing - b.gas)}</p>
                  <p style={{ color: COL.gan }}>Ganancia: {fmtBs(b.profit)}</p>
                  <p style={{ color: 'rgba(var(--d-fg-rgb),0.5)' }}>{b.units} venta(s)</p>
                </div>
              )}
              {empty ? (
                <div style={{ width: '100%', height: 3, background: 'rgba(var(--d-fg-rgb),0.08)', borderRadius: 2 }} />
              ) : (
                <>
                  <div style={{ flex: 1, maxWidth: 18, height: `${(b.ing / max) * 100}%`, minHeight: b.ing ? 3 : 0, background: COL.ing, opacity: isH ? 1 : 0.75, borderRadius: '3px 3px 0 0' }} />
                  <div style={{ flex: 1, maxWidth: 18, height: `${(b.gas / max) * 100}%`, minHeight: b.gas ? 3 : 0, background: COL.gas, opacity: isH ? 1 : 0.75, borderRadius: '3px 3px 0 0' }} />
                </>
              )}
            </div>
          )
        })}
      </div>
      <div style={{ display: 'flex', gap, marginTop: 6, borderTop: '1px solid rgba(var(--d-fg-rgb),0.1)', paddingTop: 6 }}>
        {buckets.map((b, i) => (
          <div key={i} style={{ flex: 1, minWidth: 0, textAlign: 'center', fontSize: 9, color: 'rgba(var(--d-fg-rgb),0.35)', fontWeight: 600, whiteSpace: 'nowrap', overflow: 'visible' }}>
            {i % every === 0 ? b.label : ''}
          </div>
        ))}
      </div>
    </div>
  )
}

function HBar({ label, value, max, color, right }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 7 }}>
      <span style={{ fontSize: 11, color: 'rgba(var(--d-fg-rgb),0.55)', fontWeight: 700, width: 30, flexShrink: 0 }}>{label}</span>
      <div style={{ flex: 1, background: 'rgba(var(--d-fg-rgb),0.07)', borderRadius: 99, height: 8, overflow: 'hidden' }}>
        <div style={{ width: `${max ? (value / max) * 100 : 0}%`, height: '100%', background: color, borderRadius: 99, transition: 'width 0.4s ease' }} />
      </div>
      <span style={{ fontSize: 11, color: 'var(--d-fg)', fontWeight: 800, minWidth: 92, textAlign: 'right', flexShrink: 0 }}>{right}</span>
    </div>
  )
}

function Empty({ children }) {
  return <p style={{ fontSize: 12, color: 'rgba(var(--d-fg-rgb),0.3)', padding: '6px 0' }}>{children}</p>
}

function Toggle({ options, value, onChange }) {
  return (
    <div style={{ display: 'inline-flex', background: 'rgba(var(--d-fg-rgb),0.06)', borderRadius: 8, padding: 3, gap: 2, flexWrap: 'wrap' }}>
      {options.map(o => (
        <button key={o.id} onClick={() => onChange(o.id)} style={{
          border: 'none', borderRadius: 6, padding: '6px 12px', fontSize: 11, fontWeight: 800, cursor: 'pointer',
          background: value === o.id ? COL.ing : 'transparent',
          color: value === o.id ? '#111' : 'rgba(var(--d-fg-rgb),0.6)',
        }}>{o.label}</button>
      ))}
    </div>
  )
}

const ctrl = {
  background: 'rgba(var(--d-fg-rgb),0.07)', border: '1px solid rgba(var(--d-fg-rgb),0.15)', color: 'var(--d-fg)',
  borderRadius: 8, padding: '7px 10px', fontSize: 12, fontWeight: 700, colorScheme: 'dark', outline: 'none',
}

const LEVEL_CFG = {
  danger:  { color: '#e53e3e', label: 'Atención' },
  warning: { color: COL.ing,   label: 'Aviso'    },
  success: { color: '#27ae60', label: 'Positivo' },
  info:    { color: '#60c8f0', label: 'Info'     },
}

// ─── Página principal ─────────────────────────────────────────────
export default function DashboardPage({ sales = [], entradas = [], products = [], productMap = {}, isArchived = p => !!p.archived, theme = 'dark', loading }) {
  // Ajusta la paleta al tema antes de dibujar (los sub-componentes leen COL)
  Object.assign(COL, PALETTE[theme] || PALETTE.dark)
  LEVEL_CFG.warning.color = COL.ing
  LEVEL_CFG.success.color = COL.gan
  LEVEL_CFG.info.color    = COL.bal

  const now = new Date()
  const todayStart = startOfDay(now)
  const tomorrow   = addDays(todayStart, 1)

  const [mode, setMode]         = useState('mes')   // 'mes' | 'semana' | 'rango' | 'todo'
  const [selMonth, setSelMonth] = useState(null)
  const [selWeek, setSelWeek]   = useState(null)
  const [rFrom, setRFrom]       = useState(ymd(addDays(now, -29)))
  const [rTo, setRTo]           = useState(ymd(now))
  const [topSort, setTopSort]   = useState('units')
  const [showAllMoves, setShowAllMoves] = useState(false)
  const [exporting, setExporting] = useState(false)

  async function handleBackup() {
    setExporting(true)
    try {
      const { exportBackupExcel } = await import('../lib/exportExcel')
      await exportBackupExcel({ products, sales, entradas })
    } catch (err) {
      window.alert('No se pudo generar el Excel: ' + err.message)
    } finally {
      setExporting(false)
    }
  }
  const [showNews, setShowNews] = useState(() => {
    try { return localStorage.getItem(NEWS_KEY) !== 'visto' } catch { return false }
  })
  function closeNews() {
    setShowNews(false)
    try { localStorage.setItem(NEWS_KEY, 'visto') } catch {}
  }

  // Salidas = ventas del vendedor F (ingresos)
  const ventas = useMemo(() => sales.filter(s => s.seller === 'F').map(s => ({
    id: s.id, kind: 'venta', t: new Date(s.sold_at), product_id: s.product_id,
    price: Number(s.price_at_sale ?? productMap[s.product_id]?.price ?? 0),
    cost:  Number(s.buy_price_at_sale ?? productMap[s.product_id]?.buy_price ?? 0),
  })), [sales, productMap])

  // Entradas = compras de mercadería (gastos)
  const compras = useMemo(() => entradas.map(e => {
    const qty = Number(e.cantidad) || 0, unit = Number(e.buy_price) || 0
    return { id: e.id, kind: 'entrada', t: new Date(e.entered_at), product_id: e.product_id, qty, unit, amount: qty * unit, proveedor: e.proveedor?.trim() || null }
  }), [entradas])

  // Meses y semanas que tienen movimiento (para los selectores)
  const { months, weeks, firstDate } = useMemo(() => {
    const dates = [...ventas, ...compras].map(x => x.t)
    return {
      months: [...new Set(dates.map(monthKey))].sort().reverse(),
      weeks:  [...new Set(dates.map(d => ymd(startOfWeek(d))))].sort().reverse(),
      firstDate: dates.length ? new Date(Math.min(...dates)) : null,
    }
  }, [ventas, compras])

  // ─── Periodo seleccionado + periodo anterior equivalente ────────
  const period = useMemo(() => {
    if (mode === 'mes') {
      const key  = selMonth ?? months[0] ?? monthKey(now)
      const from = monthStart(key)
      const to   = new Date(from.getFullYear(), from.getMonth() + 1, 1)
      return { from, to, prevFrom: new Date(from.getFullYear(), from.getMonth() - 1, 1), prevTo: from, label: monthLabel(key), prevLabel: 'mes anterior', key }
    }
    if (mode === 'semana') {
      const key  = selWeek ?? weeks[0] ?? ymd(startOfWeek(now))
      const from = parseYmd(key)
      const to   = addDays(from, 7)
      return { from, to, prevFrom: addDays(from, -7), prevTo: from, label: `Semana del ${fmtDay(from)} al ${fmtDay(addDays(to, -1))}`, prevLabel: 'semana anterior', key }
    }
    if (mode === 'rango') {
      let from = parseYmd(rFrom || ymd(addDays(now, -29)))
      let to   = addDays(parseYmd(rTo || ymd(now)), 1)
      if (to <= from) [from, to] = [addDays(to, -1), addDays(from, 1)]
      const days = Math.round((to - from) / DAY)
      return { from, to, prevFrom: addDays(from, -days), prevTo: from, label: `Del ${fmtDay(from)} al ${fmtDay(addDays(to, -1))}`, prevLabel: `${days} días anteriores` }
    }
    return { from: firstDate ? startOfDay(firstDate) : todayStart, to: tomorrow, prevFrom: null, prevTo: null, label: 'Todo el historial', prevLabel: null }
  }, [mode, selMonth, selWeek, rFrom, rTo, months, weeks, firstDate])

  const cur  = useMemo(() => summarize(ventas, compras, period.from, period.to), [ventas, compras, period])
  const prev = useMemo(() => period.prevFrom ? summarize(ventas, compras, period.prevFrom, period.prevTo) : null, [ventas, compras, period])
  const d = (k) => prev ? pct(cur[k], prev[k]) : undefined

  // Días transcurridos del periodo (si es el periodo actual, solo hasta hoy)
  const periodEnd   = period.to > tomorrow ? tomorrow : period.to
  const daysElapsed = Math.max(1, Math.round((periodEnd - period.from) / DAY))
  const isCurrent   = period.from <= now && now < period.to

  const today = useMemo(() => summarize(ventas, compras, todayStart, tomorrow), [ventas, compras])

  // ─── Evolución dentro del periodo ──────────────────────────────
  const evolution = useMemo(() => {
    const span = Math.round((period.to - period.from) / DAY)
    const unit = span <= 31 ? 'día' : span <= 120 ? 'semana' : 'mes'
    const list = []
    let s = unit === 'semana' ? startOfWeek(period.from) : unit === 'mes' ? new Date(period.from.getFullYear(), period.from.getMonth(), 1) : new Date(period.from)
    while (s < period.to) {
      const e = unit === 'día' ? addDays(s, 1) : unit === 'semana' ? addDays(s, 7) : new Date(s.getFullYear(), s.getMonth() + 1, 1)
      list.push({
        start: s, end: e, ing: 0, gas: 0, profit: 0, units: 0,
        label: unit === 'mes' ? monthLabel(monthKey(s), true) : fmtDay(s),
        title: unit === 'día' ? s.toLocaleDateString('es', { weekday: 'long', day: 'numeric', month: 'short' })
             : unit === 'semana' ? `Semana del ${fmtDay(s)}` : monthLabel(monthKey(s)),
      })
      s = e
    }
    const find = t => list.find(b => t >= b.start && t < b.end)
    cur.ventas.forEach(v => { const b = find(v.t); if (b) { b.ing += v.price; b.profit += v.price - v.cost; b.units++ } })
    cur.compras.forEach(c => { const b = find(c.t); if (b) b.gas += c.amount })
    return { unit, list }
  }, [cur, period])

  // ─── Flujo por mes (todo el historial) ─────────────────────────
  const monthly = useMemo(() => {
    const map = {}
    const get = k => map[k] || (map[k] = { key: k, ing: 0, gas: 0, profit: 0, units: 0, unitsIn: 0 })
    ventas.forEach(v => { const m = get(monthKey(v.t)); m.ing += v.price; m.profit += v.price - v.cost; m.units++ })
    compras.forEach(c => { const m = get(monthKey(c.t)); m.gas += c.amount; m.unitsIn += c.qty })
    let acc = 0
    return Object.values(map)
      .sort((a, b) => a.key.localeCompare(b.key))
      .map(m => { acc += m.ing - m.gas; return { ...m, bal: m.ing - m.gas, acc } })
  }, [ventas, compras])
  const monthlyMax = Math.max(...monthly.map(m => Math.max(m.ing, m.gas)), 1)

  // ─── Top productos del periodo ─────────────────────────────────
  const topProducts = useMemo(() => {
    const map = {}
    cur.ventas.forEach(v => {
      const r = map[v.product_id] || (map[v.product_id] = { product_id: v.product_id, units: 0, revenue: 0, profit: 0 })
      r.units++; r.revenue += v.price; r.profit += v.price - v.cost
    })
    return Object.values(map).map(r => ({
      ...r,
      name: productMap[r.product_id]?.name ?? 'Producto eliminado',
      margin: r.revenue > 0 ? Math.round((r.profit / r.revenue) * 100) : 0,
    }))
  }, [cur, productMap])
  const topSorted = [...topProducts].sort((a, b) => b[topSort] - a[topSort]).slice(0, 6)

  // ─── Movimientos del periodo (entradas + salidas) ──────────────
  const moves = useMemo(() => [...cur.ventas, ...cur.compras].sort((a, b) => b.t - a.t), [cur])

  // ─── Ventas por categoría (periodo) ────────────────────────────
  const byCategory = useMemo(() => {
    const map = {}
    cur.ventas.forEach(v => {
      const cat = productMap[v.product_id]?.category || 'Sin categoría'
      const r = map[cat] || (map[cat] = { cat, units: 0, revenue: 0, profit: 0 })
      r.units++; r.revenue += v.price; r.profit += v.price - v.cost
    })
    return Object.values(map)
      .map(r => ({ ...r, margin: r.revenue > 0 ? Math.round((r.profit / r.revenue) * 100) : 0, share: cur.revenue > 0 ? Math.round((r.revenue / cur.revenue) * 100) : 0 }))
      .sort((a, b) => b.revenue - a.revenue)
  }, [cur, productMap])
  const catMax = Math.max(...byCategory.map(c => c.revenue), 1)

  // ─── Compras por proveedor (periodo) ───────────────────────────
  const byProvider = useMemo(() => {
    const map = {}
    cur.compras.forEach(c => {
      const name = c.proveedor || 'Sin proveedor'
      const r = map[name] || (map[name] = { name, total: 0, units: 0, count: 0, products: new Set(), none: !c.proveedor })
      r.total += c.amount; r.units += c.qty; r.count++; r.products.add(c.product_id)
    })
    return Object.values(map)
      .map(r => ({ ...r, avg: r.units ? r.total / r.units : 0, share: cur.gasto > 0 ? Math.round((r.total / cur.gasto) * 100) : 0, nProducts: r.products.size }))
      .sort((a, b) => (a.none - b.none) || b.total - a.total)
  }, [cur])
  const provMax = Math.max(...byProvider.map(p => p.total), 1)

  // ─── Ritmo de ventas ───────────────────────────────────────────
  const rhythm = useMemo(() => {
    const byWeekday = WEEKDAYS.map(() => ({ revenue: 0, units: 0 }))
    cur.ventas.forEach(v => { const w = byWeekday[(v.t.getDay() + 6) % 7]; w.revenue += v.price; w.units++ })
    const activeDays = new Set(cur.ventas.map(v => ymd(v.t))).size
    const bestIdx = byWeekday.reduce((b, w, i) => w.revenue > byWeekday[b].revenue ? i : b, 0)
    return {
      byWeekday, activeDays,
      ticket: cur.units ? cur.revenue / cur.units : 0,
      perDay: cur.units / daysElapsed,
      best: cur.units ? WEEKDAYS[bestIdx] : null,
    }
  }, [cur, daysElapsed])
  const weekdayMax = Math.max(...rhythm.byWeekday.map(w => w.revenue), 1)

  // ─── Estadísticas del periodo ──────────────────────────────────
  const stats = useMemo(() => {
    const daily = {}
    cur.ventas.forEach(v => { const k = ymd(v.t); daily[k] = (daily[k] || 0) + v.price })
    const series = []
    for (let s = new Date(period.from); s < periodEnd; s = addDays(s, 1)) series.push(daily[ymd(s)] || 0)
    const mean  = series.length ? sum(series, x => x) / series.length : 0
    const sd    = series.length ? Math.sqrt(sum(series, x => (x - mean) ** 2) / series.length) : 0
    const [recKey, recVal] = Object.entries(daily).sort((a, b) => b[1] - a[1])[0] || []
    const daysInMonth = new Date(period.from.getFullYear(), period.from.getMonth() + 1, 0).getDate()
    return {
      mean, sd,
      medianDay:    median(series),
      medianTicket: median(cur.ventas.map(v => v.price)),
      record:       recKey ? { date: parseYmd(recKey), value: recVal } : null,
      recovery:     cur.gasto > 0 ? Math.round((cur.revenue / cur.gasto) * 100) : null,
      sellThrough:  cur.unitsIn > 0 ? Math.round((cur.units / cur.unitsIn) * 100) : null,
      projection:   mode === 'mes' && isCurrent ? (cur.revenue / daysElapsed) * daysInMonth : null,
      avgCostIn:    cur.unitsIn > 0 ? cur.gasto / cur.unitsIn : null,
    }
  }, [cur, period, periodEnd, mode, isCurrent, daysElapsed])

  // ─── Inventario actual (no depende del periodo) ────────────────
  const inventory = useMemo(() => {
    const sold = {}, lastSale = {}, entByProd = {}, salesByProd = {}
    sales.forEach(s => {
      (salesByProd[s.product_id] || (salesByProd[s.product_id] = [])).push(s)
      sold[s.product_id] = (sold[s.product_id] || 0) + 1
      const t = new Date(s.sold_at)
      if (!lastSale[s.product_id] || t > lastSale[s.product_id]) lastSale[s.product_id] = t
    })
    entradas.forEach(e => (entByProd[e.product_id] || (entByProd[e.product_id] = [])).push(e))

    let units = 0, costValue = 0, saleValue = 0
    const low = [], stale = []
    products.forEach(p => {
      const ents = (entByProd[p.id] || []).slice().sort((a, b) => new Date(a.entered_at) - new Date(b.entered_at))
      const stock = (Number(p.initial_stock) || 0) + sum(ents, e => Number(e.cantidad) || 0) - (sold[p.id] || 0)
      if (stock <= 0) return

      // Valor al costo: lo que queda de cada lote x su costo (mismo cálculo que al vender)
      costValue += remainingValue(computeLots(p, ents, salesByProd[p.id] || []))

      units     += stock
      saleValue += stock * (Number(p.price) || 0)
      if (p.archived) return
      if (stock <= 2) low.push({ p, stock })
      const ref  = lastSale[p.id] || new Date(p.created_at)
      const days = Math.floor((now - ref) / DAY)
      if (days >= 30) stale.push({ p, stock, days, never: !lastSale[p.id] })
    })
    return {
      units, costValue, saleValue,
      low: low.sort((a, b) => a.stock - b.stock),
      stale: stale.sort((a, b) => b.days - a.days),
      archived: products.filter(isArchived).length,
    }
  }, [products, sales, entradas])

  // ─── Motor de insights (sobre el periodo elegido) ──────────────
  const insights = useMemo(() => {
    const list = []
    const revP = prev ? pct(cur.revenue, prev.revenue) : null

    if (cur.units === 0) list.push({
      level: 'warning', icon: Clock, title: 'Sin ventas en este periodo',
      body: `No hay ventas de F registradas en: ${period.label}.`,
    })
    if (cur.gasto > 0 && cur.balance < 0) list.push({
      level: 'warning', icon: Scale, title: 'Gastaste más de lo que ingresó',
      body: `Entradas por ${fmtBs(cur.gasto)} contra ${fmtBs(cur.revenue)} de ventas. La diferencia (${fmtBs(-cur.balance)}) quedó en mercadería.`,
    })
    if (cur.balance > 0 && cur.gasto > 0) list.push({
      level: 'success', icon: Scale, title: 'Las ventas cubren los gastos',
      body: `Las ventas recuperan el ${stats.recovery}% de lo invertido en entradas y quedan ${fmtBs(cur.balance)} de saldo.`,
    })
    if (revP !== null && revP >= 20) list.push({
      level: 'success', icon: ArrowUpRight, title: `Ingresos ${revP}% arriba`,
      body: `${fmtBs(cur.revenue)} contra ${fmtBs(prev.revenue)} del periodo anterior (${period.prevLabel}).`,
    })
    if (revP !== null && revP <= -20) list.push({
      level: 'danger', icon: ArrowDownRight, title: `Ingresos ${Math.abs(revP)}% abajo`,
      body: `${fmtBs(cur.revenue)} contra ${fmtBs(prev.revenue)} del periodo anterior (${period.prevLabel}).`,
    })
    if (prev && cur.revenue > prev.revenue && cur.profit < prev.profit) list.push({
      level: 'danger', icon: AlertTriangle, title: 'Vendes más pero ganas menos',
      body: `Los ingresos subieron pero la ganancia bajó de ${fmtBs(prev.profit)} a ${fmtBs(cur.profit)}. Revisa costos o descuentos.`,
    })
    if (cur.revenue > 0 && cur.margin < 15) list.push({
      level: 'danger', icon: BadgePercent, title: `Margen bajo: ${cur.margin}%`,
      body: `De cada Bs. 100 vendidos te quedan Bs. ${cur.margin}. Idealmente debería superar el 25%.`,
    })
    if (cur.revenue > 0 && cur.margin >= 30) list.push({
      level: 'success', icon: BadgePercent, title: `Buen margen: ${cur.margin}%`,
      body: `De cada Bs. 100 vendidos te quedan Bs. ${cur.margin} de ganancia.`,
    })
    const star = [...topProducts].sort((a, b) => b.units - a.units)[0]
    if (star) list.push({
      level: 'info', icon: Star, title: `"${star.name}" lidera el periodo`,
      body: `${star.units} unidad${star.units > 1 ? 'es' : ''} vendida${star.units > 1 ? 's' : ''}, ${fmtBs(star.profit)} de ganancia (${star.margin}% de margen).`,
    })
    if (stats.projection !== null && prev?.revenue > 0) {
      const p = pct(stats.projection, prev.revenue)
      list.push({
        level: p >= 0 ? 'info' : 'warning', icon: p >= 0 ? TrendingUp : TrendingDown,
        title: 'Proyección de cierre de mes',
        body: `Al ritmo actual cerrarías con ~${fmtBs(stats.projection)}, un ${Math.abs(p)}% ${p >= 0 ? 'más' : 'menos'} que el mes anterior.`,
      })
    }
    if (inventory.low.length) list.push({
      level: 'warning', icon: AlertCircle, title: `${inventory.low.length} producto${inventory.low.length > 1 ? 's' : ''} con stock bajo`,
      body: `Quedan 2 unidades o menos de: ${inventory.low.slice(0, 3).map(x => x.p.name).join(', ')}${inventory.low.length > 3 ? '...' : ''}.`,
    })
    if (inventory.stale.length) list.push({
      level: 'info', icon: PackageSearch, title: `${inventory.stale.length} producto${inventory.stale.length > 1 ? 's' : ''} sin moverse`,
      body: 'Llevan 30 días o más sin venderse. Es capital detenido en mercadería que no rota.',
    })

    const order = { danger: 0, warning: 1, success: 2, info: 3 }
    return list.sort((a, b) => order[a.level] - order[b.level])
  }, [cur, prev, period, stats, topProducts, inventory])

  if (loading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '60vh', color: 'rgba(var(--d-fg-rgb),0.4)', fontSize: 14, background: 'var(--d-bg)' }}>
      Cargando dashboard...
    </div>
  )

  const grid2 = { display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: 18, marginBottom: 28 }

  return (
    <div style={{ background: 'var(--d-bg)', minHeight: '100vh', padding: '24px var(--page-pad) 48px' }}>

      {showNews && <NewsModal onClose={closeNews} />}

      {/* ── Encabezado + hoy ── */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 16, marginBottom: 20, flexWrap: 'wrap' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <span style={{
              background: COL.bal, color: '#000', fontWeight: 900, fontSize: 15, width: 32, height: 32,
              display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: 8,
            }}>F</span>
            <h1 style={{ fontSize: 22, fontWeight: 900, color: 'var(--d-fg)' }}>Dashboard</h1>
          </div>
          <p style={{ fontSize: 12, color: 'rgba(var(--d-fg-rgb),0.35)', marginTop: 4 }}>
            {now.toLocaleDateString('es', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
          </p>
          <button onClick={() => setShowNews(true)} style={{
            marginTop: 8, display: 'inline-flex', alignItems: 'center', gap: 5, fontSize: 11, fontWeight: 800,
            background: 'none', border: `1px solid ${COL.ing}55`, color: COL.ing, borderRadius: 99, padding: '3px 10px',
          }}>
            <Sparkles size={12} /> Novedades
          </button>
          <button onClick={handleBackup} disabled={exporting} style={{
            marginTop: 8, marginLeft: 6, display: 'inline-flex', alignItems: 'center', gap: 5, fontSize: 11, fontWeight: 800,
            background: 'none', border: `1px solid ${COL.gan}66`, color: COL.gan, borderRadius: 99, padding: '3px 10px',
            opacity: exporting ? 0.6 : 1,
          }}>
            <FileSpreadsheet size={12} /> {exporting ? 'Generando...' : 'Respaldo Excel'}
          </button>
        </div>
        <div style={{
          display: 'flex', gap: 18, flexWrap: 'wrap', background: 'rgba(var(--d-fg-rgb),0.05)',
          border: '1px solid rgba(var(--d-fg-rgb),0.08)', borderRadius: 12, padding: '10px 16px',
        }}>
          <span style={{ fontSize: 10, fontWeight: 900, color: 'rgba(var(--d-fg-rgb),0.4)', textTransform: 'uppercase', letterSpacing: '0.08em', alignSelf: 'center' }}>Hoy</span>
          {[
            ['Ingresos', fmtBs(today.revenue), COL.ing],
            ['Ganancia', fmtBs(today.profit), today.profit < 0 ? COL.gas : COL.gan],
            ['Ventas', today.units, 'var(--d-fg)'],
            ['Gastos', fmtBs(today.gasto), COL.gas],
          ].map(([l, v, c]) => (
            <div key={l}>
              <p style={{ fontSize: 9, color: 'rgba(var(--d-fg-rgb),0.4)', fontWeight: 700, textTransform: 'uppercase' }}>{l}</p>
              <p style={{ fontSize: 14, fontWeight: 900, color: c }}>{v}</p>
            </div>
          ))}
        </div>
      </div>

      {/* ── Filtro de periodo ── */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap', marginBottom: 22,
        background: 'rgba(var(--d-fg-rgb),0.04)', border: '1px solid rgba(var(--d-fg-rgb),0.08)', borderRadius: 12, padding: '12px 14px',
      }}>
        <Calendar size={15} style={{ color: COL.ing }} />
        <Toggle value={mode} onChange={setMode} options={[
          { id: 'mes', label: 'Mes' }, { id: 'semana', label: 'Semana' },
          { id: 'rango', label: 'Rango' }, { id: 'todo', label: 'Todo' },
        ]} />

        {mode === 'mes' && (
          months.length
            ? <select value={period.key} onChange={e => setSelMonth(e.target.value)} style={ctrl}>
                {months.map(k => <option key={k} value={k}>{monthLabel(k)}</option>)}
              </select>
            : <span style={{ fontSize: 12, color: 'rgba(var(--d-fg-rgb),0.4)' }}>Sin meses con movimiento</span>
        )}
        {mode === 'semana' && (
          weeks.length
            ? <select value={period.key} onChange={e => setSelWeek(e.target.value)} style={ctrl}>
                {weeks.map(k => { const f = parseYmd(k); return <option key={k} value={k}>{`${fmtDay(f)} – ${fmtDay(addDays(f, 6))} ${f.getFullYear()}`}</option> })}
              </select>
            : <span style={{ fontSize: 12, color: 'rgba(var(--d-fg-rgb),0.4)' }}>Sin semanas con movimiento</span>
        )}
        {mode === 'rango' && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
            <input type="date" value={rFrom} onChange={e => setRFrom(e.target.value)} style={ctrl} />
            <span style={{ fontSize: 12, color: 'rgba(var(--d-fg-rgb),0.4)' }}>a</span>
            <input type="date" value={rTo} onChange={e => setRTo(e.target.value)} style={ctrl} />
          </div>
        )}

        <span style={{ marginLeft: 'auto', fontSize: 11, color: 'rgba(var(--d-fg-rgb),0.4)' }}>
          {period.prevLabel ? `Comparado con ${period.prevLabel}` : 'Sin comparación'}
        </span>
      </div>

      {/* ── Resumen del periodo ── */}
      <div style={{ marginBottom: 28 }}>
        <SectionHeader icon={<Wallet size={16} />} title={`Resumen — ${period.label}`} />
        <div className="stat-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 12 }}>
          <Kpi icon={<DollarSign size={15} />} label="Ingresos" value={fmtBs(cur.revenue)} color={COL.ing} highlight
               delta={d('revenue')} sub="ventas de F" />
          <Kpi icon={<PackagePlus size={15} />} label="Gastos" value={fmtBs(cur.gasto)} color={COL.gas} highlight
               delta={d('gasto')} invert sub={`${cur.unitsIn} uds. en entradas`} />
          <Kpi icon={<Scale size={15} />} label="Balance" value={fmtBs(cur.balance)} color={cur.balance >= 0 ? COL.bal : COL.gas} highlight
               delta={prev ? pct(cur.balance, prev.balance) : undefined} sub="ingresos − gastos" />
          <Kpi icon={<TrendingUp size={15} />} label="Ganancia" value={fmtBs(cur.profit)} color={cur.profit < 0 ? COL.gas : COL.gan}
               delta={d('profit')} sub="precio − costo" />
          <Kpi icon={<Percent size={15} />} label="Margen" value={`${cur.margin}%`} color={cur.margin >= 30 ? COL.gan : cur.margin >= 15 ? COL.ing : COL.gas}
               sub={cur.revenue ? (cur.margin >= 30 ? 'Buen margen' : cur.margin >= 15 ? 'Margen ajustado' : 'Margen bajo') : 'sin ventas'} />
          <Kpi icon={<ShoppingBag size={15} />} label="Unidades vendidas" value={cur.units} color="var(--d-fg)"
               delta={d('units')} sub={`${rhythm.activeDays} día${rhythm.activeDays !== 1 ? 's' : ''} con ventas`} />
        </div>
      </div>

      {/* ── Entradas vs salidas en el periodo ── */}
      <div style={{ marginBottom: 28 }}>
        <Block>
          <SectionHeader icon={<BarChart2 size={15} />} title={`Entradas vs salidas — por ${evolution.unit}`} right={<Legend />} />
          {cur.units === 0 && cur.compras.length === 0
            ? <Empty>No hay movimientos en este periodo.</Empty>
            : <FlowChart buckets={evolution.list} />}
        </Block>
      </div>

      {/* ── Flujo por mes ── */}
      <div style={{ marginBottom: 28 }}>
        <Block>
          <SectionHeader icon={<Calendar size={15} />} title="Flujo por mes" right={<Legend />} />
          {monthly.length === 0 ? <Empty>Sin historial aún.</Empty> : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 560 }}>
                <thead>
                  <tr>
                    {['Mes', 'Ingresos vs gastos', 'Ingresos', 'Gastos', 'Balance', 'Ganancia', 'Acumulado'].map(h => (
                      <th key={h} style={{ textAlign: h === 'Mes' || h === 'Ingresos vs gastos' ? 'left' : 'right', fontSize: 9, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'rgba(var(--d-fg-rgb),0.35)', padding: '0 8px 8px' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {[...monthly].reverse().map(m => {
                    const selected = mode === 'mes' && period.key === m.key
                    return (
                      <tr key={m.key}
                        onClick={() => { setMode('mes'); setSelMonth(m.key) }}
                        title="Ver este mes"
                        style={{ cursor: 'pointer', background: selected ? 'rgba(245,196,0,0.08)' : 'transparent', borderTop: '1px solid rgba(var(--d-fg-rgb),0.06)' }}>
                        <td style={{ padding: '9px 8px', fontSize: 12, fontWeight: 800, color: selected ? COL.ing : 'var(--d-fg)', whiteSpace: 'nowrap', textTransform: 'capitalize' }}>{monthLabel(m.key)}</td>
                        <td style={{ padding: '9px 8px', width: '28%' }}>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                            <div style={{ height: 6, width: `${(m.ing / monthlyMax) * 100}%`, minWidth: m.ing ? 2 : 0, background: COL.ing, borderRadius: 99 }} />
                            <div style={{ height: 6, width: `${(m.gas / monthlyMax) * 100}%`, minWidth: m.gas ? 2 : 0, background: COL.gas, borderRadius: 99 }} />
                          </div>
                        </td>
                        <td style={tdNum(COL.ing)}>{fmtBs(m.ing)}</td>
                        <td style={tdNum(COL.gas)}>{fmtBs(m.gas)}</td>
                        <td style={tdNum(m.bal >= 0 ? COL.bal : COL.gas)}>{fmtBs(m.bal)}</td>
                        <td style={tdNum(m.profit < 0 ? COL.gas : COL.gan)}>{fmtBs(m.profit)}</td>
                        <td style={tdNum(m.acc >= 0 ? 'var(--d-fg)' : COL.gas)}>{fmtBs(m.acc)}</td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
              <p style={{ fontSize: 10, color: 'rgba(var(--d-fg-rgb),0.3)', marginTop: 10 }}>
                Solo aparecen los meses con movimiento. Toca un mes para verlo en detalle. Acumulado = suma de balances hasta ese mes.
              </p>
            </div>
          )}
        </Block>
      </div>

      {/* ── Top productos + Movimientos ── */}
      <div style={grid2} className="grid-responsive">
        <Block>
          <SectionHeader icon={<Star size={15} />} title="Top productos"
            right={<Toggle value={topSort} onChange={setTopSort} options={[
              { id: 'units', label: 'Unidades' }, { id: 'profit', label: 'Ganancia' }, { id: 'margin', label: 'Margen' },
            ]} />} />
          {topSorted.length === 0 ? <Empty>Sin ventas en este periodo.</Empty> : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {topSorted.map((r, i) => (
                <div key={r.product_id} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <span style={{
                    fontSize: 10, fontWeight: 900, color: '#111', width: 20, height: 20, borderRadius: 4, flexShrink: 0,
                    background: i === 0 ? COL.ing : i === 1 ? '#aaa' : i === 2 ? '#cd7f32' : 'rgba(var(--d-fg-rgb),0.15)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}>{i + 1}</span>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ fontSize: 12, fontWeight: 700, color: 'var(--d-fg)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{r.name}</p>
                    <p style={{ fontSize: 10, color: 'rgba(var(--d-fg-rgb),0.4)' }}>{fmtBs(r.revenue)} ingresos · {r.margin}% margen</p>
                  </div>
                  <div style={{ textAlign: 'right', flexShrink: 0 }}>
                    <p style={{ fontSize: 12, fontWeight: 900, color: COL.ing }}>{r.units} ud{r.units > 1 ? 's' : ''}</p>
                    <p style={{ fontSize: 10, fontWeight: 700, color: COL.gan }}>+{fmtBs(r.profit)}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Block>

        <Block>
          <SectionHeader icon={<Activity size={15} />} title="Movimientos"
            right={<span style={{ fontSize: 10, color: 'rgba(var(--d-fg-rgb),0.4)' }}>{cur.units} salidas · {cur.compras.length} entradas</span>} />
          {moves.length === 0 ? <Empty>Sin movimientos en este periodo.</Empty> : (
            <>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                {(showAllMoves ? moves : moves.slice(0, 8)).map(m => {
                  const isIn = m.kind === 'entrada'
                  return (
                    <div key={m.kind + m.id} style={{
                      display: 'flex', alignItems: 'center', gap: 10, padding: '7px 10px', borderRadius: 8,
                      background: `${isIn ? COL.gas : COL.ing}0d`, borderLeft: `3px solid ${isIn ? COL.gas : COL.ing}`,
                    }}>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <p style={{ fontSize: 12, fontWeight: 700, color: 'var(--d-fg)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          {productMap[m.product_id]?.name ?? 'Producto eliminado'}
                        </p>
                        <p style={{ fontSize: 10, color: 'rgba(var(--d-fg-rgb),0.4)' }}>
                          {isIn ? `Entrada · ${m.qty} uds. x ${fmtBs(m.unit)}` : 'Venta'} · {fmtDay(m.t)}
                        </p>
                      </div>
                      <span style={{ fontSize: 12, fontWeight: 900, color: isIn ? COL.gas : COL.ing, whiteSpace: 'nowrap' }}>
                        {isIn ? '−' : '+'}{fmtBs(isIn ? m.amount : m.price)}
                      </span>
                    </div>
                  )
                })}
              </div>
              {moves.length > 8 && (
                <button onClick={() => setShowAllMoves(v => !v)} style={{
                  marginTop: 10, background: 'none', border: 'none', color: COL.bal, fontSize: 11, fontWeight: 800, cursor: 'pointer', padding: 0,
                }}>
                  {showAllMoves ? 'Ver menos' : `Ver los ${moves.length} movimientos`}
                </button>
              )}
            </>
          )}
        </Block>
      </div>

      {/* ── Ventas por categoría + Compras por proveedor ── */}
      <div style={grid2} className="grid-responsive">
        <Block>
          <SectionHeader icon={<Layers size={15} />} title="Ventas por categoría" />
          {byCategory.length === 0 ? <Empty>Sin ventas en este periodo.</Empty> : byCategory.map(c => (
            <div key={c.cat} style={{ marginBottom: 14 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', gap: 10, marginBottom: 5 }}>
                <span style={{ fontSize: 12, fontWeight: 800, color: 'var(--d-fg)' }}>{c.cat}</span>
                <span style={{ fontSize: 12, fontWeight: 900, color: COL.ing, whiteSpace: 'nowrap' }}>{fmtBs(c.revenue)} · {c.share}%</span>
              </div>
              <div style={{ background: 'rgba(var(--d-fg-rgb),0.07)', borderRadius: 99, height: 8, overflow: 'hidden' }}>
                <div style={{ width: `${(c.revenue / catMax) * 100}%`, height: '100%', background: COL.ing, borderRadius: 99, transition: 'width 0.4s ease' }} />
              </div>
              <p style={{ fontSize: 10, color: 'rgba(var(--d-fg-rgb),0.45)', marginTop: 4 }}>
                {c.units} ud{c.units !== 1 ? 's' : ''} · <span style={{ color: c.profit < 0 ? COL.gas : COL.gan, fontWeight: 700 }}>{fmtBs(c.profit)} ganancia</span> · {c.margin}% margen
              </p>
            </div>
          ))}
        </Block>

        <Block>
          <SectionHeader icon={<Truck size={15} />} title="Compras por proveedor" />
          {byProvider.length === 0 ? <Empty>Sin entradas en este periodo.</Empty> : byProvider.map(p => (
            <div key={p.name} style={{ marginBottom: 14 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', gap: 10, marginBottom: 5 }}>
                <span style={{ fontSize: 12, fontWeight: 800, color: p.none ? 'rgba(var(--d-fg-rgb),0.5)' : 'var(--d-fg)', fontStyle: p.none ? 'italic' : 'normal', minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.name}</span>
                <span style={{ fontSize: 12, fontWeight: 900, color: COL.gas, whiteSpace: 'nowrap' }}>{fmtBs(p.total)} · {p.share}%</span>
              </div>
              <div style={{ background: 'rgba(var(--d-fg-rgb),0.07)', borderRadius: 99, height: 8, overflow: 'hidden' }}>
                <div style={{ width: `${(p.total / provMax) * 100}%`, height: '100%', background: COL.gas, opacity: p.none ? 0.5 : 1, borderRadius: 99, transition: 'width 0.4s ease' }} />
              </div>
              <p style={{ fontSize: 10, color: 'rgba(var(--d-fg-rgb),0.45)', marginTop: 4 }}>
                {p.units} uds. en {p.count} entrada{p.count !== 1 ? 's' : ''} · {p.nProducts} producto{p.nProducts !== 1 ? 's' : ''} · costo promedio {fmtBs(p.avg)}/ud.
              </p>
            </div>
          ))}
          {byProvider.some(p => p.none) && (
            <p style={{ fontSize: 10, color: 'rgba(var(--d-fg-rgb),0.3)', marginTop: 4 }}>
              Las entradas anteriores no tienen proveedor. Puedes agregarlo editándolas en la pestaña Entradas.
            </p>
          )}
        </Block>
      </div>

      {/* ── Ritmo de ventas + Estadísticas ── */}
      <div style={grid2} className="grid-responsive">
        <Block>
          <SectionHeader icon={<Clock size={15} />} title="Ritmo de ventas" />
          <StatLine label="Ticket promedio" value={fmtBs(rhythm.ticket)} sub="ingreso medio por venta" color={COL.ing} />
          <StatLine label="Ventas por día" value={rhythm.perDay.toFixed(2)} sub={`sobre ${daysElapsed} día${daysElapsed !== 1 ? 's' : ''} del periodo`} />
          <StatLine label="Días con ventas" value={`${rhythm.activeDays} de ${daysElapsed}`} sub={`${Math.round((rhythm.activeDays / daysElapsed) * 100)}% de los días`} />
          <StatLine label="Mejor día de la semana" value={rhythm.best ?? '—'} color={COL.ing} />
          <p style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.07em', color: 'rgba(var(--d-fg-rgb),0.35)', margin: '16px 0 10px' }}>
            Ingresos por día de la semana
          </p>
          {rhythm.byWeekday.map((w, i) => (
            <HBar key={i} label={WEEKDAYS[i]} value={w.revenue} max={weekdayMax} color={COL.ing}
              right={`${fmtBs(w.revenue)} · ${w.units}`} />
          ))}
        </Block>

        <Block>
          <SectionHeader icon={<Sigma size={15} />} title="Estadísticas" />
          <StatLine label="Promedio diario" value={fmtBs(stats.mean)} sub="ingresos / días del periodo" />
          <StatLine label="Mediana diaria" value={fmtBs(stats.medianDay)} sub="la mitad de los días se vende menos que esto" />
          <StatLine label="Desviación estándar diaria" value={fmtBs(stats.sd)} sub={stats.mean > 0 ? (stats.sd > stats.mean ? 'ventas muy irregulares' : 'ventas bastante parejas') : null} />
          <StatLine label="Mediana por venta" value={fmtBs(stats.medianTicket)} />
          <StatLine label="Día récord" color={COL.ing}
            value={stats.record ? fmtBs(stats.record.value) : '—'}
            sub={stats.record ? stats.record.date.toLocaleDateString('es', { weekday: 'long', day: 'numeric', month: 'short' }) : null} />
          <StatLine label="Recuperación del gasto" value={stats.recovery !== null ? `${stats.recovery}%` : '—'}
            color={stats.recovery === null ? 'var(--d-fg)' : stats.recovery >= 100 ? COL.gan : COL.gas}
            sub="ingresos / gastos del periodo" />
          <StatLine label="Vendido vs ingresado" value={stats.sellThrough !== null ? `${stats.sellThrough}%` : '—'}
            sub="unidades vendidas / unidades que entraron" />
          <StatLine label="Costo promedio por unidad comprada" value={stats.avgCostIn !== null ? fmtBs(stats.avgCostIn) : '—'} />
          {stats.projection !== null && (
            <StatLine label="Proyección de cierre de mes" value={fmtBs(stats.projection)} color={COL.bal} sub="al ritmo diario actual" />
          )}
        </Block>
      </div>

      {/* ── Inventario actual ── */}
      <div style={{ marginBottom: 28 }}>
        <Block>
          <SectionHeader icon={<Package size={15} />} title="Inventario actual"
            right={<span style={{ fontSize: 10, color: 'rgba(var(--d-fg-rgb),0.4)' }}>no depende del periodo</span>} />
          <div className="stat-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: 12, marginBottom: 18 }}>
            <Kpi icon={<Package size={15} />} label="Unidades en stock" value={inventory.units} color="var(--d-fg)" />
            <Kpi icon={<PackagePlus size={15} />} label="Valor al costo" value={fmtBs(inventory.costValue)} color={COL.gas} sub="invertido y aún sin vender" />
            <Kpi icon={<DollarSign size={15} />} label="Valor a precio de venta" value={fmtBs(inventory.saleValue)} color={COL.ing} />
            <Kpi icon={<TrendingUp size={15} />} label="Ganancia potencial" value={fmtBs(inventory.saleValue - inventory.costValue)} color={COL.gan} sub="si se vende todo" />
            <Kpi icon={<Archive size={15} />} label="Archivados" value={inventory.archived} color="rgba(var(--d-fg-rgb),0.6)" sub="agotados u ocultos" />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: 18 }} className="grid-responsive">
            <div>
              <p style={subTitle}>Stock bajo (2 o menos)</p>
              {inventory.low.length === 0 ? <Empty>Todo con stock suficiente.</Empty> : inventory.low.map(({ p, stock }) => (
                <div key={p.id} style={rowItem}>
                  <span style={rowName}>{p.name}</span>
                  <span style={{ fontSize: 12, fontWeight: 900, color: stock <= 1 ? COL.gas : 'orange', whiteSpace: 'nowrap' }}>{stock} ud{stock > 1 ? 's' : ''}</span>
                </div>
              ))}
            </div>
            <div>
              <p style={subTitle}>Sin venderse hace 30 días o más</p>
              {inventory.stale.length === 0 ? <Empty>Todos los productos se están moviendo.</Empty> : inventory.stale.slice(0, 8).map(({ p, days, stock, never }) => (
                <div key={p.id} style={rowItem}>
                  <span style={rowName}>{p.name}</span>
                  <span style={{ fontSize: 11, color: 'rgba(var(--d-fg-rgb),0.5)', whiteSpace: 'nowrap' }}>
                    {stock} uds. · <strong style={{ color: COL.gas }}>{days} días</strong>{never ? ' (nunca vendido)' : ''}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </Block>
      </div>

      {/* ── Insights ── */}
      <div>
        <SectionHeader icon={<Lightbulb size={16} />} title={`Análisis del periodo — ${insights.length}`}
          right={
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
              {['danger', 'warning', 'success', 'info'].map(lvl => {
                const count = insights.filter(i => i.level === lvl).length
                if (!count) return null
                const cfg = LEVEL_CFG[lvl]
                return (
                  <span key={lvl} style={{
                    fontSize: 10, fontWeight: 800, background: `${cfg.color}20`, color: cfg.color,
                    border: `1px solid ${cfg.color}40`, padding: '3px 10px', borderRadius: 99,
                  }}>{count} {cfg.label}</span>
                )
              })}
            </div>
          } />
        {insights.length === 0 ? (
          <Block style={{ textAlign: 'center', padding: '32px 24px' }}>
            <Info size={28} style={{ color: 'rgba(var(--d-fg-rgb),0.2)', marginBottom: 10 }} />
            <p style={{ fontSize: 13, color: 'rgba(var(--d-fg-rgb),0.3)', fontWeight: 600 }}>No hay suficientes datos para generar análisis.</p>
          </Block>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(min(300px, 100%), 1fr))', gap: 12 }}>
            {insights.map((insight, i) => {
              const cfg = LEVEL_CFG[insight.level]
              const Icon = insight.icon
              return (
                <div key={i} style={{
                  background: `${cfg.color}0d`, border: `1px solid ${cfg.color}28`, borderLeft: `3px solid ${cfg.color}`,
                  borderRadius: 12, padding: '14px 16px', display: 'flex', gap: 12, alignItems: 'flex-start',
                  animation: 'fadeIn 0.35s ease',
                }}>
                  <div style={{
                    background: `${cfg.color}20`, borderRadius: 8, width: 36, height: 36, flexShrink: 0,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}>
                    <Icon size={16} style={{ color: cfg.color }} />
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 5, flexWrap: 'wrap' }}>
                      <p style={{ fontSize: 12, fontWeight: 800, color: 'var(--d-fg)', lineHeight: 1.2 }}>{insight.title}</p>
                      <span style={{
                        fontSize: 9, fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.08em',
                        background: `${cfg.color}28`, color: cfg.color, padding: '2px 7px', borderRadius: 4,
                      }}>{cfg.label}</span>
                    </div>
                    <p style={{ fontSize: 11, color: 'rgba(var(--d-fg-rgb),0.5)', lineHeight: 1.55 }}>{insight.body}</p>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

    </div>
  )
}

const tdNum    = color => ({ padding: '9px 8px', fontSize: 12, fontWeight: 800, color, textAlign: 'right', whiteSpace: 'nowrap' })
const subTitle = { fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.07em', color: 'rgba(var(--d-fg-rgb),0.35)', marginBottom: 8 }
const rowItem  = { display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10, padding: '7px 0', borderBottom: '1px solid rgba(var(--d-fg-rgb),0.06)' }
const rowName  = { fontSize: 12, fontWeight: 700, color: 'var(--d-fg)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', minWidth: 0 }
