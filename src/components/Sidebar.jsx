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
          <svg width="19" height="19" viewBox="0 0 30 30" fill="none" xmlns="http://www.w3.org/2000/svg">
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
          <div style={{ fontFamily: "'Poppins',sans-serif", fontWeight: 400, fontSize: 8, color: '#787890', letterSpacing: 1.5, textTransform: 'uppercase', marginTop: 1 }}>
            Intelligence System
          </div>
        </div>
      </div>
    </div>
  )
}

export default function Sidebar({ activePage, onNavigate, headerHeight }) {
  return (
    <aside className="fixed left-0 top-0 bottom-0 w-[220px] flex flex-col z-[100]"
      style={{ background: '#d8d8dc', borderRight: '1px solid #c8c8ce' }}>
      <QISLogo height={headerHeight} />

      <nav className="flex-1 p-3 overflow-y-auto">
        {NAV_ITEMS.map((item) => {
          const isActive = activePage === item.id
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
                  fontFamily: "'Poppins',sans-serif",
                  background:   isActive ? '#f5f5f8' : 'transparent',
                  color:        isActive ? '#2563eb'  : '#505060',
                  borderColor:  isActive ? '#c8d4f0'  : 'transparent',
                  fontWeight:   isActive ? 600 : 400,
                  boxShadow:    isActive ? '0 1px 4px rgba(0,0,0,0.08)' : 'none',
                }}
              >
                <div className="w-[7px] h-[7px] rounded-full shrink-0"
                  style={{ background: isActive ? '#2563eb' : item.dot }} />
                {item.label}
              </button>
            </div>
          )
        })}
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
