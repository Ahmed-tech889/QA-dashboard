const NAV_ITEMS = [
  { id: 'dashboard', icon: '▣',  label: 'Dashboard',  section: 'Main' },
  { id: 'review',    icon: '◎',  label: 'Review Call', section: null },
  { id: 'calls',     icon: '≡',  label: 'Call Log',    section: null },
  { id: 'agents',    icon: '◈',  label: 'Agents',      section: 'Analytics' },
  { id: 'reports',   icon: '↗',  label: 'Reports',     section: null },
  { id: 'criteria',  icon: '⊞',  label: 'QA Criteria', section: 'Config' },
]

const STATUS_DOTS = {
  review:   '#16a34a',
  agents:   '#16a34a',
  reports:  '#d97706',
  calls:    '#a0b0cc',
  criteria: '#a0b0cc',
  dashboard:'#a0b0cc',
}

function QISLogo({ height }) {
  return (
    <div
      className="border-b border-border relative overflow-hidden flex items-center justify-center shrink-0"
      style={{ height, background: '#ffffff' }}
    >
      <div className="flex items-center gap-3">
        <div style={{
          width: 36, height: 36, borderRadius: 10, flexShrink: 0,
          background: 'linear-gradient(135deg,#4f8ef7,#2563eb)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <svg width="20" height="20" viewBox="0 0 30 30" fill="none" xmlns="http://www.w3.org/2000/svg">
            <circle cx="12" cy="12" r="7.5" stroke="white" strokeWidth="2.2"/>
            <line x1="17.8" y1="17.8" x2="24" y2="24" stroke="white" strokeWidth="2.4" strokeLinecap="round"/>
            <rect x="7.5" y="14" width="2.2" height="4" rx="0.6" fill="white"/>
            <rect x="11" y="11" width="2.2" height="7" rx="0.6" fill="white"/>
            <rect x="14.5" y="12.5" width="2.2" height="5.5" rx="0.6" fill="white"/>
          </svg>
        </div>
        <div>
          <div style={{
            fontFamily: "'Poppins',sans-serif", fontWeight: 700,
            fontSize: 17, color: '#1a2540', letterSpacing: 1,
          }}>QIS</div>
          <div style={{
            fontFamily: "'Poppins',sans-serif", fontWeight: 400,
            fontSize: 8, color: '#a0b0cc', letterSpacing: 1.5,
            textTransform: 'uppercase', marginTop: 1,
          }}>Intelligence System</div>
        </div>
      </div>
    </div>
  )
}

export default function Sidebar({ activePage, onNavigate, headerHeight }) {
  return (
    <aside className="fixed left-0 top-0 bottom-0 w-[220px] bg-surface border-r border-border flex flex-col z-[100]">
      <QISLogo height={headerHeight} />

      <nav className="flex-1 p-3 overflow-y-auto">
        {NAV_ITEMS.map((item) => {
          const isActive = activePage === item.id
          return (
            <div key={item.id}>
              {item.section && (
                <div className="text-[10px] font-semibold tracking-[1.5px] uppercase text-txt3 px-3 mt-4 mb-1.5"
                  style={{ fontFamily: "'Poppins',sans-serif" }}>
                  {item.section}
                </div>
              )}
              <button
                onClick={() => onNavigate(item.id)}
                className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl cursor-pointer text-[13px] mb-0.5 transition-all border text-left
                  ${isActive
                    ? 'bg-[#eff4ff] text-accent border-[#dce8ff] font-semibold'
                    : 'bg-transparent text-txt2 border-transparent hover:bg-surface2 hover:text-txt'
                  }`}
                style={{ fontFamily: "'Poppins',sans-serif" }}
              >
                <div
                  className="w-[7px] h-[7px] rounded-full shrink-0 transition-colors"
                  style={{ background: isActive ? '#2563eb' : STATUS_DOTS[item.id] }}
                />
                {item.label}
              </button>
            </div>
          )
        })}
      </nav>

      <div className="p-4 border-t border-border">
        <div className="flex items-center gap-2.5 px-3 py-2.5 bg-surface2 rounded-xl border border-border">
          <div className="w-8 h-8 rounded-full flex items-center justify-center text-[11px] font-bold shrink-0 text-white"
            style={{ background: 'linear-gradient(135deg,#6366f1,#8b5cf6)' }}>
            QA
          </div>
          <div>
            <div className="text-xs font-semibold text-txt">Reviewer</div>
            <div className="text-[10px] text-txt3" style={{ fontFamily: "'Poppins',sans-serif" }}>QA Analyst</div>
          </div>
        </div>
      </div>
    </aside>
  )
}
