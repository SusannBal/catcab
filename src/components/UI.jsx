import { useEffect } from 'react'

// ─── Shared tiny UI primitives ───────────────────────────────

export function Label({ children }) {
  return (
    <span style={{
      display: 'block', fontSize: 10, fontWeight: 700,
      textTransform: 'uppercase', letterSpacing: '0.06em',
      color: 'var(--gray-600)', marginBottom: 5,
    }}>{children}</span>
  )
}

export function Input({ style, ...props }) {
  return (
    <input
      style={{
        width: '100%', padding: '8px 11px',
        border: '1.5px solid var(--gray-200)', borderRadius: 'var(--radius-sm)',
        fontSize: 13, outline: 'none', color: 'var(--black)',
        background: 'var(--white)',
        ...style,
      }}
      {...props}
    />
  )
}

export function Textarea({ style, ...props }) {
  return (
    <textarea
      style={{
        width: '100%', padding: '8px 11px',
        border: '1.5px solid var(--gray-200)', borderRadius: 'var(--radius-sm)',
        fontSize: 13, outline: 'none', color: 'var(--black)',
        background: 'var(--white)', resize: 'vertical',
        ...style,
      }}
      {...props}
    />
  )
}

export function Select({ children, style, ...props }) {
  return (
    <select
      style={{
        width: '100%', padding: '8px 11px',
        border: '1.5px solid var(--gray-200)', borderRadius: 'var(--radius-sm)',
        fontSize: 13, outline: 'none', color: 'var(--black)',
        background: 'var(--white)',
        ...style,
      }}
      {...props}
    >
      {children}
    </select>
  )
}

export function Btn({ variant = 'primary', style, children, ...props }) {
  const base = {
    border: 'none', borderRadius: 'var(--radius-sm)',
    padding: '8px 18px', fontWeight: 700, fontSize: 13,
    display: 'inline-flex', alignItems: 'center', gap: 6,
    cursor: 'pointer', transition: 'opacity 0.15s',
  }
  const variants = {
    primary:   { background: 'var(--accent)',   color: 'var(--black)' },
    dark:      { background: 'var(--black)',     color: 'var(--white)' },
    ghost:     { background: 'transparent', color: 'var(--gray-600)', border: '1.5px solid var(--gray-200)' },
    danger:    { background: 'var(--danger)',    color: 'var(--white)' },
    success:   { background: 'var(--success)',   color: 'var(--white)' },
  }
  return (
    <button style={{ ...base, ...variants[variant], ...style }} {...props}>
      {children}
    </button>
  )
}

export function Modal({ onClose, title, children, footer, width = 520 }) {
  // Cerrar con Escape
  useEffect(() => {
    const handler = (e) => { if (e.key === 'Escape') onClose() }
    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [onClose])

  return (
    <div
      onClick={(e) => e.target === e.currentTarget && onClose()}
      style={{
        position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.55)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        zIndex: 1000, padding: 16,
      }}
    >
      <div style={{
        background: 'var(--white)', borderRadius: 'var(--radius-lg)',
        width: '100%', maxWidth: width, maxHeight: '92vh',
        display: 'flex', flexDirection: 'column',
        animation: 'fadeIn 0.18s ease',
      }}>
        {/* header */}
        <div style={{
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          padding: '16px 20px', borderBottom: '1px solid var(--gray-100)',
          flexShrink: 0,
        }}>
          <h2 style={{ fontSize: 15, fontWeight: 800 }}>{title}</h2>
          <button
            onClick={onClose}
            style={{ background: 'none', border: 'none', fontSize: 20, color: 'var(--gray-400)', lineHeight: 1, cursor: 'pointer' }}
          >×</button>
        </div>
        {/* body */}
        <div style={{ padding: 20, overflowY: 'auto', flex: 1 }}>
          {children}
        </div>
        {/* footer */}
        {footer && (
          <div style={{
            padding: '14px 20px', borderTop: '1px solid var(--gray-100)',
            display: 'flex', gap: 8, justifyContent: 'flex-end', flexShrink: 0,
          }}>
            {footer}
          </div>
        )}
      </div>
    </div>
  )
}

export function Field({ label, children }) {
  return (
    <div>
      <Label>{label}</Label>
      {children}
    </div>
  )
}

export function Row({ children, gap = 12 }) {
  return <div style={{ display: 'flex', gap, flexWrap: 'wrap' }}>{children}</div>
}

export function Spinner() {
  return (
    <div style={{ textAlign: 'center', padding: '60px 20px', color: 'var(--gray-400)' }}>
      <div style={{
        width: 32, height: 32, border: '3px solid var(--gray-200)',
        borderTopColor: 'var(--black)', borderRadius: '50%',
        animation: 'spin 0.8s linear infinite', margin: '0 auto 12px',
      }} />
      <p style={{ fontSize: 13 }}>Cargando...</p>
    </div>
  )
}

export function Badge({ children, color = 'var(--black)' }) {
  return (
    <span style={{
      background: color, color: color === 'var(--accent)' ? 'var(--black)' : 'var(--white)',
      fontSize: 10, fontWeight: 800, letterSpacing: '0.06em',
      textTransform: 'uppercase', padding: '2px 8px', borderRadius: 4,
    }}>{children}</span>
  )
}
