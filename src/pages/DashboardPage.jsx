import { useMemo, useState } from 'react'
import {
  TrendingUp, TrendingDown, DollarSign, ShoppingBag,
  Star, Zap, RotateCcw, Award, Lightbulb, RefreshCw,
  Calendar, BarChart2, Percent,
  AlertTriangle, AlertCircle, CheckCircle2, Info,
  Flame, Clock, ArrowDownRight, ArrowUpRight, PackageSearch, BadgePercent,
} from 'lucide-react'

// ─── Helpers de fecha ─────────────────────────────────────────────
function startOfDay(d = new Date()) {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate())
}
function startOfWeek(d = new Date()) {
  const diff = (d.getDay() + 6) % 7  // lunes = 0
  const m = new Date(d)
  m.setDate(m.getDate() - diff)
  return startOfDay(m)
}
function startOfMonth(d = new Date()) {
  return new Date(d.getFullYear(), d.getMonth(), 1)
}
function addDays(d, n) {
  const r = new Date(d); r.setDate(r.getDate() + n); return r
}
function fmtShortDate(d) {
  return d.toLocaleDateString('es', { day: '2-digit', month: 'short' })
}
function fmtBs(n) { return `Bs. ${(n || 0).toFixed(2)}` }
function pct(curr, prev) {
  if (!prev) return curr > 0 ? 100 : 0
  return Math.round(((curr - prev) / prev) * 100)
}

// ─── Calcula stats sobre un array de ventas ────────────────────────
function calcStats(arr, productMap) {
  const units = arr.length
  const revenue = arr.reduce((a, s) => a + (s.price_at_sale ?? productMap[s.product_id]?.price ?? 0), 0)
  const profit  = arr.reduce((a, s) => {
    const price = s.price_at_sale ?? productMap[s.product_id]?.price ?? 0
    const cost  = s.buy_price_at_sale ?? productMap[s.product_id]?.buy_price ?? 0
    return a + (price - cost)
  }, 0)
  return { units, revenue, profit }
}

// ─── Sub-componentes ──────────────────────────────────────────────

function KpiCard({ icon, label, value, sub, accent, color }) {
  const bg = accent ? '#F5C400' : color ? `${color}18` : 'rgba(255,255,255,0.07)'
  const textColor = accent ? '#111' : color || '#fff'
  const subColor  = accent ? '#111111aa' : 'rgba(255,255,255,0.45)'
  return (
    <div style={{
      background: bg, borderRadius: 14,
      border: color && !accent ? `1.5px solid ${color}35` : 'none',
      padding: '18px 20px', display: 'flex', flexDirection: 'column', gap: 6,
      animation: 'fadeIn 0.3s ease',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
        <span style={{ color: textColor, opacity: 0.7 }}>{icon}</span>
        <span style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.07em', color: textColor, opacity: 0.7 }}>{label}</span>
      </div>
      <p style={{ fontSize: 26, fontWeight: 900, color: textColor, lineHeight: 1 }}>{value}</p>
      {sub && <p style={{ fontSize: 11, color: subColor }}>{sub}</p>}
    </div>
  )
}

function PctBadge({ curr, prev }) {
  const p = pct(curr, prev)
  const color = p === 0 ? '#9e9e9e' : p > 0 ? '#27ae60' : '#e53e3e'
  const Icon = p >= 0 ? TrendingUp : TrendingDown
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 3,
      fontSize: 11, fontWeight: 800, color,
      background: `${color}18`, padding: '3px 8px', borderRadius: 20,
    }}>
      <Icon size={11} />
      {p > 0 ? '+' : ''}{p}%
    </span>
  )
}

function CompareRow({ label, curr, prev, isBs = true }) {
  const fmt = isBs ? fmtBs : (n) => `${n} uds.`
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 0', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
      <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.55)', fontWeight: 600 }}>{label}</span>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <span style={{ fontSize: 13, fontWeight: 800, color: '#fff' }}>{fmt(curr)}</span>
        <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.3)' }}>vs {fmt(prev)}</span>
        <PctBadge curr={curr} prev={prev} />
      </div>
    </div>
  )
}

