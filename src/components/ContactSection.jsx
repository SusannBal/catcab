import { useEffect, useState } from 'react'
import {
  MessageSquare, Send, AlertTriangle, CheckCircle2, Bug, Frown, Lightbulb, HelpCircle,
  MoreHorizontal, RotateCcw, Trash2, Check,
} from 'lucide-react'
import { supabase } from '../lib/supabase'
import { Btn, Field, Input, Textarea, Select } from './UI'

// Sección "Contáctanos": quejas, errores, sugerencias. Se guarda en la tabla "reportes".

const TIPOS = [
  { id: 'Error',      label: 'Error / bug', icon: Bug,            color: '#e5534b' },
  { id: 'Queja',      label: 'Queja',       icon: Frown,          color: '#e08a1e' },
  { id: 'Sugerencia', label: 'Sugerencia',  icon: Lightbulb,      color: '#27ae60' },
  { id: 'Pregunta',   label: 'Pregunta',    icon: HelpCircle,     color: '#1a85c2' },
  { id: 'Otro',       label: 'Otro',        icon: MoreHorizontal, color: '#8c8c8c' },
]
const TIPO_MAP  = Object.fromEntries(TIPOS.map(t => [t.id, t]))
const SECCIONES = ['Dashboard', 'Catálogo', 'Gestión', 'Entradas', 'Inventario', 'Ventas', 'General']
const FIELDS    = 'id,tipo,seccion,asunto,mensaje,nombre,contacto,estado,created_at'
const EMPTY     = { tipo: 'Error', seccion: '', asunto: '', mensaje: '', nombre: '', contacto: '' }

const card = {
  background: 'var(--surface)', border: '1.5px solid var(--gray-100)',
  borderRadius: 'var(--radius-md)', boxShadow: 'var(--shadow)', minWidth: 0,
}

