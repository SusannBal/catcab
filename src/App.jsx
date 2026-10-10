import { useState, useEffect } from 'react'
import { BookOpen, Settings2, BarChart3, ShoppingBag, PackagePlus, LayoutDashboard, Sun, Moon, MessageSquare } from 'lucide-react'
import { useData } from './hooks/useData'
import DashboardPage  from './pages/DashboardPage'
import CatalogPage   from './pages/CatalogPage'
import GestionPage   from './pages/GestionPage'
import InventarioPage from './pages/InventarioPage'
import VentasPage    from './pages/VentasPage'
import EntradasPage  from './pages/EntradasPage'
import ContactSection from './components/ContactSection'

const TABS = [
  { id: 'dashboard',  label: 'Dashboard',  icon: LayoutDashboard },
  { id: 'catalogo',   label: 'Catálogo',   icon: BookOpen   },
  { id: 'gestion',    label: 'Gestión',     icon: Settings2  },
  { id: 'entradas',   label: 'Entradas',    icon: PackagePlus },
  { id: 'inventario', label: 'Inventario',  icon: BarChart3  },
  { id: 'ventas',     label: 'Ventas',      icon: ShoppingBag },
  { id: 'contacto',   label: 'Contáctanos', icon: MessageSquare },
]

// Tema guardado en este navegador; si no hay, sigue la preferencia del sistema
function initialTheme() {
  try {
    const saved = localStorage.getItem('theme')
    if (saved === 'light' || saved === 'dark') return saved
  } catch {}
  return window.matchMedia?.('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
}

export default function App() {
  const [tab, setTab] = useState('dashboard')
  const [theme, setTheme] = useState(initialTheme)
  const data = useData()

  useEffect(() => {
    document.documentElement.dataset.theme = theme
    try { localStorage.setItem('theme', theme) } catch {}
  }, [theme])

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      {/* Topbar */}
      <div style={{
        background: '#0d0d0d', color: 'var(--white)',
        padding: '0 var(--page-pad)', display: 'flex', alignItems: 'center', gap: 16,
        position: 'sticky', top: 0, zIndex: 200,
        boxShadow: '0 2px 10px rgba(0,0,0,0.2)',
        overflowX: 'auto',
      }}>
        {/* Logo */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, paddingRight: 12, borderRight: '1px solid rgba(255,255,255,0.1)', flexShrink: 0 }}>
          <span style={{
            background: 'var(--accent)', color: '#111',
            fontWeight: 900, fontSize: 10, padding: '2px 6px',
            borderRadius: 3, letterSpacing: '0.1em',
          }}>CAT</span>
          <span style={{ fontWeight: 800, fontSize: 13, letterSpacing: '-0.01em' }}>Catálogo</span>
          <button
            onClick={() => setTheme(t => t === 'dark' ? 'light' : 'dark')}
            title={theme === 'dark' ? 'Cambiar a modo claro' : 'Cambiar a modo oscuro'}
            aria-label={theme === 'dark' ? 'Cambiar a modo claro' : 'Cambiar a modo oscuro'}
            style={{
              marginLeft: 4, width: 30, height: 30, borderRadius: 8, flexShrink: 0,
              background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.12)',
              color: 'var(--accent)', display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
            {theme === 'dark' ? <Sun size={15} /> : <Moon size={15} />}
          </button>
        </div>

        {/* Tabs */}
        <nav className="topbar-tabs" style={{ display: 'flex', height: 'var(--topbar-h)', flexShrink: 0 }}>
          {TABS.map(t => {
            const Icon = t.icon
            const active = tab === t.id
            return (
              <button
                key={t.id}
                onClick={() => setTab(t.id)}
                style={{
                  background: 'none', border: 'none',
                  color: active ? 'var(--accent)' : 'rgba(255,255,255,0.5)',
                  fontWeight: active ? 800 : 500,
                  fontSize: 12, padding: '0 12px',
                  display: 'flex', alignItems: 'center', gap: 5,
                  borderBottom: active ? '2.5px solid var(--accent)' : '2.5px solid transparent',
                  cursor: 'pointer', transition: 'color 0.15s', whiteSpace: 'nowrap'
                }}
              >
                <Icon size={15} />
                <span>{t.label}</span>
              </button>
            )
          })}
        </nav>
      </div>

      {/* Page content */}
      <div style={{ flex: 1 }}>
        {tab === 'dashboard'  && <DashboardPage  {...data} theme={theme} />}
        {tab === 'catalogo'   && <CatalogPage    {...data} />}
        {tab === 'gestion'    && <GestionPage    {...data} />}
        {tab === 'entradas'   && <EntradasPage   {...data} />}
        {tab === 'inventario' && <InventarioPage  {...data} />}
        {tab === 'ventas'     && <VentasPage productMap={data.productMap} sales={data.sales} loading={data.loading} />}
        {tab === 'contacto'   && <div style={{ padding: '20px var(--page-pad) 40px' }}><ContactSection /></div>}
      </div>
    </div>
  )
}