function BarChart({ days }) {
  const [hovered, setHovered] = useState(null)
  const maxRev = Math.max(...days.map(d => d.revenue), 1)
  return (
    <div style={{ position: 'relative' }}>
      <div style={{ display: 'flex', alignItems: 'flex-end', gap: 6, height: 90 }}>
        {days.map((day, i) => {
          const h = Math.max(4, (day.revenue / maxRev) * 86)
          const isH = hovered === i
          return (
            <div key={i}
              style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4, cursor: 'pointer', position: 'relative' }}
              onMouseEnter={() => setHovered(i)}
              onMouseLeave={() => setHovered(null)}>
              {isH && (
                <div style={{
                  position: 'absolute', bottom: 100, left: '50%', transform: 'translateX(-50%)',
                  background: '#1a1a1a', border: '1px solid rgba(255,255,255,0.15)',
                  borderRadius: 8, padding: '8px 12px', zIndex: 10, minWidth: 130,
                  fontSize: 11, color: '#fff', boxShadow: '0 8px 24px rgba(0,0,0,0.4)',
                  pointerEvents: 'none', whiteSpace: 'nowrap',
                }}>
                  <p style={{ fontWeight: 800, marginBottom: 4 }}>{fmtShortDate(new Date(day.date))}</p>
                  <p style={{ color: '#F5C400' }}>Ingresos: {fmtBs(day.revenue)}</p>
                  <p style={{ color: '#60c8f0' }}>Ganancia: {fmtBs(day.profit)}</p>
                  <p style={{ color: 'rgba(255,255,255,0.5)' }}>{day.units} venta(s)</p>
                </div>
              )}
              <div style={{
                width: '100%', height: h,
                background: isH ? '#F5C400' : day.revenue > 0 ? 'rgba(245,196,0,0.55)' : 'rgba(255,255,255,0.08)',
                borderRadius: '5px 5px 0 0',
                transition: 'all 0.15s',
                boxShadow: isH ? '0 0 12px #F5C40060' : 'none',
              }} />
            </div>
          )
        })}
      </div>
      <div style={{ display: 'flex', gap: 6, marginTop: 6 }}>
        {days.map((day, i) => (
          <div key={i} style={{ flex: 1, textAlign: 'center', fontSize: 9, color: 'rgba(255,255,255,0.35)', fontWeight: 600 }}>
            {fmtShortDate(new Date(day.date))}
          </div>
        ))}
      </div>
    </div>
  )
}

function SectionHeader({ icon, title }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
      <span style={{ color: '#F5C400' }}>{icon}</span>
      <h2 style={{ fontSize: 13, fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.06em', color: '#fff' }}>{title}</h2>
    </div>
  )
}

function Block({ children }) {
  return (
    <div style={{
      background: 'rgba(255,255,255,0.04)',
      border: '1px solid rgba(255,255,255,0.08)',
      borderRadius: 14, padding: '18px 20px',
    }}>
      {children}
    </div>
  )
}

function ActionRow({ icon, label, main, sub, color }) {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 10,
      padding: '10px 12px',
      background: `${color}10`, borderRadius: 8,
      border: `1px solid ${color}25`,
    }}>
      <span style={{ color, flexShrink: 0 }}>{icon}</span>
      <div style={{ flex: 1, minWidth: 0 }}>
        <p style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: `${color}99`, marginBottom: 2 }}>{label}</p>
        <p style={{ fontSize: 13, fontWeight: 800, color: '#fff', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{main}</p>
        <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)' }}>{sub}</p>
      </div>
    </div>
  )
}

// ─── Configuración visual por nivel de insight ──────────────────
const LEVEL_CFG = {
  danger:  { color: '#e53e3e', label: 'Atención' },
  warning: { color: '#F5C400', label: 'Aviso'    },
  success: { color: '#27ae60', label: 'Positivo' },
  info:    { color: '#60c8f0', label: 'Info'      },
}

