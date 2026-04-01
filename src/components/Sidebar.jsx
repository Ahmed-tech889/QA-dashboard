const NAV_ITEMS = [
  { id: 'dashboard', icon: '📊', label: 'Dashboard', section: 'Main' },
  { id: 'review', icon: '🎧', label: 'Review Call', section: null },
  { id: 'calls', icon: '📁', label: 'Call Log', section: null },
  { id: 'agents', icon: '👥', label: 'Agents', section: 'Analytics' },
  { id: 'reports', icon: '📈', label: 'Reports', section: null },
  { id: 'criteria', icon: '⚙️', label: 'QA Criteria', section: 'Config' },
]

function QISLogo({ height }) {
  return (
    <div
      className="border-b border-border relative overflow-hidden flex items-center justify-center shrink-0"
      style={{
        height,
        background: 'linear-gradient(135deg, #0d1628 0%, #111c36 60%, #0a1220 100%)',
      }}
    >
      <div
        style={{
          position: 'absolute',
          top: '-30px',
          left: '50%',
          transform: 'translateX(-50%)',
          width: '140px',
          height: '80px',
          background: 'radial-gradient(ellipse, rgba(0,120,255,0.12) 0%, transparent 70%)',
          pointerEvents: 'none',
        }}
      />

      <div className="relative flex items-center gap-3">
        <div
          style={{
            width: 34,
            height: 34,
            borderRadius: 9,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: 'linear-gradient(135deg, rgba(0,120,255,0.25) 0%, rgba(0,60,180,0.38) 100%)',
            border: '1px solid rgba(0,160,255,0.28)',
            boxShadow: '0 0 16px rgba(0,100,255,0.18)',
            flexShrink: 0,
          }}
        >
          <svg width="19" height="19" viewBox="0 0 30 30" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <linearGradient id="qis-ig" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#00e5ff" />
                <stop offset="100%" stopColor="#1a6fff" />
              </linearGradient>
              <linearGradient id="qis-bg" x1="0%" y1="100%" x2="0%" y2="0%">
                <stop offset="0%" stopColor="#1a6fff" />
                <stop offset="100%" stopColor="#00e0c0" />
              </linearGradient>
            </defs>
            <circle cx="12" cy="12" r="7.5" fill="none" stroke="url(#qis-ig)" strokeWidth="2.2" />
            <line x1="17.8" y1="17.8" x2="24" y2="24" stroke="url(#qis-ig)" strokeWidth="2.4" strokeLinecap="round" />
            <rect x="7.5"  y="14"   width="2.2" height="4"   rx="0.6" fill="url(#qis-bg)" />
            <rect x="11"   y="11"   width="2.2" height="7"   rx="0.6" fill="url(#qis-bg)" />
            <rect x="14.5" y="12.5" width="2.2" height="5.5" rx="0.6" fill="url(#qis-bg)" />
          </svg>
        </div>

        <div className="flex flex-col justify-center">
          <span
            style={{
              fontFamily: "'Poppins', sans-serif",
              fontWeight: 800,
              fontSize: 22,
              letterSpacing: 4,
              lineHeight: 1,
              background: 'linear-gradient(160deg, #ffffff 0%, #b8d8ff 40%, #5ca8ff 80%, #1a6fff 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
            }}
          >
            QIS
          </span>
          <span
            style={{
              fontFamily: "'Poppins', sans-serif",
              fontWeight: 400,
              fontSize: 6.5,
              letterSpacing: 2,
              textTransform: 'uppercase',
              color: 'rgba(140,190,255,0.45)',
              marginTop: 3,
            }}
          >
            Quality Intelligence System
          </span>
        </div>
      </div>
    </div>
  )
}

export default function Sidebar({ activePage, onNavigate, headerHeight }) {
  return (
    <aside className="fixed left-0 top-0 bottom-0 w-[220px] bg-surface border-r border-border flex flex-col z-[100]">
      <QISLogo height={headerHeight} />

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
