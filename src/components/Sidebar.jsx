const NAV_ITEMS = [
  { id: 'dashboard', label: 'Dashboard',  section: 'Main',      dot: '#a0a0b0' },
  { id: 'review',    label: 'Review Call', section: null,        dot: '#16a34a' },
  { id: 'calls',     label: 'Call Log',    section: null,        dot: '#a0a0b0' },
  { id: 'agents',    label: 'Agents',      section: 'Analytics', dot: '#16a34a' },
  { id: 'reports',   label: 'Reports',     section: null,        dot: '#d97706' },
  { id: 'criteria',  label: 'QA Criteria', section: 'Config',    dot: '#a0a0b0' },
]

function QISLogo({ height }) {
  return (
    <div
      className="relative overflow-hidden flex items-center justify-center shrink-0"
      style={{ height, background: '#d8d8dc', borderBottom: '1px solid #c8c8ce' }}
    >
      <div className="flex items-center gap-3">
        <div style={{
          width: 34, height: 34, borderRadius: 9, flexShrink: 0,
          background: 'linear-gradient(135deg,#5b8af5,#2563eb)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <svg width="19" height="19" viewBox="0 0 30 30" fill="none">
            <circle cx="12" cy="12" r="7.5" stroke="white" strokeWidth="2.2"/>
            <line x1="17.8" y1="17.8" x2="24" y2="24" stroke="white" strokeWidth="2.4" strokeLinecap="round"/>
            <rect x="7.5" y="14" width="2.2" height="4" rx="0.6" fill="white"/>
            <rect x="11" y="11" width="2.2" height="7" rx="0.6" fill="white"/>
            <rect x="14.5" y="12.5" width="2.2" height="5.5" rx="0.6" fill="white"/>
          </svg>
        </div>
        <div>
          <div style={{ fontFamily: "'Poppins',sans-serif", fontWeight: 700, fontSize: 17, color: '#1a1a2e', letterSpacing: 0.5 }}>
            QIS
          </div>
          <div style={{ fontFamily: "'Poppins',sans-serif", fontWeight: 400, fontSize: 7, color: '#787890', letterSpacing: 1.2, textTransform: 'uppercase', marginTop: 1, whiteSpace: 'nowrap' }}>
            Quality Intelligence System
          </div>
        </div>
      </div>
    </div>
  )
}

export default function Sidebar({ activePage, onNavigate, headerHeight, alertCount, criticalCount, onOpenAlerts }) {
  return (
    <aside className="fixed left-0 top-0 bottom-0 w-[220px] flex flex-col z-[100]"
      style={{ background: '#d8d8dc', borderRight: '1px solid #c8c8ce' }}>
      <QISLogo height={headerHeight} />

      <nav className="flex-1 p-3 overflow-y-auto">
        {NAV_ITEMS.map((item) => {
          const isActive = activePage === item.id
          const showBadge = item.id === 'agents' && alertCount > 0
          return (
            <div key={item.id}>
              {item.section && (
                <div className="text-[10px] font-semibold tracking-[1.5px] uppercase px-3 mt-4 mb-1.5"
                  style={{ color: '#8888a0', fontFamily: "'Poppins',sans-serif" }}>
                  {item.section}
                </div>
              )}
              <button
                onClick={() => onNavigate(item.id)}
                className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl cursor-pointer text-[13px] mb-0.5 transition-all text-left border"
                style={{
                  fontFamily:  "'Poppins',sans-serif",
                  background:  isActive ? '#f5f5f8' : 'transparent',
                  color:       isActive ? '#2563eb'  : '#505060',
                  borderColor: isActive ? '#c8d4f0'  : 'transparent',
                  fontWeight:  isActive ? 600 : 400,
                  boxShadow:   isActive ? '0 1px 4px rgba(0,0,0,0.08)' : 'none',
                }}
              >
                <div className="w-[7px] h-[7px] rounded-full shrink-0"
                  style={{ background: isActive ? '#2563eb' : item.dot }} />
                <span className="flex-1">{item.label}</span>
                {showBadge && (
                  <span
                    className="text-[10px] font-bold px-1.5 py-0.5 rounded-full text-white shrink-0"
                    style={{ background: criticalCount > 0 ? '#e11d48' : '#d97706', fontFamily: "'Poppins',sans-serif" }}>
                    {alertCount}
                  </span>
                )}
              </button>
            </div>
          )
        })}

        {/* Alerts button in sidebar */}
        {alertCount > 0 && (
          <div style={{ marginTop: 12 }}>
            <div className="text-[10px] font-semibold tracking-[1.5px] uppercase px-3 mb-1.5"
              style={{ color: '#8888a0', fontFamily: "'Poppins',sans-serif" }}>
              Alerts
            </div>
            <button
              onClick={onOpenAlerts}
              className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl cursor-pointer text-[13px] mb-0.5 transition-all text-left border hover:opacity-80"
              style={{
                fontFamily:  "'Poppins',sans-serif",
                background:  criticalCount > 0 ? '#fde8ec' : '#fef3d8',
                color:       criticalCount > 0 ? '#e11d48'  : '#d97706',
                borderColor: criticalCount > 0 ? '#f8c0cc'  : '#f8dca0',
                fontWeight:  600,
              }}
            >
              <div className="w-[7px] h-[7px] rounded-full shrink-0 animate-pulse"
                style={{ background: criticalCount > 0 ? '#e11d48' : '#d97706' }} />
              <span className="flex-1">
                {criticalCount > 0 ? `${criticalCount} Critical` : `${alertCount} Warning${alertCount > 1 ? 's' : ''}`}
              </span>
              <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full text-white shrink-0"
                style={{ background: criticalCount > 0 ? '#e11d48' : '#d97706' }}>
                {alertCount}
              </span>
            </button>
          </div>
        )}
      </nav>

      <div className="p-4" style={{ borderTop: '1px solid #c8c8ce' }}>
        <div className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl"
          style={{ background: '#ccccd2', border: '1px solid #b8b8c0' }}>
          <div className="w-8 h-8 rounded-full flex items-center justify-center text-[11px] font-bold shrink-0 text-white"
            style={{ background: 'linear-gradient(135deg,#6366f1,#8b5cf6)' }}>
            QA
          </div>
          <div>
            <div className="text-xs font-semibold text-txt">Reviewer</div>
            <div className="text-[10px]" style={{ color: '#787890', fontFamily: "'Poppins',sans-serif" }}>QA Analyst</div>
          </div>
        </div>
      </div>
    </aside>
  )
}
