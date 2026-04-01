import { useEffect, useState } from 'react'

const AGENT_GRADIENTS = [
  'linear-gradient(135deg,#6366f1,#8b5cf6)',
  'linear-gradient(135deg,#0ea5e9,#2563eb)',
  'linear-gradient(135deg,#f59e0b,#ef4444)',
  'linear-gradient(135deg,#10b981,#0ea5e9)',
  'linear-gradient(135deg,#ec4899,#8b5cf6)',
  'linear-gradient(135deg,#f97316,#eab308)',
]

export function agentGradient(name = '') {
  const idx = [...name].reduce((a, c) => a + c.charCodeAt(0), 0) % AGENT_GRADIENTS.length
  return AGENT_GRADIENTS[idx]
}

export function AgentAvatar({ name = '', size = 32 }) {
  const initials = name.split(' ').map((w) => w[0]).join('').toUpperCase().slice(0, 2)
  return (
    <div style={{
      width: size, height: size, borderRadius: '50%',
      background: agentGradient(name),
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontSize: Math.round(size * 0.33), fontWeight: 700, color: '#fff',
      flexShrink: 0, fontFamily: "'Poppins',sans-serif",
    }}>{initials || '?'}</div>
  )
}

export function Badge({ result }) {
  const cfg = {
    pass:    { bg: '#e6f9ee', color: '#16a34a', border: '#a8ecc0', label: '✓ Pass' },
    fail:    { bg: '#fde8ec', color: '#e11d48', border: '#f8c0cc', label: '✗ Fail' },
    pending: { bg: '#fef3d8', color: '#d97706', border: '#f8dca0', label: '⏳ Pending' },
    na:      { bg: '#ebebee', color: '#8888a0', border: '#d0d0d6', label: '— N/A' },
  }
  const c = cfg[result] || cfg.pending
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 4,
      padding: '2px 10px', borderRadius: 99,
      fontSize: 11, fontWeight: 600, fontFamily: "'Poppins',sans-serif",
      background: c.bg, color: c.color, border: `1px solid ${c.border}`,
    }}>{c.label}</span>
  )
}

export function ScoreBar({ pct, color }) {
  const barColor = color || (pct >= 70 ? '#16a34a' : '#e11d48')
  return (
    <div className="flex items-center gap-2.5">
      <div className="flex-1 h-1.5 rounded-full overflow-hidden" style={{ background: '#dcdce0' }}>
        <div className="h-full rounded-full score-bar-fill" style={{ width: `${pct}%`, background: barColor }} />
      </div>
      <span className="font-mono text-xs min-w-[35px] text-right" style={{ color: barColor }}>{pct}%</span>
    </div>
  )
}

export function Panel({ children, className = '' }) {
  return (
    <div className={`rounded-2xl overflow-hidden ${className}`}
      style={{ background: '#f5f5f8', border: '1px solid #d0d0d6', boxShadow: '0 1px 4px rgba(0,0,0,0.05)' }}>
      {children}
    </div>
  )
}

export function PanelHeader({ title, action }) {
  return (
    <div className="px-5 py-4 flex items-center justify-between"
      style={{ borderBottom: '1px solid #dcdce0', background: '#efeff2' }}>
      <span className="font-semibold text-sm text-txt" style={{ fontFamily: "'Poppins',sans-serif" }}>{title}</span>
      {action}
    </div>
  )
}

export function Btn({ children, onClick, variant = 'primary', className = '', type = 'button' }) {
  const base = {
    fontFamily: "'Poppins',sans-serif",
    fontSize: 13, fontWeight: 600,
    borderRadius: 9, cursor: 'pointer',
    padding: '8px 16px', border: 'none',
    transition: 'opacity 0.15s, transform 0.1s',
  }
  const variants = {
    primary: { ...base, background: '#2563eb', color: '#fff' },
    ghost:   { ...base, background: '#ccccd2', color: '#505060', border: '1px solid #b8b8c0' },
    danger:  { ...base, background: '#fde8ec', color: '#e11d48', border: '1px solid #f8c0cc' },
  }
  return (
    <button
      type={type}
      onClick={onClick}
      className={`hover:opacity-90 active:scale-[0.98] ${className}`}
      style={variants[variant]}
    >
      {children}
    </button>
  )
}