// ─── Página principal ─────────────────────────────────────────────
export default function DashboardPage({ sales = [], productMap = {}, loading }) {
  const [, forceUpdate] = useState(0)
  const now = new Date()

  // Solo ventas de F
  const salesF = useMemo(() => sales.filter(s => s.seller === 'F'), [sales])

  // Rangos
  const todayStart     = startOfDay(now)
  const weekStart      = startOfWeek(now)
  const lastWeekStart  = addDays(weekStart, -7)
  const lastWeekEnd    = weekStart
  const monthStart     = startOfMonth(now)
  const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1)
  const lastMonthEnd   = monthStart

  const inRange = (s, from, to) => {
    const t = new Date(s.sold_at)
    return t >= from && (!to || t < to)
  }

  const todaySales     = useMemo(() => salesF.filter(s => inRange(s, todayStart)),                         [salesF])
  const thisWeekSales  = useMemo(() => salesF.filter(s => inRange(s, weekStart)),                          [salesF])
  const lastWeekSales  = useMemo(() => salesF.filter(s => inRange(s, lastWeekStart, lastWeekEnd)),         [salesF])
  const thisMonthSales = useMemo(() => salesF.filter(s => inRange(s, monthStart)),                         [salesF])
  const lastMonthSales = useMemo(() => salesF.filter(s => inRange(s, lastMonthStart, lastMonthEnd)),       [salesF])

  const today     = useMemo(() => calcStats(todaySales,     productMap), [todaySales,     productMap])
  const thisWeek  = useMemo(() => calcStats(thisWeekSales,  productMap), [thisWeekSales,  productMap])
  const lastWeek  = useMemo(() => calcStats(lastWeekSales,  productMap), [lastWeekSales,  productMap])
  const thisMonth = useMemo(() => calcStats(thisMonthSales, productMap), [thisMonthSales, productMap])
  const lastMonth = useMemo(() => calcStats(lastMonthSales, productMap), [lastMonthSales, productMap])

  // Últimos 7 días para el gráfico
  const last7days = useMemo(() => Array.from({ length: 7 }, (_, i) => {
    const dayStart = startOfDay(addDays(now, -(6 - i)))
    const dayEnd   = addDays(dayStart, 1)
    const arr = salesF.filter(s => inRange(s, dayStart, dayEnd))
    return { date: dayStart.toISOString(), ...calcStats(arr, productMap) }
  }), [salesF, productMap])

  // Top productos del mes
  const topProductsMonth = useMemo(() => {
    const counts = {}
    thisMonthSales.forEach(s => { counts[s.product_id] = (counts[s.product_id] || 0) + 1 })
    return Object.entries(counts)
      .sort((a, b) => b[1] - a[1]).slice(0, 3)
      .map(([pid, qty]) => ({ product: productMap[pid], qty }))
  }, [thisMonthSales, productMap])

  // Estrella del día
  const topToday = useMemo(() => {
    const counts = {}
    todaySales.forEach(s => { counts[s.product_id] = (counts[s.product_id] || 0) + 1 })
    const [pid] = Object.entries(counts).sort((a, b) => b[1] - a[1])[0] || []
    return pid ? { product: productMap[pid], qty: counts[pid] } : null
  }, [todaySales, productMap])

  // Más rentable hoy
  const bestProfitToday = useMemo(() => {
    if (!todaySales.length) return null
    return todaySales.reduce((best, s) => {
      const pr = (s.price_at_sale ?? 0) - (s.buy_price_at_sale ?? 0)
      return pr > (best?.profit ?? -Infinity) ? { ...s, profit: pr } : best
    }, null)
  }, [todaySales])

  const lastSale = salesF[0]

  const bestDay = useMemo(() =>
    last7days.reduce((best, d) => d.revenue > (best?.revenue ?? -1) ? d : best, null)
  , [last7days])

  // Balance general total de F (todo el tiempo)
  const totalAll = useMemo(() => calcStats(salesF, productMap), [salesF, productMap])
  const marginPct = totalAll.revenue > 0
    ? Math.round((totalAll.profit / totalAll.revenue) * 100)
    : 0

  // Historial semana a semana (últimas 8 semanas)
  const weeklyHistory = useMemo(() => {
    const weeks = []
    for (let i = 7; i >= 0; i--) {
      const wStart = addDays(startOfWeek(now), -(i * 7))
      const wEnd   = addDays(wStart, 7)
      const arr    = salesF.filter(s => inRange(s, wStart, wEnd))
      if (arr.length > 0 || i === 0) {
        weeks.push({ start: wStart, end: wEnd, ...calcStats(arr, productMap) })
      }
    }
    return weeks
  }, [salesF, productMap])

  // ─── Motor de insights (12+ reglas) ─────────────────────────────
  const insights = useMemo(() => {
    const list = [] // { level: 'danger'|'warning'|'success'|'info', icon, title, body }

    // ── REGLA 1: Sin ventas esta semana ──────────────────────────
    if (thisWeek.units === 0) {
      list.push({
        level: 'warning',
        icon: Clock,
        title: 'Sin actividad esta semana',
        body: 'Todavía no hay ventas registradas para esta semana.',
      })
    }

    // ── REGLA 2: Ingresos semana actual vs anterior ───────────────
    if (thisWeek.revenue > 0 || lastWeek.revenue > 0) {
      const p = pct(thisWeek.revenue, lastWeek.revenue)
      if (p >= 20) list.push({
        level: 'success', icon: ArrowUpRight,
        title: `Semana ${p}% mejor que la anterior`,
        body: `Esta semana llevas ${fmtBs(thisWeek.revenue)} vs ${fmtBs(lastWeek.revenue)} la semana pasada.`,
      })
      else if (p <= -20) list.push({
        level: 'danger', icon: ArrowDownRight,
        title: `Semana ${Math.abs(p)}% por debajo`,
        body: `Esta semana llevas ${fmtBs(thisWeek.revenue)} — ${fmtBs(lastWeek.revenue - thisWeek.revenue)} menos que la semana anterior.`,
      })
      else if (p < 0) list.push({
        level: 'warning', icon: TrendingDown,
        title: 'Ingresos ligeramente inferiores',
        body: `Esta semana llevas ${fmtBs(thisWeek.revenue)}, un ${Math.abs(p)}% por debajo de la semana pasada.`,
      })
    }

    // ── REGLA 3: Ganancia cae aunque ingresos suben ───────────────
    if (thisWeek.revenue > lastWeek.revenue && thisWeek.profit < lastWeek.profit) {
      list.push({
        level: 'danger', icon: AlertTriangle,
        title: 'Vendés más pero ganás menos',
        body: `Ingresaste más que la semana pasada (${fmtBs(thisWeek.revenue)}) pero la ganancia cayó de ${fmtBs(lastWeek.profit)} a ${fmtBs(thisWeek.profit)}. Revisá los costos o descuentos.`,
      })
    }

    // ── REGLA 4: Margen de ganancia semanal bajo ──────────────────
    const weekMargin = thisWeek.revenue > 0
      ? Math.round((thisWeek.profit / thisWeek.revenue) * 100) : 0
    if (thisWeek.revenue > 0 && weekMargin < 10) {
      list.push({
        level: 'danger', icon: BadgePercent,
        title: `Margen semanal muy bajo — ${weekMargin}%`,
        body: `Estás quedándote con solo el ${weekMargin}% de lo que vendés. El costo de compra está comiendo casi toda la ganancia.`,
      })
    } else if (thisWeek.revenue > 0 && weekMargin >= 30) {
      list.push({
        level: 'success', icon: BadgePercent,
        title: `Excelente margen esta semana — ${weekMargin}%`,
        body: `De cada ${fmtBs(100)} que vendés, te quedan ${fmtBs(weekMargin)} de ganancia neta. Seguí así.`,
      })
    }

    // ── REGLA 5: Margen total histórico ──────────────────────────
    if (marginPct < 15 && totalAll.revenue > 0) {
      list.push({
        level: 'warning', icon: AlertCircle,
        title: `Margen histórico ajustado — ${marginPct}%`,
        body: `En total, tu margen de ganancia es del ${marginPct}%. Idealmente debería superar el 20–25%.`,
      })
    }

    // ── REGLA 6: Comparativa mensual ─────────────────────────────
    if (lastMonth.revenue > 0) {
      const mp = pct(thisMonth.revenue, lastMonth.revenue)
      if (mp >= 15) list.push({
        level: 'success', icon: TrendingUp,
        title: `Este mes va ${mp}% por encima`,
        body: `Ya superás el ritmo del mes pasado (${fmtBs(lastMonth.revenue)}). Llevas ${fmtBs(thisMonth.revenue)} este mes.`,
      })
      else if (mp <= -15) list.push({
        level: 'warning', icon: TrendingDown,
        title: 'Mes por debajo del anterior',
        body: `Este mes llevas ${fmtBs(thisMonth.revenue)}, un ${Math.abs(mp)}% menos que el mes pasado (${fmtBs(lastMonth.revenue)}).`,
      })
    }

    // ── REGLA 7: Producto en llamas hoy (3+ ventas) ───────────────
    const hotToday = todaySales.reduce((acc, s) => {
      acc[s.product_id] = (acc[s.product_id] || 0) + 1; return acc
    }, {})
    const [hotPid, hotQty] = Object.entries(hotToday).sort((a,b) => b[1]-a[1])[0] || []
    if (hotQty >= 3) {
      list.push({
        level: 'success', icon: Flame,
        title: `"${productMap[hotPid]?.name ?? 'Producto'}" está volando hoy`,
        body: `Ya vendiste ${hotQty} unidades de este producto en el día de hoy.`,
      })
    }

    // ── REGLA 8: Horas sin ventas (desde última venta de F) ───────
    if (salesF.length > 0) {
      const lastTime = new Date(salesF[0].sold_at)
      const hoursAgo = (now - lastTime) / (1000 * 60 * 60)
      if (hoursAgo >= 4 && hoursAgo < 24) {
        list.push({
          level: 'info', icon: Clock,
          title: `${Math.floor(hoursAgo)} horas sin ventas`,
          body: `La última venta fue a las ${lastTime.toLocaleTimeString('es', { hour: '2-digit', minute: '2-digit' })}. Llevás un rato sin actividad.`,
        })
      }
    }

    // ── REGLA 9: Mejor semana del historial ──────────────────────
    if (weeklyHistory.length >= 3) {
      const bestWeek = weeklyHistory.slice(0, -1).reduce((b, w) => w.revenue > b.revenue ? w : b, weeklyHistory[0])
      if (thisWeek.revenue > bestWeek.revenue && thisWeek.revenue > 0) {
        list.push({
          level: 'success', icon: Star,
          title: 'Mejor semana hasta ahora',
          body: `Esta semana supera a todas las anteriores con ${fmtBs(thisWeek.revenue)} en ingresos.`,
        })
      }
    }

    // ── REGLA 10: Producto estrella del mes ──────────────────────
    if (topProductsMonth[0]?.product) {
      const { product, qty } = topProductsMonth[0]
      list.push({
        level: 'info', icon: PackageSearch,
        title: `"${product.name}" lidera el mes`,
        body: `Es tu producto más vendido con ${qty} unidad${qty > 1 ? 'es' : ''} este mes.`,
      })
    }

    // ── REGLA 11: Ganancia hoy cero o negativa ────────────────────
    if (todaySales.length > 0 && today.profit <= 0) {
      list.push({
        level: 'danger', icon: AlertCircle,
        title: 'Hoy sin ganancia neta',
        body: 'Las ventas de hoy no están generando ganancia. Verificá si los precios de costo están bien registrados.',
      })
    }

    // ── REGLA 12: Progreso del mes (ritmo proyectado) ─────────────
    if (thisMonth.revenue > 0 && lastMonth.revenue > 0) {
      const dayOfMonth = now.getDate()
      const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate()
      const projected = (thisMonth.revenue / dayOfMonth) * daysInMonth
      const projPct = pct(projected, lastMonth.revenue)
      if (projPct > 10) list.push({
        level: 'info', icon: TrendingUp,
        title: 'Ritmo proyectado positivo',
        body: `Al ritmo actual, terminarías el mes con ~${fmtBs(projected)}, un ${projPct}% más que el mes pasado.`,
      })
      else if (projPct < -10) list.push({
        level: 'warning', icon: TrendingDown,
        title: 'Ritmo proyectado por debajo',
        body: `Al ritmo actual, el mes cerraría con ~${fmtBs(projected)}, un ${Math.abs(projPct)}% menos que el mes pasado.`,
      })
    }

    // Ordenar: danger > warning > success > info
    const order = { danger: 0, warning: 1, success: 2, info: 3 }
    return list.sort((a, b) => order[a.level] - order[b.level])
  }, [salesF, todaySales, today, thisWeek, lastWeek, thisMonth, lastMonth, weeklyHistory, topProductsMonth, totalAll, marginPct, productMap])

  if (loading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '60vh', color: 'rgba(255,255,255,0.4)', fontSize: 14, background: '#111' }}>
      Cargando dashboard...
    </div>
  )

  return (
    <div style={{ background: '#111', minHeight: '100vh', padding: '24px var(--page-pad) 48px' }}>

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 28 }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <span style={{
              background: '#60c8f0', color: '#000',
              fontWeight: 900, fontSize: 15, width: 32, height: 32,
              display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: 8,
            }}>F</span>
            <h1 style={{ fontSize: 22, fontWeight: 900, color: '#fff' }}>Dashboard</h1>
          </div>
          <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.35)', marginTop: 4 }}>
            {now.toLocaleDateString('es', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
          </p>
        </div>
        <button
          onClick={() => forceUpdate(n => n + 1)}
          style={{
            background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.1)',
            borderRadius: 8, padding: '8px 14px', color: 'rgba(255,255,255,0.6)',
            display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, fontWeight: 700,
            transition: 'all 0.15s',
          }}>
          <RefreshCw size={14} /> Actualizar vista
        </button>
      </div>

      {/* A: KPIs del día */}
      <div style={{ marginBottom: 28 }}>
        <SectionHeader icon={<DollarSign size={16} />} title="Hoy" />
        <div className="stat-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(155px, 1fr))', gap: 12 }}>
          <KpiCard icon={<DollarSign size={16}  />} label="Ingresos hoy"   value={fmtBs(today.revenue)} sub={`${today.units} venta${today.units !== 1 ? 's' : ''}`} accent />
          <KpiCard icon={<TrendingUp size={16}  />} label="Ganancia hoy"   value={fmtBs(today.profit)}  sub="precio − costo" color="#27ae60" />
          <KpiCard icon={<ShoppingBag size={16} />} label="Unidades"       value={today.units}          sub="vendidas hoy"   color="#60c8f0" />
          <KpiCard icon={<Star size={16}        />} label="Estrella del día"
            value={topToday ? `${topToday.qty}×` : '—'}
            sub={topToday?.product?.name ?? 'Sin ventas aún'}
            color="#F5C400" />
        </div>
      </div>

      {/* B-NUEVO: Balance total general */}
      <div style={{ marginBottom: 28 }}>
        <SectionHeader icon={<DollarSign size={16} />} title="Balance total — Vendedor F" />
        <div className="stat-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 12 }}>

          {/* Liquidez */}
          <div style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 14, padding: '18px 20px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 8 }}>
              <DollarSign size={14} style={{ color: '#60c8f0' }} />
              <span style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.07em', color: 'rgba(255,255,255,0.45)' }}>Liquidez total</span>
            </div>
            <p style={{ fontSize: 28, fontWeight: 900, color: '#60c8f0', lineHeight: 1, marginBottom: 4 }}>{fmtBs(totalAll.revenue)}</p>
            <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.35)' }}>Todo el dinero que entró</p>
          </div>

          {/* Ganancia total */}
          <div style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 14, padding: '18px 20px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 8 }}>
              <TrendingUp size={14} style={{ color: '#27ae60' }} />
              <span style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.07em', color: 'rgba(255,255,255,0.45)' }}>Ganancia total</span>
            </div>
            <p style={{ fontSize: 28, fontWeight: 900, color: '#27ae60', lineHeight: 1, marginBottom: 4 }}>{fmtBs(totalAll.profit)}</p>
            <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.35)' }}>Descontando costo de compra</p>
          </div>

          {/* % Margen */}
          <div style={{ background: '#F5C40012', border: '1.5px solid #F5C40035', borderRadius: 14, padding: '18px 20px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 8 }}>
              <Percent size={14} style={{ color: '#F5C400' }} />
              <span style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.07em', color: '#F5C40099' }}>Margen de ganancia</span>
            </div>
            <p style={{ fontSize: 28, fontWeight: 900, color: '#F5C400', lineHeight: 1, marginBottom: 8 }}>{marginPct}%</p>
            {/* Barra de progreso */}
            <div style={{ background: 'rgba(255,255,255,0.1)', borderRadius: 99, height: 6, overflow: 'hidden' }}>
              <div style={{
                width: `${Math.min(marginPct, 100)}%`, height: '100%',
                background: marginPct >= 30 ? '#27ae60' : marginPct >= 15 ? '#F5C400' : '#e53e3e',
                borderRadius: 99, transition: 'width 0.6s ease',
              }} />
            </div>
            <p style={{ fontSize: 10, color: 'rgba(255,255,255,0.3)', marginTop: 6 }}>
              {marginPct >= 30 ? '✅ Buen margen' : marginPct >= 15 ? '⚠️ Margen ajustado' : '❌ Margen bajo'}
            </p>
          </div>

        </div>
      </div>

      {/* B + C: Comparativas */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 18, marginBottom: 28 }} className="grid-responsive">
        <Block>
          <SectionHeader icon={<Calendar size={15} />} title="Esta semana vs anterior" />
          <CompareRow label="Ingresos" curr={thisWeek.revenue} prev={lastWeek.revenue} />
          <CompareRow label="Ganancia" curr={thisWeek.profit}  prev={lastWeek.profit}  />
          <CompareRow label="Unidades" curr={thisWeek.units}   prev={lastWeek.units}   isBs={false} />
        </Block>
        <Block>
          <SectionHeader icon={<BarChart2 size={15} />} title="Este mes vs anterior" />
          <CompareRow label="Ingresos" curr={thisMonth.revenue} prev={lastMonth.revenue} />
          <CompareRow label="Ganancia" curr={thisMonth.profit}  prev={lastMonth.profit}  />
          <CompareRow label="Unidades" curr={thisMonth.units}   prev={lastMonth.units}   isBs={false} />
        </Block>
      </div>

      {/* D: Gráfico 7 días */}
      <div style={{ marginBottom: 28 }}>
        <Block>
          <SectionHeader icon={<BarChart2 size={15} />} title="Ingresos — últimos 7 días" />
          <BarChart days={last7days} />
        </Block>
      </div>

      {/* D2: Historial semana a semana */}
      <div style={{ marginBottom: 28 }}>
        <Block>
          <SectionHeader icon={<Calendar size={15} />} title="Historial por semanas" />
          {weeklyHistory.length === 0
            ? <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.3)' }}>Sin historial aún.</p>
            : (() => {
              const maxRev = Math.max(...weeklyHistory.map(w => w.revenue), 1)
              const isCurrentWeek = (w) => w.start.getTime() === startOfWeek(now).getTime()
              return (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {weeklyHistory.map((w, i) => {
                    const isCurrent = isCurrentWeek(w)
                    const barW = Math.max(2, (w.revenue / maxRev) * 100)
                    const label = `Sem. ${fmtShortDate(w.start)}`
                    return (
                      <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                        {/* Semana label */}
                        <div style={{ minWidth: 90, display: 'flex', alignItems: 'center', gap: 5, flexShrink: 0 }}>
                          {isCurrent && (
                            <span style={{ fontSize: 8, background: '#F5C400', color: '#111', fontWeight: 900, padding: '2px 5px', borderRadius: 3 }}>HOY</span>
                          )}
                          <span style={{ fontSize: 11, fontWeight: 700, color: isCurrent ? '#fff' : 'rgba(255,255,255,0.5)' }}>{label}</span>
                        </div>
                        {/* Barra */}
                        <div style={{ flex: 1, background: 'rgba(255,255,255,0.07)', borderRadius: 99, height: 8, overflow: 'hidden' }}>
                          <div style={{
                            width: `${barW}%`, height: '100%',
                            background: isCurrent ? '#F5C400' : 'rgba(245,196,0,0.4)',
                            borderRadius: 99, transition: 'width 0.5s ease',
                          }} />
                        </div>
                        {/* Montos */}
                        <div style={{ textAlign: 'right', minWidth: 160, flexShrink: 0 }}>
                          <span style={{ fontSize: 13, fontWeight: 900, color: isCurrent ? '#F5C400' : '#fff' }}>
                            {fmtBs(w.revenue)}
                          </span>
                          <span style={{ fontSize: 11, color: '#27ae60', fontWeight: 700, marginLeft: 8 }}>
                            +{fmtBs(w.profit)} gan.
                          </span>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )
            })()
          }
        </Block>
      </div>

      {/* E: Solo Acciones destacadas — ancho completo en grid 1 col */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 18 }} className="grid-responsive">
        <Block>
          <SectionHeader icon={<Zap size={15} />} title="Acciones destacadas" />
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <ActionRow
              icon={<RotateCcw size={14} />} label="Última venta" color="#60c8f0"
              main={lastSale ? (productMap[lastSale.product_id]?.name ?? 'Producto') : '—'}
              sub={lastSale
                ? `${new Date(lastSale.sold_at).toLocaleTimeString('es', { hour: '2-digit', minute: '2-digit' })} · ${fmtBs(lastSale.price_at_sale)}`
                : 'Sin ventas registradas'} />
            <ActionRow
              icon={<Award size={14} />} label="Más rentable hoy" color="#F5C400"
              main={bestProfitToday ? (productMap[bestProfitToday.product_id]?.name ?? 'Producto') : '—'}
              sub={bestProfitToday ? `+${fmtBs(bestProfitToday.profit)} de ganancia` : 'Sin datos de hoy'} />

            <div>
              <p style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.07em', color: 'rgba(255,255,255,0.35)', marginBottom: 8 }}>
                Top 3 este mes
              </p>
              {topProductsMonth.length === 0
                ? <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.3)' }}>Sin ventas este mes</p>
                : topProductsMonth.map(({ product, qty }, i) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                    <span style={{
                      fontSize: 10, fontWeight: 900, color: '#111',
                      background: i === 0 ? '#F5C400' : i === 1 ? '#aaa' : '#cd7f32',
                      width: 18, height: 18, borderRadius: 4,
                      display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                    }}>{i + 1}</span>
                    <span style={{ fontSize: 12, fontWeight: 700, color: '#fff', flex: 1 }}>{product?.name ?? '—'}</span>
                    <span style={{ fontSize: 11, color: '#F5C400', fontWeight: 800 }}>{qty} ud{qty > 1 ? 's' : ''}</span>
                  </div>
                ))
              }
            </div>
          </div>
        </Block>

        {/* Resumen de insights por nivel */}
        <Block>
          <SectionHeader icon={<Lightbulb size={15} />} title="Resumen de análisis" />
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {['danger','warning','success','info'].map(lvl => {
              const cfg = LEVEL_CFG[lvl]
              const count = insights.filter(i => i.level === lvl).length
              if (!count) return null
              return (
                <div key={lvl} style={{
                  display: 'flex', alignItems: 'center', gap: 10,
                  background: `${cfg.color}10`, border: `1px solid ${cfg.color}30`,
                  borderLeft: `3px solid ${cfg.color}`,
                  borderRadius: 8, padding: '10px 14px',
                }}>
                  <span style={{ fontSize: 18, fontWeight: 900, color: cfg.color, minWidth: 28 }}>{count}</span>
                  <div>
                    <p style={{ fontSize: 12, fontWeight: 800, color: cfg.color }}>{cfg.label}{count > 1 ? 's' : ''}</p>
                    <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)' }}>
                      {lvl === 'danger'  && 'Situaciones que requieren acción inmediata'}
                      {lvl === 'warning' && 'Tendencias a monitorear de cerca'}
                      {lvl === 'success' && 'Métricas positivas para celebrar'}
                      {lvl === 'info'    && 'Datos informativos del período'}
                    </p>
                  </div>
                </div>
              )
            })}
            {insights.length === 0 && (
              <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.3)' }}>No hay datos suficientes aún.</p>
            )}
          </div>
        </Block>
      </div>

      {/* F: PANEL DE INSIGHTS — ancho completo */}
      <div style={{ marginTop: 28 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ color: '#F5C400' }}><Lightbulb size={16} /></span>
            <h2 style={{ fontSize: 13, fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.06em', color: '#fff' }}>Análisis e Insights</h2>
            <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.3)', fontWeight: 600 }}>— {insights.length} detectado{insights.length !== 1 ? 's' : ''}</span>
          </div>
          <div style={{ display: 'flex', gap: 6 }}>
            {['danger','warning','success','info'].map(lvl => {
              const count = insights.filter(i => i.level === lvl).length
              if (!count) return null
              const cfg = LEVEL_CFG[lvl]
              return (
                <span key={lvl} style={{
                  fontSize: 10, fontWeight: 800,
                  background: `${cfg.color}20`, color: cfg.color,
                  border: `1px solid ${cfg.color}40`,
                  padding: '3px 10px', borderRadius: 99,
                }}>{count} {cfg.label}</span>
              )
            })}
          </div>
        </div>

        {insights.length === 0 ? (
          <div style={{
            background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)',
            borderRadius: 14, padding: '32px 24px', textAlign: 'center',
          }}>
            <Info size={28} style={{ color: 'rgba(255,255,255,0.2)', marginBottom: 10 }} />
            <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.3)', fontWeight: 600 }}>No hay suficientes datos para generar insights aún.</p>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 12 }}>
            {insights.map((insight, i) => {
              const cfg = LEVEL_CFG[insight.level]
              const Icon = insight.icon
              return (
                <div key={i} style={{
                  background: `${cfg.color}0d`,
                  border: `1px solid ${cfg.color}28`,
                  borderLeft: `3px solid ${cfg.color}`,
                  borderRadius: 12,
                  padding: '14px 16px',
                  display: 'flex', gap: 12, alignItems: 'flex-start',
                  animation: 'fadeIn 0.35s ease',
                }}>
                  <div style={{
                    background: `${cfg.color}20`, borderRadius: 8,
                    width: 36, height: 36, flexShrink: 0,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}>
                    <Icon size={16} style={{ color: cfg.color }} />
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 5, flexWrap: 'wrap' }}>
                      <p style={{ fontSize: 12, fontWeight: 800, color: '#fff', lineHeight: 1.2 }}>{insight.title}</p>
                      <span style={{
                        fontSize: 9, fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.08em',
                        background: `${cfg.color}28`, color: cfg.color,
                        padding: '2px 7px', borderRadius: 4, flexShrink: 0,
                      }}>{cfg.label}</span>
                    </div>
                    <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.5)', lineHeight: 1.55 }}>{insight.body}</p>
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

