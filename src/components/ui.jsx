import { useEffect, useState } from 'react'

// ── BADGE ──
export function Badge({ result }) {
  const styles = {
    pass: 'bg-pass/10 text-pass border border-pass/25',
    fail: 'bg-fail/10 text-fail border border-fail/25',
    pending: 'bg-accent4/10 text-accent4 border border-accent4/25',
  }
  const labels = { pass: '✓ Pass', fail: '✗ Fail', pending: '⏳ Pending' }
  return (
    <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-medium font-mono ${styles[result] || styles.pending}`}>
      {labels[result] || result}
    </span>
  )
}

// ── SCORE BAR ──
export function ScoreBar({ pct, color }) {
  const barColor = color || (pct >= 70 ? '#00d4aa' : '#ff6b6b')
  return (
    <div className="flex items-center gap-2.5">
      <div className="flex-1 h-1.5 bg-surface3 rounded-full overflow-hidden">
        <div className="h-full rounded-full score-bar-fill" style={{ width: `${pct}%`, background: barColor }} />
      </div>
      <span className="font-mono text-xs text-txt2 min-w-[35px] text-right">{pct}%</span>
    </div>
  )
}

// ── PANEL ──
export function Panel({ children, className = '' }) {
  return (
    <div className={`bg-surface border border-border rounded-xl overflow-hidden ${className}`}>
      {children}
    </div>
  )
}

export function PanelHeader({ title, action }) {
  return (
    <div className="px-5 py-4 border-b border-border flex items-center justify-between">
      <span className="font-syne font-bold text-sm">{title}</span>
      {action}
    </div>
  )
}

// ── BUTTON ──
export function Btn({ children, onClick, variant = 'primary', className = '', type = 'button' }) {
  const styles = {
    primary: 'bg-accent text-white hover:bg-[#7c74ff]',
    ghost: 'bg-surface2 text-txt2 border border-border hover:text-txt hover:bg-surface3',
    danger: 'bg-fail/10 text-fail border border-fail/20 hover:bg-fail/20',
  }
  return (
    <button
      type={type}
      onClick={onClick}
      className={`px-4 py-2 rounded-lg text-[13px] font-medium font-dm cursor-pointer border-none transition-all duration-150 ${styles[variant]} ${className}`}
    >
      {children}
    </button>
  )
}

// ── MODAL ──
export function Modal({ open, onClose, title, children, footer }) {
  useEffect(() => {
    const handler = (e) => { if (e.key === 'Escape') onClose() }
    if (open) document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [open, onClose])

  if (!open) return null
  return (
    <div
      className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 grid place-items-center"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="bg-surface border border-border rounded-2xl w-[640px] max-h-[85vh] overflow-y-auto shadow-2xl animate-modalIn">
        <div className="px-7 py-6 border-b border-border flex items-center justify-between">
          <span className="font-syne font-bold text-[17px]">{title}</span>
          <button onClick={onClose} className="w-8 h-8 rounded-lg bg-surface2 border border-border text-txt2 hover:text-txt hover:bg-surface3 grid place-items-center cursor-pointer text-base transition-all">✕</button>
        </div>
        <div className="px-7 py-6">{children}</div>
        {footer && <div className="px-7 pb-6 flex justify-end gap-2.5">{footer}</div>}
      </div>
    </div>
  )
}

// ── TOAST ──
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
        <div key={t.id} className={`px-4 py-3 rounded-lg text-[13px] font-medium bg-surface2 border shadow-2xl animate-toastIn max-w-[280px] ${t.type === 'error' ? 'border-fail text-fail' : 'border-pass text-pass'}`}>
          {t.msg}
        </div>
      ))}
    </div>
  )
}

// ── EMPTY STATE ──
export function EmptyState({ icon, title, sub }) {
  return (
    <div className="text-center py-12 text-txt3">
      <div className="text-4xl mb-3">{icon}</div>
      {title && <div className="font-syne font-bold text-base text-txt2 mb-1.5">{title}</div>}
      <div className="text-sm">{sub}</div>
    </div>
  )
}

// ── TAG ──
export function Tag({ children }) {
  return (
    <span className="inline-block px-2 py-0.5 rounded bg-surface3 border border-border text-txt3 font-mono text-[11px]">
      {children}
    </span>
  )
}

// ── FORM FIELD ──
export function Field({ label, children, full }) {
  return (
    <div className={`flex flex-col gap-1.5 ${full ? 'col-span-2' : ''}`}>
      <label className="text-[11px] font-mono tracking-[0.8px] uppercase text-txt3">{label}</label>
      {children}
    </div>
  )
}

// ── ATTR BAR ──
export function AttrBar({ name, pct, color }) {
  const c = color || (pct > 50 ? '#ff6b6b' : '#ffa94d')
  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex justify-between text-xs">
        <span className="text-txt2">{name}</span>
        <span className="font-mono text-txt3" style={{ color: c }}>{pct}%</span>
      </div>
      <div className="h-1.5 bg-surface3 rounded-full overflow-hidden">
        <div className="h-full rounded-full score-bar-fill" style={{ width: `${pct}%`, background: c }} />
      </div>
    </div>
  )
}