export function Modal({ open, onClose, title, children, footer }) {
  useEffect(() => {
    const handler = (e) => { if (e.key === 'Escape') onClose() }
    if (open) document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [open, onClose])

  if (!open) return null
  return (
    <div
      className="fixed inset-0 z-50 grid place-items-center"
      style={{ background: 'rgba(26,26,46,0.35)', backdropFilter: 'blur(4px)' }}
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="w-[640px] max-h-[85vh] overflow-y-auto animate-modalIn rounded-2xl"
        style={{ background: '#f5f5f8', border: '1px solid #d0d0d6', boxShadow: '0 20px 60px rgba(0,0,0,0.14)' }}>
        <div className="px-7 py-5 flex items-center justify-between"
          style={{ borderBottom: '1px solid #dcdce0', background: '#efeff2' }}>
          <span className="font-bold text-[16px] text-txt" style={{ fontFamily: "'Poppins',sans-serif" }}>{title}</span>
          <button onClick={onClose}
            className="w-8 h-8 rounded-lg flex items-center justify-center cursor-pointer text-sm transition-all"
            style={{ background: '#e2e2e6', border: '1px solid #d0d0d6', color: '#505060' }}>
            ✕
          </button>
        </div>
        <div className="px-7 py-6">{children}</div>
        {footer && <div className="px-7 pb-6 flex justify-end gap-2.5">{footer}</div>}
      </div>
    </div>
  )
}

let toastId = 0
const toastListeners = []
export function emitToast(msg, type = 'success') {
  const id = toastId++
  toastListeners.forEach((fn) => fn({ id, msg, type }))
}

export function ToastContainer() {
  const [toasts, setToasts] = useState([])
  useEffect(() => {
    const fn = (t) => {
      setToasts((prev) => [...prev, t])
      setTimeout(() => setToasts((prev) => prev.filter((x) => x.id !== t.id)), 3000)
    }
    toastListeners.push(fn)
    return () => { const i = toastListeners.indexOf(fn); if (i > -1) toastListeners.splice(i, 1) }
  }, [])

  return (
    <div className="fixed bottom-6 right-6 flex flex-col gap-2 z-[999]">
      {toasts.map((t) => (
        <div key={t.id} className="px-4 py-3 rounded-xl text-[13px] font-semibold animate-toastIn max-w-[300px]"
          style={{
            background: '#f5f5f8',
            border: `1px solid ${t.type === 'error' ? '#f8c0cc' : '#a8ecc0'}`,
            color: t.type === 'error' ? '#e11d48' : '#16a34a',
            boxShadow: '0 8px 24px rgba(0,0,0,0.10)',
            fontFamily: "'Poppins',sans-serif",
          }}>
          {t.msg}
        </div>
      ))}
    </div>
  )
}

export function EmptyState({ icon, title, sub }) {
  return (
    <div className="text-center py-12" style={{ color: '#8888a0' }}>
      <div className="text-4xl mb-3">{icon}</div>
      {title && <div className="font-semibold text-base mb-1.5" style={{ color: '#505060', fontFamily: "'Poppins',sans-serif" }}>{title}</div>}
      <div className="text-sm">{sub}</div>
    </div>
  )
}

export function Tag({ children }) {
  return (
    <span className="inline-block px-2 py-0.5 rounded-lg text-[11px] font-medium"
      style={{ background: '#e2e2e6', color: '#505060', border: '1px solid #c8c8ce', fontFamily: "'Poppins',sans-serif" }}>
      {children}
    </span>
  )
}

export function Field({ label, children, full }) {
  return (
    <div className={`flex flex-col gap-1.5 ${full ? 'col-span-2' : ''}`}>
      <label className="text-[11px] font-semibold tracking-[0.6px] uppercase"
        style={{ color: '#8888a0', fontFamily: "'Poppins',sans-serif" }}>{label}</label>
      {children}
    </div>
  )
}

export function AttrBar({ name, pct, color }) {
  const c = color || (pct > 50 ? '#e11d48' : '#d97706')
  return (
    <div className="flex flex-col gap-1.5 flex-1">
      <div className="flex justify-between text-xs">
        <span className="font-medium" style={{ color: '#505060' }}>{name}</span>
        <span className="font-semibold" style={{ color: c }}>{pct}%</span>
      </div>
      <div className="h-1.5 rounded-full overflow-hidden" style={{ background: '#dcdce0' }}>
        <div className="h-full rounded-full score-bar-fill" style={{ width: `${pct}%`, background: c }} />
      </div>
    </div>
  )
}
