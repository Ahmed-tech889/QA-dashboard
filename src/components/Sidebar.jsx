const NAV_ITEMS = [
  { id: 'dashboard', icon: '📊', label: 'Dashboard', section: 'Main' },
  { id: 'review', icon: '🎧', label: 'Review Call', section: null },
  { id: 'calls', icon: '📁', label: 'Call Log', section: null },
  { id: 'agents', icon: '👥', label: 'Agents', section: 'Analytics' },
  { id: 'reports', icon: '📈', label: 'Reports', section: null },
  { id: 'criteria', icon: '⚙️', label: 'QA Criteria', section: 'Config' },
]

function QISLogo() {
  return (
    <div className="px-5 py-5 border-b border-border">
      <div className="flex flex-col items-center gap-2">
        {/* Icon mark */}
        <div className="relative w-10 h-10">
          {/* Outer ring */}
          <svg viewBox="0 0 40 40" width="40" height="40" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <linearGradient id="glassGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#00c8ff" />
                <stop offset="100%" stopColor="#1a6aff" />
              </linearGradient>
              <linearGradient id="barGrad" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="#00e5c0" />
                <stop offset="100%" stopColor="#0090ff" />
              </linearGradient>
            </defs>
            {/* Dashed orbit ring */}
            <circle cx="20" cy="20" r="18" fill="none" stroke="rgba(0,160,255,0.18)" strokeWidth="1" strokeDasharray="3 3" />
            {/* Magnifying glass circle */}
            <circle cx="17" cy="17" r="9.5" fill="none" stroke="url(#glassGrad)" strokeWidth="2.2" />
            {/* Handle */}
            <line x1="24" y1="24" x2="30" y2="30" stroke="url(#glassGrad)" strokeWidth="2.5" strokeLinecap="round" />
            {/* Bar chart inside lens */}
            <rect x="11.5" y="18" width="2.5" height="5"   rx="0.8" fill="url(#barGrad)" opacity="0.9" />
            <rect x="15.5" y="15" width="2.5" height="8"   rx="0.8" fill="url(#barGrad)" />
            <rect x="19.5" y="16.5" width="2.5" height="6.5" rx="0.8" fill="url(#barGrad)" opacity="0.85" />
            {/* Checkmark */}
            <path d="M11 17 L14 20 L20 13" fill="none" stroke="rgba(0,230,180,0.55)" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>

        {/* QIS wordmark */}
        <div className="flex flex-col items-center leading-none">
          <span
            className="font-syne font-extrabold tracking-[6px] text-[18px]"
            style={{
              background: 'linear-gradient(180deg, #c8e8ff 0%, #60b0ff 50%, #1a6aff 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
            }}
          >
            QIS
          </span>
          <span className="font-mono text-[7px] tracking-[1.8px] uppercase text-txt3 mt-1">
            Quality Intelligence System
          </span>
        </div>
      </div>
    </div>
  )
}

export default function Sidebar({ activePage, onNavigate }) {
  return (
    <aside className="fixed left-0 top-0 bottom-0 w-[220px] bg-surface border-r border-border flex flex-col z-[100]">
      <QISLogo />

      {/* Nav */}
      <nav className="flex-1 p-3">
        {NAV_ITEMS.map((item) => (
          <div key={item.id}>
            {item.section && (
              <div className="font-mono text-[9px] tracking-[1.5px] uppercase text-txt3 px-2 mt-3 mb-1.5">
                {item.section}
              </div>
            )}
            <button
              onClick={() => onNavigate(item.id)}
              className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-lg cursor-pointer text-[13.5px] mb-0.5 transition-all border text-left font-dm
                ${activePage === item.id
                  ? 'bg-gradient-to-br from-accent/18 to-accent3/8 text-txt border-accent/25 font-medium'
                  : 'bg-transparent text-txt2 border-transparent hover:bg-surface2 hover:text-txt'
                }`}
            >
              <span className="w-[18px] text-center text-[15px]">{item.icon}</span>
              {item.label}
            </button>
          </div>
        ))}
      </nav>

      {/* Footer */}
      <div className="p-4 border-t border-border">
        <div className="flex items-center gap-2.5 px-3 py-2.5 bg-surface2 rounded-lg border border-border">
          <div className="w-7 h-7 rounded-full bg-gradient-to-br from-accent to-accent3 grid place-items-center text-[11px] font-bold shrink-0">QA</div>
          <div>
            <div className="text-xs font-medium">Reviewer</div>
            <div className="font-mono text-[10px] text-txt3">QA Analyst</div>
          </div>
        </div>
      </div>
    </aside>
  )
}