export default function ContactSection() {
  const [form, setForm]       = useState(EMPTY)
  const [sending, setSending] = useState(false)
  const [notice, setNotice]   = useState(null) // { type, text }
  const [reportes, setReportes] = useState([])
  const [available, setAvailable] = useState(true) // false si falta la tabla
  const [loaded, setLoaded]   = useState(false)
  const [filtro, setFiltro]   = useState('pendiente')

  useEffect(() => {
    supabase.from('reportes').select(FIELDS).order('created_at', { ascending: false })
      .then(({ data, error }) => {
        if (error) setAvailable(false)
        else setReportes(data || [])
        setLoaded(true)
      })
  }, [])

  const set = k => e => setForm(f => ({ ...f, [k]: e.target.value }))

  function flash(text, type = 'success') {
    setNotice({ text, type })
    setTimeout(() => setNotice(null), 4000)
  }

  async function handleSubmit(e) {
    e.preventDefault()
    if (!form.asunto.trim() || !form.mensaje.trim()) return
    setSending(true)
    try {
      const payload = {
        tipo: form.tipo, seccion: form.seccion || null,
        asunto: form.asunto.trim(), mensaje: form.mensaje.trim(),
        nombre: form.nombre.trim() || null, contacto: form.contacto.trim() || null,
      }
      const { data, error } = await supabase.from('reportes').insert([payload]).select(FIELDS).single()
      if (error) throw error
      setReportes(prev => [data, ...prev])
      setForm(f => ({ ...EMPTY, nombre: f.nombre, contacto: f.contacto }))
      setFiltro('pendiente')
      flash('Mensaje enviado. Gracias por avisar.')
    } catch (err) {
      flash('No se pudo enviar: ' + err.message, 'error')
    } finally { setSending(false) }
  }

  async function setEstado(r, estado) {
    const { error } = await supabase.from('reportes').update({ estado }).eq('id', r.id)
    if (error) return flash('No se pudo actualizar: ' + error.message, 'error')
    setReportes(prev => prev.map(x => x.id === r.id ? { ...x, estado } : x))
  }

  async function remove(r) {
    if (!window.confirm(`¿Eliminar el mensaje "${r.asunto}"?`)) return
    const { error } = await supabase.from('reportes').delete().eq('id', r.id)
    if (error) return flash('No se pudo eliminar: ' + error.message, 'error')
    setReportes(prev => prev.filter(x => x.id !== r.id))
  }

  const pendientes = reportes.filter(r => r.estado !== 'resuelto')
  const resueltos  = reportes.filter(r => r.estado === 'resuelto')
  const lista      = filtro === 'pendiente' ? pendientes : resueltos

  return (
    <section>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
        <MessageSquare size={20} style={{ color: 'var(--accent)' }} />
        <h2 style={{ fontSize: 18, fontWeight: 900 }}>Contáctanos</h2>
      </div>
      <p style={{ fontSize: 12, color: 'var(--gray-500)', marginBottom: 16 }}>
        ¿Algo no funciona, tienes una queja o una idea? Cuéntanos y lo revisamos.
      </p>

      {!available && loaded && (
        <div style={{
          display: 'flex', gap: 10, alignItems: 'flex-start', padding: '12px 16px', marginBottom: 16,
          background: 'var(--tint-warn)', border: '1.5px solid var(--tint-warn-border)', color: 'var(--tint-warn-text)',
          borderRadius: 'var(--radius-sm)', fontSize: 12, lineHeight: 1.5,
        }}>
          <AlertTriangle size={16} style={{ flexShrink: 0, marginTop: 1 }} />
          <span>Para activar este formulario, ejecuta <strong>migration-reportes.sql</strong> en el SQL Editor de Supabase y recarga la página.</span>
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(340px, 100%), 1fr))', gap: 20, alignItems: 'start' }}>
        {/* ── Formulario ── */}
        <form onSubmit={handleSubmit} style={{ ...card, padding: 20, display: 'flex', flexDirection: 'column', gap: 14 }}>
          <Field label="¿Qué quieres reportar?">
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
              {TIPOS.map(t => {
                const Icon = t.icon
                const active = form.tipo === t.id
                return (
                  <button key={t.id} type="button" onClick={() => setForm(f => ({ ...f, tipo: t.id }))} style={{
                    display: 'inline-flex', alignItems: 'center', gap: 5, padding: '7px 12px', borderRadius: 99,
                    fontSize: 12, fontWeight: 800,
                    border: active ? `1.5px solid ${t.color}` : '1.5px solid var(--gray-200)',
                    background: active ? `${t.color}1f` : 'var(--surface)',
                    color: active ? t.color : 'var(--gray-600)',
                  }}><Icon size={13} /> {t.label}</button>
                )
              })}
            </div>
          </Field>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: 12 }}>
            <Field label="¿Dónde pasó?">
              <Select value={form.seccion} onChange={set('seccion')}>
                <option value="">Elegir sección</option>
                {SECCIONES.map(s => <option key={s}>{s}</option>)}
              </Select>
            </Field>
            <Field label="Asunto *">
              <Input value={form.asunto} onChange={set('asunto')} maxLength={120}
                placeholder={form.tipo === 'Error' ? 'Ej: No carga el PDF' : 'Resumen corto'} />
            </Field>
          </div>

          <Field label="Mensaje *">
            <Textarea rows={5} value={form.mensaje} onChange={set('mensaje')} maxLength={2000}
              placeholder={form.tipo === 'Error'
                ? 'Qué estabas haciendo, qué esperabas que pasara y qué pasó en cambio.'
                : 'Cuéntanos con detalle.'} />
          </Field>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: 12 }}>
            <Field label="Tu nombre (opcional)">
              <Input value={form.nombre} onChange={set('nombre')} placeholder="Ej: F" />
            </Field>
            <Field label="Teléfono o correo (opcional)">
              <Input value={form.contacto} onChange={set('contacto')} placeholder="Para responderte" />
            </Field>
          </div>

          {notice && (
            <div style={{
              display: 'flex', alignItems: 'center', gap: 8, padding: '10px 14px', borderRadius: 'var(--radius-sm)',
              fontSize: 12, fontWeight: 700,
              background: notice.type === 'error' ? 'var(--tint-danger)' : 'var(--tint-success)',
              color: notice.type === 'error' ? 'var(--danger)' : 'var(--success)',
              border: `1.5px solid ${notice.type === 'error' ? 'var(--tint-danger-border)' : 'var(--tint-success-border)'}`,
            }}>
              {notice.type === 'error' ? <AlertTriangle size={14} /> : <CheckCircle2 size={14} />} {notice.text}
            </div>
          )}

          <Btn variant="primary" type="submit"
            disabled={sending || !available || !form.asunto.trim() || !form.mensaje.trim()}
            style={{ justifyContent: 'center', padding: '11px 18px', opacity: (!available || !form.asunto.trim() || !form.mensaje.trim()) ? 0.5 : 1 }}>
            <Send size={14} /> {sending ? 'Enviando...' : 'Enviar mensaje'}
          </Btn>
        </form>

        {/* ── Mensajes enviados ── */}
        <div style={{ ...card, overflow: 'hidden' }}>
          <div style={{ padding: '16px 18px', borderBottom: '1px solid var(--gray-100)', display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
            <h3 style={{ fontSize: 15, fontWeight: 900, flex: '1 1 auto' }}>Mensajes enviados</h3>
            <div style={{ display: 'inline-flex', gap: 3, padding: 3, background: 'var(--gray-100)', borderRadius: 8 }}>
              {[['pendiente', `Pendientes (${pendientes.length})`], ['resuelto', `Resueltos (${resueltos.length})`]].map(([id, label]) => (
                <button key={id} onClick={() => setFiltro(id)} style={{
                  border: 'none', borderRadius: 6, padding: '6px 10px', fontSize: 11, fontWeight: 800,
                  background: filtro === id ? 'var(--surface)' : 'transparent',
                  color: filtro === id ? 'var(--text)' : 'var(--gray-600)',
                  boxShadow: filtro === id ? 'var(--shadow)' : 'none',
                }}>{label}</button>
              ))}
            </div>
          </div>

          {lista.length === 0 ? (
            <p style={{ padding: 24, textAlign: 'center', color: 'var(--gray-400)', fontSize: 13 }}>
              {!loaded ? 'Cargando...' : filtro === 'pendiente' ? 'No hay mensajes pendientes.' : 'Aún no hay mensajes resueltos.'}
            </p>
          ) : lista.map(r => {
            const t = TIPO_MAP[r.tipo] || TIPO_MAP.Otro
            const Icon = t.icon
            const done = r.estado === 'resuelto'
            return (
              <div key={r.id} style={{ padding: '14px 18px', borderBottom: '1px solid var(--gray-100)', opacity: done ? 0.75 : 1 }}>
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
                  <div style={{
                    width: 34, height: 34, borderRadius: 9, flexShrink: 0, background: `${t.color}1f`, color: t.color,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}><Icon size={16} /></div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                      <span style={{ fontSize: 10, fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.06em', color: t.color }}>{t.label}</span>
                      {r.seccion && <span style={{ fontSize: 10, fontWeight: 700, color: 'var(--gray-500)' }}>· {r.seccion}</span>}
                    </div>
                    <p style={{ fontSize: 14, fontWeight: 800, marginTop: 2, textDecoration: done ? 'line-through' : 'none' }}>{r.asunto}</p>
                    <p style={{ fontSize: 12, color: 'var(--gray-600)', marginTop: 4, lineHeight: 1.5, whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>{r.mensaje}</p>
                    <p style={{ fontSize: 10, color: 'var(--gray-400)', marginTop: 6 }}>
                      {new Date(r.created_at).toLocaleString('es', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}
                      {r.nombre && <> · {r.nombre}</>}
                      {r.contacto && <> · {r.contacto}</>}
                    </p>
                  </div>
                  <div style={{ display: 'flex', gap: 4, flexShrink: 0 }}>
                    <button title={done ? 'Volver a pendiente' : 'Marcar como resuelto'} onClick={() => setEstado(r, done ? 'pendiente' : 'resuelto')}
                      style={{ ...iconBtn, color: done ? 'var(--gray-600)' : 'var(--success)' }}>
                      {done ? <RotateCcw size={13} /> : <Check size={14} />}
                    </button>
                    <button title="Eliminar" onClick={() => remove(r)} style={{ ...iconBtn, color: 'var(--danger)' }}><Trash2 size={13} /></button>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </section>
  )
}

const iconBtn = {
  width: 30, height: 30, borderRadius: 'var(--radius-sm)', border: '1.5px solid var(--gray-200)',
  background: 'var(--surface)', display: 'flex', alignItems: 'center', justifyContent: 'center',
}
