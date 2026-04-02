import { useState } from 'react'

const LEVEL_STYLES = {
  critical: { bg: '#fde8ec', border: '#f8c0cc', color: '#e11d48', dot: '#e11d48', icon: '🔴' },
  warning:  { bg: '#fef3d8', border: '#f8dca0', color: '#d97706', dot: '#d97706', icon: '🟡' },
}

export default function AlertsPanel({ alerts, onNavigateAgents, open, onClose }) {
  if (!open) return null

  return (
    <div
      className="fixed inset-0 z-[55] grid place-items-center"
      style={{ background: 'rgba(26,26,46,0.35)', backdropFilter: 'blur(4px)' }}
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="w-[480px] max-h-[80vh] overflow-y-auto rounded-2xl animate-modalIn"
        style={{ background: '#f5f5f8', border: '1px solid #d0d0d6', boxShadow: '0 20px 60px rgba(0,0,0,0.14)' }}>

        {/* Header */}
        <div className="px-6 py-4 flex items-center justify-between"
          style={{ borderBottom: '1px solid #dcdce0', background: '#efeff2', borderRadius: '16px 16px 0 0' }}>
          <div className="flex items-center gap-2.5">
            <span className="font-bold text-[15px]" style={{ color: '#1a1a2e', fontFamily: "'Poppins',sans-serif" }}>
              Performance Alerts
            </span>
            <span className="px-2 py-0.5 rounded-full text-[11px] font-bold text-white"
              style={{ background: alerts.some((a) => a.level === 'critical') ? '#e11d48' : '#d97706', fontFamily: "'Poppins',sans-serif" }}>
              {alerts.length}
            </span>
          </div>
          <button onClick={onClose}
            className="w-8 h-8 rounded-lg flex items-center justify-center cursor-pointer text-sm"
            style={{ background: '#e2e2e6', border: '1px solid #d0d0d6', color: '#505060' }}>
            ✕
          </button>
        </div>

        <div className="px-6 py-5 flex flex-col gap-3">
          {alerts.length === 0 ? (
            <div className="text-center py-10 text-[13px]" style={{ color: '#8888a0', fontFamily: "'Poppins',sans-serif" }}>
              No alerts — all agents are performing well!
            </div>
          ) : (
            alerts.map((alert, i) => {
              const s = LEVEL_STYLES[alert.level] || LEVEL_STYLES.warning
              return (
                <div key={i} className="flex gap-3 px-4 py-3.5 rounded-xl"
                  style={{ background: s.bg, border: `1px solid ${s.border}` }}>
                  <div className="w-2 h-2 rounded-full mt-1.5 shrink-0" style={{ background: s.dot }} />
                  <div className="flex-1 min-w-0">
                    <div className="text-[12px] font-semibold mb-1" style={{ color: s.color, fontFamily: "'Poppins',sans-serif" }}>
                      {alert.type === 'consecutive_fails' ? 'Consecutive Failures'
                        : alert.type === 'low_pass_rate'  ? 'Low Pass Rate'
                        : 'Weekly Drop'}
                    </div>
                    <div className="text-[12px] leading-relaxed" style={{ color: '#505060', fontFamily: "'Poppins',sans-serif" }}>
                      {alert.message}
                    </div>
                  </div>
                  <button
                    onClick={() => { onNavigateAgents(); onClose() }}
                    className="text-[11px] font-semibold px-3 py-1.5 rounded-lg cursor-pointer transition-all hover:opacity-80 shrink-0 self-start"
                    style={{ background: '#ffffff', border: `1px solid ${s.border}`, color: s.color, fontFamily: "'Poppins',sans-serif" }}>
                    View →
                  </button>
                </div>
              )
            })
          )}
        </div>

        <div className="px-6 pb-5 flex justify-end">
          <button onClick={onClose}
            className="px-5 py-2 rounded-xl text-[13px] font-semibold cursor-pointer hover:opacity-80"
            style={{ background: '#dcdce0', border: '1px solid #c8c8ce', color: '#505060', fontFamily: "'Poppins',sans-serif" }}>
            Close
          </button>
        </div>
      </div>
    </div>
  )
}
